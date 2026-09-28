/* ============================================================
   js/product-card.js
   Renders product cards + grids, and handles delegation for
   wishlist / quick add / quick view.
   ============================================================ */

import {
  qs,
  qsa,
  formatPrice,
  discountPercent,
  escapeHtml,
  refreshIcons,
  bindImageFallbacks,
} from "./utils.js";
import { addProductToCart } from "./cart.js";
import { toggle as wishlistToggle, has as wishlistHas } from "./wishlist.js";
import { getRelated } from "./product-store.js";

/* ---------- Single card ---------- */
export const renderProductCard = (product) => {
  if (!product) return "";

  const base = product.volumes[0];
  const sale = base.comparePrice && base.comparePrice > base.price;
  const off = sale ? discountPercent(base.price, base.comparePrice) : 0;
  const inStock = product.availability === "in-stock";
  const liked = wishlistHas(product.id);

  return `
    <article class="product-card" data-product-id="${escapeHtml(product.id)}">
      <div class="product-card__media">
        <div class="product-card__badges">
          ${sale ? `<span class="badge badge--sale">−${off}%</span>` : ""}
          ${product.flags.newArrival ? `<span class="badge badge--new">New</span>` : ""}
          ${product.flags.bestSeller ? `<span class="badge badge--gold">Best Seller</span>` : ""}
          ${!inStock ? `<span class="badge badge--out">Sold Out</span>` : ""}
        </div>

        <a href="product.html?id=${encodeURIComponent(product.id)}" aria-label="View ${escapeHtml(product.name)}">
          <img class="product-card__img"
               src="${escapeHtml(product.images[0])}"
               alt="${escapeHtml(product.name)} — ${escapeHtml(product.family)} fragrance"
               loading="lazy"
               data-fallback-name="${escapeHtml(product.name)}" />
        </a>

        <div class="product-card__actions">
          <button class="icon-btn ${liked ? "is-active" : ""}"
                  type="button"
                  data-wishlist-btn
                  data-wishlist-id="${escapeHtml(product.id)}"
                  aria-label="${liked ? "Remove from wishlist" : "Add to wishlist"}"
                  aria-pressed="${liked}">
            <i data-lucide="heart"></i>
          </button>
          <button class="icon-btn"
                  type="button"
                  data-quick-view="${escapeHtml(product.id)}"
                  aria-label="Quick view ${escapeHtml(product.name)}">
            <i data-lucide="eye"></i>
          </button>
        </div>

        <div class="product-card__quick">
          <button class="btn"
                  type="button"
                  data-quick-add="${escapeHtml(product.id)}"
                  ${!inStock ? "disabled" : ""}>
            <i data-lucide="shopping-bag"></i>
            ${inStock ? "Quick Add" : "Sold Out"}
          </button>
        </div>
      </div>

      <div class="product-card__body">
        <p class="product-card__cat">${escapeHtml(product.category)}</p>
        <h3 class="product-card__name">
          <a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a>
        </h3>
        <p class="product-card__family">${escapeHtml(product.family)}</p>
        <div class="product-card__rating">
          <span class="stars stars--sm" aria-hidden="true">
            <i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i>
          </span>
          <span>${product.rating.toFixed(1)} · ${product.reviewCount} demo reviews</span>
        </div>
        <div class="product-card__price">
          <span class="price ${sale ? "price--sale" : ""}">${formatPrice(base.price)}</span>
          ${sale ? `<span class="price--old">${formatPrice(base.comparePrice)}</span>` : ""}
        </div>
        <p class="product-card__stock ${inStock ? "" : "is-out"}">
          ${inStock ? "In Stock" : "Out of Stock"}
        </p>
      </div>
    </article>
  `;
};

