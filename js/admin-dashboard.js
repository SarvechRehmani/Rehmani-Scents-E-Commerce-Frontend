/* ============================================================
   js/admin-dashboard.js
   Dashboard controller — stats, recent orders, alerts, snapshot.
   ============================================================ */
import { getOrders, getOrderStats } from "./order-store.js";
import { initTheme } from "./theme.js";
import { renderAdminLayout } from "./admin-layout.js";
import { requireAuth, getCurrentUser } from "./admin-auth.js";
import {
  qs,
  qsa,
  refreshIcons,
  formatPrice,
  escapeHtml,
  debounce,
  toast,
} from "./utils.js";
import { storage } from "./storage.js";
import { getProducts, getProductStats, isCustomized } from "./product-store.js";

/* ============================================================
   CONSTANTS — must be declared before any function uses them
   ============================================================ */

const STATUS_LABELS = {
  placed: "Placed",
  processing: "Processing",
  dispatched: "Dispatched",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
};
/* ---------- Guard ---------- */
if (!requireAuth()) {
  // redirect happens in requireAuth
} else {
  initTheme();
  renderAdminLayout();
  initDashboard();
}

/* ---------- Init ---------- */

function initDashboard() {
  renderGreeting();
  renderStats();
  renderRecentOrders();
  renderAlerts();
  renderCatalogSnapshot();
  wireRefresh();
}

/* ---------- Greeting ---------- */

function renderGreeting() {
  const el = qs("[data-admin-greeting]");
  if (!el) return;
  const user = getCurrentUser() || "admin";
  const hour = new Date().getHours();
  const timeOfDay =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  el.textContent = `${timeOfDay}, ${user}. Here is what is happening in your store.`;
}

/* ---------- Stats ---------- */

function readOrders() {
  const raw = storage.get("orders", []);
  return Array.isArray(raw) ? raw : [];
}

function readWishlist() {
  const raw = storage.get("wishlist", []);
  return Array.isArray(raw) ? raw : [];
}

function renderStats() {
  const productStats = getProductStats();
  const orders = getOrders();
  const stats = getOrderStats();

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (Number(o?.totals?.total) || 0),
    0,
  );

  const pendingOrders = orders.filter(
    (o) => o?.status === "placed" || o?.status === "processing",
  ).length;

  setStat(
    "products",
    productStats.total,
    isCustomized()
      ? `${productStats.bestSellers} best sellers · ${productStats.newArrivals} new`
      : "Using default catalog",
  );

  setStat(
    "orders",
    orders.length,
    pendingOrders > 0 ? `${pendingOrders} pending` : "No pending orders",
  );

  setStat("revenue", formatPrice(totalRevenue), "From local demo orders");

  setStat(
    "wishlist",
    wishlist.length,
    wishlist.length === 1
      ? "Item saved in this browser"
      : "Items saved in this browser",
  );
}

function setStat(key, value, meta) {
  const valEl = qs(`[data-stat="${key}"]`);
  const metaEl = qs(`[data-stat-meta="${key}"]`);
  if (valEl) valEl.textContent = value;
  if (metaEl) metaEl.textContent = meta || "";
}

/* ---------- Recent orders ---------- */

function renderRecentOrders() {
  const host = qs("[data-recent-orders]");
  if (!host) return;

  const orders = readOrders().slice(0, 5);

  if (!orders.length) {
    host.innerHTML = `
      <div class="admin-empty admin-empty--sm">
        <i data-lucide="inbox"></i>
        <p>No orders yet in this browser.</p>
        <a class="btn btn--outline btn--sm" href="checkout.html" target="_blank" rel="noopener">
          Test The Checkout
        </a>
      </div>
    `;
    refreshIcons(host);
    return;
  }

  host.innerHTML = `
    <ul class="admin-order-list">
      ${orders
        .map(
          (o) => `
        <li>
          <a class="admin-order-row" href="admin-orders.html?order=${encodeURIComponent(o.orderNumber)}">
            <div class="admin-order-row__main">
              <span class="admin-order-row__num">${escapeHtml(o.orderNumber)}</span>
              <span class="admin-order-row__meta">
                ${escapeHtml(o.customer?.name || "—")} ·
                ${escapeHtml(o.address?.city || "")}
              </span>
            </div>
            <div class="admin-order-row__side">
              <span class="admin-status admin-status--${escapeHtml(o.status || "placed")}">
                ${escapeHtml(STATUS_LABELS[o.status] || "Placed")}
              </span>
              <strong class="admin-order-row__total">
                ${formatPrice(o.totals?.total || 0)}
              </strong>
            </div>
          </a>
        </li>
      `,
        )
        .join("")}
    </ul>
  `;
  refreshIcons(host);
}

