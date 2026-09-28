/* ============================================================
   js/filters.js
   Shop page filter + sort + pagination engine.
   State is fully URL-driven so results are shareable and
   survive a page refresh.
   ============================================================ */

import {
  qs,
  qsa,
  on,
  debounce,
  clamp,
  refreshIcons,
  getAllParams,
  setParams,
  escapeHtml,
} from "./utils.js";
import {
  getProducts,
  getAllFamilies,
  getAllOccasions,
  getAllSeasons,
  getAllVolumes,
  getPriceRange,
} from "./product-store.js";

const products = getProducts();
import { renderProductGrid } from "./product-card.js";

/* ============================================================
   STATE
   ============================================================ */

const PER_PAGE = 9;

const DEFAULTS = {
  category: [],
  family: [],
  occasion: [],
  season: [],
  volume: [],
  availability: [],
  minPrice: null,
  maxPrice: null,
  sort: "featured",
  page: 1,
  q: "",
};

const CATEGORY_VALUES = ["Men", "Women", "Unisex"];
const AVAILABILITY_VALUES = [
  { value: "in-stock", label: "In Stock" },
  { value: "out-of-stock", label: "Out of Stock" },
];

const SORT_LABELS = {
  featured: "Featured",
  "best-selling": "Best Selling",
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A to Z",
};

const PRICE_CEILING = 6000;

/* Parse query string into a state object */
const parseUrlState = () => {
  const p = getAllParams();
  const split = (v) => (v ? String(v).split(",").filter(Boolean) : []);

  return {
    category: split(p.category),
    family: split(p.family),
    occasion: split(p.occasion),
    season: split(p.season),
    volume: split(p.volume).map(Number).filter(Boolean),
    availability: split(p.availability),
    minPrice: p.minPrice ? Number(p.minPrice) : null,
    maxPrice: p.maxPrice ? Number(p.maxPrice) : null,
    sort: SORT_LABELS[p.sort] ? p.sort : DEFAULTS.sort,
    page: clamp(parseInt(p.page, 10) || 1, 1, 999),
    q: p.q ? String(p.q) : "",
  };
};

/* Serialise state back to URL params */
const stateToParams = (state) => {
  const join = (arr) => (arr.length ? arr.join(",") : null);
  return {
    category: join(state.category),
    family: join(state.family),
    occasion: join(state.occasion),
    season: join(state.season),
    volume: join(state.volume),
    availability: join(state.availability),
    minPrice: state.minPrice ?? null,
    maxPrice: state.maxPrice ?? null,
    sort: state.sort !== DEFAULTS.sort ? state.sort : null,
    page: state.page > 1 ? state.page : null,
    q: state.q || null,
  };
};

/* ============================================================
   FILTERING + SORTING
   ============================================================ */

const productMatchesPrice = (product, min, max) => {
  const prices = product.volumes.map((v) => v.price);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);

  if (min != null && highest < min) return false;
  if (max != null && lowest > max) return false;
  return true;
};

const productMatchesVolume = (product, volumes) => {
  if (!volumes.length) return true;
  return product.volumes.some((v) => volumes.includes(v.ml));
};

const productMatchesAvailability = (product, values) => {
  if (!values.length) return true;
  const inStock = product.availability === "in-stock";
  return values.some(
    (v) => (v === "in-stock" && inStock) || (v === "out-of-stock" && !inStock),
  );
};

