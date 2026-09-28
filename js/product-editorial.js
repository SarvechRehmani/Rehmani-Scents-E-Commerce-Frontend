/* ============================================================
   js/product-editorial.js
   Editorial PDP — reads ?id=<slug>, renders gallery, pyramid,
   wear stats, specs, reviews, accordions and related rail.
   ============================================================ */

import { initTheme } from "./theme.js";
import { initCart, addProductToCart, openCart } from "./cart.js";
import { initWishlist, has as inWishlist } from "./wishlist.js";
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
} from "./utils.js";
import { pushRecentlyViewed, getRecentlyViewed } from "./storage.js";
import { getProductById, getRelated } from "./product-store.js";

/* ============================================================
   REVIEW POOL (deterministic per product)
   ============================================================ */
const REVIEW_POOL = [
  {
    name: "Ayesha K.",
    rating: 5,
    days: 12,
    text: "Beautifully composed. The opening is bright and the drydown is warm and grounded. Lasts through a full working day.",
  },
  {
    name: "Bilal R.",
    rating: 4,
    days: 24,
    text: "Rich without being heavy. I wear it for evening gatherings and it never feels like too much.",
  },
  {
    name: "Hira M.",
    rating: 5,
    days: 8,
    text: "Exactly what I was looking for. Soft, elegant, and it settles into something very wearable.",
  },
  {
    name: "Usman T.",
    rating: 4,
    days: 34,
    text: "Great projection for the first few hours, then it becomes a closer skin scent. Very pleasant overall.",
  },
  {
    name: "Zain A.",
    rating: 5,
    days: 19,
    text: "Deep and grounded. The top notes keep it from feeling heavy. Worth the price.",
  },
  {
    name: "Mariam S.",
    rating: 4,
    days: 41,
    text: "Long-lasting and refined. I have received several compliments while wearing it.",
  },
  {
    name: "Faraz N.",
    rating: 5,
    days: 5,
    text: "Smooth, warm and never cloying. This has become part of my weekly rotation.",
  },
  {
    name: "Sana Y.",
    rating: 4,
    days: 27,
    text: "Lovely balance between the fresh opening and the warmer base. Works in most weather.",
  },
];

