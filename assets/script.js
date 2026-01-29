document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Tab functionality with smooth transitions
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        pane.style.opacity = '0';
      });

      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      const activePane = document.getElementById(tabId);
      if (activePane) {
        activePane.classList.add('active');
        setTimeout(() => {
          activePane.style.opacity = '1';
        }, 50);
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Add parallax effect to hero section
  const hero = document.querySelector('.hero');
  if (hero) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      if (scrolled < 500) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        hero.style.opacity = 1 - scrolled / 600;
      }
    });
  }

  // Add intersection observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe all cards and sections with animation delay for stagger effect
  document.querySelectorAll('.highlight-card, .research-card, .publication-item, .project-card, .edu-item, .contact-card, .timeline-item').forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(el);
  });

  // Add mouse move effect for interactive cards
  document.querySelectorAll('.highlight-card, .research-card, .project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      card.style.transform = `translateY(-8px) scale(1.02) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // Add typing effect to tagline
  const tagline = document.querySelector('.tagline');
  if (tagline && !sessionStorage.getItem('taglineAnimated')) {
    const text = tagline.textContent;
    tagline.textContent = '';
    let i = 0;
    
    const typeWriter = () => {
      if (i < text.length) {
        tagline.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      } else {
        sessionStorage.setItem('taglineAnimated', 'true');
      }
    };
    
    setTimeout(typeWriter, 500);
  }

  // Add click ripple effect for interactive elements
  document.querySelectorAll('.tab-button, .tag, .links a, .btn-download').forEach(element => {
    element.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      this.appendChild(ripple);
      
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add scroll progress indicator
  const createScrollProgress = () => {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      z-index: 9999;
      transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = (scrollTop / scrollHeight) * 100;
      progressBar.style.width = scrollPercent + '%';
    });
  };

  createScrollProgress();

  // Add badge pulse animation for achievement badges
  const badges = document.querySelectorAll('.project-badge, .date-badge, .status-badge');
  badges.forEach(badge => {
    badge.style.animation = 'pulse 2s infinite';
  });
});
