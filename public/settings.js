// =============================================
// Settings Page JavaScript
// =============================================

const API_BASE_URL = '/api';

// Check authentication
window.addEventListener('DOMContentLoaded', () => {
    const loggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
    if (!loggedIn) {
        window.location.href = '/login.html';
        return;
    }

    // Load user info
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    const userId = localStorage.getItem('userID') || localStorage.getItem('userId') || 
                   sessionStorage.getItem('userID') || sessionStorage.getItem('userId');
    
    if (username) {
        const displayName = document.getElementById('userDisplayName');
        if (displayName) {
            displayName.textContent = username;
        }
        
        // Set username in input
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) {
            usernameInput.value = username;
        }
    }
    
    // Load avatar and email if user is logged in
    if (userId) {
        loadUserAvatar(userId);
        loadUserEmail(userId);
    }

    // Setup profile dropdown
    setupProfileDropdown();
    
    // Load settings from localStorage
    loadSettings();
    
    // Restore player state
    restorePlayerState();
    
    // Show player by default if no saved state
    setTimeout(() => {
        const savedState = localStorage.getItem('playerState');
        if (!savedState) {
            const stickyPlayer = document.getElementById('stickyPlayer');
            if (stickyPlayer) {
                stickyPlayer.style.display = 'flex';
            }
        }
    }, 500);
});

// Load user avatar
async function loadUserAvatar(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        const user = await response.json();
        
        const avatar = document.getElementById('userAvatar')?.querySelector('img');
        if (avatar) {
            let avatarUrl = user.AvatarUrl;
            if (!avatarUrl || avatarUrl.startsWith('/avatars/')) {
                avatarUrl = `https://i.pravatar.cc/150?u=${user.Username}`;
            }
            avatar.src = avatarUrl;
            avatar.onerror = function() {
                this.src = `https://i.pravatar.cc/150?u=${user.Username}`;
            };
        }
    } catch (error) {
        console.error('Error loading avatar:', error);
    }
}

// Load user email
async function loadUserEmail(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        const user = await response.json();
        
        const emailInput = document.getElementById('emailInput');
        if (emailInput && user.Email) {
            emailInput.value = user.Email;
        }
    } catch (error) {
        console.error('Error loading user email:', error);
    }
}

// Setup profile dropdown
function setupProfileDropdown() {
    const userAvatar = document.getElementById('userAvatar');
    const dropdown = document.getElementById('userDropdown');
    
    if (userAvatar && dropdown) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });
    }
    
    // Profile button click
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            const userId = localStorage.getItem('userID') || localStorage.getItem('userId') || 
                          sessionStorage.getItem('userID') || sessionStorage.getItem('userId');
            if (userId) {
                window.location.href = `profile.html?id=${userId}`;
            }
        });
    }
}

// Toggle setting
function toggleSetting(settingName) {
    const toggle = document.getElementById(`${settingName}Toggle`);
    if (!toggle) return;
    
    toggle.classList.toggle('active');
    
    // Save to localStorage
    const isActive = toggle.classList.contains('active');
    localStorage.setItem(`setting_${settingName}`, isActive);
    
    showSaveIndicator();
}

// Save setting
function saveSetting(settingName) {
    let element = document.getElementById(settingName);
    if (!element) {
        element = document.getElementById(`${settingName}Select`);
    }
    
    if (!element) {
        console.error('Setting element not found:', settingName);
        return;
    }
    
    const value = element.value;
    localStorage.setItem(`setting_${settingName}`, value);
    
    console.log('Setting saved:', settingName, '=', value);
    
    // Apply language if changed
    if (settingName === 'language') {
        if (typeof window.changeLanguage === 'function') {
            window.changeLanguage(value);
        }
    }
    
    showSaveIndicator();
}

// Load settings
function loadSettings() {
    // Load toggle settings
    const toggleSettings = [
        'profilePrivacy', 'autoPublic', 'showLikes',
        'emailNotif', 'commentNotif', 'autoplay', 'crossfade'
    ];
    
    toggleSettings.forEach(setting => {
        const toggle = document.getElementById(`${setting}Toggle`);
        if (toggle) {
            const saved = localStorage.getItem(`setting_${setting}`);
            if (saved === 'true') {
                toggle.classList.add('active');
            } else if (saved === 'false') {
                toggle.classList.remove('active');
            }
        }
    });
    
    // Load select settings
    const audioQuality = localStorage.getItem('setting_audioQuality');
    if (audioQuality) {
        document.getElementById('audioQuality').value = audioQuality;
    }
    
    const language = localStorage.getItem('setting_language');
    if (language) {
        document.getElementById('languageSelect').value = language;
    }
}

