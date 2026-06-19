/**
 * XTREME FITNESS — script.js
 * Author: Senior Frontend Engineer
 * Clean, modular vanilla JS. No libraries. No frameworks.
 */

'use strict';

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

/**
 * Throttle a function to run at most once per animation frame
 * @param {Function} fn
 * @returns {Function}
 */
function throttleRAF(fn) {
  let rafId = null;
  return function(...args) {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args);
      rafId = null;
    });
  };
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Clamp a value between min and max
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/* ============================================================
   1. HEADER — Scroll behavior & active link tracking
   ============================================================ */
const Header = (() => {
  const header = document.getElementById('site-header');
  if (!header) return;

  let lastScroll = 0;

  function onScroll() {
    const scrollY = window.scrollY;

    // Add scrolled class after 60px
    if (scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = scrollY;
  }

  // Active nav link highlighting based on scroll position
  function updateActiveLink() {
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const scrollPos = window.scrollY + 120;

    let currentId = '';

    sections.forEach(section => {
      if (section.offsetTop <= scrollPos) {
        currentId = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }

  const throttledScroll = throttleRAF(() => {
    onScroll();
    updateActiveLink();
  });

  window.addEventListener('scroll', throttledScroll, { passive: true });
  onScroll(); // Run on init
})();

/* ============================================================
   2. MOBILE NAVIGATION
   ============================================================ */
const MobileNav = (() => {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  const overlay   = document.getElementById('nav-overlay');

  if (!hamburger || !navLinks || !overlay) return;

  let isOpen = false;

  function openNav() {
    isOpen = true;
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    navLinks.classList.add('open');
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first link for accessibility
    const firstLink = navLinks.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeNav() {
    isOpen = false;
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  function toggleNav() {
    isOpen ? closeNav() : openNav();
  }

  hamburger.addEventListener('click', toggleNav);
  overlay.addEventListener('click', closeNav);

  // Close on nav link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) closeNav();
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeNav();
  });

  // Close on resize past breakpoint
  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth >= 1024 && isOpen) closeNav();
  }, 200));
})();

/* ============================================================
   3. SCROLL REVEAL (Intersection Observer)
   ============================================================ */
const ScrollReveal = (() => {
  // Check for reduced motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    // Make all reveal elements visible immediately
    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
      el.classList.add('in-view');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  // Observe all reveal elements (excluding hero — those are CSS-animated)
  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
    const isInHero = el.closest('.hero');
    if (!isInHero) observer.observe(el);
  });
})();

/* ============================================================
   4. ANIMATED COUNTERS
   ============================================================ */
const AnimatedCounters = (() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = document.querySelectorAll('.stat-count[data-target]');

  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = prefersReduced ? 0 : 2000;
    const startTime = performance.now();
    const startVal = 0;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = clamp(elapsed / duration, 0, 1);
      const easedProgress = easeOutCubic(progress);
      const current = Math.round(startVal + (target - startVal) * easedProgress);

      el.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
})();

/* ============================================================
   5. TESTIMONIALS SLIDER
   ============================================================ */
const TestimonialsSlider = (() => {
  const track  = document.getElementById('testimonials-track');
  const dotsEl = document.getElementById('testi-dots');
  const prevBtn = document.getElementById('testi-prev');
  const nextBtn = document.getElementById('testi-next');

  if (!track || !dotsEl) return;

  const cards = Array.from(track.querySelectorAll('.testi-card'));
  if (!cards.length) return;

  let current = 0;
  let autoplayId = null;
  let slidesPerView = 1;

  function getSlidesPerView() {
    const w = window.innerWidth;
    if (w >= 1024) return 3;
    if (w >= 768)  return 2;
    return 1;
  }

  function getTotalSlides() {
    return Math.max(1, cards.length - slidesPerView + 1);
  }

  function updateCardWidth() {
    slidesPerView = getSlidesPerView();
    const gapPx = 24;
    const totalGap = gapPx * (slidesPerView - 1);
    const pct = (100 - (totalGap / track.parentElement.offsetWidth) * 100) / slidesPerView;
    cards.forEach(card => {
      card.style.minWidth = `calc(${pct}% - ${gapPx * (slidesPerView - 1) / slidesPerView}px)`;
    });
  }

  function buildDots() {
    dotsEl.innerHTML = '';
    const total = getTotalSlides();
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'testi-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    }
  }

  function updateDots() {
    const dots = dotsEl.querySelectorAll('.testi-dot');
    dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  function goTo(index) {
    const total = getTotalSlides();
    current = ((index % total) + total) % total;

    const gapPx = 24;
    const cardWidth = cards[0].offsetWidth + gapPx;
    track.style.transform = `translateX(-${current * cardWidth}px)`;

    updateDots();
    resetAutoplay();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    autoplayId = setInterval(next, 5000);
  }

  function resetAutoplay() {
    clearInterval(autoplayId);
    startAutoplay();
  }

  function init() {
    updateCardWidth();
    buildDots();
    goTo(0);
    startAutoplay();
  }

  prevBtn.addEventListener('click', () => { prev(); });
  nextBtn.addEventListener('click', () => { next(); });

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev();
    }
  }, { passive: true });

  // Keyboard navigation within slider
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoplayId));
  track.addEventListener('mouseleave', startAutoplay);

  // Reinit on resize
  window.addEventListener('resize', debounce(() => {
    const newSPV = getSlidesPerView();
    if (newSPV !== slidesPerView) {
      updateCardWidth();
      const total = getTotalSlides();
      if (current >= total) current = total - 1;
      buildDots();
      goTo(current);
    }
  }, 250));

  init();
})();

