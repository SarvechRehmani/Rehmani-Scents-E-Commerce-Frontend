/* ============================================================
   js/admin-orders.js
   Order list, filters, search, detail modal, status update.
   Reads and writes through order-store.js so demo orders
   come from orders.js and new orders are appended to storage.
   ============================================================ */

import {
  getOrders,
  getOrderByNumber,
  updateOrderStatus,
  deleteOrder,
  clearOrders,
} from "./order-store.js";

import { initTheme } from "./theme.js";
import { renderAdminLayout } from "./admin-layout.js";
import { requireAuth } from "./admin-auth.js";
import {
  qs,
  qsa,
  refreshIcons,
  formatPrice,
  escapeHtml,
  debounce,
  toast,
  getParam,
} from "./utils.js";

/* ============================================================
   CONSTANTS
   ============================================================ */

const STATUS_LABELS = {
  placed: "Placed",
  processing: "Processing",
  dispatched: "Dispatched",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
};

const PAYMENT_LABELS = {
  cod: "Cash on Delivery",
  bank: "Bank Transfer",
  online: "Online Payment",
};

/* ============================================================
   STATE
   ============================================================ */

let currentFilter = "all";
let searchTerm = "";
let activeOrderNumber = null;

/* ============================================================
   GUARD + BOOT
   ============================================================ */

if (!requireAuth()) {
  // redirected by requireAuth
} else {
  initTheme();
  renderAdminLayout();
  initOrdersPage();
}

function initOrdersPage() {
  renderFilters();
  renderTable();
  wireSearch();
  wireFilters();
  wireTableActions();
  wireDetailModal();
  wireBulkActions();

  const initialOrder = getParam("order", "");
  if (initialOrder) {
    setTimeout(() => openOrder(initialOrder), 200);
  }
}

/* ============================================================
   FILTERS
   ============================================================ */

function renderFilters() {
  const host = qs("[data-orders-filters]");
  if (!host) return;

  const orders = getOrders();
  const counts = {
    all: orders.length,
    placed: orders.filter((o) => o.status === "placed").length,
    processing: orders.filter((o) => o.status === "processing").length,
    dispatched: orders.filter((o) => o.status === "dispatched").length,
    "out-for-delivery": orders.filter((o) => o.status === "out-for-delivery")
      .length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const filters = [
    { key: "all", label: "All" },
    { key: "placed", label: "Placed" },
    { key: "processing", label: "Processing" },
    { key: "dispatched", label: "Dispatched" },
    { key: "out-for-delivery", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
  ];

  host.innerHTML = filters
    .map(
      (f) => `
    <button class="chip ${currentFilter === f.key ? "is-active" : ""}"
            type="button"
            data-order-filter="${f.key}">
      ${f.label}
      <span class="chip__count">${counts[f.key] || 0}</span>
    </button>
  `,
    )
    .join("");

  refreshIcons(host);
}

function wireFilters() {
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-order-filter]");
    if (!chip) return;
    e.preventDefault();
    currentFilter = chip.dataset.orderFilter;

    qsa("[data-order-filter]").forEach((c) =>
      c.classList.toggle("is-active", c.dataset.orderFilter === currentFilter),
    );

    renderTable();
  });
}

/* ============================================================
   SEARCH
   ============================================================ */

function wireSearch() {
  const input = qs("[data-orders-search]");
  if (!input) return;

  input.addEventListener(
    "input",
    debounce((e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderTable();
    }, 220),
  );
}

/* ============================================================
   FILTERED LIST
   ============================================================ */

