/* ============================================================
   js/cart.js
   Cart state, drawer, mini-cart, totals, discount codes.
   Emits `rs:cart-updated` whenever state changes.
   ============================================================ */

import { storage } from "./storage.js";
import { getProductById } from "./product-store.js";
import { getBundleById } from "./bundles.js";
import { CONFIG } from "./config.js";
import {
  qs,
  qsa,
  on,
  formatPrice,
  escapeHtml,
  toast,
  lockScroll,
  unlockScroll,
  refreshIcons,
} from "./utils.js";

const KEY = storage.keys.cart;
const DISCOUNT_KEY = storage.keys.discount;

let cache = null;
let discount = null; // { code, type, value, label }

/* ---------- Persistence ---------- */
const read = () => {
  if (cache) return cache;
  const raw = storage.get(KEY, []);
  cache = Array.isArray(raw) ? raw.filter(isValidLine) : [];
  return cache;
};

const write = (list) => {
  cache = Array.isArray(list) ? list : [];
  storage.set(KEY, cache);
  emit();
};

const isValidLine = (l) =>
  l &&
  typeof l === "object" &&
  typeof l.id === "string" &&
  Number(l.price) >= 0 &&
  Number(l.qty) > 0;

/* ---------- Discount ---------- */
const readDiscount = () => {
  if (discount) return discount;
  const raw = storage.get(DISCOUNT_KEY, null);
  discount = raw && raw.code ? raw : null;
  return discount;
};

const writeDiscount = (d) => {
  discount = d;
  if (d) storage.set(DISCOUNT_KEY, d);
  else storage.remove(DISCOUNT_KEY);
  emit();
};

/* ---------- Line factory ---------- */
const makeLine = (source, { ml, qty = 1, unitPrice, kind }) => {
  const isBundle = kind === "bundle" || source.type === "bundle";
  return {
    lineId: `${source.id}__${isBundle ? "bundle" : ml || "std"}`,
    id: source.id,
    kind: isBundle ? "bundle" : "product",
    name: source.name,
    image: source.images?.[0] || "",
    ml: isBundle ? null : (ml ?? source.volumes?.[0]?.ml ?? null),
    price: Number(unitPrice ?? source.price ?? source.volumes?.[0]?.price ?? 0),
    comparePrice:
      Number(source.comparePrice ?? source.volumes?.[0]?.comparePrice ?? 0) ||
      null,
    qty: Math.max(1, parseInt(qty, 10) || 1),
    category: source.category || null,
    family: source.family || null,
  };
};

/* ---------- Emit ---------- */
const emit = () => {
  window.dispatchEvent(
    new CustomEvent("rs:cart-updated", { detail: getState() }),
  );
  renderDrawer();
  syncBadges();
};

/* ---------- Public state ---------- */
export const getItems = () => read().map((l) => ({ ...l }));

export const getCount = () =>
  read().reduce((sum, l) => sum + (Number(l.qty) || 0), 0);

export const getSubtotal = () =>
  read().reduce((sum, l) => sum + l.price * l.qty, 0);

export const getDiscount = () => {
  const d = readDiscount();
  if (!d) return { amount: 0, code: null, label: null };
  const sub = getSubtotal();
  let amount = 0;
  if (d.type === "percent") amount = Math.round(sub * (d.value / 100));
  else if (d.type === "fixed") amount = Math.min(d.value, sub);
  return { amount, code: d.code, label: d.label };
};

export const getShipping = () => {
  const sub = getSubtotal();
  if (sub === 0) return 0;
  return sub >= CONFIG.shipping.freeThreshold
    ? 0
    : CONFIG.shipping.standardRate;
};

export const getTotal = () => {
  const sub = getSubtotal();
  const disc = getDiscount().amount;
  const ship = getShipping();
  return Math.max(0, sub - disc + ship);
};

export const getState = () => ({
  items: getItems(),
  count: getCount(),
  subtotal: getSubtotal(),
  discount: getDiscount(),
  shipping: getShipping(),
  total: getTotal(),
});

export const isFreeShipping = () =>
  getSubtotal() >= CONFIG.shipping.freeThreshold;

export const freeShippingProgress = () => {
  const sub = getSubtotal();
  const target = CONFIG.shipping.freeThreshold;
  return {
    sub,
    target,
    remaining: Math.max(0, target - sub),
    pct: Math.min(100, (sub / target) * 100),
  };
};

