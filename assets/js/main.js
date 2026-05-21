/* =========================================================
   sav.dev — portfolio scripts
   - Navbar (scroll shadow + menu mobile)
   - Terminal: efeito de digitação
   - Scroll reveal via IntersectionObserver
   - Formulário de contato (Turnstile + Edge Function + rate limit)
   ========================================================= */

(() => {
  "use strict";

  /* ---------- Endpoint da Edge Function ---------- */
  // Esta função:
  //  1) valida o token do Cloudflare Turnstile
  //  2) chama a RPC submit_contact_message no Supabase (rate limit + anti-spam)
  //  3) o trigger no banco dispara o e-mail via Resend
  const SUBMIT_ENDPOINT =
    "https://sbgkimmcqnxepbwyrtlg.supabase.co/functions/v1/submit-message";

  /* ---------- Navbar ---------- */
  const nav = document.getElementById("nav");
  const menuBtn = document.getElementById("menu-btn");
  const navLinks = document.getElementById("nav-links");

  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => navLinks.classList.remove("open"))
  );

  /* ---------- Terminal: efeito de digitação ---------- */
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

  /* ---------- Scroll reveal ---------- */
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

  /* ---------- Formulário de contato ---------- */
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitOriginal = submitBtn.innerHTML;
  const formLoadedAt = Date.now();

  const setStatus = (msg, color) => {
    status.textContent = msg;
    status.style.color = color;
  };
  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // Mensagens humanas para cada código de erro vindo do servidor
  const errorMessages = {
    missing_captcha:      "⚠ Aguarde o desafio de segurança terminar antes de enviar.",
    captcha_failed:       "⚠ Verificação de segurança falhou. Tente novamente.",
    too_fast:             "⚠ Calma! Aguarde um instante antes de enviar.",
    invalid_name:         "⚠ Nome inválido.",
    invalid_email:        "⚠ E-mail inválido.",
    invalid_email_format: "⚠ E-mail inválido. Confira o formato.",
    invalid_message:      "⚠ Mensagem inválida (entre 1 e 4000 caracteres).",
    too_many_links:       "⚠ Mensagens com vários links são bloqueadas por anti-spam.",
    rate_limit_email:     "⚠ Você já enviou várias mensagens recentemente. Tente novamente em uma hora.",
    rate_limit_global:    "⚠ Muitas mensagens chegando agora. Tente novamente em alguns minutos.",
    rpc_failed:           "⚠ Erro do servidor. Tenta novamente em instantes.",
    server_error:         "⚠ Erro do servidor. Tenta novamente em instantes."
  };

  // Reseta o widget do Turnstile (pra usuário tentar de novo após erro)
  function resetTurnstile() {
    try {
      if (window.turnstile) {
        const widget = document.getElementById("turnstile-widget");
        if (widget) window.turnstile.reset(widget);
      }
    } catch (_) { /* ignora */ }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name    = (data.get("name")    || "").toString().trim();
    const email   = (data.get("email")   || "").toString().trim();
    const message = (data.get("message") || "").toString().trim();
    const honey   = (data.get("website") || "").toString();
    const turnstileToken = (data.get("cf-turnstile-response") || "").toString();

    // 1) Honeypot — bot caiu, fingimos sucesso
    if (honey) {
      setStatus("✓ Mensagem enviada!", "#8b5cf6");
      form.reset();
      resetTurnstile();
      return;
    }

    // 2) Validações UX no cliente
    if (!name || !email || !message) {
      setStatus("⚠ Preencha todos os campos antes de enviar.", "#fbbf24");
      return;
    }
    if (!isValidEmail(email)) {
      setStatus("⚠ E-mail inválido. Confira e tente novamente.", "#fbbf24");
      return;
    }
    if (message.length > 4000) {
      setStatus("⚠ A mensagem é muito longa (máx. 4000 caracteres).", "#fbbf24");
      return;
    }

    // 3) Turnstile precisa ter rodado
    if (!turnstileToken) {
      setStatus("⚠ Aguarde a verificação de segurança terminar e tente novamente.", "#fbbf24");
      return;
    }

    // 4) Loading state
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.75";
    submitBtn.innerHTML = "Enviando…";
    setStatus("", "var(--text-dim)");

    try {
      const resp = await fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          turnstileToken,
          formFilledMs: Date.now() - formLoadedAt,
          userAgent: navigator.userAgent.slice(0, 300)
        })
      });

      const result = await resp.json().catch(() => ({ ok: false, error: "server_error" }));

      if (resp.ok && result?.ok) {
        setStatus(
          `✓ Obrigado, ${name}! Sua mensagem foi enviada — te respondo no e-mail ${email} em breve.`,
          "#8b5cf6"
        );
        form.reset();
        resetTurnstile();
      } else {
        const code = result?.error || "server_error";
        setStatus(errorMessages[code] || "⚠ Não consegui enviar. Tenta novamente.", "#fbbf24");
        resetTurnstile();  // exige novo desafio
      }
    } catch (err) {
      console.error(err);
      setStatus(
        "⚠ Não consegui enviar agora. Tente novamente em instantes ou me chame pelo Discord/Instagram abaixo.",
        "#f87171"
      );
      resetTurnstile();
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.innerHTML = submitOriginal;
    }
  });

  /* ---------- Ano dinâmico no footer ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