/* ---------- Alerts ---------- */

function renderAlerts() {
  const host = qs("[data-admin-alerts]");
  if (!host) return;

  const products = getProducts();
  const outOfStock = products.filter((p) => p.availability !== "in-stock");
  const noImage = products.filter((p) => !p.images?.[0]);
  const noKeywords = products.filter((p) => !p.keywords?.length);
  const lowStock = [...outOfStock, ...noImage, ...noKeywords].slice(0, 5);

  const alerts = [];

  if (outOfStock.length) {
    alerts.push({
      icon: "alert-triangle",
      tone: "warn",
      title: `${outOfStock.length} ${outOfStock.length === 1 ? "product is" : "products are"} out of stock`,
      body:
        outOfStock
          .slice(0, 3)
          .map((p) => p.name)
          .join(", ") +
        (outOfStock.length > 3 ? ` +${outOfStock.length - 3} more` : ""),
    });
  }

  if (noImage.length) {
    alerts.push({
      icon: "image-off",
      tone: "warn",
      title: `${noImage.length} ${noImage.length === 1 ? "product has" : "products have"} no image`,
      body: noImage
        .slice(0, 3)
        .map((p) => p.name)
        .join(", "),
    });
  }

  if (noKeywords.length) {
    alerts.push({
      icon: "tag",
      tone: "info",
      title: `${noKeywords.length} ${noKeywords.length === 1 ? "product needs" : "products need"} search keywords`,
      body: "Adding keywords improves search results for these items.",
    });
  }

  if (!alerts.length) {
    host.innerHTML = `
      <div class="admin-empty admin-empty--sm">
        <i data-lucide="check-circle-2"></i>
        <p>Everything looks healthy.</p>
      </div>
    `;
    refreshIcons(host);
    return;
  }

  host.innerHTML = alerts
    .map(
      (a) => `
    <div class="admin-alert admin-alert--${a.tone}">
      <i data-lucide="${a.icon}"></i>
      <div>
        <strong>${escapeHtml(a.title)}</strong>
        <span>${escapeHtml(a.body)}</span>
      </div>
    </div>
  `,
    )
    .join("");
  refreshIcons(host);
}

/* ---------- Catalog snapshot ---------- */

function renderCatalogSnapshot() {
  const host = qs("[data-catalog-snapshot]");
  if (!host) return;

  const stats = getProductStats();

  host.innerHTML = `
    <div class="admin-snapshot">
      <div class="admin-snapshot__item">
        <span class="admin-snapshot__label">Men</span>
        <span class="admin-snapshot__value">${stats.men}</span>
      </div>
      <div class="admin-snapshot__item">
        <span class="admin-snapshot__label">Women</span>
        <span class="admin-snapshot__value">${stats.women}</span>
      </div>
      <div class="admin-snapshot__item">
        <span class="admin-snapshot__label">Unisex</span>
        <span class="admin-snapshot__value">${stats.unisex}</span>
      </div>
      <div class="admin-snapshot__item">
        <span class="admin-snapshot__label">Best Sellers</span>
        <span class="admin-snapshot__value">${stats.bestSellers}</span>
      </div>
      <div class="admin-snapshot__item">
        <span class="admin-snapshot__label">New Arrivals</span>
        <span class="admin-snapshot__value">${stats.newArrivals}</span>
      </div>
      <div class="admin-snapshot__item">
        <span class="admin-snapshot__label">Featured</span>
        <span class="admin-snapshot__value">${stats.featured}</span>
      </div>
      <div class="admin-snapshot__item admin-snapshot__item--warn">
        <span class="admin-snapshot__label">Out of Stock</span>
        <span class="admin-snapshot__value">${stats.outOfStock}</span>
      </div>
      <div class="admin-snapshot__item">
        <span class="admin-snapshot__label">Total</span>
        <span class="admin-snapshot__value">${stats.total}</span>
      </div>
    </div>
  `;
  refreshIcons(host);
}

/* ---------- Refresh ---------- */

function wireRefresh() {
  const btn = qs("[data-admin-refresh]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    renderStats();
    renderRecentOrders();
    renderAlerts();
    renderCatalogSnapshot();
    toast("Refreshed");
  });
}
