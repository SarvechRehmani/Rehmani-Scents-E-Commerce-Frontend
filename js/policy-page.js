/* ============================================================
   js/policy-page.js
   Shared bootstrap for shipping / return / privacy / terms.
   Auto-builds a table of contents from the H2 headings inside
   [data-policy-content] and tracks the active section.
   ============================================================ */

import { initPage } from "./page-init.js";
import { qs, qsa, debounce, refreshIcons } from "./utils.js";

/* ============================================================
   TOC BUILDER
   ============================================================ */

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const buildTOC = () => {
  const content = qs("[data-policy-content]");
  const list = qs("[data-policy-toc-list]");
  const nav = qs("[data-policy-toc]");
  if (!content || !list || !nav) return;

  const headings = qsa("h2", content);
  if (headings.length < 2) {
    nav.hidden = true;
    return;
  }

  // Ensure every H2 has an id
  headings.forEach((h) => {
    if (!h.id) h.id = slugify(h.textContent);
  });

  list.innerHTML = headings
    .map(
      (h) => `
    <li>
      <a href="#${h.id}" data-toc-link="${h.id}">
        ${h.textContent}
      </a>
    </li>
  `,
    )
    .join("");

  return headings;
};

/* ============================================================
   ACTIVE SECTION TRACKING
   ============================================================ */

const watchActiveSection = (headings) => {
  if (!headings?.length || !("IntersectionObserver" in window)) return;

  const links = qsa("[data-toc-link]");

  const setActive = (id) => {
    links.forEach((a) => {
      a.classList.toggle("is-active", a.dataset.tocLink === id);
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    {
      rootMargin: "-100px 0px -70% 0px",
      threshold: 0,
    },
  );

  headings.forEach((h) => io.observe(h));
};

/* ============================================================
   SMOOTH ANCHOR SCROLL (with header offset)
   ============================================================ */

const initAnchorScroll = () => {
  const list = qs("[data-policy-toc-list]");
  if (!list) return;

  list.addEventListener("click", (e) => {
    const link = e.target.closest("[data-toc-link]");
    if (!link) return;

    const target = document.getElementById(link.dataset.tocLink);
    if (!target) return;

    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
    history.replaceState({}, "", "#" + link.dataset.tocLink);
  });

  // Handle initial hash on page load
  if (window.location.hash) {
    const id = window.location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      setTimeout(() => {
        const top = target.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: "smooth" });
      }, 200);
    }
  }
};

/* ============================================================
   BOOT
   ============================================================ */

initPage({
  accordions: false,
  counters: false,

  afterReady: () => {
    const headings = buildTOC();
    if (headings?.length) {
      watchActiveSection(headings);
      initAnchorScroll();
    }
    refreshIcons();
  },
});