/* ============================================================
   6. CONTACT FORM VALIDATION
   ============================================================ */
const ContactForm = (() => {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');

  if (!form) return;

  const fields = {
    fname: {
      el: document.getElementById('fname'),
      err: document.getElementById('fname-error'),
      validate: v => v.trim().length >= 2 ? '' : 'Please enter your full name.'
    },
    fphone: {
      el: document.getElementById('fphone'),
      err: document.getElementById('fphone-error'),
      validate: v => /^[0-9\s\+\-\(\)]{7,}$/.test(v.trim()) ? '' : 'Please enter a valid phone number.'
    },
    fgoal: {
      el: document.getElementById('fgoal'),
      err: document.getElementById('fgoal-error'),
      validate: v => v ? '' : 'Please select your primary goal.'
    }
  };

  function validateField(name) {
    const field = fields[name];
    if (!field) return true;
    const msg = field.validate(field.el.value);
    field.err.textContent = msg;
    field.el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  function validateAll() {
    let valid = true;
    Object.keys(fields).forEach(name => {
      if (!validateField(name)) valid = false;
    });
    return valid;
  }

  // Real-time validation on blur
  Object.keys(fields).forEach(name => {
    const { el } = fields[name];
    el.addEventListener('blur', () => validateField(name));
    el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') validateField(name);
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    if (!validateAll()) {
      // Focus first invalid field
      const firstInvalid = Object.values(fields).find(f => f.el.getAttribute('aria-invalid') === 'true');
      if (firstInvalid) firstInvalid.el.focus();
      return;
    }

    // Simulate successful form submission (no backend)
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    setTimeout(() => {
      form.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      success.removeAttribute('hidden');
      success.focus();

      // Hide success message after 5s
      setTimeout(() => {
        success.setAttribute('hidden', '');
      }, 5000);
    }, 1200);
  });
})();

/* ============================================================
   7. SMOOTH SCROLL for anchor links
   ============================================================ */
const SmoothScroll = (() => {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerHeight = document.getElementById('site-header')?.offsetHeight || 72;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    });
  });
})();

/* ============================================================
   8. HERO IMAGE PARALLAX
   ============================================================ */
const HeroParallax = (() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const heroBgImg = document.getElementById('hero-bg-img');
  if (!heroBgImg || !heroBgImg.src) return;

  function onScroll() {
    const scrollY = window.scrollY;
    const heroH = document.querySelector('.hero')?.offsetHeight || window.innerHeight;

    if (scrollY > heroH) return;

    const shift = scrollY * 0.4;
    heroBgImg.style.transform = `scale(1.05) translateY(${shift}px)`;
  }

  window.addEventListener('scroll', throttleRAF(onScroll), { passive: true });
})();

/* ============================================================
   9. FOOTER — current year
   ============================================================ */
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ============================================================
   10. HERO IMAGE FALLBACK
   ============================================================ */
const HeroImageFallback = (() => {
  const img = document.getElementById('hero-bg-img');
  if (!img) return;

  // If src is empty, the gradient provides the fallback automatically via CSS
  // If an image is provided but fails, remove broken image state
  img.addEventListener('error', () => {
    img.style.display = 'none';
  });

  img.addEventListener('load', () => {
    img.style.display = '';
    img.style.opacity = '1';
    // Start subtle parallax scale
    requestAnimationFrame(() => {
      img.style.transform = 'scale(1.05)';
    });
  });
})();

/* ============================================================
   11. MOUSE MOVE — Subtle 3D tilt on Why cards
   ============================================================ */
const TiltEffect = (() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const cards = document.querySelectorAll('.why-card, .plan-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = clamp((centerY - y) / centerY * 4, -4, 4);
      const rotateY = clamp((x - centerX) / centerX * 4, -4, 4);

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      card.style.transition = 'transform 0.1s linear, box-shadow 0.3s, border-color 0.3s';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = '';
    });
  });
})();

/* ============================================================
   12. GALLERY IMAGE PLACEHOLDER — show when no src
   ============================================================ */
(() => {
  document.querySelectorAll('.gallery-img, .program-img, .about-img').forEach(img => {
    if (!img.src || img.src === window.location.href) {
      img.style.display = 'none';
    }
    img.addEventListener('error', () => {
      img.style.display = 'none';
    });
  });
})();

/* ============================================================
   13. PERFORMANCE — Lazy load observer for images
   ============================================================ */
(() => {
  if (!('IntersectionObserver' in window)) return;

  const lazyImgs = document.querySelectorAll('img[loading="lazy"]');

  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
        imgObserver.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  lazyImgs.forEach(img => imgObserver.observe(img));
})();

/* ============================================================
   INIT COMPLETE
   ============================================================ */
document.documentElement.classList.add('js-loaded');
