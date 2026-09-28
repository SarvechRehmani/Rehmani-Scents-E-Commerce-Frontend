/* ============================================================
   js/admin-blog.js
   Blog admin — list, create, edit, delete articles.
   ============================================================ */

import { initTheme } from "./theme.js";
import { renderAdminLayout } from "./admin-layout.js";
import { requireAuth } from "./admin-auth.js";
import {
  qs,
  qsa,
  refreshIcons,
  escapeHtml,
  debounce,
  toast,
  slugify,
} from "./utils.js";
import {
  getArticles,
  saveArticle,
  deleteArticle,
  resetArticles,
  isCustomized,
  getBlogStats,
  formatArticleDate,
  BLOG_CATEGORIES,
} from "./blog-store.js";

/* ---------- Guard ---------- */
if (!requireAuth()) {
  // redirected
} else {
  initTheme();
  renderAdminLayout();
  initBlogPage();
}

let editingArticle = null;

/* ============================================================
   INIT
   ============================================================ */

function initBlogPage() {
  renderStats();
  renderTable();
  wireTableActions();
  wireModal();
  wireReset();
}

/* ============================================================
   STATS
   ============================================================ */

function renderStats() {
  const host = qs("[data-blog-stats]");
  if (!host) return;

  const s = getBlogStats();

  host.innerHTML = `
    <span class="admin-chip">Total: <strong>${s.total}</strong></span>
    <span class="admin-chip">Featured: <strong>${s.featured}</strong></span>
    <span class="admin-chip">Categories: <strong>${s.categories}</strong></span>
    ${isCustomized() ? `<span class="admin-chip admin-chip--accent"><i data-lucide="pencil"></i> Custom articles</span>` : ""}
  `;
  refreshIcons(host);
}

/* ============================================================
   TABLE
   ============================================================ */

function getCategoryLabel(key) {
  const cat = BLOG_CATEGORIES.find((c) => c.key === key);
  return cat ? cat.label : key;
}

function renderTable() {
  const tbody = qs("[data-blog-tbody]");
  const empty = qs("[data-blog-empty]");
  const count = qs("[data-blog-count]");
  if (!tbody) return;

  const list = getArticles();

  if (count)
    count.textContent = `${list.length} ${list.length === 1 ? "article" : "articles"}`;

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
    .map(
      (a) => `
    <tr data-article-row="${escapeHtml(a.id)}">
      <td>
        <img class="admin-thumb" src="${escapeHtml(a.thumb || a.hero || "")}" alt="" loading="lazy" />
      </td>
      <td>
        <p class="admin-table__name">${escapeHtml(a.title)}</p>
        <p class="admin-table__meta">${escapeHtml(a.slug || a.id)}</p>
      </td>
      <td class="admin-table__muted">${escapeHtml(getCategoryLabel(a.category))}</td>
      <td class="admin-table__muted">${formatArticleDate(a.date)}</td>
      <td class="admin-table__muted">${a.readTime || "—"} min</td>
      <td>
        ${a.featured ? '<span class="admin-flag admin-flag--gold">Featured</span>' : '<span class="admin-table__muted">—</span>'}
      </td>
      <td>
        <div class="admin-table__actions">
          <button class="icon-btn" type="button" title="Edit"
                  data-article-edit="${escapeHtml(a.id)}">
            <i data-lucide="pencil"></i>
          </button>
          <button class="icon-btn icon-btn--danger" type="button" title="Delete"
                  data-article-delete="${escapeHtml(a.id)}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  refreshIcons(tbody);
}

/* ============================================================
   TABLE ACTIONS
   ============================================================ */

function wireTableActions() {
  const tbody = qs("[data-blog-tbody]");
  if (!tbody) return;

  tbody.addEventListener("click", (e) => {
    const edit = e.target.closest("[data-article-edit]");
    if (edit) {
      e.preventDefault();
      openEditor(edit.dataset.articleEdit);
      return;
    }

    const del = e.target.closest("[data-article-delete]");
    if (del) {
      e.preventDefault();
      const article = getArticles().find(
        (a) => a.id === del.dataset.articleDelete,
      );
      if (!article) return;
      if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`))
        return;
      deleteArticle(article.id);
      toast("Article deleted");
      renderTable();
      renderStats();
    }
  });
}

