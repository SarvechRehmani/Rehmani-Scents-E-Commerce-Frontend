/* ============================================================
   js/order-store.js
   Read-through layer for orders.

   - Default demo orders come from orders.js
   - New orders (from checkout) and admin edits are appended
     to localStorage so they survive a refresh in this browser
   - All pages should read orders through this module

   Storage key: rs_orders_custom
   ============================================================ */

import { DEFAULT_ORDERS } from "./orders.js";
import { storage } from "./storage.js";

const KEY = "orders_custom";

/* ---------- Read ---------- */

const readCustom = () => {
  const raw = storage.get(KEY, null);
  return Array.isArray(raw) ? raw : null;
};

const writeCustom = (list) => {
  storage.set(KEY, Array.isArray(list) ? list : []);
  window.dispatchEvent(new CustomEvent("rs:orders-updated"));
};

/* ---------- Public API ---------- */

export const isCustomized = () => readCustom() !== null;

export const getOrders = () => {
  const custom = readCustom();
  // Once the user has any custom orders (from checkout or admin),
  // we prefer that list. Otherwise show the seed demo orders.
  if (custom && custom.length) return custom;
  return DEFAULT_ORDERS;
};

export const getOrderByNumber = (orderNumber) => {
  if (!orderNumber) return null;
  const target = String(orderNumber).trim().toUpperCase();
  return (
    getOrders().find(
      (o) => String(o.orderNumber).trim().toUpperCase() === target,
    ) || null
  );
};

export const getOrdersByPhone = (phone) => {
  if (!phone) return [];
  const normalized = String(phone).replace(/[\s\-()]/g, "");
  return getOrders().filter((o) => {
    const p = String(o.customer?.phone || "").replace(/[\s\-()]/g, "");
    return p === normalized;
  });
};

export const getRecentOrders = (limit = 5) =>
  [...getOrders()]
    .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
    .slice(0, limit);

/* ---------- Write ---------- */

export const saveOrder = (order) => {
  if (!order || !order.orderNumber) return false;

  const list = [...getOrders()];
  const idx = list.findIndex((o) => o.orderNumber === order.orderNumber);

  if (idx >= 0) list[idx] = { ...list[idx], ...order };
  else list.unshift(order);

  writeCustom(list);
  return true;
};

export const updateOrderStatus = (orderNumber, status) => {
  const list = [...getOrders()];
  const idx = list.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return false;

  list[idx].status = status;
  list[idx].statusUpdatedAt = new Date().toISOString();
  writeCustom(list);
  return true;
};

export const deleteOrder = (orderNumber) => {
  const list = getOrders().filter((o) => o.orderNumber !== orderNumber);
  writeCustom(list);
  return true;
};

export const clearOrders = () => {
  writeCustom([]);
};

export const resetToDefaults = () => {
  storage.remove(KEY);
  window.dispatchEvent(new CustomEvent("rs:orders-updated"));
};

/* ---------- Stats ---------- */

export const getOrderStats = () => {
  const list = getOrders();
  return {
    total: list.length,
    placed: list.filter((o) => o.status === "placed").length,
    processing: list.filter((o) => o.status === "processing").length,
    dispatched: list.filter((o) => o.status === "dispatched").length,
    outForDelivery: list.filter((o) => o.status === "out-for-delivery").length,
    delivered: list.filter((o) => o.status === "delivered").length,
    revenue: list.reduce((sum, o) => sum + (Number(o.totals?.total) || 0), 0),
  };
};

export const getDefaults = () => DEFAULT_ORDERS;
