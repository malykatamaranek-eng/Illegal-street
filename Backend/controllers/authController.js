/**
 * Authentication Controller
 * Handles user authentication with secure cookies and JWT
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const logger = require('../config/logger');
require('dotenv').config();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// Set secure cookie with JWT
const setTokenCookie = (res, token) => {
    const cookieOptions = {
        expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true, // Prevent XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict', // CSRF protection
        path: '/'
    };

    res.cookie('token', token, cookieOptions);
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { username, password, remember } = req.body;

        // Input validation (basic - additional validation in middleware)
        if (!username || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Proszę podać nazwę użytkownika i hasło'
            });
        }

        // Check if user exists (using parameterized query for SQL injection protection)
        const users = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
            [username, username]
        );

        if (users.length === 0) {
            logger.logFailedLogin(username, req.ip, 'User not found');
            return res.status(401).json({
                status: 'fail',
                message: 'Nieprawidłowe dane logowania'
            });
        }

        const user = users[0];

        // Check if account is locked due to failed attempts
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const lockTime = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
            logger.logSuspiciousActivity('LOCKED_ACCOUNT_LOGIN_ATTEMPT', {
                username: user.username,
                ip: req.ip,
                lockTimeRemaining: lockTime,
            });
            return res.status(429).json({
                status: 'fail',
                message: `Konto zablokowane. Spróbuj ponownie za ${lockTime} minut.`
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // Increment failed login attempts
            const failedAttempts = (user.failed_login_attempts || 0) + 1;
            const maxAttempts = process.env.MAX_LOGIN_ATTEMPTS || 5;

            if (failedAttempts >= maxAttempts) {
                // Lock account for 15 minutes
                const lockTime = new Date(Date.now() + (process.env.LOCK_TIME || 15) * 60 * 1000);
                await db.query(
                    'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
                    [failedAttempts, lockTime, user.id]
                );

                logger.logSecurityEvent('ACCOUNT_LOCKED', {
                    username: user.username,
                    userId: user.id,
                    ip: req.ip,
                    failedAttempts,
                });

                return res.status(429).json({
                    status: 'fail',
                    message: 'Zbyt wiele nieudanych prób logowania. Konto zablokowane na 15 minut.'
                });
            }

            // Update failed attempts
            await db.query(
                'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
                [failedAttempts, user.id]
            );

            logger.logFailedLogin(username, req.ip, 'Invalid password');

            return res.status(401).json({
                status: 'fail',
                message: 'Nieprawidłowe dane logowania',
                attemptsLeft: maxAttempts - failedAttempts
            });
        }

        // Reset failed login attempts on successful login
        await db.query(
            'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Generate token
        const token = generateToken(user.id);

        // Set secure cookie
        setTokenCookie(res, token);

        // Log successful login
        await db.query(
            'INSERT INTO login_logs (user_id, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
            [user.id, req.ip, req.get('user-agent'), true]
        );

        logger.info(`Successful login: ${user.username} from ${req.ip}`);

        res.status(200).json({
            status: 'success',
            message: 'Zalogowano pomyślnie',
            token: token, // JWT token for localStorage (optional)
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {
        logger.error('Login error:', { error: error.message, stack: error.stack });
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas logowania'
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    res.status(200).json({
        status: 'success',
        message: 'Wylogowano pomyślnie'
    });
};

// @desc    Register new user (admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Użytkownik o tej nazwie lub emailu już istnieje'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await db.query(
            'INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
            [username, email, hashedPassword, role || 'user']
        );

        res.status(201).json({
            status: 'success',
            message: 'Użytkownik utworzony pomyślnie',
            data: {
                userId: result.insertId
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas rejestracji'
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            // Don't reveal if user exists or not
            return res.status(200).json({
                status: 'success',
                message: 'Jeśli email istnieje w systemie, link resetujący hasło został wysłany'
            });
        }

        const user = users[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Save reset token (expires in 1 hour)
        const resetExpire = new Date(Date.now() + 60 * 60 * 1000);
        await db.query(
            'UPDATE users SET reset_password_token = ?, reset_password_expire = ? WHERE id = ?',
            [resetTokenHash, resetExpire, user.id]
        );

        // TODO: Send email with reset link
        // const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        // await sendEmail({ ... });

        res.status(200).json({
            status: 'success',
            message: 'Link resetujący hasło został wysłany na email'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas wysyłania emaila'
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Hash token
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token
        const users = await db.query(
            'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expire > NOW()',
            [resetTokenHash]
        );

        if (users.length === 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token resetowania hasła jest nieprawidłowy lub wygasł'
            });
        }

        const user = users[0];

        // Hash new password
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset token
        await db.query(
            'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expire = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.status(200).json({
            status: 'success',
            message: 'Hasło zostało zresetowane pomyślnie'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas resetowania hasła'
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Private
exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'Nie jesteś zalogowany'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Generate new token
        const newToken = generateToken(decoded.id);

        // Set new cookie
        setTokenCookie(res, newToken);

        res.status(200).json({
            status: 'success',
            message: 'Token odświeżony pomyślnie'
        });

    } catch (error) {
        res.status(401).json({
            status: 'fail',
            message: 'Token jest nieprawidłowy lub wygasł'
        });
    }
};

// @desc    Verify current session
// @route   GET /api/auth/verify
// @access  Public
exports.verifySession = async (req, res) => {
    try {
        let token;

        // Get token from cookie
        if (req.cookies.token) {
            token = req.cookies.token;
        }
        // Also check Authorization header
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token || token === 'none') {
            return res.status(401).json({
                status: 'fail',
                message: 'Brak sesji użytkownika',
                authenticated: false
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from database
            const users = await db.query(
                'SELECT id, username, email, role FROM users WHERE id = ?',
                [decoded.id]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Użytkownik nie istnieje',
                    authenticated: false
                });
            }

            const user = users[0];

            res.status(200).json({
                status: 'success',
                message: 'Sesja aktywna',
                authenticated: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }
                }
            });

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Sesja wygasła',
                    authenticated: false
                });
            }

            return res.status(401).json({
                status: 'fail',
                message: 'Token nieprawidłowy',
                authenticated: false
            });
        }

    } catch (error) {
        logger.error('Verify session error:', { error: error.message, stack: error.stack });
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas weryfikacji sesji',
            authenticated: false
        });
    }
};

// Middleware to protect routes
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from cookie
        if (req.cookies.token) {
            token = req.cookies.token;
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'Nie jesteś zalogowany. Proszę się zalogować.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const users = await db.query(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                status: 'fail',
                message: 'Użytkownik nie istnieje'
            });
        }

        // Attach user to request
        req.user = users[0];
        next();

    } catch (error) {
        return res.status(401).json({
            status: 'fail',
            message: 'Token jest nieprawidłowy lub wygasł'
        });
    }
};

// Middleware to restrict access to specific roles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'Nie masz uprawnień do wykonania tej operacji'
            });
        }
        next();
    };
};
