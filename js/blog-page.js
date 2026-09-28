/* ============================================================
   js/blog-page.js
   Blog listing — featured article, category tabs, grid.
   ============================================================ */

import { initPage } from "./page-init.js";
import {
  qs,
  qsa,
  refreshIcons,
  bindImageFallbacks,
  escapeHtml,
} from "./utils.js";
import {
  getArticles,
  BLOG_CATEGORIES,
  getArticlesByCategory,
  getFeaturedArticle,
  formatArticleDate,
} from "./blog-store.js";
import { isEmail } from "./utils.js";
import { storage } from "./storage.js";
import { toast } from "./utils.js";

let activeCategory = "all";

/* ============================================================
   RENDER: FEATURED
   ============================================================ */

const renderFeatured = () => {
  const host = qs("[data-blog-featured]");
  if (!host) return;

  const article = getFeaturedArticle();
  if (!article) {
    host.closest("[data-blog-featured-section]")?.setAttribute("hidden", "");
    return;
  }

  host.innerHTML = `
    <a class="blog-featured__card" href="article.html?id=${encodeURIComponent(article.slug)}">
      <div class="blog-featured__media">
        <img src="${escapeHtml(article.hero)}"
             alt="${escapeHtml(article.title)}"
             loading="lazy"
             data-fallback-name="${escapeHtml(article.title)}" />
        <span class="blog-featured__badge">Featured</span>
      </div>

      <div class="blog-featured__body">
        <p class="blog-featured__cat">${escapeHtml(article.categoryLabel)}</p>
        <h2 class="blog-featured__title">${escapeHtml(article.title)}</h2>
        <p class="blog-featured__excerpt">${escapeHtml(article.excerpt)}</p>

        <div class="blog-featured__meta">
          <span>${escapeHtml(formatArticleDate(article.date))}</span>
          <span class="divider-dot" aria-hidden="true"></span>
          <span>${article.readTime} min read</span>
        </div>

        <span class="blog-featured__cta">
          Read Article <i data-lucide="arrow-right"></i>
        </span>
      </div>
    </a>
  `;

  refreshIcons(host);
  bindImageFallbacks(host);
};

/* ============================================================
   RENDER: TABS
   ============================================================ */

const renderTabs = () => {
  const host = qs("[data-blog-tabs]");
  if (!host) return;

  host.innerHTML = BLOG_CATEGORIES.map(
    (cat) => `
    <button class="blog-tab ${cat.key === "all" ? "is-active" : ""}"
            type="button"
            role="tab"
            aria-selected="${cat.key === "all"}"
            data-blog-cat="${cat.key}">
      ${escapeHtml(cat.label)}
    </button>
  `,
  ).join("");

  host.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-blog-cat]");
    if (!btn) return;
    activeCategory = btn.dataset.blogCat;

    qsa(".blog-tab", host).forEach((t) => {
      const active = t === btn;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });

    renderGrid();
  });
};

/* ============================================================
   RENDER: CARD
   ============================================================ */

const renderCard = (article) => `
  <a class="blog-card" href="article.html?id=${encodeURIComponent(article.slug)}">
    <div class="blog-card__media">
      <img src="${escapeHtml(article.thumb)}"
           alt="${escapeHtml(article.title)}"
           loading="lazy"
           data-fallback-name="${escapeHtml(article.title)}" />
    </div>
    <div class="blog-card__body">
      <p class="blog-card__cat">${escapeHtml(article.categoryLabel)}</p>
      <h3 class="blog-card__title">${escapeHtml(article.title)}</h3>
      <p class="blog-card__excerpt">${escapeHtml(article.excerpt)}</p>
      <div class="blog-card__meta">
        <span>${escapeHtml(formatArticleDate(article.date))}</span>
        <span class="divider-dot" aria-hidden="true"></span>
        <span>${article.readTime} min read</span>
      </div>
    </div>
  </a>
`;

/* ============================================================
   RENDER: GRID
   ============================================================ */

const renderGrid = () => {
  const grid = qs("[data-blog-grid]");
  const empty = qs("[data-blog-empty]");
  const count = qs("[data-blog-count]");
  const countLabel = qs("[data-blog-count-label]");

  if (!grid) return;

  const list = getArticlesByCategory(activeCategory);

  if (count) count.textContent = String(list.length);
  if (countLabel)
    countLabel.textContent = list.length === 1 ? "article" : "articles";

  if (!list.length) {
    grid.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      refreshIcons(empty);
    }
    return;
  }

  if (empty) empty.hidden = true;

  grid.innerHTML = list.map(renderCard).join("");
  refreshIcons(grid);
  bindImageFallbacks(grid);

  // Re-run reveal observer for the newly injected cards
  window.dispatchEvent(new CustomEvent("rs:content-updated"));
};

/* ============================================================
   RESET
   ============================================================ */

const initReset = () => {
  const btn = qs("[data-blog-reset]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    activeCategory = "all";
    qsa(".blog-tab").forEach((t) => {
      const active = t.dataset.blogCat === "all";
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    renderGrid();
  });
};

/* ============================================================
   NEWSLETTER
   ============================================================ */

const initNewsletter = () => {
  const form = qs("[data-newsletter]");
  if (!form) return;

  const input = qs('input[type="email"]', form);
  const msg = qs("[data-newsletter-msg]");
  if (!input || !msg) return;

  const setMsg = (text, type = "") => {
    msg.textContent = text;
    msg.className = `newsletter__note ${type ? "is-" + type : ""}`;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = input.value.trim();

    if (!email) {
      setMsg("Please enter your email address.", "error");
      input.focus();
      return;
    }
    if (!isEmail(email)) {
      setMsg("That email doesn\u2019t look right.", "error");
      input.focus();
      return;
    }

    const existing = storage.get(storage.keys.newsletter, []);
    const list = Array.isArray(existing) ? existing : [];

    if (list.some((entry) => entry.email === email)) {
      setMsg("You are already on the list.", "success");
      input.value = "";
      return;
    }

    list.push({ email, source: "blog", date: new Date().toISOString() });
    storage.set(storage.keys.newsletter, list);

    setMsg("Thank you. You are on the list.", "success");
    input.value = "";
    toast("Subscribed to the fragrance journal", "success");
  });
};

/* ============================================================
   BOOT
   ============================================================ */

initPage({
  accordions: false,
  counters: false,

  afterReady: () => {
    renderFeatured();
    renderTabs();
    renderGrid();
    initReset();
    initNewsletter();
  },
});
