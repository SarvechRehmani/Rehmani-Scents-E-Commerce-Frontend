/* ============================================================
   js/faq-page.js
   Searchable, filterable FAQ page with categories and
   accordion sections.
   ============================================================ */

import { initPage } from "./page-init.js";
import { qs, qsa, refreshIcons, escapeHtml, debounce } from "./utils.js";

/* ============================================================
   FAQ DATA
   Each entry has: category, question, answer (may contain HTML).
   ============================================================ */

const FAQ_DATA = [
  /* ---------- Fragrance ---------- */
  {
    category: "fragrance",
    question: "How long do Rehmani Scents fragrances last on skin?",
    answer: `
      <p>Longevity varies by fragrance family and by the person wearing it. As a
      general guide on this demo catalog:</p>
      <ul>
        <li><strong>Fresh and citrus compositions</strong> tend to last 5–7 hours.</li>
        <li><strong>Aromatic and woody fragrances</strong> usually sit in the 6–9 hour range.</li>
        <li><strong>Amber, oud and leather-heavy compositions</strong> can extend to 8–11 hours.</li>
      </ul>
      <p>Skin type, climate and application point all affect wear time. Dry skin tends
      to hold fragrance for less time than oily skin, and hot, humid weather can
      shorten longevity for lighter compositions.</p>
      <p><em>These ranges are illustrative for this demo storefront and are not
      verified performance claims.</em></p>
    `,
  },
  {
    category: "fragrance",
    question: 'What do "top", "heart" and "base" notes mean?',
    answer: `
      <p>Fragrance is composed in three layers that reveal themselves over time:</p>
      <ul>
        <li><strong>Top notes</strong> are the first impression — usually bright,
        citrus, or lightly spiced. They last 15–30 minutes.</li>
        <li><strong>Heart notes</strong> form the character of the fragrance once
        the opening settles. They last several hours and often define the family
        (floral, woody, aromatic).</li>
        <li><strong>Base notes</strong> are what remain on skin and fabric long
        after application — cedar, amber, musk, oud, sandalwood. They hold the
        composition together.</li>
      </ul>
      <p>When you read a fragrance description on this site, the note pyramid shows
      you how that composition unfolds over the course of a wear.</p>
    `,
  },
  {
    category: "fragrance",
    question: "Are these fragrances suitable for both men and women?",
    answer: `
      <p>Every fragrance is technically wearable by anyone — scent has no gender.
      Our catalog uses categories as loose guidance, not restrictions:</p>
      <ul>
        <li><strong>Men</strong> tends to be aromatic, woody, or leather-forward.</li>
        <li><strong>Women</strong> tends to be floral, fruity, or softly ambered.</li>
        <li><strong>Unisex</strong> sits in the middle — often oud, amber, musk, or
        fresh compositions that work across the spectrum.</li>
      </ul>
      <p>If you are drawn to a fragrance, wear it. The category is a starting point,
      not a rule.</p>
    `,
  },
  {
    category: "fragrance",
    question: "Are these real perfumes or demo products?",
    answer: `
      <p>This entire storefront is a <strong>frontend demo</strong>. Every product,
      price, review, note pyramid and performance claim is illustrative content
      created for demonstration purposes.</p>
      <p>No real orders are placed, no payment is processed, and no fragrances are
      shipped. If you are evaluating this storefront as a template, you can replace
      the catalog, images and copy in the product data file.</p>
    `,
  },

  /* ---------- Choosing ---------- */
  {
    category: "choosing",
    question: "How do I choose my first fragrance?",
    answer: `
      <p>Start with the direction, not the name. Ask yourself:</p>
      <ol>
        <li>Do I want something <strong>fresh and clean</strong>, or something
        <strong>warm and deep</strong>?</li>
        <li>Do I want it for <strong>daytime</strong>, <strong>evening</strong>,
        or both?</li>
        <li>Do I prefer a fragrance that <strong>sits close to the skin</strong>,
        or one that projects more noticeably?</li>
      </ol>
      <p>Our <a href="index.html#finder-heading">Fragrance Finder</a> on the
      homepage narrows this down in four clicks. If you want a specific starting
      point, fresh compositions are the safest first buy, while amber and oud
      compositions are the most distinctive.</p>
    `,
  },
  {
    category: "choosing",
    question: "What is the difference between 50ml and 100ml?",
    answer: `
      <p>Only the volume, not the concentration. Both sizes contain the same
      fragrance, filled in different bottle sizes.</p>
      <ul>
        <li>Choose <strong>50ml</strong> if you rotate between several fragrances,
        want to sample a direction before committing, or prefer a smaller bottle
        for travel.</li>
        <li>Choose <strong>100ml</strong> if the fragrance has become a daily
        signature and you know you will use it consistently.</li>
      </ul>
      <p>As a rough guide, 50ml at two sprays a day lasts approximately three to
      four months, and 100ml lasts roughly twice as long.</p>
    `,
  },
  {
    category: "choosing",
    question: "Which fragrance is best for summer or winter?",
    answer: `
      <p>Temperature affects how a fragrance reads on skin:</p>
      <ul>
        <li><strong>Summer and warm weather</strong> — fresh, citrus, aquatic and
        aromatic compositions tend to feel cleaner and less heavy.</li>
        <li><strong>Winter and cooler weather</strong> — amber, oud, leather and
        spicy compositions have room to develop and feel more appropriate.</li>
        <li><strong>Spring and autumn</strong> — floral, woody and soft amber
        fragrances work comfortably across both.</li>
      </ul>
      <p>Each product page on this site lists the recommended season and occasion.</p>
    `,
  },
  {
    category: "choosing",
    question: "Can I wear the same fragrance every day?",
    answer: `
      <p>Absolutely. A signature scent is a fragrance you wear consistently enough
      that people begin to associate it with you. If you find one that works for
      your daily environment, wearing it every day is exactly the point.</p>
      <p>Many people keep two or three in rotation — one for work, one for evenings,
      and one for special occasions. If you want to build a small wardrobe, start
      with a fresh composition, add a woody or amber, and finish with something
      oud-forward for formal wear.</p>
    `,
  },

  /* ---------- Delivery ---------- */
  {
    category: "delivery",
    question: "How long does delivery take within Pakistan?",
    answer: `
      <p>Standard delivery is estimated at 2–4 working days from dispatch,
      depending on the city:</p>
      <ul>
        <li><strong>Karachi, Lahore, Islamabad, Rawalpindi</strong> — usually 2–3 working days.</li>
        <li><strong>Hyderabad, Sukkur, Faisalabad, Multan, Peshawar</strong> — usually 3–4 working days.</li>
        <li><strong>Smaller cities and rural areas</strong> — up to 5 working days.</li>
      </ul>
      <p>These timings are illustrative for this demo storefront. A real storefront
      would confirm timings with a courier partner at the time of dispatch.</p>
    `,
  },
  {
    category: "delivery",
    question: "Is there free delivery?",
    answer: `
      <p>Yes — complimentary delivery applies to qualifying orders above the
      free-shipping threshold shown in your bag. For orders below the threshold,
      a flat standard delivery charge applies. The exact amount is visible in the
      order summary before you check out.</p>
      <p>The free-shipping threshold and rate are configurable business settings
      and can be updated at any time.</p>
    `,
  },
  {
    category: "delivery",
    question: "Do you deliver to all cities in Pakistan?",
    answer: `
      <p>We deliver to major cities including Karachi, Lahore, Islamabad,
      Rawalpindi, Faisalabad, Multan, Hyderabad, Sukkur, Peshawar, Quetta,
      Gujranwala, Sialkot, Bahawalpur and Sargodha.</p>
      <p>For smaller towns and rural areas, delivery is usually available through
      courier partner pickup points. If your address is not in the city dropdown
      at checkout, choose <strong>Other</strong> and add the city name in the area
      field.</p>
    `,
  },
  {
    category: "delivery",
    question: "Can I change my delivery address after ordering?",
    answer: `
      <p>Because this storefront has no backend, orders cannot be modified once
      submitted. In a real store, you would contact support as early as possible
      before dispatch to request an address change.</p>
      <p>If the order has not yet been dispatched, most stores can update the
      address. Once it is with the courier, changes are usually not possible.</p>
    `,
  },

  /* ---------- Payment ---------- */
  {
    category: "payment",
    question: "What payment methods are available?",
    answer: `
      <p>The checkout form supports three payment options:</p>
      <ul>
        <li><strong>Cash on Delivery</strong> — pay in cash when your order arrives.
        Available across all cities we serve.</li>
        <li><strong>Bank Transfer</strong> — demo only on this storefront. In a real
        store, bank details would be shared after order confirmation.</li>
        <li><strong>Online Payment</strong> — demo only. No card details are
        collected, stored or processed on this site.</li>
      </ul>
      <p><em>This demo storefront does not process any real payments.</em></p>
    `,
  },
  {
    category: "payment",
    question: "Is Cash on Delivery available everywhere?",
    answer: `
      <p>Cash on Delivery is available across all cities listed at checkout, with
      no additional fee on this demo storefront. Some real stores charge a small
      COD handling fee — that is a business setting that can be configured.</p>
    `,
  },
  {
    category: "payment",
    question: "Are my payment details safe?",
    answer: `
      <p>On this demo storefront, <strong>no payment details are ever collected</strong>.
      The online payment option is illustrative only and does not open a payment
      gateway or ask for card information.</p>
      <p>In a real store, you would typically be redirected to a PCI-compliant
      payment processor (such as a bank gateway or payment aggregator). The
      storefront itself would never store or see your card details.</p>
    `,
  },
  {
    category: "payment",
    question: "Can I pay in installments?",
    answer: `
      <p>Installment payments are not available on this demo storefront. Some real
      stores offer installments through bank partnerships or buy-now-pay-later
      providers, but that requires a backend integration and cannot be demonstrated
      in a frontend-only build.</p>
    `,
  },

  /* ---------- Orders & Returns ---------- */
  {
    category: "orders",
    question: "How do I track my order?",
    answer: `
      <p>Use the <a href="track-order.html">Order Tracker</a> with your order
      reference and phone number. Your order reference appears on the confirmation
      page after checkout and follows the format <strong>RS-YYMMDD-XXXX</strong>.</p>
      <p>The tracker reads orders saved in your browser's local storage and shows
      a five-stage demo timeline: Order Placed, Processing, Dispatched, Out for
      Delivery and Delivered. It is not connected to any courier service.</p>
    `,
  },
  {
    category: "orders",
    question: "What is your return and exchange policy?",
    answer: `
      <p>Unopened, sealed items can be exchanged within <strong>7 days</strong> of
      delivery. To be eligible:</p>
      <ul>
        <li>The bottle must be unopened with the seal intact.</li>
        <li>The original packaging and receipt must be included.</li>
        <li>The item must not have been damaged by the customer.</li>
      </ul>
      <p>Opened fragrances cannot be returned for hygiene and safety reasons.
      Full details are in our <a href="return-policy.html">Return &amp; Exchange
      Policy</a>.</p>
    `,
  },
  {
    category: "orders",
    question: "What if my order arrives damaged?",
    answer: `
      <p>If your order arrives damaged, contact support within 48 hours of
      delivery with your order reference and a photo of the item. In a real store,
      a damaged item would be replaced or refunded at no additional cost.</p>
      <p>On this demo storefront, submissions are stored only in your browser.
      See the <a href="contact.html">Contact page</a> for how to reach us.</p>
    `,
  },
  {
    category: "orders",
    question: "Can I cancel my order after placing it?",
    answer: `
      <p>Because this is a frontend-only demo, orders cannot be cancelled once
      submitted. In a real store, cancellation is usually possible before the
      order is dispatched. After dispatch, cancellation is not possible and the
      order would go through the standard return process.</p>
    `,
  },
  {
    category: "orders",
    question: "Do I need an account to place an order?",
    answer: `
      <p>No. Checkout on this storefront works as a guest — you provide your name,
      email, phone and address during checkout, and the order is saved to your
      browser. There is no account system in this demo.</p>
      <p>In a real store, guest checkout is often offered alongside accounts.
      Accounts allow order history, saved addresses and faster repeat checkout,
      but they are not required.</p>
    `,
  },
];

