(function() {
  const KEY = 'oth_banner_dismissed';
  const banner = document.querySelector('.promo-banner');
  const close = document.querySelector('.banner-close');
  if (!banner || !close) return;

  // If previously dismissed in this session, hide immediately
  if (sessionStorage.getItem(KEY)) {
    banner.classList.add('dismissed');
    return;
  }

  close.addEventListener('click', function() {
    banner.classList.add('dismissed');
    sessionStorage.setItem(KEY, '1');
  });
})();