function getFilteredOrders() {
  let list = getOrders();

  if (currentFilter !== "all") {
    list = list.filter((o) => (o.status || "placed") === currentFilter);
  }

  if (searchTerm) {
    list = list.filter((o) => {
      const hay = [
        o.orderNumber,
        o.customer?.name,
        o.customer?.phone,
        o.customer?.email,
        o.address?.city,
        o.address?.area,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(searchTerm);
    });
  }

  return list;
}

/* ============================================================
   TABLE
   ============================================================ */

function renderTable() {
  const tbody = qs("[data-orders-tbody]");
  const empty = qs("[data-orders-empty]");
  const count = qs("[data-orders-count]");
  if (!tbody) return;

  const list = getFilteredOrders();

  if (count)
    count.textContent = `${list.length} ${list.length === 1 ? "order" : "orders"}`;

  if (!list.length) {
    tbody.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      refreshIcons(empty);
    }
    return;
  }

  if (empty) empty.hidden = true;

  tbody.innerHTML = list
    .map((o) => {
      const itemCount = (o.items || []).reduce((s, i) => s + (i.qty || 0), 0);
      const status = o.status || "placed";

      return `
      <tr data-order-row="${escapeHtml(o.orderNumber)}">
        <td>
          <p class="admin-table__name">${escapeHtml(o.orderNumber)}</p>
          <p class="admin-table__meta">${formatDate(o.placedAt)}</p>
        </td>
        <td>
          <p class="admin-table__name">${escapeHtml(o.customer?.name || "—")}</p>
          <p class="admin-table__meta">${escapeHtml(o.customer?.phone || "")}</p>
        </td>
        <td class="admin-table__muted">${escapeHtml(o.address?.city || "—")}</td>
        <td class="admin-table__muted">${itemCount} item${itemCount === 1 ? "" : "s"}</td>
        <td class="admin-table__price">${formatPrice(o.totals?.total || 0)}</td>
        <td>
          <span class="admin-status admin-status--${status}">
            ${STATUS_LABELS[status] || "Placed"}
          </span>
        </td>
        <td>
          <div class="admin-table__actions">
            <button class="icon-btn" type="button" title="View"
                    data-order-view="${escapeHtml(o.orderNumber)}">
              <i data-lucide="eye"></i>
            </button>
            <button class="icon-btn icon-btn--danger" type="button" title="Delete"
                    data-order-delete="${escapeHtml(o.orderNumber)}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  refreshIcons(tbody);
}

function formatDate(iso) {
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
}

function formatDateTime(iso) {
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
}

/* ============================================================
   TABLE ACTIONS
   ============================================================ */

function wireTableActions() {
  const tbody = qs("[data-orders-tbody]");
  if (!tbody) return;

  tbody.addEventListener("click", (e) => {
    const view = e.target.closest("[data-order-view]");
    if (view) {
      e.preventDefault();
      openOrder(view.dataset.orderView);
      return;
    }

    const del = e.target.closest("[data-order-delete]");
    if (del) {
      e.preventDefault();
      const num = del.dataset.orderDelete;
      if (!window.confirm(`Delete order ${num}? This cannot be undone.`))
        return;
      deleteOrder(num);
      toast("Order deleted");
      renderTable();
      renderFilters();
    }
  });
}

/* ============================================================
   DETAIL MODAL
   ============================================================ */

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-locked");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-locked");
}

function openOrder(orderNumber) {
  const order = getOrderByNumber(orderNumber);
  if (!order) {
    toast("Order not found.", "error");
    return;
  }

  activeOrderNumber = orderNumber;

  const modal = qs("[data-order-modal]");
  const numEl = qs("[data-order-number]");
  const body = qs("[data-order-detail]");
  const statusSelect = qs("[data-order-status-select]");

  if (numEl) numEl.textContent = order.orderNumber;
  if (statusSelect) statusSelect.value = order.status || "placed";

  const items = order.items || [];
  const addr = order.address || {};
  const cust = order.customer || {};
  const totals = order.totals || {};

  body.innerHTML = `
    <div class="admin-order-detail">
      <section class="admin-detail-section">
        <h3 class="admin-detail-section__title">Status</h3>
        <span class="admin-status admin-status--${order.status || "placed"}">
          ${STATUS_LABELS[order.status || "placed"]}
        </span>
        <p class="admin-detail-section__meta">Placed on ${formatDateTime(order.placedAt)}</p>
      </section>

      <section class="admin-detail-section">
        <h3 class="admin-detail-section__title">Customer</h3>
        <div class="admin-detail-grid">
          <div>
            <span class="admin-detail-label">Name</span>
            <span class="admin-detail-value">${escapeHtml(cust.name || "—")}</span>
          </div>
          <div>
            <span class="admin-detail-label">Email</span>
            <span class="admin-detail-value">${escapeHtml(cust.email || "—")}</span>
          </div>
          <div>
            <span class="admin-detail-label">Phone</span>
            <span class="admin-detail-value">${escapeHtml(cust.phone || "—")}</span>
          </div>
        </div>
      </section>

      <section class="admin-detail-section">
        <h3 class="admin-detail-section__title">Shipping Address</h3>
        <p class="admin-detail-address">
          ${escapeHtml(addr.street || "")}${addr.street ? "<br>" : ""}
          ${escapeHtml(addr.area || "")}${addr.area ? "<br>" : ""}
          ${escapeHtml(addr.city || "")}${addr.city ? ", " : ""}${escapeHtml(addr.province || "")}
          ${addr.postal ? " — " + escapeHtml(addr.postal) : ""}
        </p>
      </section>

      <section class="admin-detail-section">
        <h3 class="admin-detail-section__title">Payment</h3>
        <span class="admin-detail-value">${PAYMENT_LABELS[order.payment] || "Cash on Delivery"}</span>
      </section>

      ${
        order.notes
          ? `
        <section class="admin-detail-section">
          <h3 class="admin-detail-section__title">Order Notes</h3>
          <p class="admin-detail-note">${escapeHtml(order.notes)}</p>
        </section>
      `
          : ""
      }

      <section class="admin-detail-section">
        <h3 class="admin-detail-section__title">Items (${items.length})</h3>
        <ul class="admin-detail-items">
          ${items
            .map(
              (item) => `
            <li>
              <img src="${escapeHtml(item.image || "")}" alt="" loading="lazy" class="admin-detail-item__img" />
              <div>
                <p class="admin-detail-item__name">${escapeHtml(item.name)}</p>
                <p class="admin-detail-item__meta">
                  ${item.kind === "bundle" ? "Gift Set" : `${item.ml}ml`} · Qty ${item.qty}
                </p>
              </div>
              <span class="admin-detail-item__price">
                ${formatPrice((item.price || 0) * (item.qty || 1))}
              </span>
            </li>
          `,
            )
            .join("")}
        </ul>
      </section>

      <section class="admin-detail-section admin-detail-section--totals">
        <div class="admin-detail-total-row">
          <span>Subtotal</span><span>${formatPrice(totals.subtotal || 0)}</span>
        </div>
        ${
          totals.discount
            ? `
          <div class="admin-detail-total-row admin-detail-total-row--muted">
            <span>Discount</span><span>−${formatPrice(totals.discount)}</span>
          </div>
        `
            : ""
        }
        <div class="admin-detail-total-row admin-detail-total-row--muted">
          <span>Delivery</span>
          <span>${totals.shipping === 0 ? "Complimentary" : formatPrice(totals.shipping || 0)}</span>
        </div>
        <div class="admin-detail-total-row admin-detail-total-row--grand">
          <span>Total</span><strong>${formatPrice(totals.total || 0)}</strong>
        </div>
      </section>
    </div>
  `;

  refreshIcons(body);
  openModal(modal);
}

function wireDetailModal() {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-order-close]")) {
      closeModal(qs("[data-order-modal]"));
      activeOrderNumber = null;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(qs("[data-order-modal]"));
      activeOrderNumber = null;
    }
  });

  const saveBtn = qs("[data-order-status-save]");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!activeOrderNumber) return;
      const select = qs("[data-order-status-select]");
      const newStatus = select?.value;
      if (!newStatus) return;

      const ok = updateOrderStatus(activeOrderNumber, newStatus);
      if (!ok) {
        toast("Could not update status.", "error");
        return;
      }

      toast(`Status updated to "${STATUS_LABELS[newStatus]}"`, "success");
      renderTable();
      renderFilters();
      openOrder(activeOrderNumber);
    });
  }
}

/* ============================================================
   BULK ACTIONS
   ============================================================ */

function wireBulkActions() {
  const exportBtn = qs("[data-orders-export]");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const orders = getOrders();
      if (!orders.length) {
        toast("No orders to export.", "error");
        return;
      }
      const blob = new Blob([JSON.stringify(orders, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rehmani-orders-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Orders exported", "success");
    });
  }

  const clearBtn = qs("[data-orders-clear]");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const orders = getOrders();
      if (!orders.length) {
        toast("No orders to clear.");
        return;
      }
      if (
        !window.confirm(
          `Delete all ${orders.length} orders? This cannot be undone.`,
        )
      )
        return;
      clearOrders();
      toast("All orders cleared");
      renderTable();
      renderFilters();
    });
  }
}