/* ============================================================
   STATE
   ============================================================ */

let activeCategory = "all";
let searchTerm = "";

/* ============================================================
   SEARCH / FILTER LOGIC
   ============================================================ */

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .trim();

const matchesSearch = (faq, term) => {
  if (!term) return true;
  const hay = normalize(
    faq.question + " " + faq.answer.replace(/<[^>]*>/g, " "),
  );
  return term.split(/\s+/).every((word) => hay.includes(word));
};

const matchesCategory = (faq, cat) => cat === "all" || faq.category === cat;

const getFiltered = () => {
  const term = normalize(searchTerm);
  return FAQ_DATA.filter(
    (f) => matchesCategory(f, activeCategory) && matchesSearch(f, term),
  );
};

/* ============================================================
   RENDER: FAQ ACCORDIONS
   ============================================================ */

const renderSections = () => {
  const host = qs("[data-faq-sections]");
  const empty = qs("[data-faq-empty]");
  const meta = qs("[data-faq-meta]");
  const visibleCount = qs("[data-faq-visible-count]");
  const totalCount = qs("[data-faq-total-count]");
  const status = qs("[data-faq-search-status]");

  if (!host) return;

  const filtered = getFiltered();

  // Update meta
  if (meta)
    meta.hidden =
      filtered.length === FAQ_DATA.length &&
      activeCategory === "all" &&
      !searchTerm;
  if (visibleCount) visibleCount.textContent = String(filtered.length);
  if (totalCount) totalCount.textContent = String(FAQ_DATA.length);

  // Update search status
  if (status) {
    if (searchTerm || activeCategory !== "all") {
      const parts = [];
      if (searchTerm) parts.push(`"${searchTerm}"`);
      if (activeCategory !== "all") {
        const cat =
          activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
        parts.push(`in ${cat}`);
      }
      status.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"} ${parts.join(" ")}`;
    } else {
      status.textContent = "";
    }
  }

  // Empty state
  if (!filtered.length) {
    host.innerHTML = "";
    if (empty) empty.hidden = false;
    refreshIcons(empty);
    return;
  }

  if (empty) empty.hidden = true;

  // Group by category
  const grouped = filtered.reduce((acc, faq) => {
    (acc[faq.category] = acc[faq.category] || []).push(faq);
    return acc;
  }, {});

  const CATEGORY_LABELS = {
    fragrance: "Fragrance & Notes",
    choosing: "Choosing A Fragrance",
    delivery: "Delivery",
    payment: "Payment",
    orders: "Orders & Returns",
  };

  const CATEGORY_DESCRIPTIONS = {
    fragrance: "Longevity, note pyramids and how our compositions work.",
    choosing: "How to find the right direction for you.",
    delivery: "Timings, coverage and address changes.",
    payment: "Methods, COD and what to expect at checkout.",
    orders: "Tracking, returns, damages and cancellations.",
  };

  const sections = Object.keys(grouped)
    .map((cat) => {
      const items = grouped[cat];
      const label = CATEGORY_LABELS[cat] || cat;
      const desc = CATEGORY_DESCRIPTIONS[cat] || "";

      const itemsHtml = items
        .map(
          (faq, i) => `
      <div class="accordion__item">
        <button class="accordion__trigger"
                type="button"
                aria-expanded="false"
                data-faq-trigger>
          <span class="accordion__label">${escapeHtml(faq.question)}</span>
          <i data-lucide="plus"></i>
        </button>
        <div class="accordion__panel">
          <div class="accordion__inner">
            ${faq.answer}
          </div>
        </div>
      </div>
    `,
        )
        .join("");

      return `
      <section class="faq-group" data-faq-group="${cat}">
        <header class="faq-group__head">
          <h2 class="faq-group__title">${escapeHtml(label)}</h2>
          <p class="faq-group__desc">${escapeHtml(desc)}</p>
          <span class="faq-group__count">${items.length}</span>
        </header>
        <div class="accordion faq-group__accordion">${itemsHtml}</div>
      </section>
    `;
    })
    .join("");

  host.innerHTML = sections;
  refreshIcons(host);
  bindAccordions(host);
};

