/* ============================================================
   js/admin-login.js
   Login page controller.
   ============================================================ */

import { initTheme } from "./theme.js";
import { qs, refreshIcons, toast } from "./utils.js";
import { login, redirectIfLoggedIn } from "./admin-auth.js";

/* If already logged in, go straight to dashboard */
if (redirectIfLoggedIn()) {
  // redirected — nothing else to do
} else {
  initTheme();

  const form = qs("[data-admin-login]");
  const errorEl = qs("[data-admin-error]");
  const submitBtn = qs(".admin-auth__submit");
  const pwInput = qs("#admin-password");
  const pwToggle = qs("[data-pw-toggle]");

  /* Password visibility toggle */
  if (pwToggle && pwInput) {
    pwToggle.addEventListener("click", () => {
      const show = pwInput.type === "password";
      pwInput.type = show ? "text" : "password";
      pwToggle.innerHTML = show
        ? '<i data-lucide="eye-off"></i>'
        : '<i data-lucide="eye"></i>';
      pwToggle.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password",
      );
      refreshIcons(pwToggle.parentElement);
    });
  }

  /* Form submit */
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (errorEl) errorEl.textContent = "";

      const username = qs("#admin-username")?.value || "";
      const password = qs("#admin-password")?.value || "";

      if (!username.trim()) {
        if (errorEl) errorEl.textContent = "Please enter your username.";
        qs("#admin-username")?.focus();
        return;
      }
      if (!password) {
        if (errorEl) errorEl.textContent = "Please enter your password.";
        qs("#admin-password")?.focus();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<span>Signing in…</span>";
      }

      const result = login(username, password);

      if (!result.ok) {
        if (errorEl) errorEl.textContent = result.message;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML =
            '<i data-lucide="log-in"></i><span>Sign In</span>';
          refreshIcons(submitBtn);
        }
        return;
      }

      toast("Welcome back", "success");
      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 300);
    });
  }

  /* Focus first field */
  qs("#admin-username")?.focus();

  refreshIcons();
}
