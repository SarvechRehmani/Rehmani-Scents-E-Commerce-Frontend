/* ============================================================
   js/about-page.js
   About page — uses shared initPage helper, plus a subtle
   scroll-driven chapter progress indicator.
   ============================================================ */

import { initPage, initScrollRail } from "./page-init.js";

initPage({
  accordions: true,
  counters: true,

  afterReady: () => {
    // Subtle scroll-driven chapter tracking (adds .is-in-view
    // to chapters as they enter/leave the viewport)
    const chapters = document.querySelectorAll(
      ".about-chapter, .about-dark, .about-stats",
    );
    if (!chapters.length || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-in-view", entry.isIntersecting);
        });
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: 0.01 },
    );

    chapters.forEach((c) => io.observe(c));
  },
});
