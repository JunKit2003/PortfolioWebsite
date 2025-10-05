// Portfolio Website Modernization Scripts
document.addEventListener('DOMContentLoaded', function() {
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Enhanced hamburger menu with animations
    const hamburger = document.getElementById('hamburger-menu');
    const navLinksContainer = document.getElementById('nav-links');
    const hamburgerSpans = hamburger.querySelectorAll('span');

    hamburger.addEventListener('click', function() {
        navLinksContainer.classList.toggle('open');
        hamburger.classList.toggle('active');
        
        // Animate hamburger to X
        hamburgerSpans.forEach((span, index) => {
            if (index === 0) {
                span.style.transform = navLinksContainer.classList.contains('open') 
                    ? 'rotate(45deg) translate(5px, 5px)' : 'none';
            } else if (index === 1) {
                span.style.opacity = navLinksContainer.classList.contains('open') ? '0' : '1';
            } else if (index === 2) {
                span.style.transform = navLinksContainer.classList.contains('open') 
                    ? 'rotate(-45deg) translate(7px, -6px)' : 'none';
            }
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !navLinksContainer.contains(e.target)) {
            navLinksContainer.classList.remove('open');
            hamburger.classList.remove('active');
            hamburgerSpans.forEach(span => {
                span.style.transform = 'none';
                span.style.opacity = '1';
            });
        }
    });

    // Typing effect for hero section
    const heroTitle = document.querySelector('.hero h1');
    const originalText = heroTitle.textContent;
    heroTitle.textContent = '';
    
    let charIndex = 0;
    const typeWriter = () => {
        if (charIndex < originalText.length) {
            heroTitle.textContent += originalText.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, 100);
        }
    };
    
    // Start typing effect after a short delay
    setTimeout(typeWriter, 500);

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe sections for animation
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.add('fade-in');
        observer.observe(section);
    });

    // Skill logos hover effects
    const skillLogos = document.querySelectorAll('.skill-logo');
    skillLogos.forEach(logo => {
        logo.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.1)';
            this.style.transition = 'all 0.3s ease';
        });
        
        logo.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Project cards enhanced interactions
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.03)';
            this.style.boxShadow = '0 12px 24px rgba(78,166,255,0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(78,166,255,0.06)';
        });
    });

    // Parallax effect for hero section
    let ticking = false;
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);

    // Dynamic navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(35, 42, 54, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = 'var(--card)';
            navbar.style.backdropFilter = 'none';
        }
    });

    // Contact icons enhanced hover effects
    const contactLinks = document.querySelectorAll('.contact-link');
    contactLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            const img = this.querySelector('img');
            img.style.transform = 'scale(1.15) rotate(-8deg)';
            img.style.filter = 'brightness(1.1) contrast(1.3)';
        });
        
        link.addEventListener('mouseleave', function() {
            const img = this.querySelector('img');
            img.style.transform = 'scale(1) rotate(0deg)';
            img.style.filter = 'brightness(0.9) contrast(1.2)';
        });
    });

    // Smooth reveal animation for skills
    const skillsContainer = document.querySelector('.skills-logos');
    const skillItems = skillsContainer.querySelectorAll('.skill-logo');
    
    const revealSkills = () => {
        skillItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    };

    // Trigger skills animation when skills section is visible
    const skillsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                revealSkills();
                skillsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const skillsSection = document.querySelector('#skills');
    if (skillsSection) {
        skillsObserver.observe(skillsSection);
    }

    // Initialize skill items with hidden state
    skillItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.6s ease';
    });

    // Enhanced button interactions
    const heroBtn = document.querySelector('.hero-btn');
    if (heroBtn) {
        heroBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 4px 16px rgba(78,166,255,0.3)';
        });
        
        heroBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(78,166,255,0.1)';
        });
    }

    // Add loading animation for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.complete) {
            // Image is already loaded
            img.style.opacity = '1';
        } else {
            // Image is still loading
            img.style.opacity = '0';
            img.addEventListener('load', function() {
                this.style.opacity = '1';
            });
            img.addEventListener('error', function() {
                // Show image even if there's an error
                this.style.opacity = '1';
                console.warn('Failed to load image:', this.src);
            });
        }
        img.style.transition = 'opacity 0.5s ease';
    });

    // Smooth scroll to top functionality
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
    document.body.appendChild(scrollToTopBtn);

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Show/hide scroll to top button
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.visibility = 'visible';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.visibility = 'hidden';
        }
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            navLinksContainer.classList.remove('open');
            hamburger.classList.remove('active');
            hamburgerSpans.forEach(span => {
                span.style.transform = 'none';
                span.style.opacity = '1';
            });
        }
    });

    // Add focus management for accessibility
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusableElement = document.querySelector(focusableElements);
    const focusableContent = document.querySelectorAll(focusableElements);
    const lastFocusableElement = focusableContent[focusableContent.length - 1];

    // Trap focus in mobile menu when open
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && navLinksContainer.classList.contains('open')) {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    e.preventDefault();
                    lastFocusableElement.focus();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    e.preventDefault();
                    firstFocusableElement.focus();
                }
            }
        }
    });

    // Add loading states and error handling
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });

    // Performance optimization: Debounce scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const debouncedScrollHandler = debounce(() => {
        // Handle scroll-based animations here
    }, 16);

    window.addEventListener('scroll', debouncedScrollHandler);

    console.log('Portfolio website enhanced with modern interactions! 🚀');
});

