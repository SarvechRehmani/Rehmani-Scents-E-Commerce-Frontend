/* ============================================================
   js/contact-page.js
   Contact page — form validation, localStorage persistence,
   success state, reset, "send another" flow.
   ============================================================ */

import { initPage } from "./page-init.js";
import {
  qs,
  qsa,
  formatPrice,
  escapeHtml,
  refreshIcons,
  isEmail,
  isPakistaniPhone,
  debounce,
  toast,
} from "./utils.js";
import { storage } from "./storage.js";

/* ============================================================
   VALIDATORS
   ============================================================ */

const VALIDATORS = {
  required: (v) =>
    String(v || "").trim().length > 0 || "This field is required.",
  email: (v) => isEmail(v) || "Please enter a valid email address.",
  phone: (v) =>
    !String(v || "").trim() ||
    isPakistaniPhone(v) ||
    "Enter a valid Pakistani number (03XX XXXXXXX).",
  message: (v) =>
    String(v || "").trim().length >= 10 ||
    "Message should be at least 10 characters.",
  consent: (v, input) =>
    input?.checked ? true : "Please confirm to continue.",
};

const validateField = (input) => {
  const rules = String(input.dataset.validate || "")
    .split(/\s+/)
    .filter(Boolean);
  const value = input.type === "checkbox" ? input.checked : input.value;

  for (const rule of rules) {
    const fn = VALIDATORS[rule];
    if (!fn) continue;
    const result = fn(value, input);
    if (result !== true) {
      showError(input, result);
      return false;
    }
  }
  clearError(input);
  return true;
};

const showError = (input, message) => {
  input.classList.add("is-invalid");
  input.setAttribute("aria-invalid", "true");
  const err = qs(`[data-error-for="${input.name}"]`);
  if (err) err.textContent = message;
};

const clearError = (input) => {
  input.classList.remove("is-invalid");
  input.removeAttribute("aria-invalid");
  const err = qs(`[data-error-for="${input.name}"]`);
  if (err) err.textContent = "";
};

const validateForm = (form) => {
  const inputs = qsa("[data-validate]", form);
  let firstInvalid = null;
  let ok = true;

  inputs.forEach((input) => {
    if (!validateField(input)) {
      ok = false;
      if (!firstInvalid) firstInvalid = input;
    }
  });

  if (firstInvalid) {
    firstInvalid.focus({ preventScroll: true });
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return ok;
};

/* ============================================================
   PERSISTENCE
   ============================================================ */

const SUBMISSIONS_KEY = "contact_submissions";

const readSubmissions = () => {
  const raw = storage.get(SUBMISSIONS_KEY, []);
  return Array.isArray(raw) ? raw : [];
};

const saveSubmission = (submission) => {
  const list = readSubmissions();
  list.unshift(submission);
  storage.set(SUBMISSIONS_KEY, list.slice(0, 30));
};

const readFormValues = (form) => {
  const data = new FormData(form);
  return {
    name: String(data.get("name") || "").trim(),
    email: String(data.get("email") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    subject: String(data.get("subject") || "").trim(),
    message: String(data.get("message") || "").trim(),
  };
};

/* ============================================================
   SUBMIT
   ============================================================ */

const showSuccess = () => {
  const form = qs("[data-contact-form]");
  const success = qs("[data-contact-success]");

  if (form) form.hidden = true;
  if (success) {
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
    refreshIcons(success);
  }
};

const showForm = () => {
  const form = qs("[data-contact-form]");
  const success = qs("[data-contact-success]");

  if (success) success.hidden = true;
  if (form) {
    form.hidden = false;
    form.reset();
    // Clear all errors
    qsa("[data-validate]", form).forEach(clearError);
    // Focus first field
    const first = qs("input", form);
    first?.focus({ preventScroll: true });
  }
};

const handleSubmit = (e) => {
  e.preventDefault();

  const form = qs("[data-contact-form]");
  if (!form) return;

  if (!validateForm(form)) {
    toast("Please fix the highlighted fields.", "error");
    return;
  }

  const values = readFormValues(form);

  // Generate a demo reference for this submission
  const ref = "MSG-" + Date.now().toString(36).toUpperCase().slice(-8);

  saveSubmission({
    ref,
    ...values,
    date: new Date().toISOString(),
  });

  toast("Message saved locally", "success");
  showSuccess();
};

/* ============================================================
   LIVE VALIDATION
   ============================================================ */

const initLiveValidation = () => {
  const form = qs("[data-contact-form]");
  if (!form) return;

  // Validate on blur
  form.addEventListener(
    "blur",
    (e) => {
      const input = e.target.closest("[data-validate]");
      if (input) validateField(input);
    },
    true,
  );

  // Clear / re-validate on input if the field was invalid
  form.addEventListener("input", (e) => {
    const input = e.target.closest("[data-validate]");
    if (input && input.classList.contains("is-invalid")) {
      validateField(input);
    }
  });

  // Checkbox change — validate immediately
  form.addEventListener("change", (e) => {
    const input = e.target.closest('input[type="checkbox"][data-validate]');
    if (input) validateField(input);
  });
};

/* ============================================================
   BOOT
   ============================================================ */

initPage({
  accordions: false,
  counters: false,

  afterReady: () => {
    const form = qs("[data-contact-form]");
    if (!form) return;

    form.addEventListener("submit", handleSubmit);

    // Reset button — clear errors then reset
    qs("[data-contact-reset]")?.addEventListener("click", () => {
      setTimeout(() => {
        qsa("[data-validate]", form).forEach(clearError);
      }, 0);
    });

    // Send another
    qs("[data-contact-another]")?.addEventListener("click", showForm);

    initLiveValidation();
  },
});
