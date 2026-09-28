/* ============================================================
   js/collections-page.js
   Collections landing — renders product grids for each
   collection key, plus the gift-set bundle grid.
   ============================================================ */

import { initPage } from "./page-init.js";
import {
  qs,
  qsa,
  formatPrice,
  escapeHtml,
  refreshIcons,
  bindImageFallbacks,
  toast,
} from "./utils.js";
import { products, getByCollection } from "./products.js";
import { bundles } from "./bundles.js";
import { addProductToCart, addBundleToCart, openCart } from "./cart.js";
import { toggle as wishlistToggle, has as inWishlist } from "./wishlist.js";
import { renderProductGrid } from "./product-card.js";

/* ============================================================
   COLLECTION → PRODUCT MATCHING
   ============================================================ */

const COLLECTION_FILTERS = {
  "best-sellers": (p) => p.flags.bestSeller,
  "new-arrivals": (p) => p.flags.newArrival,
  oud: (p) =>
    p.collections?.includes("oud") ||
    /oud/i.test(p.family + " " + p.notes.base),
  fresh: (p) =>
    /fresh|citrus|aquatic/i.test(p.family) || p.collections?.includes("fresh"),
  floral: (p) => /floral/i.test(p.family) || p.collections?.includes("floral"),
  woody: (p) =>
    /woody|leather|aromatic/i.test(p.family) ||
    p.collections?.includes("woody"),
  unisex: (p) => p.category === "Unisex",
};

/* ============================================================
   RENDER: COLLECTION GRIDS
   ============================================================ */

const renderCollections = () => {
  const grids = qsa("[data-collection-grid]");

  grids.forEach((grid) => {
    const key = grid.dataset.collectionGrid;
    const filter = COLLECTION_FILTERS[key];
    if (!filter) {
      grid.innerHTML =
        '<p class="collection-empty">Collection not configured.</p>';
      return;
    }

    const list = products.filter(filter);

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <i data-lucide="package-x"></i>
          <h3>Nothing here yet</h3>
          <p>We are still composing in this direction. Check back soon.</p>
        </div>
      `;
      refreshIcons(grid);
      return;
    }

    // Limit to 8 items per collection to keep the page tight
    renderProductGrid(grid, list.slice(0, 8));
  });
};

/* ============================================================
   RENDER: BUNDLES (Gift Sets)
   ============================================================ */

const renderBundle = (bundle) => {
  const onSale = bundle.comparePrice && bundle.comparePrice > bundle.price;
  const off = onSale
    ? Math.round(
        ((bundle.comparePrice - bundle.price) / bundle.comparePrice) * 100,
      )
    : 0;
  const inStock = bundle.availability === "in-stock";

  return `
    <article class="bundle-card" data-bundle-id="${escapeHtml(bundle.id)}">
      <div class="bundle-card__media">
        <img src="${escapeHtml(bundle.images[0])}"
             alt="${escapeHtml(bundle.name)} — ${escapeHtml(bundle.tagline)}"
             loading="lazy"
             data-fallback-name="${escapeHtml(bundle.name)}" />
        ${onSale ? `<span class="bundle-card__badge">Save ${off}%</span>` : ""}
      </div>

      <div class="bundle-card__body">
        <p class="bundle-card__tagline">${escapeHtml(bundle.tagline)}</p>
        <h3 class="bundle-card__title">${escapeHtml(bundle.name)}</h3>
        <p class="bundle-card__desc">${escapeHtml(bundle.description)}</p>

        <ul class="bundle-card__includes">
          ${bundle.includes
            .map(
              (item) => `
            <li><i data-lucide="check"></i><span>${escapeHtml(item)}</span></li>
          `,
            )
            .join("")}
        </ul>

        <div class="bundle-card__price">
          <span class="price ${onSale ? "price--sale" : ""}">${formatPrice(bundle.price)}</span>
          ${onSale ? `<span class="price--old">${formatPrice(bundle.comparePrice)}</span>` : ""}
        </div>

        <div class="bundle-card__actions">
          <button class="btn btn--gold btn--block"
                  type="button"
                  data-bundle-add="${escapeHtml(bundle.id)}"
                  ${!inStock ? "disabled" : ""}>
            <i data-lucide="shopping-bag"></i>
            ${inStock ? "Add Set To Bag" : "Sold Out"}
          </button>
          <a class="bundle-card__link"
             href="shop.html?family=Gift+Sets">
            View Details <i data-lucide="arrow-right"></i>
          </a>
        </div>
      </div>
    </article>
  `;
};

const renderBundles = () => {
  const host = qs("[data-bundle-grid]");
  if (!host) return;

  if (!bundles.length) {
    host.innerHTML = '<p class="collection-empty">No bundles available.</p>';
    return;
  }

  host.innerHTML = bundles.map(renderBundle).join("");
  refreshIcons(host);
  bindImageFallbacks(host);
};

/* ============================================================
   EVENTS: BUNDLE ADD
   ============================================================ */

const initBundleActions = () => {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bundle-add]");
    if (!btn) return;
    e.preventDefault();

    const id = btn.dataset.bundleAdd;
    const ok = addBundleToCart(id);
    if (ok) openCart();
  });
};

/* ============================================================
   SMOOTH ANCHOR SCROLL WITH HEADER OFFSET
   ============================================================ */

const initAnchorScroll = () => {
  // Handle initial hash on page load
  if (window.location.hash) {
    const id = window.location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      setTimeout(() => {
        const top = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: "smooth" });
      }, 200);
    }
  }

  // Handle jump nav clicks
  qsa(".col-jump a").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href?.startsWith("#")) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState({}, "", href);
    });
  });
};

/* ============================================================
   NEWSLETTER
   ============================================================ */

const initNewsletter = async () => {
  const { isEmail } = await import("./utils.js");
  const { storage } = await import("./storage.js");

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

    list.push({ email, source: "collections", date: new Date().toISOString() });
    storage.set(storage.keys.newsletter, list);

    setMsg("Thank you. You are on the list.", "success");
    input.value = "";
    toast("Subscribed to the fragrance journal", "success");
  });
};

/* ============================================================
   BOOT
   ============================================================ */

initPage({
  accordions: false,
  counters: false,

  afterReady: () => {
    renderCollections();
    renderBundles();
    initBundleActions();
    initAnchorScroll();
    initNewsletter();

    // Re-observe reveals for freshly rendered grids
    window.dispatchEvent(new CustomEvent("rs:content-updated"));
  },
});
