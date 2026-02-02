/**
 * Cookie Consent Routes
 * GDPR-compliant cookie consent management
 */

import { Router } from 'express';
import * as cookieConsentController from '../controllers/cookieConsentController';
import { apiLimiter } from '../middleware';

const router = Router();

// GET /api/cookie-consent/preferences
router.get(
  '/preferences',
  apiLimiter,
  cookieConsentController.getPreferences
);

// POST /api/cookie-consent/preferences
router.post(
  '/preferences',
  apiLimiter,
  cookieConsentController.savePreferences
);

// GET /api/cookie-consent/policy
router.get('/policy', cookieConsentController.getPolicy);

export default router;
