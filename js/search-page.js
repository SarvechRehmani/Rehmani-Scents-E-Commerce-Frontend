/* ============================================================
   js/search-page.js
   Search results page. Reads ?q= from URL, filters the product
   catalog, shows category filter chips and sort options.
   ============================================================ */

import { initPage } from "./page-init.js";
import {
  qs,
  qsa,
  on,
  refreshIcons,
  escapeHtml,
  debounce,
  getParam,
  setParams,
} from "./utils.js";
import { products } from "./products.js";
import { renderProductGrid } from "./product-card.js";

/* ============================================================
   STATE
   ============================================================ */

let query = "";
let sort = "relevance";
let activeCategory = "all";
let lastResults = [];

/* ============================================================
   SEARCH SCORING
   Score each product against the query terms.
   ============================================================ */

const scoreProduct = (product, terms) => {
  if (!terms.length) return 0;

  const name = product.name.toLowerCase();
  const family = product.family.toLowerCase();
  const category = product.category.toLowerCase();
  const short = (product.shortDescription || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const notes = [product.notes?.top, product.notes?.heart, product.notes?.base]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const occasions = (product.occasion || []).join(" ").toLowerCase();
  const seasons = (product.season || []).join(" ").toLowerCase();
  const keywords = (product.keywords || []).join(" ").toLowerCase();

  let score = 0;

  terms.forEach((term) => {
    if (name.includes(term)) score += 10;
    if (family.includes(term)) score += 6;
    if (keywords.includes(term)) score += 5;
    if (notes.includes(term)) score += 4;
    if (category.includes(term)) score += 3;
    if (occasions.includes(term)) score += 3;
    if (seasons.includes(term)) score += 2;
    if (short.includes(term)) score += 2;
    if (desc.includes(term)) score += 1;
  });

  // Bonus for exact whole word matches on name
  terms.forEach((term) => {
    const words = name.split(/\s+/);
    if (words.includes(term)) score += 5;
  });

  return score;
};

/* ============================================================
   FILTER + SORT
   ============================================================ */

const runSearch = () => {
  const term = String(query || "")
    .trim()
    .toLowerCase();

  if (!term) {
    lastResults = [];
    return [];
  }

  const terms = term.split(/\s+/).filter(Boolean);

  const scored = products
    .map((p) => ({ p, s: scoreProduct(p, terms) }))
    .filter((x) => x.s > 0);

  // Sort
  const sortFn =
    {
      relevance: (a, b) => b.s - a.s,
      "price-asc": (a, b) =>
        Math.min(...a.p.volumes.map((v) => v.price)) -
        Math.min(...b.p.volumes.map((v) => v.price)),
      "price-desc": (a, b) =>
        Math.min(...b.p.volumes.map((v) => v.price)) -
        Math.min(...a.p.volumes.map((v) => v.price)),
      rating: (a, b) => b.p.rating - a.p.rating,
      "name-asc": (a, b) => a.p.name.localeCompare(b.p.name),
    }[sort] || ((a, b) => b.s - a.s);

  scored.sort(sortFn);

  lastResults = scored.map((x) => x.p);
  return lastResults;
};

/* ============================================================
   RENDER: FILTER CHIPS
   ============================================================ */

const renderFilters = () => {
  const host = qs("[data-search-filters]");
  const chips = qs("[data-search-chips]");
  if (!host || !chips) return;

  if (!lastResults.length) {
    host.hidden = true;
    return;
  }

  // Count categories present in results
  const counts = { all: lastResults.length };
  lastResults.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  const cats = ["all", ...Object.keys(counts).filter((k) => k !== "all")];

  host.hidden = false;
  chips.innerHTML = cats
    .map((c) => {
      const label = c === "all" ? "All Results" : c;
      const n = counts[c];
      const active = c === activeCategory ? "is-active" : "";
      return `
      <button class="chip ${active}" type="button" data-search-chip="${escapeHtml(c)}">
        ${escapeHtml(label)} <span class="chip__count">${n}</span>
      </button>
    `;
    })
    .join("");

  refreshIcons(chips);
};

/* ============================================================
   RENDER: RESULTS
   ============================================================ */

const renderResults = () => {
  const grid = qs("[data-search-grid]");
  const empty = qs("[data-search-empty]");
  const meta = qs("[data-search-meta]");
  const countEl = qs("[data-search-count]");
  const countLabel = qs("[data-search-count-label]");
  const queryEl = qs("[data-search-query]");
  const emptyText = qs("[data-search-empty-text]");
  const browse = qs("[data-search-browse]");

  if (!grid) return;

  const term = String(query || "").trim();

  // ---------- No query ----------
  if (!term) {
    grid.innerHTML = "";
    if (empty) empty.hidden = true;
    if (meta) meta.hidden = true;
    if (qs("[data-search-filters]")) qs("[data-search-filters]").hidden = true;
    if (browse) browse.hidden = false;
    document.title = "Search — Rehmani Scents";
    return;
  }

  if (browse) browse.hidden = true;

  // ---------- Run search ----------
  const all = runSearch();

  // Apply category filter on top
  const list =
    activeCategory === "all"
      ? all
      : all.filter((p) => p.category === activeCategory);

  // ---------- Meta ----------
  if (meta) meta.hidden = false;
  if (countEl) countEl.textContent = String(list.length);
  if (countLabel)
    countLabel.textContent = list.length === 1 ? "result" : "results";
  if (queryEl) queryEl.textContent = `"${term}"`;

  // ---------- Filters ----------
  renderFilters();

  // ---------- Empty state ----------
  if (!list.length) {
    grid.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      if (emptyText) {
        emptyText.textContent = `We could not find any fragrances matching "${term}". Try a different note, family or keyword.`;
      }
      refreshIcons(empty);
    }
    return;
  }

  if (empty) empty.hidden = true;

  // ---------- Grid ----------
  renderProductGrid(grid, list);
  document.title = `${list.length} ${list.length === 1 ? "result" : "results"} for "${term}" — Rehmani Scents`;

  // Re-observe reveals + rebind fallbacks
  window.dispatchEvent(new CustomEvent("rs:content-updated"));
};

