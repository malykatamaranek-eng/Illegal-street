/**
 * JWT Key Rotation Utility
 * Manages JWT secret rotation for enhanced security
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * Generate a new secure JWT secret
 */
const generateSecret = () => {
    return crypto.randomBytes(64).toString('hex');
};

/**
 * Get the rotation file path
 */
const getRotationFilePath = () => {
    return path.join(__dirname, '../.jwt-rotation');
};

/**
 * Check if JWT key needs rotation
 * @returns {boolean} True if rotation is needed
 */
const needsRotation = async () => {
    try {
        const rotationFile = await fs.readFile(getRotationFilePath(), 'utf8');
        const rotationData = JSON.parse(rotationFile);
        const lastRotation = new Date(rotationData.lastRotation);
        const daysSinceRotation = Math.floor((Date.now() - lastRotation) / (1000 * 60 * 60 * 24));
        const rotationDays = parseInt(process.env.JWT_KEY_ROTATION_DAYS) || 30;
        
        return daysSinceRotation >= rotationDays;
    } catch (error) {
        // File doesn't exist or is invalid, needs rotation
        return true;
    }
};

/**
 * Rotate JWT secret key
 * In production, this should update the environment variable or secrets manager
 */
const rotateKey = async () => {
    try {
        const newSecret = generateSecret();
        const rotationData = {
            lastRotation: new Date().toISOString(),
            previousRotation: null,
        };

        // Read previous rotation data if exists
        try {
            const existingData = await fs.readFile(getRotationFilePath(), 'utf8');
            const parsed = JSON.parse(existingData);
            rotationData.previousRotation = parsed.lastRotation;
        } catch (error) {
            // No previous rotation data
        }

        // Save rotation data
        await fs.writeFile(
            getRotationFilePath(),
            JSON.stringify(rotationData, null, 2),
            'utf8'
        );

        logger.info('JWT key rotation scheduled', {
            lastRotation: rotationData.lastRotation,
            previousRotation: rotationData.previousRotation,
        });

        // In production, you would:
        // 1. Update secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
        // 2. Trigger a rolling restart of the application
        // 3. Keep old key valid for grace period
        
        logger.warn('SECURITY: JWT key rotation needed. Update JWT_SECRET in production secrets manager.');
        
        if (process.env.NODE_ENV !== 'production') {
            logger.info('New secret generated. Use a secure method to retrieve it in production.');
        }

        return {
            success: true,
            message: 'JWT rotation scheduled. Update JWT_SECRET in production.',
            newSecret: process.env.NODE_ENV === 'production' ? undefined : newSecret,
        };
    } catch (error) {
        logger.error('JWT key rotation failed', { error: error.message });
        return {
            success: false,
            message: 'JWT rotation failed',
            error: error.message,
        };
    }
};

/**
 * Check and rotate JWT key if needed (run on startup)
 */
const checkAndRotate = async () => {
    if (await needsRotation()) {
        logger.info('JWT key rotation check: Rotation needed');
        return await rotateKey();
    } else {
        logger.info('JWT key rotation check: No rotation needed');
        return {
            success: true,
            message: 'JWT key is current',
        };
    }
};

module.exports = {
    generateSecret,
    needsRotation,
    rotateKey,
    checkAndRotate,
};
