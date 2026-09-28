/* ============================================================
   js/cart-page.js
   Full-page cart. Reads state from cart.js (shared with the
   mini drawer), renders items, totals, discount UI, notes,
   shipping progress and a recommended rail.
   ============================================================ */

import { initTheme } from "./theme.js";
import {
  initCart,
  applyDiscount,
  removeDiscount,
  updateQty,
  removeItem,
  clearCart,
  openCart,
  getState,
} from "./cart.js";
import { initWishlist } from "./wishlist.js";
import { renderHeader } from "./header.js";
import { renderFooter } from "./footer.js";
import { initSearch } from "./search.js";
import { initProductCards, renderProductRail } from "./product-card.js";
import {
  qs,
  qsa,
  on,
  formatPrice,
  escapeHtml,
  refreshIcons,
  bindImageFallbacks,
  observeReveals,
  lockScroll,
  unlockScroll,
  debounce,
  toast,
} from "./utils.js";
import { storage } from "./storage.js";
import { getProductById, products, getRelated } from "./products.js";
import { CONFIG } from "./config.js";

/* ============================================================
   STATE
   ============================================================ */

let currentState = null;

/* ============================================================
   ITEM RENDERING
   ============================================================ */

const renderItem = (line) => {
  const product = line.kind === "bundle" ? null : getProductById(line.id);
  const productHref = product
    ? `product.html?id=${product.id}`
    : "collections.html#gift-sets";
  const variantLabel = line.kind === "bundle" ? "Gift Set" : `${line.ml}ml`;
  const lineTotal = line.price * line.qty;

  // Suggest a linked product for cross-sell (same product but bigger size)
  let upsell = "";
  if (product && product.volumes.length > 1 && line.kind !== "bundle") {
    const other = product.volumes.find((v) => v.ml !== line.ml);
    if (other) {
      const diff = other.price - line.price;
      upsell = `
        <p class="cart-item__upsell">
          Also available in <strong>${other.ml}ml</strong>
          (${diff > 0 ? "+" : ""}${formatPrice(diff)})
        </p>
      `;
    }
  }

  return `
    <li class="cart-item" data-line-id="${escapeHtml(line.lineId)}">

      <!-- Product -->
      <div class="cart-item__product">
        <a class="cart-item__media" href="${productHref}" aria-label="View ${escapeHtml(line.name)}">
          <img src="${escapeHtml(line.image)}"
               alt="${escapeHtml(line.name)}"
               loading="lazy"
               data-fallback-name="${escapeHtml(line.name)}" />
        </a>

        <div class="cart-item__info">
          <p class="cart-item__cat">
            ${line.kind === "bundle" ? "Gift Set" : escapeHtml(line.category || "Fragrance")}
          </p>
          <h3 class="cart-item__name">
            <a href="${productHref}">${escapeHtml(line.name)}</a>
          </h3>
          <p class="cart-item__variant">${escapeHtml(variantLabel)}</p>
          ${upsell}
          <button class="cart-item__remove-mobile"
                  type="button"
                  data-cart-item-remove="${escapeHtml(line.lineId)}"
                  aria-label="Remove ${escapeHtml(line.name)}">
            <i data-lucide="trash-2"></i>
            <span>Remove</span>
          </button>
        </div>
      </div>

      <!-- Unit price -->
      <div class="cart-item__unit" data-label="Price">
        <span class="cart-item__unit-value">${formatPrice(line.price)}</span>
      </div>

      <!-- Quantity -->
      <div class="cart-item__qty" data-label="Quantity">
        <div class="cart-qty">
          <button class="cart-qty__btn" type="button"
                  data-cart-item-dec="${escapeHtml(line.lineId)}"
                  aria-label="Decrease quantity">
            <i data-lucide="minus"></i>
          </button>
          <label class="sr-only" for="qty-${escapeHtml(line.lineId)}">Quantity</label>
          <input class="cart-qty__input"
                 id="qty-${escapeHtml(line.lineId)}"
                 type="number"
                 value="${line.qty}"
                 min="1" max="99"
                 inputmode="numeric"
                 data-cart-item-qty="${escapeHtml(line.lineId)}" />
          <button class="cart-qty__btn" type="button"
                  data-cart-item-inc="${escapeHtml(line.lineId)}"
                  aria-label="Increase quantity">
            <i data-lucide="plus"></i>
          </button>
        </div>

        <button class="cart-item__remove-desktop"
                type="button"
                data-cart-item-remove="${escapeHtml(line.lineId)}"
                aria-label="Remove ${escapeHtml(line.name)}">
          <i data-lucide="trash-2"></i>
          <span>Remove</span>
        </button>
      </div>

      <!-- Total -->
      <div class="cart-item__total" data-label="Total">
        <span>${formatPrice(lineTotal)}</span>
      </div>

    </li>
  `;
};

