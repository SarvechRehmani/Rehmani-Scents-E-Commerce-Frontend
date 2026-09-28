/* ============================================================
   js/storage.js
   Safe localStorage wrapper. Every value is JSON-encoded and
   every read is guarded against corrupted / tampered data.
   ============================================================ */

const PREFIX = "rs_";

const safeParse = (raw, fallback) => {
  if (raw == null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
};

export const storage = {
  get(key, fallback = null) {
    try {
      return safeParse(localStorage.getItem(PREFIX + key), fallback);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
      return true;
    } catch {
      return false;
    }
  },

  /* Keys with plain (non-JSON) values — theme uses raw strings */
  getRaw(key, fallback = null) {
    try {
      return localStorage.getItem(PREFIX + key) ?? fallback;
    } catch {
      return fallback;
    }
  },
  setRaw(key, value) {
    try {
      localStorage.setItem(PREFIX + key, String(value));
      return true;
    } catch {
      return false;
    }
  },

  /* Namespaced keys */
  keys: {
    cart: "cart",
    wishlist: "wishlist",
    theme: "theme",
    orders: "orders",
    reviews: "reviews",
    newsletter: "newsletter",
    contact: "contact_submissions",
    recentlyViewed: "recently_viewed",
    discount: "active_discount",
  },
};

/* ---------- Recently viewed ---------- */
export const pushRecentlyViewed = (productId, limit = 8) => {
  if (!productId) return;
  let list = storage.get(storage.keys.recentlyViewed, []);
  if (!Array.isArray(list)) list = [];
  list = [productId, ...list.filter((id) => id !== productId)].slice(0, limit);
  storage.set(storage.keys.recentlyViewed, list);
};

export const getRecentlyViewed = (limit = 8) => {
  const list = storage.get(storage.keys.recentlyViewed, []);
  return Array.isArray(list) ? list.slice(0, limit) : [];
};
