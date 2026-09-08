const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

// ===== CHECK IF ALREADY LOGGED IN =====
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            window.location.href = '/dashboard';
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

// ===== LOGIN FORM SUBMIT =====
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Reset error
    loginError.classList.remove('show');
    loginError.textContent = '';

    // Validate
    if (!username || !password) {
        loginError.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
        loginError.classList.add('show');
        return;
    }

    // Disable submit button
    const submitBtn = this.querySelector('.btn-login');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري التحقق...';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            // Store token and user info
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('isLoggedIn', 'true');

            // Redirect to dashboard
            window.location.href = '/dashboard';
        } else {
            loginError.textContent = result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
            loginError.classList.add('show');
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'حدث خطأ في الاتصال بالخادم، حاول مرة أخرى';
        loginError.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// ===== KEYBOARD SUPPORT =====
document.getElementById('password').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

document.getElementById('username').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('password').focus();
    }
});

// ===== INIT =====
checkAuth();

// Add some style enhancements
const style = document.createElement('style');
style.textContent = `
    .login-error {
        display: none;
        color: #dc2626;
        font-size: 14px;
        text-align: center;
        margin-top: 16px;
        padding: 10px;
        background: #fee2e2;
        border-radius: 8px;
        border-right: 4px solid #dc2626;
    }
    .login-error.show {
        display: block;
    }
    .btn-login:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);