/* ============================================================
   DISCOUNT BLOCK
   ============================================================ */

const renderDiscountBlock = (state) => {
  const host = qs("[data-cart-discount-block]");
  if (!host) return;

  const active = state.discount;

  if (active && active.code) {
    host.innerHTML = `
      <div class="cart-discount-applied">
        <div class="cart-discount-applied__icon">
          <i data-lucide="check"></i>
        </div>
        <div class="cart-discount-applied__body">
          <strong>${escapeHtml(active.code)}</strong>
          <span>${escapeHtml(active.label || "Discount applied")}</span>
        </div>
        <button class="cart-discount-applied__remove"
                type="button"
                data-cart-discount-remove
                aria-label="Remove discount code">
          <i data-lucide="x"></i>
        </button>
      </div>
    `;
  } else {
    host.innerHTML = `
      <div class="cart-discount__field">
        <label class="cart-discount__label" for="cart-discount-input">Discount Code</label>
        <div class="cart-discount__input-group">
          <input id="cart-discount-input"
                 class="input cart-discount__input"
                 type="text"
                 placeholder="Enter code"
                 autocomplete="off"
                 data-cart-discount-input />
          <button class="btn btn--dark" type="button" data-cart-discount-apply>Apply</button>
        </div>
        <p class="cart-discount__hint">
          Try <button class="cart-discount__try" type="button" data-cart-discount-try>REHMANI10</button> for 10% off.
        </p>
      </div>
    `;
  }

  refreshIcons(host);
};

/* ============================================================
   TOTALS
   ============================================================ */

const renderTotals = (state) => {
  const set = (sel, val) => {
    const el = qs(sel);
    if (el) el.textContent = val;
  };

  set("[data-cart-subtotal]", formatPrice(state.subtotal));

  // Discount row
  const dRow = qs("[data-cart-discount-row]");
  const dCode = qs("[data-cart-discount-code]");
  const dAmount = qs("[data-cart-discount-amount]");

  if (state.discount.amount > 0) {
    if (dRow) dRow.hidden = false;
    if (dCode)
      dCode.textContent = state.discount.code ? `(${state.discount.code})` : "";
    if (dAmount) dAmount.textContent = `−${formatPrice(state.discount.amount)}`;
  } else {
    if (dRow) dRow.hidden = true;
  }

  // Shipping
  const ship = qs("[data-cart-shipping]");
  if (ship) {
    if (state.subtotal === 0) {
      ship.textContent = "—";
    } else if (state.shipping === 0) {
      ship.innerHTML = `<span class="cart-totals__free">Complimentary</span>`;
    } else {
      ship.textContent = formatPrice(state.shipping);
    }
  }

  set("[data-cart-total]", formatPrice(state.total));
};

/* ============================================================
   SHIPPING BANNER
   ============================================================ */

const renderShipBanner = (state) => {
  const banner = qs("[data-ship-banner]");
  const text = qs("[data-ship-banner-text]");
  const fill = qs("[data-ship-banner-fill]");
  if (!banner || !text || !fill) return;

  if (state.subtotal === 0) {
    banner.hidden = true;
    return;
  }

  banner.hidden = false;
  const target = CONFIG.shipping.freeThreshold;
  const remaining = Math.max(0, target - state.subtotal);
  const pct = Math.min(100, (state.subtotal / target) * 100);

  if (remaining === 0) {
    text.innerHTML = `<strong>Complimentary delivery unlocked.</strong> Your order ships free.`;
  } else {
    text.innerHTML = `Add <strong>${formatPrice(remaining)}</strong> more for complimentary delivery.`;
  }
  fill.style.width = pct + "%";
};

