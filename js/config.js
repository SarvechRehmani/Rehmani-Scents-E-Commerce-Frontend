/* ============================================================
   js/config.js
   Central business settings: brand, contact, delivery, promos.
   Change these values to rebrand the whole storefront.
   ============================================================ */

export const CONFIG = {
  brand: {
    name: "Rehmani Scents",
    tagline: "Premium Fragrances",
    established: 2024,
  },

  /* Announcement bar — set to null to hide */
  announcement: {
    enabled: true,
    text: "Discover your signature scent",
    highlight: "Complimentary delivery on qualifying orders",
  },

  /* Contact (demo placeholders — not verified) */
  contact: {
    email: "support@rehmaniscents.com",
    phone: "+92 300 0000000",
    phoneRaw: "+923000000000",
    whatsapp: "923000000000",
    location: "Pakistan",
    hours: [
      { day: "Monday — Friday", time: "10:00 — 19:00" },
      { day: "Saturday", time: "11:00 — 17:00" },
      { day: "Sunday", time: "Closed" },
    ],
  },

  /* Delivery / commerce */
  shipping: {
    freeThreshold: 3500, // free shipping above this subtotal
    standardRate: 250, // flat rate otherwise
    codFee: 0,
    estimatedDays: "2–4 working days",
    cities: [
      "Karachi",
      "Lahore",
      "Islamabad",
      "Rawalpindi",
      "Faisalabad",
      "Multan",
      "Hyderabad",
      "Sukkur",
      "Peshawar",
      "Quetta",
      "Gujranwala",
      "Sialkot",
      "Bahawalpur",
      "Sargodha",
      "Other",
    ],
    provinces: [
      "Sindh",
      "Punjab",
      "Khyber Pakhtunkhwa",
      "Balochistan",
      "Islamabad Capital Territory",
      "Gilgit-Baltistan",
      "Azad Kashmir",
    ],
  },

  /* Discount codes (demo only) */
  discounts: {
    REHMANI10: { type: "percent", value: 10, label: "10% off sitewide" },
  },

  /* Social — configurable */
  social: {
    instagram: "https://instagram.com/rehmaniscents",
    facebook: "https://facebook.com/rehmaniscents",
    tiktok: "",
  },

  /* Nav structure used by header.js */
  nav: {
    primary: [
      { label: "Home", href: "index.html" },
      { label: "Shop All", href: "shop.html" },
      { label: "Men", href: "men.html" },
      { label: "Women", href: "women.html" },
      { label: "Unisex", href: "unisex.html" },
      { label: "Collections", href: "collections.html", mega: "collections" },
      { label: "About Us", href: "about.html" },
    ],
  },

  /* Mega menu content */
  mega: {
    shop: {
      columns: [
        {
          title: "Shop By Category",
          links: [
            { label: "All Fragrances", href: "shop.html" },
            { label: "For Him", href: "men.html" },
            { label: "For Her", href: "women.html" },
            { label: "Unisex", href: "unisex.html" },
            { label: "Gift Sets", href: "collections.html#gift-sets" },
          ],
        },
        {
          title: "Fragrance Family",
          links: [
            { label: "Fresh & Citrus", href: "collections.html#fresh" },
            { label: "Woody & Oud", href: "collections.html#oud" },
            { label: "Floral", href: "collections.html#floral" },
            { label: "Amber & Spicy", href: "shop.html?family=Amber+Woody" },
            { label: "Best Sellers", href: "collections.html#best-sellers" },
          ],
        },
      ],
      promo: {
        image:
          "https://images.unsplash.com/photo-1610461888750-10bfc601b874?auto=format&fit=crop&w=800&q=80",
        eyebrow: "Signature",
        title: "The Oud Edit",
        href: "collections.html#oud",
      },
    },
    collections: {
      columns: [
        {
          title: "Curated Edits",
          links: [
            { label: "Best Sellers", href: "collections.html#best-sellers" },
            { label: "New Arrivals", href: "collections.html#new-arrivals" },
            { label: "Oud Collection", href: "collections.html#oud" },
            { label: "Fresh Collection", href: "collections.html#fresh" },
            { label: "Floral Collection", href: "collections.html#floral" },
            { label: "Gift Sets", href: "collections.html#gift-sets" },
          ],
        },
        {
          title: "Shop By Person",
          links: [
            { label: "Perfumes for Him", href: "men.html" },
            { label: "Perfumes for Her", href: "women.html" },
            { label: "Unisex Fragrances", href: "unisex.html" },
            { label: "His & Hers Sets", href: "collections.html#gift-sets" },
          ],
        },
      ],
      promo: {
        image:
          "https://images.unsplash.com/photo-1608528577891-eb055944f2e7?auto=format&fit=crop&w=800&q=80",
        eyebrow: "Gifting",
        title: "Beautifully Paired",
        href: "collections.html#gift-sets",
      },
    },
  },

  /* Reviews carousel (demo data) */
  demoReviews: [
    {
      name: "Ayesha K.",
      rating: 5,
      product: "Vayron",
      text: "Opens sharp and settles into something quietly confident. Lasts through a full working day.",
    },
    {
      name: "Bilal R.",
      rating: 4,
      product: "Royal Oud",
      text: "Rich without being heavy. I wear it for evening gatherings and it never feels like too much.",
    },
    {
      name: "Hira M.",
      rating: 5,
      product: "Velvet Bloom",
      text: "Soft and elegant. The rose and vanilla balance is exactly what I was looking for.",
    },
    {
      name: "Usman T.",
      rating: 4,
      product: "Citrus Veil",
      text: "My summer default. Light, clean and easy to wear in Karachi heat.",
    },
    {
      name: "Zain A.",
      rating: 5,
      product: "Midnight Leather",
      text: "Deep and grounded. The pepper at the top keeps it from feeling heavy.",
    },
  ],
};

export const DEMO_MODE = true;
