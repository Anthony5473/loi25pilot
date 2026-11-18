/**
 * Browser application controller for Loi25Pilot.
 */
(function () {
  const vendors = window.Loi25Vendors.VENDORS;
  const engine = window.Loi25Engine;
  const i18n = window.Loi25I18n;
  const docx = window.Loi25Docx;
  const license = window.Loi25License;

  const cfg = window.Loi25Config || {};
  const DRAFT_STORAGE_KEY = "loi25pilot_draft_v1";

  const state = {
    lang: "en",
    selectedVendorIds: new Set(["google-workspace", "stripe", "ga4"]),
    unlocked: false,
    licenseTier: "free",
    verifyEndpoint: cfg.verifyEndpoint || ""
  };

  function saveDraftToLocal() {
    try {
      const payload = {
        lang: state.lang,
        selectedVendorIds: Array.from(state.selectedVendorIds),
        form: getFormInput()
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {}
  }

  function restoreDraftFromLocal() {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.lang === "fr" || saved.lang === "en") state.lang = saved.lang;
      if (Array.isArray(saved.selectedVendorIds)) {
        state.selectedVendorIds = new Set(saved.selectedVendorIds);
      }
      if (saved.form) {
        for (const [k, v] of Object.entries(saved.form)) {
          const node = el(k);
          if (!node) continue;
          if (node.type === "checkbox") node.checked = Boolean(v);
          else if (typeof v === "string") node.value = v;
        }
      }
    } catch (_) {}
  }

  function el(id) {
    return document.getElementById(id);
  }

  function getFormInput() {
    return {
      orgName: el("orgName").value,
      projectName: el("projectName").value,
      rprpName: el("rprpName").value,
      rprpEmail: el("rprpEmail").value,
      jurisdiction: el("jurisdiction").value,
      purpose: el("purpose").value,
      dataSubjects: el("dataSubjects").value,
      dataElements: el("dataElements").value,
      retentionPeriod: el("retentionPeriod").value,
      sensitiveData: el("sensitiveData").checked,
      automatedDecisions: el("automatedDecisions").checked,
      noPrivacyOfficer: el("noPrivacyOfficer").checked
    };
  }

  function downloadBytes(filename, bytes, mime) {
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function renderVendorGrid() {
    const grid = el("vendorGrid");
    grid.innerHTML = "";
    for (const v of vendors) {
      const checked = state.selectedVendorIds.has(v.id);
      const card = document.createElement("label");
      card.className = `vendor-card ${checked ? "selected" : ""}`;
      card.innerHTML = `
        <input type="checkbox" data-vid="${v.id}" ${checked ? "checked" : ""} />
        <div class="vendor-meta">
          <div class="vendor-title">${v.name} <span class="badge badge-${v.riskLevel.toLowerCase()}">${v.riskLevel}</span></div>
          <div class="vendor-sub">${v.category} &bull; ${v.outsideQuebec ? "Outside QC" : "In QC"}</div>
        </div>
      `;
      card.querySelector("input").addEventListener("change", (ev) => {
        if (ev.target.checked) state.selectedVendorIds.add(v.id);
        else state.selectedVendorIds.delete(v.id);
        renderVendorGrid();
        renderAssessmentAndPreview();
      });
      grid.appendChild(card);
    }
  }

  function renderTranslations() {
    const t = i18n.getStrings(state.lang);
    const textKeys = [
      "heroBadge", "heroTitle", "heroSubtitle", "step1Title", "step1Desc",
      "riskSummaryTitle", "lblRiskScore", "lblOutOfQc", "lblPiaTriggered",
      "wizardTitle", "lblOrgName", "lblProjectName", "lblRprpName", "lblRprpEmail",
      "lblJurisdiction", "lblPurpose", "lblDataSubjects", "lblDataElements",
      "lblRetention", "chkSensitive", "chkAutomated", "chkNoRprp", "previewLabel",
      "pricingTitle", "unlockBtn", "freePreviewBtn", "exportDocxBtn",
      "exportHtmlBtn", "exportIncidentBtn", "exportPolicyBtn", "faqTitle"
    ];
    for (const key of textKeys) {
      if (t[key] && el(key)) el(key).textContent = t[key];
    }
    el("disclaimerText").textContent = t.disclaimerBanner;
    el("langToggleBtn").textContent = t.langToggle;
  }

  function renderAssessmentAndPreview() {
    const form = getFormInput();
    const evalRes = engine.evaluateVendorStack(Array.from(state.selectedVendorIds), {
      sensitiveData: form.sensitiveData,
      automatedDecisions: form.automatedDecisions,
      noPrivacyOfficer: form.noPrivacyOfficer
    });

    el("riskScoreValue").textContent = `${evalRes.score} / 100 (${evalRes.tier})`;
    el("outOfQcValue").textContent = String(evalRes.outOfQuebecCount);
    el("piaRequiredValue").textContent = evalRes.piaRequiredUnderSec17 ? "YES (Sec. 17)" : "Recommended";

    const findingsList = el("findingsList");
    findingsList.innerHTML = "";
    const items = evalRes.criticalFindings.length
      ? evalRes.criticalFindings
      : ["No high-severity compliance blockers detected for selected tools. Document your baseline safeguards below."];
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item;
      findingsList.appendChild(li);
    }

    const doc = engine.buildPiaDocument(form, evalRes, {
      lang: state.lang,
      watermarked: !state.unlocked
    });
    el("livePreview").textContent = engine.formatDocAsMarkdown(doc);
    saveDraftToLocal();
  }

  function wireActions() {
    el("langToggleBtn").addEventListener("click", () => {
      state.lang = state.lang === "en" ? "fr" : "en";
      renderTranslations();
      renderAssessmentAndPreview();
    });

    const inputs = [
      "orgName",
      "projectName",
      "rprpName",
      "rprpEmail",
      "jurisdiction",
      "purpose",
      "dataSubjects",
      "dataElements",
      "retentionPeriod",
      "sensitiveData",
      "automatedDecisions",
      "noPrivacyOfficer"
    ];
    for (const id of inputs) {
      el(id).addEventListener("input", renderAssessmentAndPreview);
      el(id).addEventListener("change", renderAssessmentAndPreview);
    }

    el("freePreviewBtn").addEventListener("click", () => {
      const form = getFormInput();
      const evalRes = engine.evaluateVendorStack(Array.from(state.selectedVendorIds), form);
      const doc = engine.buildPiaDocument(form, evalRes, { lang: state.lang, watermarked: true });
      downloadBytes(
        "Loi25-PIA-Preview-Watermarked.html",
        engine.formatDocAsPrintableHtml(doc),
        "text/html;charset=utf-8"
      );
    });

    el("unlockBtn").addEventListener("click", async () => {
      const key = el("licenseKeyInput").value;
      const statusEl = el("licenseStatus");
      const res = await license.verifyLicenseKey(key, { verifyEndpoint: state.verifyEndpoint });
      if (res.valid) {
        state.unlocked = true;
        state.licenseTier = res.tier;
        statusEl.textContent = `Unlocked (${res.tier})`;
        statusEl.className = "status-ok";
        renderAssessmentAndPreview();
      } else {
        statusEl.textContent = res.reason;
        statusEl.className = "status-err";
      }
    });

    const requireUnlockedOrWarn = () => {
      if (!state.unlocked) {
        el("licenseStatus").textContent =
          "Pro export requires an active license key. Use 'Generate Free Preview (Watermarked)' to inspect the full structure first.";
        el("licenseStatus").className = "status-err";
        return false;
      }
      return true;
    };

    el("exportDocxBtn").addEventListener("click", () => {
      if (!requireUnlockedOrWarn()) return;
      const form = getFormInput();
      const evalRes = engine.evaluateVendorStack(Array.from(state.selectedVendorIds), form);
      const doc = engine.buildPiaDocument(form, evalRes, { lang: state.lang, watermarked: false });
      const bytes = docx.generateDocxUint8Array(doc);
      downloadBytes(
        "Loi25-PIA-EFVP-Assessment.docx",
        bytes,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    });

    el("exportHtmlBtn").addEventListener("click", () => {
      if (!requireUnlockedOrWarn()) return;
      const form = getFormInput();
      const evalRes = engine.evaluateVendorStack(Array.from(state.selectedVendorIds), form);
      const doc = engine.buildPiaDocument(form, evalRes, { lang: state.lang, watermarked: false });
      downloadBytes("Loi25-PIA-EFVP-Binder.html", engine.formatDocAsPrintableHtml(doc), "text/html;charset=utf-8");
    });

    el("exportIncidentBtn").addEventListener("click", () => {
      if (!requireUnlockedOrWarn()) return;
      downloadBytes("Loi25-Confidentiality-Incident-Register.csv", engine.buildIncidentRegisterCsv(), "text/csv;charset=utf-8");
    });

    el("exportPolicyBtn").addEventListener("click", () => {
      if (!requireUnlockedOrWarn()) return;
      const form = getFormInput();
      const evalRes = engine.evaluateVendorStack(Array.from(state.selectedVendorIds), form);
      downloadBytes("Loi25-Governance-Cookie-Pack.md", engine.buildGovernancePackMarkdown(form, evalRes), "text/markdown;charset=utf-8");
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    restoreDraftFromLocal();
    const params = new URLSearchParams(window.location.search);
    if (params.get("lang") === "fr") state.lang = "fr";
    if (cfg.checkoutUrlKit) el("checkoutKitLink").href = cfg.checkoutUrlKit;
    if (cfg.checkoutUrlPro) el("checkoutProLink").href = cfg.checkoutUrlPro;

    renderTranslations();
    renderVendorGrid();
    renderAssessmentAndPreview();
    wireActions();

    const urlKey = params.get("key");
    if (urlKey) {
      el("licenseKeyInput").value = urlKey;
      el("unlockBtn").click();
    }
  });
})();
