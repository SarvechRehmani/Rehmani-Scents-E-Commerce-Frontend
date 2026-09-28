/* ============================================================
   js/admin-layout.js
   Shared sidebar + topbar for every admin page except login.
   Injected into #admin-shell.
   ============================================================ */

import { qs, qsa, refreshIcons, lockScroll, unlockScroll } from "./utils.js";
import { getCurrentUser, logout, requireAuth } from "./admin-auth.js";
import { isCustomized } from "./product-store.js";

/* ---------- Nav items ---------- */

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "admin-dashboard.html",
    icon: "layout-dashboard",
  },
  {
    key: "products",
    label: "Products",
    href: "admin-products.html",
    icon: "package",
  },
  {
    key: "orders",
    label: "Orders",
    href: "admin-orders.html",
    icon: "clipboard-list",
  },
  { key: "blog", label: "Blog", href: "admin-blog.html", icon: "file-text" },
  {
    key: "settings",
    label: "Settings",
    href: "admin-settings.html",
    icon: "settings",
  },
];

/* ---------- Sidebar ---------- */

const renderSidebar = (activePage) => {
  const items = NAV_ITEMS.map(
    (item) => `
    <a class="admin-nav__link ${item.key === activePage ? "is-active" : ""}"
       href="${item.href}">
      <i data-lucide="${item.icon}"></i>
      <span>${item.label}</span>
    </a>
  `,
  ).join("");

  return `
    <aside class="admin-sidebar" data-admin-sidebar aria-label="Admin navigation">
      <div class="admin-sidebar__head">
        <a class="admin-brand" href="admin-dashboard.html">
          <span class="admin-brand__name">Rehmani Scents</span>
          <span class="admin-brand__sub">Admin Panel</span>
        </a>
        <button class="icon-btn admin-sidebar__close"
                type="button"
                data-admin-sidebar-close
                aria-label="Close menu">
          <i data-lucide="x"></i>
        </button>
      </div>

      <nav class="admin-nav">
        <p class="admin-nav__label">Manage</p>
        ${items}
      </nav>

      <div class="admin-sidebar__foot">
        <a class="admin-nav__link" href="index.html" target="_blank" rel="noopener">
          <i data-lucide="external-link"></i>
          <span>View Storefront</span>
        </a>
        <button class="admin-nav__link admin-nav__link--logout" type="button" data-admin-logout>
          <i data-lucide="log-out"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  `;
};

/* ---------- Topbar ---------- */

const renderTopbar = () => {
  const user = getCurrentUser() || "admin";

  return `
    <header class="admin-topbar">
      <button class="icon-btn admin-topbar__toggle"
              type="button"
              data-admin-sidebar-open
              aria-label="Open menu">
        <i data-lucide="menu"></i>
      </button>

      <div class="admin-topbar__spacer"></div>

      ${
        isCustomized()
          ? `
        <span class="admin-topbar__badge" title="Product catalog has local edits">
          <i data-lucide="pencil"></i>
          <span>Custom Catalog</span>
        </span>
      `
          : ""
      }

      <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle theme">
        <i data-lucide="moon"></i>
      </button>

      <div class="admin-topbar__user">
        <span class="admin-topbar__avatar">${user.charAt(0).toUpperCase()}</span>
        <span class="admin-topbar__name">${user}</span>
      </div>
    </header>
  `;
};

/* ---------- Render shell ---------- */

export const renderAdminLayout = () => {
  // Guard: not logged in → redirect
  if (!requireAuth()) return;

  const host = qs("#admin-shell");
  if (!host) return;

  const activePage = document.body.dataset.adminPage || "dashboard";

  host.innerHTML = `
    <div class="admin-shell">
      ${renderSidebar(activePage)}
      <div class="admin-backdrop" data-admin-backdrop></div>
      <div class="admin-content">
        ${renderTopbar()}
        <!-- main content is separate (outside shell), so pages can render into it -->
      </div>
    </div>
  `;

  // Move the existing <main> into the content area
  const main = qs("#main");
  const content = qs(".admin-content");
  if (main && content) content.appendChild(main);

  refreshIcons(host);
  wireShell();
  window.dispatchEvent(new CustomEvent("rs:admin-shell-rendered"));
};

/* ---------- Interactions ---------- */

const wireShell = () => {
  const sidebar = qs("[data-admin-sidebar]");
  const backdrop = qs("[data-admin-backdrop]");

  const openSidebar = () => {
    sidebar?.classList.add("is-open");
    backdrop?.classList.add("is-open");
    lockScroll();
  };
  const closeSidebar = () => {
    sidebar?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    unlockScroll();
  };

  /* Open/close */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-admin-sidebar-open]")) {
      e.preventDefault();
      openSidebar();
      return;
    }
    if (e.target.closest("[data-admin-sidebar-close]")) {
      e.preventDefault();
      closeSidebar();
      return;
    }
    if (e.target === backdrop) closeSidebar();
    if (e.target.closest(".admin-nav__link")) closeSidebar();
  });

  /* Escape closes */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });

  /* Logout */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-admin-logout]")) {
      e.preventDefault();
      if (window.confirm("Sign out of the admin panel?")) {
        logout();
        window.location.href = "admin.html";
      }
    }
  });
};