const seededPick = (seed, count) => {
  const hash = String(seed)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from(
    { length: count },
    (_, i) => REVIEW_POOL[(hash + i * 3) % REVIEW_POOL.length],
  );
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
   BREADCRUMBS
   ============================================================ */
const renderBreadcrumbs = () => {
  const host = qs("[data-pdp-breadcrumbs]");
  if (!host) return;

  const catHref =
    product.category === "Men"
      ? "men.html"
      : product.category === "Women"
        ? "women.html"
        : "unisex.html";

  host.innerHTML = `
    <li><a href="index.html">Home</a></li>
    <li><a href="shop.html">Shop All</a></li>
    <li><a href="${catHref}">${escapeHtml(product.category)}</a></li>
    <li aria-current="page">${escapeHtml(product.name)}</li>
  `;
};

/* ============================================================
   GALLERY
   ============================================================ */
const renderGallery = () => {
  const main = qs("[data-gallery-main]");
  const rail = qs("[data-gallery-thumbs]");
  const badges = qs("[data-gallery-badges]");
  const indexEl = qs("[data-gallery-index]");
  const totalEl = qs("[data-gallery-total]");

  if (!main || !rail) return;

  const images = product.images?.length ? product.images : [""];
  const base = product.volumes[0];
  const onSale = base.comparePrice && base.comparePrice > base.price;
  const off = onSale ? discountPercent(base.price, base.comparePrice) : 0;
  const inStock = product.availability === "in-stock";

  // Badges
  if (badges) {
    const list = [];
    if (onSale) list.push(`<span class="badge badge--sale">−${off}%</span>`);
    if (product.flags.newArrival)
      list.push(`<span class="badge badge--new">New</span>`);
    if (product.flags.bestSeller)
      list.push(`<span class="badge badge--gold">Best Seller</span>`);
    if (!inStock) list.push(`<span class="badge badge--out">Sold Out</span>`);
    badges.innerHTML = list.join("");
  }

  // Main image
  main.src = images[0];
  main.alt = `${product.name} — ${product.family} fragrance`;
  main.dataset.fallbackName = product.name;

  // Counter
  const pad = (n) => String(n).padStart(2, "0");
  if (totalEl) totalEl.textContent = pad(images.length);
  if (indexEl) indexEl.textContent = pad(1);

  // Thumb rail
  rail.innerHTML = images
    .map(
      (src, i) => `
    <button class="gallery__thumb ${i === 0 ? "is-active" : ""}"
            type="button"
            data-gallery-thumb="${i}"
            role="tab"
            aria-selected="${i === 0}"
            aria-label="View image ${i + 1}">
      <img src="${escapeHtml(src)}" alt="" loading="lazy"
           data-fallback-name="${escapeHtml(product.name)}" />
    </button>
  `,
    )
    .join("");

  refreshIcons(rail);
  bindImageFallbacks(rail);
  bindImageFallbacks(qs(".pdp-gallery"));

  on(rail, "click", (e) => {
    const btn = e.target.closest("[data-gallery-thumb]");
    if (!btn) return;
    const idx = Number(btn.dataset.galleryThumb);
    if (isNaN(idx) || !images[idx]) return;

    qsa(".gallery__thumb", rail).forEach((t, i) => {
      t.classList.toggle("is-active", i === idx);
      t.setAttribute("aria-selected", String(i === idx));
    });

    main.src = images[idx];
    main.dataset.fallbackName = product.name;
    if (indexEl) indexEl.textContent = pad(idx + 1);
  });
};

/* ============================================================
   PRICE
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
    } else compareEl.hidden = true;
  }
  if (saveEl) {
    if (onSale) {
      saveEl.textContent = `Save ${off}%`;
      saveEl.hidden = false;
    } else saveEl.hidden = true;
  }

  // Size hint
  const hint = qs("[data-pdp-size-hint]");
  if (hint) hint.textContent = `${selectedVolume.ml}ml selected`;

  // Mobile buy bar
  const barPrice = qs("[data-buy-bar-price]");
  const barSize = qs("[data-buy-bar-size]");
  if (barPrice) {
    barPrice.textContent = formatPrice(selectedVolume.price * quantity);
    const small = document.createElement("small");
    small.setAttribute("data-buy-bar-size", "");
    small.textContent = `${selectedVolume.ml}ml · Qty ${quantity}`;
    barPrice.appendChild(small);
  }
};

/* ============================================================
   SIZE SELECTOR
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
   QUANTITY
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
   STOCK / RATING / LEDE
   ============================================================ */
const renderStock = () => {
  const el = qs("[data-pdp-stock]");
  if (!el) return;
  const inStock = product.availability === "in-stock";
  el.className = `pdp-info__stock ${inStock ? "" : "is-out"}`;
  el.textContent = inStock
    ? "In stock — ships within 1 working day"
    : "Currently out of stock — notify us for the next batch";
};

const renderRating = () => {
  const el = qs("[data-pdp-rating]");
  const link = qs("[data-pdp-reviews-link]");
  if (el)
    el.textContent = `${product.rating.toFixed(1)} · ${product.reviewCount} demo reviews`;
  if (link) link.textContent = "Read reviews";
};

/* ============================================================
   SPECS STRIP
   ============================================================ */
const renderSpecs = () => {
  const host = qs("[data-pdp-specs]");
  if (!host) return;

  const rows = [
    { label: "Family", value: product.family },
    { label: "Category", value: product.category },
    { label: "Longevity", value: product.longevity },
    {
      label: "Sizes",
      value: product.volumes.map((v) => `${v.ml}ml`).join(" · "),
    },
  ];

  host.innerHTML = rows
    .map(
      (r) => `
    <div class="pdp-specs__item">
      <span class="pdp-specs__label">${escapeHtml(r.label)}</span>
      <span class="pdp-specs__value">${escapeHtml(r.value)}</span>
    </div>
  `,
    )
    .join("");
};

/* ============================================================
   PYRAMID (Chapter 01)
   ============================================================ */
const renderPyramid = () => {
  const host = qs("[data-pdp-pyramid]");
  if (!host) return;

  host.innerHTML = `
    <div class="pdp-pyramid__row pdp-pyramid__row--top">
      <span class="pdp-pyramid__label">Top</span>
      <span class="pdp-pyramid__notes">${escapeHtml(product.notes.top)}</span>
    </div>
    <div class="pdp-pyramid__row pdp-pyramid__row--heart">
      <span class="pdp-pyramid__label">Heart</span>
      <span class="pdp-pyramid__notes">${escapeHtml(product.notes.heart)}</span>
    </div>
    <div class="pdp-pyramid__row pdp-pyramid__row--base">
      <span class="pdp-pyramid__label">Base</span>
      <span class="pdp-pyramid__notes">${escapeHtml(product.notes.base)}</span>
    </div>
    <p class="pdp-pyramid__caption">
      Notes are listed as illustrative demo content for this catalog entry and are not
      verified against any real formulation.
    </p>
  `;
};

/* ============================================================
   WEAR IT (Chapter 02)
   ============================================================ */
const renderWear = () => {
  const host = qs("[data-pdp-wear]");
  if (!host) return;

  const items = [
    {
      icon: "clock",
      label: "Longevity",
      value: product.longevity,
      hint: "Approximate wear time on skin under normal conditions.",
    },
    {
      icon: "sun",
      label: "Best Season",
      value: product.season.join(" · "),
      hint: "Where the composition tends to read most clearly.",
    },
    {
      icon: "calendar",
      label: "Best Occasion",
      value: product.occasion.join(" · "),
      hint: "Moments the fragrance is composed to sit in.",
    },
  ];

  host.innerHTML = items
    .map(
      (it) => `
    <article class="pdp-wear__item">
      <span class="pdp-wear__icon"><i data-lucide="${it.icon}"></i></span>
      <span class="pdp-wear__label">${escapeHtml(it.label)}</span>
      <span class="pdp-wear__value">${escapeHtml(it.value)}</span>
      <span class="pdp-wear__hint">${escapeHtml(it.hint)}</span>
    </article>
  `,
    )
    .join("");

  refreshIcons(host);
};

/* ============================================================
   ACCORDIONS (Chapter 03)
   ============================================================ */
const renderAccordionDetails = () => {
  const host = qs("[data-accordion-details]");
  if (!host) return;

  host.innerHTML = `
    <p>${escapeHtml(product.description)}</p>
    <ul style="margin-top:1rem;padding-left:1.2rem;list-style:disc">
      <li><strong>Fragrance family:</strong> ${escapeHtml(product.family)}</li>
      <li><strong>Longevity:</strong> ${escapeHtml(product.longevity)}</li>
      <li><strong>Best worn:</strong> ${escapeHtml(product.occasion.join(", "))}</li>
      <li><strong>Season:</strong> ${escapeHtml(product.season.join(", "))}</li>
      <li><strong>Available sizes:</strong> ${product.volumes.map((v) => `${v.ml}ml`).join(", ")}</li>
    </ul>
    <p style="margin-top:1rem;font-size:0.78rem;color:var(--color-subtle)">
      This is a fictional demo catalog entry. Fragrance descriptions, notes and
      performance claims are illustrative and not verified.
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
   REVIEWS (Chapter 04)
   ============================================================ */
const renderReviews = () => {
  const list = qs("[data-pdp-reviews]");
  const summary = qs("[data-reviews-summary]");
  if (!list) return;

  const reviews = seededPick(product.id, 4);

  if (summary) {
    summary.innerHTML = `
      <div>
        <span class="pdp-reviews__num">${product.rating.toFixed(1)}</span>
        <span class="pdp-reviews__outof">out of 5</span>
      </div>
      <p class="pdp-reviews__label">
        Based on ${product.reviewCount} demo reviews.<br>
        Illustrative content only.
      </p>
    `;
  }

  list.innerHTML = reviews
    .map(
      (r) => `
    <article class="review-item">
      <header class="review-item__head">
        <div>
          <p class="review-item__name">Demo — ${escapeHtml(r.name)}</p>
          <span class="stars stars--sm" aria-label="${r.rating} out of 5">
            ${Array.from(
              { length: 5 },
              (_, i) =>
                `<i data-lucide="star" style="${i >= r.rating ? "opacity:.22;" : ""}"></i>`,
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

  refreshIcons(list);
  refreshIcons(summary);
};

/* ============================================================
   RELATED + RECENTLY VIEWED
   ============================================================ */
const renderRelated = () => {
  const host = qs("[data-pdp-related]");
  if (!host) return;

  const related = getRelated(product, 6);
  if (!related.length) {
    host.closest(".pdp-chapter")?.setAttribute("hidden", "");
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
  if (label) label.textContent = active ? "In Wishlist" : "Wishlist";
};

const initWishlistUI = () => {
  window.addEventListener("rs:wishlist-updated", syncWishlistUI);
};

/* ============================================================
   MOBILE BUY BAR
   ============================================================ */
const initBuyBar = () => {
  const bar = qs("[data-buy-bar]");
  const anchor = qs(".pdp-hero");
  if (!bar || !anchor) return;

  const update = () => {
    const rect = anchor.getBoundingClientRect();
    const passed = rect.bottom < 60;
    bar.classList.toggle("is-visible", passed);
    document.body.classList.toggle("has-buy-bar", passed);
  };

  update();
  window.addEventListener("scroll", debounce(update, 60), { passive: true });
  window.addEventListener("resize", debounce(update, 120));
};

/* ============================================================
   SCRIM + TOP
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
   SEO
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
   RENDER ALL
   ============================================================ */
const renderAll = () => {
  renderBreadcrumbs();
  renderGallery();

  const catEl = qs("[data-pdp-category]");
  if (catEl) catEl.textContent = `${product.category} · ${product.family}`;

  const titleEl = qs("[data-pdp-title]");
  if (titleEl) titleEl.textContent = product.name;

  const ledeEl = qs("[data-pdp-lede]");
  if (ledeEl) ledeEl.textContent = product.shortDescription;

  const barName = qs("[data-buy-bar-name]");
  if (barName) barName.textContent = product.name;

  renderRating();
  renderVolumes();
  renderQuantity();
  renderStock();
  renderSpecs();
  renderPrice();
  renderPyramid();
  renderWear();
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

  selectedVolume = product.volumes[0];
  quantity = 1;

  pushRecentlyViewed(product.id);

  renderAll();
  updateSEO();

  loading.hidden = true;
  content.hidden = false;

  initBuyActions();
  initWishlistUI();
  initBuyBar();

  window.addEventListener("rs:wishlist-updated", syncWishlistUI);

  refreshIcons();
  window.dispatchEvent(new CustomEvent("rs:ready"));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
