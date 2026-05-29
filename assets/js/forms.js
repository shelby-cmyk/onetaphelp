/**
 * OneTapHelp — Form submission handler
 *
 * Routes the contact form and exit-intent form to your CRM/endpoint.
 * UTM/attribution hidden fields are already stamped onto every form by
 * tracking.js, so they ride along in the payload automatically.
 *
 * CONFIGURE THESE THREE CONSTANTS with your real endpoint:
 *   CRM_ENDPOINT — the URL to POST leads to
 *   CRM_FORMAT   — 'json' (application/json) or 'form' (urlencoded)
 *   CRM_HEADERS  — any extra headers, e.g. { 'Authorization': 'Bearer ...' }
 *
 * Until CRM_ENDPOINT is set, submissions are logged to the console
 * (dev mode) and the success UI still shows, so the form is testable.
 */
(function () {
  'use strict';

  // ============================================================
  // CRM ENDPOINT CONFIG — replace before launch
  // ============================================================
  var CRM_ENDPOINT = '';            // e.g. 'https://api.yourcrm.com/leads'
  var CRM_FORMAT = 'json';          // 'json' | 'form'
  var CRM_HEADERS = {};             // e.g. { 'Authorization': 'Bearer abc123' }

  // ============================================================
  // Serialize a form into a plain object
  // ============================================================
  function serialize(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      // Checkboxes: store boolean
      var el = form.elements[key];
      if (el && el.type === 'checkbox') {
        data[key] = el.checked;
      } else {
        data[key] = value;
      }
    });
    data.submitted_at = new Date().toISOString();
    data.page = window.location.pathname;
    return data;
  }

  // ============================================================
  // POST a lead payload to the CRM endpoint
  // Returns a Promise. Exposed for reuse (e.g. exit-intent form).
  // ============================================================
  function submitLead(payload) {
    // Dev mode: no endpoint configured yet
    if (!CRM_ENDPOINT) {
      if (window.console) console.log('[OTH lead — dev mode, no CRM endpoint]', payload);
      return Promise.resolve({ ok: true, dev: true });
    }

    var opts = {
      method: 'POST',
      headers: Object.assign({}, CRM_HEADERS)
    };

    if (CRM_FORMAT === 'form') {
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      opts.body = Object.keys(payload)
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(payload[k]); })
        .join('&');
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(payload);
    }

    return fetch(CRM_ENDPOINT, opts).then(function (res) {
      if (!res.ok) throw new Error('Submit failed: ' + res.status);
      return { ok: true };
    });
  }
  window.OTH_SUBMIT_LEAD = submitLead;

  // ============================================================
  // Wire the main contact form
  // ============================================================
  function bindContactForm() {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var originalLabel = btn ? btn.textContent : '';
      if (btn) {
        btn.disabled = true;
        btn.dataset.loading = 'true';
        btn.textContent = 'Sending…';
      }

      var payload = serialize(form);

      submitLead(payload).then(function () {
        // Notify analytics layer
        if (window.dataLayer) {
          window.dataLayer.push({ event: 'lead_submit', form: 'contact', page: window.location.pathname });
        }
        // Replace form with a thank-you message
        form.innerHTML =
          '<div class="form-success" role="status">' +
          '  <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true" style="fill: var(--green-trust); margin-bottom: 12px;"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' +
          '  <h2 style="margin: 0 0 8px;">Thank you — we’ve got it.</h2>' +
          '  <p style="color: var(--slate-soft); margin: 0;">A real person will reach out within one business day. If you’d like help sooner, just call <strong><span data-phone-display>1-800-TAP-HELP</span></strong>.</p>' +
          '</div>';
      }).catch(function () {
        if (btn) {
          btn.disabled = false;
          btn.dataset.loading = 'false';
          btn.textContent = originalLabel;
        }
        var err = form.querySelector('.form-error');
        if (!err) {
          err = document.createElement('p');
          err.className = 'form-error';
          err.setAttribute('role', 'alert');
          err.style.cssText = 'color: #C0392B; font-weight: 600; margin-top: 12px;';
          (btn ? btn.parentNode : form).insertBefore(err, btn ? btn.nextSibling : null);
        }
        err.textContent = 'Something went wrong sending your message. Please try again, or call 1-800-TAP-HELP.';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindContactForm);
  } else {
    bindContactForm();
  }
})();
