/* ============================================================
   js/admin-settings.js
   Store settings — brand, contact, shipping, discounts, data I/O.
   ============================================================ */

import { initTheme } from "./theme.js";
import { renderAdminLayout } from "./admin-layout.js";
import { requireAuth } from "./admin-auth.js";
import { CONFIG } from "./config.js";
import { qs, qsa, refreshIcons, escapeHtml, toast } from "./utils.js";
import { storage } from "./storage.js";

const SETTINGS_KEY = "store_settings";
const DISCOUNTS_KEY = "store_discounts";

/* ---------- Guard ---------- */
if (!requireAuth()) {
  // redirected
} else {
  initTheme();
  renderAdminLayout();
  initSettingsPage();
}

/* ============================================================
   READ / WRITE
   ============================================================ */

function readSettings() {
  const saved = storage.get(SETTINGS_KEY, {});
  return {
    brandName: CONFIG.brand?.name || "Rehmani Scents",
    tagline: CONFIG.brand?.tagline || "Premium Fragrances",
    announcement: CONFIG.announcement?.text || "",
    announcementHighlight: CONFIG.announcement?.highlight || "",
    email: CONFIG.contact?.email || "",
    phone: CONFIG.contact?.phone || "",
    whatsapp: CONFIG.contact?.whatsapp || "",
    location: CONFIG.contact?.location || "Pakistan",
    freeThreshold: CONFIG.shipping?.freeThreshold || 3500,
    standardRate: CONFIG.shipping?.standardRate || 250,
    eta: CONFIG.shipping?.estimatedDays || "2–4 working days",
    ...saved,
  };
}

function writeSettings(data) {
  storage.set(SETTINGS_KEY, data);
}

function readDiscounts() {
  const saved = storage.get(DISCOUNTS_KEY, null);
  if (saved) return saved;
  return { ...CONFIG.discounts };
}

function writeDiscounts(obj) {
  storage.set(DISCOUNTS_KEY, obj);
}

/* ============================================================
   INIT
   ============================================================ */

function initSettingsPage() {
  fillForm();
  renderDiscounts();
  wireSave();
  wireReset();
  wireDiscounts();
  wireDataActions();
}

/* ============================================================
   FILL FORM
   ============================================================ */

function fillForm() {
  const form = qs("[data-settings-form]");
  if (!form) return;

  const data = readSettings();

  Object.entries(data).forEach(([key, value]) => {
    const input = form.querySelector(`[data-field="${key}"]`);
    if (input) input.value = value ?? "";
  });
}

/* ============================================================
   DISCOUNTS
   ============================================================ */

function renderDiscounts() {
  const host = qs("[data-discount-list]");
  if (!host) return;

  const discounts = readDiscounts();
  const entries = Object.entries(discounts);

  if (!entries.length) {
    host.innerHTML = `
      <div class="admin-empty admin-empty--sm">
        <i data-lucide="tag"></i>
        <p>No discount codes configured.</p>
      </div>
    `;
    refreshIcons(host);
    return;
  }

  host.innerHTML = entries
    .map(
      ([code, rule]) => `
    <div class="admin-discount-row" data-discount-row="${escapeHtml(code)}">
      <div class="admin-discount-row__code">
        <input class="input admin-discount-row__code-input"
               type="text"
               value="${escapeHtml(code)}"
               data-discount-code
               aria-label="Discount code" />
      </div>
      <div class="admin-discount-row__type">
        <select class="select" data-discount-type aria-label="Discount type">
          <option value="percent" ${rule.type === "percent" ? "selected" : ""}>Percent</option>
          <option value="fixed" ${rule.type === "fixed" ? "selected" : ""}>Fixed</option>
        </select>
      </div>
      <div class="admin-discount-row__value">
        <input class="input" type="number" min="0" step="1"
               value="${rule.value || 0}"
               data-discount-value
               aria-label="Discount value" />
      </div>
      <div class="admin-discount-row__label">
        <input class="input" type="text"
               value="${escapeHtml(rule.label || "")}"
               placeholder="e.g. 10% off sitewide"
               data-discount-label
               aria-label="Discount label" />
      </div>
      <button class="icon-btn icon-btn--danger" type="button"
              data-discount-remove
              aria-label="Remove code">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  `,
    )
    .join("");

  refreshIcons(host);
}