const productMatchesSearch = (product, query) => {
  if (!query) return true;
  const q = query.toLowerCase();
  const hay = [
    product.name,
    product.family,
    product.category,
    product.shortDescription,
    product.notes.top,
    product.notes.heart,
    product.notes.base,
    ...(product.keywords || []),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
};

export const filterProducts = (state, list = getProducts()) => {
  return list.filter((p) => {
    if (state.category.length && !state.category.includes(p.category))
      return false;
    if (state.family.length && !state.family.includes(p.family)) return false;
    if (
      state.occasion.length &&
      !state.occasion.some((o) => p.occasion.includes(o))
    )
      return false;
    if (state.season.length && !state.season.some((s) => p.season.includes(s)))
      return false;
    if (!productMatchesVolume(p, state.volume)) return false;
    if (!productMatchesAvailability(p, state.availability)) return false;
    if (!productMatchesPrice(p, state.minPrice, state.maxPrice)) return false;
    if (!productMatchesSearch(p, state.q)) return false;
    return true;
  });
};

export const sortProducts = (list, sort) => {
  const arr = [...list];
  switch (sort) {
    case "best-selling":
      return arr.sort(
        (a, b) =>
          Number(b.flags.bestSeller) - Number(a.flags.bestSeller) ||
          b.reviewCount - a.reviewCount,
      );
    case "newest":
      return arr.sort(
        (a, b) =>
          Number(b.flags.newArrival) - Number(a.flags.newArrival) ||
          b.rating - a.rating,
      );
    case "price-asc":
      return arr.sort(
        (a, b) =>
          Math.min(...a.volumes.map((v) => v.price)) -
          Math.min(...b.volumes.map((v) => v.price)),
      );
    case "price-desc":
      return arr.sort(
        (a, b) =>
          Math.min(...b.volumes.map((v) => v.price)) -
          Math.min(...a.volumes.map((v) => v.price)),
      );
    case "name-asc":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      return arr.sort(
        (a, b) =>
          Number(b.flags.featured) - Number(a.flags.featured) ||
          Number(b.flags.bestSeller) - Number(a.flags.bestSeller) ||
          b.rating - a.rating,
      );
  }
};

/* ============================================================
   FILTER OPTION COUNTS
   ============================================================ */

const countFor = (key, value, state) => {
  const base = { ...state, page: 1 };

  switch (key) {
    case "category":
      return filterProducts(
        {
          ...base,
          category: [],
          family: state.family,
          occasion: state.occasion,
          season: state.season,
          volume: state.volume,
          availability: state.availability,
          minPrice: state.minPrice,
          maxPrice: state.maxPrice,
          q: state.q,
        },
        products.filter((p) => p.category === value),
      ).length;
    case "family":
      return filterProducts({ ...base, family: [] }).filter(
        (p) => p.family === value,
      ).length;
    case "occasion":
      return filterProducts({ ...base, occasion: [] }).filter((p) =>
        p.occasion.includes(value),
      ).length;
    case "season":
      return filterProducts({ ...base, season: [] }).filter((p) =>
        p.season.includes(value),
      ).length;
    case "volume":
      return filterProducts({ ...base, volume: [] }).filter((p) =>
        p.volumes.some((v) => v.ml === Number(value)),
      ).length;
    case "availability":
      return filterProducts({ ...base, availability: [] }).filter(
        (p) =>
          (value === "in-stock" && p.availability === "in-stock") ||
          (value === "out-of-stock" && p.availability !== "in-stock"),
      ).length;
    default:
      return 0;
  }
};

/* ============================================================
   RENDER: FILTER LISTS
   ============================================================ */

const renderCheckboxList = (host, key, state, options) => {
  if (!host) return;

  if (!options.length) {
    host.innerHTML = `<p style="font-size:0.78rem;color:var(--color-subtle)">No options available.</p>`;
    return;
  }

  host.innerHTML = options
    .map((opt) => {
      const value = typeof opt === "string" ? opt : opt.value;
      const label = typeof opt === "string" ? opt : opt.label;
      const checked = state[key].includes(
        key === "volume" ? Number(value) : value,
      );
      const count = countFor(key, value, state);

      return `
      <label class="checkbox filter-option ${count === 0 && !checked ? "is-empty" : ""}">
        <input type="checkbox" name="${key}" value="${escapeHtml(String(value))}"
               ${checked ? "checked" : ""} ${count === 0 && !checked ? "disabled" : ""} />
        <span>${escapeHtml(label)}</span>
        <span class="filter-group__count">${count}</span>
      </label>
    `;
    })
    .join("");
};

const renderAllFilters = (state) => {
  renderCheckboxList(
    qs('[data-filter-list="category"]'),
    "category",
    state,
    CATEGORY_VALUES,
  );
  renderCheckboxList(
    qs('[data-filter-list="family"]'),
    "family",
    state,
    getAllFamilies(),
  );
  renderCheckboxList(
    qs('[data-filter-list="occasion"]'),
    "occasion",
    state,
    getAllOccasions(),
  );
  renderCheckboxList(
    qs('[data-filter-list="season"]'),
    "season",
    state,
    getAllSeasons(),
  );
  renderCheckboxList(
    qs('[data-filter-list="volume"]'),
    "volume",
    state,
    getAllVolumes().map((ml) => ({ value: ml, label: `${ml} ml` })),
  );
  renderCheckboxList(
    qs('[data-filter-list="availability"]'),
    "availability",
    state,
    AVAILABILITY_VALUES,
  );

  // Price inputs
  const minInput = qs("[data-price-min]");
  const maxInput = qs("[data-price-max]");
  const slider = qs("[data-price-slider]");
  const display = qs("[data-price-display]");
  const range = getPriceRange();

  if (minInput) minInput.value = state.minPrice ?? "";
  if (maxInput) maxInput.value = state.maxPrice ?? "";
  if (slider) {
    slider.min = 0;
    slider.max = PRICE_CEILING;
    slider.value = state.maxPrice ?? PRICE_CEILING;
  }
  if (display) {
    display.textContent = `Rs. ${(state.minPrice ?? 0).toLocaleString("en-PK")} — Rs. ${(
      state.maxPrice ?? PRICE_CEILING
    ).toLocaleString("en-PK")}`;
  }
};

/* ============================================================
   RENDER: ACTIVE CHIPS
   ============================================================ */

const renderActiveChips = (state) => {
  const host = qs("[data-active-filters]");
  if (!host) return;

  const chips = [];

  const addChip = (key, value, label) => {
    chips.push(`
      <button class="chip is-active" type="button" data-chip-remove data-chip-key="${key}" data-chip-value="${escapeHtml(String(value))}">
        ${escapeHtml(label)}
        <i data-lucide="x"></i>
      </button>
    `);
  };

  state.category.forEach((v) => addChip("category", v, v));
  state.family.forEach((v) => addChip("family", v, v));
  state.occasion.forEach((v) => addChip("occasion", v, v));
  state.season.forEach((v) => addChip("season", v, v));
  state.volume.forEach((v) => addChip("volume", v, `${v} ml`));
  state.availability.forEach((v) =>
    addChip("availability", v, v === "in-stock" ? "In Stock" : "Out of Stock"),
  );

  if (state.minPrice != null || state.maxPrice != null) {
    const label = `Rs. ${state.minPrice ?? 0} – Rs. ${state.maxPrice ?? PRICE_CEILING}`;
    chips.push(`
      <button class="chip is-active" type="button" data-chip-remove data-chip-key="price">
        ${label}
        <i data-lucide="x"></i>
      </button>
    `);
  }

  if (state.q) addChip("q", state.q, `"${state.q}"`);

  if (!chips.length) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }

  host.hidden = false;
  host.innerHTML = `
    <span class="active-filters__label">Active:</span>
    ${chips.join("")}
    <button class="chip" type="button" data-filters-clear>Clear All</button>
  `;

  refreshIcons(host);
};

