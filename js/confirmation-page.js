/* ============================================================
   js/confirmation-page.js
   Reads ?order=<number> from the URL, looks it up in
   localStorage (rs_orders), and renders the full confirmation.
   Falls back to the most recent order if no query is present.
   ============================================================ */
import { getOrderByNumber, getOrders } from "./order-store.js";

import { initTheme } from "./theme.js";
import { initCart, openCart } from "./cart.js";
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
  getParam,
  toast,
  copyText,
} from "./utils.js";
import { storage } from "./storage.js";
import { getProductById, products, getRelated } from "./products.js";
import { CONFIG } from "./config.js";

/* ============================================================
   STATE
   ============================================================ */

let order = null;

/* ============================================================
   ORDER LOOKUP
   ============================================================ */

const readOrders = () => {
  const raw = storage.get(storage.keys.orders, []);
  return Array.isArray(raw) ? raw : [];
};
const findOrder = (number) => getOrderByNumber(number);

const getLatestOrder = () => {
  const orders = getOrders();
  return orders[0] || null;
};

/* ============================================================
   STATUS LABELS
   ============================================================ */

const STATUS_LABELS = {
  placed: "Order Placed",
  processing: "Processing",
  dispatched: "Dispatched",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
};

const labelStatus = (key) => STATUS_LABELS[key] || "Order Placed";

/* ============================================================
   FORMATTING
   ============================================================ */

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

/* ============================================================
   RENDER: HEADER / REFERENCE
   ============================================================ */

const renderHeaderBlock = () => {
  const name = order.customer?.name?.split(" ")[0] || "";
  const lede = qs("[data-confirm-lede]");
  if (lede) {
    lede.textContent = name
      ? `Thank you, ${name}. A confirmation has been saved to this browser. This is a demo storefront — no email is sent and no payment is processed.`
      : "A confirmation has been saved to this browser. This is a demo storefront — no email is sent and no payment is processed.";
  }

  const number = qs("[data-confirm-number]");
  if (number) number.textContent = order.orderNumber;

  const numberSmall = qs("[data-confirm-number-small]");
  if (numberSmall) numberSmall.textContent = order.orderNumber;

  // Update the two track links to include the order number
  qsa("[data-confirm-track]").forEach((el) => {
    const phone = order.customer?.phone || "";
    el.href = `track-order.html?order=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`;
  });
};

/* ============================================================
   RENDER: ITEMS
   ============================================================ */

const renderItem = (line) => {
  const product = line.kind === "bundle" ? null : getProductById(line.id);
  const href = product
    ? `product.html?id=${product.id}`
    : "collections.html#gift-sets";
  const variant = line.kind === "bundle" ? "Gift Set" : `${line.ml}ml`;

  return `
    <li class="confirm-item">
      <a class="confirm-item__media" href="${href}" aria-label="View ${escapeHtml(line.name)}">
        <img src="${escapeHtml(line.image)}"
             alt="${escapeHtml(line.name)}"
             loading="lazy"
             data-fallback-name="${escapeHtml(line.name)}" />
      </a>
      <div class="confirm-item__body">
        <p class="confirm-item__name"><a href="${href}">${escapeHtml(line.name)}</a></p>
        <p class="confirm-item__variant">${escapeHtml(variant)} · Qty ${line.qty}</p>
      </div>
      <span class="confirm-item__price">${formatPrice(line.price * line.qty)}</span>
    </li>
  `;
};

const renderItems = () => {
  const host = qs("[data-confirm-items]");
  const count = qs("[data-confirm-item-count]");
  if (!host) return;

  const items = Array.isArray(order.items) ? order.items : [];
  host.innerHTML = items.map(renderItem).join("");

  const totalQty = items.reduce((s, l) => s + (Number(l.qty) || 0), 0);
  if (count) {
    count.textContent = `${totalQty} ${totalQty === 1 ? "item" : "items"}`;
  }

  refreshIcons(host);
  bindImageFallbacks(host);
};

/* ============================================================
   RENDER: ADDRESS + PAYMENT + NOTES
   ============================================================ */

const renderAddress = () => {
  const host = qs("[data-confirm-address]");
  if (!host) return;

  const a = order.address || {};
  const c = order.customer || {};

  host.innerHTML = `
    <div class="confirm-address__row">
      <span class="confirm-address__label">Name</span>
      <span>${escapeHtml(c.name || "—")}</span>
    </div>
    <div class="confirm-address__row">
      <span class="confirm-address__label">Phone</span>
      <span>${escapeHtml(c.phone || "—")}</span>
    </div>
    <div class="confirm-address__row">
      <span class="confirm-address__label">Email</span>
      <span>${escapeHtml(c.email || "—")}</span>
    </div>
    <div class="confirm-address__row">
      <span class="confirm-address__label">Address</span>
      <span>
        ${escapeHtml(a.street || "")}${a.street ? "<br>" : ""}
        ${escapeHtml(a.area || "")}${a.area ? "<br>" : ""}
        ${escapeHtml(a.city || "")}${a.city ? ", " : ""}${escapeHtml(a.province || "")}
        ${a.postal ? ` — ${escapeHtml(a.postal)}` : ""}
      </span>
    </div>
  `;
};

