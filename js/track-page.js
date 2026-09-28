/* ============================================================
   js/track-page.js
   Demo order tracker. Reads ?order= & ?phone= from URL,
   looks up the order in localStorage, renders a timeline.
   Also lists recent orders saved in this browser.
   ============================================================ */

import { initTheme } from "./theme.js";
import { initCart } from "./cart.js";
import { initWishlist } from "./wishlist.js";
import { renderHeader } from "./header.js";
import { renderFooter } from "./footer.js";
import { initSearch } from "./search.js";
import { initProductCards } from "./product-card.js";
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
  isPakistaniPhone,
  normalizePhone,
  getParam,
  toast,
} from "./utils.js";
import { storage } from "./storage.js";
import { CONFIG } from "./config.js";

/* ============================================================
   STATUS DEFINITIONS
   ============================================================ */

const STATUS_SEQUENCE = [
  {
    key: "placed",
    label: "Order Placed",
    icon: "clipboard-check",
    description: "Your order has been recorded in this browser.",
  },
  {
    key: "processing",
    label: "Processing",
    icon: "package",
    description: "Your fragrances are being prepared for dispatch.",
  },
  {
    key: "dispatched",
    label: "Dispatched",
    icon: "truck",
    description: "Your order has left the demo warehouse.",
  },
  {
    key: "out-for-delivery",
    label: "Out for Delivery",
    icon: "map-pin",
    description: "A courier would be on the way to your address.",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: "check-circle",
    description: "Your order has reached its destination.",
  },
];

const STATUS_INDEX = STATUS_SEQUENCE.reduce((acc, s, i) => {
  acc[s.key] = i;
  return acc;
}, {});

/* ============================================================
   ORDER LOOKUP
   ============================================================ */

const readOrders = () => {
  const raw = storage.get(storage.keys.orders, []);
  return Array.isArray(raw) ? raw : [];
};

const findOrder = (orderNumber, phone) => {
  const orders = readOrders();
  const targetNum = String(orderNumber || "")
    .trim()
    .toUpperCase();
  const targetPhone = normalizePhone(phone);

  if (!targetNum) return null;

  return (
    orders.find((o) => {
      const num = String(o.orderNumber || "")
        .trim()
        .toUpperCase();
      if (num !== targetNum) return false;

      // If a phone was provided, match it too
      if (targetPhone) {
        const oPhone = normalizePhone(o.customer?.phone || "");
        return oPhone === targetPhone;
      }
      return true;
    }) || null
  );
};

/* ============================================================
   FORMATTING
   ============================================================ */

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
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

const formatShortDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const PAYMENT_LABELS = {
  cod: "Cash on Delivery",
  bank: "Bank Transfer",
  online: "Online Payment",
};

/* ============================================================
   RENDER: TIMELINE
   ============================================================ */

const renderTimeline = (order) => {
  const host = qs("[data-track-timeline]");
  if (!host) return;

  const currentIdx = STATUS_INDEX[order.status] ?? 0;
  const placedAt = order.placedAt;

  host.innerHTML = STATUS_SEQUENCE.map((step, i) => {
    const isDone = i < currentIdx;
    const isCurrent = i === currentIdx;
    const cls = isDone ? "is-done" : isCurrent ? "is-current" : "";

    // Simulate timestamps: each subsequent stage is roughly a day later
    const stepDate = placedAt
      ? new Date(
          new Date(placedAt).getTime() + i * 24 * 60 * 60 * 1000,
        ).toISOString()
      : null;

    return `
      <li class="track-step ${cls}">
        <span class="track-step__dot">
          <i data-lucide="${isDone ? "check" : step.icon}"></i>
        </span>
        <div class="track-step__body">
          <p class="track-step__title">${escapeHtml(step.label)}</p>
          <p class="track-step__meta">
            ${isDone || isCurrent ? escapeHtml(formatShortDate(stepDate)) : "Pending"}
          </p>
          <p class="track-step__desc">${escapeHtml(step.description)}</p>
        </div>
      </li>
    `;
  }).join("");

  refreshIcons(host);
};

/* ============================================================
   RENDER: ITEMS
   ============================================================ */