function wireDiscounts() {
  const host = qs("[data-discount-list]");
  const addBtn = qs("[data-add-discount]");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const discounts = readDiscounts();
      let base = "NEWCODE";
      let i = 1;
      while (discounts[base]) {
        base = `NEWCODE${i++}`;
      }
      discounts[base] = {
        type: "percent",
        value: 10,
        label: "10% off sitewide",
      };
      writeDiscounts(discounts);
      renderDiscounts();
    });
  }

  if (host) {
    host.addEventListener("click", (e) => {
      const remove = e.target.closest("[data-discount-remove]");
      if (!remove) return;
      e.preventDefault();
      const row = remove.closest("[data-discount-row]");
      const code = row.dataset.discountRow;
      const discounts = readDiscounts();
      delete discounts[code];
      writeDiscounts(discounts);
      renderDiscounts();
    });
  }
}

function collectDiscounts() {
  const rows = qsa("[data-discount-row]");
  const result = {};

  rows.forEach((row) => {
    const code = row
      .querySelector("[data-discount-code]")
      ?.value.trim()
      .toUpperCase();
    if (!code) return;

    result[code] = {
      type: row.querySelector("[data-discount-type]")?.value || "percent",
      value: Number(row.querySelector("[data-discount-value]")?.value) || 0,
      label: row.querySelector("[data-discount-label]")?.value.trim() || "",
    };
  });

  return result;
}

/* ============================================================
   SAVE / RESET
   ============================================================ */

function wireSave() {
  const btn = qs("[data-settings-save]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const form = qs("[data-settings-form]");
    const data = {};

    qsa("[data-field]", form).forEach((input) => {
      const key = input.dataset.field;
      if (!key) return;
      if (input.type === "number") data[key] = Number(input.value) || 0;
      else data[key] = input.value.trim();
    });

    writeSettings(data);
    writeDiscounts(collectDiscounts());

    toast("Settings saved", "success");
  });
}

function wireReset() {
  const btn = qs("[data-settings-reset]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!window.confirm("Reset all settings to defaults?")) return;
    storage.remove(SETTINGS_KEY);
    storage.remove(DISCOUNTS_KEY);
    fillForm();
    renderDiscounts();
    toast("Settings reset to defaults", "success");
  });
}

/* ============================================================
   DATA IMPORT / EXPORT / CLEAR
   ============================================================ */

function wireDataActions() {
  /* Export */
  const exportBtn = qs("[data-export-all]");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        products: storage.get("products_custom", null),
        articles: storage.get("articles_custom", null),
        orders: storage.get("orders", []),
        settings: storage.get("store_settings", null),
        discounts: storage.get("store_discounts", null),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rehmani-store-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Store data exported", "success");
    });
  }

  /* Import */
  const importInput = qs("[data-import-input]");
  if (importInput) {
    importInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);

          if ("products" in data && data.products)
            storage.set("products_custom", data.products);
          if ("articles" in data && data.articles)
            storage.set("articles_custom", data.articles);
          if ("orders" in data && Array.isArray(data.orders))
            storage.set("orders", data.orders);
          if ("settings" in data && data.settings)
            storage.set("store_settings", data.settings);
          if ("discounts" in data && data.discounts)
            storage.set("store_discounts", data.discounts);

          fillForm();
          renderDiscounts();
          toast("Store data imported", "success");
        } catch (err) {
          toast("Invalid JSON file.", "error");
        }
      };
      reader.readAsText(file);
      importInput.value = "";
    });
  }

  /* Clear all */
  const clearBtn = qs("[data-clear-all]");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (
        !window.confirm(
          "This will delete ALL data stored in this browser for this storefront: products, articles, orders, cart, wishlist, settings. Continue?",
        )
      )
        return;

      const keys = [
        "products_custom",
        "articles_custom",
        "orders",
        "store_settings",
        "store_discounts",
        "wishlist",
        "cart",
        "active_discount",
        "cart_notes",
        "recently_viewed",
        "contact_submissions",
        "newsletter",
      ];
      keys.forEach((k) => storage.remove(k));

      fillForm();
      renderDiscounts();
      toast("All local data cleared", "success");
    });
  }
}
