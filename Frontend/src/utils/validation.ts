// ===== Validation Utility =====
// Input validation and sanitization functions

export class Validator {
  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Password strength validation
  static validatePassword(password: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    errors: string[];
  } {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (password.length < 8) {
      errors.push('Hasło musi mieć minimum 8 znaków');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Hasło musi zawierać małą literę');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Hasło musi zawierać wielką literę');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Hasło musi zawierać cyfrę');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Hasło musi zawierać znak specjalny');
    }

    // Calculate strength
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const strengthScore = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars, isLongEnough].filter(Boolean).length;

    if (strengthScore >= 5) {
      strength = 'strong';
    } else if (strengthScore >= 3) {
      strength = 'medium';
    }

    return {
      isValid: errors.length === 0,
      strength,
      errors
    };
  }

  // Username validation
  static isValidUsername(username: string): { isValid: boolean; error?: string } {
    if (username.length < 3) {
      return { isValid: false, error: 'Nazwa użytkownika musi mieć minimum 3 znaki' };
    }
    if (username.length > 20) {
      return { isValid: false, error: 'Nazwa użytkownika może mieć maksymalnie 20 znaków' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { isValid: false, error: 'Nazwa użytkownika może zawierać tylko litery, cyfry, _ i -' };
    }
    return { isValid: true };
  }

  // Phone number validation
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  // URL validation
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Sanitize HTML to prevent XSS
  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  // Sanitize input for display
  static sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Credit card validation (Luhn algorithm)
  static isValidCreditCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (!/^\d+$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Required field validation
  static isRequired(value: any): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  }

  // Min length validation
  static minLength(value: string, min: number): boolean {
    return value.length >= min;
  }

  // Max length validation
  static maxLength(value: string, max: number): boolean {
    return value.length <= max;
  }

  // Number range validation
  static inRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  // Match validation (for password confirmation)
  static matches(value: string, compareValue: string): boolean {
    return value === compareValue;
  }
}

// Export convenience functions
export const {
  isValidEmail,
  validatePassword,
  isValidUsername,
  isValidPhone,
  isValidURL,
  sanitizeHTML,
  sanitizeInput,
  isValidCreditCard,
  isRequired,
  minLength,
  maxLength,
  inRange,
  matches
} = Validator;
