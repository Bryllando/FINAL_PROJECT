// login&register.js - Authentication JavaScript

let emailCheckTimeout;

// ==================== TOGGLE PASSWORD VISIBILITY ====================
function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const eyeIcon = document.getElementById(fieldId === 'password' ? 'eyeIconPassword' : 'eyeIconConfirm');

    if (!passwordInput || !eyeIcon) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
        `;
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        `;
    }
}

// ==================== EMAIL VALIDATION & AVAILABILITY CHECK ====================
function setupEmailValidation() {
    const emailInput = document.getElementById('email');
    if (!emailInput) return;

    emailInput.addEventListener('input', function () {
        const email = this.value.trim();
        const emailError = document.getElementById('emailError');
        const emailSuccess = document.getElementById('emailSuccess');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Clear previous timeout
        clearTimeout(emailCheckTimeout);

        // Hide messages
        if (emailError) emailError.classList.add('hidden');
        if (emailSuccess) emailSuccess.classList.add('hidden');
        this.classList.remove('border-red-500', 'border-green-500');

        if (!email) return;

        // Validate email format
        if (!emailRegex.test(email)) {
            if (emailError) {
                emailError.textContent = 'Please enter a valid email address';
                emailError.classList.remove('hidden');
                emailError.classList.add('text-red-600');
            }
            this.classList.add('border-red-500');
            return;
        }

        // Check email availability for register page
        if (emailSuccess && window.location.pathname === '/register') {
            emailCheckTimeout = setTimeout(() => {
                fetch('/api/check_email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.available) {
                            emailSuccess.textContent = '✓ Email is available';
                            emailSuccess.classList.remove('hidden');
                            emailInput.classList.add('border-green-500');
                        } else {
                            emailError.textContent = '✗ ' + data.message;
                            emailError.classList.remove('hidden');
                            emailError.classList.add('text-red-600');
                            emailInput.classList.add('border-red-500');
                        }
                    })
                    .catch(error => {
                        console.error('Error checking email:', error);
                    });
            }, 500);
        }
    });

    // Email validation on blur for login page
    emailInput.addEventListener('blur', function () {
        const email = this.value.trim();
        const emailError = document.getElementById('emailError');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email && !emailRegex.test(email) && emailError) {
            emailError.textContent = 'Please enter a valid email address';
            emailError.classList.remove('hidden');
            this.classList.add('border-red-500');
        } else if (emailError) {
            emailError.classList.add('hidden');
            this.classList.remove('border-red-500');
        }
    });
}

// ==================== PASSWORD STRENGTH CHECKER ====================
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;

    passwordInput.addEventListener('input', function () {
        const password = this.value;
        const strengthDiv = document.getElementById('passwordStrength');
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        const strengthFeedback = document.getElementById('strengthFeedback');

        if (!strengthDiv) return; // Only for register page

        if (!password) {
            strengthDiv.classList.add('hidden');
            return;
        }

        strengthDiv.classList.remove('hidden');

        // Calculate strength
        let score = 0;
        const feedback = [];

        if (password.length >= 8) score++;
        else feedback.push('At least 8 characters');

        if (/[A-Z]/.test(password)) score++;
        else feedback.push('One uppercase letter');

        if (/[a-z]/.test(password)) score++;
        else feedback.push('One lowercase letter');

        if (/\d/.test(password)) score++;
        else feedback.push('One number');

        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
        else feedback.push('One special character');

        // Update UI
        let strength, color, width;

        if (score <= 2) {
            strength = 'Weak';
            color = 'bg-red-500';
            width = '33%';
        } else if (score <= 3) {
            strength = 'Medium';
            color = 'bg-yellow-500';
            width = '66%';
        } else if (score <= 4) {
            strength = 'Strong';
            color = 'bg-green-500';
            width = '85%';
        } else {
            strength = 'Very Strong';
            color = 'bg-green-600';
            width = '100%';
        }

        if (strengthText) {
            strengthText.textContent = strength;
            strengthText.className = `text-sm font-bold ${color.replace('bg-', 'text-')}`;
        }

        if (strengthBar) {
            strengthBar.className = `h-full transition-all duration-300 ${color}`;
            strengthBar.style.width = width;
        }

        // Display feedback
        if (strengthFeedback) {
            if (feedback.length > 0) {
                strengthFeedback.innerHTML = feedback.map(item =>
                    `<li class="text-gray-600">• ${item}</li>`
                ).join('');
            } else {
                strengthFeedback.innerHTML = '<li class="text-green-600">• Password meets all requirements</li>';
            }
        }

        // Check if passwords match
        checkPasswordMatch();
    });
}

