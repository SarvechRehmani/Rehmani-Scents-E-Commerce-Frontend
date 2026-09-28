/* ============================================================
   js/products.js
   The complete 15-product demo catalog. All data lives here —
   pages read from this single source of truth.
   ============================================================ */

const U = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMG = {
  amber: U("photo-1541643600914-78b084683601"),
  flacon: U("photo-1615634260167-c8cdede054de"),
  dark: U("photo-1595425970377-c9703cf48b6d"),
  masc: U("photo-1594035910387-fea47794261f"),
  floral: U("photo-1588405748880-12d1d2a59f75"),
  marble: U("photo-1592945403244-b3fbafd7f539"),
  oud: U("photo-1610461888750-10bfc601b874"),
  fresh: U("photo-1523293182086-7651a899d37f"),
  gift: U("photo-1608528577891-eb055944f2e7"),
  minimal: U("photo-1587017539504-67cfbddac569"),
  still: U("photo-1619994403073-2cec844b8e63"),
  stone: U("photo-1563170351-be82bc888aa4"),
  layered: U("photo-1585386959984-a4155224a1ad"),
  studio: U("photo-1600612253971-422e7f7faeb6"),
  warm: U("photo-1557170334-a9632e77c6e4"),
};

/* Base price = 50ml. 100ml = base + 1000. Compare = base + 500 (only when discounted). */
const vol = (base, hasDiscount = true) => [
  { ml: 50, price: base, comparePrice: hasDiscount ? base + 500 : null },
  {
    ml: 100,
    price: base + 1000,
    comparePrice: hasDiscount ? base + 1500 : null,
  },
];

