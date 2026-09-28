/* ============================================================
   js/product-page.js
   Dynamic product detail template.
   Reads ?id=<slug> and renders the full PDP, related products,
   demo reviews, accordions, sticky mobile buy bar, and
   recently viewed rail.
   ============================================================ */

import { initTheme } from "./theme.js";
import { initCart, addProductToCart, openCart } from "./cart.js";
import {
  initWishlist,
  has as inWishlist,
  toggle as toggleWishlist,
} from "./wishlist.js";
import { renderHeader } from "./header.js";
import { renderFooter } from "./footer.js";
import { initSearch } from "./search.js";
import { initProductCards, renderProductRail } from "./product-card.js";
import {
  qs,
  qsa,
  on,
  formatPrice,
  discountPercent,
  escapeHtml,
  refreshIcons,
  bindImageFallbacks,
  observeReveals,
  lockScroll,
  unlockScroll,
  getParam,
  debounce,
  toast,
} from "./utils.js";
import { storage, pushRecentlyViewed, getRecentlyViewed } from "./storage.js";
import { getProductById, getRelated, products } from "./products.js";

/* ============================================================
   REVIEW TEMPLATES (DEMO)
   Deterministic per product, so a given product always shows
   the same demo reviews.
   ============================================================ */

const REVIEW_POOL = [
  {
    name: "Demo — Ayesha K.",
    rating: 5,
    days: 12,
    text: "Beautifully composed. The opening is bright and the drydown is warm and grounded. Lasts through a full working day.",
  },
  {
    name: "Demo — Bilal R.",
    rating: 4,
    days: 24,
    text: "Rich without being heavy. I wear it for evening gatherings and it never feels like too much.",
  },
  {
    name: "Demo — Hira M.",
    rating: 5,
    days: 8,
    text: "Exactly what I was looking for. Soft, elegant, and it settles into something very wearable.",
  },
  {
    name: "Demo — Usman T.",
    rating: 4,
    days: 34,
    text: "Great projection for the first few hours, then it becomes a closer skin scent. Very pleasant overall.",
  },
  {
    name: "Demo — Zain A.",
    rating: 5,
    days: 19,
    text: "Deep and grounded. The top notes keep it from feeling heavy. Worth the price.",
  },
  {
    name: "Demo — Mariam S.",
    rating: 4,
    days: 41,
    text: "Long-lasting and refined. I have received several compliments while wearing it.",
  },
  {
    name: "Demo — Faraz N.",
    rating: 5,
    days: 5,
    text: "Smooth, warm and never cloying. This has become part of my weekly rotation.",
  },
  {
    name: "Demo — Sana Y.",
    rating: 4,
    days: 27,
    text: "Lovely balance between the fresh opening and the warmer base. Works in most weather.",
  },
];

/* Deterministic "random" so each product gets a stable review set */
const seededPick = (seed, count) => {
  const hash = String(seed)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(REVIEW_POOL[(hash + i * 3) % REVIEW_POOL.length]);
  }
  return picked;
};

const formatDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ============================================================
   STATE
   ============================================================ */

let product = null;
let selectedVolume = null;
let quantity = 1;

/* ============================================================
   RENDER: BREADCRUMBS
   ============================================================ */

const renderBreadcrumbs = () => {
  const host = qs("[data-pdp-breadcrumbs]");
  if (!host) return;

  const categoryHref =
    product.category === "Men"
      ? "men.html"
      : product.category === "Women"
        ? "women.html"
        : "unisex.html";

  host.innerHTML = `
    <li><a href="index.html">Home</a></li>
    <li><a href="shop.html">Shop All</a></li>
    <li><a href="${categoryHref}">${escapeHtml(product.category)}</a></li>
    <li aria-current="page">${escapeHtml(product.name)}</li>
  `;
};

/* ============================================================
   RENDER: GALLERY
   ============================================================ */