/* ============================================================
   MODAL
   ============================================================ */

function openModal(m) {
  if (!m) return;
  m.classList.add("is-open");
  m.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-locked");
}

function closeModal(m) {
  if (!m) return;
  m.classList.remove("is-open");
  m.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-locked");
}

function fillForm(article) {
  const form = qs("[data-article-form]");
  const set = (name, value) => {
    const input = form.querySelector(`[data-field="${name}"]`);
    if (!input) return;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value ?? "";
  };

  set("originalId", article.id || "");
  set("title", article.title || "");
  set("category", article.category || "guides");
  set(
    "date",
    article.date
      ? article.date.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  set("readTime", article.readTime || 5);
  set("author", article.author || "Rehmani Scents");
  set("excerpt", article.excerpt || "");
  set("hero", article.hero || "");
  set("body", article.body || "");
  set("tags", (article.tags || []).join(", "));
  set("featured", Boolean(article.featured));
}

function openEditor(articleId = null) {
  const modal = qs("[data-article-modal]");
  const eyebrow = qs("[data-article-eyebrow]");
  const title = qs("[data-article-modal-title]");

  if (articleId) {
    const article = getArticles().find((a) => a.id === articleId);
    if (!article) return;
    editingArticle = article;
    if (eyebrow) eyebrow.textContent = "Edit Article";
    if (title) title.textContent = article.title;
    fillForm(article);
  } else {
    editingArticle = null;
    if (eyebrow) eyebrow.textContent = "New Article";
    if (title) title.textContent = "Write An Article";
    fillForm({ category: "guides", tags: [] });
  }

  openModal(modal);
  setTimeout(() => qs("#a-title")?.focus(), 80);
}

function wireModal() {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-article-close]")) {
      closeModal(qs("[data-article-modal]"));
    }
    if (e.target.closest("[data-article-new]")) {
      e.preventDefault();
      openEditor(null);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal(qs("[data-article-modal]"));
  });

  const saveBtn = qs("[data-article-save]");
  if (saveBtn) saveBtn.addEventListener("click", handleSave);
}

/* ============================================================
   SAVE
   ============================================================ */

function readForm() {
  const form = qs("[data-article-form]");
  const get = (name) => {
    const input = form.querySelector(`[data-field="${name}"]`);
    if (!input) return "";
    if (input.type === "checkbox") return input.checked;
    return input.value.trim();
  };

  const title = get("title");
  const slug = slugify(title);

  return {
    id: get("originalId") || slug,
    slug,
    title,
    category: get("category"),
    categoryLabel:
      (BLOG_CATEGORIES.find((c) => c.key === get("category")) || {}).label ||
      "Article",
    excerpt: get("excerpt"),
    hero:
      get("hero") ||
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80",
    thumb:
      get("hero") ||
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    date: get("date") || new Date().toISOString().slice(0, 10),
    readTime: Number(get("readTime")) || 5,
    author: get("author") || "Rehmani Scents",
    featured: get("featured"),
    tags: get("tags")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    body: get("body"),
  };
}

function handleSave() {
  const article = readForm();
  const form = qs("[data-article-form]");
  const errorEl = form.querySelector('[data-error="title"]');

  if (!article.title) {
    if (errorEl) errorEl.textContent = "Title is required.";
    qs("#a-title")?.focus();
    return;
  }
  if (errorEl) errorEl.textContent = "";

  saveArticle(article);
  toast(editingArticle ? "Article updated" : "Article published", "success");
  closeModal(qs("[data-article-modal]"));
  renderTable();
  renderStats();
}

/* ============================================================
   RESET
   ============================================================ */

function wireReset() {
  const btn = qs("[data-blog-reset]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!isCustomized()) {
      toast("Already using the default articles.");
      return;
    }
    if (
      !window.confirm(
        "Reset articles to the six defaults? Local edits will be lost.",
      )
    )
      return;
    resetArticles();
    toast("Articles reset to default", "success");
    renderTable();
    renderStats();
  });
}
