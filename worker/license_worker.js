/**
 * Cloudflare Worker ($0/mo free tier) for Loi25Pilot Merchant-of-Record (Creem / Polar.sh)
 * webhook fulfillment & license verification.
 *
 * Bindings required on deploy:
 * - KV Namespace: LICENSES_KV
 * - Secrets: CREEM_WEBHOOK_SECRET, POLAR_WEBHOOK_SECRET, LICENSE_SIGNING_SECRET
 */

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function generateLicenseKey(tierPrefix) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randBytes = new Uint8Array(12);
  crypto.getRandomValues(randBytes);
  const seg = (start) =>
    Array.from(randBytes.slice(start, start + 4))
      .map((b) => chars[b % chars.length])
      .join("");
  return `L25P-${tierPrefix}-${seg(0)}-${seg(4)}-${seg(8)}`;
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return jsonResponse({ ok: true }, 204);
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/lookup-session" && request.method === "GET") {
      const checkoutId = (url.searchParams.get("checkout_id") || "").trim();
      if (!checkoutId) return jsonResponse({ reason: "Missing checkout_id" }, 400);
      const raw = await env.LICENSES_KV.get(`session:${checkoutId}`);
      if (!raw) return jsonResponse({ reason: "Checkout session not found yet" }, 404);
      return jsonResponse(JSON.parse(raw));
    }

    if (url.pathname === "/api/verify-license" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const key = String(body.licenseKey || "").trim().toUpperCase();
      if (!key) return jsonResponse({ valid: false, reason: "Missing licenseKey" }, 400);

      const recordRaw = await env.LICENSES_KV.get(`key:${key}`);
      if (!recordRaw) {
        return jsonResponse({ valid: false, tier: "free", reason: "License key not found" }, 404);
      }
      const record = JSON.parse(recordRaw);
      if (record.status !== "active") {
        return jsonResponse({ valid: false, tier: "free", reason: `License status: ${record.status}` }, 403);
      }
      return jsonResponse({ valid: true, tier: record.tier, reason: "Active license verified" });
    }

    if (url.pathname === "/api/webhooks/mor" && request.method === "POST") {
      const rawBody = await request.text();
      const sig = request.headers.get("creem-signature") || request.headers.get("webhook-signature") || "";
      const secret = env.CREEM_WEBHOOK_SECRET || env.POLAR_WEBHOOK_SECRET;
      if (!secret) return jsonResponse({ error: "Webhook secret not configured" }, 500);

      const expected = await hmacHex(secret, rawBody);
      if (!timingSafeEqualHex(sig.toLowerCase(), expected.toLowerCase())) {
        return jsonResponse({ error: "Invalid signature" }, 401);
      }

      const event = JSON.parse(rawBody);
      const eventType = event.eventType || event.type || "";
      const tier = String(event.product?.name || "").toLowerCase().includes("pro") ? "PRO" : "KIT";
      const customerEmail = event.customer?.email || event.data?.customer_email || "";
      const checkoutId = event.checkout_id || event.id || event.data?.checkout_id || event.data?.id || "";

      if (eventType.includes("completed") || eventType.includes("active") || eventType.includes("paid")) {
        const key = generateLicenseKey(tier);
        await env.LICENSES_KV.put(
          `key:${key}`,
          JSON.stringify({
            status: "active",
            tier: tier.toLowerCase(),
            email: customerEmail,
            createdAt: new Date().toISOString()
          })
        );
        if (checkoutId) {
          await env.LICENSES_KV.put(
            `session:${checkoutId}`,
            JSON.stringify({ licenseKey: key, tier: tier.toLowerCase() }),
            { expirationTtl: 86400 }
          );
        }
        return jsonResponse({ ok: true, issuedKey: key });
      }

      if (eventType.includes("refunded") || eventType.includes("canceled") || eventType.includes("revoked")) {
        const key = event.licenseKey || event.data?.license_key;
        if (key) {
          const existing = await env.LICENSES_KV.get(`key:${key}`);
          if (existing) {
            const parsed = JSON.parse(existing);
            parsed.status = "revoked";
            await env.LICENSES_KV.put(`key:${key}`, JSON.stringify(parsed));
          }
        }
        return jsonResponse({ ok: true, revoked: true });
      }

      return jsonResponse({ ok: true, ignored: eventType });
    }

    return jsonResponse({ error: "Not found" }, 404);
  }
};
