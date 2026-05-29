/**
 * OneTapHelp — UTM tracking + dynamic number insertion
 *
 * Reads UTM params from URL, persists them in sessionStorage, and:
 *   1. Swaps phone numbers based on traffic source (CallRail-style attribution)
 *   2. Stamps every form submit with the source data
 *   3. Fires lightweight events on phone clicks, quiz starts, form submits
 *
 * Data fans out to:
 *   - sessionStorage (oth_utm, oth_first_touch)
 *   - hidden form fields (utm_source, utm_medium, utm_campaign, etc.)
 *   - window.dataLayer (GA4 / GTM compatible)
 *   - tel: link tracking
 *
 * NUMBER MAP — replace placeholders with real CallRail/Twilio numbers when wired.
 */

(function () {
  'use strict';

  // ============================================================
  // GOOGLE TAG MANAGER — consent-gated loader
  // Replace GTM-XXXXXXX with your real container ID. GTM is only
  // injected after the visitor grants analytics or marketing consent
  // through the cookie banner, so nothing loads until opt-in.
  // Configure GA4 / Meta Pixel / TikTok Pixel as tags inside GTM and
  // trigger them on the "oth_consent_granted" dataLayer event.
  // ============================================================
  var GTM_ID = 'GTM-XXXXXXX';
  var gtmInjected = false;

  function injectGTM() {
    if (gtmInjected || !GTM_ID || GTM_ID === 'GTM-XXXXXXX') return;
    gtmInjected = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = document.getElementsByTagName('script')[0];
    var j = document.createElement('script');
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    f.parentNode.insertBefore(j, f);
  }

  // Inject GTM if consent is already on file (returning visitor), and
  // whenever consent changes to granted. Pushes a clean trigger event.
  function maybeLoadGTM() {
    var ok = typeof window.OTH_HAS_CONSENT === 'function'
      ? (window.OTH_HAS_CONSENT('analytics') || window.OTH_HAS_CONSENT('marketing'))
      : false;
    if (ok) {
      injectGTM();
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'oth_consent_granted',
        analytics_consent: window.OTH_HAS_CONSENT('analytics'),
        marketing_consent: window.OTH_HAS_CONSENT('marketing')
      });
    }
  }

  document.addEventListener('oth:consent-change', function (e) {
    var c = e.detail || {};
    if (c.analytics || c.marketing) maybeLoadGTM();
  });

  // ============================================================
  // PHONE NUMBER MAP — source → display number
  // Replace these with real source-specific numbers from CallRail/Twilio.
  // Format: { display: '1-800-XXX-XXXX', tel: '18005551234' }
  // ============================================================
  var PHONE_MAP = {
    email:    { display: '1-800-555-1001', tel: '18005551001' },
    sms:      { display: '1-800-555-1002', tel: '18005551002' },
    mail:     { display: '1-800-555-1003', tel: '18005551003' },
    ctv:      { display: '1-800-555-1004', tel: '18005551004' },
    outbound: { display: '1-800-555-1005', tel: '18005551005' },
    paid:     { display: '1-800-555-1006', tel: '18005551006' },
    default:  { display: '1-800-TAP-HELP', tel: '18008274357' }
  };

  var UTM_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign',
    'utm_term', 'utm_content', 'gclid', 'fbclid'
  ];

  var STORAGE_UTM = 'oth_utm';
  var STORAGE_FIRST_TOUCH = 'oth_first_touch';
  var STORAGE_SESSION_TOUCH = 'oth_session_touch';

  // ============================================================
  // 1. Capture UTM params from URL
  // ============================================================
  function captureUTM() {
    var url = new URL(window.location.href);
    var params = url.searchParams;
    var current = {};
    var hasAnyParam = false;

    UTM_KEYS.forEach(function (key) {
      var val = params.get(key);
      if (val) {
        current[key] = val;
        hasAnyParam = true;
      }
    });

    if (!hasAnyParam) return null;

    current.landing_page = url.pathname;
    current.captured_at = new Date().toISOString();
    current.referrer = document.referrer || '(direct)';

    // Persist current touch in sessionStorage (overwrites with latest source)
    try {
      sessionStorage.setItem(STORAGE_SESSION_TOUCH, JSON.stringify(current));
    } catch (e) {}

    // Persist first-touch in localStorage (only set once per browser)
    try {
      if (!localStorage.getItem(STORAGE_FIRST_TOUCH)) {
        localStorage.setItem(STORAGE_FIRST_TOUCH, JSON.stringify(current));
      }
    } catch (e) {}

    // Persist combined UTM data for forms
    try {
      sessionStorage.setItem(STORAGE_UTM, JSON.stringify(current));
    } catch (e) {}

    return current;
  }

  function getStoredUTM() {
    try {
      var stored = sessionStorage.getItem(STORAGE_UTM);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  // ============================================================
  // 2. Swap phone numbers based on UTM source
  // ============================================================
  function swapPhoneNumbers() {
    var utm = getStoredUTM();
    var sourceKey = 'default';

    if (utm && utm.utm_source) {
      var src = utm.utm_source.toLowerCase();
      if (PHONE_MAP[src]) sourceKey = src;
      else if (utm.utm_medium === 'cpc' || utm.utm_medium === 'paid') sourceKey = 'paid';
    }

    var phone = PHONE_MAP[sourceKey];
    if (!phone) return;

    // Swap all displayed numbers
    document.querySelectorAll('[data-phone-display]').forEach(function (el) {
      el.textContent = phone.display;
    });

    // Swap all tel: hrefs on elements with [data-phone] or known phone classes
    var phoneSelectors = '[data-phone], a[href^="tel:"]';
    document.querySelectorAll(phoneSelectors).forEach(function (el) {
      if (el.tagName === 'A') {
        el.setAttribute('href', 'tel:' + phone.tel);
        // If the anchor's text content is a phone number, replace it
        if (/^[\d\-\s\(\)\+]+$/.test(el.textContent.trim())) {
          el.textContent = phone.display;
        }
      }
    });

    // Also expose for downstream use
    window.OTH_ACTIVE_PHONE = phone;
    window.OTH_SOURCE_KEY = sourceKey;
  }

  // ============================================================
  // 3. Track key events to dataLayer (GA4/GTM compatible)
  // ============================================================
  function pushEvent(name, payload) {
    // Gate non-essential analytics events on consent
    var isEssential = name === 'phone_click' || name === 'form_submit';
    var hasAnalytics = typeof window.OTH_HAS_CONSENT === 'function'
      ? window.OTH_HAS_CONSENT('analytics')
      : true; // pre-consent-banner installed: behave permissively but log
    if (!isEssential && !hasAnalytics) {
      // Buffer the event so when consent is granted, we can flush it
      window.OTH_PENDING_EVENTS = window.OTH_PENDING_EVENTS || [];
      window.OTH_PENDING_EVENTS.push({ name: name, payload: payload, ts: Date.now() });
      return;
    }
    window.dataLayer = window.dataLayer || [];
    var event = Object.assign({ event: name, timestamp: Date.now() }, payload || {});
    window.dataLayer.push(event);
    if (window.location.hostname === 'localhost') {
      console.log('[OTH track]', event);
    }
  }

  // When user grants consent later, flush any buffered events
  document.addEventListener('oth:consent-change', function (e) {
    var c = e.detail || {};
    if (c.analytics && Array.isArray(window.OTH_PENDING_EVENTS)) {
      window.OTH_PENDING_EVENTS.forEach(function (evt) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(Object.assign({ event: evt.name, timestamp: evt.ts, replayed: true }, evt.payload));
      });
      window.OTH_PENDING_EVENTS = [];
    }
  });

  function bindTracking() {
    // Phone click tracking
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="tel:"]');
      if (link) {
        var utm = getStoredUTM() || {};
        pushEvent('phone_click', {
          phone_number: link.getAttribute('href').replace('tel:', ''),
          source: utm.utm_source || 'direct',
          medium: utm.utm_medium || 'none',
          campaign: utm.utm_campaign || 'none',
          page: window.location.pathname
        });
      }

      var quizBtn = e.target.closest('a[href*="quiz.html"], button.quiz-option');
      if (quizBtn) {
        pushEvent('quiz_interaction', {
          target: quizBtn.tagName,
          page: window.location.pathname
        });
      }
    });

    // Form submit tracking + stamp UTMs into hidden fields
    document.querySelectorAll('form').forEach(function (form) {
      // Inject hidden UTM fields
      var utm = getStoredUTM();
      var firstTouch = (function () {
        try { return JSON.parse(localStorage.getItem(STORAGE_FIRST_TOUCH) || 'null'); }
        catch (e) { return null; }
      })();

      var inject = Object.assign({}, firstTouch || {}, utm || {});
      Object.keys(inject).forEach(function (key) {
        if (form.querySelector('input[name="' + key + '"]')) return;
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = inject[key];
        form.appendChild(input);
      });

      form.addEventListener('submit', function () {
        pushEvent('form_submit', {
          form_id: form.id || form.action || 'unknown',
          source: (utm && utm.utm_source) || 'direct',
          campaign: (utm && utm.utm_campaign) || 'none'
        });
      });
    });

    // Page-load event with full attribution context
    var utm = getStoredUTM();
    pushEvent('page_view', {
      page: window.location.pathname,
      source: (utm && utm.utm_source) || 'direct',
      medium: (utm && utm.utm_medium) || 'none',
      campaign: (utm && utm.utm_campaign) || 'none',
      phone_shown: (window.OTH_ACTIVE_PHONE || {}).display || PHONE_MAP.default.display
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    captureUTM();
    swapPhoneNumbers();
    bindTracking();
    maybeLoadGTM();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
