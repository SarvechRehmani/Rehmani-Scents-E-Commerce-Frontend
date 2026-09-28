/* ============================================================
   js/header.js
   Renders the announcement bar, sticky header with mega menus,
   mobile navigation drawer, and wires the search overlay.

   STICKY FIX: The wrapper (#site-header) is the sticky container.
   Scroll handler toggles .is-scrolled on the wrapper (to collapse
   the announcement) and .is-stuck on the inner <header>.

   HYSTERESIS FIX: Uses two thresholds (collapse at 100px,
   expand at 20px) to prevent the feedback loop where collapsing
   the announcement changes scrollY and re-triggers the toggle.
   ============================================================ */

import { CONFIG } from "./config.js";
import { qs, qsa, refreshIcons, lockScroll, unlockScroll } from "./utils.js";

const currentPage = () => {
  const path = window.location.pathname.split("/").pop() || "index.html";
  return path.toLowerCase();
};

const isActive = (href) => {
  const page = currentPage();
  if (href === "index.html" && (page === "" || page === "index.html"))
    return true;
  return page === href.toLowerCase();
};

/* ---------- Announcement ---------- */
const renderAnnouncement = () => {
  const a = CONFIG.announcement;
  if (!a?.enabled) return "";
  return `
    <div class="announce" data-announce>
      <div class="container">
        <span>${a.text}${a.highlight ? ` <strong>|</strong> ${a.highlight}` : ""}</span>
      </div>
    </div>
  `;
};

/* ---------- Mega menu markup ---------- */
const renderMega = (key) => {
  const data = CONFIG.mega[key];
  if (!data) return "";

  const cols = data.columns
    .map(
      (col) => `
    <div>
      <h3 class="mega__col-title">${col.title}</h3>
      <ul class="mega__list">
        ${col.links.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
      </ul>
    </div>
  `,
    )
    .join("");

  const promo = data.promo
    ? `
    <a class="mega__promo" href="${data.promo.href}">
      <img src="${data.promo.image}" alt="" loading="lazy" />
      <div class="mega__promo-body">
        <span>${data.promo.eyebrow}</span>
        <strong>${data.promo.title}</strong>
      </div>
    </a>
  `
    : "";

  return `
    <div class="mega">
      <div class="mega__grid">
        ${cols}
        ${promo}
      </div>
    </div>
  `;
};

/* ---------- Desktop nav ---------- */
const renderNav = () => {
  const items = CONFIG.nav.primary
    .map((item) => {
      const active = isActive(item.href);
      const megaKey =
        item.label === "Shop All"
          ? "shop"
          : item.label === "Collections"
            ? "collections"
            : null;

      return `
      <li class="main-nav__item">
        <a class="main-nav__link ${active ? "is-active" : ""}" href="${item.href}">
          ${item.label}
          ${megaKey ? '<i data-lucide="chevron-down"></i>' : ""}
        </a>
        ${megaKey ? renderMega(megaKey) : ""}
      </li>
    `;
    })
    .join("");

  return `<ul class="main-nav__list">${items}</ul>`;
};

/* ---------- Mobile nav ---------- */
const renderMobileNav = () => {
  const primary = CONFIG.nav.primary
    .map(
      (item) => `
    <li><a class="mobile-nav__link" href="${item.href}">${item.label}<i data-lucide="chevron-right"></i></a></li>
  `,
    )
    .join("");

  const shopLinks = CONFIG.mega.shop.columns
    .flatMap((c) => c.links)
    .map((l) => `<a href="${l.href}">${l.label}</a>`)
    .join("");

  return `
    <aside class="mobile-nav" data-mobile-nav aria-hidden="true" aria-label="Main navigation">
      <div class="mobile-nav__head">
        <a class="brand" href="index.html">
          <span class="brand__name">Rehmani Scents</span>
          <span class="brand__sub">Premium Fragrances</span>
        </a>
        <button class="icon-btn" type="button" data-nav-close aria-label="Close menu">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="mobile-nav__body">
        <ul class="mobile-nav__list">
          ${primary}
        </ul>

        <div style="margin-top:1.6rem">
          <p class="mega__col-title">Shop By Category</p>
          <div class="mobile-nav__sub">${shopLinks}</div>
        </div>
      </div>

      <div class="mobile-nav__foot">
        <div class="mobile-nav__row">
          <span>Theme</span>
          <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle theme">
            <i data-lucide="moon"></i>
          </button>
        </div>
        <a class="btn btn--gold btn--block" href="wishlist.html">
          <i data-lucide="heart"></i> My Wishlist
        </a>
        <a class="btn btn--outline btn--block" href="track-order.html">
          <i data-lucide="package"></i> Track Order
        </a>
      </div>
    </aside>
  `;
};

