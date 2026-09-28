/* ============================================================
   js/main.js
   App bootstrap — initialises shared UI and homepage features.
   Homepage-only logic is guarded by element presence.
   ============================================================ */

import { CONFIG } from "./config.js";
import {
  getProducts,
  getBestSellers,
  getNewArrivals,
  getByCollection,
} from "./product-store.js";

import {
  qs,
  qsa,
  on,
  refreshIcons,
  bindImageFallbacks,
  observeReveals,
  toast,
  isEmail,
  debounce,
  lockScroll,
  unlockScroll,
  formatPrice,
  escapeHtml,
} from "./utils.js";
import { storage } from "./storage.js";
import { initTheme } from "./theme.js";
import { initWishlist } from "./wishlist.js";
import { initCart } from "./cart.js";
import { renderHeader } from "./header.js";
import { renderFooter } from "./footer.js";
import { initSearch } from "./search.js";
import {
  initProductCards,
  renderProductGrid,
  renderProductRail,
} from "./product-card.js";

/* ============================================================
   HOME — HERO SLIDER
   ============================================================ */
const initHero = () => {
  const hero = qs("#hero");
  if (!hero) return;

  const slides = qsa("[data-hero-slide]", hero);
  const dotsHost = qs("[data-hero-dots]", hero);
  if (slides.length < 2) return;

  let index = 0;
  let timer = null;
  const INTERVAL = 6200;

  // Dots
  if (dotsHost) {
    dotsHost.innerHTML = slides
      .map(
        (_, i) => `
      <button class="hero__dot ${i === 0 ? "is-active" : ""}"
              type="button"
              role="tab"
              aria-label="Slide ${i + 1}"
              data-hero-dot="${i}"></button>
    `,
      )
      .join("");
  }

  const go = (next) => {
    const target = (next + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === target));
    qsa("[data-hero-dot]", hero).forEach((d, i) =>
      d.classList.toggle("is-active", i === target),
    );
    index = target;
  };

  const start = () => {
    stop();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = setInterval(() => go(index + 1), INTERVAL);
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  on(qs("[data-hero-next]", hero), "click", () => {
    go(index + 1);
    start();
  });
  on(qs("[data-hero-prev]", hero), "click", () => {
    go(index - 1);
    start();
  });
  on(dotsHost, "click", (e) => {
    const dot = e.target.closest("[data-hero-dot]");
    if (!dot) return;
    go(Number(dot.dataset.heroDot));
    start();
  });

  // Pause on hover
  on(hero, "mouseenter", stop);
  on(hero, "mouseleave", start);

  // Pause when tab hidden
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : start(),
  );

  start();
};

/* ============================================================
   HOME — FEATURED FRAGRANCE (Vayron)
   ============================================================ */
const initFeatured = () => {
  const section = qs(".featured");
  if (!section) return;

  const product = getProducts().find((p) => p.id === "vayron");
  if (!product) return;

  const base = product.volumes[0];
  const set = (sel, val) => {
    const node = qs(sel);
    if (node) node.textContent = val;
  };

  set("[data-featured-name]", product.name);
  set("[data-featured-family]", product.family);
  set("[data-featured-desc]", product.shortDescription);
  set("[data-featured-top]", product.notes.top);
  set("[data-featured-heart]", product.notes.heart);
  set("[data-featured-base]", product.notes.base);
  set("[data-featured-price]", formatPrice(base.price));

  const link = qs("[data-featured-link]");
  if (link) link.href = `product.html?id=${product.id}`;

  const img = qs("[data-featured-image]");
  if (img) {
    img.src = product.images[0];
    img.alt = `${product.name} — ${product.family} fragrance`;
    img.dataset.fallbackName = product.name;
  }

  const addBtn = qs("[data-featured-add]");
  on(addBtn, "click", async () => {
    const { addProductToCart } = await import("./cart.js");
    addProductToCart(product.id);
  });
};

/* ============================================================
   HOME — PRODUCT GRIDS
   ============================================================ */
const initHomeGrids = () => {
  qsa("[data-product-grid]").forEach((container) => {
    const key = container.dataset.productGrid;
    const limit = Number(container.dataset.limit) || undefined;

    let list = [];
    if (key === "best-sellers") list = getBestSellers();
    else if (key === "new-arrivals") list = getNewArrivals();
    else list = getProducts();

    renderProductGrid(container, list, { limit });
  });
};

/* ============================================================
   HOME — FRAGRANCE FINDER
   ============================================================ */
const FINDER_MAP = {
  fresh: {
    label: "Fresh & Citrusy",
    filter: (p) => /fresh|citrus|aquatic/i.test(p.family),
  },
  woody: {
    label: "Woody & Masculine",
    filter: (p) => /woody|leather|aromatic/i.test(p.family),
  },
  sweet: {
    label: "Sweet & Warm",
    filter: (p) => /amber|oriental|spicy/i.test(p.family),
  },
  floral: {
    label: "Floral & Elegant",
    filter: (p) => /floral/i.test(p.family),
  },
  oud: {
    label: "Oud & Intense",
    filter: (p) => /oud|oriental/i.test(p.family) || /oud/i.test(p.notes.base),
  },
};