/* ============================================================
   FORM + INPUT HANDLERS
   ============================================================ */

const syncInputState = () => {
  const input = qs("[data-search-field]");
  const clearBtn = qs("[data-search-clear]");
  if (!input) return;

  // Ensure the field reflects the current query
  if (input.value !== query) input.value = query;

  if (clearBtn) clearBtn.hidden = !input.value;
};

const updateURL = () => {
  setParams({
    q: query || null,
    sort: sort !== "relevance" ? sort : null,
    category: activeCategory !== "all" ? activeCategory : null,
  });
};

const applyQuery = (value, { syncUrl = true } = {}) => {
  query = String(value || "").trim();
  activeCategory = "all";
  syncInputState();
  renderResults();
  if (syncUrl) updateURL();
};

const initForm = () => {
  const form = qs("[data-search-form]");
  const input = qs("[data-search-field]");
  const clearBtn = qs("[data-search-clear]");
  if (!form || !input) return;

  // Submit — navigate with query in URL
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    applyQuery(input.value);
    input.blur();

    // Scroll results into view on mobile
    if (window.innerWidth < 768 && query) {
      const section = qs(".search-section");
      if (section) {
        const top = section.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  });

  // Live feedback while typing — but only if there is already a query in
  // the URL. This prevents flooding the page with results on every keystroke
  // on the initial empty state.
  const onInput = debounce(() => {
    const val = input.value;
    if (clearBtn) clearBtn.hidden = !val;
    if (query) applyQuery(val);
  }, 320);

  input.addEventListener("input", onInput);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      if (clearBtn) clearBtn.hidden = true;
      applyQuery("");
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      clearBtn.hidden = true;
      applyQuery("");
      input.focus();
    });
  }
};

/* ============================================================
   SUGGESTION TAGS
   ============================================================ */

const initSuggestionTags = () => {
  document.addEventListener("click", (e) => {
    const tag = e.target.closest("[data-search-suggest]");
    if (!tag) return;
    e.preventDefault();
    const value = tag.dataset.searchSuggest;
    const input = qs("[data-search-field]");
    if (input) input.value = value;
    applyQuery(value);
  });
};

/* ============================================================
   CATEGORY CHIPS
   ============================================================ */

const initChips = () => {
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-search-chip]");
    if (!chip) return;
    e.preventDefault();
    activeCategory = chip.dataset.searchChip;
    renderResults();
    updateURL();
  });
};

/* ============================================================
   SORT
   ============================================================ */

const initSort = () => {
  const select = qs("[data-search-sort]");
  if (!select) return;
  on(select, "change", () => {
    sort = select.value;
    renderResults();
    updateURL();
  });
};

/* ============================================================
   CLEAR ALL
   ============================================================ */

const initClearAll = () => {
  const btn = qs("[data-search-clear-all]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const input = qs("[data-search-field]");
    if (input) input.value = "";
    const clearBtn = qs("[data-search-clear]");
    if (clearBtn) clearBtn.hidden = true;
    applyQuery("");
    input?.focus();
  });
};

/* ============================================================
   BOOT
   ============================================================ */

initPage({
  accordions: false,
  counters: false,

  afterReady: () => {
    // Read initial state from URL
    query = getParam("q", "").trim();
    sort = getParam("sort", "relevance") || "relevance";
    activeCategory = getParam("category", "all") || "all";

    // Sync sort select
    const sortSelect = qs("[data-search-sort]");
    if (sortSelect && sort) sortSelect.value = sort;

    syncInputState();

    // Wire interactions
    initForm();
    initSuggestionTags();
    initChips();
    initSort();
    initClearAll();

    // Initial render
    renderResults();

    // Support back/forward between searches
    window.addEventListener("popstate", () => {
      query = getParam("q", "").trim();
      sort = getParam("sort", "relevance") || "relevance";
      activeCategory = getParam("category", "all") || "all";
      if (sortSelect) sortSelect.value = sort;
      syncInputState();
      renderResults();
    });

    refreshIcons();
  },
});
