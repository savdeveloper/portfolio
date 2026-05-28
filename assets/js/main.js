// sav.dev — scripts do portfolio
// faz: navbar, terminal animado, scroll reveal, lazy turnstile, form de contato

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // endpoint que valida turnstile + grava no supabase + dispara email
  const SUBMIT_URL = "https://sbgkimmcqnxepbwyrtlg.supabase.co/functions/v1/submit-message";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- navbar ---
  const nav = $("nav");
  const menuBtn = $("menu-btn");
  const navLinks = $("nav-links");

  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (menuBtn && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    };

    menuBtn.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });

    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", closeMenu)
    );

    // a11y: ESC fecha o menu mobile
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        closeMenu();
        menuBtn.focus();
      }
    });
  }

  // --- terminal: efeito de digitacao ---
  const t1 = $("t1");
  const l2 = $("l2");
  const l3 = $("l3");
  const logoEl = $("hero-logo");
  const subEl = $("hero-sub");

  if (t1 && l2 && l3 && logoEl && subEl) {
    const cmd = "npm run sav";
    let i = 0;

    const showAll = () => {
      t1.textContent = cmd;
      t1.classList.remove("typing");
      [l2, l3, logoEl, subEl].forEach((el) => el.classList.remove("js-only"));
      logoEl.classList.add("visible");
      subEl.classList.add("visible");
    };

    const tick = () => {
      if (document.hidden) {
        showAll();
        return;
      }
      if (i < cmd.length) {
        t1.textContent += cmd.charAt(i++);
        setTimeout(tick, 70 + Math.random() * 60);
      } else {
        t1.classList.remove("typing");
        setTimeout(() => l2.classList.remove("js-only"), 220);
        setTimeout(() => l3.classList.remove("js-only"), 640);
        setTimeout(() => {
          logoEl.classList.remove("js-only");
          logoEl.classList.add("visible");
        }, 980);
        setTimeout(() => {
          subEl.classList.remove("js-only");
          subEl.classList.add("visible");
        }, 1300);
      }
    };

    if (reduced) {
      showAll();
    } else {
      t1.classList.add("typing");
      setTimeout(tick, 450);
    }
  }

  // --- spotlight no hero (segue o mouse) ---
  const hero = document.querySelector(".hero");
  if (hero && matchMedia("(hover: hover)").matches && !reduced) {
    let raf = null;
    let px = 0, py = 0;
    const apply = () => {
      raf = null;
      hero.style.setProperty("--mx", px + "px");
      hero.style.setProperty("--my", py + "px");
    };
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      if (raf === null) raf = requestAnimationFrame(apply);
    });
  }

  // --- scroll reveal ---
  if ("IntersectionObserver" in window) {
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
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
  }

  // --- lazy load do cloudflare turnstile ---
  // so carrega o widget quando o usuario chega perto da section #contact
  const contactSection = $("contact");
  let turnstileLoaded = false;
  const loadTurnstile = () => {
    if (turnstileLoaded) return;
    turnstileLoaded = true;
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  };

  if (contactSection && "IntersectionObserver" in window) {
    const tsObs = new IntersectionObserver(
      (entries, obs) => {
        if (entries[0].isIntersecting) {
          loadTurnstile();
          obs.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    tsObs.observe(contactSection);
  } else {
    // fallback: carrega no load
    loadTurnstile();
  }

  // --- form de contato ---
  const form = $("contact-form");

  if (form) {
    const status = $("form-status");
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitLabel = submitBtn?.querySelector(".btn-label");
    const originalLabel = submitLabel ? submitLabel.textContent : "enviar";
    const formLoadedAt = Date.now();

    const setStatus = (msg, color) => {
      if (!status) return;
      status.textContent = msg;
      status.style.color = color;
    };

    const isValidEmail = (e) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    // se o user focar/touchar o form antes do IntersectionObserver disparar, carrega ja
    const eagerLoad = () => {
      loadTurnstile();
      form.removeEventListener("focusin", eagerLoad);
      form.removeEventListener("pointerdown", eagerLoad);
    };
    form.addEventListener("focusin", eagerLoad);
    form.addEventListener("pointerdown", eagerLoad);

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

    const resetTurnstile = () => {
      try {
        if (window.turnstile) {
          const widget = $("turnstile-widget");
          if (widget) window.turnstile.reset(widget);
        }
      } catch (_) { /* noop */ }
    };

    const setLoading = (loading) => {
      if (!submitBtn) return;
      submitBtn.disabled = loading;
      submitBtn.classList.toggle("is-loading", loading);
      if (submitLabel) submitLabel.textContent = loading ? "enviando…" : originalLabel;
    };

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

      setLoading(true);
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
        setLoading(false);
      }
    });
  }

  // ano dinamico no footer
  const year = $("year");
  if (year) year.textContent = new Date().getFullYear();
})();