const renderGallery = () => {
  const main = qs("[data-gallery-main]");
  const thumbsHost = qs("[data-gallery-thumbs]");
  const badgesHost = qs("[data-gallery-badges]");

  if (!main || !thumbsHost) return;

  const images = product.images?.length ? product.images : [""];

  // Badges
  const base = product.volumes[0];
  const onSale = base.comparePrice && base.comparePrice > base.price;
  const off = onSale ? discountPercent(base.price, base.comparePrice) : 0;
  const inStock = product.availability === "in-stock";

  if (badgesHost) {
    const badges = [];
    if (onSale) badges.push(`<span class="badge badge--sale">−${off}%</span>`);
    if (product.flags.newArrival)
      badges.push(`<span class="badge badge--new">New</span>`);
    if (product.flags.bestSeller)
      badges.push(`<span class="badge badge--gold">Best Seller</span>`);
    if (!inStock) badges.push(`<span class="badge badge--out">Sold Out</span>`);
    badgesHost.innerHTML = badges.join("");
  }

  // Main image
  main.src = images[0];
  main.alt = `${product.name} — ${product.family} fragrance`;
  main.dataset.fallbackName = product.name;

  // Thumbs
  thumbsHost.innerHTML = images
    .map(
      (src, i) => `
    <button class="gallery__thumb ${i === 0 ? "is-active" : ""}"
            type="button"
            data-gallery-thumb="${i}"
            aria-label="View image ${i + 1}"
            role="tab"
            aria-selected="${i === 0}">
      <img src="${escapeHtml(src)}" alt="" loading="lazy"
           data-fallback-name="${escapeHtml(product.name)}" />
    </button>
  `,
    )
    .join("");

  refreshIcons(thumbsHost);
  bindImageFallbacks(thumbsHost);
  bindImageFallbacks(qs("[data-gallery]"));

  // Thumb click (delegated once)
  on(thumbsHost, "click", (e) => {
    const btn = e.target.closest("[data-gallery-thumb]");
    if (!btn) return;
    const idx = Number(btn.dataset.galleryThumb);
    if (isNaN(idx) || !images[idx]) return;

    qsa(".gallery__thumb", thumbsHost).forEach((t, i) => {
      t.classList.toggle("is-active", i === idx);
      t.setAttribute("aria-selected", String(i === idx));
    });

    main.src = images[idx];
    main.dataset.fallbackName = product.name;
  });
};

/* ============================================================
   RENDER: PRICE + META
   ============================================================ */

const renderPrice = () => {
  if (!selectedVolume) return;

  const priceEl = qs("[data-pdp-price]");
  const compareEl = qs("[data-pdp-compare]");
  const saveEl = qs("[data-pdp-save]");

  if (priceEl) priceEl.textContent = formatPrice(selectedVolume.price);

  const onSale =
    selectedVolume.comparePrice &&
    selectedVolume.comparePrice > selectedVolume.price;
  const off = onSale
    ? discountPercent(selectedVolume.price, selectedVolume.comparePrice)
    : 0;

  if (compareEl) {
    if (onSale) {
      compareEl.textContent = formatPrice(selectedVolume.comparePrice);
      compareEl.hidden = false;
    } else {
      compareEl.hidden = true;
    }
  }

  if (saveEl) {
    if (onSale) {
      saveEl.textContent = `Save ${off}%`;
      saveEl.hidden = false;
    } else {
      saveEl.hidden = true;
    }
  }

  // Sync mobile buy bar
  const barPrice = qs("[data-buy-bar-price]");
  const barSize = qs("[data-buy-bar-size]");
  if (barPrice) {
    const small = barSize || document.createElement("small");
    barPrice.textContent = formatPrice(selectedVolume.price * quantity);
    small.setAttribute("data-buy-bar-size", "");
    small.textContent = `${selectedVolume.ml}ml · Qty ${quantity}`;
    barPrice.appendChild(small);
  }
};

/* ============================================================
   RENDER: VOLUME SELECTOR
   ============================================================ */

const renderVolumes = () => {
  const host = qs("[data-pdp-volumes]");
  if (!host) return;

  host.innerHTML = product.volumes
    .map(
      (v, i) => `
    <button class="variant ${i === 0 ? "is-active" : ""}"
            type="button"
            role="radio"
            aria-checked="${i === 0}"
            data-volume="${v.ml}">
      ${v.ml} ml
    </button>
  `,
    )
    .join("");

  on(host, "click", (e) => {
    const btn = e.target.closest("[data-volume]");
    if (!btn) return;
    const ml = Number(btn.dataset.volume);
    const found = product.volumes.find((v) => v.ml === ml);
    if (!found) return;

    selectedVolume = found;
    qsa(".variant", host).forEach((v) => {
      const active = v === btn;
      v.classList.toggle("is-active", active);
      v.setAttribute("aria-checked", String(active));
    });
    renderPrice();
  });
};

/* ============================================================
   RENDER: QUANTITY
   ============================================================ */

