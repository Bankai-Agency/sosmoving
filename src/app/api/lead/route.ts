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
    const rows = Object.entries(fields)
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0"><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`)
      .join('');
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
          html: `<h2>${esc(formName)}</h2><p>Page: ${esc(page)}</p><table>${rows}</table>`,
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