/* ============================================================
   ACCORDION (single-open within each group)
   ============================================================ */

const bindAccordions = (root) => {
  qsa("[data-faq-trigger]", root).forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      const panel = trigger.nextElementSibling;
      const group = trigger.closest(".faq-group");
      if (!panel) return;

      // Close others in the same group
      qsa("[data-faq-trigger]", group).forEach((t) => {
        if (t !== trigger && t.getAttribute("aria-expanded") === "true") {
          t.setAttribute("aria-expanded", "false");
          const p = t.nextElementSibling;
          if (p) p.style.height = "0px";
        }
      });

      if (expanded) {
        panel.style.height = panel.scrollHeight + "px";
        requestAnimationFrame(() => {
          panel.style.height = "0px";
        });
        trigger.setAttribute("aria-expanded", "false");
      } else {
        panel.style.height = panel.scrollHeight + "px";
        trigger.setAttribute("aria-expanded", "true");
        setTimeout(() => {
          if (trigger.getAttribute("aria-expanded") === "true") {
            panel.style.height = "auto";
          }
        }, 340);
      }
    });
  });
};

/* ============================================================
   CATEGORY TABS
   ============================================================ */

const initTabs = () => {
  const tabs = qsa("[data-faq-cat]");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeCategory = tab.dataset.faqCat;
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      renderSections();
    });
  });
};

