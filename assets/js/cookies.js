/**
 * OneTapHelp — Cookie consent (MHMDA / CCPA / GDPR-aware)
 *
 * - First visit: shows bottom banner
 * - Three actions: Reject All / Customize / Accept All
 * - Persists choice in localStorage
 * - Respects "Do Not Track" browser header (auto-reject)
 * - Exposes window.OTH_CONSENT and window.OTH_HAS_CONSENT(category)
 * - Other scripts (analytics, marketing pixels) gate on these helpers
 *
 * Categories:
 *   essential — always on, includes UTM capture, dynamic phone, session storage
 *   analytics — GA4, internal pageview events
 *   marketing — Meta Pixel, Google Ads, retargeting
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'oth_cookie_consent';
  var CONSENT_VERSION = '1.0';

  function getStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function save(consent) {
    var record = {
      version: CONSENT_VERSION,
      essential: true,
      analytics: !!consent.analytics,
      marketing: !!consent.marketing,
      timestamp: new Date().toISOString(),
      method: consent.method || 'banner'
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (e) {}
    window.OTH_CONSENT = record;
    document.dispatchEvent(new CustomEvent('oth:consent-change', { detail: record }));
    return record;
  }

  function honorDNT() {
    return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1';
  }

  // Public API
  window.OTH_HAS_CONSENT = function (category) {
    var c = window.OTH_CONSENT || getStored();
    if (!c) return category === 'essential';
    return !!c[category];
  };
  window.OTH_OPEN_PREFERENCES = openPreferences;

  // ============================================================
  // UI rendering
  // ============================================================
  var BANNER_HTML = '' +
    '<div class="cookie-banner" role="dialog" aria-labelledby="cookieBannerTitle" aria-describedby="cookieBannerBody">' +
    '  <div class="cookie-banner-inner">' +
    '    <div class="cookie-banner-text">' +
    '      <h3 id="cookieBannerTitle">Your privacy.</h3>' +
    '      <p id="cookieBannerBody">' +
    '        We use essential cookies to make this site work. With your permission, we&rsquo;ll also use cookies for analytics and marketing &mdash; never to sell your personal or health information. You can change this any time. ' +
    '        <a href="privacy.html">See our Privacy Policy</a>.' +
    '      </p>' +
    '    </div>' +
    '    <div class="cookie-banner-actions">' +
    '      <button type="button" class="cookie-btn cookie-btn-ghost" data-cookie-action="reject">Reject all</button>' +
    '      <button type="button" class="cookie-btn cookie-btn-ghost" data-cookie-action="customize">Customize</button>' +
    '      <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="accept">Accept all</button>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  var MODAL_HTML = '' +
    '<div class="cookie-modal-backdrop" role="dialog" aria-labelledby="cookieModalTitle">' +
    '  <div class="cookie-modal">' +
    '    <button type="button" class="cookie-modal-close" data-cookie-action="close" aria-label="Close">&times;</button>' +
    '    <h2 id="cookieModalTitle">Cookie preferences.</h2>' +
    '    <p>OneTapHelp uses cookies to operate the site, measure how it&rsquo;s used, and improve our marketing. You control which categories you allow.</p>' +
    '    <div class="cookie-pref">' +
    '      <div class="cookie-pref-head">' +
    '        <strong>Essential <span class="cookie-pref-locked">Always on</span></strong>' +
    '        <span class="cookie-toggle" data-locked="true"><span class="cookie-toggle-knob"></span></span>' +
    '      </div>' +
    '      <p>Required for the site to function: dynamic phone numbers, form submission, and security. These cannot be turned off.</p>' +
    '    </div>' +
    '    <div class="cookie-pref">' +
    '      <div class="cookie-pref-head">' +
    '        <label for="prefAnalytics"><strong>Analytics</strong></label>' +
    '        <input type="checkbox" id="prefAnalytics" class="cookie-toggle-input">' +
    '        <span class="cookie-toggle"><span class="cookie-toggle-knob"></span></span>' +
    '      </div>' +
    '      <p>Helps us understand which pages you find useful and where to improve. Examples: Google Analytics 4.</p>' +
    '    </div>' +
    '    <div class="cookie-pref">' +
    '      <div class="cookie-pref-head">' +
    '        <label for="prefMarketing"><strong>Marketing</strong></label>' +
    '        <input type="checkbox" id="prefMarketing" class="cookie-toggle-input">' +
    '        <span class="cookie-toggle"><span class="cookie-toggle-knob"></span></span>' +
    '      </div>' +
    '      <p>Lets us show you relevant ads on other sites and measure those campaigns. Examples: Meta Pixel, Google Ads.</p>' +
    '    </div>' +
    '    <p class="cookie-mhmda-note">' +
    '      <strong>Health information note:</strong> Information you give us in order to receive medical alert service is treated as protected consumer health data. We never share it with advertisers.' +
    '    </p>' +
    '    <div class="cookie-modal-actions">' +
    '      <button type="button" class="cookie-btn cookie-btn-ghost" data-cookie-action="reject">Reject all</button>' +
    '      <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="save">Save preferences</button>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  function injectUI() {
    var wrap = document.createElement('div');
    wrap.id = 'oth-cookie-ui';
    wrap.innerHTML = BANNER_HTML + MODAL_HTML;
    document.body.appendChild(wrap);
  }

  function showBanner() {
    var b = document.querySelector('.cookie-banner');
    if (b) b.classList.add('visible');
  }
  function hideBanner() {
    var b = document.querySelector('.cookie-banner');
    if (b) b.classList.remove('visible');
  }
  function openPreferences() {
    var m = document.querySelector('.cookie-modal-backdrop');
    if (!m) { injectUI(); m = document.querySelector('.cookie-modal-backdrop'); }
    var current = window.OTH_CONSENT || getStored() || { analytics: false, marketing: false };
    document.getElementById('prefAnalytics').checked = !!current.analytics;
    document.getElementById('prefMarketing').checked = !!current.marketing;
    m.classList.add('visible');
    syncTogglesUI();
  }
  function closePreferences() {
    var m = document.querySelector('.cookie-modal-backdrop');
    if (m) m.classList.remove('visible');
  }

  function syncTogglesUI() {
    document.querySelectorAll('.cookie-pref-head').forEach(function (head) {
      var input = head.querySelector('input[type="checkbox"]');
      var toggle = head.querySelector('.cookie-toggle:not([data-locked])');
      if (input && toggle) {
        toggle.classList.toggle('on', input.checked);
      }
      var locked = head.querySelector('.cookie-toggle[data-locked]');
      if (locked) locked.classList.add('on');
    });
  }

  function bindActions() {
    document.body.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cookie-action]');
      if (t) {
        var action = t.dataset.cookieAction;
        if (action === 'accept') {
          save({ analytics: true, marketing: true, method: 'accept-all' });
          hideBanner(); closePreferences();
        } else if (action === 'reject') {
          save({ analytics: false, marketing: false, method: 'reject-all' });
          hideBanner(); closePreferences();
        } else if (action === 'customize') {
          openPreferences();
        } else if (action === 'save') {
          save({
            analytics: document.getElementById('prefAnalytics').checked,
            marketing: document.getElementById('prefMarketing').checked,
            method: 'customize'
          });
          hideBanner(); closePreferences();
        } else if (action === 'close') {
          closePreferences();
        }
      }

      var prefLink = e.target.closest('[data-open-cookie-prefs]');
      if (prefLink) {
        e.preventDefault();
        openPreferences();
      }

      // "Do Not Sell or Share My Information" link — force marketing off
      var dnsLink = e.target.closest('[data-do-not-sell]');
      if (dnsLink) {
        e.preventDefault();
        var current = window.OTH_CONSENT || getStored() || {};
        save({
          analytics: !!current.analytics, // preserve analytics choice
          marketing: false,                // force marketing OFF
          method: 'do-not-sell'
        });
        var msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;top:24px;right:24px;background:var(--green-trust);color:#fff;padding:14px 18px;border-radius:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:10000;font-size:0.95rem;max-width:320px;';
        msg.textContent = 'Preference saved. We never sell or share consumer health data.';
        document.body.appendChild(msg);
        setTimeout(function () { msg.remove(); }, 4000);
      }
    });

    document.body.addEventListener('change', function (e) {
      if (e.target.classList && e.target.classList.contains('cookie-toggle-input')) {
        syncTogglesUI();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePreferences();
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    injectUI();
    bindActions();

    var stored = getStored();
    if (stored) {
      window.OTH_CONSENT = stored;
      return; // already chose
    }

    if (honorDNT()) {
      // User has Do Not Track enabled — auto-reject non-essential
      save({ analytics: false, marketing: false, method: 'dnt' });
      return;
    }

    showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
