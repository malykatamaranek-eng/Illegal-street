/**
 * Cookie Consent Banner
 * GDPR-compliant cookie consent management for frontend
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        apiEndpoint: '/api/cookie-consent',
        cookieName: 'cookie_consent_given',
        expiryDays: 365
    };

    // Cookie utilities
    const CookieUtils = {
        get: function(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        },
        
        set: function(name, value, days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = `expires=${date.toUTCString()}`;
            document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
        }
    };

    // Check if consent was already given
    if (CookieUtils.get(CONFIG.cookieName)) {
        return; // Don't show banner if consent already given
    }

    // Create banner HTML
    const createBanner = () => {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Zgoda na pliki cookie');
        banner.setAttribute('aria-live', 'polite');
        
        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-banner-text">
                    <h3 class="cookie-banner-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="8" cy="10" r="1"></circle>
                            <circle cx="16" cy="10" r="1"></circle>
                            <circle cx="12" cy="15" r="1"></circle>
                            <circle cx="9" cy="16" r="1"></circle>
                            <circle cx="15" cy="16" r="1"></circle>
                        </svg>
                        Pliki Cookie
                    </h3>
                    <p class="cookie-banner-description">
                        Używamy plików cookie, aby zapewnić najlepsze doświadczenie na naszej stronie. 
                        Pliki cookie pomagają nam w personalizacji treści, dostarczaniu funkcji mediów społecznościowych 
                        oraz analizie ruchu na stronie.
                    </p>
                </div>
                
                <div class="cookie-banner-actions">
                    <button id="cookie-settings-btn" class="cookie-btn cookie-btn-secondary" type="button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m5.6 5.6l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m5.6-5.6l4.2-4.2"></path>
                        </svg>
                        Ustawienia
                    </button>
                    <button id="cookie-accept-all-btn" class="cookie-btn cookie-btn-primary" type="button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Zaakceptuj wszystkie
                    </button>
                </div>
            </div>
            
            <div id="cookie-settings-panel" class="cookie-settings-panel" style="display: none;">
                <h4 class="cookie-settings-title">Ustawienia plików cookie</h4>
                <p class="cookie-settings-description">
                    Wybierz kategorie plików cookie, które chcesz zaakceptować. 
                    Możesz zmienić swoje preferencje w dowolnym momencie.
                </p>
                
                <div class="cookie-categories">
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-checkbox-label">
                                <input type="checkbox" id="cookie-necessary" checked disabled>
                                <span class="cookie-checkbox-custom"></span>
                                <span class="cookie-category-name">Niezbędne</span>
                                <span class="cookie-badge cookie-badge-required">Wymagane</span>
                            </label>
                        </div>
                        <p class="cookie-category-description">
                            Te pliki cookie są niezbędne do prawidłowego działania strony i nie można ich wyłączyć.
                        </p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-checkbox-label">
                                <input type="checkbox" id="cookie-functional">
                                <span class="cookie-checkbox-custom"></span>
                                <span class="cookie-category-name">Funkcjonalne</span>
                            </label>
                        </div>
                        <p class="cookie-category-description">
                            Te pliki cookie umożliwiają dodatkowe funkcje, takie jak zapamiętywanie preferencji językowych.
                        </p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-checkbox-label">
                                <input type="checkbox" id="cookie-analytics">
                                <span class="cookie-checkbox-custom"></span>
                                <span class="cookie-category-name">Analityczne</span>
                            </label>
                        </div>
                        <p class="cookie-category-description">
                            Te pliki cookie pomagają nam zrozumieć, jak użytkownicy korzystają z naszej strony.
                        </p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-checkbox-label">
                                <input type="checkbox" id="cookie-marketing">
                                <span class="cookie-checkbox-custom"></span>
                                <span class="cookie-category-name">Marketingowe</span>
                            </label>
                        </div>
                        <p class="cookie-category-description">
                            Te pliki cookie służą do śledzenia użytkowników w celach marketingowych.
                        </p>
                    </div>
                </div>
                
                <div class="cookie-settings-actions">
                    <button id="cookie-save-settings-btn" class="cookie-btn cookie-btn-primary" type="button">
                        Zapisz ustawienia
                    </button>
                    <a href="#" id="cookie-policy-link" class="cookie-policy-link">
                        Polityka plików cookie
                    </a>
                </div>
            </div>
        `;
        
        return banner;
    };

    // Save preferences to backend
    const savePreferences = async (preferences) => {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/preferences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferences),
                credentials: 'include'
            });
            
            if (response.ok) {
                return true;
            } else {
                console.error('Failed to save cookie preferences');
                return false;
            }
        } catch (error) {
            console.error('Error saving cookie preferences:', error);
            return false;
        }
    };

    // Accept all cookies
    const acceptAll = async () => {
        const preferences = {
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true
        };
        
        const saved = await savePreferences(preferences);
        if (saved) {
            hideBanner();
            loadScripts(preferences);
        }
    };

    // Save custom settings
    const saveSettings = async () => {
        const preferences = {
            necessary: true,
            functional: document.getElementById('cookie-functional').checked,
            analytics: document.getElementById('cookie-analytics').checked,
            marketing: document.getElementById('cookie-marketing').checked
        };
        
        const saved = await savePreferences(preferences);
        if (saved) {
            hideBanner();
            loadScripts(preferences);
        }
    };

    // Load scripts based on consent
    const loadScripts = (preferences) => {
        // Load analytics scripts if consented
        if (preferences.analytics) {
            loadGoogleAnalytics();
        }
        
        // Load marketing scripts if consented
        if (preferences.marketing) {
            loadMarketingScripts();
        }
    };

    // Load Google Analytics (example)
    const loadGoogleAnalytics = () => {
        // Uncomment and configure with your GA ID
        /*
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
        ga('create', 'UA-XXXXX-Y', 'auto');
        ga('send', 'pageview');
        */
        console.log('Google Analytics would be loaded here');
    };

    // Load marketing scripts (example)
    const loadMarketingScripts = () => {
        // Load Facebook Pixel, etc.
        console.log('Marketing scripts would be loaded here');
    };

    // Hide banner
    const hideBanner = () => {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(100%)';
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    };

    // Toggle settings panel
    const toggleSettings = () => {
        const panel = document.getElementById('cookie-settings-panel');
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            setTimeout(() => {
                panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    };

    // Initialize banner
    const init = () => {
        // Create and append banner
        const banner = createBanner();
        document.body.appendChild(banner);
        
        // Add styles
        addStyles();
        
        // Animate in
        setTimeout(() => {
            banner.style.opacity = '1';
            banner.style.transform = 'translateY(0)';
        }, 100);
        
        // Event listeners
        document.getElementById('cookie-accept-all-btn').addEventListener('click', acceptAll);
        document.getElementById('cookie-settings-btn').addEventListener('click', toggleSettings);
        document.getElementById('cookie-save-settings-btn').addEventListener('click', saveSettings);
        
        // Cookie policy link
        document.getElementById('cookie-policy-link').addEventListener('click', (e) => {
            e.preventDefault();
            // Open cookie policy in new tab or modal
            alert('Polityka plików cookie będzie dostępna wkrótce');
        });
    };

    // Add CSS styles
    const addStyles = () => {
        if (document.getElementById('cookie-consent-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'cookie-consent-styles';
        style.textContent = `
            .cookie-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(26, 26, 26, 0.98);
                backdrop-filter: blur(10px);
                border-top: 2px solid #ff0000;
                padding: 24px;
                z-index: 10000;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
                opacity: 0;
                transform: translateY(100%);
                transition: all 0.3s ease-out;
            }
            
            .cookie-banner-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                flex-wrap: wrap;
            }
            
            .cookie-banner-text {
                flex: 1;
                min-width: 300px;
            }
            
            .cookie-banner-title {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #ff0000;
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 8px 0;
            }
            
            .cookie-banner-description {
                color: #aaa;
                font-size: 14px;
                line-height: 1.6;
                margin: 0;
            }
            
            .cookie-banner-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .cookie-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                white-space: nowrap;
            }
            
            .cookie-btn-primary {
                background: #ff0000;
                color: white;
            }
            
            .cookie-btn-primary:hover {
                background: #cc0000;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
            }
            
            .cookie-btn-secondary {
                background: transparent;
                color: #fff;
                border: 2px solid #333;
            }
            
            .cookie-btn-secondary:hover {
                border-color: #ff0000;
                color: #ff0000;
            }
            
            .cookie-settings-panel {
                max-width: 1200px;
                margin: 24px auto 0;
                padding: 24px;
                background: rgba(10, 10, 10, 0.5);
                border-radius: 8px;
                border: 1px solid #333;
            }
            
            .cookie-settings-title {
                color: #ff0000;
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 8px 0;
            }
            
            .cookie-settings-description {
                color: #aaa;
                font-size: 14px;
                margin: 0 0 20px 0;
            }
            
            .cookie-categories {
                display: flex;
                flex-direction: column;
                gap: 16px;
                margin-bottom: 20px;
            }
            
            .cookie-category {
                padding: 16px;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 6px;
                border: 1px solid #333;
            }
            
            .cookie-category-header {
                margin-bottom: 8px;
            }
            
            .cookie-checkbox-label {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                user-select: none;
            }
            
            .cookie-checkbox-label input[type="checkbox"] {
                display: none;
            }
            
            .cookie-checkbox-custom {
                width: 20px;
                height: 20px;
                border: 2px solid #666;
                border-radius: 4px;
                position: relative;
                transition: all 0.2s;
            }
            
            .cookie-checkbox-label input[type="checkbox"]:checked + .cookie-checkbox-custom {
                background: #ff0000;
                border-color: #ff0000;
            }
            
            .cookie-checkbox-label input[type="checkbox"]:checked + .cookie-checkbox-custom::after {
                content: "✓";
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 14px;
            }
            
            .cookie-checkbox-label input[type="checkbox"]:disabled + .cookie-checkbox-custom {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .cookie-category-name {
                color: #fff;
                font-weight: 600;
                font-size: 14px;
            }
            
            .cookie-badge {
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .cookie-badge-required {
                background: #333;
                color: #aaa;
            }
            
            .cookie-category-description {
                color: #888;
                font-size: 13px;
                line-height: 1.5;
                margin: 0;
            }
            
            .cookie-settings-actions {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                flex-wrap: wrap;
            }
            
            .cookie-policy-link {
                color: #ff0000;
                text-decoration: none;
                font-size: 14px;
                transition: opacity 0.2s;
            }
            
            .cookie-policy-link:hover {
                opacity: 0.8;
                text-decoration: underline;
            }
            
            @media (max-width: 768px) {
                .cookie-banner {
                    padding: 16px;
                }
                
                .cookie-banner-content {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .cookie-banner-actions {
                    flex-direction: column;
                }
                
                .cookie-btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(style);
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
