(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initNav();
  initFadeIn();
  initChaos();
  initPricingToggle();
  initFooterYear();

  /* Navbar gets more opaque once the page scrolls. */
  function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;

    const update = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* Elements with .fade-in appear when they scroll into view. */
  function initFadeIn() {
    const elements = document.querySelectorAll(".fade-in");
    const tags = document.querySelectorAll("#ai-tags .tag");

    const reveal = (el) => {
      el.classList.add("is-visible");
      if (el.classList.contains("editor")) showTags(tags);
    };

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach(reveal);
      tags.forEach((tag) => tag.classList.add("is-shown"));
      return;
    }

    // The hero is the first thing on screen, so it fades in on load, not on scroll.
    const heroElements = document.querySelectorAll(".hero .fade-in");
    requestAnimationFrame(() => heroElements.forEach(reveal));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    elements.forEach((el) => {
      if (!el.closest(".hero")) observer.observe(el);
    });
  }

  /* The AI tags pop in one by one, as if being generated. */
  function showTags(tags) {
    tags.forEach((tag, i) => {
      setTimeout(() => tag.classList.add("is-shown"), 500 + i * 220);
    });
  }

  /* Floating icons that drift, bounce off the walls and flee the cursor. */
  function initChaos() {
    const box = document.getElementById("chaos");
    if (!box) return;

    const SIZE = 52;
    const BASE_SPEED = 0.6;
    const REPEL_RADIUS = 110;
    const REPEL_FORCE = 0.9;
    const MAX_SPEED = 6;

    let width = box.clientWidth;
    let height = box.clientHeight;
    const pointer = { x: 0, y: 0, active: false };

    const icons = Array.from(box.querySelectorAll(".chaos__icon")).map((el, i, all) => {
      const angle = Math.random() * Math.PI * 2;
      // Spread the starting points on a loose grid so icons don't overlap at first.
      const cols = 4;
      const cellW = width / cols;
      const cellH = height / Math.ceil(all.length / cols);
      return {
        el,
        x: (i % cols) * cellW + Math.random() * Math.max(cellW - SIZE, 0),
        y: Math.floor(i / cols) * cellH + Math.random() * Math.max(cellH - SIZE, 0),
        vx: Math.cos(angle) * BASE_SPEED,
        vy: Math.sin(angle) * BASE_SPEED,
        rotation: Math.random() * 30 - 15,
        spin: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const render = (icon, scale) => {
      icon.el.style.transform =
        `translate(${icon.x}px, ${icon.y}px) rotate(${icon.rotation}deg) scale(${scale})`;
    };

    if (prefersReducedMotion) {
      icons.forEach((icon) => render(icon, 1));
      return;
    }

    box.addEventListener("pointermove", (event) => {
      const rect = box.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });
    box.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    window.addEventListener("resize", () => {
      width = box.clientWidth;
      height = box.clientHeight;
    });

    // Only animate while the box is on screen.
    let visible = true;
    let frame = 0;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !frame) frame = requestAnimationFrame(tick);
      }).observe(box);
    }

    function step(icon, time) {
      if (pointer.active) {
        const dx = icon.x + SIZE / 2 - pointer.x;
        const dy = icon.y + SIZE / 2 - pointer.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < REPEL_RADIUS) {
          const push = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
          icon.vx += (dx / dist) * push;
          icon.vy += (dy / dist) * push;
        }
      }

      // Ease back towards the drifting speed after being pushed.
      const speed = Math.hypot(icon.vx, icon.vy) || 1;
      const target = speed > BASE_SPEED ? Math.max(BASE_SPEED, speed * 0.97) : BASE_SPEED;
      const limited = Math.min(target, MAX_SPEED);
      icon.vx = (icon.vx / speed) * limited;
      icon.vy = (icon.vy / speed) * limited;

      icon.x += icon.vx;
      icon.y += icon.vy;

      const maxX = width - SIZE;
      const maxY = height - SIZE;
      if (icon.x <= 0 || icon.x >= maxX) {
        icon.x = Math.min(Math.max(icon.x, 0), maxX);
        icon.vx *= -1;
        icon.spin *= -1;
      }
      if (icon.y <= 0 || icon.y >= maxY) {
        icon.y = Math.min(Math.max(icon.y, 0), maxY);
        icon.vy *= -1;
      }

      icon.rotation += icon.spin;
      if (Math.abs(icon.rotation) > 20) icon.spin *= -1;

      render(icon, 1 + Math.sin(time / 900 + icon.phase) * 0.06);
    }

    function tick(time) {
      if (!visible) {
        frame = 0;
        return;
      }
      icons.forEach((icon) => step(icon, time));
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
  }

  /* Monthly / yearly toggle for the Pro plan. */
  function initPricingToggle() {
    const toggle = document.getElementById("billing-toggle");
    const price = document.getElementById("pro-price");
    const period = document.getElementById("pro-period");
    const note = document.getElementById("pro-note");
    const labels = document.querySelectorAll("[data-billing-label]");
    if (!toggle || !price || !period || !note) return;

    const PLANS = {
      monthly: { price: "$8", period: "/month", note: "Billed monthly." },
      yearly: { price: "$72", period: "/year", note: "Billed yearly. That's $6 a month." },
    };

    const apply = (yearly) => {
      const plan = yearly ? PLANS.yearly : PLANS.monthly;
      toggle.setAttribute("aria-checked", String(yearly));
      price.textContent = plan.price;
      period.textContent = plan.period;
      note.textContent = plan.note;
      labels.forEach((label) => {
        label.classList.toggle("is-active", (label.dataset.billingLabel === "yearly") === yearly);
      });
    };

    toggle.addEventListener("click", () => {
      apply(toggle.getAttribute("aria-checked") !== "true");
    });

    // Clicking a label selects that period.
    labels.forEach((label) => {
      label.addEventListener("click", () => apply(label.dataset.billingLabel === "yearly"));
    });
  }

  function initFooterYear() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }
})();