/* ---------- Grid ---------- */
export const renderProductGrid = (container, list, { limit } = {}) => {
  if (!container) return;
  const items = limit ? list.slice(0, limit) : list;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <i data-lucide="search-x"></i>
        <h3>No fragrances found</h3>
        <p>Try adjusting your filters or search for a different note.</p>
        <a class="btn btn--outline" href="shop.html">Browse All Fragrances</a>
      </div>
    `;
    refreshIcons(container);
    return;
  }

  container.innerHTML = items.map(renderProductCard).join("");
  refreshIcons(container);
  bindImageFallbacks(container);
};

/* ---------- Quick view modal ---------- */
let modalEl = null;

const ensureModal = () => {
  if (modalEl) return modalEl;

  modalEl = document.createElement("div");
  modalEl.className = "modal";
  modalEl.setAttribute("data-quick-view-modal", "");
  modalEl.setAttribute("aria-hidden", "true");
  modalEl.innerHTML = `
    <div class="modal__panel" role="dialog" aria-modal="true" aria-label="Quick view">
      <button class="icon-btn modal__close" type="button" data-quick-view-close aria-label="Close">
        <i data-lucide="x"></i>
      </button>
      <div data-quick-view-content></div>
    </div>
  `;
  document.body.appendChild(modalEl);
  refreshIcons(modalEl);
  return modalEl;
};

export const openQuickView = (product) => {
  if (!product) return;
  const modal = ensureModal();
  const content = qs("[data-quick-view-content]", modal);
  const base = product.volumes[0];
  const sale = base.comparePrice && base.comparePrice > base.price;

  content.innerHTML = `
    <div class="quickview">
      <div class="quickview__media">
        <img src="${escapeHtml(product.images[0])}"
             alt="${escapeHtml(product.name)}"
             data-fallback-name="${escapeHtml(product.name)}" />
      </div>
      <div class="quickview__body">
        <p class="product-card__cat">${escapeHtml(product.category)} · ${escapeHtml(product.family)}</p>
        <h2>${escapeHtml(product.name)}</h2>
        <div class="stars" aria-label="${product.rating} out of 5">
          <i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i>
        </div>
        <div class="quickview__price">
          <span class="${sale ? "price--sale" : ""}">${formatPrice(base.price)}</span>
          ${sale ? `<span class="price--old">${formatPrice(base.comparePrice)}</span>` : ""}
        </div>
        <p class="quickview__desc">${escapeHtml(product.shortDescription)}</p>
        <dl class="notes" style="margin-block:0.6rem 1rem">
          <div><dt>Top</dt><dd>${escapeHtml(product.notes.top)}</dd></div>
          <div><dt>Heart</dt><dd>${escapeHtml(product.notes.heart)}</dd></div>
          <div><dt>Base</dt><dd>${escapeHtml(product.notes.base)}</dd></div>
        </dl>
        <div class="quickview__actions">
          <a class="btn btn--outline" href="product.html?id=${encodeURIComponent(product.id)}">View Full Details</a>
          <button class="btn btn--gold" type="button" data-quick-add="${escapeHtml(product.id)}">Add To Bag</button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-locked");
  refreshIcons(content);
  bindImageFallbacks(content);
};

export const closeQuickView = () => {
  if (!modalEl) return;
  modalEl.classList.remove("is-open");
  modalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-locked");
};

/* ---------- Init + delegation ---------- */
export const initProductCards = () => {
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-quick-add]");
    if (add) {
      e.preventDefault();
      addProductToCart(add.dataset.quickAdd);
      return;
    }

    const view = e.target.closest("[data-quick-view]");
    if (view) {
      e.preventDefault();
      import("./products.js").then(({ getProductById }) => {
        openQuickView(getProductById(view.dataset.quickView));
      });
      return;
    }

    if (e.target.closest("[data-quick-view-close]")) {
      closeQuickView();
      return;
    }
    if (e.target === modalEl) closeQuickView();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeQuickView();
  });
};

/* ---------- Rail (horizontal carousel) ---------- */
export const renderProductRail = (container, list) => {
  if (!container) return;
  container.innerHTML = list.map(renderProductCard).join("");
  refreshIcons(container);
  bindImageFallbacks(container);
};
