/* ============================================================
   js/admin-auth.js
   Demo authentication for the admin panel.
   Credentials are hardcoded — no backend, no real security.
   ============================================================ */

import { storage } from "./storage.js";

const SESSION_KEY = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/* ---------- Demo credentials (change these to rebrand) ---------- */
const ADMIN_USER = "admin";
const ADMIN_PASS = "rehmani2024";

/* ---------- Session ---------- */

export const isLoggedIn = () => {
  const session = storage.get(SESSION_KEY, null);
  if (!session || !session.loggedInAt) return false;

  const age = Date.now() - new Date(session.loggedInAt).getTime();
  if (age > SESSION_DURATION) {
    storage.remove(SESSION_KEY);
    return false;
  }
  return true;
};

export const login = (username, password) => {
  if (String(username).trim() !== ADMIN_USER) {
    return { ok: false, message: "Incorrect username." };
  }
  if (String(password) !== ADMIN_PASS) {
    return { ok: false, message: "Incorrect password." };
  }

  storage.set(SESSION_KEY, {
    user: ADMIN_USER,
    loggedInAt: new Date().toISOString(),
  });

  return { ok: true };
};

export const logout = () => {
  storage.remove(SESSION_KEY);
};

export const getCurrentUser = () => {
  const session = storage.get(SESSION_KEY, null);
  return session?.user || null;
};

/* ---------- Guard ---------- */

export const requireAuth = () => {
  if (!isLoggedIn()) {
    window.location.replace("admin.html");
    return false;
  }
  return true;
};

export const redirectIfLoggedIn = () => {
  if (isLoggedIn()) {
    window.location.replace("admin-dashboard.html");
    return true;
  }
  return false;
};
