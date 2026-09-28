# Rehmani Scents — Premium Perfume E-Commerce Frontend

A complete, multi-page premium perfume e-commerce storefront built with
**HTML5, CSS3 and vanilla JavaScript (ES modules)**. No frameworks, no build step.

---

## How To Run

1. Open the project folder in **VS Code**.
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions tab.
3. Right-click `index.html` and choose **Open with Live Server**.
4. The site opens at `http://127.0.0.1:5500` (or similar).

The project uses ES modules, so it **must be served over HTTP** — opening the
files directly with `file://` will not work.

---

## Project Structure

rehmani-scents/
├── index.html Home page
├── shop.html Shop All (filters, sort, pagination)
├── men.html / women.html / unisex.html
├── collections.html Curated collections landing
├── product.html Product detail (dynamic via ?id=)
├── search.html Search results (?q=)
├── cart.html Full shopping bag
├── checkout.html Multi-step demo checkout
├── wishlist.html Saved items
├── about.html Brand story
├── contact.html Contact form + details
├── faq.html Searchable FAQ
├── track-order.html Demo order tracker
├── blog.html / article.html Fragrance Journal
├── shipping-policy.html
├── return-policy.html
├── privacy-policy.html
├── terms.html
├── order-confirmation.html
├── 404.html
│
├── css/
│ ├── variables.css Design tokens
│ ├── themes.css Light + dark palettes
│ ├── base.css Reset + typography + [hidden] fix
│ ├── layout.css Containers, grids, sections
│ ├── components.css Buttons, forms, chips, toasts, accordions
│ ├── header.css / footer.css
│ ├── product.css / product-detail.css / product-editorial.css
│ ├── shop.css / category.css / collections-page.css
│ ├── cart.css / cart-page.css / checkout-page.css / confirmation-page.css
│ ├── track-page.css / contact-page.css / faq-page.css
│ ├── blog-page.css / article-page.css
│ ├── about-page.css / policy-page.css / search-page.css / wishlist-page.css
│ ├── error-page.css / pages.css
│ └── responsive.css
│
└── js/
├── config.js Central business settings
├── products.js 15-product demo catalog
├── bundles.js Gift set bundles
├── storage.js Safe localStorage wrapper
├── utils.js DOM, formatting, validation, toasts
├── theme.js Light/dark mode
├── header.js Sticky header + mega menu + mobile nav
├── footer.js Dynamic footer
├── product-card.js Shared product card + grids + quick view
├── cart.js Cart state + drawer + discount codes
├── wishlist.js Wishlist state + shared toggles
├── search.js Search overlay (site-wide)
├── filters.js Shop page filter/sort/pagination engine
├── page-init.js Shared bootstrap for content pages
├── main.js Homepage entry point
├── shop-page.js Shop entry point
├── category-page.js Men / Women / Unisex entry point
├── product-editorial.js PDP entry point
├── cart-page.js Cart entry point
├── checkout-page.js Checkout entry point
├── confirmation-page.js Order confirmation entry point
├── track-page.js Order tracker entry point
├── wishlist-page.js Wishlist entry point
├── search-page.js Search results entry point
├── blog-data.js Article content
├── blog-page.js Blog listing entry point
├── article-page.js Article detail entry point
├── about-page.js
├── contact-page.js
├── faq-page.js
├── collections-page.js
├── error-page.js
└── policy-page.js Shared policy page bootstrap

---

## Implemented Features

### Global

- Light + dark mode with system preference detection and no flash on load
- Sticky header that shrinks on scroll, with mega menu on desktop
- Mobile navigation drawer
- Live cart badge + wishlist badge
- Search overlay with live suggestions, keyboard navigation and `/` shortcut
- Toast notifications for all cart/wishlist actions
- Back-to-top button with scroll trigger
- Image fallback handling for every product image
- Scroll-triggered reveal animations (respects `prefers-reduced-motion`)
- Lucide icons throughout, consistent sizing and alignment
- Fully responsive from 320px upward

### Catalog

- 15 demo perfume products with complete data
- 4 gift set bundles
- Centralized product data (single source of truth)

### Homepage

- Hero slider with auto-advance, arrows, dots and pause-on-hover
- Brand benefits strip
- Shop-by-collection tiles
- Best sellers + new arrivals grids
- Brand story section
- Featured Vayron spotlight
- Interactive fragrance finder
- Promotional banner
- Testimonial carousel
- Instagram gallery
- Newsletter form with validation

### Shop

- Category, price, family, occasion, season, volume and availability filters
- Facet counts on each filter option
- Six sort modes
- Pagination with smart ellipsis
- Active filter chips with individual remove
- Mobile filter drawer
- Empty state when no products match
- URL-driven state — shareable, refreshable, back/forward works

### Product Detail

