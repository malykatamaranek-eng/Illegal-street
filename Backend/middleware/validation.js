/**
 * Input Validation Middleware
 * Protects against injection attacks and validates input
 */

const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'fail',
            message: 'Błąd walidacji danych',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    
    next();
};

// Login validation
exports.validateLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Nazwa użytkownika jest wymagana')
        .isLength({ min: 3, max: 50 })
        .withMessage('Nazwa użytkownika musi mieć od 3 do 50 znaków')
        .matches(/^[a-zA-Z0-9_@.+-]+$/)
        .withMessage('Nazwa użytkownika zawiera niedozwolone znaki'),
    
    body('password')
        .notEmpty()
        .withMessage('Hasło jest wymagane')
        .isLength({ min: 6 })
        .withMessage('Hasło musi mieć co najmniej 6 znaków'),
    
    body('remember')
        .optional()
        .isBoolean()
        .withMessage('Pole "zapamiętaj mnie" musi być wartością logiczną'),
    
    handleValidationErrors
];

// Registration validation
exports.validateRegister = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Nazwa użytkownika jest wymagana')
        .isLength({ min: 3, max: 50 })
        .withMessage('Nazwa użytkownika musi mieć od 3 do 50 znaków')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email jest wymagany')
        .isEmail()
        .withMessage('Podaj prawidłowy adres email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Hasło jest wymagane')
        .isLength({ min: 8 })
        .withMessage('Hasło musi mieć co najmniej 8 znaków')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Hasło musi zawierać co najmniej jedną wielką literę, jedną małą literę, jedną cyfrę i jeden znak specjalny')
        .custom((value, { req }) => {
            // Enhanced password requirements for admin/moderator roles
            if ((req.body.role === 'admin' || req.body.role === 'moderator')) {
                const minLength = parseInt(process.env.ADMIN_PASSWORD_MIN_LENGTH) || 12;
                if (value.length < minLength) {
                    throw new Error(`Hasło administratora musi mieć co najmniej ${minLength} znaków`);
                }
            }
            return true;
        }),
    
    body('role')
        .optional()
        .isIn(['user', 'admin', 'moderator'])
        .withMessage('Nieprawidłowa rola użytkownika'),
    
    handleValidationErrors
];

// Update profile validation
exports.validateUpdateProfile = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Nazwa użytkownika musi mieć od 3 do 50 znaków')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia'),
    
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Podaj prawidłowy adres email')
        .normalizeEmail(),
    
    handleValidationErrors
];

// Change password validation
exports.validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Aktualne hasło jest wymagane'),
    
    body('newPassword')
        .notEmpty()
        .withMessage('Nowe hasło jest wymagane')
        .isLength({ min: 8 })
        .withMessage('Nowe hasło musi mieć co najmniej 8 znaków')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Nowe hasło musi zawierać co najmniej jedną wielką literę, jedną małą literę, jedną cyfrę i jeden znak specjalny'),
    
    handleValidationErrors
];

// Forgot password validation
exports.validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email jest wymagany')
        .isEmail()
        .withMessage('Podaj prawidłowy adres email')
        .normalizeEmail(),
    
    handleValidationErrors
];

// Reset password validation
exports.validateResetPassword = [
    body('password')
        .notEmpty()
        .withMessage('Hasło jest wymagane')
        .isLength({ min: 8 })
        .withMessage('Hasło musi mieć co najmniej 8 znaków')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Hasło musi zawierać co najmniej jedną wielką literę, jedną małą literę, jedną cyfrę i jeden znak specjalny'),
    
    handleValidationErrors
];

// Sanitize input - remove potentially dangerous characters
exports.sanitizeInput = (req, res, next) => {
    // Recursively sanitize all string values in req.body
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove HTML tags
                obj[key] = obj[key].replace(/<[^>]*>/g, '');
                // Remove SQL injection patterns
                obj[key] = obj[key].replace(/['";\\]/g, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };
    
    if (req.body) {
        sanitize(req.body);
    }
    
    next();
};