/* ---------- Header shell ---------- */
export const renderHeader = () => {
  const host = qs("#site-header");
  if (!host) return;

  host.innerHTML = `
    ${renderAnnouncement()}
    <header class="site-header" data-header>
      <div class="container site-header__inner">
        <button class="icon-btn nav-toggle" type="button" data-nav-open aria-label="Open menu">
          <i data-lucide="menu"></i>
        </button>

        <a class="brand" href="index.html" aria-label="Rehmani Scents home">
          <span class="brand__name">Rehmani Scents</span>
          <span class="brand__sub">Premium Fragrances</span>
        </a>

        <nav class="main-nav" aria-label="Primary">
          ${renderNav()}
        </nav>

        <div class="header-actions">
          <button class="icon-btn" type="button" data-search-open aria-label="Search">
            <i data-lucide="search"></i>
          </button>
          <a class="icon-btn" href="track-order.html" aria-label="Track order">
            <i data-lucide="user-round"></i>
          </a>
          <a class="icon-btn" href="wishlist.html" aria-label="Wishlist">
            <i data-lucide="heart"></i>
            <span class="badge-count" data-wishlist-badge hidden>0</span>
          </a>
          <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle theme">
            <i data-lucide="moon"></i>
          </button>
          <button class="icon-btn" type="button" data-cart-open aria-label="Open shopping bag">
            <i data-lucide="shopping-bag"></i>
            <span class="badge-count" data-cart-badge hidden>0</span>
          </button>
        </div>
      </div>
    </header>
  `;

  // ------------------------------------------------------------
  // IMPORTANT: Render mobile nav OUTSIDE #site-header.
  // The wrapper is sticky with z-index: 100, which creates a
  // stacking context. Anything inside it cannot appear above
  // the scrim (which is a body-level element at z-index 200).
  // Appending the drawer directly to <body> fixes this.
  // ------------------------------------------------------------
  const existingMobileNav = document.querySelector("[data-mobile-nav]");
  if (existingMobileNav) existingMobileNav.remove();

  document.body.insertAdjacentHTML("beforeend", renderMobileNav());

  refreshIcons(host);
  refreshIcons(document.body);
  wireHeader();
  window.dispatchEvent(new CustomEvent("rs:header-rendered"));
};

/* ---------- Header interactions ---------- */
const wireHeader = () => {
  const wrapper = qs("#site-header");
  const header = qs("[data-header]");
  const mobileNav = qs("[data-mobile-nav]");
  const scrim = qs("[data-scrim]");

  /* ============================================================
     STICKY SCROLL STATE — with hysteresis
     ------------------------------------------------------------
     Two separate thresholds prevent a feedback loop:

       Collapse  → when scrollY passes 100px going down
       Expand    → when scrollY drops below 20px going up

     The 80px dead zone means the loop cannot form even though
     collapsing the announcement changes the page height (and
     therefore the effective scrollY).

     We also throttle with requestAnimationFrame so multiple
     scroll events within a single frame coalesce into one update.
     ============================================================ */

  const COLLAPSE_AT = 100; // px scrolled down before collapsing
  const EXPAND_AT = 20; // px scrolled up before expanding back

  let collapsed = false;

  // Set the visual state once, and remember it.
  const setCollapsed = (state) => {
    if (state === collapsed) return;
    collapsed = state;

    wrapper?.classList.toggle("is-scrolled", state);
    header?.classList.toggle("is-stuck", state);
  };

  // Read scroll position from the document element as well —
  // some browsers report different values on <body> vs <html>.
  const getScrollY = () =>
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;

  const update = () => {
    const y = getScrollY();

    if (!collapsed && y > COLLAPSE_AT) {
      setCollapsed(true);
    } else if (collapsed && y < EXPAND_AT) {
      setCollapsed(false);
    }
  };

  // rAF throttle: at most one update per animation frame.
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  // Initial state (for users who refresh mid-scroll)
  update();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Recheck on resize — window height changes can shift scrollY
  window.addEventListener("resize", update, { passive: true });

  /* Open/close mobile nav */
  const openNav = () => {
    if (!mobileNav) return;
    mobileNav.classList.add("is-open");
    mobileNav.setAttribute("aria-hidden", "false");
    scrim?.classList.add("is-open");
    lockScroll();
  };
  const closeNav = () => {
    if (!mobileNav) return;
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("aria-hidden", "true");
    scrim?.classList.remove("is-open");
    unlockScroll();
  };

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-nav-open]")) {
      e.preventDefault();
      openNav();
      return;
    }
    if (e.target.closest("[data-nav-close]")) {
      e.preventDefault();
      closeNav();
      return;
    }
    if (e.target === scrim) closeNav();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  /* Close mega menu when the user tabs out */
  qsa(".main-nav__item").forEach((item) => {
    item.addEventListener("focusout", (e) => {
      if (!item.contains(e.relatedTarget)) item.blur?.();
    });
  });
};
