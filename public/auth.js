// =============================================
// Auth System - Login/Register
// =============================================

const API_BASE_URL = '/api';

// =============================================
// Password Toggle Functionality
// =============================================
function setupPasswordToggle(buttonId, inputId) {
    const toggleBtn = document.getElementById(buttonId);
    const passwordInput = document.getElementById(inputId);
    
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            const eyeIcon = toggleBtn.querySelector('.eye-icon');
            const eyeOffIcon = toggleBtn.querySelector('.eye-off-icon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                passwordInput.type = 'password';
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    }
}

// Setup password toggles
setupPasswordToggle('togglePassword', 'password');
setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

// =============================================
// Login Form Handler
// =============================================
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
    
    console.log('🎯 Form values:', { username, password: '***', rememberMe });
    
    if (!username || !password) {
        showErrorMessage('Lütfen tüm alanları doldurun');
        return;
    }
    
    try {
        // API'ye login isteği
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('🔍 Remember me checkbox value:', rememberMe);
            
            // Önce mevcut kullanıcı bilgilerini temizle (savedUsername ve savedPassword hariç)
            const savedUsername = localStorage.getItem('savedUsername');
            const savedPassword = localStorage.getItem('savedPassword');
            
            // Tüm storage'ı temizle
            localStorage.clear();
            sessionStorage.clear();
            
            // SavedUsername ve savedPassword'ü geri yükle (varsa)
            if (savedUsername) localStorage.setItem('savedUsername', savedUsername);
            if (savedPassword) localStorage.setItem('savedPassword', savedPassword);
            
            // User bilgilerini kaydet (rememberMe'ye göre localStorage veya sessionStorage)
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('isLoggedIn', 'true');
            storage.setItem('user', JSON.stringify(data.data));
            storage.setItem('userId', data.data.userId);
            storage.setItem('userID', data.data.userId); // Büyük harfle de kaydet (uyumluluk için)
            storage.setItem('username', data.data.username);
            
            // "Beni hatırla" işaretliyse kullanıcı bilgilerini kaydet
            if (rememberMe) {
                try {
                    localStorage.setItem('savedUsername', username);
                    localStorage.setItem('savedPassword', password);
                    console.log('💾 Credentials saved for Remember Me');
                } catch (err) {
                    console.error('❌ Failed to save credentials:', err);
                }
            } else {
                // Beni hatırla işaretli değilse, önceki kaydedilmiş bilgileri sil
                localStorage.removeItem('savedUsername');
                localStorage.removeItem('savedPassword');
                console.log('🗑️ Remember Me unchecked - credentials cleared');
            }
            
            // Show admin panel link if user is admin
            if (data.data.IsAdmin) {
                // Admin kullanıcısı direkt admin paneline gitsin
                showSuccessMessage('Admin girişi başarılı! Admin paneline yönlendiriliyorsunuz...');
                setTimeout(() => {
                    window.location.href = '/admin.html';
                }, 1000);
            } else {
                showSuccessMessage('Giriş başarılı! Yönlendiriliyorsunuz...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            }
        } else {
            showErrorMessage(data.message || 'Giriş başarısız. Kullanıcı adı veya şifre hatalı.');
        }
    } catch (error) {
        console.error('Giriş hatası:', error);
        showErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
});

// =============================================
// Register Form Handler
// =============================================
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validasyon
    if (!username || !email || !password || !confirmPassword) {
        showErrorMessage('Lütfen tüm alanları doldurun');
        return;
    }
    
    if (username.length < 3) {
        showErrorMessage('Kullanıcı adı en az 3 karakter olmalıdır');
        return;
    }
    
    if (password.length < 6) {
        showErrorMessage('Şifre en az 6 karakter olmalıdır');
        return;
    }
    
    if (password !== confirmPassword) {
        showErrorMessage('Şifreler eşleşmiyor');
        return;
    }
    
    try {
        // API'ye register isteği
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccessMessage('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } else {
            showErrorMessage(data.message || 'Kayıt başarısız. Bu kullanıcı adı veya e-posta zaten kullanılıyor olabilir.');
        }
    } catch (error) {
        console.error('Kayıt hatası:', error);
        showErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
});

// =============================================
// Check if already logged in & Load saved credentials
// =============================================
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    const isLoginPage = window.location.pathname.includes('login') || window.location.pathname === '/login.html';
    const isRegisterPage = window.location.pathname.includes('register') || window.location.pathname === '/register.html';
    
    // If already logged in, redirect to home
    if (isLoggedIn && (isLoginPage || isRegisterPage)) {
        window.location.href = '/';
        return user ? JSON.parse(user) : null;
    }
    
    // Load saved credentials if on login page and not logged in
    if (isLoginPage && !user) {
        const savedUsername = localStorage.getItem('savedUsername');
        const savedPassword = localStorage.getItem('savedPassword');
        
        if (savedUsername && savedPassword) {
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const rememberMeCheckbox = document.getElementById('rememberMe');
            
            if (usernameInput) usernameInput.value = savedUsername;
            if (passwordInput) passwordInput.value = savedPassword;
            if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
        }
    }
    
    return user ? JSON.parse(user) : null;
}

// =============================================
// Logout Function
// =============================================
function logout() {
    // Remove session data (keep savedUsername and savedPassword for Remember Me)
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('username');
    
    window.location.href = '/login.html';
}

// =============================================
// Success/Error Message Display
// =============================================
function showSuccessMessage(message) {
    const existingToast = document.querySelector('.auth-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'auth-toast auth-toast-success';
    toast.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function showErrorMessage(message) {
    const existingToast = document.querySelector('.auth-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'auth-toast auth-toast-error';
    toast.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Check if user is already logged in and is admin
window.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    if (user && user.IsAdmin) {
        const adminLink = document.getElementById('adminPanelLink');
        if (adminLink) {
            adminLink.style.display = 'inline-flex';
        }
    }
});

// =============================================
// Run on page load
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
