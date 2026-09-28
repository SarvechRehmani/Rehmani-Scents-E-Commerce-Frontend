/* ============================================================
   js/wishlist.js
   Persistent wishlist + a single source of truth for all
   heart buttons across the site.
   ============================================================ */

import { storage } from "./storage.js";
import { qsa, toast } from "./utils.js";
import { getProductById } from "./product-store.js";

const KEY = storage.keys.wishlist;

let cache = null;

const read = () => {
  if (cache) return cache;
  const raw = storage.get(KEY, []);
  cache = Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : [];
  return cache;
};

const write = (list) => {
  cache = Array.isArray(list) ? list : [];
  storage.set(KEY, cache);
  emit();
};

const emit = () => {
  const items = getItems();
  window.dispatchEvent(
    new CustomEvent("rs:wishlist-updated", {
      detail: { ids: items.map((p) => p.id), count: items.length },
    }),
  );
  syncUI();
};

/* ---------- Public API ---------- */
export const getIds = () => [...read()];

export const getItems = () =>
  read()
    .map((id) => getProductById(id))
    .filter(Boolean);

export const has = (id) => read().includes(id);

export const count = () => read().length;

export const add = (id) => {
  const product = getProductById(id);
  if (!product) return false;

  const list = read();
  if (list.includes(id)) return false;

  write([id, ...list]);
  toast(`${product.name} added to wishlist`, "success");
  return true;
};

export const remove = (id, silent = false) => {
  const list = read();
  if (!list.includes(id)) return false;

  const product = getProductById(id);
  write(list.filter((x) => x !== id));

  if (!silent) toast(`${product?.name || "Item"} removed from wishlist`);
  return true;
};

export const toggle = (id) => {
  if (has(id)) {
    remove(id);
    return false;
  }
  add(id);
  return true;
};

export const clear = () => write([]);

/* ---------- UI sync ---------- */
const syncUI = () => {
  const list = read();
  qsa("[data-wishlist-badge]").forEach((node) => {
    node.textContent = String(list.length);
    node.hidden = list.length === 0;
  });

  qsa("[data-wishlist-btn]").forEach((btn) => {
    const id = btn.dataset.wishlistId;
    const active = list.includes(id);
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
    btn.setAttribute(
      "aria-label",
      active ? "Remove from wishlist" : "Add to wishlist",
    );
  });
};

/* ---------- Event delegation ---------- */
export const initWishlist = () => {
  syncUI();

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-wishlist-btn]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const id = btn.dataset.wishlistId;
    if (!id) return;
    toggle(id);
  });

  // Cross-tab sync
  window.addEventListener("storage", (e) => {
    if (e.key === "rs_" + KEY) {
      cache = null;
      emit();
    }
  });

  window.addEventListener("rs:wishlist-sync", syncUI);
};