const renderItems = (order) => {
  const host = qs("[data-track-items]");
  if (!host) return;

  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    host.innerHTML = '<li class="track-items__empty">No items recorded.</li>';
    return;
  }

  host.innerHTML = items
    .map(
      (line) => `
    <li class="track-item">
      <div class="track-item__media">
        <img src="${escapeHtml(line.image || "")}"
             alt="${escapeHtml(line.name)}"
             loading="lazy"
             data-fallback-name="${escapeHtml(line.name)}" />
      </div>
      <div class="track-item__body">
        <p class="track-item__name">${escapeHtml(line.name)}</p>
        <p class="track-item__variant">
          ${line.kind === "bundle" ? "Gift Set" : `${line.ml}ml`} · Qty ${line.qty}
        </p>
      </div>
      <span class="track-item__price">${formatPrice(line.price * line.qty)}</span>
    </li>
  `,
    )
    .join("");

  refreshIcons(host);
  bindImageFallbacks(host);
};

/* ============================================================
   RENDER: DETAIL
   ============================================================ */

const renderDetail = (order) => {
  // Header
  const numEl = qs("[data-track-number]");
  if (numEl) numEl.textContent = order.orderNumber;

  const badgeEl = qs("[data-track-status-badge]");
  if (badgeEl) {
    const label = STATUS_SEQUENCE[STATUS_INDEX[order.status] ?? 0].label;
    badgeEl.textContent = label;
    badgeEl.dataset.status = order.status || "placed";
  }

  // Meta
  const dateEl = qs("[data-track-date]");
  if (dateEl) dateEl.textContent = formatDate(order.placedAt);

  const paymentEl = qs("[data-track-payment]");
  if (paymentEl)
    paymentEl.textContent = PAYMENT_LABELS[order.payment] || "Cash on Delivery";

  const deliverEl = qs("[data-track-deliver]");
  if (deliverEl) {
    const a = order.address || {};
    const line = [a.area, a.city].filter(Boolean).join(", ") || a.city || "—";
    deliverEl.textContent = line;
  }

  const totalEl = qs("[data-track-total]");
  if (totalEl) totalEl.textContent = formatPrice(order.totals?.total || 0);

  // Sections
  renderTimeline(order);
  renderItems(order);

  // Confirmation link — pre-fill with this order
  const link = qs("[data-track-order-page]");
  if (link) {
    link.href = `order-confirmation.html?order=${encodeURIComponent(order.orderNumber)}`;
  }
};

/* ============================================================
   SHOW / HIDE STATES
   ============================================================ */

const showState = (state, message = "") => {
  const placeholder = qs("[data-track-placeholder]");
  const notFound = qs("[data-track-not-found]");
  const detail = qs("[data-track-detail]");
  const notFoundMsg = qs("[data-track-not-found-message]");

  if (placeholder) placeholder.hidden = state !== "placeholder";
  if (notFound) notFound.hidden = state !== "not-found";
  if (detail) detail.hidden = state !== "detail";

  if (state === "not-found" && notFoundMsg && message) {
    notFoundMsg.textContent = message;
  }

  refreshIcons();
};

/* ============================================================
   RECENT ORDERS LIST
   ============================================================ */

const renderRecent = () => {
  const host = qs("[data-track-recent]");
  const list = qs("[data-track-recent-list]");
  if (!host || !list) return;

  const orders = readOrders().slice(0, 3);

  if (!orders.length) {
    host.hidden = true;
    return;
  }

  host.hidden = false;

  list.innerHTML = orders
    .map(
      (o) => `
    <li>
      <button class="track-recent__item" type="button"
              data-track-fill
              data-order="${escapeHtml(o.orderNumber)}"
              data-phone="${escapeHtml(o.customer?.phone || "")}">
        <span class="track-recent__num">${escapeHtml(o.orderNumber)}</span>
        <span class="track-recent__meta">
          ${escapeHtml(formatShortDate(o.placedAt))} ·
          ${escapeHtml(formatPrice(o.totals?.total || 0))}
        </span>
        <i data-lucide="arrow-right"></i>
      </button>
    </li>
  `,
    )
    .join("");

  refreshIcons(list);
};

/* ============================================================
   FORM HANDLERS
   ============================================================ */

const setFieldError = (name, message) => {
  const el = qs(`[data-track-error="${name}"]`);
  const input =
    name === "order" ? qs("[data-track-order]") : qs("[data-track-phone]");
  if (el) el.textContent = message || "";
  if (input) input.classList.toggle("is-invalid", Boolean(message));
};

const clearFieldErrors = () => {
  setFieldError("order", "");
  setFieldError("phone", "");
};