const renderQuantity = () => {
  const input = qs("[data-qty-input]");
  const dec = qs("[data-qty-dec]");
  const inc = qs("[data-qty-inc]");
  if (!input) return;

  const sync = (v) => {
    quantity = Math.max(1, Math.min(99, v));
    input.value = String(quantity);
    if (dec) dec.disabled = quantity <= 1;
    if (inc) inc.disabled = quantity >= 99;
    renderPrice();
  };

  sync(1);

  on(dec, "click", () => sync(quantity - 1));
  on(inc, "click", () => sync(quantity + 1));
  on(input, "change", () => {
    const v = parseInt(input.value, 10);
    sync(isNaN(v) ? 1 : v);
  });
};

/* ============================================================
   RENDER: STOCK + NOTES + ATTRS
   ============================================================ */

const renderStock = () => {
  const el = qs("[data-pdp-stock]");
  if (!el) return;
  const inStock = product.availability === "in-stock";
  el.className = `pdp__stock ${inStock ? "" : "is-out"}`;
  el.textContent = inStock
    ? "In stock — ships within 1 working day"
    : "Currently out of stock — notify us for the next batch";
};

const renderNotes = () => {
  const host = qs("[data-pdp-notes]");
  if (!host) return;
  host.innerHTML = `
    <div><dt>Top Notes</dt><dd>${escapeHtml(product.notes.top)}</dd></div>
    <div><dt>Heart Notes</dt><dd>${escapeHtml(product.notes.heart)}</dd></div>
    <div><dt>Base Notes</dt><dd>${escapeHtml(product.notes.base)}</dd></div>
  `;
};

const renderAttrs = () => {
  const host = qs("[data-pdp-attrs]");
  if (!host) return;

  const rows = [
    { label: "Fragrance Family", value: product.family },
    { label: "Category", value: product.category },
    { label: "Longevity", value: product.longevity },
    { label: "Occasion", value: product.occasion.join(", ") },
    { label: "Season", value: product.season.join(", ") },
    {
      label: "Available Sizes",
      value: product.volumes.map((v) => `${v.ml}ml`).join(" · "),
    },
  ];

  host.innerHTML = rows
    .map(
      (r) => `
    <div class="pdp__attr">
      <span class="pdp__attr-label">${escapeHtml(r.label)}</span>
      <span class="pdp__attr-value">${escapeHtml(r.value)}</span>
    </div>
  `,
    )
    .join("");
};

/* ============================================================
   RENDER: RATING + REVIEWS
   ============================================================ */

const renderRating = () => {
  const ratingEl = qs("[data-pdp-rating]");
  const linkEl = qs("[data-pdp-reviews-link]");
  if (ratingEl) {
    ratingEl.textContent = `${product.rating.toFixed(1)} · ${product.reviewCount} demo reviews`;
  }
  if (linkEl) {
    linkEl.textContent = "Read reviews";
    linkEl.href = "#reviews";
  }
};

const renderReviews = () => {
  const host = qs("[data-pdp-reviews]");
  const summaryHost = qs("[data-reviews-summary]");
  if (!host) return;

  const reviews = seededPick(product.id, 4);

  if (summaryHost) {
    const avg = product.rating.toFixed(1);
    summaryHost.innerHTML = `
      <div class="pdp-reviews__score">
        <span class="pdp-reviews__num">${avg}</span>
        <span class="pdp-reviews__outof">out of 5</span>
      </div>
      <p class="pdp-reviews__label">Based on ${product.reviewCount} demo reviews</p>
    `;
  }

  host.innerHTML = reviews
    .map(
      (r) => `
    <article class="review-item">
      <header class="review-item__head">
        <div>
          <p class="review-item__name">${escapeHtml(r.name)}</p>
          <span class="stars stars--sm" aria-label="${r.rating} out of 5">
            ${Array.from(
              { length: 5 },
              (_, i) =>
                `<i data-lucide="star" style="${i >= r.rating ? "opacity:.25;" : ""}"></i>`,
            ).join("")}
          </span>
        </div>
        <time class="review-item__date">${formatDate(r.days)}</time>
      </header>
      <p class="review-item__text">&ldquo;${escapeHtml(r.text)}&rdquo;</p>
      <span class="review-item__tag">Demo review</span>
    </article>
  `,
    )
    .join("");

  refreshIcons(host);
};

/* ============================================================
   RENDER: RELATED + RECENTLY VIEWED
   ============================================================ */

const renderRelated = () => {
  const host = qs("[data-pdp-related]");
  if (!host) return;

  const related = getRelated(product, 6);
  if (!related.length) {
    host.closest(".pdp-section")?.setAttribute("hidden", "");
    return;
  }

  renderProductRail(host, related);
};

