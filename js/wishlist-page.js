/* ============================================================
   js/wishlist-page.js
   Wishlist page — reads ids from wishlist.js, renders cards,
   handles per-item add to cart / remove, bulk actions.
   ============================================================ */

import { initPage } from "./page-init.js";
import {
  qs,
  qsa,
  on,
  formatPrice,
  discountPercent,
  escapeHtml,
  refreshIcons,
  bindImageFallbacks,
  toast,
} from "./utils.js";
import {
  getItems,
  remove as wishlistRemove,
  clear as wishlistClear,
  add as wishlistAdd,
} from "./wishlist.js";
import { addProductToCart, openCart } from "./cart.js";
import { renderProductRail } from "./product-card.js";
import { products, getProductById, getRelated } from "./products.js";

/* ============================================================
   RENDER: CARD
   ============================================================ */

const renderCard = (product) => {
  if (!product) return "";

  const base = product.volumes[0];
  const onSale = base.comparePrice && base.comparePrice > base.price;
  const off = onSale ? discountPercent(base.price, base.comparePrice) : 0;
  const inStock = product.availability === "in-stock";
  const href = `product.html?id=${encodeURIComponent(product.id)}`;

  return `
    <li class="wishlist-card" data-wishlist-item="${escapeHtml(product.id)}">

      <div class="wishlist-card__media">
        <a href="${href}" aria-label="View ${escapeHtml(product.name)}">
          <img src="${escapeHtml(product.images[0])}"
               alt="${escapeHtml(product.name)} — ${escapeHtml(product.family)} fragrance"
               loading="lazy"
               data-fallback-name="${escapeHtml(product.name)}" />
        </a>

        ${onSale ? `<span class="wishlist-card__badge">−${off}%</span>` : ""}

        <button class="wishlist-card__remove"
                type="button"
                data-wishlist-item-remove="${escapeHtml(product.id)}"
                aria-label="Remove ${escapeHtml(product.name)} from wishlist">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="wishlist-card__body">
        <p class="wishlist-card__cat">${escapeHtml(product.category)}</p>
        <h3 class="wishlist-card__title">
          <a href="${href}">${escapeHtml(product.name)}</a>
        </h3>
        <p class="wishlist-card__family">${escapeHtml(product.family)}</p>

        <div class="wishlist-card__rating">
          <span class="stars stars--sm" aria-hidden="true">
            <i data-lucide="star"></i><i data-lucide="star"></i>
            <i data-lucide="star"></i><i data-lucide="star"></i>
            <i data-lucide="star"></i>
          </span>
          <span>${product.rating.toFixed(1)} · ${product.reviewCount}</span>
        </div>

        <div class="wishlist-card__price">
          <span class="price ${onSale ? "price--sale" : ""}">${formatPrice(base.price)}</span>
          ${onSale ? `<span class="price--old">${formatPrice(base.comparePrice)}</span>` : ""}
        </div>

        <div class="wishlist-card__actions">
          <button class="btn btn--gold"
                  type="button"
                  data-wishlist-item-add="${escapeHtml(product.id)}"
                  ${!inStock ? "disabled" : ""}>
            <i data-lucide="shopping-bag"></i>
            ${inStock ? "Add To Bag" : "Sold Out"}
          </button>

          <a class="wishlist-card__details" href="${href}">
            <i data-lucide="eye"></i>
            View Details
          </a>
        </div>
      </div>
    </li>
  `;
};

/* ============================================================
   RENDER: MAIN
   ============================================================ */

const renderWishlist = () => {
  const empty = qs("[data-wishlist-empty]");
  const main = qs("[data-wishlist-main]");
  const grid = qs("[data-wishlist-grid]");
  const countEl = qs("[data-wishlist-count]");
  const countLabelEl = qs("[data-wishlist-count-label]");
  const heroCount = qs("[data-wishlist-page-count]");
  const recommendedSection = qs("[data-wishlist-recommended]");

  const items = getItems();
  const n = items.length;

  // Page count in hero
  if (heroCount) {
    heroCount.innerHTML = `<strong>${n}</strong> saved`;
  }

  // Empty vs filled
  if (!n) {
    if (empty) {
      empty.hidden = false;
      refreshIcons(empty);
    }
    if (main) main.hidden = true;
    if (recommendedSection) recommendedSection.hidden = true;
    return;
  }

  if (empty) empty.hidden = true;
  if (main) main.hidden = false;

  // Count toolbar
  if (countEl) countEl.textContent = String(n);
  if (countLabelEl) countLabelEl.textContent = n === 1 ? "item" : "items";

  // Grid
  if (grid) {
    grid.innerHTML = items.map(renderCard).join("");
    refreshIcons(grid);
    bindImageFallbacks(grid);
  }

  // Recommended
  renderRecommended(items);
};