- Editorial layout with numbered chapters
- Sticky gallery with thumbnail rail and image counter
- Size selector, quantity stepper, real-time price updates
- Add to Bag and Buy Now
- Wishlist toggle with live sync
- Full olfactory pyramid (dark full-bleed chapter)
- "Wear It" section with longevity, season and occasion
- Accordions for details, application, ingredients and shipping
- Demo reviews with star ratings
- Related products rail
- Recently viewed rail
- Sticky mobile buy bar
- Dynamic SEO metadata and JSON-LD structured data

### Cart

- Both a mini drawer and a full cart page
- Quantity steppers in both
- Discount code (REHMANI10 applies 10%)
- Free shipping progress bar
- Persisted to localStorage
- Empty and filled states

### Checkout

- Contact, shipping address (Pakistani cities + provinces) and payment
- Live order summary that mirrors the cart
- Field-level validation with helpful errors
- Pakistani phone number validation
- Three payment methods (COD, Bank Transfer, Online — demo only)
- Order notes carried over from cart
- Order saved to localStorage with a unique reference
- Redirect to confirmation page with the reference

### Order Confirmation + Tracking

- Confirmation page reads `?order=` and displays full order
- Copy-to-clipboard order number
- Direct link to the tracker with pre-filled details
- Tracker shows five-stage progress timeline
- Recent orders list for quick access
- Auto-lookup when URL contains order + phone

### Wishlist

- Persistent across all pages
- Add, remove, move-all-to-bag and clear
- Live count in header
- Empty state

### Blog / Journal

- Six demo articles across five categories
- Featured article + category tabs
- Reading-optimised article template
- Related articles
- Share via copy, X and WhatsApp

### Policies

- Four policy pages sharing one layout
- Auto-generated table of contents from H2 headings
- Active section tracking as you scroll
- Smooth anchor scrolling with header offset

### SEO

- Unique titles and meta descriptions per page
- Open Graph tags
- JSON-LD for Organization, Product, CollectionPage, FAQPage, BlogPosting
- Canonical URLs
- Descriptive alt text throughout

---

## What Requires A Backend

These features are intentionally frontend-only and would need a real backend
to function in production:

1. **Real orders** — orders are stored in localStorage and are not sent anywhere
2. **Payment processing** — no gateway is integrated; the online payment option is illustrative
3. **Authentication** — no user accounts or sessions
4. **Order history across devices** — orders only exist in the browser that placed them
5. **Email delivery** — the newsletter form and contact form do not send emails
6. **Courier / tracking API** — the tracker shows simulated progress
7. **Live inventory** — availability is fixed in the catalog file
8. **Verified reviews** — all reviews are clearly labelled demo content
9. **Server-side validation** — all validation is client-side only

---

## Testing Checklist

- [ ] All 23 pages load without console errors
- [ ] Header sticky behaviour works on every page
- [ ] Mega menu opens on hover (desktop)
- [ ] Mobile navigation drawer slides in and out
- [ ] Theme toggle works and persists across pages
- [ ] No flash of wrong theme on page load
- [ ] Cart badge updates when items are added
- [ ] Wishlist badge updates when items are favourited
- [ ] Search overlay opens with the `/` key
- [ ] Search results page reads `?q=` from URL
- [ ] Shop page filters combine correctly
- [ ] Shop page sort options all work
- [ ] Shop page pagination works
- [ ] Shop page URL reflects filters (shareable)
- [ ] Product page renders for every valid `?id=`
- [ ] Invalid product id shows the not-found state
- [ ] Size selector updates the price
- [ ] Quantity stepper respects min/max
- [ ] Add to Bag opens the drawer
- [ ] Buy Now redirects to checkout
- [ ] Cart persists across page refreshes
- [ ] Discount code REHMANI10 applies 10%
- [ ] Checkout validation catches invalid emails and phones
- [ ] Order submission generates a reference and redirects
- [ ] Confirmation page displays the correct order
- [ ] Track Order finds orders placed in the same browser
- [ ] Wishlist moves items to the cart and removes them
- [ ] FAQ search filters and category tabs work
- [ ] Blog category tabs filter correctly
- [ ] Article page renders for every slug
- [ ] Policies' table of contents tracks active section
- [ ] 404 page shows suggested routes
- [ ] All images have fallbacks for failed loads
- [ ] No horizontal overflow at 320px width
- [ ] Reduced motion preference disables animations
- [ ] Keyboard navigation works (Tab, Enter, Escape)

---

## Customization

- **Brand name, contact, delivery rates:** `js/config.js`
- **Products:** `js/products.js`
- **Bundles:** `js/bundles.js`
- **Blog articles:** `js/blog-data.js`
- **Colors, typography, spacing:** `css/variables.css` and `css/themes.css`
- **Mega menu structure:** `CONFIG.mega` in `js/config.js`
- **Discount codes:** `CONFIG.discounts` in `js/config.js`

---

## License

Demo project. Not for production use without adding a real backend.
