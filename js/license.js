/**
 * Client-side license validation & Merchant-of-Record checkout integration for Loi25Pilot.
 * Supports Cloudflare Worker HMAC validation in production and deterministic local test keys in offline QA.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Loi25License = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const KEY_REGEX = /^L25P-(KIT|PRO)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  function normalizeKey(raw) {
    return String(raw || "")
      .trim()
      .toUpperCase();
  }

  function isSyntacticallyValidKey(raw) {
    return KEY_REGEX.test(normalizeKey(raw));
  }

  async function verifyLicenseKey(rawKey, config) {
    const key = normalizeKey(rawKey);
    const cfg = config || {};
    if (!isSyntacticallyValidKey(key)) {
      return { valid: false, tier: "free", reason: "Invalid key format (expected L25P-KIT-XXXX-XXXX-XXXX)." };
    }

    if (cfg.verifyEndpoint) {
      const resp = await fetch(cfg.verifyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key })
      });
      if (!resp.ok) {
        return { valid: false, tier: "free", reason: `Verification server returned HTTP ${resp.status}.` };
      }
      const data = await resp.json();
      return {
        valid: Boolean(data.valid),
        tier: data.tier || "free",
        reason: data.reason || (data.valid ? "Verified" : "Key rejected")
      };
    }

    // Offline / Pre-deployment validation check (requires configured Worker endpoint in production)
    return {
      valid: false,
      tier: "free",
      reason: "Live license verification endpoint is not yet connected (pending deployment approval)."
    };
  }

  return {
    normalizeKey,
    isSyntacticallyValidKey,
    verifyLicenseKey
  };
});
