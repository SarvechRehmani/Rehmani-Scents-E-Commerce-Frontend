/* ============================================================
   js/checkout-page.js
   Checkout flow: form validation, order summary sync, order
   submission saved to localStorage, redirect to confirmation.
   ============================================================ */

import { initTheme } from "./theme.js";
import { initCart, getState, clearCart, openCart } from "./cart.js";
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
  isEmail,
  isPakistaniPhone,
  debounce,
  toast,
} from "./utils.js";
import { storage } from "./storage.js";
import { CONFIG } from "./config.js";

/* ============================================================
   STATE
   ============================================================ */

let cartState = null;

/* ============================================================
   INIT FORM: fill city + province dropdowns
   ============================================================ */

const initDropdowns = () => {
  const citySelect = qs("[data-city-select]");
  const provinceSelect = qs("[data-province-select]");

  if (citySelect) {
    const { cities } = CONFIG.shipping;
    cities.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      citySelect.appendChild(opt);
    });
  }

  if (provinceSelect) {
    const { provinces } = CONFIG.shipping;
    provinces.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      provinceSelect.appendChild(opt);
    });
  }
};

/* ============================================================
   SUMMARY — Items
   ============================================================ */

const renderItems = (state) => {
  const host = qs("[data-checkout-items]");
  if (!host) return;

  if (!state.items.length) {
    host.innerHTML = "";
    return;
  }

  host.innerHTML = state.items
    .map(
      (line) => `
    <li class="summary-item">
      <div class="summary-item__media">
        <img src="${escapeHtml(line.image)}"
             alt="${escapeHtml(line.name)}"
             loading="lazy"
             data-fallback-name="${escapeHtml(line.name)}" />
        <span class="summary-item__qty">${line.qty}</span>
      </div>
      <div class="summary-item__body">
        <p class="summary-item__name">${escapeHtml(line.name)}</p>
        <p class="summary-item__variant">
          ${line.kind === "bundle" ? "Gift Set" : `${line.ml}ml`}
        </p>
      </div>
      <span class="summary-item__price">${formatPrice(line.price * line.qty)}</span>
    </li>
  `,
    )
    .join("");

  refreshIcons(host);
  bindImageFallbacks(host);
};

/* ============================================================
   SUMMARY — Discount
   ============================================================ */

const renderDiscount = (state) => {
  const host = qs("[data-checkout-discount]");
  if (!host) return;

  if (state.discount.amount > 0) {
    host.innerHTML = `
      <div class="checkout-discount__pill">
        <i data-lucide="check"></i>
        <span><strong>${escapeHtml(state.discount.code)}</strong> applied</span>
        <a href="cart.html" class="checkout-discount__edit">Edit</a>
      </div>
    `;
  } else {
    host.innerHTML = `
      <a class="checkout-discount__prompt" href="cart.html">
        <i data-lucide="tag"></i>
        <span>Have a discount code? Apply it in your bag.</span>
      </a>
    `;
  }

  refreshIcons(host);
};

/* ============================================================
   SUMMARY — Totals
   ============================================================ */

const renderTotals = (state) => {
  const set = (sel, val) => {
    const el = qs(sel);
    if (el) el.textContent = val;
  };

  set("[data-checkout-subtotal]", formatPrice(state.subtotal));

  const dRow = qs("[data-checkout-discount-row]");
  const dCode = qs("[data-checkout-discount-code]");
  const dAmount = qs("[data-checkout-discount-amount]");

  if (state.discount.amount > 0) {
    if (dRow) dRow.hidden = false;
    if (dCode) dCode.textContent = `(${state.discount.code})`;
    if (dAmount) dAmount.textContent = `−${formatPrice(state.discount.amount)}`;
  } else if (dRow) {
    dRow.hidden = true;
  }

  const ship = qs("[data-checkout-shipping]");
  if (ship) {
    if (state.subtotal === 0) {
      ship.textContent = "—";
    } else if (state.shipping === 0) {
      ship.innerHTML = `<span class="cart-totals__free">Complimentary</span>`;
    } else {
      ship.textContent = formatPrice(state.shipping);
    }
  }

  set("[data-checkout-total]", formatPrice(state.total));

  const eta = qs("[data-checkout-eta]");
  if (eta) eta.textContent = CONFIG.shipping.estimatedDays + " after dispatch";
};

/* ============================================================
   SUMMARY — Main render
   ============================================================ */

const renderSummary = (state) => {
  renderItems(state);
  renderDiscount(state);
  renderTotals(state);
};

/* ============================================================
   VALIDATION
   ============================================================ */

const VALIDATORS = {
  required: (v) => v.trim().length > 0 || "This field is required.",
  email: (v) => isEmail(v) || "Please enter a valid email address.",
  phone: (v) =>
    isPakistaniPhone(v) ||
    "Enter a valid Pakistani number (e.g. 0300 1234567).",
  postal: (v) =>
    !v.trim() ||
    /^[0-9]{4,6}$/.test(v.trim()) ||
    "Postal code should be 4–6 digits.",
};

const validateField = (input) => {
  const rules = String(input.dataset.validate || "")
    .split(/\s+/)
    .filter(Boolean);
  const value = input.value;

  for (const rule of rules) {
    const fn = VALIDATORS[rule];
    if (!fn) continue;
    const result = fn(value);
    if (result !== true) {
      showError(input, result);
      return false;
    }
  }
  clearError(input);
  return true;
};

