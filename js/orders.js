/* ============================================================
   js/orders.js
   Default demo orders. Admin edits are stored separately
   (see order-store.js), so this file is only the seed data.

   Each order has the same shape that checkout-page.js produces:
     {
       orderNumber, placedAt, status,
       customer: { name, email, phone },
       address:  { street, area, city, province, postal },
       payment, notes,
       items: [ { id, name, image, kind, ml, qty, price } ],
       totals: { subtotal, discount, discountCode, shipping, total }
     }
   ============================================================ */

export const DEFAULT_ORDERS = [
  {
    orderNumber: "RS-240115-4821",
    placedAt: "2024-01-15T10:24:00.000Z",
    status: "delivered",
    customer: {
      name: "Ayesha Khan",
      email: "ayesha.k@example.com",
      phone: "03001234567",
    },
    address: {
      street: "House 12, Street 5",
      area: "DHA Phase 6",
      city: "Karachi",
      province: "Sindh",
      postal: "75500",
    },
    payment: "cod",
    notes: "",
    items: [
      {
        id: "vayron",
        name: "Vayron",
        image:
          "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80",
        kind: "product",
        ml: 50,
        qty: 1,
        price: 2499,
      },
      {
        id: "citrus-veil",
        name: "Citrus Veil",
        image:
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=900&q=80",
        kind: "product",
        ml: 50,
        qty: 1,
        price: 1999,
      },
    ],
    totals: {
      subtotal: 4498,
      discount: 449,
      discountCode: "REHMANI10",
      shipping: 0,
      total: 4049,
    },
  },
  {
    orderNumber: "RS-240121-3312",
    placedAt: "2024-01-21T15:42:00.000Z",
    status: "dispatched",
    customer: {
      name: "Bilal Rahman",
      email: "bilal.r@example.com",
      phone: "03214567890",
    },
    address: {
      street: "Flat 3B, Gulberg Heights",
      area: "Gulberg III",
      city: "Lahore",
      province: "Punjab",
      postal: "54000",
    },
    payment: "cod",
    notes: "Please call before delivery.",
    items: [
      {
        id: "royal-oud",
        name: "Royal Oud",
        image:
          "https://images.unsplash.com/photo-1610461888750-10bfc601b874?auto=format&fit=crop&w=900&q=80",
        kind: "product",
        ml: 100,
        qty: 1,
        price: 4499,
      },
    ],
    totals: {
      subtotal: 4499,
      discount: 0,
      discountCode: null,
      shipping: 0,
      total: 4499,
    },
  },
  {
    orderNumber: "RS-240203-7745",
    placedAt: "2024-02-03T09:15:00.000Z",
    status: "processing",
    customer: {
      name: "Hira Malik",
      email: "hira.m@example.com",
      phone: "03335556677",
    },
    address: {
      street: "House 88",
      area: "F-7/2",
      city: "Islamabad",
      province: "Islamabad Capital Territory",
      postal: "44000",
    },
    payment: "bank",
    notes: "",
    items: [
      {
        id: "velvet-bloom",
        name: "Velvet Bloom",
        image:
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=900&q=80",
        kind: "product",
        ml: 50,
        qty: 2,
        price: 2499,
      },
    ],
    totals: {
      subtotal: 4998,
      discount: 500,
      discountCode: "REHMANI10",
      shipping: 0,
      total: 4498,
    },
  },
  {
    orderNumber: "RS-240218-6630",
    placedAt: "2024-02-18T18:07:00.000Z",
    status: "placed",
    customer: {
      name: "Usman Tariq",
      email: "usman.t@example.com",
      phone: "03451112233",
    },
    address: {
      street: "Plot 45, Block C",
      area: "Bahria Town",
      city: "Rawalpindi",
      province: "Punjab",
      postal: "46000",
    },
    payment: "cod",
    notes: "Gift wrap please.",
    items: [
      {
        id: "signature-duo",
        name: "Signature Duo",
        image:
          "https://images.unsplash.com/photo-1608528577891-eb055944f2e7?auto=format&fit=crop&w=900&q=80",
        kind: "bundle",
        ml: null,
        qty: 1,
        price: 4499,
      },
    ],
    totals: {
      subtotal: 4499,
      discount: 0,
      discountCode: null,
      shipping: 0,
      total: 4499,
    },
  },
  {
    orderNumber: "RS-240301-1198",
    placedAt: "2024-03-01T11:30:00.000Z",
    status: "out-for-delivery",
    customer: {
      name: "Zain Abbas",
      email: "zain.a@example.com",
      phone: "03123456789",
    },
    address: {
      street: "House 6, Street 12",
      area: "Clifton Block 5",
      city: "Karachi",
      province: "Sindh",
      postal: "75600",
    },
    payment: "online",
    notes: "",
    items: [
      {
        id: "midnight-leather",
        name: "Midnight Leather",
        image:
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=80",
        kind: "product",
        ml: 50,
        qty: 1,
        price: 3499,
      },
      {
        id: "imperial-reserve",
        name: "Imperial Reserve",
        image:
          "https://images.unsplash.com/photo-1557170334-a9632e77c6e4?auto=format&fit=crop&w=900&q=80",
        kind: "product",
        ml: 50,
        qty: 1,
        price: 3999,
      },
    ],
    totals: {
      subtotal: 7498,
      discount: 750,
      discountCode: "REHMANI10",
      shipping: 0,
      total: 6748,
    },
  },
];