const initFinder = () => {
  const host = qs("[data-finder-results]");
  const buttons = qsa("[data-finder]");
  if (!host || !buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.finder;
      const config = FINDER_MAP[key];
      if (!config) return;

      buttons.forEach((b) => b.classList.toggle("is-active", b === btn));

      const matches = getProducts().filter(config.filter).slice(0, 4);

      if (!matches.length) {
        host.innerHTML = `
          <div class="empty-state">
            <i data-lucide="search-x"></i>
            <h3>Nothing matches that yet</h3>
            <p>We&rsquo;re still composing in that direction. Try another preference.</p>
          </div>
        `;
        refreshIcons(host);
        return;
      }

      host.innerHTML = `
        <p class="section-label" style="margin-bottom:1.4rem">
          Recommended for ${escapeHtml(config.label)} &mdash; ${matches.length} fragrance${matches.length > 1 ? "s" : ""}
        </p>
        <div class="product-grid" data-columns="4"></div>
      `;
      const grid = qs(".product-grid", host);
      renderProductGrid(grid, matches);
    });
  });
};

/* ============================================================
   HOME — REVIEWS CAROUSEL
   ============================================================ */
const initReviews = () => {
  const track = qs("[data-reviews-track]");
  if (!track) return;

  const prev = qs("[data-reviews-prev]");
  const next = qs("[data-reviews-next]");

  // Populate from CONFIG if track is empty
  if (!track.children.length) {
    track.innerHTML = CONFIG.demoReviews
      .map(
        (r) => `
      <article class="review-card">
        <div class="stars" aria-label="${r.rating} out of 5 stars">
          ${Array.from({ length: 5 }, () => `<i data-lucide="star"></i>`).join(
            "",
          )}
        </div>
        <p class="review-card__text">&ldquo;${escapeHtml(r.text)}&rdquo;</p>
        <footer class="review-card__meta">
          <span class="review-card__name">Demo &mdash; ${escapeHtml(r.name)}</span>
          <span class="review-card__product">On ${escapeHtml(r.product)}</span>
        </footer>
      </article>
    `,
      )
      .join("");
    refreshIcons(track);
  }

  let index = 0;
  const perView = () => {
    const w = window.innerWidth;
    if (w <= 560) return 1;
    if (w <= 1024) return 2;
    return 3;
  };
  const cardCount = () => track.children.length;
  const maxIndex = () => Math.max(0, cardCount() - perView());

  const render = () => {
    const card = track.children[0];
    if (!card) return;
    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap) || 0;
    const width = card.getBoundingClientRect().width + gap;
    track.style.transform = `translateX(${-index * width}px)`;
  };

  const step = (delta) => {
    index = Math.max(0, Math.min(maxIndex(), index + delta));
    render();
  };

  on(prev, "click", () => step(-1));
  on(next, "click", () => step(1));

  window.addEventListener(
    "resize",
    debounce(() => {
      index = Math.min(index, maxIndex());
      render();
    }, 150),
  );

  render();
};

/* ============================================================
   HOME — NEWSLETTER
   ============================================================ */
const initNewsletter = () => {
  const form = qs("[data-newsletter]");
  if (!form) return;

  const input = qs('input[type="email"]', form);
  const msg = qs("[data-newsletter-msg]");
  if (!input || !msg) return;

  const setMsg = (text, type = "") => {
    msg.textContent = text;
    msg.className = `newsletter__note ${type ? "is-" + type : ""}`;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = input.value.trim();

    if (!email) {
      setMsg("Please enter your email address.", "error");
      input.focus();
      return;
    }
    if (!isEmail(email)) {
      setMsg("That email doesn&rsquo;t look right.", "error");
      input.focus();
      return;
    }

    const existing = storage.get(storage.keys.newsletter, []);
    const list = Array.isArray(existing) ? existing : [];
    if (list.some((entry) => entry.email === email)) {
      setMsg("You are already on the list.", "success");
      input.value = "";
      return;
    }

    list.push({ email, date: new Date().toISOString() });
    storage.set(storage.keys.newsletter, list);

    setMsg("Thank you. You are on the list.", "success");
    input.value = "";
    toast("Subscribed to the fragrance journal", "success");
  });
};

/* ============================================================
   GLOBAL — Back to top
   ============================================================ */
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

/* ============================================================
   GLOBAL — Reveal observer + image fallbacks
   ============================================================ */
const initGlobalPolish = () => {
  observeReveals();
  bindImageFallbacks();

  // Re-observe when dynamic content is injected
  window.addEventListener("rs:content-updated", () => {
    observeReveals();
    bindImageFallbacks();
  });
};

/* ============================================================
   GLOBAL — Scrim interactions for mobile nav & cart drawer
   (shared single scrim already in the DOM)
   ============================================================ */
const initScrim = () => {
  const scrim = qs("[data-scrim]");
  if (!scrim) return;

  scrim.addEventListener("click", () => {
    const mobileNav = qs("[data-mobile-nav]");
    const cartDrawer = qs("[data-cart-drawer]");
    if (mobileNav?.classList.contains("is-open")) {
      mobileNav.classList.remove("is-open");
      mobileNav.setAttribute("aria-hidden", "true");
      scrim.classList.remove("is-open");
      unlockScroll();
    }
    if (cartDrawer?.classList.contains("is-open")) {
      cartDrawer.classList.remove("is-open");
      cartDrawer.setAttribute("aria-hidden", "true");
      scrim.classList.remove("is-open");
      unlockScroll();
    }
  });
};

/* ============================================================
   BOOTSTRAP
   ============================================================ */
const boot = () => {
  // Theme must go first so header icons render correctly
  initTheme();
  renderHeader();
  renderFooter();

  // Cart + wishlist state
  initCart();
  initWishlist();

  // Shared UI
  initSearch();
  initProductCards();
  initScrim();
  initBackToTop();

  // Homepage sections (each guarded by element presence)
  initHero();
  initHomeGrids();
  initFeatured();
  initFinder();
  initReviews();
  initNewsletter();

  // Final polish
  initGlobalPolish();

  // Signal that content is ready
  window.dispatchEvent(new CustomEvent("rs:ready"));

  // Redraw Lucide once more after all injection
  refreshIcons();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