export const products = [
  {
    id: "vayron",
    slug: "vayron",
    name: "Vayron",
    category: "Men",
    gender: "men",
    family: "Aromatic Woody",
    shortDescription:
      "Fresh, aromatic and quietly confident — built for everyday presence.",
    description:
      "A crisp opening of bergamot and pepper gives way to a composed heart of lavender and geranium, resting on a warm base of cedarwood and amber. Vayron is designed to be worn daily and remembered long after.",
    notes: {
      top: "Bergamot, Pepper",
      heart: "Lavender, Geranium",
      base: "Cedarwood, Amber",
    },
    volumes: vol(2499),
    images: [IMG.amber, IMG.flacon, IMG.dark],
    occasion: ["Office", "Daily", "Daytime"],
    season: ["Spring", "Autumn"],
    longevity: "6–8 hours",
    availability: "in-stock",
    flags: { featured: true, bestSeller: true, newArrival: false },
    collections: ["best-sellers", "fresh", "woody", "men"],
    rating: 4.7,
    reviewCount: 42,
    keywords: [
      "fresh",
      "aromatic",
      "woody",
      "bergamot",
      "lavender",
      "cedar",
      "men",
      "daily",
    ],
  },
  {
    id: "avyron",
    slug: "avyron",
    name: "Avyron",
    category: "Men",
    gender: "men",
    family: "Fruity Woody",
    shortDescription: "Bright fruit over smoky birch and warm musk.",
    description:
      "Avyron opens with juicy lemon and blackcurrant, then settles into a distinctive heart of birch and jasmine. The drydown of musk and patchouli gives it a quietly modern signature.",
    notes: {
      top: "Lemon, Blackcurrant",
      heart: "Birch, Jasmine",
      base: "Musk, Patchouli",
    },
    volumes: vol(2799),
    images: [IMG.masc, IMG.stone, IMG.minimal],
    occasion: ["Evening", "Date Night", "Weekend"],
    season: ["Autumn", "Winter"],
    longevity: "7–9 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: false, newArrival: false },
    collections: ["woody", "men"],
    rating: 4.5,
    reviewCount: 28,
    keywords: [
      "fruity",
      "woody",
      "lemon",
      "blackcurrant",
      "birch",
      "musk",
      "men",
      "evening",
    ],
  },
  {
    id: "royal-oud",
    slug: "royal-oud",
    name: "Royal Oud",
    category: "Unisex",
    gender: "unisex",
    family: "Woody Oriental",
    shortDescription: "Saffron and rose wrapped around a deep oud core.",
    description:
      "Royal Oud opens with saffron and bright citrus before unveiling a rich heart of rose and oud. Amber and musk anchor the composition, giving it depth that lingers for hours.",
    notes: { top: "Saffron, Citrus", heart: "Rose, Oud", base: "Amber, Musk" },
    volumes: vol(3499),
    images: [IMG.oud, IMG.dark, IMG.amber],
    occasion: ["Evening", "Special Occasion", "Festive"],
    season: ["Autumn", "Winter"],
    longevity: "8–10 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: true, newArrival: false },
    collections: ["best-sellers", "oud", "unisex"],
    rating: 4.9,
    reviewCount: 61,
    keywords: [
      "oud",
      "saffron",
      "rose",
      "amber",
      "oriental",
      "unisex",
      "evening",
      "luxury",
    ],
  },
  {
    id: "noir-majesty",
    slug: "noir-majesty",
    name: "Noir Majesty",
    category: "Men",
    gender: "men",
    family: "Amber Woody",
    shortDescription: "Cardamom and leather bound by warm amber and vanilla.",
    description:
      "A confident composition of cardamom and pepper opening onto leather and cedar, grounded in amber and vanilla. Noir Majesty is built for presence without shouting.",
    notes: {
      top: "Cardamom, Pepper",
      heart: "Leather, Cedar",
      base: "Amber, Vanilla",
    },
    volumes: vol(2999),
    images: [IMG.dark, IMG.masc, IMG.studio],
    occasion: ["Evening", "Formal", "Date Night"],
    season: ["Autumn", "Winter"],
    longevity: "7–9 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: false, newArrival: true },
    collections: ["new-arrivals", "woody", "men"],
    rating: 4.6,
    reviewCount: 19,
    keywords: [
      "amber",
      "leather",
      "cardamom",
      "vanilla",
      "men",
      "evening",
      "formal",
    ],
  },
  {
    id: "citrus-veil",
    slug: "citrus-veil",
    name: "Citrus Veil",
    category: "Unisex",
    gender: "unisex",
    family: "Fresh Citrus",
    shortDescription: "Clean, bright and effortless — a summer default.",
    description:
      "Lemon and bergamot lead into a heart of neroli and green tea, softening to a clean white musk base. Citrus Veil is the fragrance you reach for when nothing else feels right.",
    notes: {
      top: "Lemon, Bergamot",
      heart: "Neroli, Green Tea",
      base: "White Musk",
    },
    volumes: vol(1999),
    images: [IMG.fresh, IMG.minimal, IMG.stone],
    occasion: ["Daily", "Office", "Daytime"],
    season: ["Spring", "Summer"],
    longevity: "5–7 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: false, newArrival: false },
    collections: ["fresh", "unisex"],
    rating: 4.4,
    reviewCount: 33,
    keywords: [
      "citrus",
      "fresh",
      "lemon",
      "bergamot",
      "neroli",
      "green tea",
      "unisex",
      "summer",
    ],
  },
  {
    id: "velvet-bloom",
    slug: "velvet-bloom",
    name: "Velvet Bloom",
    category: "Women",
    gender: "women",
    family: "Floral",
    shortDescription: "Soft rose and jasmine over a warm vanilla musk.",
    description:
      "Velvet Bloom opens with pear and mandarin before unfolding into a soft floral heart of rose and jasmine. Vanilla and musk in the base give it a warm, comforting finish.",
    notes: {
      top: "Pear, Mandarin",
      heart: "Rose, Jasmine",
      base: "Vanilla, Musk",
    },
    volumes: vol(2499),
    images: [IMG.floral, IMG.marble, IMG.layered],
    occasion: ["Daily", "Daytime", "Romantic"],
    season: ["Spring", "Summer"],
    longevity: "6–8 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: true, newArrival: false },
    collections: ["best-sellers", "floral", "women"],
    rating: 4.8,
    reviewCount: 54,
    keywords: [
      "floral",
      "rose",
      "jasmine",
      "vanilla",
      "pear",
      "women",
      "romantic",
      "daily",
    ],
  },
  {
    id: "amber-dusk",
    slug: "amber-dusk",
    name: "Amber Dusk",
    category: "Unisex",
    gender: "unisex",
    family: "Amber Woody",
    shortDescription: "Spiced amber with rose and oud at the base.",
    description:
      "Saffron and cinnamon open warm and spiced, while rose and amber carry the heart. Oud and vanilla close the composition with quiet intensity.",
    notes: {
      top: "Saffron, Cinnamon",
      heart: "Amber, Rose",
      base: "Oud, Vanilla",
    },
    volumes: vol(3299),
    images: [IMG.amber, IMG.oud, IMG.warm],
    occasion: ["Evening", "Festive", "Special Occasion"],
    season: ["Autumn", "Winter"],
    longevity: "8–10 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: false, newArrival: false },
    collections: ["oud", "unisex"],
    rating: 4.7,
    reviewCount: 24,
    keywords: [
      "amber",
      "oud",
      "saffron",
      "cinnamon",
      "rose",
      "vanilla",
      "unisex",
      "winter",
    ],
  },
  {
    id: "ocean-crest",
    slug: "ocean-crest",
    name: "Ocean Crest",
    category: "Men",
    gender: "men",
    family: "Aquatic Fresh",
    shortDescription: "Sea air and lavender over cedar and musk.",
    description:
      "Sea notes and bergamot open crisp and cool. Lavender and sage in the heart keep it grounded, while cedar and musk bring a clean, dry finish.",
    notes: {
      top: "Sea Notes, Bergamot",
      heart: "Lavender, Sage",
      base: "Cedar, Musk",
    },
    volumes: vol(2299),
    images: [IMG.fresh, IMG.masc, IMG.minimal],
    occasion: ["Daily", "Sport", "Daytime"],
    season: ["Spring", "Summer"],
    longevity: "5–7 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: false, newArrival: true },
    collections: ["new-arrivals", "fresh", "men"],
    rating: 4.5,
    reviewCount: 21,
    keywords: [
      "aquatic",
      "fresh",
      "sea",
      "lavender",
      "sage",
      "cedar",
      "men",
      "summer",
    ],
  },
  {
    id: "rose-elixir",
    slug: "rose-elixir",
    name: "Rose Elixir",
    category: "Women",
    gender: "women",
    family: "Floral Oriental",
    shortDescription: "Pink pepper and lychee lifting a rich rose heart.",
    description:
      "A modern rose — brightened by pink pepper and lychee, then deepened with peony and amber. Vanilla in the base gives it warmth without sweetness.",
    notes: {
      top: "Pink Pepper, Lychee",
      heart: "Rose, Peony",
      base: "Amber, Vanilla",
    },
    volumes: vol(2699),
    images: [IMG.floral, IMG.layered, IMG.marble],
    occasion: ["Evening", "Romantic", "Special Occasion"],
    season: ["Autumn", "Winter", "Spring"],
    longevity: "7–9 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: true, newArrival: false },
    collections: ["best-sellers", "floral", "women"],
    rating: 4.8,
    reviewCount: 47,
    keywords: [
      "rose",
      "floral",
      "pink pepper",
      "lychee",
      "peony",
      "amber",
      "women",
      "romantic",
    ],
  },
  {
    id: "midnight-leather",
    slug: "midnight-leather",
    name: "Midnight Leather",
    category: "Men",
    gender: "men",
    family: "Leather Woody",
    shortDescription: "Pepper and cardamom over smooth leather and vetiver.",
    description:
      "Black pepper and cardamom open with bite, transitioning into a smooth leather and violet heart. Vetiver and amber close it with quiet authority.",
    notes: {
      top: "Black Pepper, Cardamom",
      heart: "Leather, Violet",
      base: "Vetiver, Amber",
    },
    volumes: vol(3499),
    images: [IMG.masc, IMG.dark, IMG.stone],
    occasion: ["Evening", "Formal", "Date Night"],
    season: ["Autumn", "Winter"],
    longevity: "8–10 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: false, newArrival: false },
    collections: ["woody", "men"],
    rating: 4.7,
    reviewCount: 31,
    keywords: [
      "leather",
      "woody",
      "pepper",
      "cardamom",
      "violet",
      "vetiver",
      "men",
      "evening",
    ],
  },
  {
    id: "saffron-ember",
    slug: "saffron-ember",
    name: "Saffron Ember",
    category: "Unisex",
    gender: "unisex",
    family: "Spicy Oriental",
    shortDescription: "Saffron and incense over oud and sandalwood.",
    description:
      "Saffron and cinnamon open warm and vivid. Incense and rose in the heart add a smoky richness, while oud and sandalwood ground it in quiet depth.",
    notes: {
      top: "Saffron, Cinnamon",
      heart: "Incense, Rose",
      base: "Oud, Sandalwood",
    },
    volumes: vol(3299),
    images: [IMG.oud, IMG.warm, IMG.amber],
    occasion: ["Evening", "Festive", "Special Occasion"],
    season: ["Autumn", "Winter"],
    longevity: "8–10 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: false, newArrival: true },
    collections: ["new-arrivals", "oud", "unisex"],
    rating: 4.6,
    reviewCount: 16,
    keywords: [
      "saffron",
      "incense",
      "oud",
      "sandalwood",
      "spicy",
      "unisex",
      "festive",
      "winter",
    ],
  },
  {
    id: "blooming-grace",
    slug: "blooming-grace",
    name: "Blooming Grace",
    category: "Women",
    gender: "women",
    family: "Floral Fruity",
    shortDescription: "Apple and bergamot over soft rose and jasmine.",
    description:
      "A bright, approachable floral. Apple and bergamot open fresh, rose and jasmine carry the heart, and musk and vanilla give a soft, comforting finish.",
    notes: {
      top: "Apple, Bergamot",
      heart: "Rose, Jasmine",
      base: "Musk, Vanilla",
    },
    volumes: vol(2199),
    images: [IMG.floral, IMG.minimal, IMG.marble],
    occasion: ["Daily", "Daytime", "Office"],
    season: ["Spring", "Summer"],
    longevity: "5–7 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: false, newArrival: false },
    collections: ["floral", "women"],
    rating: 4.5,
    reviewCount: 38,
    keywords: [
      "floral",
      "fruity",
      "apple",
      "bergamot",
      "rose",
      "jasmine",
      "women",
      "daily",
    ],
  },
  {
    id: "cedar-noir",
    slug: "cedar-noir",
    name: "Cedar Noir",
    category: "Men",
    gender: "men",
    family: "Woody Aromatic",
    shortDescription: "Grapefruit and pepper over cedar and tonka.",
    description:
      "Cedar Noir opens bright with grapefruit and pepper, transitioning to a woody heart of cedarwood and vetiver. Tonka bean and musk soften the drydown.",
    notes: {
      top: "Grapefruit, Pepper",
      heart: "Cedarwood, Vetiver",
      base: "Tonka Bean, Musk",
    },
    volumes: vol(2799),
    images: [IMG.stone, IMG.dark, IMG.masc],
    occasion: ["Office", "Daily", "Daytime"],
    season: ["Autumn", "Spring"],
    longevity: "6–8 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: false, newArrival: false },
    collections: ["woody", "men"],
    rating: 4.6,
    reviewCount: 26,
    keywords: [
      "woody",
      "aromatic",
      "grapefruit",
      "pepper",
      "cedar",
      "vetiver",
      "tonka",
      "men",
    ],
  },
  {
    id: "musk-serenity",
    slug: "musk-serenity",
    name: "Musk Serenity",
    category: "Unisex",
    gender: "unisex",
    family: "Soft Musk",
    shortDescription: "White flowers and iris over clean white musk.",
    description:
      "A calm, skin-close fragrance. Bergamot and pear open soft, white flowers and iris carry the middle, and white musk and sandalwood give it quiet warmth.",
    notes: {
      top: "Bergamot, Pear",
      heart: "White Flowers, Iris",
      base: "White Musk, Sandalwood",
    },
    volumes: vol(2499),
    images: [IMG.minimal, IMG.studio, IMG.stone],
    occasion: ["Daily", "Office", "Daytime"],
    season: ["Spring", "Summer", "Autumn"],
    longevity: "5–7 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: false, newArrival: false },
    collections: ["unisex"],
    rating: 4.4,
    reviewCount: 22,
    keywords: [
      "musk",
      "soft",
      "iris",
      "white flowers",
      "sandalwood",
      "unisex",
      "daily",
      "clean",
    ],
  },
  {
    id: "imperial-reserve",
    slug: "imperial-reserve",
    name: "Imperial Reserve",
    category: "Unisex",
    gender: "unisex",
    family: "Oriental Woody",
    shortDescription: "Saffron and bergamot over oud, rose and amber.",
    description:
      "Our most composed fragrance. Saffron and bergamot open with restraint, oud and rose carry the heart, and amber and sandalwood close with quiet authority.",
    notes: {
      top: "Saffron, Bergamot",
      heart: "Oud, Rose",
      base: "Amber, Sandalwood",
    },
    volumes: vol(3999),
    images: [IMG.warm, IMG.oud, IMG.amber],
    occasion: ["Evening", "Special Occasion", "Festive"],
    season: ["Autumn", "Winter"],
    longevity: "9–11 hours",
    availability: "in-stock",
    flags: { featured: false, bestSeller: true, newArrival: true },
    collections: ["new-arrivals", "best-sellers", "oud", "unisex"],
    rating: 4.9,
    reviewCount: 35,
    keywords: [
      "oud",
      "saffron",
      "rose",
      "amber",
      "sandalwood",
      "unisex",
      "luxury",
      "evening",
    ],
  },
];

