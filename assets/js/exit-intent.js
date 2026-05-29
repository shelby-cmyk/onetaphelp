(function() {
  if (sessionStorage.getItem('oth_exit_shown')) return;

  const modalHTML = `
    <div class="exit-modal-backdrop" id="exitModal" role="dialog" aria-labelledby="exitModalTitle">
      <div class="exit-modal">
        <button type="button" class="exit-modal-close" aria-label="Close" id="exitModalClose">&times;</button>
        <h2 id="exitModalTitle">Before you go.</h2>
        <p>Have a question we didn't answer? Leave your email and we'll follow up — no calls, no spam, just an honest reply within one business day.</p>
        <form id="exitForm">
          <input type="email" name="email" placeholder="your@email.com" required>
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">Send Me an Answer</button>
          <small>We'll only use your email to reply. Unsubscribe with one click.</small>
        </form>
        <button type="button" class="exit-modal-dismiss" id="exitModalDismiss">No thanks &mdash; close</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('exitModal');
  const close = document.getElementById('exitModalClose');
  const form = document.getElementById('exitForm');

  function show() {
    if (sessionStorage.getItem('oth_exit_shown')) return;
    modal.classList.add('active');
    sessionStorage.setItem('oth_exit_shown', '1');
  }
  function hide() { modal.classList.remove('active'); }

  // Desktop: exit-intent on mouseleave to top of viewport
  document.addEventListener('mouseleave', function(e) {
    if (e.clientY <= 0) show();
  });

  // Mobile: trigger after 30s on page or 50% scroll
  let triggered = false;
  setTimeout(function() {
    if (!triggered && window.innerWidth < 768) { triggered = true; show(); }
  }, 30000);

  window.addEventListener('scroll', function() {
    if (triggered) return;
    const pct = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
    if (pct > 0.65 && window.innerWidth < 768) { triggered = true; show(); }
  }, { passive: true });

  close.addEventListener('click', hide);
  const dismiss = document.getElementById('exitModalDismiss');
  if (dismiss) dismiss.addEventListener('click', hide);
  modal.addEventListener('click', function(e) { if (e.target === modal) hide(); });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = form.querySelector('input[name="email"]').value;
    const payload = {
      email: email,
      lead_source: 'exit-intent',
      submitted_at: new Date().toISOString(),
      page: window.location.pathname
    };
    const done = function () {
      if (window.dataLayer) {
        window.dataLayer.push({ event: 'lead_submit', form: 'exit-intent', page: window.location.pathname });
      }
      form.innerHTML = '<p style="font-weight: 600; color: var(--green-trust); padding: 16px 0;">✓ Got it! Check your inbox.</p>';
      setTimeout(hide, 2500);
    };
    // Route through the shared CRM submit handler if available
    if (typeof window.OTH_SUBMIT_LEAD === 'function') {
      window.OTH_SUBMIT_LEAD(payload).then(done).catch(done);
    } else {
      done();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hide();
  });
})();
