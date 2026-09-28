/* ============================================================
   js/article-page.js
   Article detail page — reads ?id=<slug>.
   Falls back to the featured article if no id is provided,
   shows a 404 state if the id is invalid.
   ============================================================ */

import { initPage } from "./page-init.js";
import {
  qs,
  qsa,
  on,
  refreshIcons,
  bindImageFallbacks,
  escapeHtml,
  getParam,
  copyText,
  toast,
} from "./utils.js";
import {
  getArticleBySlug,
  getFeaturedArticle,
  getRelatedArticles,
  formatArticleDate,
} from "./blog-store.js";

/* ============================================================
   RESOLVE ARTICLE
   Read the ID at module load (before any DOM work).
   - If URL has a valid id → use it
   - If URL has no id → use the featured article (no redirect)
   - If URL has an invalid id → show 404
   ============================================================ */

const URL_ID = getParam("id", "").trim();

let article = null;

const resolveArticle = () => {
  if (URL_ID) {
    return getArticleBySlug(URL_ID); // null if invalid → 404
  }
  return getFeaturedArticle(); // fallback, no redirect
};

/* ============================================================
   RENDER: HEADER
   ============================================================ */

const renderHeaderBlock = () => {
  const bc = qs("[data-article-breadcrumbs]");
  if (bc) {
    bc.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="blog.html">Journal</a></li>
      <li aria-current="page">${escapeHtml(article.title)}</li>
    `;
  }

  const cat = qs("[data-article-category]");
  if (cat) cat.textContent = article.categoryLabel;

  const title = qs("[data-article-title]");
  if (title) title.textContent = article.title;

  const excerpt = qs("[data-article-excerpt]");
  if (excerpt) excerpt.textContent = article.excerpt;

  const author = qs("[data-article-author]");
  if (author) author.textContent = "By " + article.author;

  const date = qs("[data-article-date]");
  if (date) {
    date.textContent = formatArticleDate(article.date);
    date.setAttribute("datetime", article.date);
  }

  const read = qs("[data-article-readtime]");
  if (read) read.textContent = `${article.readTime} min read`;
};

/* ============================================================
   RENDER: HERO IMAGE
   ============================================================ */

const renderHero = () => {
  const img = qs("[data-article-hero-img]");
  if (!img) return;
  img.src = article.hero;
  img.alt = article.title;
  img.dataset.fallbackName = article.title;
};

/* ============================================================
   RENDER: BODY
   ============================================================ */

const renderBody = () => {
  const host = qs("[data-article-body]");
  if (!host) return;
  host.innerHTML = article.body;
};

/* ============================================================
   RENDER: TAGS
   ============================================================ */

const renderTags = () => {
  const host = qs("[data-article-tags]");
  if (!host) return;

  if (!article.tags?.length) {
    host.hidden = true;
    return;
  }

  host.hidden = false;
  host.innerHTML = `
    <span class="article-tags__label">Tags</span>
    ${article.tags
      .map(
        (t) => `
      <span class="article-tags__tag">${escapeHtml(t)}</span>
    `,
      )
      .join("")}
  `;
};

/* ============================================================
   RENDER: SHARE
   ============================================================ */

const renderShare = () => {
  // Build the canonical URL for sharing — always reflects the
  // currently displayed article (not the raw URL, in case we
  // auto-loaded the featured article)
  const canonical = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(article.slug)}`;
  const title = article.title;

  const x = qs("[data-article-share-x]");
  if (x) {
    x.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(canonical)}`;
  }

  const wa = qs("[data-article-share-wa]");
  if (wa) {
    wa.href = `https://wa.me/?text=${encodeURIComponent(title + " — " + canonical)}`;
  }

  const copy = qs("[data-article-copy]");
  if (copy && !copy.dataset.bound) {
    copy.dataset.bound = "1";
    copy.addEventListener("click", async () => {
      const ok = await copyText(canonical);
      if (ok) {
        toast("Link copied", "success");
        const icon = copy.querySelector("svg, i");
        if (icon) {
          const original = icon.outerHTML;
          icon.outerHTML = '<i data-lucide="check"></i>';
          refreshIcons(copy);
          setTimeout(() => {
            const current = copy.querySelector("svg, i");
            if (current) {
              current.outerHTML = original;
              refreshIcons(copy);
            }
          }, 1400);
        }
      } else {
        toast("Could not copy link", "error");
      }
    });
  }
};

