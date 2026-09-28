/* ============================================================
   js/theme.js
   Light/dark theme with system preference + persistence.
   The HTML has an inline bootstrap that reads `rs_theme` raw
   so there is no flash before this module loads.
   ============================================================ */

import { qsa, on } from "./utils.js";

const KEY = "rs_theme";
const root = document.documentElement;

const getStored = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const store = (v) => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* ignore */
  }
};

const prefersDark = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

export const getTheme = () =>
  root.getAttribute("data-theme") || (prefersDark() ? "dark" : "light");

export const applyTheme = (theme) => {
  root.setAttribute("data-theme", theme);
  updateMetaColor(theme);
  updateToggleIcons(theme);
  window.dispatchEvent(
    new CustomEvent("rs:theme-changed", { detail: { theme } }),
  );
};

export const setTheme = (theme) => {
  store(theme);
  applyTheme(theme);
};

export const toggleTheme = () => {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
};

/* Sync theme when the OS preference changes and no manual choice exists */
const watchSystem = () => {
  if (!window.matchMedia) return;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e) => {
    if (!getStored()) applyTheme(e.matches ? "dark" : "light");
  };
  mq.addEventListener?.("change", handler);
};

const updateMetaColor = (theme) => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta)
    meta.setAttribute("content", theme === "dark" ? "#101010" : "#F8F6F1");
};

const updateToggleIcons = (theme) => {
  qsa("[data-theme-toggle]").forEach((btn) => {
    const icon = btn.querySelector("i, svg");
    if (!icon) return;
    const isSvg = icon.tagName.toLowerCase() === "svg";
    const wantName = theme === "dark" ? "sun" : "moon";

    if (isSvg) {
      // Replace the SVG placeholder with a Lucide-rendered icon
      const placeholder = document.createElement("i");
      placeholder.setAttribute("data-lucide", wantName);
      icon.replaceWith(placeholder);
    } else {
      icon.setAttribute("data-lucide", wantName);
    }

    btn.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
    btn.setAttribute("aria-pressed", String(theme === "dark"));
  });

  if (window.lucide?.createIcons)
    window.lucide.createIcons({ nameAttr: "data-lucide" });
};

export const initTheme = () => {
  const initial = getStored() || (prefersDark() ? "dark" : "light");
  applyTheme(initial);
  watchSystem();

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    e.preventDefault();
    toggleTheme();
  });

  // Re-sync icons after header/footer injection
  window.addEventListener("rs:header-rendered", () =>
    updateToggleIcons(getTheme()),
  );
  window.addEventListener("rs:footer-rendered", () =>
    updateToggleIcons(getTheme()),
  );
};
