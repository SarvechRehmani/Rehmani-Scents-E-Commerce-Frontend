/* ============================================================
   js/search.js
   Search overlay with live results + keyboard navigation.
   ============================================================ */

import {
  qs,
  qsa,
  formatPrice,
  escapeHtml,
  refreshIcons,
  bindImageFallbacks,
  isEmail,
} from "./utils.js";
import { getProducts } from "./product-store.js";
import { toggle as wishlistToggle } from "./wishlist.js";

let overlay = null;
let input = null;
let results = null;
let activeIndex = -1;
let currentResults = [];

/* ---------- Search logic ---------- */
const scoreProduct = (product, terms) => {
  if (!terms.length) return 0;
  const hay = [
    product.name,
    product.category,
    product.family,
    product.shortDescription,
    product.description,
    product.notes.top,
    product.notes.heart,
    product.notes.base,
    ...(product.keywords || []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  terms.forEach((t) => {
    if (product.name.toLowerCase().includes(t)) score += 6;
    if (product.family.toLowerCase().includes(t)) score += 4;
    if (product.category.toLowerCase().includes(t)) score += 3;
    if (product.notes.top.toLowerCase().includes(t)) score += 2;
    if (product.notes.heart.toLowerCase().includes(t)) score += 2;
    if (product.notes.base.toLowerCase().includes(t)) score += 2;
    if (hay.includes(t)) score += 1;
  });
  return score;
};

export const searchProducts = (query, limit = 8) => {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);

  return getProducts()
    .map((p) => ({ p, s: scoreProduct(p, terms) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
};

/* ---------- Render ---------- */
const renderResults = (list, query) => {
  if (!results) return;

  if (!query.trim()) {
    results.innerHTML = `
      <div class="search-overlay__hint">
        <span><kbd>Enter</kbd> to search</span>
        <span><kbd>Esc</kbd> to close</span>
        <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
      </div>
    `;
    return;
  }

  if (!list.length) {
    results.innerHTML = `
      <div class="search-empty">
        <p>No fragrances match &ldquo;${escapeHtml(query)}&rdquo;.</p>
        <p style="margin-top:0.5rem;font-size:0.8rem">Try a note like <em>oud</em>, <em>rose</em> or <em>citrus</em>.</p>
      </div>
    `;
    return;
  }

  results.innerHTML = list
    .map((p, i) => {
      const base = p.volumes[0];
      return `
      <a class="search-result" href="product.html?id=${encodeURIComponent(p.id)}" data-result-index="${i}">
        <img class="search-result__img"
             src="${escapeHtml(p.images[0])}"
             alt=""
             loading="lazy"
             data-fallback-name="${escapeHtml(p.name)}" />
        <div class="search-result__body">
          <div class="search-result__name">${escapeHtml(p.name)}</div>
          <div class="search-result__meta">${escapeHtml(p.category)} · ${escapeHtml(p.family)}</div>
        </div>
        <span class="search-result__price">${formatPrice(base.price)}</span>
      </a>
    `;
    })
    .join("");

  bindImageFallbacks(results);
  activeIndex = -1;
};

/* ---------- Open/close ---------- */
export const openSearch = () => {
  if (!overlay) return;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-locked");
  setTimeout(() => input?.focus(), 60);
};

export const closeSearch = () => {
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-locked");
};

/* ---------- Keyboard nav ---------- */
const moveActive = (delta) => {
  const nodes = qsa(".search-result", results);
  if (!nodes.length) return;

  activeIndex = (activeIndex + delta + nodes.length) % nodes.length;
  nodes.forEach((n, i) => n.classList.toggle("is-active", i === activeIndex));
  nodes[activeIndex]?.scrollIntoView({ block: "nearest" });
};

const commitSearch = () => {
  const q = input?.value.trim();
  if (!q) return;
  window.location.href = `search.html?q=${encodeURIComponent(q)}`;
};

/* ---------- Init ---------- */
export const initSearch = () => {
  overlay = qs("[data-search-overlay]");
  input = qs("[data-search-input]", overlay);
  results = qs("[data-search-results]", overlay);
  if (!overlay || !input || !results) return;

  renderResults([], "");

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-search-open]")) {
      e.preventDefault();
      openSearch();
      return;
    }
    if (e.target.closest("[data-search-close]")) {
      e.preventDefault();
      closeSearch();
      return;
    }
    if (e.target === overlay) closeSearch();
  });

  const runSearch = () => {
    const q = input.value;
    currentResults = searchProducts(q, 8);
    renderResults(currentResults, q);
  };

  input.addEventListener("input", runSearch);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        window.location.href = `product.html?id=${currentResults[activeIndex].id}`;
      } else {
        commitSearch();
      }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveActive(1);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveActive(-1);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open"))
      closeSearch();
    // Global shortcut: / or Ctrl+K
    const tag = (e.target.tagName || "").toLowerCase();
    const typing =
      tag === "input" || tag === "textarea" || e.target.isContentEditable;
    if (
      !typing &&
      (e.key === "/" ||
        (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)))
    ) {
      e.preventDefault();
      openSearch();
    }
  });
};
