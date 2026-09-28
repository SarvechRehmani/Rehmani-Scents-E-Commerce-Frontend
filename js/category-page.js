/* ============================================================
   js/category-page.js
   Shared logic for men.html / women.html / unisex.html.
   The page declares its category via <body data-category-page="men">,
   and this module reads that value to load the right products,
   spotlight product and copy variants.
   ============================================================ */

import { initTheme } from "./theme.js";
import { initCart, addProductToCart } from "./cart.js";
import { initWishlist } from "./wishlist.js";
import { renderHeader } from "./header.js";
import { renderFooter } from "./footer.js";
import { initSearch } from "./search.js";
import { initProductCards, renderProductGrid } from "./product-card.js";
import {
  qs,
  qsa,
  on,
  formatPrice,
  escapeHtml,
  refreshIcons,
  observeReveals,
  bindImageFallbacks,
  lockScroll,
  unlockScroll,
  isEmail,
  debounce,
} from "./utils.js";
import { storage } from "./storage.js";
import { getProducts, getProductById } from "./product-store.js";

/* ============================================================
   CATEGORY CONFIG
   ============================================================ */

const CATEGORY_CONFIG = {
  men: {
    slug: "men",
    label: "Men",
    title: "Men's Fragrances",
    spotlightId: "vayron",
    moods: {
      fresh: {
        label: "Fresh & Clean",
        filter: (p) => /fresh|aquatic|citrus/i.test(p.family),
      },
      woody: {
        label: "Woody & Aromatic",
        filter: (p) => /woody|aromatic/i.test(p.family),
      },
      leather: {
        label: "Leather & Spice",
        filter: (p) => /leather|spicy/i.test(p.family),
      },
      oud: {
        label: "Oud & Amber",
        filter: (p) => /amber|oriental/i.test(p.family),
      },
    },
  },

  women: {
    slug: "women",
    label: "Women",
    title: "Women's Fragrances",
    spotlightId: "velvet-bloom",
    moods: {
      floral: {
        label: "Floral & Soft",
        filter: (p) => /floral/i.test(p.family),
      },
      fruity: {
        label: "Fruity & Bright",
        filter: (p) => /fruity/i.test(p.family),
      },
      oriental: {
        label: "Amber & Oriental",
        filter: (p) => /oriental|amber|spicy/i.test(p.family),
      },
      musk: {
        label: "Musk & Skin Scents",
        filter: (p) => /musk|soft/i.test(p.family),
      },
    },
  },

  unisex: {
    slug: "unisex",
    label: "Unisex",
    title: "Unisex Fragrances",
    spotlightId: "royal-oud",
    moods: {
      fresh: {
        label: "Fresh & Clean",
        filter: (p) => /fresh|citrus|aquatic/i.test(p.family),
      },
      oud: {
        label: "Oud & Amber",
        filter: (p) => /oud|oriental|amber/i.test(p.family),
      },
      spicy: {
        label: "Spicy & Warm",
        filter: (p) => /spicy|oriental/i.test(p.family),
      },
      musk: {
        label: "Soft & Skin Scents",
        filter: (p) => /musk|soft/i.test(p.family),
      },
    },
  },
};

/* ============================================================
   STATE
   ============================================================ */

let config = null;
let categoryProducts = [];
let activeMood = null;

const readCategoryKey = () => {
  const key = document.body.dataset.categoryPage || "men";
  return CATEGORY_CONFIG[key] ? key : "men";
};

/* ============================================================
   RENDER: PRODUCT GRID
   ============================================================ */

const renderGrid = () => {
  const grid = qs("[data-category-grid]");
  const empty = qs("[data-category-empty]");
  if (!grid) return;

  const list = activeMood
    ? categoryProducts.filter(config.moods[activeMood].filter)
    : categoryProducts;

  if (!list.length) {
    grid.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      refreshIcons(empty);
    }
    return;
  }

  if (empty) empty.hidden = true;
  renderProductGrid(grid, list);
  window.dispatchEvent(new CustomEvent("rs:content-updated"));
};

/* ============================================================
   RENDER: COUNTS
   ============================================================ */

const renderCounts = () => {
  const count = categoryProducts.length;
  qsa("[data-category-count]").forEach((el) => {
    const label = count === 1 ? "1 Fragrance" : `${count} Fragrances`;
    el.textContent =
      el.classList.contains("shop-toolbar__count") || el.tagName === "STRONG"
        ? String(count)
        : label;
  });
};

/* ============================================================
   RENDER: MOOD INDICATOR
   ============================================================ */

