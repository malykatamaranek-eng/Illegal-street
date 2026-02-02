/**
 * Cookie Consent Controller
 * GDPR-compliant cookie consent management
 */

import { Request, Response } from 'express';
import { cookieConsentService } from '../services';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../config/logger';

/**
 * Get user's cookie preferences
 * @route GET /api/cookie-consent/preferences
 * @access Public
 */
export const getPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    const consentId = req.cookies?.cookie_consent_id;

    if (!consentId) {
      return res.status(200).json({
        success: true,
        data: {
          hasConsent: false,
          preferences: null,
        },
      });
    }

    const preferences = await cookieConsentService.getPreferences(consentId);

    if (!preferences) {
      return res.status(200).json({
        success: true,
        data: {
          hasConsent: false,
          preferences: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        hasConsent: true,
        preferences,
      },
    });
  }
);

/**
 * Save user's cookie preferences
 * @route POST /api/cookie-consent/preferences
 * @access Public
 */
export const savePreferences = asyncHandler(
  async (req: Request, res: Response) => {
    const { necessary, functional, analytics, marketing } = req.body;
    const ipAddress = req.ip;

    // Check if user already has consent ID
    const existingConsentId = req.cookies?.cookie_consent_id;

    let consent;
    if (existingConsentId) {
      // Update existing preferences
      try {
        consent = await cookieConsentService.updatePreferences(
          existingConsentId,
          { necessary, functional, analytics, marketing }
        );
      } catch (error) {
        // If consent not found, create new one
        consent = await cookieConsentService.savePreferences(
          { necessary, functional, analytics, marketing },
          ipAddress
        );
      }
    } else {
      // Create new consent
      consent = await cookieConsentService.savePreferences(
        { necessary, functional, analytics, marketing },
        ipAddress
      );
    }

    // Set cookie consent ID cookie (1 year expiry)
    res.cookie('cookie_consent_id', consent.consentId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Set cookie consent flag (accessible by JavaScript for UI purposes)
    res.cookie('cookie_consent_given', 'true', {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    logger.info(`Cookie preferences saved: ${consent.consentId}`);

    res.status(200).json({
      success: true,
      message: 'Preferencje zapisane pomyślnie',
      data: {
        consentId: consent.consentId,
        preferences: {
          necessary: consent.necessary,
          functional: consent.functional,
          analytics: consent.analytics,
          marketing: consent.marketing,
        },
      },
    });
  }
);

/**
 * Get cookie policy
 * @route GET /api/cookie-consent/policy
 * @access Public
 */
export const getPolicy = asyncHandler(async (_req: Request, res: Response) => {
  const policy = cookieConsentService.getPolicy();

  res.status(200).json({
    success: true,
    data: policy,
  });
});