const showError = (input, message) => {
  input.classList.add("is-invalid");
  input.setAttribute("aria-invalid", "true");
  const err = qs(`[data-error-for="${input.name}"]`);
  if (err) err.textContent = message;
};

const clearError = (input) => {
  input.classList.remove("is-invalid");
  input.removeAttribute("aria-invalid");
  const err = qs(`[data-error-for="${input.name}"]`);
  if (err) err.textContent = "";
};

const validateForm = (form) => {
  const inputs = qsa("[data-validate]", form);
  let firstInvalid = null;
  let valid = true;

  inputs.forEach((input) => {
    if (!validateField(input)) {
      valid = false;
      if (!firstInvalid) firstInvalid = input;
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return valid;
};

const initLiveValidation = () => {
  const form = qs("[data-checkout-form]");
  if (!form) return;

  // On blur — validate
  form.addEventListener(
    "blur",
    (e) => {
      const input = e.target.closest("[data-validate]");
      if (input) validateField(input);
    },
    true,
  );

  // On input — clear errors once the user starts fixing them
  form.addEventListener("input", (e) => {
    const input = e.target.closest("[data-validate]");
    if (input && input.classList.contains("is-invalid")) {
      validateField(input);
    }
  });
};

/* ============================================================
   ORDER SUBMISSION
   ============================================================ */

const generateOrderNumber = () => {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RS-${y}${m}${d}-${rand}`;
};

const saveOrder = (order) => {
  const list = storage.get(storage.keys.orders, []);
  const orders = Array.isArray(list) ? list : [];
  orders.unshift(order);

  // Keep only the most recent 30 demo orders in this browser
  const trimmed = orders.slice(0, 30);
  storage.set(storage.keys.orders, trimmed);
};

const readFormValues = () => {
  const form = qs("[data-checkout-form]");
  const data = new FormData(form);

  return {
    name: String(data.get("name") || "").trim(),
    email: String(data.get("email") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    street: String(data.get("street") || "").trim(),
    area: String(data.get("area") || "").trim(),
    city: String(data.get("city") || "").trim(),
    province: String(data.get("province") || "").trim(),
    postal: String(data.get("postal") || "").trim(),
    payment: String(data.get("payment") || "cod"),
    notes: String(data.get("notes") || "").trim(),
  };
};

const handleSubmit = (e) => {
  e.preventDefault();

  const form = qs("[data-checkout-form]");
  if (!form) return;

  // Prevent double submit
  const submitBtn = qs("[data-checkout-submit]");
  if (submitBtn?.disabled) return;

  // Validate cart not empty
  if (!cartState?.items.length) {
    toast("Your bag is empty.", "error");
    return;
  }

  // Validate form
  if (!validateForm(form)) {
    toast("Please fix the highlighted fields.", "error");
    return;
  }

  // Build order object
  const values = readFormValues();
  const orderNumber = generateOrderNumber();
  const placedAt = new Date().toISOString();

  const order = {
    orderNumber,
    placedAt,
    status: "placed", // placed → processing → dispatched → out-for-delivery → delivered
    customer: {
      name: values.name,
      email: values.email,
      phone: values.phone,
    },
    address: {
      street: values.street,
      area: values.area,
      city: values.city,
      province: values.province,
      postal: values.postal,
    },
    payment: values.payment,
    notes: values.notes,
    items: cartState.items.map((l) => ({
      id: l.id,
      name: l.name,
      image: l.image,
      kind: l.kind,
      ml: l.ml,
      qty: l.qty,
      price: l.price,
    })),
    totals: {
      subtotal: cartState.subtotal,
      discount: cartState.discount.amount,
      discountCode: cartState.discount.code,
      shipping: cartState.shipping,
      total: cartState.total,
    },
  };

  // Persist
  saveOrder(order);

  // Clear cart (and discount code)
  clearCart();

  // Disable button while redirecting
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span>Processing…</span>";
  }

  // Redirect to confirmation page
  setTimeout(() => {
    window.location.href = `order-confirmation.html?order=${encodeURIComponent(orderNumber)}`;
  }, 260);
};

/* ============================================================
   INIT NOTES PREFILL (carry over from cart)
   ============================================================ */

const prefillNotes = () => {
  const field = qs("[data-checkout-notes]");
  if (!field) return;

  const saved = storage.getRaw("cart_notes", "");
  if (saved) field.value = saved;
};

/* ============================================================
   EMPTY STATE + MAIN SHOW/HIDE
   ============================================================ */

const renderView = () => {
  const main = qs("[data-checkout-main]");
  const empty = qs("[data-checkout-empty]");

  if (!cartState || !cartState.items.length) {
    if (main) main.hidden = true;
    if (empty) {
      empty.hidden = false;
      refreshIcons(empty);
    }
    return;
  }

  if (empty) empty.hidden = true;
  if (main) main.hidden = false;
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

  initDropdowns();
  prefillNotes();
  initLiveValidation();

  // Read cart state
  cartState = getState();
  renderView();
  renderSummary(cartState);

  // Form submit
  const form = qs("[data-checkout-form]");
  on(form, "submit", handleSubmit);

  // Subscribe to cart changes (e.g. user opens mini drawer and removes an item)
  window.addEventListener("rs:cart-updated", (e) => {
    cartState = e.detail;
    renderView();
    renderSummary(cartState);
  });

  refreshIcons();
  window.dispatchEvent(new CustomEvent("rs:ready"));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
