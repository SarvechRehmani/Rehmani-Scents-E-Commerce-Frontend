/* ============================================================
   js/admin-products.js
   Product CRUD — table, search, filter, sort, editor modal.
   ============================================================ */

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
  slugify,
} from "./utils.js";
import {
  getProducts,
  saveProduct,
  deleteProduct,
  resetToDefaults,
  getDefaults,
  isCustomized,
} from "./product-store.js";

/* ============================================================
   STATE — declared BEFORE any function uses it
   ============================================================ */

let currentFilters = {
  search: "",
  category: "all",
  sort: "name",
};

let pendingDeleteId = null;
let editingProduct = null;

/* ============================================================
   FILTER + SORT
   ============================================================ */

function getFilteredProducts() {
  let list = [...getProducts()];

  if (currentFilters.category !== "all") {
    list = list.filter((p) => p.category === currentFilters.category);
  }

  if (currentFilters.search) {
    const q = currentFilters.search.toLowerCase();
    list = list.filter((p) => {
      const hay = [p.name, p.family, p.category, (p.keywords || []).join(" ")]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  list.sort((a, b) => {
    switch (currentFilters.sort) {
      case "price-asc":
        return (a.volumes?.[0]?.price || 0) - (b.volumes?.[0]?.price || 0);
      case "price-desc":
        return (b.volumes?.[0]?.price || 0) - (a.volumes?.[0]?.price || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "newest":
        return (
          Number(b.flags?.newArrival || 0) - Number(a.flags?.newArrival || 0)
        );
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return list;
}

/* ============================================================
   RENDER: TABLE
   ============================================================ */

function renderTable() {
  const tbody = qs("[data-products-tbody]");
  const empty = qs("[data-products-empty]");
  const count = qs("[data-products-count]");
  if (!tbody) return;

  const list = getFilteredProducts();

  if (count)
    count.textContent = `${list.length} ${list.length === 1 ? "item" : "items"}`;

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
    .map((p) => {
      const base = p.volumes?.[0];
      const inStock = p.availability === "in-stock";
      const flags = [];
      if (p.flags?.featured) flags.push("Featured");
      if (p.flags?.bestSeller) flags.push("Best Seller");
      if (p.flags?.newArrival) flags.push("New");

      return `
      <tr data-product-row="${escapeHtml(p.id)}">
        <td>
          <img class="admin-thumb"
               src="${escapeHtml(p.images?.[0] || "")}"
               alt=""
               loading="lazy"
               data-fallback-name="${escapeHtml(p.name)}" />
        </td>
        <td>
          <p class="admin-table__name">${escapeHtml(p.name)}</p>
          <p class="admin-table__meta">${escapeHtml(p.id)}</p>
        </td>
        <td><span class="admin-tag">${escapeHtml(p.category)}</span></td>
        <td class="admin-table__muted">${escapeHtml(p.family || "—")}</td>
        <td class="admin-table__price">
          ${base ? formatPrice(base.price) : "—"}
        </td>
        <td>
          <div class="admin-flags">
            ${flags.map((f) => `<span class="admin-flag">${f}</span>`).join("") || '<span class="admin-table__muted">—</span>'}
          </div>
        </td>
        <td>
          <span class="admin-stock ${inStock ? "" : "admin-stock--out"}">
            ${inStock ? "In Stock" : "Out"}
          </span>
        </td>
        <td>
          <div class="admin-table__actions">
            <button class="icon-btn" type="button" title="Edit"
                    data-product-edit="${escapeHtml(p.id)}">
              <i data-lucide="pencil"></i>
            </button>
            <button class="icon-btn icon-btn--danger" type="button" title="Delete"
                    data-product-delete="${escapeHtml(p.id)}">
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

/* ============================================================
   RENDER: STATS CHIPS
   ============================================================ */

function renderStats() {
  const host = qs("[data-products-stats]");
  if (!host) return;

  const products = getProducts();
  const total = products.length;
  const men = products.filter((p) => p.category === "Men").length;
  const women = products.filter((p) => p.category === "Women").length;
  const unisex = products.filter((p) => p.category === "Unisex").length;
  const outOfStock = products.filter(
    (p) => p.availability !== "in-stock",
  ).length;

  host.innerHTML = `
    <span class="admin-chip">Total: <strong>${total}</strong></span>
    <span class="admin-chip">Men: <strong>${men}</strong></span>
    <span class="admin-chip">Women: <strong>${women}</strong></span>
    <span class="admin-chip">Unisex: <strong>${unisex}</strong></span>
    ${outOfStock ? `<span class="admin-chip admin-chip--warn">Out of stock: <strong>${outOfStock}</strong></span>` : ""}
    ${isCustomized() ? `<span class="admin-chip admin-chip--accent"><i data-lucide="pencil"></i> Custom catalog</span>` : ""}
  `;
  refreshIcons(host);
}

/* ============================================================
   TOOLBAR
   ============================================================ */

function wireToolbar() {
  const search = qs("[data-products-search]");
  const cat = qs("[data-products-cat]");
  const sort = qs("[data-products-sort]");

  if (search) {
    search.addEventListener(
      "input",
      debounce((e) => {
        currentFilters.search = e.target.value.trim();
        renderTable();
      }, 220),
    );
  }
  if (cat) {
    cat.addEventListener("change", (e) => {
      currentFilters.category = e.target.value;
      renderTable();
    });
  }
  if (sort) {
    sort.addEventListener("change", (e) => {
      currentFilters.sort = e.target.value;
      renderTable();
    });
  }

  const clear = qs("[data-products-clear]");
  if (clear) {
    clear.addEventListener("click", () => {
      currentFilters = { search: "", category: "all", sort: "name" };
      if (search) search.value = "";
      if (cat) cat.value = "all";
      if (sort) sort.value = "name";
      renderTable();
    });
  }
}

/* ============================================================
   TABLE ACTIONS
   ============================================================ */

function wireTableActions() {
  const tbody = qs("[data-products-tbody]");
  if (!tbody) return;

  tbody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-product-edit]");
    if (editBtn) {
      e.preventDefault();
      openEditor(editBtn.dataset.productEdit);
      return;
    }

    const delBtn = e.target.closest("[data-product-delete]");
    if (delBtn) {
      e.preventDefault();
      openConfirmDelete(delBtn.dataset.productDelete);
      return;
    }
  });
}

/* ============================================================
   MODAL
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

function fillForm(product) {
  const form = qs("[data-product-form]");
  if (!form) return;

  const set = (name, value) => {
    const input = form.querySelector(`[data-field="${name}"]`);
    if (!input) return;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value ?? "";
  };

  set("originalId", product.id || "");
  set("name", product.name || "");
  set("slug", product.slug || "");
  set("category", product.category || "Men");
  set("family", product.family || "");
  set("shortDescription", product.shortDescription || "");
  set("description", product.description || "");

  const v50 = product.volumes?.find((v) => v.ml === 50) || product.volumes?.[0];
  const v100 = product.volumes?.find((v) => v.ml === 100);

  set("price50", v50?.price || "");
  set("compare50", v50?.comparePrice || "");
  set("has100", v100 ? "yes" : "no");
  set("price100", v100?.price || "");
  set("compare100", v100?.comparePrice || "");

  set("topNotes", product.notes?.top || "");
  set("heartNotes", product.notes?.heart || "");
  set("baseNotes", product.notes?.base || "");

  set("longevity", product.longevity || "");
  set("availability", product.availability || "in-stock");
  set("occasion", (product.occasion || []).join(", "));
  set("season", (product.season || []).join(", "));
  set("rating", product.rating ?? "");
  set("reviewCount", product.reviewCount ?? "");

  set("img1", product.images?.[0] || "");
  set("img2", product.images?.[1] || "");
  set("img3", product.images?.[2] || "");

  set("featured", product.flags?.featured);
  set("bestSeller", product.flags?.bestSeller);
  set("newArrival", product.flags?.newArrival);

  set("keywords", (product.keywords || []).join(", "));

  qsa("[data-error]", form).forEach((el) => {
    el.textContent = "";
  });
  qsa(".is-invalid", form).forEach((el) => el.classList.remove("is-invalid"));

  updateImagePreview();
  toggle100mlRow();
}

function openEditor(productId = null) {
  const modal = qs("[data-product-modal]");
  const eyebrow = qs("[data-modal-eyebrow]");
  const title = qs("[data-modal-title]");

  if (productId) {
    const product = getProducts().find((p) => p.id === productId);
    if (!product) return;
    editingProduct = product;
    if (eyebrow) eyebrow.textContent = "Edit Product";
    if (title) title.textContent = product.name;
    fillForm(product);
  } else {
    editingProduct = null;
    if (eyebrow) eyebrow.textContent = "New Product";
    if (title) title.textContent = "Add A Product";
    fillForm({
      category: "Men",
      availability: "in-stock",
      volumes: [{ ml: 50, price: "", comparePrice: null }],
      notes: {},
      flags: {},
      images: [],
      keywords: [],
      occasion: [],
      season: [],
    });
  }

  openModal(modal);
  setTimeout(() => qs("#p-name")?.focus(), 80);
}

function wireModal() {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-modal-close]")) {
      closeModal(qs("[data-product-modal]"));
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(qs("[data-product-modal]"));
      closeModal(qs("[data-confirm-modal]"));
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-product-new]")) {
      e.preventDefault();
      openEditor(null);
    }
  });

  const saveBtn = qs("[data-product-save]");
  if (saveBtn) saveBtn.addEventListener("click", handleSave);
}

/* ============================================================
   SAVE
   ============================================================ */

function readForm() {
  const form = qs("[data-product-form]");
  const get = (name) => {
    const input = form.querySelector(`[data-field="${name}"]`);
    if (!input) return "";
    if (input.type === "checkbox") return input.checked;
    return input.value.trim();
  };

  const name = get("name");
  const slug = get("slug") || slugify(name);
  const category = get("category");
  const family = get("family");

  const price50 = Number(get("price50")) || 0;
  const compare50 = Number(get("compare50")) || null;
  const has100 = get("has100") === "yes";
  const price100 = Number(get("price100")) || 0;
  const compare100 = Number(get("compare100")) || null;

  const volumes = [{ ml: 50, price: price50, comparePrice: compare50 }];
  if (has100 && price100 > 0) {
    volumes.push({ ml: 100, price: price100, comparePrice: compare100 });
  }

  const splitComma = (s) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  const images = [get("img1"), get("img2"), get("img3")].filter(Boolean);

  return {
    id: get("originalId") || slug,
    slug,
    name,
    category,
    family,
    shortDescription: get("shortDescription"),
    description: get("description"),
    notes: {
      top: get("topNotes"),
      heart: get("heartNotes"),
      base: get("baseNotes"),
    },
    volumes,
    images,
    occasion: splitComma(get("occasion")),
    season: splitComma(get("season")),
    longevity: get("longevity") || "6–8 hours",
    availability: get("availability") || "in-stock",
    flags: {
      featured: get("featured"),
      bestSeller: get("bestSeller"),
      newArrival: get("newArrival"),
    },
    rating: Number(get("rating")) || 4.5,
    reviewCount: Number(get("reviewCount")) || 0,
    keywords: splitComma(get("keywords")),
    collections: [],
  };
}

function validateForm(product) {
  const form = qs("[data-product-form]");
  let ok = true;

  const setError = (name, msg) => {
    const err = form.querySelector(`[data-error="${name}"]`);
    const input = form.querySelector(`[data-field="${name}"]`);
    if (err) err.textContent = msg;
    if (input && msg) input.classList.add("is-invalid");
    if (input && !msg) input.classList.remove("is-invalid");
  };

  qsa("[data-error]", form).forEach((el) => {
    el.textContent = "";
  });
  qsa(".is-invalid", form).forEach((el) => el.classList.remove("is-invalid"));

  if (!product.name) {
    setError("name", "Name is required.");
    ok = false;
  }
  if (!product.family) {
    setError("family", "Family is required.");
    ok = false;
  }
  if (!product.volumes[0].price || product.volumes[0].price <= 0) {
    setError("price50", "Enter a valid price.");
    ok = false;
  }

  if (ok) {
    const existing = getProducts().find(
      (p) => p.id === product.id && p.id !== editingProduct?.id,
    );
    if (existing) {
      setError("name", "A product with this name already exists.");
      ok = false;
    }
  }

  return ok;
}

function handleSave() {
  const product = readForm();

  if (!validateForm(product)) {
    toast("Please fix the highlighted fields.", "error");
    return;
  }

  if (!product.collections?.length) {
    const cat = product.category.toLowerCase();
    product.collections =
      cat === "men" ? ["men"] : cat === "women" ? ["women"] : ["unisex"];
    if (product.flags.bestSeller) product.collections.push("best-sellers");
    if (product.flags.newArrival) product.collections.push("new-arrivals");
  }

  saveProduct(product);
  toast(editingProduct ? "Product updated" : "Product added", "success");

  closeModal(qs("[data-product-modal]"));
  renderTable();
  renderStats();
}

/* ============================================================
   DELETE CONFIRM
   ============================================================ */

function openConfirmDelete(id) {
  const modal = qs("[data-confirm-modal]");
  const text = qs("[data-confirm-text]");
  const product = getProducts().find((p) => p.id === id);

  pendingDeleteId = id;
  if (text && product) {
    text.textContent = `Delete "${product.name}"? This cannot be undone.`;
  }

  openModal(modal);

  const delBtn = qs("[data-confirm-delete]");
  if (delBtn) {
    const clone = delBtn.cloneNode(true);
    delBtn.replaceWith(clone);
    clone.addEventListener("click", () => {
      if (pendingDeleteId) {
        deleteProduct(pendingDeleteId);
        toast("Product deleted");
        pendingDeleteId = null;
        closeModal(modal);
        renderTable();
        renderStats();
      }
    });
    refreshIcons(clone.parentElement);
  }
}

/* ============================================================
   RESET TO DEFAULTS
   ============================================================ */

function wireReset() {
  const btn = qs("[data-products-reset]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!isCustomized()) {
      toast("Already using the default catalog.");
      return;
    }
    if (
      !window.confirm(
        "Reset the catalog to the default 15 products? All local edits will be lost.",
      )
    )
      return;

    resetToDefaults();
    toast("Catalog reset to default", "success");
    renderTable();
    renderStats();
  });
}

/* ============================================================
   IMAGE PREVIEW
   ============================================================ */

function updateImagePreview() {
  const host = qs("[data-image-preview]");
  if (!host) return;

  const form = qs("[data-product-form]");
  const urls = ["img1", "img2", "img3"]
    .map((n) => form.querySelector(`[data-field="${n}"]`)?.value.trim())
    .filter(Boolean);

  if (!urls.length) {
    host.innerHTML = "";
    return;
  }

  host.innerHTML = urls
    .map(
      (url) => `
    <div class="admin-image-preview__item">
      <img src="${escapeHtml(url)}" alt="" loading="lazy" />
    </div>
  `,
    )
    .join("");
}

function wireImagePreview() {
  const form = qs("[data-product-form]");
  if (!form) return;

  ["img1", "img2", "img3"].forEach((name) => {
    const input = form.querySelector(`[data-field="${name}"]`);
    if (input)
      input.addEventListener("input", debounce(updateImagePreview, 400));
  });
}

/* ============================================================
   100ML TOGGLE
   ============================================================ */

function toggle100mlRow() {
  const form = qs("[data-product-form]");
  if (!form) return;

  const has100 = form.querySelector('[data-field="has100"]')?.value === "yes";
  const row = qs("[data-100ml-row]");
  if (row) row.hidden = !has100;
}

function wire100mlToggle() {
  const form = qs("[data-product-form]");
  if (!form) return;

  const select = form.querySelector('[data-field="has100"]');
  if (select) select.addEventListener("change", toggle100mlRow);
}

/* ============================================================
   INITIALIZE PAGE
   ============================================================ */

function initProductsPage() {
  renderTable();
  renderStats();
  wireToolbar();
  wireTableActions();
  wireModal();
  wireReset();
  wireImagePreview();
  wire100mlToggle();
}

/* ============================================================
   BOOT — at the very end so all declarations exist
   ============================================================ */

if (!requireAuth()) {
  // redirected
} else {
  initTheme();
  renderAdminLayout();
  initProductsPage();
}
