// SMAQ Support IT — Enterprise Light v2.1
(() => {
  const CONTACT_EMAIL = "smaq.dev.web@gmail.com";
  const FORM_ENDPOINT = "/api/lead"; // optionnel. Sinon fallback mailto.

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  $("#year").textContent = new Date().getFullYear();
  $("#dateText").textContent = new Date().toLocaleDateString("fr-BE");

  // dataLayer
  window.dataLayer = window.dataLayer || [];
  const dl = (event, extra={}) => { try { window.dataLayer.push({ event, ...extra }); } catch(_) {} };

  // Tabs
  const setActiveTab = (tabId, {pushHash=true} = {}) => {
    const panels = $$("[data-tab-panel]");
    const links = $$("[data-tab]");
    const mobileLinks = $$("#mobileNav [data-tab]");
    panels.forEach(p => p.classList.toggle("is-active", p.dataset.tabPanel === tabId));
    links.forEach(b => b.classList.toggle("is-active", b.dataset.tab === tabId));
    mobileLinks.forEach(b => b.classList.toggle("is-active", b.dataset.tab === tabId));

    if (pushHash) history.replaceState(null, "", "#" + tabId);
    dl("tab_change", { tab: tabId });
    closeMobileNav();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  document.addEventListener("click", (e) => {
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn) setActiveTab(tabBtn.dataset.tab);

    const open = e.target.closest("[data-modal-open]");
    if (open) openModal(open.dataset.modalOpen);

    const close = e.target.closest("[data-modal-close]");
    if (close) closeModal(close.dataset.modalClose);
  });

  const initHash = () => {
    const h = (location.hash || "").replace("#", "").trim();
    const valid = new Set($$("[data-tab-panel]").map(p => p.dataset.tabPanel));
    setActiveTab(valid.has(h) ? h : "accueil", {pushHash:true});
  };
  window.addEventListener("hashchange", initHash);
  initHash();

  // Mobile nav
  const burgerBtn = $("#burgerBtn");
  const mobileNav = $("#mobileNav");
  const openMobileNav = () => { mobileNav.hidden = false; burgerBtn.setAttribute("aria-expanded","true"); };
  const closeMobileNav = () => { mobileNav.hidden = true; burgerBtn.setAttribute("aria-expanded","false"); };
  burgerBtn.addEventListener("click", () => (mobileNav.hidden ? openMobileNav() : closeMobileNav()));

  // Call tracking
  ["callTopBtn","callHeroBtn","callSideBtn","callMobileBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", () => dl("click_call", { id }));
  });

  // CTA tracking
  ["quoteTopBtn","diagBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", () => dl("click_cta", { id }));
  });

  // Modal
  const modal = (name) => $("#modal-" + name);
  const openModal = (name) => { const m = modal(name); if(!m) return; m.hidden = false; document.body.style.overflow="hidden"; dl("modal_open",{name}); };
  const closeModal = (name) => { const m = modal(name); if(!m) return; m.hidden = true; document.body.style.overflow=""; dl("modal_close",{name}); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal("conditions"); });

  $("#printCondBtn").addEventListener("click", () => { dl("print_conditions"); window.print(); });

  // Form
  const form = $("#contactForm");
  const status = $("#formStatus");
  const submitBtn = $("#submitBtn");

  const toMailto = (payload) => {
    const subject = encodeURIComponent(`[Liège] ${payload.need} — ${payload.name}`);
    const body = encodeURIComponent(
      `Nom/Société : ${payload.name}\n` +
      `Email : ${payload.email}\n` +
      `Téléphone : ${payload.phone || "-"}\n` +
      `Demande : ${payload.need}\n\n` +
      `Message :\n${payload.msg}\n`
    );
    location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";

    const hp = $("#hp").value.trim();
    if (hp) { status.textContent = "OK."; return; }

    const payload = {
      company_website: hp,
      name: $("#name").value.trim(),
      email: $("#email").value.trim(),
      phone: $("#phone").value.trim(),
      need: $("#need").value.trim(),
      msg: $("#msg").value.trim(),
      ts: Date.now(),
      page: location.href,
      ua: navigator.userAgent
    };

    if (!payload.name || !payload.email || !payload.need || !payload.msg) {
      status.textContent = "Merci de compléter les champs obligatoires.";
      return;
    }

    dl("form_submit_attempt", { need: payload.need });
    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi…";

    try{
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      status.textContent = "Message envoyé. Réponse sous 24h (jours ouvrables).";
      dl("form_submit_success", { need: payload.need });
      form.reset();
    }catch(err){
      dl("form_submit_fallback", { reason: String(err) });
      status.textContent = "Envoi direct indisponible. Ouverture d’un email…";
      setTimeout(() => toMailto(payload), 350);
    }finally{
      submitBtn.disabled = false;
      submitBtn.textContent = "Envoyer";
    }
  });
})();