// ==================== PASSWORD MATCH CHECKER ====================
function checkPasswordMatch() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    const confirmError = document.getElementById('confirmError');
    const confirmSuccess = document.getElementById('confirmSuccess');

    if (!confirmPassword || !password) return;

    if (confirmError) confirmError.classList.add('hidden');
    if (confirmSuccess) confirmSuccess.classList.add('hidden');
    confirmPassword.classList.remove('border-red-500', 'border-green-500');

    if (!confirmPassword.value) return;

    if (password.value !== confirmPassword.value) {
        if (confirmError) {
            confirmError.textContent = '✗ Passwords do not match';
            confirmError.classList.remove('hidden');
        }
        confirmPassword.classList.add('border-red-500');
    } else {
        if (confirmSuccess) {
            confirmSuccess.textContent = '✓ Passwords match';
            confirmSuccess.classList.remove('hidden');
        }
        confirmPassword.classList.add('border-green-500');
    }
}

function setupPasswordMatch() {
    const confirmPassword = document.getElementById('confirm_password');
    if (!confirmPassword) return;

    confirmPassword.addEventListener('input', checkPasswordMatch);
}

// ==================== LOGIN FORM VALIDATION ====================
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function (e) {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            e.preventDefault();
            alert('Please fill in all fields');
            return false;
        }
    });
}

// ==================== REGISTER FORM VALIDATION ====================
function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        // Basic validation
        if (!email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return false;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return false;
        }

        // Password match validation
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return false;
        }

        // Password strength validation
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

        if (score < 3) {
            alert('Password is too weak. Please create a stronger password with at least 8 characters, including uppercase, lowercase, and numbers.');
            return false;
        }

        // Submit the form
        this.submit();
    });
}

// ==================== SUCCESS MODAL ====================
function setupSuccessModal() {
    const successModal = document.getElementById('successModal');
    if (!successModal) return;

    // Check if there's a success flash message
    const flashMessages = document.querySelectorAll('.bg-green-50');
    if (flashMessages.length > 0) {
        setTimeout(() => {
            successModal.classList.add('show');
        }, 100);
    }
}

function goToLogin() {
    window.location.href = '/login';
}

// ==================== FLASH MESSAGE AUTO-HIDE ====================
function setupFlashMessages() {
    const flashMessages = document.querySelectorAll('.animate-fade-in');

    flashMessages.forEach(message => {
        // Auto-hide after 5 seconds
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 5000);

        // Add close button functionality if exists
        const closeBtn = message.querySelector('.close-flash');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                message.style.opacity = '0';
                message.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    message.remove();
                }, 300);
            });
        }
    });
}

// ==================== INITIALIZE ON PAGE LOAD ====================
document.addEventListener('DOMContentLoaded', function () {
    // Setup all features
    setupEmailValidation();
    setupPasswordStrength();
    setupPasswordMatch();
    setupLoginForm();
    setupRegisterForm();
    setupSuccessModal();
    setupFlashMessages();

    console.log('Authentication system initialized');
});

// Make functions globally available
window.togglePassword = togglePassword;
window.checkPasswordMatch = checkPasswordMatch;
window.goToLogin = goToLogin;