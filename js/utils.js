/* ============================================================
   js/utils.js
   Shared helpers — DOM, formatting, validation, toasts, images.
   ============================================================ */

/* ---------- DOM ---------- */
export const qs = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) =>
  Array.from(ctx.querySelectorAll(sel));

export const on = (el, ev, fn, opts) => {
  if (!el) return () => {};
  el.addEventListener(ev, fn, opts);
  return () => el.removeEventListener(ev, fn, opts);
};

export const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("data-") || k.startsWith("aria-"))
      node.setAttribute(k, v);
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
};

/* ---------- Formatting ---------- */
export const formatPrice = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export const discountPercent = (price, compare) => {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
};

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const truncate = (s, n = 120) =>
  s && s.length > n ? s.slice(0, n).trim() + "…" : s;

/* ---------- Functional ---------- */
export const debounce = (fn, wait = 200) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

export const throttle = (fn, wait = 100) => {
  let last = 0,
    timer;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(
        () => {
          last = Date.now();
          fn(...args);
        },
        wait - (now - last),
      );
    }
  };
};

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

export const uniqueId = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const escapeHtml = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/* ---------- Validation ---------- */
export const isEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());

export const isPakistaniPhone = (v) => {
  const digits = String(v || "").replace(/[\s\-()]/g, "");
  // +92XXXXXXXXXX, 92XXXXXXXXXX, 03XXXXXXXXX
  return /^(\+92|92|0)3\d{9}$/.test(digits);
};

export const normalizePhone = (v) => String(v || "").replace(/[\s\-()]/g, "");

/* ---------- Scroll lock ---------- */
let lockCount = 0;
export const lockScroll = () => {
  lockCount++;
  document.body.style.overflow = "hidden";
  document.body.classList.add("is-locked");
};
export const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = "";
    document.body.classList.remove("is-locked");
  }
};

/* ---------- Toasts ---------- */
export const toast = (message, type = "default", duration = 3200) => {
  const container = qs("[data-toasts]");
  if (!container) return;

  const iconName =
    type === "success"
      ? "check-circle"
      : type === "error"
        ? "alert-circle"
        : "info";

  const node = document.createElement("div");
  node.className = `toast toast--${type}`;
  node.setAttribute("role", "status");
  node.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(node);

  if (window.lucide?.createIcons)
    window.lucide.createIcons({ nameAttr: "data-lucide" });

  setTimeout(() => {
    node.classList.add("is-out");
    setTimeout(() => node.remove(), 340);
  }, duration);
};

/* ---------- Image fallback ---------- */
export const handleImageFallback = (img, productName = "Fragrance") => {
  if (!img || img.dataset.fallbackBound === "1") return;
  img.dataset.fallbackBound = "1";

  const applyFallback = () => {
    const parent = img.parentElement;
    if (!parent || parent.querySelector(".img-fallback")) return;

    const wrap = document.createElement("div");
    wrap.className = "img-fallback";
    wrap.innerHTML = `
      <i data-lucide="droplet"></i>
      <span>${escapeHtml(productName)}</span>
      <small>Rehmani Scents</small>
    `;
    img.style.display = "none";
    parent.appendChild(wrap);
    if (window.lucide?.createIcons)
      window.lucide.createIcons({ nameAttr: "data-lucide" });
  };

  img.addEventListener("error", applyFallback, { once: true });
  if (img.complete && img.naturalWidth === 0) applyFallback();
};

export const bindImageFallbacks = (root = document) => {
  qsa("img[data-fallback-name]", root).forEach((img) =>
    handleImageFallback(img, img.dataset.fallbackName),
  );
};

/* ---------- Reveal on scroll ---------- */
export const observeReveals = (root = document) => {
  const nodes = qsa("[data-reveal]", root);
  if (!nodes.length || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-revealed"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
  );

  nodes.forEach((n) => io.observe(n));
};

/* ---------- Query params ---------- */
export const getParam = (key, fallback = null) => {
  try {
    return new URLSearchParams(window.location.search).get(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export const getAllParams = () => {
  try {
    return Object.fromEntries(
      new URLSearchParams(window.location.search).entries(),
    );
  } catch {
    return {};
  }
};

export const setParams = (updates = {}, replace = true) => {
  try {
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
  } catch {
    /* ignore */
  }
};

/* ---------- Lucide helper ---------- */
export const refreshIcons = (root = document) => {
  if (window.lucide?.createIcons)
    window.lucide.createIcons({ nameAttr: "data-lucide" });
};

/* ---------- Accordion height animation ---------- */
export const openAccordion = (panel, inner) => {
  panel.style.height = inner.scrollHeight + "px";
};
export const closeAccordion = (panel) => {
  panel.style.height = "0px";
};

/* ---------- Copy to clipboard ---------- */
export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
