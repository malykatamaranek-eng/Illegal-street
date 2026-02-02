/**
 * Cookie Consent Service
 * GDPR-compliant cookie consent management
 */

import { randomBytes } from 'crypto';
import prisma from '../config/prisma';
import logger from '../config/logger';

interface CookiePreferences {
  necessary?: boolean;
  functional?: boolean;
  analytics?: boolean;
  marketing?: boolean;
}

/**
 * Get user's cookie preferences by consent ID
 */
const getPreferences = async (consentId: string) => {
  try {
    const consent = await prisma.cookieConsent.findUnique({
      where: { consentId },
      select: {
        consentId: true,
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true,
        updatedAt: true,
      },
    });

    return consent;
  } catch (error) {
    logger.error('Error getting cookie preferences:', error);
    throw new Error('Failed to get cookie preferences');
  }
};

/**
 * Save user's cookie preferences
 */
const savePreferences = async (
  preferences: CookiePreferences,
  ipAddress?: string
) => {
  try {
    // Generate unique consent ID
    const consentId = randomBytes(32).toString('hex');

    // Create consent record
    const consent = await prisma.cookieConsent.create({
      data: {
        consentId,
        necessary: true, // Always true - required for site functionality
        functional: preferences.functional || false,
        analytics: preferences.analytics || false,
        marketing: preferences.marketing || false,
        ipAddress,
      },
      select: {
        consentId: true,
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true,
        createdAt: true,
      },
    });

    logger.info(`Cookie consent saved: ${consentId}`);
    return consent;
  } catch (error) {
    logger.error('Error saving cookie preferences:', error);
    throw new Error('Failed to save cookie preferences');
  }
};

/**
 * Update existing cookie preferences
 */
const updatePreferences = async (
  consentId: string,
  preferences: CookiePreferences
) => {
  try {
    const consent = await prisma.cookieConsent.update({
      where: { consentId },
      data: {
        necessary: true, // Always true - required for site functionality
        functional: preferences.functional || false,
        analytics: preferences.analytics || false,
        marketing: preferences.marketing || false,
      },
      select: {
        consentId: true,
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true,
        updatedAt: true,
      },
    });

    logger.info(`Cookie consent updated: ${consentId}`);
    return consent;
  } catch (error) {
    logger.error('Error updating cookie preferences:', error);
    throw new Error('Failed to update cookie preferences');
  }
};

/**
 * Get cookie policy information
 */
const getPolicy = () => {
  return {
    title: 'Polityka Cookies',
    lastUpdated: '2024-01-01',
    categories: [
      {
        id: 'necessary',
        name: 'Niezbędne',
        description:
          'Te pliki cookie są niezbędne do prawidłowego działania strony. Nie można ich wyłączyć.',
        required: true,
        cookies: [
          {
            name: 'token',
            purpose: 'Sesja użytkownika i uwierzytelnianie',
            duration: '7 dni',
          },
          {
            name: 'cookie_consent_id',
            purpose: 'Przechowuje ID zgody na pliki cookie',
            duration: '1 rok',
          },
          {
            name: 'cookie_consent_given',
            purpose: 'Flaga oznaczająca udzielenie zgody',
            duration: '1 rok',
          },
        ],
      },
      {
        id: 'functional',
        name: 'Funkcjonalne',
        description:
          'Te pliki cookie umożliwiają dodatkowe funkcje, takie jak zapamiętywanie preferencji językowych.',
        required: false,
        cookies: [
          {
            name: 'language_preference',
            purpose: 'Przechowuje wybrany język',
            duration: '1 rok',
          },
          {
            name: 'theme_preference',
            purpose: 'Przechowuje wybrany motyw',
            duration: '1 rok',
          },
        ],
      },
      {
        id: 'analytics',
        name: 'Analityczne',
        description:
          'Te pliki cookie pomagają nam zrozumieć, jak użytkownicy korzystają z naszej strony.',
        required: false,
        cookies: [
          {
            name: '_ga',
            purpose: 'Google Analytics - identyfikacja użytkownika',
            duration: '2 lata',
          },
          {
            name: '_gid',
            purpose: 'Google Analytics - identyfikacja sesji',
            duration: '24 godziny',
          },
        ],
      },
      {
        id: 'marketing',
        name: 'Marketingowe',
        description:
          'Te pliki cookie służą do śledzenia użytkowników w celach marketingowych.',
        required: false,
        cookies: [
          {
            name: '_fbp',
            purpose: 'Facebook Pixel',
            duration: '3 miesiące',
          },
        ],
      },
    ],
  };
};

export default {
  getPreferences,
  savePreferences,
  updatePreferences,
  getPolicy,
};
