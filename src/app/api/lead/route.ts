import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Own lead intake — a redundant backup of the primary CRM path.
 *
 * Primary path: /sos-main.js (self-hosted) intercepts
 * .request-api forms and POSTs them to MoveBoard CRM at
 * api.sosmovingla.net/server/parser/get_lead_parsing — independent of
 * Webflow. custom-scripts.js additionally beacons every submission here
 * ("dual write") so an outage of the MoveBoard API leaves an e-mail/webhook
 * trail. LEAD_MODE='takeover' would BYPASS the CRM — only for emergencies.
 *
 * Env:
 *   RESEND_API_KEY   — Resend key; without it e-mail step is skipped
 *   LEAD_TO          — notification recipient (default info@sosmovingla.net)
 *   LEAD_FROM        — verified sender, e.g. "SOS Moving <leads@sosmovingla.net>"
 *   CRM_WEBHOOK_URL  — optional; every lead is POSTed there as JSON
 */

const MAX_FIELDS = 40;
const MAX_VALUE = 2000;

// Best-effort per-IP rate limit (in-memory, per serverless instance —
// enough to blunt bursts; not a substitute for a real WAF).
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 10_000) hits.clear(); // memory guard
  return list.length > RATE_MAX;
}

function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Human labels for the known form fields; anything unknown falls back to
// a cleaned-up raw name ("some_field" → "Some Field") in labelFor().
const FIELD_LABELS: Record<string, string> = {
  field_first_name: 'Name',
  field_last_name: 'Last Name',
  field_e_mail: 'Email',
  field_phone: 'Phone',
  field_date: 'Moving Date',
  moving_from_zip: 'Moving From',
  moving_to_zip: 'Moving To',
  move_size: 'Move Size',
  company_name: 'Company',
  checkbox: 'Privacy Policy',
  page_path: 'Page URL',
};

// The form submits the <option> value — mirror the option labels from
// free-estimate.html so the e-mail shows what the visitor actually picked.
const MOVE_SIZES: Record<string, string> = {
  '0': 'Not specified',
  '1': 'Room or less',
  '2': 'Studio',
  '3': 'Small 1 Bedroom condo/aprt.',
  '4': 'Large 1 Bedroom condo/aprt.',
  '5': 'Small 2 Bedroom condo/aprt.',
  '6': 'Large 2 Bedroom condo/aprt.',
  '7': '3 Bedroom condo/aprt.',
  '8': '2 Bedroom house/townhouse',
  '9': '3 Bedroom house/townhouse',
  '10': '4 Bedroom house/townhouse',
  '11': 'Commercial Move',
};

// Contact info first, move details next, technical meta last;
// fields not listed here land between move details and meta.
const FIELD_ORDER = [
  'field_first_name',
  'field_last_name',
  'field_phone',
  'field_e_mail',
  'moving_from_zip',
  'moving_to_zip',
  'field_date',
  'move_size',
];
const FIELD_ORDER_TAIL = ['company_name', 'checkbox', 'page_path'];

function labelFor(key: string): string {
  return (
    FIELD_LABELS[key] ??
    key
      .replace(/^field_/, '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function displayValue(key: string, value: string): string {
  if (key === 'move_size') return MOVE_SIZES[value] ?? value;
  if (key === 'checkbox') return value === 'on' ? 'Agreed' : value;
  return value;
}

function sortFields(entries: [string, string][]): [string, string][] {
  const rank = (k: string) => {
    const head = FIELD_ORDER.indexOf(k);
    if (head !== -1) return head;
    const tail = FIELD_ORDER_TAIL.indexOf(k);
    if (tail !== -1) return FIELD_ORDER.length + 100 + tail;
    return FIELD_ORDER.length + 50;
  };
  return [...entries].sort((a, b) => rank(a[0]) - rank(b[0]));
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (typeof raw !== 'object' || raw === null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;
  // Webflow auto-names forms from the page heading, markup included
  // ("Form in <strong>…</strong> Page.") — strip tags for subject/body.
  const formName = (
    typeof body.formName === 'string' ? body.formName.slice(0, 200) : 'Unknown form'
  )
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'Unknown form';
  const page = typeof body.page === 'string' ? body.page.slice(0, 300) : '';
  const fieldsRaw =
    typeof body.fields === 'object' && body.fields !== null
      ? (body.fields as Record<string, unknown>)
      : {};

  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(fieldsRaw).slice(0, MAX_FIELDS)) {
    if (typeof v !== 'string' || !v.trim()) continue;
    fields[k.slice(0, 100)] = v.trim().slice(0, MAX_VALUE);
  }
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'Empty lead' }, { status: 400 });
  }

  // Bot tripped the invisible trap (custom-scripts.js) — log for
  // false-positive monitoring, skip e-mail/CRM entirely.
  if (formName === 'HONEYPOT' || fields.contact_preference) {
    console.warn('[api/lead] HONEYPOT hit:', ip, page, fields.trap ?? fields.contact_preference ?? '');
    return NextResponse.json({ ok: true, skipped: 'honeypot' });
  }

  const results: Record<string, string> = {};

  // 1. CRM webhook (if configured)
  const webhook = process.env.CRM_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'sosmovingla.net', formName, page, fields }),
      });
      results.crm = res.ok ? 'ok' : `http ${res.status}`;
    } catch (e) {
      results.crm = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }
  }

  // 2. E-mail notification via Resend
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    // Comma-separated list supported. NOTE: extra recipients beyond the
    // Resend account owner only work once the domain is verified in
    // Resend and LEAD_FROM uses it.
    const to = (process.env.LEAD_TO ?? 'info@sosmovingla.net')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const from = process.env.LEAD_FROM ?? 'SOS Moving Leads <onboarding@resend.dev>';
    const rows = sortFields(Object.entries(fields))
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${esc(labelFor(k))}</td>` +
          `<td style="padding:6px 0;color:#111827">${esc(displayValue(k, v))}</td></tr>`,
      )
      .join('');
    // The form name already lives in the subject — the body keeps only
    // the page and the fields.
    const html =
      `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827;max-width:560px">` +
      (page ? `<p style="margin:0 0 16px;color:#6b7280">Page: ${esc(page)}</p>` : '') +
      `<table style="border-collapse:collapse">${rows}</table>` +
      `</div>`;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject: `New lead: ${formName}${page ? ` (${page})` : ''}`,
          html,
        }),
      });
      results.email = res.ok ? 'ok' : `http ${res.status}`;
    } catch (e) {
      results.email = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }
  }

  if (!webhook && !apiKey) {
    // Nothing configured yet — accept silently so dual-write beacons don't
    // error in the browser console, but make the gap visible in logs.
    console.warn('[api/lead] neither CRM_WEBHOOK_URL nor RESEND_API_KEY configured — lead dropped:', formName);
    return NextResponse.json({ ok: false, reason: 'not configured' }, { status: 202 });
  }

  console.log('[api/lead]', formName, page, results);
  return NextResponse.json({ ok: true, results });
}
