/* ============================================================
   js/blog-store.js
   Read-through layer for blog articles. Admin edits override
   the shipped ARTICLES from blog-data.js.

   Storage key: rs_articles_custom
   ============================================================ */

import { ARTICLES as DEFAULT_ARTICLES, BLOG_CATEGORIES } from "./blog-data.js";
import { storage } from "./storage.js";

const KEY = "articles_custom";

const readCustom = () => {
  const raw = storage.get(KEY, null);
  return Array.isArray(raw) ? raw : null;
};

const writeCustom = (list) => {
  storage.set(KEY, Array.isArray(list) ? list : []);
  window.dispatchEvent(new CustomEvent("rs:articles-updated"));
};

export const isCustomized = () => readCustom() !== null;

export const getArticles = () => readCustom() || DEFAULT_ARTICLES;

export const getArticleBySlug = (slug) =>
  getArticles().find((a) => a.slug === slug || a.id === slug) || null;

export const getArticlesByCategory = (cat) => {
  const list = getArticles();
  return cat === "all" ? list : list.filter((a) => a.category === cat);
};

export const getFeaturedArticle = () =>
  getArticles().find((a) => a.featured) || getArticles()[0];

export const getRelatedArticles = (article, limit = 3) => {
  if (!article) return [];
  return getArticles()
    .filter((a) => a.id !== article.id)
    .sort((a, b) => {
      const aMatch = a.category === article.category ? 2 : 0;
      const bMatch = b.category === article.category ? 2 : 0;
      return bMatch - aMatch;
    })
    .slice(0, limit);
};

export const saveArticle = (article) => {
  if (!article?.id) return false;
  const list = [...(readCustom() || DEFAULT_ARTICLES)];
  const idx = list.findIndex((a) => a.id === article.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...article };
  else list.unshift(article);
  writeCustom(list);
  return true;
};

export const deleteArticle = (id) => {
  const list = (readCustom() || DEFAULT_ARTICLES).filter((a) => a.id !== id);
  writeCustom(list);
  return true;
};

export const resetArticles = () => {
  storage.remove(KEY);
  window.dispatchEvent(new CustomEvent("rs:articles-updated"));
};

export const getBlogStats = () => {
  const list = getArticles();
  return {
    total: list.length,
    featured: list.filter((a) => a.featured).length,
    categories: BLOG_CATEGORIES.length - 1,
  };
};

export const formatArticleDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export { BLOG_CATEGORIES };