/* ============================================================
   RENDER: RELATED
   ============================================================ */

const renderRelated = () => {
  const host = qs("[data-article-related]");
  const section = qs("[data-article-related-section]");
  if (!host || !section) return;

  const related = getRelatedArticles(article, 3);

  if (!related.length) {
    section.hidden = true;
    return;
  }

  host.innerHTML = related
    .map(
      (a) => `
    <a class="blog-card" href="article.html?id=${encodeURIComponent(a.slug)}">
      <div class="blog-card__media">
        <img src="${escapeHtml(a.thumb)}"
             alt="${escapeHtml(a.title)}"
             loading="lazy"
             data-fallback-name="${escapeHtml(a.title)}" />
      </div>
      <div class="blog-card__body">
        <p class="blog-card__cat">${escapeHtml(a.categoryLabel)}</p>
        <h3 class="blog-card__title">${escapeHtml(a.title)}</h3>
        <p class="blog-card__excerpt">${escapeHtml(a.excerpt)}</p>
        <div class="blog-card__meta">
          <span>${escapeHtml(formatArticleDate(a.date))}</span>
          <span class="divider-dot" aria-hidden="true"></span>
          <span>${a.readTime} min read</span>
        </div>
      </div>
    </a>
  `,
    )
    .join("");

  refreshIcons(host);
  bindImageFallbacks(host);
};

/* ============================================================
   SEO
   ============================================================ */

const updateSEO = () => {
  const canonical = `https://rehmaniscents.example/article.html?id=${article.slug}`;

  document.title = `${article.title} — Rehmani Scents Journal`;

  const setMeta = (sel, attr, val) => {
    let el = document.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      if (sel.includes("property="))
        el.setAttribute("property", sel.match(/"(.+)"/)[1]);
      if (sel.includes("name="))
        el.setAttribute("name", sel.match(/"(.+)"/)[1]);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, val);
  };

  setMeta('meta[name="description"]', "content", article.excerpt);
  setMeta('meta[property="og:title"]', "content", article.title);
  setMeta('meta[property="og:description"]', "content", article.excerpt);
  setMeta('meta[property="og:image"]', "content", article.hero);
  setMeta('meta[property="og:url"]', "content", canonical);
  setMeta('meta[property="og:type"]', "content", "article");

  // Update canonical link
  let link = document.querySelector('link[rel="canonical"]');
  if (link) link.setAttribute("href", canonical);

  // JSON-LD
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    image: article.hero,
    datePublished: article.date,
    author: { "@type": "Organization", name: "Rehmani Scents" },
    publisher: { "@type": "Organization", name: "Rehmani Scents" },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);
};

/* ============================================================
   BOOT
   ============================================================ */

initPage({
  accordions: false,
  counters: false,

  afterReady: () => {
    const loading = qs("[data-article-loading]");
    const missing = qs("[data-article-missing]");
    const content = qs("[data-article-content]");

    article = resolveArticle();

    /* ---- No article found ---- */
    if (!article) {
      if (loading) loading.hidden = true;
      if (missing) missing.hidden = false;
      if (content) content.hidden = true;
      document.title = "Article Not Found — Rehmani Scents";
      refreshIcons();
      return;
    }

    /* ---- Auto-loaded featured article (no id in URL) ----
       Update the URL so refresh and share both work. */
    if (!URL_ID) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("id", article.slug);
        window.history.replaceState({}, "", url);
      } catch {
        /* ignore */
      }
    }

    /* ---- Render ---- */
    renderHeaderBlock();
    renderHero();
    renderBody();
    renderTags();
    renderShare();
    renderRelated();
    updateSEO();

    if (loading) loading.hidden = true;
    if (missing) missing.hidden = true;
    if (content) content.hidden = false;

    refreshIcons();
    bindImageFallbacks();
  },
});
