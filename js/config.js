/**
 * Deployment configuration for Loi25Pilot.
 * Update these values once REQ-001 (Cloudflare Worker + Creem/Polar MoR) is approved and deployed.
 */
(function (root) {
  root.Loi25Config = {
    verifyEndpoint: "",
    lookupEndpoint: "",
    checkoutUrlKit: "#pricing",
    checkoutUrlPro: "#pricing",
    demoSupportEmail: "support@example.ca"
  };
})(typeof self !== "undefined" ? self : this);
