/* ============================================================
   js/bundles.js
   Demo gift sets — addable to cart as single line items.
   ============================================================ */

const U = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const bundles = [
  {
    id: "signature-duo",
    slug: "signature-duo",
    name: "Signature Duo",
    type: "bundle",
    tagline: "Two full-size fragrances",
    description:
      "A thoughtfully paired set — one for daylight, one for evening. Presented in signature packaging.",
    includes: ["Vayron (50ml)", "Royal Oud (50ml)"],
    price: 4499,
    comparePrice: 5998,
    images: [
      U("photo-1608528577891-eb055944f2e7"),
      U("photo-1585386959984-a4155224a1ad"),
    ],
    availability: "in-stock",
    collections: ["gift-sets", "best-sellers"],
    rating: 4.8,
    reviewCount: 24,
    keywords: ["gift", "set", "bundle", "duo", "signature"],
  },
  {
    id: "oud-discovery-set",
    slug: "oud-discovery-set",
    name: "Oud Discovery Set",
    type: "bundle",
    tagline: "Three oud-forward fragrances",
    description:
      "A small-format introduction to our oud compositions — Royal Oud, Saffron Ember and Imperial Reserve.",
    includes: [
      "Royal Oud (30ml)",
      "Saffron Ember (30ml)",
      "Imperial Reserve (30ml)",
    ],
    price: 5299,
    comparePrice: 6897,
    images: [
      U("photo-1610461888750-10bfc601b874"),
      U("photo-1557170334-a9632e77c6e4"),
    ],
    availability: "in-stock",
    collections: ["gift-sets", "oud"],
    rating: 4.9,
    reviewCount: 17,
    keywords: ["gift", "set", "oud", "discovery", "sampler"],
  },
  {
    id: "his-hers",
    slug: "his-hers",
    name: "His & Hers",
    type: "bundle",
    tagline: "A paired gifting set",
    description:
      "One masculine, one feminine — chosen to complement rather than clash. Ideal for anniversaries and weddings.",
    includes: ["Noir Majesty (50ml)", "Rose Elixir (50ml)"],
    price: 4999,
    comparePrice: 6198,
    images: [
      U("photo-1588405748880-12d1d2a59f75"),
      U("photo-1594035910387-fea47794261f"),
    ],
    availability: "in-stock",
    collections: ["gift-sets"],
    rating: 4.7,
    reviewCount: 19,
    keywords: ["gift", "set", "couple", "his", "hers", "wedding"],
  },
  {
    id: "fragrance-discovery-trio",
    slug: "fragrance-discovery-trio",
    name: "Fragrance Discovery Trio",
    type: "bundle",
    tagline: "Three directions, one box",
    description:
      "Fresh, floral and woody — a broad introduction to the house. Small-format bottles for sampling before committing.",
    includes: [
      "Citrus Veil (30ml)",
      "Velvet Bloom (30ml)",
      "Cedar Noir (30ml)",
    ],
    price: 3999,
    comparePrice: 5197,
    images: [
      U("photo-1523293182086-7651a899d37f"),
      U("photo-1592945403244-b3fbafd7f539"),
    ],
    availability: "in-stock",
    collections: ["gift-sets", "new-arrivals"],
    rating: 4.6,
    reviewCount: 22,
    keywords: ["gift", "set", "discovery", "trio", "sampler"],
  },
];

export const getBundleById = (id) =>
  bundles.find((b) => b.id === id || b.slug === id) || null;

export const getBundlesByCollection = (key) => {
  const k = String(key).toLowerCase();
  return bundles.filter((b) => b.collections?.includes(k));
};
