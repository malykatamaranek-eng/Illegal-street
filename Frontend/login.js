// ===== Login Form Validation =====
document.addEventListener('DOMContentLoaded', () => {
    initLoginForm();
    initPasswordToggle();
    initSocialLogin();
});

// ===== Login Form =====
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) return;

    loginForm.addEventListener('submit', handleLoginSubmit);

    // Real-time validation
    const username = document.getElementById('username');
    const password = document.getElementById('password');

    if (username) {
        username.addEventListener('blur', () => validateUsername());
        username.addEventListener('input', () => {
            if (username.classList.contains('error')) {
                validateUsername();
            }
        });
    }

    if (password) {
        password.addEventListener('blur', () => validatePassword());
        password.addEventListener('input', () => {
            if (password.classList.contains('error')) {
                validatePassword();
            }
        });
    }
}

function handleLoginSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('.btn-login-submit');
    
    // Validate fields
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();

    if (isUsernameValid && isPasswordValid) {
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Simulate login process
        setTimeout(() => {
            // Hide loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;

            // Show success message
            const successMsg = document.getElementById('loginSuccess');
            successMsg.classList.add('show');

            // Clear form
            form.reset();
            clearLoginErrors();

            // Simulate redirect
            setTimeout(() => {
                // In a real application, redirect to dashboard
                console.log('Login successful! Redirecting...');
                // window.location.href = 'dashboard.html';
            }, 2000);
        }, 1500);
    }
}

function validateUsername() {
    const username = document.getElementById('username');
    const error = document.getElementById('usernameError');
    const value = username.value.trim();

    if (!value) {
        showError(username, error, 'Nazwa użytkownika jest wymagana');
        return false;
    } else if (value.length < 3) {
        showError(username, error, 'Nazwa użytkownika musi mieć co najmniej 3 znaki');
        return false;
    } else {
        clearError(username, error);
        return true;
    }
}

function validatePassword() {
    const password = document.getElementById('password');
    const error = document.getElementById('passwordError');
    const value = password.value;

    if (!value) {
        showError(password, error, 'Hasło jest wymagane');
        return false;
    } else if (value.length < 6) {
        showError(password, error, 'Hasło musi mieć co najmniej 6 znaków');
        return false;
    } else {
        clearError(password, error);
        return true;
    }
}

function showError(input, errorElement, message) {
    input.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearError(input, errorElement) {
    input.classList.remove('error');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

function clearLoginErrors() {
    const inputs = document.querySelectorAll('#loginForm input');
    inputs.forEach(input => {
        input.classList.remove('error');
    });

    const errors = document.querySelectorAll('#loginForm .form-error');
    errors.forEach(error => {
        error.textContent = '';
    });
}

// ===== Password Toggle =====
function initPasswordToggle() {
    const toggleBtn = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type');
            
            if (type === 'password') {
                passwordInput.setAttribute('type', 'text');
                toggleBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
                toggleBtn.setAttribute('aria-label', 'Ukryj hasło');
            } else {
                passwordInput.setAttribute('type', 'password');
                toggleBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
                toggleBtn.setAttribute('aria-label', 'Pokaż hasło');
            }
        });
    }
}

// ===== Social Login =====
function initSocialLogin() {
    const socialButtons = document.querySelectorAll('.social-login-btn');
    
    socialButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = btn.classList.contains('facebook') ? 'Facebook' : 'Google';
            
            // Add click animation
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 200);

            // Simulate social login
            console.log(`Logging in with ${provider}...`);
            alert(`Logowanie przez ${provider} będzie dostępne wkrótce!`);
        });
    });
}

// ===== Enhanced Input Effects =====
document.querySelectorAll('.login-form input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});

// ===== Forgot Password Link =====
const forgotLink = document.querySelector('.forgot-link');
if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Funkcja resetowania hasła będzie dostępna wkrótce!\n\nSkontaktuj się z administratorem: contact@illegalstreet.pl');
    });
}

// ===== Register Link =====
const registerLink = document.querySelector('.register-link');
if (registerLink) {
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Rejestracja nowych członków będzie dostępna wkrótce!\n\nAby dołączyć do ekipy, skontaktuj się z nami przez formularz kontaktowy.');
    });
}