/* ---------- Lookups ---------- */
export const getProductById = (id) =>
  products.find((p) => p.id === id || p.slug === id) || null;

export const getProductsByCategory = (cat) =>
  products.filter(
    (p) => p.category.toLowerCase() === String(cat).toLowerCase(),
  );

export const getByCollection = (key) => {
  const k = String(key).toLowerCase();
  return products.filter((p) => p.collections?.includes(k));
};

export const getBestSellers = () => products.filter((p) => p.flags.bestSeller);
export const getNewArrivals = () => products.filter((p) => p.flags.newArrival);
export const getFeatured = () => products.filter((p) => p.flags.featured);

export const getRelated = (product, limit = 4) => {
  if (!product) return [];
  const scored = products
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      if (p.category === product.category) score += 2;
      if (p.family === product.family) score += 3;
      if (p.collections?.some((c) => product.collections?.includes(c)))
        score += 1;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.p);
};

export const getPriceRange = () => {
  const all = products.flatMap((p) => p.volumes.map((v) => v.price));
  return { min: Math.min(...all), max: Math.max(...all) };
};

export const getAllFamilies = () =>
  [...new Set(products.map((p) => p.family))].sort();

export const getAllOccasions = () =>
  [...new Set(products.flatMap((p) => p.occasion))].sort();

export const getAllSeasons = () =>
  [...new Set(products.flatMap((p) => p.season))].sort();

export const getAllVolumes = () =>
  [...new Set(products.flatMap((p) => p.volumes.map((v) => v.ml)))].sort(
    (a, b) => a - b,
  );

/* Default volume helper */
export const defaultVolume = (product) => product.volumes[0];

export const priceForVolume = (product, ml) =>
  product.volumes.find((v) => v.ml === Number(ml)) || defaultVolume(product);
