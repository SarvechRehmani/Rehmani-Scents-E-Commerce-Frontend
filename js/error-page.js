/* ============================================================
   js/error-page.js
   404 page — shows popular products, wires the search button.
   ============================================================ */

import { initPage } from "./page-init.js";
import { qs, qsa, refreshIcons, bindImageFallbacks } from "./utils.js";
import { products } from "./products.js";
import { renderProductGrid } from "./product-card.js";

initPage({
  accordions: false,
  counters: false,

  afterReady: () => {
    // Pick 4 popular products (best sellers first, then featured)
    const grid = qs("[data-error-grid]");
    if (grid) {
      const picks = products
        .filter((p) => p.flags.bestSeller || p.flags.featured)
        .slice(0, 4);

      // Fallback if the catalog has no flags set
      const list = picks.length ? picks : products.slice(0, 4);
      renderProductGrid(grid, list);
    }

    // Explicitly open the search overlay when the button is clicked
    const searchBtn = qs(".error-search__btn");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        // The header already wired [data-search-open]; this
        // triggers the same event to be safe.
        searchBtn.dispatchEvent(
          new CustomEvent("rs:open-search", { bubbles: true }),
        );
        // Fall back to direct click on any element with the data attr
        const realTrigger = document.querySelector("[data-search-open]");
        if (realTrigger && realTrigger !== searchBtn) realTrigger.click();
      });
    }
  },
});