/* ---------- Cart operations ---------- */
export const addToCart = (
  source,
  { ml, qty = 1, unitPrice, kind, silent = false } = {},
) => {
  if (!source || !source.id) return false;

  const line = makeLine(source, { ml, qty, unitPrice, kind });
  const list = read();
  const existing = list.find((l) => l.lineId === line.lineId);

  if (existing) existing.qty = Math.min(99, existing.qty + line.qty);
  else list.push(line);

  write(list);
  if (!silent) toast(`${source.name} added to bag`, "success");
  return true;
};

export const addProductToCart = (productId, { ml, qty = 1 } = {}) => {
  const product = getProductById(productId);
  if (!product) return false;
  const volume = ml
    ? product.volumes.find((v) => v.ml === Number(ml))
    : product.volumes[0];
  if (!volume) return false;
  return addToCart(product, {
    ml: volume.ml,
    qty,
    unitPrice: volume.price,
    kind: "product",
  });
};

export const addBundleToCart = (bundleId, qty = 1) => {
  const bundle = getBundleById(bundleId);
  if (!bundle) return false;
  return addToCart(bundle, { qty, unitPrice: bundle.price, kind: "bundle" });
};

export const updateQty = (lineId, qty) => {
  const list = read();
  const line = list.find((l) => l.lineId === lineId);
  if (!line) return false;

  const next = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
  line.qty = next;
  write(list);
  return true;
};

export const incrementQty = (lineId) => {
  const line = read().find((l) => l.lineId === lineId);
  return line ? updateQty(lineId, line.qty + 1) : false;
};

export const decrementQty = (lineId) => {
  const line = read().find((l) => l.lineId === lineId);
  if (!line) return false;
  if (line.qty <= 1) return removeItem(lineId);
  return updateQty(lineId, line.qty - 1);
};

export const removeItem = (lineId) => {
  const list = read();
  const line = list.find((l) => l.lineId === lineId);
  if (!line) return false;
  write(list.filter((l) => l.lineId !== lineId));
  toast(`${line.name} removed from bag`);
  return true;
};

export const clearCart = () => {
  write([]);
  writeDiscount(null);
};

/* ---------- Discount codes ---------- */
export const applyDiscount = (code) => {
  const key = String(code || "")
    .trim()
    .toUpperCase();
  if (!key) return { ok: false, message: "Enter a code." };

  const rule = CONFIG.discounts[key];
  if (!rule) return { ok: false, message: "That code is not valid." };

  writeDiscount({ code: key, ...rule });
  toast(`Code ${key} applied — ${rule.label}`, "success");
  return { ok: true, rule };
};

export const removeDiscount = () => {
  writeDiscount(null);
  toast("Discount removed");
};

export const getActiveDiscountCode = () => readDiscount()?.code || null;

/* ---------- Badges ---------- */
const syncBadges = () => {
  const n = getCount();
  qsa("[data-cart-badge]").forEach((node) => {
    node.textContent = String(n);
    node.hidden = n === 0;
    node.classList.add("is-bumped");
    setTimeout(() => node.classList.remove("is-bumped"), 320);
  });
};

/* ---------- Drawer open/close ---------- */
const drawerEl = () => qs("[data-cart-drawer]");
const scrimEl = () => qs("[data-scrim]");

export const openCart = () => {
  const drawer = drawerEl();
  const scrim = scrimEl();
  if (!drawer) return;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  scrim?.classList.add("is-open");
  lockScroll();
  const closeBtn = drawer.querySelector("[data-cart-close]");
  setTimeout(() => closeBtn?.focus(), 60);
};

export const closeCart = () => {
  const drawer = drawerEl();
  const scrim = scrimEl();
  if (!drawer) return;
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  scrim?.classList.remove("is-open");
  unlockScroll();
};