/* ============================================================
   RECOMMENDED RAIL
   ============================================================ */

const renderRecommended = (state) => {
  const section = qs("[data-cart-recommended]");
  const rail = qs("[data-cart-recommended-rail]");
  if (!section || !rail) return;

  if (!state.items.length) {
    section.hidden = true;
    return;
  }

  // Prefer products related to items in the cart
  const seed = state.items[0];
  const seedProduct = seed?.kind !== "bundle" ? getProductById(seed.id) : null;
  const inCart = new Set(state.items.map((i) => i.id));

  let recommendations = [];

  if (seedProduct) {
    recommendations = getRelated(seedProduct, 8)
      .filter((p) => !inCart.has(p.id))
      .slice(0, 6);
  }

  // Top up with best sellers / featured if needed
  if (recommendations.length < 4) {
    const extras = products
      .filter(
        (p) => !inCart.has(p.id) && !recommendations.find((r) => r.id === p.id),
      )
      .filter((p) => p.flags.bestSeller || p.flags.featured)
      .slice(0, 6 - recommendations.length);
    recommendations = [...recommendations, ...extras];
  }

  if (!recommendations.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  renderProductRail(rail, recommendations);
};

/* ============================================================
   NOTES PERSISTENCE
   ============================================================ */

const NOTES_KEY = "cart_notes";

const readNotes = () => {
  try {
    return storage.getRaw(NOTES_KEY, "") || "";
  } catch {
    return "";
  }
};

const writeNotes = (value) => {
  try {
    storage.setRaw(NOTES_KEY, String(value || ""));
  } catch {
    /* ignore */
  }
};

const initNotes = () => {
  const field = qs("[data-cart-notes]");
  if (!field) return;
  field.value = readNotes();
  field.addEventListener(
    "input",
    debounce(() => writeNotes(field.value), 400),
  );
};

/* ============================================================
   MAIN RENDER
   ============================================================ */

const renderCart = () => {
  // Pull latest state from the cart module via event detail
  const state = window.__rsCartState || null;
  if (!state) return;

  currentState = state;

  const empty = qs("[data-cart-empty]");
  const layout = qs("[data-cart-layout]");
  const itemsHost = qs("[data-cart-items]");
  const countEl = qs("[data-cart-page-count]");

  const totalQty = state.items.reduce((sum, l) => sum + l.qty, 0);

  if (countEl) {
    countEl.innerHTML = `<strong>${totalQty}</strong> ${totalQty === 1 ? "item" : "items"}`;
  }

  // Empty / filled switch
  if (!state.items.length) {
    if (empty) empty.hidden = false;
    if (layout) layout.hidden = true;
    qs("[data-ship-banner]")?.setAttribute("hidden", "");
    qs("[data-cart-recommended]")?.setAttribute("hidden", "");
    refreshIcons(empty);
    return;
  }

  if (empty) empty.hidden = true;
  if (layout) layout.hidden = false;

  // Items
  if (itemsHost) {
    itemsHost.innerHTML = state.items.map(renderItem).join("");
    refreshIcons(itemsHost);
    bindImageFallbacks(itemsHost);
  }

  // Discount
  renderDiscountBlock(state);

  // Totals
  renderTotals(state);

  // Shipping banner
  renderShipBanner(state);

  // Recommended
  renderRecommended(state);
};

/* ============================================================
   EVENT HANDLERS
   ============================================================ */

const handleDiscountApply = (rawValue) => {
  const value = String(rawValue || "").trim();
  if (!value) {
    toast("Enter a discount code first.", "error");
    return;
  }

  const result = applyDiscount(value);
  if (!result.ok) {
    toast(result.message || "That code is not valid.", "error");
  }
  // Re-render is triggered automatically via the rs:cart-updated event
};

const initEvents = () => {
  /* ---------- Item quantity / remove / clear (delegated) ---------- */
  const itemsHost = qs("[data-cart-items]");
  on(itemsHost, "click", (e) => {
    const inc = e.target.closest("[data-cart-item-inc]");
    if (inc) {
      e.preventDefault();
      const line = currentState?.items.find(
        (l) => l.lineId === inc.dataset.cartItemInc,
      );
      if (line) updateQty(line.lineId, line.qty + 1);
      return;
    }

    const dec = e.target.closest("[data-cart-item-dec]");
    if (dec) {
      e.preventDefault();
      const line = currentState?.items.find(
        (l) => l.lineId === dec.dataset.cartItemDec,
      );
      if (!line) return;
      if (line.qty <= 1) removeItem(line.lineId);
      else updateQty(line.lineId, line.qty - 1);
      return;
    }

    const rm = e.target.closest("[data-cart-item-remove]");
    if (rm) {
      e.preventDefault();
      removeItem(rm.dataset.cartItemRemove);
      return;
    }
  });

  // Direct input on qty field
  on(itemsHost, "change", (e) => {
    const input = e.target.closest("[data-cart-item-qty]");
    if (!input) return;
    const lineId = input.dataset.cartItemQty;
    const v = parseInt(input.value, 10);
    const line = currentState?.items.find((l) => l.lineId === lineId);
    if (!line) return;
    if (isNaN(v) || v < 1) {
      input.value = String(line.qty);
      return;
    }
    updateQty(lineId, Math.min(99, v));
  });

  /* ---------- Clear bag ---------- */
  on(qs("[data-cart-clear]"), "click", () => {
    if (!currentState?.items.length) return;
    const confirmed = window.confirm("Remove all items from your bag?");
    if (confirmed) {
      clearCart();
      toast("Bag cleared");
    }
  });

  /* ---------- Discount apply / remove / quick-try (delegated) ---------- */
  document.addEventListener("click", (e) => {
    const applyBtn = e.target.closest("[data-cart-discount-apply]");
    if (applyBtn) {
      e.preventDefault();
      const input = qs("[data-cart-discount-input]");
      handleDiscountApply(input?.value);
      return;
    }

    const tryBtn = e.target.closest("[data-cart-discount-try]");
    if (tryBtn) {
      e.preventDefault();
      const input = qs("[data-cart-discount-input]");
      if (input) input.value = tryBtn.textContent.trim();
      handleDiscountApply(tryBtn.textContent.trim());
      return;
    }

    const removeBtn = e.target.closest("[data-cart-discount-remove]");
    if (removeBtn) {
      e.preventDefault();
      removeDiscount();
      return;
    }
  });

  // Enter key on discount input
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const input = e.target.closest("[data-cart-discount-input]");
    if (!input) return;
    e.preventDefault();
    handleDiscountApply(input.value);
  });

  /* ---------- Cart state subscription ---------- */
  window.addEventListener("rs:cart-updated", (e) => {
    window.__rsCartState = e.detail;
    renderCart();
    observeReveals();
    bindImageFallbacks();
  });
};

