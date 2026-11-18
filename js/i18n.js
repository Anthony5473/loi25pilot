/**
 * Complete Bilingual EN/FR dictionary for Loi25Pilot (Quebec Law 25 Compliance & PIA/EFVP Generator).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Loi25I18n = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const STRINGS = {
    en: {
      brand: "Loi25Pilot",
      tagline: "Quebec Law 25 Interactive PIA (ÉFVP) & Compliance Binder",
      heroBadge: "100% Client-Side • Zero Data Leaves Your Browser",
      heroTitle: "Generate a CAI-Aligned Law 25 Privacy Impact Assessment in 10 Minutes — Not $499+.",
      heroSubtitle:
        "Built for Canadian & Quebec SMBs adopting US/cloud SaaS tools. Audit your cross-border transfers for free, then export a complete 7-section PIA (ÉFVP), Incident Register, and Governance Binder in Word (.docx), HTML/PDF, and CSV.",
      disclaimerBanner:
        "Workflow & documentation software aligned with Quebec CAI guidelines. Not legal advice; consult qualified Quebec counsel for high-risk or complex legal opinions.",
      step1Title: "1. Free Law 25 Cross-Border SaaS Checker (Instant Risk Scan)",
      step1Desc:
        "Law 25 Section 17 requires a Privacy Impact Assessment before transferring Quebec residents' personal information outside Quebec (including most US-hosted SaaS). Select your stack:",
      riskSummaryTitle: "Instant Transfer & Readiness Assessment",
      lblRiskScore: "Risk Score",
      lblOutOfQc: "Out-of-Quebec Transfers",
      lblPiaTriggered: "PIA / ÉFVP Triggered",
      wizardTitle: "2. Guided 7-Section PIA (ÉFVP) & Compliance Binder Builder",
      lblOrgName: "Organization Legal Name",
      lblProjectName: "Project / SaaS Rollout Name",
      lblRprpName: "Privacy Officer (RPRP) Name",
      lblRprpEmail: "Privacy Officer Public Email",
      lblJurisdiction: "Primary Business Jurisdiction",
      lblPurpose: "Purpose of Collection / Processing",
      lblDataSubjects: "Categories of Individuals",
      lblDataElements: "Personal Information Collected",
      lblRetention: "Retention & Destruction Schedule",
      chkSensitive: "Collects sensitive personal data (SIN, health, biometric, financial)",
      chkAutomated: "Uses automated decision-making / AI profiling (Sec. 12.1)",
      chkNoRprp: "Privacy Officer contact not yet published on website",
      previewLabel: "Live 7-Section CAI PIA / ÉFVP Preview",
      pricingTitle: "Transparent SMB Pricing (No $249/mo Lock-In)",
      unlockBtn: "Unlock Export (License Key)",
      freePreviewBtn: "Generate Free Preview (Watermarked)",
      exportDocxBtn: "Download PIA / ÉFVP (.docx)",
      exportHtmlBtn: "Download Print-Ready Binder (.html / PDF)",
      exportIncidentBtn: "Download Incident Register (.csv)",
      exportPolicyBtn: "Download Governance & Cookie Pack (.md)",
      faqTitle: "Frequently Asked Questions (Law 25 / ÉFVP)",
      langToggle: "Français (FR)",
      sections: [
        "1. Project Context & Privacy Officer (RPRP)",
        "2. Personal Information Inventory & Proportionality",
        "3. Data Lifecycle & Out-of-Quebec Transfers (Sec. 17)",
        "4. Law 25 Legal Obligations & Privacy-by-Default",
        "5. Risk & Threat Evaluation Matrix",
        "6. Safeguards, Contracts (DPA) & Retention Plan",
        "7. Privacy Officer Sign-Off & Review Schedule"
      ]
    },
    fr: {
      brand: "Loi25Pilot",
      tagline: "Générateur interactif d'ÉFVP et Trousse de conformité Loi 25",
      heroBadge: "100 % Côté Client • Aucune donnée ne quitte votre navigateur",
      heroTitle: "Produisez votre ÉFVP alignée sur la CAI en 10 minutes — sans payer 499 $+.",
      heroSubtitle:
        "Conçu pour les PME canadiennes et québécoises utilisant des logiciels infonuagiques hors Québec. Évaluez gratuitement vos transferts transfrontaliers, puis exportez votre ÉFVP complète en 7 sections (.docx), Registre des incidents (.csv) et Politique de gouvernance.",
      disclaimerBanner:
        "Logiciel d'aide à la documentation aligné sur les guides de la CAI. Ne constitue pas un avis juridique; consultez un conseiller juridique qualifié pour des dossiers complexes.",
      step1Title: "1. Vérificateur gratuit de transferts SaaS hors Québec (Art. 17)",
      step1Desc:
        "L'article 17 de la Loi 25 exige une ÉFVP avant de communiquer des renseignements personnels à l'extérieur du Québec. Sélectionnez vos outils :",
      riskSummaryTitle: "Évaluation instantanée des risques et transferts",
      lblRiskScore: "Score de risque",
      lblOutOfQc: "Transferts hors Québec",
      lblPiaTriggered: "ÉFVP requise",
      wizardTitle: "2. Assistant ÉFVP en 7 sections et Trousse de conformité",
      lblOrgName: "Dénomination sociale de l'organisation",
      lblProjectName: "Nom du projet / déploiement SaaS",
      lblRprpName: "Nom du Responsable (RPRP)",
      lblRprpEmail: "Courriel public du RPRP",
      lblJurisdiction: "Juridiction principale",
      lblPurpose: "Finalité de la collecte / du traitement",
      lblDataSubjects: "Catégories de personnes concernées",
      lblDataElements: "Renseignements personnels recueillis",
      lblRetention: "Calendrier de conservation et destruction",
      chkSensitive: "Collecte des données sensibles (NAS, santé, biométrie, finances)",
      chkAutomated: "Décision automatisée / profilage IA (Art. 12.1)",
      chkNoRprp: "Coordonnées du RPRP non encore publiées sur le site web",
      previewLabel: "Aperçu en direct de l'ÉFVP CAI (7 sections)",
      pricingTitle: "Tarification PME transparente (sans abonnement à 249 $/mois)",
      unlockBtn: "Déverrouiller l'exportation (Clé de licence)",
      freePreviewBtn: "Aperçu gratuit (filigrane)",
      exportDocxBtn: "Télécharger l'ÉFVP (.docx)",
      exportHtmlBtn: "Télécharger le dossier imprimable (.html / PDF)",
      exportIncidentBtn: "Télécharger le Registre des incidents (.csv)",
      exportPolicyBtn: "Télécharger Gouvernance & Témoins (.md)",
      faqTitle: "Foire aux questions (Loi 25 / ÉFVP)",
      langToggle: "English (EN)",
      sections: [
        "1. Contexte du projet et Responsable (RPRP)",
        "2. Inventaire des renseignements personnels et proportionnalité",
        "3. Cycle de vie et transferts hors Québec (Art. 17)",
        "4. Obligations légales Loi 25 et confidentialité par défaut",
        "5. Matrice d'évaluation des risques et menaces",
        "6. Mesures de sécurité, ententes (DPA) et conservation",
        "7. Approbation du RPRP et calendrier de révision"
      ]
    }
  };

  function getStrings(lang) {
    return STRINGS[lang === "fr" ? "fr" : "en"];
  }

  return { STRINGS, getStrings };
});
