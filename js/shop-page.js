/* ============================================================
   js/shop-page.js
   Entry point for shop.html — reuses the shared app modules
   and initialises the filter engine.
   ============================================================ */

import { initTheme } from "./theme.js";
import { initCart } from "./cart.js";
import { initWishlist } from "./wishlist.js";
import { renderHeader } from "./header.js";
import { renderFooter } from "./footer.js";
import { initSearch } from "./search.js";
import { initProductCards } from "./product-card.js";
import { initShop } from "./filters.js";
import {
  qs,
  observeReveals,
  bindImageFallbacks,
  refreshIcons,
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

/* ---------- Scrim (mobile nav & cart & filters share it) ---------- */
const initScrim = () => {
  const scrim = qs("[data-scrim]");
  if (!scrim) return;

  scrim.addEventListener("click", () => {
    const mobileNav = qs("[data-mobile-nav]");
    const cartDrawer = qs("[data-cart-drawer]");
    const filters = qs("[data-filters-panel]");

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
    if (filters?.classList.contains("is-open")) {
      filters.classList.remove("is-open");
      anyOpen = true;
    }

    if (anyOpen) {
      scrim.classList.remove("is-open");
      unlockScroll();
    }
  });
};

/* ---------- Global reveal + fallback handling ---------- */
const initPolish = () => {
  observeReveals();
  bindImageFallbacks();

  window.addEventListener("rs:content-updated", () => {
    observeReveals();
    bindImageFallbacks();
  });
};

/* ---------- Boot ---------- */
const boot = () => {
  initTheme();
  renderHeader();
  renderFooter();

  initCart();
  initWishlist();
  initSearch();
  initProductCards();
  initScrim();
  initBackToTop();

  initShop();

  initPolish();
  refreshIcons();

  window.dispatchEvent(new CustomEvent("rs:ready"));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
