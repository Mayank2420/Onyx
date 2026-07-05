// ============================================================
// ONYX PC STUDIO — shared front-end behaviour
// ============================================================

// --- Nav: solid background after scrolling past hero ---
const siteNav = document.querySelector('.site-nav');
if (siteNav) {
  const onScroll = () => {
    if (window.scrollY > 60) siteNav.classList.add('is-scrolled');
    else siteNav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// --- Mobile nav toggle ---
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('nav-links--open');
  });
}

// --- Scroll reveal ---
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
    io.observe(el);
  });
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// --- 3D tilt for hero / showcase visuals ---
document.querySelectorAll('[data-tilt]').forEach((card) => {
  const strength = 10;
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateZ(6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0)';
  });
});

// --- Marquee duplicate for seamless loop ---
document.querySelectorAll('[data-marquee]').forEach((track) => {
  track.innerHTML += track.innerHTML;
});