const renderPayment = () => {
  const host = qs("[data-confirm-payment]");
  if (!host) return;

  const map = {
    cod: {
      label: "Cash on Delivery",
      icon: "banknote",
      desc: "Pay in cash when your order is delivered.",
    },
    bank: {
      label: "Bank Transfer",
      icon: "building-2",
      desc: "Demo only — bank details would be shared in a real flow.",
    },
    online: {
      label: "Online Payment",
      icon: "credit-card",
      desc: "Demo only — no card details are collected on this storefront.",
    },
  };

  const p = map[order.payment] || map.cod;

  host.innerHTML = `
    <div class="confirm-payment__pill">
      <span class="confirm-payment__icon"><i data-lucide="${p.icon}"></i></span>
      <div>
        <strong>${escapeHtml(p.label)}</strong>
        <p>${escapeHtml(p.desc)}</p>
      </div>
    </div>
  `;
  refreshIcons(host);
};

const renderNotes = () => {
  const block = qs("[data-confirm-notes-block]");
  const body = qs("[data-confirm-notes]");
  if (!block || !body) return;

  const notes = String(order.notes || "").trim();
  if (!notes) {
    block.hidden = true;
    return;
  }
  block.hidden = false;
  body.textContent = notes;
};

/* ============================================================
   RENDER: TOTALS + META
   ============================================================ */

const renderTotals = () => {
  const t = order.totals || {};
  const set = (sel, val) => {
    const el = qs(sel);
    if (el) el.textContent = val;
  };

  set("[data-confirm-subtotal]", formatPrice(t.subtotal || 0));

  const dRow = qs("[data-confirm-discount-row]");
  const dCode = qs("[data-confirm-discount-code]");
  const dAmount = qs("[data-confirm-discount-amount]");

  if (t.discount && t.discount > 0) {
    if (dRow) dRow.hidden = false;
    if (dCode) dCode.textContent = t.discountCode ? `(${t.discountCode})` : "";
    if (dAmount) dAmount.textContent = `−${formatPrice(t.discount)}`;
  } else if (dRow) {
    dRow.hidden = true;
  }

  const ship = qs("[data-confirm-shipping]");
  if (ship) {
    if (!t.shipping || t.shipping === 0) {
      ship.innerHTML = `<span class="cart-totals__free">Complimentary</span>`;
    } else {
      ship.textContent = formatPrice(t.shipping);
    }
  }

  set("[data-confirm-total]", formatPrice(t.total || 0));
};

const renderMeta = () => {
  const set = (sel, val) => {
    const el = qs(sel);
    if (el) el.textContent = val;
  };

  set("[data-confirm-date]", formatDateTime(order.placedAt));
  set("[data-confirm-status]", labelStatus(order.status));
  set("[data-confirm-eta]", CONFIG.shipping.estimatedDays);
};

/* ============================================================
   RECOMMENDED
   ============================================================ */

const renderRecommended = () => {
  const section = qs("[data-confirm-recommended]");
  const rail = qs("[data-confirm-recommended-rail]");
  if (!section || !rail) return;

  const items = Array.isArray(order.items) ? order.items : [];
  const inOrder = new Set(items.map((l) => l.id));

  let recs = [];

  const seed = items.find((l) => l.kind !== "bundle");
  if (seed) {
    const seedProduct = getProductById(seed.id);
    if (seedProduct) {
      recs = getRelated(seedProduct, 8)
        .filter((p) => !inOrder.has(p.id))
        .slice(0, 6);
    }
  }

  if (recs.length < 4) {
    const extras = products
      .filter((p) => !inOrder.has(p.id) && !recs.find((r) => r.id === p.id))
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
   COPY ORDER NUMBER
   ============================================================ */

const initCopy = () => {
  const btn = qs("[data-confirm-copy]");
  if (!btn || !order) return;

  btn.addEventListener("click", async () => {
    const ok = await copyText(order.orderNumber);
    if (ok) {
      toast("Order number copied", "success");
      const icon = btn.querySelector("svg, i");
      if (icon) {
        const original = icon.outerHTML;
        icon.outerHTML = '<i data-lucide="check"></i>';
        refreshIcons(btn);
        setTimeout(() => {
          const current = btn.querySelector("svg, i");
          if (current) {
            current.outerHTML = original;
            refreshIcons(btn);
          }
        }, 1400);
      }
    } else {
      toast("Could not copy — please select manually.", "error");
    }
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
   RENDER EVERYTHING
   ============================================================ */

const renderAll = () => {
  renderHeaderBlock();
  renderItems();
  renderAddress();
  renderPayment();
  renderNotes();
  renderTotals();
  renderMeta();
  renderRecommended();
  initCopy();
  refreshIcons();
  bindImageFallbacks();
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

  const loading = qs("[data-confirm-loading]");
  const missing = qs("[data-confirm-missing]");
  const content = qs("[data-confirm-content]");

  // Lookup: prefer ?order=, fall back to the most recent saved order
  const refFromUrl = getParam("order", "");
  order = findOrder(refFromUrl) || (!refFromUrl ? getLatestOrder() : null);

  if (!order) {
    loading.hidden = true;
    missing.hidden = false;
    document.title = "Order Not Found — Rehmani Scents";
    refreshIcons();
    window.dispatchEvent(new CustomEvent("rs:ready"));
    return;
  }

  document.title = `Order ${order.orderNumber} — Rehmani Scents`;

  renderAll();

  loading.hidden = true;
  content.hidden = false;

  refreshIcons();
  window.dispatchEvent(new CustomEvent("rs:ready"));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
