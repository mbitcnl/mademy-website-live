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

  // ===== Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fadeInUp');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

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