/* ============================================================
   SEARCH
   ============================================================ */

const initSearch = () => {
  const input = qs("[data-faq-search]");
  const clearBtn = qs("[data-faq-search-clear]");
  if (!input) return;

  const update = debounce(() => {
    searchTerm = input.value;
    if (clearBtn) clearBtn.hidden = !searchTerm;
    renderSections();
  }, 200);

  input.addEventListener("input", update);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      searchTerm = "";
      if (clearBtn) clearBtn.hidden = true;
      renderSections();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      searchTerm = "";
      clearBtn.hidden = true;
      renderSections();
      input.focus();
    });
  }
};

/* ============================================================
   RESET
   ============================================================ */

const initReset = () => {
  qsa("[data-faq-reset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = qs("[data-faq-search]");
      const clearBtn = qs("[data-faq-search-clear]");
      if (input) input.value = "";
      if (clearBtn) clearBtn.hidden = true;
      searchTerm = "";
      activeCategory = "all";

      qsa("[data-faq-cat]").forEach((t) => {
        const active = t.dataset.faqCat === "all";
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });

      renderSections();
    });
  });
};

/* ============================================================
   BOOT
   ============================================================ */

initPage({
  accordions: false,
  counters: false,

  afterReady: () => {
    initTabs();
    initSearch();
    initReset();
    renderSections();
  },
});
