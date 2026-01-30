export class Validator {
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static validatePassword(password) {
        const errors = [];
        let strength = 'weak';
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
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;
        const strengthScore = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars, isLongEnough].filter(Boolean).length;
        if (strengthScore >= 5) {
            strength = 'strong';
        }
        else if (strengthScore >= 3) {
            strength = 'medium';
        }
        return {
            isValid: errors.length === 0,
            strength,
            errors
        };
    }
    static isValidUsername(username) {
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
    static isValidPhone(phone) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s-]/g, ''));
    }
    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    static sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    static sanitizeInput(input) {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    static isValidCreditCard(cardNumber) {
        const cleaned = cardNumber.replace(/[\s-]/g, '');
        if (!/^\d+$/.test(cleaned))
            return false;
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
    static isRequired(value) {
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }
        return value !== null && value !== undefined;
    }
    static minLength(value, min) {
        return value.length >= min;
    }
    static maxLength(value, max) {
        return value.length <= max;
    }
    static inRange(value, min, max) {
        return value >= min && value <= max;
    }
    static matches(value, compareValue) {
        return value === compareValue;
    }
}
export const { isValidEmail, validatePassword, isValidUsername, isValidPhone, isValidURL, sanitizeHTML, sanitizeInput, isValidCreditCard, isRequired, minLength, maxLength, inRange, matches } = Validator;
//# sourceMappingURL=validation.js.map