// Show save indicator
function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    if (!indicator) return;
    
    indicator.classList.add('show');
    
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

// Change password
function changePassword() {
    // Basit bir modal ile şifre değiştirme
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;" id="passwordModal">
            <div style="background: var(--bg-secondary); padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                <h3 style="margin-bottom: 20px; color: var(--text-primary);">Şifre Değiştir</h3>
                <input type="password" id="currentPassword" placeholder="Mevcut Şifre" style="width: 100%; padding: 12px; margin-bottom: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                <input type="password" id="newPassword" placeholder="Yeni Şifre" style="width: 100%; padding: 12px; margin-bottom: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                <input type="password" id="confirmPassword" placeholder="Yeni Şifre (Tekrar)" style="width: 100%; padding: 12px; margin-bottom: 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                <div style="display: flex; gap: 10px;">
                    <button onclick="submitPasswordChange()" style="flex: 1; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Değiştir</button>
                    <button onclick="closePasswordModal()" style="flex: 1; padding: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">İptal</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.remove();
}

function submitPasswordChange() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Lütfen tüm alanları doldurun', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Yeni şifreler eşleşmiyor!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Şifre en az 6 karakter olmalıdır', 'error');
        return;
    }
    
    // Get user ID
    const userFromLocal = localStorage.getItem('user');
    const userFromSession = sessionStorage.getItem('user');
    const user = JSON.parse(userFromLocal || userFromSession || 'null');
    
    console.log('Password change - User from storage:', user);
    console.log('Password change - UserID:', user?.UserID);
    console.log('Password change - userId:', user?.userId);
    
    if (!user || (!user.UserID && !user.userId)) {
        showToast('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.', 'error');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return;
    }
    
    const userId = user.UserID || user.userId;
    
    // API call
    fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: userId,
            currentPassword: currentPassword,
            newPassword: newPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Şifre başarıyla değiştirildi!', 'success');
            closePasswordModal();
            
            // Update password in storage if needed
            if (userFromLocal) {
                const userData = JSON.parse(userFromLocal);
                userData.PasswordHash = newPassword;
                localStorage.setItem('user', JSON.stringify(userData));
            }
            if (userFromSession) {
                const userData = JSON.parse(userFromSession);
                userData.PasswordHash = newPassword;
                sessionStorage.setItem('user', JSON.stringify(userData));
            }
        } else {
            showToast(data.message || 'Şifre değiştirilemedi', 'error');
        }
    })
    .catch(error => {
        console.error('Password change error:', error);
        showToast('Bir hata oluştu', 'error');
    });
}

// Deactivate account
function deactivateAccount() {
    if (!confirm('Hesabınızı devre dışı bırakmak istediğinizden emin misiniz? Bu işlem geri alınabilir.')) return;
    
    showToast('Hesap devre dışı bırakma özelliği yakında aktif edilecek', 'info');
}

// Delete account
function deleteAccount() {
    if (!confirm('Hesabınızı SİLMEK istediğinizden emin misiniz?\n\nBu işlem GERİ ALINAMAZ ve tüm verileriniz kalıcı olarak silinecektir!')) return;
    
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    const confirmUsername = prompt(`Devam etmek için kullanıcı adınızı yazın: "${username}"`);
    
    if (confirmUsername !== username) {
        showToast('Kullanıcı adı eşleşmiyor. İşlem iptal edildi.', 'error');
        return;
    }
    
    showToast('Hesap silme özelliği yakında aktif edilecek', 'info');
}