const renderMoodIndicator = () => {
  const host = qs("[data-mood-indicator]");
  if (!host) return;

  if (!activeMood) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }

  const mood = config.moods[activeMood];
  if (!mood) {
    host.hidden = true;
    return;
  }

  host.hidden = false;
  host.innerHTML = `
    <span class="active-filters__label">Active:</span>
    <button class="chip is-active" type="button" data-mood-clear>
      ${escapeHtml(mood.label)}
      <i data-lucide="x"></i>
    </button>
  `;
  refreshIcons(host);
};

/* ============================================================
   MOOD BUTTONS
   ============================================================ */

const setMood = (key) => {
  activeMood = activeMood === key ? null : key;
  qsa("[data-mood]").forEach((btn) =>
    btn.classList.toggle("is-active", btn.dataset.mood === activeMood),
  );
  renderGrid();
  renderMoodIndicator();

  if (window.innerWidth < 768 && activeMood) {
    const grid = qs(".category-products");
    const top = (grid?.offsetTop || 0) - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }
};

const clearMood = () => {
  activeMood = null;
  qsa("[data-mood]").forEach((btn) => btn.classList.remove("is-active"));
  renderGrid();
  renderMoodIndicator();
};

/* ============================================================
   SPOTLIGHT
   ============================================================ */

const initSpotlight = () => {
  const spotlight = getProductById(config.spotlightId);
  if (!spotlight) return;

  const base = spotlight.volumes[0];
  const set = (sel, val) => {
    const node = qs(sel);
    if (node) node.textContent = val;
  };

  set("[data-spotlight-name]", spotlight.name);
  set("[data-spotlight-family]", spotlight.family);
  set("[data-spotlight-desc]", spotlight.shortDescription);
  set("[data-spotlight-top]", spotlight.notes.top);
  set("[data-spotlight-heart]", spotlight.notes.heart);
  set("[data-spotlight-base]", spotlight.notes.base);
  set("[data-spotlight-price]", formatPrice(base.price));

  const link = qs("[data-spotlight-link]");
  if (link) link.href = `product.html?id=${spotlight.id}`;

  const img = qs("[data-spotlight-image]");
  if (img) {
    img.src = spotlight.images[0];
    img.alt = `${spotlight.name} — ${spotlight.family} fragrance`;
    img.dataset.fallbackName = spotlight.name;
  }

  const addBtn = qs("[data-spotlight-add]");
  on(addBtn, "click", () => addProductToCart(spotlight.id));
};

/* ============================================================
   ACCORDION (Wearing Guide)
   ============================================================ */

const initAccordion = () => {
  const root = qs("[data-guide-accordion]");
  if (!root) return;

  qsa(".accordion__trigger", root).forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      const panel = trigger.nextElementSibling;
      const inner = panel?.querySelector(".accordion__inner");
      if (!panel || !inner) return;

      // Close others in this accordion
      qsa(".accordion__trigger", root).forEach((t) => {
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
};

/* ============================================================
   NEWSLETTER
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
      setMsg("That email doesn\u2019t look right.", "error");
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

    list.push({ email, source: config.slug, date: new Date().toISOString() });
    storage.set(storage.keys.newsletter, list);

    setMsg("Thank you. You are on the list.", "success");
    input.value = "";
    import("./utils.js").then(({ toast }) =>
      toast("Subscribed to the fragrance journal", "success"),
    );
  });
};

/* ============================================================
   BACK TO TOP
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
   SCRIM
   ============================================================ */

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

/* ============================================================
   BOOT
   ============================================================ */

const boot = () => {
  const key = readCategoryKey();
  config = CATEGORY_CONFIG[key];

  // Filter products for this category
  categoryProducts = getProducts().filter(
    (p) => p.category.toLowerCase() === config.label.toLowerCase(),
  );

  // Shared setup
  initTheme();
  renderHeader();
  renderFooter();

  initCart();
  initWishlist();
  initSearch();
  initProductCards();
  initScrim();
  initBackToTop();

  observeReveals();
  bindImageFallbacks();

  // Category-specific rendering
  renderCounts();
  renderGrid();
  initSpotlight();
  initAccordion();
  initNewsletter();

  // Mood buttons
  qsa("[data-mood]").forEach((btn) => {
    btn.addEventListener("click", () => setMood(btn.dataset.mood));
  });

  // Mood clear (delegated)
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-mood-clear]")) {
      e.preventDefault();
      clearMood();
    }
  });

  // Re-run observers on dynamic content
  window.addEventListener("rs:content-updated", () => {
    observeReveals();
    bindImageFallbacks();
  });

  refreshIcons();
  window.dispatchEvent(
    new CustomEvent("rs:ready", { detail: { category: config.slug } }),
  );
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
