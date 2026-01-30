/**
 * Cookie Consent Controller
 * GDPR-compliant cookie consent management
 */

const db = require('../config/database');

// @desc    Get user's cookie preferences
// @route   GET /api/cookie-consent/preferences
// @access  Public
exports.getPreferences = async (req, res) => {
    try {
        // Check if user has cookie consent ID in cookie
        const consentId = req.cookies.cookie_consent_id;

        if (!consentId) {
            return res.status(200).json({
                status: 'success',
                data: {
                    hasConsent: false,
                    preferences: null
                }
            });
        }

        // Get preferences from database
        const preferences = await db.query(
            'SELECT * FROM cookie_consents WHERE consent_id = ?',
            [consentId]
        );

        if (preferences.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: {
                    hasConsent: false,
                    preferences: null
                }
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                hasConsent: true,
                preferences: {
                    necessary: preferences[0].necessary,
                    functional: preferences[0].functional,
                    analytics: preferences[0].analytics,
                    marketing: preferences[0].marketing,
                    updatedAt: preferences[0].updated_at
                }
            }
        });

    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas pobierania preferencji'
        });
    }
};

// @desc    Save user's cookie preferences
// @route   POST /api/cookie-consent/preferences
// @access  Public
exports.savePreferences = async (req, res) => {
    try {
        const { necessary, functional, analytics, marketing } = req.body;

        // Generate unique consent ID
        const crypto = require('crypto');
        const consentId = crypto.randomBytes(32).toString('hex');

        // Get user IP (for logging purposes)
        const ipAddress = req.ip;

        // Save preferences to database
        await db.query(
            `INSERT INTO cookie_consents 
            (consent_id, necessary, functional, analytics, marketing, ip_address, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                consentId,
                necessary !== false, // Necessary cookies are always true
                functional || false,
                analytics || false,
                marketing || false,
                ipAddress
            ]
        );

        // Set cookie consent ID cookie (1 year expiry)
        res.cookie('cookie_consent_id', consentId, {
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Set cookie consent flag
        res.cookie('cookie_consent_given', 'true', {
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            httpOnly: false, // Accessible by JavaScript for UI purposes
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({
            status: 'success',
            message: 'Preferencje zapisane pomyślnie',
            data: {
                consentId: consentId
            }
        });

    } catch (error) {
        console.error('Save preferences error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas zapisywania preferencji'
        });
    }
};

// @desc    Get cookie policy
// @route   GET /api/cookie-consent/policy
// @access  Public
exports.getPolicy = (req, res) => {
    const policy = {
        status: 'success',
        data: {
            title: 'Polityka Cookies',
            lastUpdated: '2024-01-01',
            categories: [
                {
                    id: 'necessary',
                    name: 'Niezbędne',
                    description: 'Te pliki cookie są niezbędne do prawidłowego działania strony. Nie można ich wyłączyć.',
                    required: true,
                    cookies: [
                        {
                            name: 'token',
                            purpose: 'Sesja użytkownika i uwierzytelnianie',
                            duration: '7 dni'
                        },
                        {
                            name: 'cookie_consent_id',
                            purpose: 'Przechowuje ID zgody na pliki cookie',
                            duration: '1 rok'
                        },
                        {
                            name: 'cookie_consent_given',
                            purpose: 'Flaga oznaczająca udzielenie zgody',
                            duration: '1 rok'
                        }
                    ]
                },
                {
                    id: 'functional',
                    name: 'Funkcjonalne',
                    description: 'Te pliki cookie umożliwiają dodatkowe funkcje, takie jak zapamiętywanie preferencji językowych.',
                    required: false,
                    cookies: [
                        {
                            name: 'language_preference',
                            purpose: 'Przechowuje wybrany język',
                            duration: '1 rok'
                        },
                        {
                            name: 'theme_preference',
                            purpose: 'Przechowuje wybrany motyw',
                            duration: '1 rok'
                        }
                    ]
                },
                {
                    id: 'analytics',
                    name: 'Analityczne',
                    description: 'Te pliki cookie pomagają nam zrozumieć, jak użytkownicy korzystają z naszej strony.',
                    required: false,
                    cookies: [
                        {
                            name: '_ga',
                            purpose: 'Google Analytics - identyfikacja użytkownika',
                            duration: '2 lata'
                        },
                        {
                            name: '_gid',
                            purpose: 'Google Analytics - identyfikacja sesji',
                            duration: '24 godziny'
                        }
                    ]
                },
                {
                    id: 'marketing',
                    name: 'Marketingowe',
                    description: 'Te pliki cookie służą do śledzenia użytkowników w celach marketingowych.',
                    required: false,
                    cookies: [
                        {
                            name: '_fbp',
                            purpose: 'Facebook Pixel',
                            duration: '3 miesiące'
                        }
                    ]
                }
            ]
        }
    };

    res.status(200).json(policy);
};