// Contact form handling: validation, submission to n8n webhook, and UX states
(function() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const endpoint = 'https://n8n.junkit.work/webhook/contact-form';
    const nameInput = document.getElementById('cf-name');
    const emailInput = document.getElementById('cf-email');
    const subjectInput = document.getElementById('cf-subject');
    const messageInput = document.getElementById('cf-message');
    const honeypot = document.getElementById('cf-website');
    const submitBtn = document.getElementById('cf-submit');
    const statusEl = document.getElementById('form-status');

    function setError(input, message) {
        const key = input.id.replace('cf-', '');
        const err = document.getElementById('error-' + key);
        if (err) {
            err.textContent = message;
            err.classList.add('visible');
        }
        input.setAttribute('aria-invalid', 'true');
    }

    function clearError(input) {
        const key = input.id.replace('cf-', '');
        const err = document.getElementById('error-' + key);
        if (err) {
            err.textContent = '';
            err.classList.remove('visible');
        }
        input.removeAttribute('aria-invalid');
    }

    function validate() {
        let valid = true;
        // name
        if (!nameInput.value.trim()) {
            setError(nameInput, 'Please enter your name');
            valid = false;
        } else {
            clearError(nameInput);
        }

        // email
        const emailVal = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal) {
            setError(emailInput, 'Please enter your email');
            valid = false;
        } else if (!emailRegex.test(emailVal)) {
            setError(emailInput, 'Please enter a valid email');
            valid = false;
        } else {
            clearError(emailInput);
        }

        // message
        if (!messageInput.value.trim()) {
            setError(messageInput, 'Please enter a message');
            valid = false;
        } else {
            clearError(messageInput);
        }

        return valid;
    }

        // Live toggle submit button based on required fields
        function updateSubmitState() {
            const emailVal = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const ready = nameInput.value.trim() && emailVal && emailRegex.test(emailVal) && messageInput.value.trim();
            if (ready) {
                    submitBtn.removeAttribute('disabled');
            } else {
                    submitBtn.setAttribute('disabled', 'disabled');
            }
        }

        // Initialize submit state and attach listeners
        updateSubmitState();
        [nameInput, emailInput, messageInput].forEach(i => {
            i.addEventListener('input', updateSubmitState);
        });

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.setAttribute('disabled', 'disabled');
            submitBtn.textContent = 'Sending...';
        } else {
            submitBtn.removeAttribute('disabled');
            submitBtn.textContent = 'Send Message';
        }
    }

    function showStatus(message, type) {
        statusEl.textContent = message;
        statusEl.classList.remove('success', 'error');
        if (type === 'success') statusEl.classList.add('success');
        if (type === 'error') statusEl.classList.add('error');
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // basic validation
        if (!validate()) {
            showStatus('Please correct the highlighted fields.', 'error');
            return;
        }

        // Honeypot check
        if (honeypot && honeypot.value.trim()) {
            // Treat as spam silently
            showStatus('Message sent.', 'success');
            form.reset();
            return;
        }

        setLoading(true);
        showStatus('Sending...', null);

        const payload = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            subject: subjectInput.value.trim(),
            message: messageInput.value.trim()
        };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showStatus('Thanks — your message was sent!', 'success');
                // animate and clear
                form.classList.add('submitted');
                setTimeout(() => {
                    form.reset();
                    // clear visual errors
                    [nameInput, emailInput, subjectInput, messageInput].forEach(clearError);
                    form.classList.remove('submitted');
                }, 600);
            } else {
                const text = await res.text();
                showStatus('Failed to send message. Try again later.', 'error');
                console.error('Contact form error response:', res.status, text);
            }
        } catch (err) {
            showStatus('Network error. Please check your connection.', 'error');
            console.error('Contact form network error:', err);
        } finally {
            setLoading(false);
        }
    });

    // Real-time validation on blur
    [nameInput, emailInput, messageInput].forEach(input => {
        input.addEventListener('blur', validate);
    });

    // Keyboard accessibility: focus styles
    [nameInput, emailInput, subjectInput, messageInput].forEach(i => {
        i.addEventListener('focus', (e) => {
            e.target.style.boxShadow = '0 6px 24px rgba(78,166,255,0.08)';
        });
        i.addEventListener('blur', (e) => {
            e.target.style.boxShadow = '';
        });
    });
})();
