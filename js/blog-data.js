/* ============================================================
   js/blog-data.js
   Central blog content for the Fragrance Journal.
   ============================================================ */

const U = (id, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const BLOG_CATEGORIES = [
  { key: "all", label: "All Articles" },
  { key: "guides", label: "Fragrance Guides" },
  { key: "tips", label: "Perfume Tips" },
  { key: "notes", label: "Fragrance Notes" },
  { key: "gifting", label: "Gift Guides" },
  { key: "care", label: "Perfume Care" },
];

export const ARTICLES = [
  {
    id: "how-to-choose-your-first-signature",
    slug: "how-to-choose-your-first-signature",
    title: "How To Choose Your First Signature Fragrance",
    category: "guides",
    categoryLabel: "Fragrance Guides",
    excerpt:
      "A calm, practical approach to picking a scent you will actually wear — starting with direction, not brand.",
    hero: U("photo-1592945403244-b3fbafd7f539"),
    thumb: U("photo-1592945403244-b3fbafd7f539", 800),
    date: "2024-11-12",
    readTime: 6,
    author: "Rehmani Scents",
    featured: true,
    tags: ["choosing", "beginner", "signature scent"],
    body: `
      <p>The first fragrance is always the hardest. Walk into any store and you are
      surrounded by hundreds of bottles, each with a name that sounds like a poem
      and a description that sounds like a wine list. It is easy to leave with
      something you liked in the aisle and hated on your skin two hours later.</p>

      <p>Here is a calmer way to approach it.</p>

      <h2>Start with direction, not name</h2>

      <p>Before you look at a single bottle, answer three questions about yourself:</p>

      <ul>
        <li>Do I want something <strong>fresh and clean</strong>, or something
        <strong>warm and deep</strong>?</li>
        <li>Do I want it for <strong>daytime</strong>, <strong>evening</strong>, or both?</li>
        <li>Do I want it to <strong>sit close to my skin</strong>, or announce itself a little?</li>
      </ul>

      <p>Those three answers narrow the field from hundreds to a dozen. If you are
      unsure, ask yourself what kind of clean laundry, or what kind of weather, or
      what kind of room you would want to smell like. That is usually a more honest
      answer than any adjective on a label.</p>

      <h2>Do not buy in the first hour</h2>

      <p>Top notes are designed to be likable. They are bright, clean and easy, and
      they last for the first fifteen to thirty minutes. The heart and base — the
      part you will actually live with — take longer to arrive.</p>

      <p>Whenever possible, apply a fragrance and then leave the store. Walk around
      for a couple of hours. Smell it again at the end of that time. If you still
      like it, that is a fragrance worth owning. If you are unsure, it is not yet
      a signature — it is just a first impression.</p>

      <blockquote>What you are trying to decide is not whether the fragrance is good.
      It is whether the fragrance is you.</blockquote>

      <h2>Consider the season you are buying for</h2>

      <p>A fragrance that feels perfect in December will often feel heavy in June.
      If you are buying your first fragrance, buy it for the season you are in.
      You can build a small wardrobe over time — fresh for warm weather, woody for
      cool weather, amber and oud for evenings.</p>

      <h2>Two bottles is a wardrobe</h2>

      <p>You do not need ten fragrances to feel settled. Two well-chosen bottles —
      one for daylight and one for evening — cover almost every situation in a
      normal year. A third can be added later for very formal occasions.</p>

      <p>Start with one. Wear it for a month. Learn what you like about it and what
      you would change. Then choose the second one with far more confidence than
      you chose the first.</p>
    `,
  },
  {
    id: "understanding-fragrance-notes",
    slug: "understanding-fragrance-notes",
    title: "Understanding Fragrance Notes: Top, Heart & Base",
    category: "notes",
    categoryLabel: "Fragrance Notes",
    excerpt:
      "Why a scent smells different after an hour — and what the three layers are actually doing.",
    hero: U("photo-1585386959984-a4155224a1ad"),
    thumb: U("photo-1585386959984-a4155224a1ad", 800),
    date: "2024-10-28",
    readTime: 5,
    author: "Rehmani Scents",
    featured: false,
    tags: ["notes", "guide", "structure"],
    body: `
      <p>Fragrance is not one smell. It is a sequence of smells, unfolding over
      time. This is why a perfume you loved in the first minute can feel entirely
      different an hour later.</p>

      <h2>The three layers</h2>

      <p>Every fragrance is composed in three layers that arrive in a specific
      order:</p>

      <h3>Top notes</h3>
      <p>The first impression. These are the lightest, most volatile molecules in
      the composition — usually citrus, aromatic herbs, or a light spice. They
      arrive immediately and disappear within fifteen to thirty minutes.</p>

      <h3>Heart notes</h3>
      <p>The character of the fragrance. Once the top notes fade, the heart takes
      over — floral, woody, spice-led or resinous depending on the composition.
      This is the layer that runs through most of the wear.</p>

      <h3>Base notes</h3>
      <p>The memory. These are the heaviest molecules, and the ones that remain on
      skin and fabric for hours. Cedar, amber, musk, oud and sandalwood do most of
      this work. The base is what people smell when they lean in.</p>

      <blockquote>When people say "I like the way you smell," they are almost
      always talking about the base.</blockquote>

      <h2>Why the layering matters</h2>

      <p>If you judge a fragrance only by its opening, you are missing two-thirds
      of the composition. The most interesting fragrances often open sharply and
      settle into something softer — or open quietly and deepen into something
      memorable.</p>

      <p>When you are reading a fragrance description on our site, the note
      pyramid shows you the intended trajectory. It is not a list of ingredients.
      It is a timeline.</p>

      <h2>How to use this when shopping</h2>

      <p>When you try a fragrance, resist the urge to decide in the first minute.
      Give it twenty minutes before you form an opinion, and two hours before you
      decide whether you would wear it again. That second smell, on your own skin,
      in your own climate, is where the real answer is.</p>
    `,
  },
  {
    id: "make-your-fragrance-last-longer",
    slug: "make-your-fragrance-last-longer",
    title: "Seven Small Habits That Make A Fragrance Last Longer",
    category: "tips",
    categoryLabel: "Perfume Tips",
    excerpt:
      "Simple, well-known practices that genuinely extend wear time — and one myth worth ignoring.",
    hero: U("photo-1615634260167-c8cdede054de"),
    thumb: U("photo-1615634260167-c8cdede054de", 800),
    date: "2024-10-15",
    readTime: 4,
    author: "Rehmani Scents",
    featured: false,
    tags: ["longevity", "application", "tips"],
    body: `
      <p>Most complaints about fragrance longevity are not about the fragrance.
      They are about how and where it was applied. These seven habits will get
      more wear time out of almost any scent.</p>

      <h2>1. Apply to moisturised skin</h2>
      <p>Fragrance clings to hydrated skin. Dry skin loses it quickly. Apply an
      unscented moisturiser or a light carrier oil to pulse points before spraying.
      This is the single most effective change most people can make.</p>

      <h2>2. Use pulse points, not clothing</h2>
      <p>Warmth from the wrists, throat and behind the ears helps the fragrance
      unfold slowly. Spraying on fabric is fine for projection, but the longest
      wear comes from skin.</p>

      <h2>3. Do not rub your wrists together</h2>
      <p>This is the myth worth dropping. Rubbing crushes the top notes and
      shortens the opening, and it does nothing to help the base. Let the
      fragrance settle on its own.</p>

      <h2>4. Spray before you dress</h2>
      <p>Give the fragrance two to three minutes to settle on skin before pulling
      on clothing. This keeps the scent from transferring to fabric too early,
      where it fades differently.</p>

      <h2>5. Layer with a matching body wash or lotion</h2>
      <p>A matching body product underneath extends wear by several hours. If you
      do not have one, an unscented lotion works almost as well.</p>

      <h2>6. Store away from heat and light</h2>
      <p>Fragrance is sensitive to temperature and ultraviolet light. Keep bottles
      in a closed drawer or the original box, away from bathroom humidity. This
      protects both the opening and the base over the months you own it.</p>

      <h2>7. Carry a small travel bottle</h2>
      <p>A 5ml decant in your bag lets you top up in the late afternoon without
      carrying the full bottle. A single reapplication usually restores the
      fragrance for the rest of the day.</p>

      <p>None of these habits are dramatic. Together, they can add several hours
      of wear to a fragrance you already own.</p>
    `,
  },
  {
    id: "gifting-fragrance-guide",
    slug: "gifting-fragrance-guide",
    title: "How To Gift A Fragrance Without Getting It Wrong",
    category: "gifting",
    categoryLabel: "Gift Guides",
    excerpt:
      "A short, practical guide to picking a scent for someone else — without overthinking it.",
    hero: U("photo-1608528577891-eb055944f2e7"),
    thumb: U("photo-1608528577891-eb055944f2e7", 800),
    date: "2024-09-30",
    readTime: 5,
    author: "Rehmani Scents",
    featured: false,
    tags: ["gifting", "sets", "guide"],
    body: `
      <p>Fragrance is one of the best gifts you can give — and one of the easiest
      to get wrong. The reason is simple: it is the most personal thing a person
      wears. It has to match their identity, not yours.</p>

      <p>Here is how to get it right most of the time.</p>

      <h2>Notice what they already wear</h2>

      <p>If you have access to their collection, take a photograph. Most fragrances
      list the family on the bottle or box. If they wear a fresh citrus, look for
      another fresh citrus or a light aromatic. If they wear something amber or
      woody, stay in that direction. You do not need to find the same fragrance —
      just stay in the same family.</p>

      <h2>If you cannot find out, choose a set</h2>

      <p>Discovery sets and small-format duos are the safest gift in this category.
      They let the recipient sample a direction without committing, and they feel
      more considered than a single bottle you are not sure about.</p>

      <h2>Avoid the two clichés</h2>

      <p>Two categories fail more often than any other: extremely sweet gourmands
      and extremely heavy oud-forward compositions. Both are polarising. Unless
      you know the person loves them, avoid.</p>

      <h2>Presentation is half the gift</h2>

      <p>A fragrance arrives at its best in good packaging. A well-presented box
      with a handwritten note outperforms a larger bottle in a plain bag, almost
      every time. If you are gifting, do not underestimate this.</p>

      <h2>Include the return path</h2>

      <p>If you are unsure, choose a store with a clear exchange window. The most
      thoughtful gift is one the recipient can change if it is not quite right.</p>

      <blockquote>A fragrance gift says "I thought about you." That is a much
      easier thing to get right than a specific scent.</blockquote>
    `,
  },
  {
    id: "caring-for-your-fragrance",
    slug: "caring-for-your-fragrance",
    title: "How To Store and Care For Your Fragrance",
    category: "care",
    categoryLabel: "Perfume Care",
    excerpt:
      "Simple storage rules that keep a fragrance smelling the way it did on the day you bought it.",
    hero: U("photo-1610461888750-10bfc601b874"),
    thumb: U("photo-1610461888750-10bfc601b874", 800),
    date: "2024-09-12",
    readTime: 4,
    author: "Rehmani Scents",
    featured: false,
    tags: ["storage", "care", "longevity"],
    body: `
      <p>A fragrance is a small chemical composition, and like any composition it
      can drift over time. The good news is that the drift is slow, and simple
      habits keep it slow.</p>

      <h2>The three enemies</h2>

      <p>Fragrance is damaged by heat, light and humidity. Bathrooms are the worst
      possible storage environment for this reason — all three factors at once.
      If you keep your bottle on a bathroom shelf, move it today.</p>

      <h2>Store it cool and dark</h2>

      <p>A closed drawer, a shelf away from windows, or the original box on a
      bedside table all work well. Room temperature is fine. Direct sunlight and
      radiators are not.</p>

      <h2>Keep the cap on</h2>

      <p>Obvious, but worth saying. An open bottle slowly evaporates the alcohol
      base, which distorts the composition. Keep the cap sealed when the bottle is
      not in use.</p>

      <h2>Use it, do not save it</h2>

      <p>Fragrance is meant to be worn. A bottle sitting untouched for years will
      still slowly change. Using it regularly is not wasting it — it is what the
      fragrance was made for.</p>

      <h2>Expect citrus to age first</h2>

      <p>Citrus and fresh compositions fade faster than amber or oud-forward ones.
      If you own something very citrus-heavy, try to use it within a year or so.
      Deeper compositions are more forgiving and often improve slightly with age.</p>

      <h2>Signs a fragrance has turned</h2>

      <p>Sharp, alcohol-heavy opening. A smell like nail polish remover. A colour
      shift toward dark brown (for a fragrance that was originally clear). If any
      of these appear, the fragrance has degraded. It is not dangerous, but it is
      no longer the fragrance you bought.</p>

      <p>Good storage prevents this for years. It is not complicated — it is just
      a matter of giving the bottle a better home than the bathroom shelf.</p>
    `,
  },
  {
    id: "building-a-small-wardrobe",
    slug: "building-a-small-wardrobe",
    title: "Building A Small, Useful Fragrance Wardrobe",
    category: "guides",
    categoryLabel: "Fragrance Guides",
    excerpt:
      "You do not need ten bottles. Three fragrances cover almost every situation in a normal year.",
    hero: U("photo-1563170351-be82bc888aa4"),
    thumb: U("photo-1563170351-be82bc888aa4", 800),
    date: "2024-08-22",
    readTime: 5,
    author: "Rehmani Scents",
    featured: false,
    tags: ["wardrobe", "collection", "guide"],
    body: `
      <p>There is a particular kind of collector who owns forty bottles and
      wears three. There is also a particular kind of person who owns one bottle
      and wears it well for a decade. Both are valid, but somewhere between them
      is a sweet spot: three or four fragrances, chosen carefully, that cover
      almost everything.</p>

      <h2>Slot 1 — The daytime fragrance</h2>

      <p>Fresh, aromatic, clean. This is what you reach for on a normal working
      day — office, commute, casual lunch. It should sit close to the skin and
      not overwhelm a room. Think citrus, aromatic herbs, clean woods.</p>

      <h2>Slot 2 — The evening fragrance</h2>

      <p>Warmer, deeper, more structured. This is what you wear when the day is
      over and the situation calls for presence — dinner, an event, a night out.
      Think amber, spice, leather, or a warm woody base.</p>

      <h2>Slot 3 — The formal or special-occasion fragrance</h2>

      <p>Reserved for weddings, celebrations and anything where you want to be
      remembered. This is often an oud-forward or amber-forward composition, or
      something unusually refined. Because you wear it rarely, this bottle lasts
      for years.</p>

      <h2>Optional Slot 4 — The seasonal outlier</h2>

      <p>If you live somewhere with extreme weather, a fourth slot helps. A very
      light summer fragrance for the hottest weeks, or a heavy winter fragrance
      for the coldest. This slot is optional and can be added once the first three
      are settled.</p>

      <h2>Choose slowly, wear thoroughly</h2>

      <p>The mistake most people make is filling all four slots in a single
      shopping trip. Add one, wear it for a month, learn how it behaves on your
      skin in different weather. Then add the next. A fragrance wardrobe built
      over a year will serve you better than one built in a weekend.</p>
    `,
  },
];

export const getArticleBySlug = (slug) =>
  ARTICLES.find((a) => a.slug === slug || a.id === slug) || null;

export const getArticlesByCategory = (cat) =>
  cat === "all" ? ARTICLES : ARTICLES.filter((a) => a.category === cat);

export const getFeaturedArticle = () =>
  ARTICLES.find((a) => a.featured) || ARTICLES[0];

export const getRelatedArticles = (article, limit = 3) => {
  if (!article) return [];
  return ARTICLES.filter((a) => a.id !== article.id)
    .sort((a, b) => {
      const aMatch = a.category === article.category ? 2 : 0;
      const bMatch = b.category === article.category ? 2 : 0;
      const aTag = a.tags?.some((t) => article.tags?.includes(t)) ? 1 : 0;
      const bTag = b.tags?.some((t) => article.tags?.includes(t)) ? 1 : 0;
      return bMatch + bTag - (aMatch + aTag);
    })
    .slice(0, limit);
};

export const formatArticleDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};