// Open Feedback Modal
function openFeedbackModal() {
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;" id="feedbackModal" onclick="if(event.target.id === 'feedbackModal') closeFeedbackModal()">
            <div style="background: var(--bg-secondary); padding: 30px; border-radius: 12px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h3 style="margin-bottom: 20px; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Geri Bildirim Gönder
                </h3>
                <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 14px;">Uygulamamızı daha iyi hale getirmemize yardımcı olun</p>
                
                <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Kategori</label>
                <select id="feedbackCategory" style="width: 100%; padding: 12px; margin-bottom: 16px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                    <option value="general">Genel Geri Bildirim</option>
                    <option value="ui">Kullanıcı Arayüzü</option>
                    <option value="performance">Performans</option>
                    <option value="feature">Özellik İsteği</option>
                    <option value="other">Diğer</option>
                </select>
                
                <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Mesajınız</label>
                <textarea id="feedbackMessage" placeholder="Geri bildiriminizi buraya yazın..." style="width: 100%; padding: 12px; margin-bottom: 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); min-height: 150px; resize: vertical; font-family: inherit;"></textarea>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="submitFeedback()" style="flex: 1; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Gönder</button>
                    <button onclick="closeFeedbackModal()" style="flex: 1; padding: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">İptal</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) modal.remove();
}

async function submitFeedback() {
    const category = document.getElementById('feedbackCategory').value;
    const message = document.getElementById('feedbackMessage').value;
    
    console.log('submitFeedback called:', { category, message });
    
    if (!message.trim()) {
        console.log('Message empty, showing error toast');
        showToast('Lütfen geri bildiriminizi yazın', 'error');
        return;
    }
    
    try {
        const userFromLocal = localStorage.getItem('user');
        const userFromSession = sessionStorage.getItem('user');
        const user = JSON.parse(userFromLocal || userFromSession);
        
        console.log('User:', user);
        
        if (!user) {
            console.log('No user, showing error toast');
            showToast('Lütfen giriş yapın', 'error');
            return;
        }
        
        console.log('Sending API request...');
        const response = await fetch('/api/feedback/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.UserID || user.userId,
                type: 'feedback',
                category: category,
                message: message
            })
        });
        
        const data = await response.json();
        console.log('API response:', data);
        
        if (data.success) {
            console.log('Success, showing success toast');
            showToast('Geri bildiriminiz alındı. Teşekkürler! 🙏', 'success');
            closeFeedbackModal();
        } else {
            console.log('Failed, showing error toast');
            showToast(data.message || 'Bir hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Feedback error:', error);
        showToast('Bağlantı hatası', 'error');
    }
}

