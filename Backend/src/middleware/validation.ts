import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '../utils/errors';

// Helper to handle validation results
export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => `${err.type === 'field' ? err.path : 'unknown'}: ${err.msg}`)
      .join(', ');
    throw new ValidationError(errorMessages);
  }
  next();
};

// Password strength validation
const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number')
  .matches(/[!@#$%^&*(),.?":{}|<>]/)
  .withMessage('Password must contain at least one special character');

// Email validation
const emailValidation = body('email')
  .isEmail()
  .withMessage('Invalid email format')
  .normalizeEmail();

// Username validation
const usernameValidation = body('username')
  .isLength({ min: 3, max: 20 })
  .withMessage('Username must be between 3 and 20 characters')
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage('Username can only contain letters, numbers, and underscores');

// Validate registration
export const validateRegister: ValidationChain[] = [
  emailValidation,
  usernameValidation,
  passwordValidation,
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

// Validate login
export const validateLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Validate update profile
export const validateUpdateProfile: ValidationChain[] = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('Invalid URL format'),
];

// Validate change password
export const validateChangePassword: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  passwordValidation,
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

// Validate create module
export const validateCreateModule: ValidationChain[] = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('difficulty')
    .notEmpty()
    .withMessage('Difficulty is required')
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
    .withMessage('Invalid difficulty level'),
  body('points')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Points must be a positive integer'),
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string'),
];

// Validate create product
export const validateCreateProduct: ValidationChain[] = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category_id')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID format'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
];

// Validate create order
export const validateCreateOrder: ValidationChain[] = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Invalid product ID format'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('total_price')
    .notEmpty()
    .withMessage('Total price is required')
    .isFloat({ min: 0 })
    .withMessage('Total price must be a positive number'),
];

// Validate pagination
export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];

// Validate MongoDB/UUID ID
export const validateId = (paramName: string = 'id'): ValidationChain[] => [
  param(paramName)
    .notEmpty()
    .withMessage(`${paramName} is required`)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`),
];

// Validate create event
export const validateCreateEvent: ValidationChain[] = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
];

// Validate quiz submission
export const validateQuizSubmission: ValidationChain[] = [
  body('quiz_id')
    .notEmpty()
    .withMessage('Quiz ID is required')
    .isUUID()
    .withMessage('Invalid quiz ID format'),
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
];

// Export all validators with error handler
export const withValidation = (validators: ValidationChain[]) => [
  ...validators,
  handleValidationErrors,
];
