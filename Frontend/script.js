// ===== Global Variables =====
let navToggle;
let navMenu;

// ===== DOM Content Loaded =====
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollEffects();
    initAnimations();
    initContactForm();
    initStats();
    initGallery();
    initLanguageToggle();
});

// ===== Navigation =====
function initNavigation() {
    navToggle = document.querySelector('.nav-toggle');
    navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle) {
        navToggle.addEventListener('click', toggleNav);
    }

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Only prevent default and close menu for anchor links on same page
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    closeNav();
                    smoothScrollTo(targetSection);
                    updateActiveLink(link);
                }
            } else if (window.innerWidth <= 768) {
                closeNav();
            }
        });
    });

    // Update active link on scroll
    window.addEventListener('scroll', () => {
        updateNavOnScroll();
        updateActiveNavLink();
    });
}

function toggleNav() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

function closeNav() {
    if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }
}

function updateNavOnScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.scrollY >= sectionTop - 200) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

function updateActiveLink(activeLink) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

function smoothScrollTo(target) {
    const targetPosition = target.offsetTop - 70;
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

// ===== Scroll Effects =====
function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('fade-in');
                }, index * 100);
            }
        });
    }, observerOptions);

    // Observe sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        observer.observe(section);
    });

    // Observe gallery items with staggered animation
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        const itemObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '0';
                        entry.target.style.transform = 'translateY(30px)';
                        setTimeout(() => {
                            entry.target.style.transition = 'all 0.6s ease-out';
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, 50);
                    }, index * 100);
                }
            });
        }, observerOptions);
        itemObserver.observe(item);
    });

    // Observe team members
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach((member, index) => {
        const memberObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('slide-in-left');
                    }, index * 150);
                }
            });
        }, observerOptions);
        memberObserver.observe(member);
    });

    // Observe about text
    const aboutText = document.querySelector('.about-text');
    if (aboutText) {
        const aboutObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);
        aboutObserver.observe(aboutText);
    }
}

// ===== Animations =====
function initAnimations() {
    // Animate stat numbers when in view
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    if (!stat.classList.contains('animated')) {
                        animateNumber(stat);
                    }
                });
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        statObserver.observe(statsSection);
    }
}

function animateNumber(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    element.classList.add('animated');

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// ===== Contact Form =====
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);

        // Real-time validation
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    validateField(input);
                }
            });
        });
    }
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    let isValid = true;

    // Validate all fields
    const fields = form.querySelectorAll('input[required], textarea[required]');
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    if (isValid) {
        // Show success message
        const successMsg = document.getElementById('formSuccess');
        successMsg.classList.add('show');

        // Reset form
        form.reset();

        // Clear errors
        clearFormErrors(form);

        // Hide success message after 5 seconds
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 5000);
    }
}

function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    const errorElement = document.getElementById(`${fieldName}Error`);
    
    let errorMessage = '';

    if (!value && field.hasAttribute('required')) {
        errorMessage = 'To pole jest wymagane';
    } else if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            errorMessage = 'Wprowadź poprawny adres email';
        }
    } else if (fieldName === 'phone' && value) {
        const phoneRegex = /^[\d\s\+\-\(\)]+$/;
        if (!phoneRegex.test(value)) {
            errorMessage = 'Wprowadź poprawny numer telefonu';
        }
    } else if (fieldName === 'message' && value && value.length < 10) {
        errorMessage = 'Wiadomość musi mieć co najmniej 10 znaków';
    }

    if (errorMessage) {
        field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = errorMessage;
        }
        return false;
    } else {
        field.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
        }
        return true;
    }
}

function clearFormErrors(form) {
    const fields = form.querySelectorAll('input, textarea');
    fields.forEach(field => {
        field.classList.remove('error');
    });

    const errors = form.querySelectorAll('.form-error');
    errors.forEach(error => {
        error.textContent = '';
    });
}

// ===== Stats Counter =====
function initStats() {
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        stat.textContent = '0';
    });
}

// ===== Gallery =====
function initGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            // Add click animation
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
                item.style.transform = '';
            }, 200);
        });
        
        // Add parallax effect on mouse move
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            const img = item.querySelector('.gallery-image');
            if (img) {
                img.style.transform = `scale(1.1) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }
        });
        
        item.addEventListener('mouseleave', () => {
            const img = item.querySelector('.gallery-image');
            if (img) {
                img.style.transform = 'scale(1)';
            }
        });
    });
}

// ===== Language Toggle =====
function initLanguageToggle() {
    const langToggle = document.getElementById('langToggle');
    let currentLang = 'PL';
    
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            currentLang = currentLang === 'PL' ? 'ENG' : 'PL';
            const langText = langToggle.querySelector('.lang-text');
            if (langText) {
                langText.textContent = currentLang;
            }
            
            // Add animation effect
            langToggle.style.transform = 'scale(0.95)';
            setTimeout(() => {
                langToggle.style.transform = '';
            }, 150);
            
            // Here you could add language switching logic
            console.log('Language switched to:', currentLang);
        });
    }
}

// ===== Smooth Scroll for all anchor links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            smoothScrollTo(target);
        }
    });
});

// ===== Scroll to top on page load =====
window.addEventListener('load', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});