/* ============================================================
   RENDER: PAGINATION
   ============================================================ */

const renderPagination = (state, totalItems) => {
  const host = qs("[data-pagination]");
  if (!host) return;

  const totalPages = Math.ceil(totalItems / PER_PAGE);

  if (totalPages <= 1) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }

  const page = clamp(state.page, 1, totalPages);
  const buttons = [];

  buttons.push(`
    <button class="pagination__btn" type="button" data-page="${page - 1}"
            ${page === 1 ? "disabled" : ""} aria-label="Previous page">
      <i data-lucide="chevron-down" style="transform:rotate(90deg)"></i>
    </button>
  `);

  const push = (n) => {
    buttons.push(`
      <button class="pagination__btn ${n === page ? "is-active" : ""}" type="button" data-page="${n}"
              ${n === page ? 'aria-current="page"' : ""}>${n}</button>
    `);
  };

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  if (start > 1) {
    push(1);
    if (start > 2) buttons.push(`<span class="pagination__ellipsis">…</span>`);
  }
  for (let i = start; i <= end; i++) push(i);
  if (end < totalPages) {
    if (end < totalPages - 1)
      buttons.push(`<span class="pagination__ellipsis">…</span>`);
    push(totalPages);
  }

  buttons.push(`
    <button class="pagination__btn" type="button" data-page="${page + 1}"
            ${page === totalPages ? "disabled" : ""} aria-label="Next page">
      <i data-lucide="chevron-down" style="transform:rotate(-90deg)"></i>
    </button>
  `);

  host.hidden = false;
  host.innerHTML = buttons.join("");
  refreshIcons(host);
};

