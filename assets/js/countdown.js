(function() {
  // Mother's Day 2026 = Sunday, May 10, end of day Mountain Time.
  // After it expires, banner falls back to evergreen offer instead of showing zeros.
  const TARGET = new Date('2026-05-10T23:59:59-06:00').getTime();
  const banner = document.querySelector('.promo-banner');
  if (!banner) return;

  const countdownEl = banner.querySelector('.countdown');
  const headlineEl = banner.querySelector('span:first-of-type');
  const elD = document.getElementById('cd-d');
  const elH = document.getElementById('cd-h');
  const elM = document.getElementById('cd-m');
  const elS = document.getElementById('cd-s');

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function showEvergreen() {
    if (countdownEl) countdownEl.style.display = 'none';
    if (headlineEl) {
      headlineEl.innerHTML = '🎁 <strong>LIMITED-TIME OFFER</strong> — First Month FREE on annual plans';
    }
  }

  function tick() {
    const now = Date.now();
    const diff = TARGET - now;

    if (diff <= 0) {
      showEvergreen();
      return false;
    }

    let remain = diff;
    const d = Math.floor(remain / 86400000); remain -= d * 86400000;
    const h = Math.floor(remain / 3600000); remain -= h * 3600000;
    const m = Math.floor(remain / 60000); remain -= m * 60000;
    const s = Math.floor(remain / 1000);
    if (elD) elD.textContent = pad(d);
    if (elH) elH.textContent = pad(h);
    if (elM) elM.textContent = pad(m);
    if (elS) elS.textContent = pad(s);
    return true;
  }

  if (tick()) {
    const interval = setInterval(function() {
      if (!tick()) clearInterval(interval);
    }, 1000);
  }
})();