/* ---------- Drawer rendering ---------- */
const renderLine = (line) => `
  <div class="mini-item" data-line-id="${escapeHtml(line.lineId)}">
    <img class="mini-item__img"
         src="${escapeHtml(line.image)}"
         alt="${escapeHtml(line.name)}"
         loading="lazy"
         data-fallback-name="${escapeHtml(line.name)}" />
    <div>
      <div class="mini-item__name">${escapeHtml(line.name)}</div>
      <div class="mini-item__variant">
        ${line.kind === "bundle" ? "Gift Set" : `${line.ml}ml`}
      </div>
      <div class="mini-item__price">${formatPrice(line.price)}</div>
    </div>
    <div class="mini-item__side">
      <button class="mini-item__remove" type="button"
              data-cart-remove="${escapeHtml(line.lineId)}"
              aria-label="Remove ${escapeHtml(line.name)}">
        <i data-lucide="trash-2"></i>
      </button>
      <div class="mini-qty">
        <button type="button" data-cart-dec="${escapeHtml(line.lineId)}" aria-label="Decrease quantity">
          <i data-lucide="minus"></i>
        </button>
        <span>${line.qty}</span>
        <button type="button" data-cart-inc="${escapeHtml(line.lineId)}" aria-label="Increase quantity">
          <i data-lucide="plus"></i>
        </button>
      </div>
    </div>
  </div>
`;

const renderDrawer = () => {
  const body = qs("[data-cart-body]");
  const foot = qs("[data-cart-foot]");
  if (!body || !foot) return;

  const items = read();

  if (!items.length) {
    body.innerHTML = `
      <div class="mini-empty">
        <i data-lucide="shopping-bag"></i>
        <p>Your bag is empty.</p>
        <a class="btn btn--outline" href="shop.html">Start Shopping</a>
      </div>
    `;
    foot.innerHTML = "";
    refreshIcons(body);
    return;
  }

  const progress = freeShippingProgress();
  const sub = getSubtotal();
  const disc = getDiscount();
  const ship = getShipping();
  const total = getTotal();

  body.innerHTML = `
    <div class="ship-progress">
      <div class="ship-progress__text">
        ${
          progress.remaining > 0
            ? `Add <strong>${formatPrice(progress.remaining)}</strong> more for complimentary delivery`
            : `<strong>Complimentary delivery unlocked</strong>`
        }
      </div>
      <div class="ship-progress__bar">
        <div class="ship-progress__fill" style="width:${progress.pct}%"></div>
      </div>
    </div>
    ${items.map(renderLine).join("")}
  `;

  foot.innerHTML = `
    <div class="mini-total">
      <span>Subtotal</span>
      <strong>${formatPrice(sub)}</strong>
    </div>
    ${
      disc.amount > 0
        ? `
      <div class="summary__row summary__row--discount">
        <span>Discount (${escapeHtml(disc.code)})</span>
        <strong>−${formatPrice(disc.amount)}</strong>
      </div>
    `
        : ""
    }
    <div class="summary__row">
      <span>Delivery</span>
      <strong>${ship === 0 ? "Complimentary" : formatPrice(ship)}</strong>
    </div>
    <div class="mini-total" style="margin-top:0.6rem;padding-top:0.9rem;border-top:1px solid var(--color-border)">
      <span>Total</span>
      <strong>${formatPrice(total)}</strong>
    </div>
    <div class="summary__actions">
      <a class="btn btn--gold btn--block" href="checkout.html">Proceed To Checkout</a>
      <a class="btn btn--outline btn--block" href="cart.html">View Full Bag</a>
    </div>
    <p class="mini-note">Demo storefront — no real payment is processed.</p>
  `;

  refreshIcons(body);
  refreshIcons(foot);
  // Rebind image fallbacks on newly rendered thumbnails
  import("./utils.js").then(({ bindImageFallbacks }) =>
    bindImageFallbacks(body),
  );
};

/* ---------- Init ---------- */
export const initCart = () => {
  read();
  readDiscount();

  // 1. Pehle listeners
  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-cart-open]");
    if (open) {
      e.preventDefault();
      openCart();
      return;
    }

    const close = e.target.closest("[data-cart-close], [data-scrim]");
    if (close) {
      e.preventDefault();
      closeCart();
      return;
    }

    const inc = e.target.closest("[data-cart-inc]");
    if (inc) {
      e.preventDefault();
      incrementQty(inc.dataset.cartInc);
      return;
    }

    const dec = e.target.closest("[data-cart-dec]");
    if (dec) {
      e.preventDefault();
      decrementQty(dec.dataset.cartDec);
      return;
    }

    const rm = e.target.closest("[data-cart-remove]");
    if (rm) {
      e.preventDefault();
      removeItem(rm.dataset.cartRemove);
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "rs_" + KEY) {
      cache = null;
      emit();
    }
    if (e.key === "rs_" + DISCOUNT_KEY) {
      discount = null;
      emit();
    }
  });

  // 2. Ab current state emit karo
  emit();
};
