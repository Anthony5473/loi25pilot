/**
 * Deterministic Quebec Law 25 Compliance & 7-Section PIA (EFVP) Document Engine.
 * Works identically in browser and Node.js for automated testing.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../data/vendors.js"));
  } else {
    root.Loi25Engine = factory(root.Loi25Vendors);
  }
})(typeof self !== "undefined" ? self : this, function (vendorLib) {
  const RISK_WEIGHTS = {
    Low: 5,
    "Low-Medium": 10,
    Medium: 16,
    "Medium-High": 22,
    High: 28
  };

  function getVendorCatalog() {
    return (vendorLib && vendorLib.VENDORS) || [];
  }

  function evaluateVendorStack(selectedIds, extraFlags) {
    const catalog = getVendorCatalog();
    const selectedSet = new Set(selectedIds || []);
    const selectedVendors = catalog.filter((v) => selectedSet.has(v.id));
    const flags = extraFlags || {};

    let rawScore = 0;
    let outOfQuebecCount = 0;
    let missingDpaCount = 0;
    const criticalFindings = [];

    for (const v of selectedVendors) {
      rawScore += RISK_WEIGHTS[v.riskLevel] || 15;
      if (v.outsideQuebec) {
        outOfQuebecCount += 1;
      }
      if (!v.dpaAvailable) {
        missingDpaCount += 1;
        criticalFindings.push(
          `${v.name}: No standard DPA confirmed — review contractual privacy safeguards before transferring Quebec personal info.`
        );
      }
      if (v.id === "ga4" || v.id === "meta-pixel") {
        criticalFindings.push(
          `${v.name}: Tracking technology must be disabled by default until affirmative opt-in consent (Law 25 Sec. 9.1).`
        );
      }
      if (v.id === "openai-api") {
        criticalFindings.push(
          `${v.name}: Enforce Zero-Data-Retention API mode and disclose AI/automated decision use if applicable (Sec. 12.1).`
        );
      }
    }

    if (flags.sensitiveData) {
      rawScore += 20;
      criticalFindings.push(
        "Sensitive personal information (financial, health, biometric, or SIN) requires heightened encryption, strict RBAC, and explicit consent."
      );
    }
    if (flags.automatedDecisions) {
      rawScore += 15;
      criticalFindings.push(
        "Automated decision-making triggers Law 25 Sec. 12.1 transparency, explanation, and human review rights."
      );
    }
    if (flags.noPrivacyOfficer) {
      rawScore += 15;
      criticalFindings.push(
        "No designated Privacy Officer (RPRP) published: under Law 25, the highest-ranking corporate officer is liable by default and their contact info must be published on your website."
      );
    }

    const score = Math.min(100, rawScore);
    let tier = "Low";
    if (score >= 65) tier = "High";
    else if (score >= 30) tier = "Moderate";

    return {
      score,
      tier,
      selectedVendors,
      outOfQuebecCount,
      missingDpaCount,
      piaRequiredUnderSec17: outOfQuebecCount > 0,
      criticalFindings
    };
  }

  function sanitizeInput(value, fallback) {
    const str = String(value || "").trim();
    return str.length > 0 ? str : fallback;
  }

  function buildPiaDocument(formInput, evalResult, options) {
    const opts = options || {};
    const lang = opts.lang === "fr" ? "fr" : "en";
    const watermarked = Boolean(opts.watermarked);
    const today = new Date().toISOString().slice(0, 10);

    const orgName = sanitizeInput(formInput.orgName, "[Organization Legal Name]");
    const projectName = sanitizeInput(formInput.projectName, "[Digital System / SaaS Rollout]");
    const rprpName = sanitizeInput(formInput.rprpName, "[Privacy Officer / RPRP Name]");
    const rprpEmail = sanitizeInput(formInput.rprpEmail, "privacy@example.ca");
    const jurisdiction = sanitizeInput(formInput.jurisdiction, "Quebec / Canada");
    const purpose = sanitizeInput(
      formInput.purpose,
      "Customer onboarding, billing, communications, and service delivery."
    );
    const retentionPeriod = sanitizeInput(
      formInput.retentionPeriod,
      "3 years after account closure (or 7 years where required by CRA/Revenu Quebec tax law)"
    );
    const dataSubjects = sanitizeInput(
      formInput.dataSubjects,
      "Customers, website visitors, and business contacts residing in Quebec and Canada"
    );
    const dataElements = sanitizeInput(
      formInput.dataElements,
      "Full name, email address, phone number, billing address, IP address, and transaction metadata"
    );

    const vendors = (evalResult && evalResult.selectedVendors) || [];
    const vendorNames = vendors.length
      ? vendors.map((v) => `${v.name} (${v.defaultRegion})`).join("; ")
      : "No external SaaS subprocessors selected";

    const mitigationsList = [];
    for (const v of vendors) {
      for (const m of v.mitigations) {
        mitigationsList.push(`[${v.name}] ${m}`);
      }
    }
    if (mitigationsList.length === 0) {
      mitigationsList.push(
        "Enforce MFA, TLS 1.2+ encryption in transit, AES-256 encryption at rest, and annual access reviews."
      );
    }

    const title =
      lang === "fr"
        ? `ÉVALUATION DES FACTEURS RELATIFS À LA VIE PRIVÉE (ÉFVP) — LOI 25 DU QUÉBEC`
        : `QUEBEC LAW 25 PRIVACY IMPACT ASSESSMENT (PIA / ÉFVP)`;

    const watermarkNote = watermarked
      ? lang === "fr"
        ? "APERÇU GRATUIT FILIGRANÉ — DÉVERROUILLEZ LA VERSION FINALE SANS FILIGRANE AVEC UNE CLÉ DE LICENCE LOI25PILOT"
        : "FREE WATERMARKED PREVIEW — UNLOCK FINAL AUDIT-READY EXPORT WITH A LOI25PILOT LICENSE KEY"
      : lang === "fr"
        ? "Document de conformité généré par Loi25Pilot — Aligné sur le cadre d'ÉFVP de la CAI (Ne constitue pas un avis juridique)."
        : "Compliance Documentation Generated by Loi25Pilot — Aligned with Quebec CAI PIA Guidelines (Not Legal Advice).";

    const sections =
      lang === "fr"
        ? [
            {
              heading: "1. Présentation du projet, contexte et Responsable (RPRP)",
              paragraphs: [
                `Organisation : ${orgName} (Juridiction principale : ${jurisdiction})`,
                `Projet / Système évalué : ${projectName}`,
                `Responsable de la protection des renseignements personnels (RPRP) : ${rprpName} (${rprpEmail})`,
                `Date d'évaluation : ${today}`,
                `Finalité du traitement : ${purpose}`,
                `Déclencheur légal (Loi 25) : Article 3.3 (acquisition/refonte de système électronique) et Article 17 (${evalResult.outOfQuebecCount} transfert(s) hors Québec identifié(s)).`
              ]
            },
            {
              heading: "2. Inventaire des renseignements personnels et proportionnalité",
              paragraphs: [
                `Catégories de personnes concernées : ${dataSubjects}`,
                `Éléments de renseignements personnels recueillis : ${dataElements}`,
                `Données sensibles ou profilage : ${formInput.sensitiveData ? "OUI — mesures renforcées et consentement exprès requis." : "NON — données d'identification et de facturation standards."}`,
                `Test de nécessité et de proportionnalité : Seules les données strictement nécessaires à la finalité déclarée sont collectées. Les champs optionnels sont désactivés par défaut.`
              ]
            },
            {
              heading: "3. Cycle de vie, flux de données et transferts hors Québec (Art. 17)",
              paragraphs: [
                `Fournisseurs et sous-traitants infonuagiques sélectionnés : ${vendorNames}`,
                `Score de risque transfrontalier calculé : ${evalResult.score}/100 (Niveau : ${evalResult.tier}).`,
                `Analyse Article 17 : Les fournisseurs situés aux États-Unis ou hors Québec sont assujettis à des ententes de traitement des données (DPA), au chiffrement en transit/au repos et au principe de minimisation avant communication.`
              ]
            },
            {
              heading: "4. Conformité légale Loi 25 et confidentialité par défaut",
              paragraphs: [
                `Consentement et transparence (Art. 8–14) : Politique de confidentialité claire publiée, consentement distinct pour les fins secondaires et témoins non essentiels bloqués par défaut.`,
                `Décision automatisée (Art. 12.1) : ${formInput.automatedDecisions ? "ACTIVE — divulgation obligatoire, droit d'accès aux paramètres principaux et révision humaine disponibles." : "Aucune décision exclusivement automatisée produisant un effet juridique ou significatif."}`,
                `Conservation et destruction (Art. 23) : ${retentionPeriod}, suivie de la destruction sécurisée ou de l'anonymisation irréversible.`
              ]
            },
            {
              heading: "5. Matrice d'évaluation des risques et menaces",
              paragraphs: [
                `Risque 1 — Accès gouvernemental étranger / transfert hors Québec : Probabilité modérée, Impact modéré -> Atténué par DPA, chiffrement et minimisation.`,
                `Risque 2 — Fuite ou incident de confidentialité chez un sous-traitant : Probabilité faible-modérée, Impact élevé -> Atténué par MFA, moindre privilège et registre d'incidents (Art. 3.5).`,
                `Risque 3 — Collecte excessive ou témoins activés sans consentement : Probabilité modérée sans blocage technique -> Atténué par bandeau de consentement conforme.`,
                ...(evalResult.criticalFindings.length
                  ? evalResult.criticalFindings.map((f) => `Constat prioritaire : ${f}`)
                  : ["Aucun constat critique additionnel signalé."])
              ]
            },
            {
              heading: "6. Mesures de sécurité techniques, contractuelles et organisationnelles",
              paragraphs: mitigationsList
            },
            {
              heading: "7. Décision du RPRP, approbation et calendrier de révision",
              paragraphs: [
                `Statut recommandé : ${evalResult.score >= 65 ? "APPROUVÉ SOUS CONDITION (corriger les constats prioritaires avant mise en production)" : "APPROUVÉ AVEC MESURES DE SÉCURITÉ DOCUMENTÉES"}.`,
                `Prochaine révision obligatoire : ${new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)} (ou immédiatement lors de l'ajout d'un nouveau sous-traitant hors Québec).`,
                `Signature du RPRP : _______________________________   Date : _______________`
              ]
            }
          ]
        : [
            {
              heading: "1. Project Overview, Business Context & Privacy Officer (RPRP)",
              paragraphs: [
                `Organization: ${orgName} (Primary Jurisdiction: ${jurisdiction})`,
                `System / Project Evaluated: ${projectName}`,
                `Designated Privacy Officer (RPRP): ${rprpName} (${rprpEmail})`,
                `Assessment Date: ${today}`,
                `Business Purpose: ${purpose}`,
                `Law 25 Statutory Trigger: Section 3.3 (acquisition, development, or overhaul of an electronic information system) and Section 17 (${evalResult.outOfQuebecCount} out-of-Quebec subprocessor transfer(s) identified).`
              ]
            },
            {
              heading: "2. Personal Information Inventory & Proportionality Test",
              paragraphs: [
                `Categories of Data Subjects: ${dataSubjects}`,
                `Personal Information Elements Collected: ${dataElements}`,
                `Sensitive Information / Profiling: ${formInput.sensitiveData ? "YES — heightened safeguards, strict access controls, and express opt-in consent required." : "NO — standard business contact, account, and billing metadata only."}`,
                `Necessity & Proportionality Assessment: Collection is strictly limited to attributes required to fulfill the stated purpose. Optional tracking fields are disabled by default (Law 25 Sec. 9.1 privacy-by-default).`
              ]
            },
            {
              heading: "3. Data Lifecycle & Out-of-Quebec Transfers (Section 17)",
              paragraphs: [
                `Selected Cloud Vendors / Subprocessors: ${vendorNames}`,
                `Computed Cross-Border Risk Score: ${evalResult.score}/100 (Risk Tier: ${evalResult.tier}).`,
                `Section 17 Adequacy & Equivalence Analysis: Personal information disclosed outside Quebec (primarily to United States cloud regions) is governed by executed Data Processing Addenda (DPAs), encryption in transit and at rest, and strict data minimization.`
              ]
            },
            {
              heading: "4. Law 25 Statutory Compliance & Privacy-by-Default Checklist",
              paragraphs: [
                `Transparency & Consent (Sec. 8–14): Clear plain-language Privacy Policy published; separate affirmative opt-in collected for secondary marketing and non-essential analytics cookies.`,
                `Automated Decision-Making (Sec. 12.1): ${formInput.automatedDecisions ? "ACTIVE — individuals are notified when automated processing makes decisions, informed of principal parameters, and granted human review rights." : "Not applicable — no exclusively automated decisions producing legal or significant effects."}`,
                `Retention & Destruction (Sec. 23): Retained for ${retentionPeriod}, followed by secure cryptographic erasure or irreversible anonymization.`
              ]
            },
            {
              heading: "5. Threat, Vulnerability & Risk Scoring Matrix",
              paragraphs: [
                `Risk 1 — Foreign Compelled Access / Out-of-Quebec Transfer Exposure: Likelihood Moderate | Impact Moderate -> Mitigated via contractual DPAs, TLS/AES-256 encryption, and payload minimization.`,
                `Risk 2 — Subprocessor Data Breach or Unauthorized Access: Likelihood Low-Moderate | Impact High -> Mitigated via enforced MFA/SSO, least-privilege IAM, and Law 25 Confidentiality Incident Response Plan.`,
                `Risk 3 — Non-Essential Tracking Prior to Consent: Likelihood Moderate without technical blocking -> Mitigated via opt-in consent banner gating analytics/pixels.`,
                ...(evalResult.criticalFindings.length
                  ? evalResult.criticalFindings.map((f) => `Priority Action Item: ${f}`)
                  : ["No additional critical flags detected."])
              ]
            },
            {
              heading: "6. Proportionate Technical, Contractual & Organizational Safeguards",
              paragraphs: mitigationsList
            },
            {
              heading: "7. Privacy Officer (RPRP) Sign-Off & Review Schedule",
              paragraphs: [
                `Recommended Disposition: ${evalResult.score >= 65 ? "CONDITIONALLY APPROVED (Resolve critical action items prior to go-live)" : "APPROVED WITH DOCUMENTED SAFEGUARDS"}.`,
                `Next Scheduled Annual Review: ${new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)} (or earlier if adding a new out-of-Quebec vendor or modifying personal data flows).`,
                `Privacy Officer (RPRP) Signature: _______________________________   Date: _______________`
              ]
            }
          ];

    return {
      title,
      subtitle: `${orgName} — ${projectName}`,
      watermarkNote,
      watermarked,
      generatedDate: today,
      lang,
      sections
    };
  }

  function buildIncidentRegisterCsv() {
    const headers = [
      "Incident_ID",
      "Date_Occurred",
      "Date_Discovered",
      "System_or_Vendor_Involved",
      "Description_of_Incident",
      "Personal_Info_Categories_Affected",
      "Estimated_Individuals_Affected",
      "Risk_of_Serious_Injury_Assessment",
      "CAI_Notification_Required_Yes_No",
      "Date_CAI_Notified",
      "Date_Individuals_Notified",
      "Containment_and_Mitigation_Actions",
      "Privacy_Officer_RPRP_SignOff"
    ];
    const sampleRow = [
      "INC-2026-001-SAMPLE",
      "2026-01-15",
      "2026-01-15",
      "Example SaaS CRM",
      "SAMPLE ENTRY (replace with real incidents): Unauthorized export detected and session revoked within 20 minutes.",
      "Name; Business Email",
      "0",
      "Low — encrypted data, token revoked prior to exfiltration, no sensitive financial/health data.",
      "No",
      "N/A",
      "N/A",
      "Revoked API token; enforced MFA; rotated secrets.",
      "Privacy Officer"
    ];
    const escapeCsv = (val) => `"${String(val).replace(/"/g, '""')}"`;
    return [headers.map(escapeCsv).join(","), sampleRow.map(escapeCsv).join(",")].join("\r\n");
  }

  function buildGovernancePackMarkdown(formInput, evalResult) {
    const orgName = sanitizeInput(formInput.orgName, "[Organization Legal Name]");
    const rprpName = sanitizeInput(formInput.rprpName, "[Privacy Officer Name]");
    const rprpEmail = sanitizeInput(formInput.rprpEmail, "privacy@example.ca");
    const today = new Date().toISOString().slice(0, 10);
    const vendors = (evalResult && evalResult.selectedVendors) || [];

    return [
      `# Law 25 Governance & Website Privacy Pack — ${orgName}`,
      `Effective Date: ${today}`,
      `> Note: Template documentation generated by Loi25Pilot. Review with qualified Quebec counsel as needed.`,
      ``,
      `## Part A: Privacy Officer (RPRP) Designation Resolution`,
      `Pursuant to Quebec's *Act respecting the protection of personal information in the private sector* (as amended by Law 25), **${orgName}** hereby designates **${rprpName}** as the Person in Charge of the Protection of Personal Information (Privacy Officer / RPRP).`,
      `- **Public Contact Email:** ${rprpEmail}`,
      `- **Duties:** Oversee Privacy Impact Assessments (ÉFVP), maintain the Confidentiality Incident Register (retained for >= 5 years), respond to access/rectification requests within 30 days, and audit third-party SaaS transfers.`,
      ``,
      `## Part B: Website Privacy & Cookie Notice Snippet`,
      `### Personal Information & Privacy Officer Contact`,
      `${orgName} collects only the personal information necessary to deliver our services and respond to your requests. For any privacy inquiry, access request, or withdrawal of consent, contact our Privacy Officer (**${rprpName}**) at **${rprpEmail}**.`,
      ``,
      `### Cross-Border Storage & Subprocessors (Section 17 Disclosure)`,
      `To operate reliably, some personal information may be processed or stored outside Quebec (including in Canada and the United States) via vetted service providers subject to contractual confidentiality and security safeguards:`,
      ...vendors.map((v) => `- **${v.name}** (${v.category}): ${v.defaultRegion}`),
      ``,
      `### Cookies & Tracking Technologies (Privacy by Default)`,
      `Essential cookies required for security and checkout remain active. Non-essential analytics or advertising cookies remain disabled by default unless you click "Accept" in our preference banner.`
    ].join("\n");
  }

  function formatDocAsMarkdown(doc) {
    const lines = [`# ${doc.title}`, `**${doc.subtitle}**`, `_${doc.watermarkNote}_`, ""];
    for (const sec of doc.sections) {
      lines.push(`## ${sec.heading}`);
      for (const p of sec.paragraphs) {
        lines.push(`- ${p}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  function formatDocAsPrintableHtml(doc) {
    const esc = (s) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const sectionHtml = doc.sections
      .map(
        (sec) => `
      <section style="margin-bottom:22px;page-break-inside:avoid;">
        <h2 style="font-size:16px;color:#0f2942;border-bottom:1px solid #cbd5e1;padding-bottom:4px;">${esc(sec.heading)}</h2>
        <ul style="margin:8px 0 0 18px;padding:0;">
          ${sec.paragraphs.map((p) => `<li style="margin-bottom:6px;line-height:1.5;">${esc(p)}</li>`).join("")}
        </ul>
      </section>`
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="${doc.lang}">
<head>
<meta charset="utf-8">
<title>${esc(doc.title)} - ${esc(doc.subtitle)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; max-width: 820px; margin: 36px auto; padding: 0 24px; }
  .banner { background: ${doc.watermarked ? "#fef3c7" : "#f1f5f9"}; border: 1px solid ${doc.watermarked ? "#f59e0b" : "#cbd5e1"}; padding: 10px 14px; border-radius: 6px; font-size: 12px; margin-bottom: 20px; }
  @media print { .no-print { display: none; } body { margin: 16px; } }
</style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;">
    <button onclick="window.print()" style="padding:8px 14px;background:#0f2942;color:#fff;border:none;border-radius:6px;cursor:pointer;">Print / Save as PDF</button>
  </div>
  <h1 style="font-size:20px;color:#0f2942;margin-bottom:4px;">${esc(doc.title)}</h1>
  <div style="font-size:14px;color:#475569;margin-bottom:14px;">${esc(doc.subtitle)} &bull; ${esc(doc.generatedDate)}</div>
  <div class="banner">${esc(doc.watermarkNote)}</div>
  ${sectionHtml}
</body>
</html>`;
  }

  return {
    evaluateVendorStack,
    buildPiaDocument,
    buildIncidentRegisterCsv,
    buildGovernancePackMarkdown,
    formatDocAsMarkdown,
    formatDocAsPrintableHtml
  };
});