const validateForm = (orderNumber, phone) => {
  let ok = true;
  clearFieldErrors();

  if (!orderNumber.trim()) {
    setFieldError("order", "Order reference is required.");
    ok = false;
  } else if (
    !/^RS-?\d{6}-?\d{4}$/i.test(orderNumber.trim()) &&
    orderNumber.trim().length < 6
  ) {
    setFieldError("order", "That does not look like a valid reference.");
    ok = false;
  }

  if (!phone.trim()) {
    setFieldError("phone", "Phone number is required.");
    ok = false;
  } else if (!isPakistaniPhone(phone)) {
    setFieldError("phone", "Enter a valid Pakistani number (03XX XXXXXXX).");
    ok = false;
  }

  return ok;
};

const handleSubmit = (e) => {
  e.preventDefault();

  const orderInput = qs("[data-track-order]");
  const phoneInput = qs("[data-track-phone]");
  if (!orderInput || !phoneInput) return;

  const orderNumber = orderInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!validateForm(orderNumber, phone)) {
    toast("Please correct the highlighted fields.", "error");
    return;
  }

  const match = findOrder(orderNumber, phone);

  if (!match) {
    showState(
      "not-found",
      "We could not find an order matching that reference and phone number. Check the details and try again.",
    );
    toast("No matching order found.", "error");
    return;
  }

  renderDetail(match);
  showState("detail");
  toast("Order found", "success");

  // Update URL so the result can be shared / refreshed
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("order", match.orderNumber);
    url.searchParams.set("phone", match.customer?.phone || "");
    window.history.replaceState({}, "", url);
  } catch {
    /* ignore */
  }

  // Scroll result into view on mobile
  if (window.innerWidth < 900) {
    const result = qs("[data-track-result]");
    if (result) {
      const top = result.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }
};

/* ============================================================
   PRE-FILL FROM URL
   ============================================================ */

const prefillFromUrl = () => {
  const orderParam = getParam("order", "");
  const phoneParam = getParam("phone", "");

  if (!orderParam) return false;

  const orderInput = qs("[data-track-order]");
  const phoneInput = qs("[data-track-phone]");

  if (orderInput) orderInput.value = orderParam;
  if (phoneInput && phoneParam) phoneInput.value = phoneParam;

  // Auto-submit if both details were provided via URL
  if (orderParam && phoneParam) {
    const match = findOrder(orderParam, phoneParam);
    if (match) {
      renderDetail(match);
      showState("detail");
      return true;
    } else {
      showState(
        "not-found",
        "We could not find an order matching the details in the link. Check the reference and phone number.",
      );
      return true;
    }
  }

  return false;
};

/* ============================================================
   CLEAR / RESET
   ============================================================ */

const resetForm = () => {
  const form = qs("[data-track-form]");
  if (form) form.reset();
  clearFieldErrors();
  showState("placeholder");

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("order");
    url.searchParams.delete("phone");
    window.history.replaceState({}, "", url);
  } catch {
    /* ignore */
  }
};

/* ============================================================
   ACCORDION
   ============================================================ */

const initAccordion = () => {
  qsa(".accordion__trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      const panel = trigger.nextElementSibling;
      if (!panel) return;

      // Single open
      qsa(".accordion__trigger").forEach((t) => {
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

  initAccordion();

  // Form
  const form = qs("[data-track-form]");
  on(form, "submit", handleSubmit);

  // Clear button
  on(qs("[data-track-clear]"), "click", resetForm);

  // Recent orders — click to fill and submit
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-track-fill]");
    if (!btn) return;
    e.preventDefault();
    const orderNumber = btn.dataset.order;
    const phone = btn.dataset.phone;

    const orderInput = qs("[data-track-order]");
    const phoneInput = qs("[data-track-phone]");
    if (orderInput) orderInput.value = orderNumber;
    if (phoneInput) phoneInput.value = phone;

    // Trigger form submit programmatically
    if (form) {
      const evt = new Event("submit", { cancelable: true, bubbles: true });
      form.dispatchEvent(evt);
    }
  });

  // Live error clearing
  const orderInput = qs("[data-track-order]");
  const phoneInput = qs("[data-track-phone]");
  on(orderInput, "input", () => setFieldError("order", ""));
  on(phoneInput, "input", () => setFieldError("phone", ""));

  // Recent orders list
  renderRecent();

  // Auto-lookup if URL provides details
  const autoShown = prefillFromUrl();
  if (!autoShown) showState("placeholder");

  refreshIcons();
  window.dispatchEvent(new CustomEvent("rs:ready"));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
