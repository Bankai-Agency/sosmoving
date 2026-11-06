import type { NextRequest } from "next/server";

/**
 * Google tag gateway for advertisers, manual setup: every request to
 * /k7rq/* is proxied to the container's gateway host, so the Google tag
 * (gtm.js, gtag.js and the GA4 / Ads measurement hits that follow) is served
 * from the site's own domain instead of googletagmanager.com.
 *
 * What Google's "Other" instructions ask for and how it maps here:
 *   - path rule /k7rq/* → origin gtm-5qss53c9.fps.goog, the measurement path
 *     stays in the forwarded URL (/k7rq/healthy upstream, not /healthy);
 *   - Host = the origin (fetch does that), cookies and the query string
 *     forwarded as-is;
 *   - the visitor's country and region as X-Forwarded-Country / -Region /
 *     -CountryRegion, taken from the x-vercel-ip-* headers Vercel adds -
 *     this is what /k7rq/?validate_geo=healthy checks;
 *   - no X-Gtg-Tag-Id: the tag id is already in the host and Google rejects
 *     both at once;
 *   - nothing cached on our side (Vercel-CDN-Cache-Control: no-store, which
 *     Vercel strips before the browser, so the browser still honours the
 *     cache-control Google sends with gtm.js).
 * The visitor's IP goes along as X-Forwarded-For, like Google's own
 * Cloudflare snippet does. The <noscript> iframe stays on googletagmanager.com:
 * the gateway does not serve it.
 *
 * A route handler rather than a next.config rewrite because a rewrite cannot
 * add the geo headers. Health checks: /k7rq/healthy and
 * /k7rq/?validate_geo=healthy, both must answer "ok" (the second only on
 * Vercel, local runs have no geo headers).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const UPSTREAM = "https://gtm-5qss53c9.fps.goog";

// Hop-by-hop and platform headers that must not travel upstream.
const DROP_REQUEST = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "keep-alive",
  "upgrade",
  "te",
  "trailer",
  "expect",
  "accept-encoding", // fetch negotiates its own and decompresses
  "forwarded",
  "x-real-ip",
  "x-gtg-tag-id",
]);
const DROP_REQUEST_PREFIX = ["x-vercel-", "x-forwarded-", "x-middleware-", "x-invoke-", "x-matched-", "proxy-"];
const DROP_RESPONSE = new Set(["content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive"]);

function upstreamHeaders(req: NextRequest): Headers {
  const out = new Headers();
  req.headers.forEach((value, name) => {
    const n = name.toLowerCase();
    if (DROP_REQUEST.has(n) || DROP_REQUEST_PREFIX.some((p) => n.startsWith(p))) return;
    out.append(name, value);
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim();
  if (ip) out.set("X-Forwarded-For", ip);

  const country = req.headers.get("x-vercel-ip-country")?.trim();
  const region = req.headers.get("x-vercel-ip-country-region")?.trim();
  if (country) {
    out.set("X-Forwarded-Country", country);
    if (region) {
      out.set("X-Forwarded-Region", region);
      out.set("X-Forwarded-CountryRegion", `${country}-${region}`);
    }
  }
  const lat = req.headers.get("x-vercel-ip-latitude");
  const lon = req.headers.get("x-vercel-ip-longitude");
  const city = req.headers.get("x-vercel-ip-city");
  if (lat && lon) {
    let geo = `latlong=${lat},${lon}`;
    if (city) {
      try {
        geo += `;city=${decodeURIComponent(city)}`;
      } catch {
        /* keep latlong only */
      }
    }
    out.set("X-Forwarded-Geolocation", geo);
  }
  return out;
}

async function proxy(req: NextRequest): Promise<Response> {
  // The raw URL keeps the trailing slash Google's snippet uses (/k7rq/?id=…).
  const { pathname, search } = new URL(req.url);
  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM + pathname + search, {
      method,
      headers: upstreamHeaders(req),
      body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    console.error("[k7rq] upstream failed:", err instanceof Error ? err.message : err);
    return new Response("gateway upstream unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store" },
    });
  }

  const headers = new Headers();
  upstream.headers.forEach((value, name) => {
    if (!DROP_RESPONSE.has(name.toLowerCase()) && name.toLowerCase() !== "set-cookie") headers.append(name, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) headers.append("Set-Cookie", cookie);
  headers.set("Vercel-CDN-Cache-Control", "no-store");

  return new Response(method === "HEAD" ? null : upstream.body, { status: upstream.status, headers });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as OPTIONS, proxy as HEAD };