const renderRecentlyViewed = () => {
  const section = qs("[data-recently-viewed]");
  const rail = qs("[data-recently-viewed-rail]");
  if (!section || !rail) return;

  const ids = getRecentlyViewed().filter((id) => id !== product.id);
  const items = ids.map(getProductById).filter(Boolean).slice(0, 6);

  if (!items.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  renderProductRail(rail, items);
};

/* ============================================================
   ACCORDIONS
   ============================================================ */

const renderAccordionDetails = () => {
  const host = qs("[data-accordion-details]");
  if (!host) return;

  host.innerHTML = `
    <p>${escapeHtml(product.description)}</p>
    <ul style="margin-top:1rem;padding-left:1.2rem">
      <li><strong>Fragrance family:</strong> ${escapeHtml(product.family)}</li>
      <li><strong>Longevity:</strong> ${escapeHtml(product.longevity)}</li>
      <li><strong>Best worn:</strong> ${escapeHtml(product.occasion.join(", "))}</li>
      <li><strong>Season:</strong> ${escapeHtml(product.season.join(", "))}</li>
      <li><strong>Available sizes:</strong> ${product.volumes.map((v) => `${v.ml}ml`).join(", ")}</li>
    </ul>
    <p style="margin-top:1rem;font-size:0.78rem;color:var(--color-subtle)">
      This is a fictional demo catalog entry. Fragrance descriptions, notes and performance
      claims are illustrative and not verified.
    </p>
  `;
};

const initAccordions = () => {
  const root = qs("[data-pdp-accordion]");
  if (!root) return;

  qsa(".accordion__trigger", root).forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      const panel = trigger.nextElementSibling;
      if (!panel) return;

      // Single-open accordion
      qsa(".accordion__trigger", root).forEach((t) => {
        if (t !== trigger && t.getAttribute("aria-expanded") === "true") {
          t.setAttribute("aria-expanded", "false");
          const p = t.nextElementSibling;
          if (p) p.style.height = "0px";
        }
      });

      if (expanded) {
        panel.style.height = panel.scrollHeight + "px";
        requestAnimationFrame(() => {
          panel.style.height = "0px";
        });
        trigger.setAttribute("aria-expanded", "false");
      } else {
        panel.style.height = panel.scrollHeight + "px";
        trigger.setAttribute("aria-expanded", "true");
        setTimeout(() => {
          if (trigger.getAttribute("aria-expanded") === "true") {
            panel.style.height = "auto";
          }
        }, 340);
      }
    });
  });
};

/* ============================================================
   BUY ACTIONS
   ============================================================ */

const addCurrentToCart = () => {
  if (!product || !selectedVolume) return false;
  return addProductToCart(product.id, { ml: selectedVolume.ml, qty: quantity });
};

const buyNow = () => {
  if (!addCurrentToCart()) return;
  setTimeout(() => {
    window.location.href = "checkout.html";
  }, 180);
};

const initBuyActions = () => {
  on(qs("[data-pdp-add]"), "click", () => {
    addCurrentToCart();
    openCart();
  });
  on(qs("[data-pdp-add-mobile]"), "click", () => {
    addCurrentToCart();
    openCart();
  });
  on(qs("[data-pdp-buy-now]"), "click", buyNow);
};

/* ============================================================
   WISHLIST
   ============================================================ */

const syncWishlistUI = () => {
  const btn = qs("[data-pdp-wishlist]");
  const label = qs("[data-pdp-wish-label]");
  if (!btn) return;

  const active = inWishlist(product.id);
  btn.classList.toggle("is-active", active);
  btn.setAttribute("aria-pressed", String(active));
  btn.dataset.wishlistId = product.id;
  if (label) label.textContent = active ? "In Wishlist" : "Add To Wishlist";
};

const initWishlistUI = () => {
  // The shared wishlist module handles the actual toggle.
  // We just need to re-sync our label after it fires.
  window.addEventListener("rs:wishlist-updated", syncWishlistUI);
};

/* ============================================================
   MOBILE BUY BAR — show after scroll past main gallery
   ============================================================ */
const initBuyBar = () => {
  const bar = qs("[data-buy-bar]");
  const anchor = qs(".pdp");
  if (!bar || !anchor) return;

  const update = () => {
    const rect = anchor.getBoundingClientRect();
    const passed = rect.bottom < 80;
    bar.classList.toggle("is-visible", passed);
    document.body.classList.toggle("has-buy-bar", passed);
  };

  update();
  window.addEventListener("scroll", debounce(update, 60), { passive: true });
  window.addEventListener("resize", debounce(update, 120));
};

/* ============================================================
   SCRIM + BACK TO TOP
   ============================================================ */

