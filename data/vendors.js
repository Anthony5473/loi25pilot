/**
 * Curated SaaS Subprocessor & Cross-Border Transfer Risk Library for Quebec Law 25 (Sec. 17).
 * Note: Hosting regions reflect common default commercial deployments; businesses must confirm
 * their specific tenant/data-residency settings and DPA with each vendor.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Loi25Vendors = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const VENDORS = [
    {
      id: "google-workspace",
      name: "Google Workspace",
      category: "Productivity & Email",
      defaultRegion: "United States / Global (configurable Data Regions on Enterprise)",
      outsideQuebec: true,
      riskLevel: "Medium",
      dpaAvailable: true,
      dataTypes: ["Name", "Email", "Business communications", "Attachments"],
      mitigations: [
        "Enable 2FA / SSO and enforce organization-wide encryption.",
        "Execute Google Cloud Data Processing Addendum (CDPA) with Standard Contractual Clauses.",
        "Restrict Google Drive external link sharing by default (privacy-by-default)."
      ]
    },
    {
      id: "microsoft-365",
      name: "Microsoft 365 / Azure",
      category: "Productivity & Cloud",
      defaultRegion: "Canada (Central/East) if Canadian tenant configured; US fallback for some telemetry",
      outsideQuebec: true,
      riskLevel: "Low-Medium",
      dpaAvailable: true,
      dataTypes: ["Name", "Email", "Documents", "Authentication logs"],
      mitigations: [
        "Verify Microsoft 365 tenant residency is pinned to Canada Central (Toronto) / Canada East (Quebec City).",
        "Review Microsoft Products and Services Data Protection Addendum (DPA).",
        "Configure retention & auto-deletion policies in Microsoft Purview."
      ]
    },
    {
      id: "stripe",
      name: "Stripe",
      category: "Payments & Billing",
      defaultRegion: "United States / Global PCI-DSS infrastructure",
      outsideQuebec: true,
      riskLevel: "Medium",
      dpaAvailable: true,
      dataTypes: ["Billing name", "Email", "Address", "Payment metadata", "IP address"],
      mitigations: [
        "Use Stripe Elements/Checkout so raw card PANs never touch your own servers.",
        "Incorporate Stripe Data Processing Agreement and document US transfer proportionality.",
        "Minimize metadata fields attached to Stripe Customer objects."
      ]
    },
    {
      id: "shopify",
      name: "Shopify",
      category: "E-Commerce Platform",
      defaultRegion: "United States / Global CDN (Canadian HQ, US/global cloud storage)",
      outsideQuebec: true,
      riskLevel: "Medium",
      dpaAvailable: true,
      dataTypes: ["Customer name", "Shipping address", "Email", "Phone", "Order history"],
      mitigations: [
        "Audit installed third-party Shopify apps and remove unused app permissions.",
        "Enable Shopify Customer Privacy / Consent banner for Quebec visitors.",
        "Reference Shopify Data Processing Addendum for cross-border processing."
      ]
    },
    {
      id: "hubspot",
      name: "HubSpot CRM",
      category: "CRM & Marketing",
      defaultRegion: "United States (AWS US-East default unless EU data center selected)",
      outsideQuebec: true,
      riskLevel: "High",
      dpaAvailable: true,
      dataTypes: ["Lead contact details", "Behavioral tracking", "Email engagement", "Notes"],
      mitigations: [
        "Disable non-essential behavioral tracking cookies prior to explicit opt-in consent.",
        "Execute HubSpot DPA and restrict sensitive personal data from free-text CRM notes.",
        "Configure automated inactive-lead purge schedules to satisfy Law 25 retention limits."
      ]
    },
    {
      id: "mailchimp",
      name: "Mailchimp (Intuit)",
      category: "Email Marketing",
      defaultRegion: "United States",
      outsideQuebec: true,
      riskLevel: "High",
      dpaAvailable: true,
      dataTypes: ["Subscriber email", "Name", "Open/click analytics", "IP location"],
      mitigations: [
        "Verify both CASL express consent and Law 25 opt-in consent prior to list import.",
        "Disable open/click pixel tracking if not strictly disclosed in Privacy Policy.",
        "Execute Intuit/Mailchimp DPA covering out-of-Quebec transfers."
      ]
    },
    {
      id: "openai-api",
      name: "OpenAI API / ChatGPT Enterprise",
      category: "AI & Automation",
      defaultRegion: "United States",
      outsideQuebec: true,
      riskLevel: "High",
      dpaAvailable: true,
      dataTypes: ["Prompt payloads", "Customer support text", "Uploaded documents"],
      mitigations: [
        "Use Zero-Data-Retention / API endpoints with training opt-out enabled (never consumer free tier).",
        "Redact or pseudonymize SINs, financial IDs, and direct identifiers before API transmission.",
        "Disclose automated decision-making / profiling under Law 25 Sec. 12.1 if used to evaluate individuals."
      ]
    },
    {
      id: "aws-us",
      name: "Amazon Web Services (US Regions)",
      category: "Cloud Hosting",
      defaultRegion: "United States (us-east-1 / us-west-2)",
      outsideQuebec: true,
      riskLevel: "Medium-High",
      dpaAvailable: true,
      dataTypes: ["Application databases", "Backups", "Server access logs"],
      mitigations: [
        "Migrate production databases to AWS ca-central-1 (Montreal) where feasible to keep primary storage inside Quebec.",
        "Enforce KMS encryption at rest and TLS 1.2+ in transit.",
        "Accept AWS GDPR/Canadian DPA and document US backup/support access in PIA."
      ]
    },
    {
      id: "aws-ca-central",
      name: "AWS Canada Central (Montreal)",
      category: "Cloud Hosting",
      defaultRegion: "Quebec, Canada (ca-central-1 — Montreal)",
      outsideQuebec: false,
      riskLevel: "Low",
      dpaAvailable: true,
      dataTypes: ["Application databases", "Object storage", "Backups"],
      mitigations: [
        "Verify S3 replication, CloudFront logs, and SES/support tools do not spill outside Canada.",
        "Enforce IAM least-privilege and KMS key rotation."
      ]
    },
    {
      id: "cloudflare",
      name: "Cloudflare (CDN / Workers / Pages)",
      category: "Edge Network & Security",
      defaultRegion: "Global Anycast Edge (US corporate entity)",
      outsideQuebec: true,
      riskLevel: "Low-Medium",
      dpaAvailable: true,
      dataTypes: ["Client IP addresses", "HTTP request headers", "TLS metadata"],
      mitigations: [
        "Enable IP anonymization / short log retention windows.",
        "Use Cloudflare Data Localization Suite or minimize PII in Workers KV/logs.",
        "Execute Cloudflare Standard DPA."
      ]
    },
    {
      id: "quickbooks-online",
      name: "QuickBooks Online Canada (Intuit)",
      category: "Accounting & Payroll",
      defaultRegion: "United States / Global Cloud",
      outsideQuebec: true,
      riskLevel: "Medium-High",
      dpaAvailable: true,
      dataTypes: ["Client billing info", "Vendor T4A details", "Employee payroll & SIN (if payroll enabled)"],
      mitigations: [
        "Restrict bookkeeper/accountant access via role-based permissions and MFA.",
        "Document cross-border storage of sensitive financial/payroll records in Section 17 assessment."
      ]
    },
    {
      id: "slack",
      name: "Slack (Salesforce)",
      category: "Team Messaging",
      defaultRegion: "United States (default) / Canada data residency on Enterprise Grid",
      outsideQuebec: true,
      riskLevel: "Medium",
      dpaAvailable: true,
      dataTypes: ["Internal messages", "Customer support escalations", "Shared files"],
      mitigations: [
        "Establish internal policy prohibiting posting SINs, health info, or raw customer PII in channels.",
        "Configure message retention limits and enforce SSO/2FA."
      ]
    },
    {
      id: "ga4",
      name: "Google Analytics 4",
      category: "Web Analytics",
      defaultRegion: "United States / Global",
      outsideQuebec: true,
      riskLevel: "High",
      dpaAvailable: true,
      dataTypes: ["Device identifiers", "Behavioral events", "Approximate geolocation", "User IDs"],
      mitigations: [
        "CRITICAL under Law 25: Block GA4 firing until the user gives explicit opt-in cookie consent (privacy-by-default).",
        "Disable Google Signals and advertising personalization features.",
        "Set event data retention to minimum (2 months)."
      ]
    },
    {
      id: "meta-pixel",
      name: "Meta Pixel / Conversions API",
      category: "Ad Tracking",
      defaultRegion: "United States / Global",
      outsideQuebec: true,
      riskLevel: "High",
      dpaAvailable: false,
      dataTypes: ["Hashed emails", "Browsing behavior", "IP address", "Device fingerprint"],
      mitigations: [
        "CRITICAL under Law 25: Must be disabled by default; fire ONLY after explicit affirmative consent.",
        "Disclose third-party ad network sharing clearly in your cookie banner and Privacy Policy."
      ]
    },
    {
      id: "github",
      name: "GitHub",
      category: "Code & CI/CD",
      defaultRegion: "United States",
      outsideQuebec: true,
      riskLevel: "Low",
      dpaAvailable: true,
      dataTypes: ["Developer identities", "Audit logs", "Potential test fixtures"],
      mitigations: [
        "Never store production personal data or customer database dumps in repositories or CI artifacts.",
        "Enable secret scanning and branch protection."
      ]
    },
    {
      id: "notion",
      name: "Notion",
      category: "Internal Wiki & Docs",
      defaultRegion: "United States",
      outsideQuebec: true,
      riskLevel: "Medium",
      dpaAvailable: true,
      dataTypes: ["Internal SOPs", "Meeting notes", "HR/candidate notes if tracked"],
      mitigations: [
        "Avoid storing sensitive HR, medical, or customer PII in unencrypted workspace pages.",
        "Review Notion DPA and enforce workspace member offboarding."
      ]
    }
  ];

  return { VENDORS };
});