/* ============================================================
   SCRIM + BACK TO TOP
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

const initBackToTop = () => {
  const btn = qs("[data-to-top]");
  if (!btn) return;
  const onScroll = () =>
    btn.classList.toggle("is-visible", window.scrollY > 600);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
};

/* ============================================================
   BOOT
   ============================================================ */

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
  observeReveals();
  bindImageFallbacks();

  initNotes();

  // Seed with current state (initCart dispatches rs:cart-updated)
  initEvents();

  // Direct state read — event ka intezaar nahi
  window.__rsCartState = getState();
  renderCart();
  window.dispatchEvent(new CustomEvent("rs:ready"));

  // If the cart module has already dispatched before this file attached
  // its listener, trigger a fresh render on next tick.
  // requestAnimationFrame(() => {
  //   if (!window.__rsCartState) {
  //     // Fallback: force-emit via a dummy dispatch
  //     const stateEvent = new CustomEvent("rs:cart-updated", {
  //       detail: {
  //         items: [],
  //         count: 0,
  //         subtotal: 0,
  //         discount: { amount: 0, code: null, label: null },
  //         shipping: 0,
  //         total: 0,
  //       },
  //     });
  //     // The cart module will overwrite this on the next user interaction
  //     // but for an unopened page we render an empty state immediately.
  //     window.dispatchEvent(stateEvent);
  //   }
  // });

  refreshIcons();
  window.dispatchEvent(new CustomEvent("rs:ready"));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