const initScrim = () => {
  const scrim = qs("[data-scrim]");
  if (!scrim) return;

  scrim.addEventListener("click", () => {
    const mobileNav = qs("[data-mobile-nav]");
    const cartDrawer = qs("[data-cart-drawer]");
    let anyOpen = false;

    if (mobileNav?.classList.contains("is-open")) {
      mobileNav.classList.remove("is-open");
      mobileNav.setAttribute("aria-hidden", "true");
      anyOpen = true;
    }
    if (cartDrawer?.classList.contains("is-open")) {
      cartDrawer.classList.remove("is-open");
      cartDrawer.setAttribute("aria-hidden", "true");
      anyOpen = true;
    }
    if (anyOpen) {
      scrim.classList.remove("is-open");
      unlockScroll();
    }
  });
};

const initBackToTop = () => {
  const btn = qs("[data-to-top]");
  if (!btn) return;

  const onScroll = () =>
    btn.classList.toggle("is-visible", window.scrollY > 600);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
};

/* ============================================================
   SEO — dynamic meta + structured data
   ============================================================ */

const updateSEO = () => {
  document.title = `${product.name} — ${product.family} | Rehmani Scents`;

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

  setMeta(
    'meta[name="description"]',
    "content",
    `${product.shortDescription} Available in ${product.volumes.map((v) => v.ml + "ml").join(" and ")}.`,
  );
  setMeta(
    'meta[property="og:title"]',
    "content",
    `${product.name} — ${product.family}`,
  );
  setMeta(
    'meta[property="og:description"]',
    "content",
    product.shortDescription,
  );
  setMeta('meta[property="og:image"]', "content", product.images[0]);
  setMeta(
    'meta[property="og:url"]',
    "content",
    `https://rehmaniscents.example/product.html?id=${product.id}`,
  );

  // JSON-LD Product (no fake ratings — omit aggregateRating)
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images,
    brand: { "@type": "Brand", name: "Rehmani Scents" },
    category: product.category,
    offers: product.volumes.map((v) => ({
      "@type": "Offer",
      price: v.price,
      priceCurrency: "PKR",
      availability:
        product.availability === "in-stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `https://rehmaniscents.example/product.html?id=${product.id}`,
      name: `${product.name} — ${v.ml}ml`,
    })),
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);
};

/* ============================================================
   RENDER EVERYTHING
   ============================================================ */

const renderAll = () => {
  renderBreadcrumbs();
  renderGallery();

  const catEl = qs("[data-pdp-category]");
  if (catEl) catEl.textContent = `${product.category} · ${product.family}`;

  const titleEl = qs("[data-pdp-title]");
  if (titleEl) titleEl.textContent = product.name;

  const descEl = qs("[data-pdp-description]");
  if (descEl) descEl.textContent = product.description;

  const barName = qs("[data-buy-bar-name]");
  if (barName) barName.textContent = product.name;

  renderRating();
  renderVolumes();
  renderQuantity();
  renderStock();
  renderNotes();
  renderAttrs();
  renderPrice();
  renderReviews();
  renderAccordionDetails();
  initAccordions();
  renderRelated();
  renderRecentlyViewed();
  syncWishlistUI();

  refreshIcons();
  bindImageFallbacks();
};

/* ============================================================
   BOOT
   ============================================================ */

const boot = () => {
  // Shared setup runs regardless of valid product
  initTheme();
  renderHeader();
  renderFooter();
  initCart();
  initWishlist();
  initSearch();
  initProductCards();
  initScrim();
  initBackToTop();
  observeReveals();

  const loading = qs("[data-pdp-loading]");
  const notFound = qs("[data-pdp-not-found]");
  const content = qs("[data-pdp-content]");

  const id = getParam("id", "").trim();
  product = id ? getProductById(id) : null;

  if (!product) {
    loading.hidden = true;
    notFound.hidden = false;
    document.title = "Fragrance Not Found — Rehmani Scents";
    refreshIcons();
    window.dispatchEvent(new CustomEvent("rs:ready"));
    return;
  }

  // Set initial volume BEFORE rendering
  selectedVolume = product.volumes[0];
  quantity = 1;

  // Push to recently viewed (after we know the id is valid)
  pushRecentlyViewed(product.id);

  renderAll();
  updateSEO();

  loading.hidden = true;
  content.hidden = false;

  initBuyActions();
  initWishlistUI();
  initBuyBar();

  // Re-sync wishlist button when the shared state changes elsewhere
  window.addEventListener("rs:wishlist-updated", syncWishlistUI);

  refreshIcons();
  window.dispatchEvent(new CustomEvent("rs:ready"));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