/* ============================================================
   RECOMMENDED RAIL
   ============================================================ */

const renderRecommended = (wishlistItems) => {
  const section = qs("[data-wishlist-recommended]");
  const rail = qs("[data-wishlist-recommended-rail]");
  if (!section || !rail) return;

  const wishlistIds = new Set(wishlistItems.map((p) => p.id));

  let recs = [];

  // Prefer fragrances related to what's already in the wishlist
  if (wishlistItems.length) {
    const seed = wishlistItems[0];
    recs = getRelated(seed, 8).filter((p) => !wishlistIds.has(p.id));
  }

  // Top up with featured / best sellers
  if (recs.length < 4) {
    const extras = products
      .filter((p) => !wishlistIds.has(p.id) && !recs.find((r) => r.id === p.id))
      .filter((p) => p.flags.bestSeller || p.flags.featured)
      .slice(0, 6 - recs.length);
    recs = [...recs, ...extras];
  }

  if (!recs.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  renderProductRail(rail, recs);
};

/* ============================================================
   ACTIONS
   ============================================================ */

const handleRemove = (id) => {
  const product = getProductById(id);
  wishlistRemove(id);
  // wishlist.js emits `rs:wishlist-updated` which triggers our listener
  if (product) toast(`${product.name} removed from wishlist`);
};

const handleAddToBag = (id) => {
  const ok = addProductToCart(id);
  if (!ok) return;

  // After adding to bag, offer to remove from wishlist
  // (keeps things tidy without being too aggressive)
  const product = getProductById(id);
  if (product) {
    // Silently remove from wishlist — the toast from cart.js already fired
    wishlistRemove(id, true);
  }

  openCart();
};

const handleMoveAllToBag = () => {
  const items = getItems();
  if (!items.length) return;

  let added = 0;
  items.forEach((p) => {
    if (addProductToCart(p.id, { silent: true })) added++;
  });

  // Remove them all from wishlist
  wishlistClear();

  if (added > 0) {
    toast(`Moved ${added} ${added === 1 ? "item" : "items"} to bag`, "success");
    openCart();
  }
};

const handleClear = () => {
  const n = getItems().length;
  if (!n) return;

  const confirmed = window.confirm(
    `Remove all ${n} ${n === 1 ? "item" : "items"} from your wishlist?`,
  );
  if (!confirmed) return;

  wishlistClear();
  toast("Wishlist cleared");
};

const initActions = () => {
  // Delegated clicks within the grid
  const grid = qs("[data-wishlist-grid]");

  on(grid, "click", (e) => {
    const removeBtn = e.target.closest("[data-wishlist-item-remove]");
    if (removeBtn) {
      e.preventDefault();
      handleRemove(removeBtn.dataset.wishlistItemRemove);
      return;
    }

    const addBtn = e.target.closest("[data-wishlist-item-add]");
    if (addBtn) {
      e.preventDefault();
      handleAddToBag(addBtn.dataset.wishlistItemAdd);
      return;
    }
  });

  // Bulk actions
  on(qs("[data-wishlist-move-all]"), "click", handleMoveAllToBag);
  on(qs("[data-wishlist-clear]"), "click", handleClear);

  // React to wishlist changes from anywhere in the app
  window.addEventListener("rs:wishlist-updated", renderWishlist);
};

/* ============================================================
   BOOT
   ============================================================ */

initPage({
  accordions: false,
  counters: false,

  afterReady: () => {
    renderWishlist();
    initActions();

    // Re-observe reveals + rebind image fallbacks for freshly rendered cards
    window.dispatchEvent(new CustomEvent("rs:content-updated"));
  },
});
