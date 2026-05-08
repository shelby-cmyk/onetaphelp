/**
 * OneTapHelp — Mobile hamburger menu
 *
 * Injects a hamburger button + slide-in drawer on every page.
 * Hamburger only shows on mobile (CSS controls visibility).
 * Drawer includes all primary pages + phone CTA.
 */
(function () {
  'use strict';

  // Don't inject on the senior-direct welcome page (intentionally minimal)
  if (document.body.classList.contains('welcome-body')) return;

  var header = document.querySelector('.site-header .header-inner');
  if (!header) return;

  // Avoid double-injecting
  if (document.querySelector('.mobile-menu-toggle')) return;

  // ============================================================
  // 1. Inject hamburger button into the header (before phone CTA)
  // ============================================================
  var hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'mobile-menu-toggle';
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML =
    '<span class="mobile-menu-bar"></span>' +
    '<span class="mobile-menu-bar"></span>' +
    '<span class="mobile-menu-bar"></span>';

  // Append to the end of nav so hamburger sits at the far right (after phone CTA)
  // — natural thumb position on mobile, visually balances phone icon button.
  var nav = header.querySelector('.header-nav');
  if (nav) {
    nav.appendChild(hamburger);
  } else {
    header.appendChild(hamburger);
  }

  // ============================================================
  // 2. Build the drawer
  // ============================================================
  var drawerHTML =
    '<div class="mobile-drawer-backdrop" id="mobileDrawerBackdrop"></div>' +
    '<aside class="mobile-drawer" id="mobileDrawer" role="dialog" aria-modal="true" aria-labelledby="mobileDrawerTitle">' +
      '<div class="mobile-drawer-header">' +
        '<span id="mobileDrawerTitle" class="mobile-drawer-eyebrow">Menu</span>' +
        '<button type="button" class="mobile-drawer-close" aria-label="Close menu">&times;</button>' +
      '</div>' +
      '<nav class="mobile-drawer-nav" aria-label="Mobile navigation">' +
        '<a href="index.html">Home</a>' +
        '<a href="how-it-works.html">How It Works</a>' +
        '<a href="plans.html">Plans &amp; Pricing</a>' +
        '<a href="quiz.html">Find Your Plan</a>' +
        '<a href="for-families.html">For Families</a>' +
        '<a href="compare.html">Compare</a>' +
        '<a href="resources.html">Resources</a>' +
        '<a href="faq.html">FAQ</a>' +
        '<a href="contact.html">Contact</a>' +
      '</nav>' +
      '<div class="mobile-drawer-cta">' +
        '<a href="tel:18008274357" class="mobile-drawer-phone" data-phone>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1 1 0 0 0-1.02.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.59l2.2-2.2a1 1 0 0 0 .24-1.02A11.36 11.36 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1c0 9.39 7.61 17 17 17a1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1z"/></svg>' +
          '<span>' +
            '<small>Call us today</small>' +
            '<strong><span data-phone-display>1-800-TAP-HELP</span></strong>' +
          '</span>' +
        '</a>' +
      '</div>' +
      '<div class="mobile-drawer-trust">' +
        '<small>CSAA Five Diamond &middot; UL-Listed &middot; 30-Day Money-Back</small>' +
      '</div>' +
    '</aside>';

  document.body.insertAdjacentHTML('beforeend', drawerHTML);

  var drawer = document.getElementById('mobileDrawer');
  var backdrop = document.getElementById('mobileDrawerBackdrop');
  var closeBtn = drawer.querySelector('.mobile-drawer-close');

  // ============================================================
  // 3. Open / close behavior
  // ============================================================
  function open() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    if (drawer.classList.contains('open')) close();
    else open();
  });
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  });

  // Close drawer when a nav link is tapped (single-page-feel)
  drawer.querySelectorAll('.mobile-drawer-nav a').forEach(function (link) {
    link.addEventListener('click', close);
  });

  // Highlight current page in drawer
  var path = window.location.pathname.split('/').pop() || 'index.html';
  drawer.querySelectorAll('.mobile-drawer-nav a').forEach(function (link) {
    if (link.getAttribute('href') === path) {
      link.classList.add('current');
    }
  });
})();
