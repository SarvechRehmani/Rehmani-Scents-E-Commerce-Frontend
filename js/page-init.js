/* ============================================================
   js/page-init.js
   Shared bootstrap for content pages (About, Contact, FAQ,
   Blog, Policies, 404, etc.). Extracts the common setup so
   each page's own JS stays tiny and focused.
   ============================================================ */

import { initTheme } from "./theme.js";
import { initCart, openCart } from "./cart.js";
import { initWishlist } from "./wishlist.js";
import { renderHeader } from "./header.js";
import { renderFooter } from "./footer.js";
import { initSearch } from "./search.js";
import { initProductCards } from "./product-card.js";
import {
  qs,
  qsa,
  on,
  refreshIcons,
  bindImageFallbacks,
  observeReveals,
  lockScroll,
  unlockScroll,
  debounce,
} from "./utils.js";

/* ---------- Back to top ---------- */
const initBackToTop = () => {
  const btn = qs("[data-to-top]");
  if (!btn) return;

  const onScroll = () =>
    btn.classList.toggle("is-visible", window.scrollY > 600);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

/* ---------- Scrim (mobile nav + cart drawer) ---------- */
const initScrim = () => {
  const scrim = qs("[data-scrim]");
  if (!scrim) return;

  scrim.addEventListener("click", () => {
    const mobileNav = qs("[data-mobile-nav]");
    const cartDrawer = qs("[data-cart-drawer]");
    let anyOpen = false;

    if (mobileNav?.classList.contains("is-open")) {
      mobileNav.classList.remove("is-open");
      mobileNav.setAttribute("aria-hidden", "true");
      anyOpen = true;
    }
    if (cartDrawer?.classList.contains("is-open")) {
      cartDrawer.classList.remove("is-open");
      cartDrawer.setAttribute("aria-hidden", "true");
      anyOpen = true;
    }
    if (anyOpen) {
      scrim.classList.remove("is-open");
      unlockScroll();
    }
  });
};

/* ---------- Generic accordion (single-open) ---------- */
export const initAccordion = (root = document) => {
  const containers = qsa(".accordion", root);
  if (!containers.length) return;

  containers.forEach((container) => {
    qsa(".accordion__trigger", container).forEach((trigger) => {
      if (trigger.dataset.accordionBound === "1") return;
      trigger.dataset.accordionBound = "1";

      trigger.addEventListener("click", () => {
        const expanded = trigger.getAttribute("aria-expanded") === "true";
        const panel = trigger.nextElementSibling;
        if (!panel) return;

        // Close others in this accordion
        qsa(".accordion__trigger", container).forEach((t) => {
          if (t !== trigger && t.getAttribute("aria-expanded") === "true") {
            t.setAttribute("aria-expanded", "false");
            const p = t.nextElementSibling;
            if (p) p.style.height = "0px";
          }
        });

        if (expanded) {
          panel.style.height = panel.scrollHeight + "px";
          requestAnimationFrame(() => {
            panel.style.height = "0px";
          });
          trigger.setAttribute("aria-expanded", "false");
        } else {
          panel.style.height = panel.scrollHeight + "px";
          trigger.setAttribute("aria-expanded", "true");
          setTimeout(() => {
            if (trigger.getAttribute("aria-expanded") === "true") {
              panel.style.height = "auto";
            }
          }, 340);
        }
      });
    });
  });
};

/* ---------- Number counter animation ---------- */
export const animateCounters = (root = document) => {
  const counters = qsa("[data-count-to]", root);
  if (!counters.length) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const runCounter = (el) => {
    const target = Number(el.dataset.countTo) || 0;
    const suffix = el.dataset.countSuffix || "";
    const prefix = el.dataset.countPrefix || "";
    const duration = Number(el.dataset.countDuration) || 1400;

    if (reduceMotion) {
      el.textContent = prefix + target.toLocaleString("en-PK") + suffix;
      return;
    }

    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);
      el.textContent = prefix + current.toLocaleString("en-PK") + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toLocaleString("en-PK") + suffix;
    };
    requestAnimationFrame(tick);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(runCounter);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 },
  );

  counters.forEach((c) => io.observe(c));
};

/* ---------- Scroll progress for a page rail ---------- */
export const initScrollRail = (selector = ".scroll-rail") => {
  const rail = qs(selector);
  if (!rail) return;

  const update = () => {
    const rect = rail.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const scrolled = Math.max(0, -rect.top);
    const progress = total > 0 ? Math.min(1, scrolled / total) : 0;
    rail.style.setProperty("--scroll-progress", progress.toFixed(3));
  };

  update();
  window.addEventListener("scroll", debounce(update, 40), { passive: true });
  window.addEventListener("resize", debounce(update, 120));
};

/* ============================================================
   MAIN INIT
   ============================================================ */
export const initPage = (options = {}) => {
  const {
    accordions = true,
    counters = true,
    beforeReady = null,
    afterReady = null,
  } = options;

  const boot = () => {
    // Core UI
    initTheme();
    renderHeader();
    renderFooter();

    initCart();
    initWishlist();
    initSearch();
    initProductCards();
    initScrim();
    initBackToTop();

    // Observers
    observeReveals();
    bindImageFallbacks();

    // Extras
    if (accordions) initAccordion();
    if (counters) animateCounters();

    // Hook before the ready event
    if (typeof beforeReady === "function") beforeReady();

    // Re-run on dynamic content
    window.addEventListener("rs:content-updated", () => {
      observeReveals();
      bindImageFallbacks();
      if (accordions) initAccordion();
      if (counters) animateCounters();
    });

    refreshIcons();
    window.dispatchEvent(new CustomEvent("rs:ready"));

    if (typeof afterReady === "function") afterReady();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
};
