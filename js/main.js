(function () {
  "use strict";

  // ======= Sticky Header
  window.onscroll = function () {
    const ud_header = document.querySelector(".ud-header");
    if (!ud_header) return;
    
    const sticky = ud_header.offsetTop;
    const logo = document.querySelectorAll(".header-logo");

    if (window.pageYOffset > sticky) {
      ud_header.classList.add("sticky");
    } else {
      ud_header.classList.remove("sticky");
    }

    if(logo.length) {
      // === logo change
      if (ud_header.classList.contains("sticky")) {
        const logoImg = document.querySelector(".header-logo");
        if (logoImg) logoImg.src = "/images/logo/logo.svg";
      } else {
        const logoImg = document.querySelector(".header-logo");
        if (logoImg) logoImg.src = "/images/logo/logo-white.svg";
      }
    }

    if (document.documentElement.classList.contains("dark")) {
      if(logo.length) {
        if (ud_header.classList.contains("sticky")) {
          const logoImg = document.querySelector(".header-logo");
          if (logoImg) logoImg.src = "/images/logo/logo-white.svg";
        } 
      }
    }

    // show or hide the back-to-top button
    const backToTop = document.querySelector(".back-to-top");
    if (backToTop) {
      if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
        backToTop.style.display = "flex";
      } else {
        backToTop.style.display = "none";
      }
    }
  };

  // ===== Mobile Navigation
  const navbarToggler = document.querySelector("#navbarToggler");
  const navbarCollapse = document.querySelector("#navbarCollapse");

  if (navbarToggler && navbarCollapse) {
    navbarToggler.addEventListener("click", () => {
      navbarToggler.classList.toggle("navbarTogglerActive");
      navbarCollapse.classList.toggle("hidden");
    });

    // Close navbar when a link is clicked
    document.querySelectorAll("#navbarCollapse ul li:not(.submenu-item) a")
      .forEach((e) =>
        e.addEventListener("click", () => {
          navbarToggler.classList.remove("navbarTogglerActive");
          navbarCollapse.classList.add("hidden");
        })
      );
  }

  // ===== Sub-menu toggle
  const submenuItems = document.querySelectorAll(".submenu-item");
  submenuItems.forEach((el) => {
    const link = el.querySelector("a");
    const submenu = el.querySelector(".submenu");
    if (link && submenu) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        submenu.classList.toggle("hidden");
      });
    }
  });

  // ===== FAQ Accordion
  const faqs = document.querySelectorAll(".single-faq");
  faqs.forEach((el) => {
    const btn = el.querySelector(".faq-btn");
    const icon = el.querySelector(".icon");
    const content = el.querySelector(".faq-content");
    if (btn && icon && content) {
      btn.addEventListener("click", () => {
        icon.classList.toggle("rotate-180");
        content.classList.toggle("hidden");
      });
    }
  });

  // ===== Mega Menu
  const megaMenuTriggers = document.querySelectorAll('.mega-menu-trigger');
  megaMenuTriggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', () => {
      const megaMenu = trigger.querySelector('.mega-menu');
      if (megaMenu) {
        megaMenu.classList.remove('invisible', 'opacity-0');
        megaMenu.classList.add('visible', 'opacity-100');
      }
    });
    
    trigger.addEventListener('mouseleave', () => {
      const megaMenu = trigger.querySelector('.mega-menu');
      if (megaMenu) {
        megaMenu.classList.add('invisible', 'opacity-0');
        megaMenu.classList.remove('visible', 'opacity-100');
      }
    });
  });

  // ===== Cookie Notice
  const cookieNotice = document.getElementById('cookie-notice');
  const cookieAccept = document.getElementById('cookie-accept');
  const cookieDecline = document.getElementById('cookie-decline');
  
  if (cookieNotice) {
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('cookie-consent');
    if (!cookieChoice) {
      setTimeout(() => {
        cookieNotice.classList.remove('hidden');
      }, 1000);
    }

    if (cookieAccept) {
      cookieAccept.addEventListener('click', () => {
        localStorage.setItem('cookie-consent', 'accepted');
        cookieNotice.classList.add('hidden');
        // Initialize analytics if accepted
        initAnalytics();
      });
    }

    if (cookieDecline) {
      cookieDecline.addEventListener('click', () => {
        localStorage.setItem('cookie-consent', 'declined');
        cookieNotice.classList.add('hidden');
      });
    }
  }

  // Initialize Google Analytics if consent given
  function initAnalytics() {
    const gaId = document.querySelector('meta[name="google-analytics"]')?.content;
    if (gaId && typeof gtag === 'undefined') {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);
      
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', gaId);
    }
  }

  // ===== Scroll to top
  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Social Share functionality
  const shareButtons = document.querySelectorAll('.share-btn');
  shareButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = btn.dataset.platform;
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);
      
      let shareUrl = '';
      switch(platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${title}%20${url}`;
          break;
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    });
  });

  // ===== Contact Form Validation
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      let valid = true;
      const requiredFields = contactForm.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          valid = false;
          field.classList.add('border-red-500');
        } else {
          field.classList.remove('border-red-500');
        }
      });

      const emailField = contactForm.querySelector('input[type="email"]');
      if (emailField && emailField.value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailField.value)) {
          valid = false;
          emailField.classList.add('border-red-500');
        }
      }

      if (!valid) {
        e.preventDefault();
      }
    });
  }

  // ===== Blog search and filter
  const blogSearch = document.getElementById('blog-search');
  const blogFilter = document.getElementById('blog-filter');
  const blogPosts = document.querySelectorAll('.blog-post');

  if (blogSearch) {
    blogSearch.addEventListener('input', filterBlogPosts);
  }

  if (blogFilter) {
    blogFilter.addEventListener('change', filterBlogPosts);
  }

  function filterBlogPosts() {
    const searchTerm = blogSearch?.value.toLowerCase() || '';
    const category = blogFilter?.value || '';

    blogPosts.forEach(post => {
      const title = post.dataset.title?.toLowerCase() || '';
      const postCategory = post.dataset.category || '';
      const excerpt = post.dataset.excerpt?.toLowerCase() || '';

      const matchesSearch = title.includes(searchTerm) || excerpt.includes(searchTerm);
      const matchesCategory = !category || postCategory === category;

      if (matchesSearch && matchesCategory) {
        post.classList.remove('hidden');
      } else {
        post.classList.add('hidden');
      }
    });
  }

  // ===== Modern Scroll Animation Engine =====

  // Scroll-reveal observer for [data-animate] and [data-stagger] elements
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  document.querySelectorAll('[data-animate], [data-stagger]').forEach(el => {
    revealObserver.observe(el);
  });

  // Legacy support for .animate-on-scroll
  const legacyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fadeInUp');
        legacyObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    legacyObserver.observe(el);
  });

  // ===== Counter Animation for Stats =====
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;

    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 2000;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = prefix + current + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target + suffix;
        el.classList.add('stat-number');
      }
    }

    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => {
    counterObserver.observe(el);
  });

  // ===== Parallax on hero decorative elements =====
  const heroSection = document.getElementById('home');
  if (heroSection) {
    const decoElements = heroSection.querySelectorAll('.deco-float, .deco-float-reverse');
    if (decoElements.length) {
      window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        const heroH = heroSection.offsetHeight;
        if (scrollY < heroH) {
          const factor = scrollY / heroH;
          decoElements.forEach((el, i) => {
            const speed = (i % 2 === 0) ? 0.3 : -0.2;
            el.style.transform = `translateY(${scrollY * speed}px)`;
          });
        }
      }, { passive: true });
    }
  }

  // ===== Smooth header background transition on scroll =====
  const mainHeader = document.getElementById('main-header');
  if (mainHeader) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset;
      if (scrollY > 50) {
        mainHeader.style.background = 'rgba(229, 112, 53, 0.98)';
        mainHeader.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
        mainHeader.style.backdropFilter = 'blur(20px)';
      } else {
        mainHeader.style.background = 'rgba(229, 112, 53, 0.95)';
        mainHeader.style.boxShadow = 'none';
        mainHeader.style.backdropFilter = 'blur(10px)';
      }
      lastScroll = scrollY;
    }, { passive: true });
  }

  // ===== Theme Switcher (Dark/Light mode)
  const themeSwitcher = document.getElementById('themeSwitcher');
  if (themeSwitcher) {
    const userTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Initial theme check
    if (userTheme === 'dark' || (!userTheme && systemTheme)) {
      document.documentElement.classList.add('dark');
    }

    themeSwitcher.addEventListener('click', () => {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    });
  }

})();
