// sav.dev — scripts do portfolio
// faz: navbar, terminal animado, scroll reveal, form de contato

(() => {
  "use strict";

  // endpoint que valida turnstile + grava no supabase + dispara email
  const SUBMIT_URL = "https://sbgkimmcqnxepbwyrtlg.supabase.co/functions/v1/submit-message";

  // --- navbar ---
  const nav = document.getElementById("nav");
  const menuBtn = document.getElementById("menu-btn");
  const navLinks = document.getElementById("nav-links");

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => navLinks.classList.remove("open"))
  );

  // --- terminal: efeito de digitacao ---
  const t1 = document.getElementById("t1");
  const l2 = document.getElementById("l2");
  const l3 = document.getElementById("l3");
  const logoEl = document.getElementById("hero-logo");
  const subEl = document.getElementById("hero-sub");

  const cmd = "npm run sav";
  let i = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function tick() {
    if (i < cmd.length) {
      t1.textContent += cmd.charAt(i++);
      setTimeout(tick, 70 + Math.random() * 60);
    } else {
      t1.classList.remove("typing");
      setTimeout(() => (l2.style.display = "flex"), 220);
      setTimeout(() => (l3.style.display = "flex"), 640);
      setTimeout(() => {
        logoEl.style.display = "flex";
        logoEl.classList.add("visible");
      }, 980);
      setTimeout(() => {
        subEl.style.display = "block";
        subEl.classList.add("visible");
      }, 1300);
    }
  }

  if (reduced) {
    // quem nao quer animacao ve tudo de uma vez
    t1.textContent = cmd;
    t1.classList.remove("typing");
    l2.style.display = "flex";
    l3.style.display = "flex";
    logoEl.style.display = "flex";
    logoEl.classList.add("visible");
    subEl.style.display = "block";
    subEl.classList.add("visible");
  } else {
    t1.classList.add("typing");
    setTimeout(tick, 450);
  }

  // --- scroll reveal ---
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // --- form de contato ---
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitOriginal = submitBtn.innerHTML;
  const formLoadedAt = Date.now();

  function setStatus(msg, color) {
    status.textContent = msg;
    status.style.color = color;
  }
  function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  // codigos do server -> msg amigavel
  const errMsg = {
    missing_captcha:      "⚠ aguarde o desafio de segurança terminar antes de enviar.",
    captcha_failed:       "⚠ verificação falhou. tente novamente.",
    too_fast:             "⚠ calma! aguarde um instante.",
    invalid_name:         "⚠ nome inválido.",
    invalid_email:        "⚠ e-mail inválido.",
    invalid_email_format: "⚠ e-mail inválido. confira o formato.",
    invalid_message:      "⚠ mensagem inválida (1 a 4000 caracteres).",
    too_many_links:       "⚠ mensagens com varios links sao bloqueadas.",
    rate_limit_email:     "⚠ voce ja enviou varias mensagens. tente em uma hora.",
    rate_limit_global:    "⚠ muitas mensagens chegando agora. tente em alguns minutos.",
    rpc_failed:           "⚠ erro do servidor. tente em instantes.",
    server_error:         "⚠ erro do servidor. tente em instantes."
  };

  function resetTurnstile() {
    try {
      if (window.turnstile) {
        const widget = document.getElementById("turnstile-widget");
        if (widget) window.turnstile.reset(widget);
      }
    } catch (_) {}
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name    = (data.get("name")    || "").toString().trim();
    const email   = (data.get("email")   || "").toString().trim();
    const message = (data.get("message") || "").toString().trim();
    const honey   = (data.get("website") || "").toString();
    const token   = (data.get("cf-turnstile-response") || "").toString();

    // honeypot preenchido = bot. finge sucesso e segue
    if (honey) {
      setStatus("✓ mensagem enviada!", "#8b5cf6");
      form.reset();
      resetTurnstile();
      return;
    }

    if (!name || !email || !message) {
      setStatus("⚠ preencha todos os campos antes de enviar.", "#fbbf24");
      return;
    }
    if (!isValidEmail(email)) {
      setStatus("⚠ e-mail inválido. confira e tente novamente.", "#fbbf24");
      return;
    }
    if (message.length > 4000) {
      setStatus("⚠ a mensagem é muito longa (max 4000 caracteres).", "#fbbf24");
      return;
    }
    if (!token) {
      setStatus("⚠ aguarde a verificação terminar e tente novamente.", "#fbbf24");
      return;
    }

    // loading
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.75";
    submitBtn.innerHTML = "enviando…";
    setStatus("", "var(--text-dim)");

    try {
      const resp = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          turnstileToken: token,
          formFilledMs: Date.now() - formLoadedAt,
          userAgent: navigator.userAgent.slice(0, 300)
        })
      });

      const result = await resp.json().catch(() => ({ ok: false, error: "server_error" }));

      if (resp.ok && result?.ok) {
        setStatus(
          `✓ obrigado, ${name}! te respondo no e-mail ${email} em breve.`,
          "#8b5cf6"
        );
        form.reset();
        resetTurnstile();
      } else {
        const code = result?.error || "server_error";
        setStatus(errMsg[code] || "⚠ nao consegui enviar. tente novamente.", "#fbbf24");
        resetTurnstile();
      }
    } catch (err) {
      console.error(err);
      setStatus(
        "⚠ nao consegui enviar agora. tente em instantes ou me chame pelo discord/instagram.",
        "#f87171"
      );
      resetTurnstile();
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.innerHTML = submitOriginal;
    }
  });

  // ano dinamico no footer
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
