/* ============================================================
   js/product-store.js
   Read-through layer for products. Admin edits are stored in
   localStorage and take priority over the shipped catalog.

   Storage key: rs_products_custom
   ============================================================ */

import { products as DEFAULT_PRODUCTS } from "./products.js";
import { storage } from "./storage.js";

const KEY = "products_custom";

/* ---------- Read ---------- */

const readCustom = () => {
  const raw = storage.get(KEY, null);
  return Array.isArray(raw) ? raw : null;
};

const writeCustom = (list) => {
  storage.set(KEY, Array.isArray(list) ? list : []);
  window.dispatchEvent(new CustomEvent("rs:products-updated"));
};

/* ---------- Public API ---------- */

export const isCustomized = () => readCustom() !== null;

export const getProducts = () => {
  const custom = readCustom();
  return custom || DEFAULT_PRODUCTS;
};

export const getProductById = (id) => {
  if (!id) return null;
  const list = getProducts();
  return list.find((p) => p.id === id || p.slug === id) || null;
};

export const getDefaults = () => DEFAULT_PRODUCTS;

/* ---------- Write ---------- */

export const saveProduct = (product) => {
  if (!product || !product.id) return false;

  const list = [...(readCustom() || DEFAULT_PRODUCTS)];
  const idx = list.findIndex((p) => p.id === product.id);

  if (idx >= 0) list[idx] = { ...list[idx], ...product };
  else list.push(product);

  writeCustom(list);
  return true;
};

export const deleteProduct = (id) => {
  const list = (readCustom() || DEFAULT_PRODUCTS).filter((p) => p.id !== id);
  writeCustom(list);
  return true;
};

export const resetToDefaults = () => {
  storage.remove(KEY);
  window.dispatchEvent(new CustomEvent("rs:products-updated"));
};

/* ---------- Stats ---------- */

export const getProductStats = () => {
  const list = getProducts();
  return {
    total: list.length,
    men: list.filter((p) => p.category === "Men").length,
    women: list.filter((p) => p.category === "Women").length,
    unisex: list.filter((p) => p.category === "Unisex").length,
    bestSellers: list.filter((p) => p.flags?.bestSeller).length,
    newArrivals: list.filter((p) => p.flags?.newArrival).length,
    featured: list.filter((p) => p.flags?.featured).length,
    outOfStock: list.filter((p) => p.availability !== "in-stock").length,
  };
};

/* ---------- Filters ---------- */

export const getByCollection = (key) => {
  const k = String(key).toLowerCase();
  return getProducts().filter((p) => p.collections?.includes(k));
};

export const getProductsByCategory = (cat) =>
  getProducts().filter(
    (p) => p.category.toLowerCase() === String(cat).toLowerCase(),
  );

export const getFeatured = () => getProducts().filter((p) => p.flags?.featured);

export const getBestSellers = () =>
  getProducts().filter((p) => p.flags?.bestSeller);

export const getNewArrivals = () =>
  getProducts().filter((p) => p.flags?.newArrival);

/* ---------- Attribute helpers (for filters) ---------- */

export const getAllFamilies = () =>
  [
    ...new Set(
      getProducts()
        .map((p) => p.family)
        .filter(Boolean),
    ),
  ].sort();

export const getAllOccasions = () =>
  [...new Set(getProducts().flatMap((p) => p.occasion || []))].sort();

export const getAllSeasons = () =>
  [...new Set(getProducts().flatMap((p) => p.season || []))].sort();

export const getAllVolumes = () =>
  [
    ...new Set(
      getProducts().flatMap((p) => (p.volumes || []).map((v) => v.ml)),
    ),
  ].sort((a, b) => a - b);

export const getPriceRange = () => {
  const all = getProducts().flatMap((p) =>
    (p.volumes || []).map((v) => v.price),
  );
  return all.length
    ? { min: Math.min(...all), max: Math.max(...all) }
    : { min: 0, max: 0 };
};

/* ---------- Related products ---------- */

export const getRelated = (product, limit = 4) => {
  if (!product) return [];
  return getProducts()
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      if (p.category === product.category) score += 2;
      if (p.family === product.family) score += 3;
      if (p.collections?.some((c) => product.collections?.includes(c)))
        score += 1;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
};