// Open Complaint Modal
function openComplaintModal() {
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;" id="complaintModal" onclick="if(event.target.id === 'complaintModal') closeComplaintModal()">
            <div style="background: var(--bg-secondary); padding: 30px; border-radius: 12px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h3 style="margin-bottom: 20px; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Şikayet Bildir
                </h3>
                <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 14px;">Karşılaştığınız sorunu detaylı olarak açıklayın</p>
                
                <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Şikayet Konusu</label>
                <select id="complaintType" style="width: 100%; padding: 12px; margin-bottom: 16px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                    <option value="bug">Hata/Bug</option>
                    <option value="content">İçerik Sorunu</option>
                    <option value="account">Hesap Sorunu</option>
                    <option value="payment">Ödeme Sorunu</option>
                    <option value="abuse">Kötüye Kullanım</option>
                    <option value="other">Diğer</option>
                </select>
                
                <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Şikayetiniz</label>
                <textarea id="complaintMessage" placeholder="Sorunu detaylı olarak açıklayın..." style="width: 100%; padding: 12px; margin-bottom: 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); min-height: 150px; resize: vertical; font-family: inherit;"></textarea>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="submitComplaint()" style="flex: 1; padding: 12px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Gönder</button>
                    <button onclick="closeComplaintModal()" style="flex: 1; padding: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">İptal</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeComplaintModal() {
    const modal = document.getElementById('complaintModal');
    if (modal) modal.remove();
}

async function submitComplaint() {
    const type = document.getElementById('complaintType').value;
    const message = document.getElementById('complaintMessage').value;
    
    if (!message.trim()) {
        showToast('Lütfen şikayetinizi açıklayın', 'error');
        return;
    }
    
    try {
        const userFromLocal = localStorage.getItem('user');
        const userFromSession = sessionStorage.getItem('user');
        const user = JSON.parse(userFromLocal || userFromSession);
        
        if (!user) {
            showToast('Lütfen giriş yapın', 'error');
            return;
        }
        
        const response = await fetch('/api/feedback/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.UserID || user.userId,
                type: 'complaint',
                category: type,
                message: message
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Şikayetiniz alındı. En kısa sürede değerlendirilerek size dönüş yapılacaktır.', 'success');
            closeComplaintModal();
        } else {
            showToast(data.message || 'Bir hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Complaint error:', error);
        showToast('Bağlantı hatası', 'error');
    }
}

// Open Suggestion Modal
function openSuggestionModal() {
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;" id="suggestionModal" onclick="if(event.target.id === 'suggestionModal') closeSuggestionModal()">
            <div style="background: var(--bg-secondary); padding: 30px; border-radius: 12px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h3 style="margin-bottom: 20px; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    Öneri Sunun
                </h3>
                <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 14px;">Yeni özellik fikirlerinizi bizimle paylaşın</p>
                
                <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Öneri Başlığı</label>
                <input type="text" id="suggestionTitle" placeholder="Önerinizi kısaca özetleyin" style="width: 100%; padding: 12px; margin-bottom: 16px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                
                <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Detaylı Açıklama</label>
                <textarea id="suggestionMessage" placeholder="Önerinizi detaylı olarak açıklayın..." style="width: 100%; padding: 12px; margin-bottom: 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); min-height: 150px; resize: vertical; font-family: inherit;"></textarea>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="submitSuggestion()" style="flex: 1; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Gönder</button>
                    <button onclick="closeSuggestionModal()" style="flex: 1; padding: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">İptal</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeSuggestionModal() {
    const modal = document.getElementById('suggestionModal');
    if (modal) modal.remove();
}

async function submitSuggestion() {
    const title = document.getElementById('suggestionTitle').value;
    const message = document.getElementById('suggestionMessage').value;
    
    if (!title.trim() || !message.trim()) {
        showToast('Lütfen tüm alanları doldurun', 'error');
        return;
    }
    
    try {
        const userFromLocal = localStorage.getItem('user');
        const userFromSession = sessionStorage.getItem('user');
        const user = JSON.parse(userFromLocal || userFromSession);
        
        if (!user) {
            showToast('Lütfen giriş yapın', 'error');
            return;
        }
        
        const response = await fetch('/api/feedback/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.UserID || user.userId,
                type: 'suggestion',
                title: title,
                message: message
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Öneriniz için teşekkürler! Değerlendirmeye alınacaktır. 💡', 'success');
            closeSuggestionModal();
        } else {
            showToast(data.message || 'Bir hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Suggestion error:', error);
        showToast('Bağlantı hatası', 'error');
    }
}

// Logout
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login.html';
}

// Restore player state
function restorePlayerState() {
    const savedState = localStorage.getItem('playerState');
    if (!savedState) return;
    
    try {
        const state = JSON.parse(savedState);
        const timeDiff = (Date.now() - state.timestamp) / 1000;
        
        if (timeDiff < 3600) {
            document.getElementById('stickyPlayer').style.display = 'flex';
            
            const coverImg = document.getElementById('playerCover');
            if (state.track.CoverImageUrl) {
                coverImg.src = state.track.CoverImageUrl;
            } else {
                coverImg.src = `https://picsum.photos/80/80?random=${state.track.TrackID}`;
            }
            
            document.getElementById('playerTitle').textContent = state.track.Title;
            document.getElementById('playerArtist').textContent = state.track.Username || state.track.ArtistName || 'Unknown Artist';
            document.getElementById('totalTime').textContent = formatTime(state.track.Duration);
            document.getElementById('progressSlider').value = state.progress;
            document.getElementById('progressFill').style.width = `${state.progress}%`;
            
            // Add click handlers for navigation
            const playerCoverWrapper = document.getElementById('playerCoverWrapper');
            const playerTitle = document.getElementById('playerTitle');
            const playerArtist = document.getElementById('playerArtist');
            
            if (playerCoverWrapper && state.track.TrackID) {
                playerCoverWrapper.onclick = () => window.location.href = `track-detail.html?id=${state.track.TrackID}`;
            }
            if (playerTitle && state.track.TrackID) {
                playerTitle.onclick = () => window.location.href = `track-detail.html?id=${state.track.TrackID}`;
            }
            if (playerArtist && state.track.UserID) {
                playerArtist.onclick = () => window.location.href = `profile.html?id=${state.track.UserID}`;
            }
            
            const currentSeconds = Math.floor((state.progress / 100) * state.track.Duration);
            document.getElementById('currentTime').textContent = formatTime(currentSeconds);
        }
    } catch (error) {
        console.error('Error restoring player state:', error);
    }
}

// Format time
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
