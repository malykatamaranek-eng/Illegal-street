/**
 * User Controller
 * Handles user profile management with security
 */

const bcrypt = require('bcryptjs');
const db = require('../config/database');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const users = await db.query(
            'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Użytkownik nie znaleziony'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: users[0]
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas pobierania profilu'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!username && !email) {
            return res.status(400).json({
                status: 'fail',
                message: 'Proszę podać dane do aktualizacji'
            });
        }

        // Check if username/email already exists (for other users)
        if (username || email) {
            const existingUsers = await db.query(
                'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
                [username || '', email || '', userId]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Nazwa użytkownika lub email jest już zajęta'
                });
            }
        }

        // Build update query dynamically but securely
        const updates = [];
        const values = [];

        if (username) {
            updates.push('username = ?');
            values.push(username);
        }

        if (email) {
            updates.push('email = ?');
            values.push(email);
        }

        values.push(userId);

        // Update user
        await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Get updated user
        const updatedUser = await db.query(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [userId]
        );

        res.status(200).json({
            status: 'success',
            message: 'Profil zaktualizowany pomyślnie',
            data: {
                user: updatedUser[0]
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas aktualizacji profilu'
        });
    }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: 'fail',
                message: 'Proszę podać aktualne i nowe hasło'
            });
        }

        // Get user with password
        const users = await db.query(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Użytkownik nie znaleziony'
            });
        }

        const user = users[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'fail',
                message: 'Aktualne hasło jest nieprawidłowe'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        res.status(200).json({
            status: 'success',
            message: 'Hasło zostało zmienione pomyślnie'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas zmiany hasła'
        });
    }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        // Require password confirmation
        if (!password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Proszę podać hasło w celu potwierdzenia'
            });
        }

        // Get user
        const users = await db.query(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Użytkownik nie znaleziony'
            });
        }

        const user = users[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'fail',
                message: 'Hasło jest nieprawidłowe'
            });
        }

        // Delete user (or mark as deleted)
        await db.query(
            'UPDATE users SET deleted_at = NOW(), active = 0 WHERE id = ?',
            [userId]
        );

        // Clear cookie
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.status(200).json({
            status: 'success',
            message: 'Konto zostało usunięte pomyślnie'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas usuwania konta'
        });
    }
};