/* ============================================================
   RENDER: EMPTY STATE
   ============================================================ */

const renderEmptyState = (state) => {
  const grid = qs("[data-shop-grid]");
  if (!grid) return;

  const hasFilters = Object.entries(state).some(([k, v]) => {
    if (["sort", "page"].includes(k)) return false;
    if (Array.isArray(v)) return v.length > 0;
    return v != null && v !== "";
  });

  grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <i data-lucide="${hasFilters ? "search-x" : "package-x"}"></i>
      <h3>No fragrances match</h3>
      <p>
        ${
          hasFilters
            ? "Try removing a filter or two, or browse the full collection."
            : "The catalog appears to be empty."
        }
      </p>
      ${hasFilters ? `<button class="btn btn--outline" type="button" data-filters-clear>Clear All Filters</button>` : ""}
    </div>
  `;
  refreshIcons(grid);
};

/* ============================================================
   MAIN RENDER
   ============================================================ */

let state = { ...DEFAULTS };

const render = () => {
  const filtered = filterProducts(state);
  const sorted = sortProducts(filtered, state.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = clamp(state.page, 1, totalPages);
  const start = (page - 1) * PER_PAGE;
  const pageItems = sorted.slice(start, start + PER_PAGE);

  // Update count
  const countEl = qs("[data-results-count]");
  if (countEl) countEl.textContent = String(total);
  const heroCount = qs("[data-shop-count]");
  if (heroCount) {
    heroCount.textContent = `${total} ${total === 1 ? "Fragrance" : "Fragrances"}`;
  }
  // Sort select
  const sortSelect = qs("[data-sort-select]");
  if (sortSelect && sortSelect.value !== state.sort)
    sortSelect.value = state.sort;

  // Grid
  const grid = qs("[data-shop-grid]");
  if (grid) {
    if (!total) {
      renderEmptyState(state);
    } else {
      renderProductGrid(grid, pageItems);
      // Re-trigger reveal + fallbacks for fresh nodes
      window.dispatchEvent(new CustomEvent("rs:content-updated"));
    }
  }

  // Pagination
  renderPagination(state, total);

  // Chips
  renderActiveChips(state);

  // Filter lists (counts may have changed)
  renderAllFilters(state);

  // Sync URL
  setParams(stateToParams(state), true);
};

/* ============================================================
   STATE MUTATIONS
   ============================================================ */

const updateState = (patch, { resetPage = true } = {}) => {
  state = { ...state, ...patch };
  if (resetPage && !("page" in patch)) state.page = 1;
  render();
};

const toggleArrayValue = (key, value) => {
  const list = state[key] || [];
  const numeric = key === "volume";
  const val = numeric ? Number(value) : value;
  const next = list.includes(val)
    ? list.filter((v) => v !== val)
    : [...list, val];
  updateState({ [key]: next });
};

const clearAll = () => {
  state = { ...DEFAULTS };
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/* ============================================================
   FILTERS PANEL (mobile drawer)
   ============================================================ */

const openFilters = () => {
  const panel = qs("[data-filters-panel]");
  const scrim = qs("[data-scrim]");
  if (!panel) return;
  panel.classList.add("is-open");
  scrim?.classList.add("is-open");
  document.body.classList.add("is-locked");
};

const closeFilters = () => {
  const panel = qs("[data-filters-panel]");
  const scrim = qs("[data-scrim]");
  if (!panel) return;
  panel.classList.remove("is-open");
  scrim?.classList.remove("is-open");
  document.body.classList.remove("is-locked");
};

/* ============================================================
   ACCORDION BEHAVIOR
   ============================================================ */

const initAccordions = () => {
  qsa("[data-filter-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest("[data-filter-group]");
      const body = qs(".filter-group__body", group);
      const expanded = btn.getAttribute("aria-expanded") === "true";

      btn.setAttribute("aria-expanded", String(!expanded));

      if (expanded) {
        body.style.height = body.scrollHeight + "px";
        requestAnimationFrame(() => {
          body.style.height = "0px";
        });
        setTimeout(() => {
          body.style.height = "";
        }, 320);
      } else {
        body.style.height = "0px";
        requestAnimationFrame(() => {
          body.style.height = body.scrollHeight + "px";
        });
        setTimeout(() => {
          body.style.height = "";
        }, 320);
      }
    });
  });
};

/* ============================================================
   INIT
   ============================================================ */

export const initShop = () => {
  const grid = qs("[data-shop-grid]");
  if (!grid) return;

  state = parseUrlState();
  render();

  /* ---- Checkbox changes (delegated) ---- */
  const form = qs("[data-filters-form]");
  on(form, "change", (e) => {
    const input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    toggleArrayValue(input.name, input.value);
  });

  /* ---- Price inputs ---- */
  const minInput = qs("[data-price-min]");
  const maxInput = qs("[data-price-max]");
  const slider = qs("[data-price-slider]");
  const display = qs("[data-price-display]");

  const syncPrice = debounce(() => {
    const min = minInput?.value ? Number(minInput.value) : null;
    const max = maxInput?.value ? Number(maxInput.value) : null;
    updateState({
      minPrice: min != null && !isNaN(min) ? min : null,
      maxPrice: max != null && !isNaN(max) ? max : null,
    });
  }, 400);

  on(minInput, "input", syncPrice);
  on(maxInput, "input", syncPrice);

  on(slider, "input", () => {
    const value = Number(slider.value);
    if (maxInput) maxInput.value = value;
    if (display) {
      display.textContent = `Rs. ${(state.minPrice ?? 0).toLocaleString("en-PK")} — Rs. ${value.toLocaleString("en-PK")}`;
    }
    updateState({ maxPrice: value >= PRICE_CEILING ? null : value });
  });

  /* ---- Sort select ---- */
  on(qs("[data-sort-select]"), "change", (e) => {
    updateState({ sort: e.target.value });
  });

  /* ---- Pagination (delegated) ---- */
  on(qs("[data-pagination]"), "click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    const page = Number(btn.dataset.page);
    if (!page || page < 1) return;
    updateState({ page }, { resetPage: false });
    const section = qs(".shop-section");
    const top = (section?.offsetTop || 0) - 100;
    window.scrollTo({ top, behavior: "smooth" });
  });

  /* ---- Chip removal + clear all (delegated globally) ---- */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-chip-remove]");
    if (chip) {
      e.preventDefault();
      const key = chip.dataset.chipKey;
      if (key === "price") {
        updateState({ minPrice: null, maxPrice: null });
      } else if (key === "q") {
        updateState({ q: "" });
      } else if (key) {
        toggleArrayValue(key, chip.dataset.chipValue);
      }
      return;
    }

    if (e.target.closest("[data-filters-clear]")) {
      e.preventDefault();
      clearAll();
    }
  });

  /* ---- Mobile drawer ---- */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-filters-open]")) {
      e.preventDefault();
      openFilters();
      return;
    }
    if (e.target.closest("[data-filters-close]")) {
      e.preventDefault();
      closeFilters();
      return;
    }
    if (e.target.closest("[data-filters-apply]")) {
      e.preventDefault();
      closeFilters();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFilters();
  });

  const scrim = qs("[data-scrim]");
  on(scrim, "click", closeFilters);

  /* ---- Accordion groups ---- */
  initAccordions();

  /* ---- Popstate: browser back/forward ---- */
  window.addEventListener("popstate", () => {
    state = parseUrlState();
    render();
  });
};
