/* ============================================================
   js/footer.js
   Renders the shared footer. Year and links are dynamic.
   ============================================================ */

import { CONFIG } from "./config.js";
import { qs, refreshIcons } from "./utils.js";

const currentYear = () => new Date().getFullYear();

export const renderFooter = () => {
  const host = qs("#site-footer");
  if (!host) return;

  const { brand, contact, social } = CONFIG;

  host.innerHTML = `
    <footer class="site-footer" aria-label="Site footer">
      <div class="footer__top">
        <div class="container">
          <div class="footer__grid">

            <div class="footer__brand">
              <a class="footer__wordmark" href="index.html" aria-label="${brand.name} home">
                <span class="brand__name">Rehmani Scents</span>
                <span class="brand__sub">Premium Fragrances</span>
              </a>
              <p class="footer__desc">
                A house built on composed, layered fragrances for people who treat scent
                as a form of self-expression. Blended for depth, worn for presence.
              </p>
              <div class="footer__social">
                ${social.instagram ? `<a href="${social.instagram}" aria-label="Instagram" target="_blank" rel="noopener"><i data-lucide="instagram"></i></a>` : ""}
                ${social.facebook ? `<a href="${social.facebook}"  aria-label="Facebook"  target="_blank" rel="noopener"><i data-lucide="facebook"></i></a>` : ""}
                <a href="mailto:${contact.email}" aria-label="Email"><i data-lucide="mail"></i></a>
              </div>
            </div>

            <div>
              <h3 class="footer__col-title">Shop</h3>
              <ul class="footer__links">
                <li><a href="shop.html">Shop All</a></li>
                <li><a href="men.html">Men</a></li>
                <li><a href="women.html">Women</a></li>
                <li><a href="unisex.html">Unisex</a></li>
                <li><a href="collections.html">Collections</a></li>
              </ul>
            </div>

            <div>
              <h3 class="footer__col-title">Customer Support</h3>
              <ul class="footer__links">
                <li><a href="contact.html">Contact Us</a></li>
                <li><a href="faq.html">FAQs</a></li>
                <li><a href="track-order.html">Track Order</a></li>
                <li><a href="shipping-policy.html">Shipping Policy</a></li>
                <li><a href="return-policy.html">Returns &amp; Exchanges</a></li>
              </ul>
            </div>

            <div>
              <h3 class="footer__col-title">Information</h3>
              <ul class="footer__links">
                <li><a href="about.html">About Us</a></li>
                <li><a href="blog.html">Fragrance Journal</a></li>
                <li><a href="privacy-policy.html">Privacy Policy</a></li>
                <li><a href="terms.html">Terms &amp; Conditions</a></li>
              </ul>

              <ul class="footer__contact" style="margin-top:1.4rem">
                <li><i data-lucide="mail"></i><a href="mailto:${contact.email}">${contact.email}</a></li>
                <li><i data-lucide="phone"></i><a href="tel:${contact.phoneRaw}">${contact.phone}</a></li>
                <li><i data-lucide="map-pin"></i><span>${contact.location}</span></li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      <div class="container">
        <div class="footer__bottom">
          <p>&copy; ${currentYear()} ${brand.name}. All rights reserved.</p>

          <ul class="footer__legal">
            <li><a href="privacy-policy.html">Privacy</a></li>
            <li><a href="terms.html">Terms</a></li>
            <li><a href="shipping-policy.html">Shipping</a></li>
            <li><a href="return-policy.html">Returns</a></li>
          </ul>

          <div class="footer__pay">
            <span>Cash on Delivery</span>
            <span>Bank Transfer</span>
            <span>Online Payment</span>
          </div>

          <p class="footer__demo-note">
            Demo storefront for demonstration purposes only. Payment methods shown are illustrative
            and no real transactions are processed. Contact details are placeholders.
          </p>
        </div>
      </div>
    </footer>
  `;

  refreshIcons(host);
  window.dispatchEvent(new CustomEvent("rs:footer-rendered"));
};
