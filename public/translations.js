// Translation System
const translations = {
    tr: {
        // Navigation
        'nav.home': 'Ana Sayfa',
        'nav.explore': 'Keşfet',
        'nav.library': 'Kitaplığım',
        'nav.upload': 'Yükle',
        'nav.profile': 'Profilim',
        'nav.settings': 'Ayarlar',
        'nav.logout': 'Çıkış Yap',
        'nav.searchPlaceholder': 'Şarkı, sanatçı veya albüm ara...',
        
        // Settings Page
        'settings.title': 'Ayarlar',
        'settings.account': 'Hesap Ayarları',
        'settings.privacy': 'Gizlilik',
        'settings.notifications': 'Bildirimler',
        'settings.audio': 'Ses Ayarları',
        'settings.appearance': 'Görünüm',
        'settings.language': 'Dil',
        'settings.feedback': 'Geri Bildirim',
        'settings.about': 'Hakkında',
        
        // Account Settings
        'account.username': 'Kullanıcı Adı',
        'account.usernameDesc': 'Profilinizde görünen kullanıcı adınız',
        'account.email': 'E-posta Adresi',
        'account.emailDesc': 'Hesabınızla ilişkili e-posta adresiniz',
        'account.password': 'Şifre',
        'account.passwordDesc': 'Hesap şifrenizi değiştirin',
        'account.changePassword': 'Şifre Değiştir',
        'account.deleteAccount': 'Hesabı Sil',
        
        // Privacy
        'privacy.profile': 'Profil Gizliliği',
        'privacy.profileDesc': 'Profilinizi herkese açık yapın veya gizleyin',
        'privacy.autoPublic': 'Şarkıları Otomatik Yayınla',
        'privacy.autoPublicDesc': 'Yüklediğiniz şarkılar otomatik olarak herkese açık olsun',
        'privacy.showLikes': 'Beğenileri Göster',
        'privacy.showLikesDesc': 'Beğendiğiniz şarkılar profilinizde görünsün',
        'privacy.activity': 'Aktivite Gizliliği',
        'privacy.activityDesc': 'Dinleme geçmişinizi paylaşın',
        
        // Notifications
        'notifications.title': 'Bildirim Ayarları',
        'notifications.email': 'E-posta Bildirimleri',
        'notifications.emailDesc': 'Yeni takipçi ve beğeniler için e-posta alın',
        'notifications.comment': 'Yorum Bildirimleri',
        'notifications.commentDesc': 'Şarkılarınıza yapılan yorumlar için bildirim alın',
        'notifications.push': 'Push Bildirimleri',
        'notifications.pushDesc': 'Tarayıcı bildirimleri',
        
        // Audio/Playback
        'audio.title': 'Oynatma Ayarları',
        'audio.quality': 'Ses Kalitesi',
        'audio.qualityDesc': 'Yüksek kalite daha fazla veri kullanır',
        'audio.autoplay': 'Otomatik Oynat',
        'audio.autoplayDesc': 'Şarkı bitince otomatik devam et',
        'audio.crossfade': 'Crossfade',
        'audio.crossfadeDesc': 'Şarkılar arası yumuşak geçiş',
        
        // Appearance
        'appearance.title': 'Görünüm',
        'appearance.theme': 'Tema',
        'appearance.themeDesc': 'Aydınlık, koyu veya sistem temasını seçin',
        
        // Language
        'language.select': 'Dil Seçin',
        'language.selectDesc': 'Uygulama dilini seçin',
        
        // Feedback
        'feedback.send': 'Geri Bildirim Gönder',
        'feedback.sendDesc': 'Uygulama hakkında düşüncelerinizi bizimle paylaşın',
        'feedback.complaint': 'Şikayet Bildir',
        'feedback.complaintDesc': 'Bir sorun mu yaşıyorsunuz? Bize bildirin',
        'feedback.suggestion': 'Öneri Sunun',
        'feedback.suggestionDesc': 'Yeni özellik fikirleri paylaşın',
        
        // About
        'about.title': 'Hakkında',
        'about.version': 'Sürüm',
        'about.versionDesc': 'Mevcut uygulama sürümü',
        'about.lastUpdate': 'Son Güncelleme',
        'about.lastUpdateDesc': 'En son güncelleme tarihi',
        'about.developer': 'Geliştirici',
        'about.developerDesc': 'Frekans Müzik Platformu',
        
        // Danger Zone
        'danger.title': 'Tehlikeli Bölge',
        'danger.deactivate': 'Hesabı Devre Dışı Bırak',
        'danger.deactivateDesc': 'Hesabınızı geçici olarak devre dışı bırakın',
        'danger.delete': 'Hesabı Sil',
        'danger.deleteDesc': 'Hesabınızı ve tüm verilerinizi kalıcı olarak silin',
        
        // Audio Quality Options
        'audio.qualityLow': 'Düşük (128kbps)',
        'audio.qualityNormal': 'Normal (256kbps)',
        'audio.qualityHigh': 'Yüksek (320kbps)',
        
        // Theme Options
        'appearance.themeDark': 'Koyu Tema',
        'appearance.themeLight': 'Açık Tema',
        'appearance.themeAuto': 'Sistem Ayarı',
        
        // Common
        'common.save': 'Kaydet',
        'common.cancel': 'İptal',
        'common.delete': 'Sil',
        'common.edit': 'Düzenle',
        'common.close': 'Kapat',
        'common.send': 'Gönder',
        
        // Quality Options
        'quality.low': 'Düşük',
        'quality.normal': 'Normal',
        'quality.high': 'Yüksek',
        
        // Theme Options
        'theme.light': 'Aydınlık',
        'theme.dark': 'Koyu',
        'theme.system': 'Sistem',
        
        // Toast Messages
        'toast.settingsSaved': 'Ayarlar kaydedildi',
        'toast.passwordChanged': 'Şifre değiştirildi',
        'toast.feedbackSent': 'Geri bildiriminiz alındı. Teşekkürler!',
        
        // Home Page
        'home.trending': '🔥 Popüler Şarkılar',
        'home.trendingSubtitle': 'Şu anda en çok dinlenenler',
        'home.trendingLoading': 'Popüler şarkılar yükleniyor...',
        'home.discoverMore': 'Daha Fazla Keşfet',
        'home.all': 'Tümü',
        'home.loadingTracks': 'Şarkılar yükleniyor...',
        'home.previous': '← Önceki',
        'home.next': 'Sonraki →',
        'home.page': 'Sayfa',
        
        // Track Card
        'track.plays': 'dinlenme',
        'track.likes': 'beğeni',
        'track.comments': 'yorum',
        
        // Player
        'player.play': 'Oynat',
        'player.pause': 'Duraklat',
        'player.previous': 'Önceki',
        'player.next': 'Sonraki',
        'player.shuffle': 'Karıştır',
        'player.repeat': 'Tekrarla',
        'player.volume': 'Ses',
        'player.mute': 'Sessiz',
        
        // Profile Page
        'profile.loading': 'Profil yükleniyor...',
        'profile.tracks': 'Şarkılar',
        'profile.likes': 'Beğendikleri',
        'profile.followers': 'Takipçiler',
        'profile.following': 'Takip Edilenler',
        'profile.playlists': 'Çalma Listeleri',
        'profile.plays': 'Dinlenme',
        'profile.follow': 'Takip Et',
        'profile.unfollow': 'Takibi Bırak',
        'profile.edit': 'Profili Düzenle',
        'profile.message': 'Mesaj Gönder',
        'profile.findFriends': 'Arkadaş Bul',
        'profile.noTracks': 'Henüz parça yok',
        
        // Library Page
        'library.title': 'Kitaplığım',
        'library.likedTracks': 'Beğenilen Parçalar',
        'library.playlists': 'Çalma Listeleri',
        'library.history': 'Dinleme Geçmişi',
        'library.empty': 'Kütüphaneniz boş',
        
        // Upload Page
        'upload.title': 'Parça Yükle',
        'upload.selectFile': 'Ses Dosyası Seç',
        'upload.trackTitle': 'Parça Başlığı',
        'upload.description': 'Açıklama',
        'upload.genre': 'Tür',
        'upload.coverImage': 'Kapak Resmi',
        'upload.public': 'Herkese Açık',
        'upload.private': 'Özel',
        'upload.uploadBtn': 'Yükle'
    },
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.explore': 'Explore',
        'nav.library': 'My Library',
        'nav.upload': 'Upload',
        'nav.profile': 'My Profile',
        'nav.settings': 'Settings',
        'nav.logout': 'Logout',
        'nav.searchPlaceholder': 'Search for songs, artists or albums...',
        
        // Settings Page
        'settings.title': 'Settings',
        'settings.account': 'Account Settings',
        'settings.privacy': 'Privacy',
        'settings.notifications': 'Notifications',
        'settings.audio': 'Audio Settings',
        'settings.appearance': 'Appearance',
        'settings.language': 'Language',
        'settings.feedback': 'Feedback',
        'settings.about': 'About',
        
        // Account Settings
        'account.username': 'Username',
        'account.usernameDesc': 'Your displayed username',
        'account.email': 'Email Address',
        'account.emailDesc': 'Email associated with your account',
        'account.password': 'Password',
        'account.passwordDesc': 'Change your account password',
        'account.changePassword': 'Change Password',
        'account.deleteAccount': 'Delete Account',
        
        // Privacy
        'privacy.profile': 'Profile Privacy',
        'privacy.profileDesc': 'Make your profile public or private',
        'privacy.autoPublic': 'Auto-Publish Tracks',
        'privacy.autoPublicDesc': 'Uploaded tracks are automatically public',
        'privacy.showLikes': 'Show Likes',
        'privacy.showLikesDesc': 'Display liked tracks on your profile',
        'privacy.activity': 'Activity Privacy',
        'privacy.activityDesc': 'Share your listening history',
        
        // Notifications
        'notifications.title': 'Notification Settings',
        'notifications.email': 'Email Notifications',
        'notifications.emailDesc': 'Receive emails for new followers and likes',
        'notifications.comment': 'Comment Notifications',
        'notifications.commentDesc': 'Get notified about comments on your tracks',
        'notifications.push': 'Push Notifications',
        'notifications.pushDesc': 'Browser notifications',
        
        // Audio
        'audio.title': 'Playback Settings',
        'audio.quality': 'Audio Quality',
        'audio.qualityDesc': 'Higher quality uses more data',
        'audio.autoplay': 'Autoplay',
        'audio.autoplayDesc': 'Continue automatically when track ends',
        'audio.crossfade': 'Crossfade',
        'audio.crossfadeDesc': 'Smooth transition between tracks',
        
        // Appearance
        'appearance.title': 'Appearance',
        'appearance.theme': 'Theme',
        'appearance.themeDesc': 'Choose light, dark or system theme',
        
        // Language
        'language.select': 'Select Language',
        'language.selectDesc': 'Choose application language',
        
        // Feedback
        'feedback.title': 'Feedback',
        'feedback.send': 'Send Feedback',
        'feedback.sendDesc': 'Share your thoughts about the app',
        'feedback.complaint': 'Report Issue',
        'feedback.complaintDesc': 'Having a problem? Let us know',
        'feedback.suggestion': 'Submit Suggestion',
        'feedback.suggestionDesc': 'Share new feature ideas',
        
        // About
        'about.title': 'About',
        'about.version': 'Version',
        'about.versionDesc': 'Current application version',
        'about.lastUpdate': 'Last Update',
        'about.lastUpdateDesc': 'Last update date',
        'about.developer': 'Developer',
        'about.developerDesc': 'Frekans Music Platform',
        
        // Danger Zone
        'danger.title': 'Danger Zone',
        'danger.deactivate': 'Deactivate Account',
        'danger.deactivateDesc': 'Temporarily disable your account',
        'danger.delete': 'Delete Account',
        'danger.deleteDesc': 'Permanently delete your account and all data',
        
        // Audio Quality Options
        'audio.qualityLow': 'Low (128kbps)',
        'audio.qualityNormal': 'Normal (256kbps)',
        'audio.qualityHigh': 'High (320kbps)',
        
        // Theme Options
        'appearance.themeDark': 'Dark Theme',
        'appearance.themeLight': 'Light Theme',
        'appearance.themeAuto': 'System Default',
        
        // Common
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.close': 'Close',
        'common.send': 'Send',
        
        // Quality Options
        'quality.low': 'Low',
        'quality.normal': 'Normal',
        'quality.high': 'High',
        
        // Theme Options
        'theme.light': 'Light',
        'theme.dark': 'Dark',
        'theme.system': 'System',
        
        // Toast Messages
        'toast.settingsSaved': 'Settings saved',
        'toast.passwordChanged': 'Password changed',
        'toast.feedbackSent': 'Feedback received. Thank you!',
        
        // Home Page
        'home.trending': '🔥 Trending Now',
        'home.trendingSubtitle': 'The hottest tracks right now',
        'home.trendingLoading': 'Loading trending tracks...',
        'home.discoverMore': 'Discover More',
        'home.all': 'All',
        'home.loadingTracks': 'Loading tracks...',
        'home.previous': '← Previous',
        'home.next': 'Next →',
        'home.page': 'Page',
        
        // Track Card
        'track.plays': 'plays',
        'track.likes': 'likes',
        'track.comments': 'comments',
        
        // Player
        'player.play': 'Play',
        'player.pause': 'Pause',
        'player.previous': 'Previous',
        'player.next': 'Next',
        'player.shuffle': 'Shuffle',
        'player.repeat': 'Repeat',
        'player.volume': 'Volume',
        'player.mute': 'Mute',
        
        // Profile Page
        'profile.loading': 'Loading profile...',
        'profile.tracks': 'Tracks',
        'profile.likes': 'Likes',
        'profile.followers': 'Followers',
        'profile.following': 'Following',
        'profile.playlists': 'Playlists',
        'profile.plays': 'Plays',
        'profile.follow': 'Follow',
        'profile.unfollow': 'Unfollow',
        'profile.edit': 'Edit Profile',
        'profile.message': 'Send Message',
        'profile.findFriends': 'Find Friends',
        'profile.noTracks': 'No tracks yet',
        
        // Library Page
        'library.title': 'My Library',
        'library.likedTracks': 'Liked Tracks',
        'library.playlists': 'Playlists',
        'library.history': 'Listening History',
        'library.empty': 'Your library is empty',
        
        // Upload Page
        'upload.title': 'Upload Track',
        'upload.selectFile': 'Select Audio File',
        'upload.trackTitle': 'Track Title',
        'upload.description': 'Description',
        'upload.genre': 'Genre',
        'upload.coverImage': 'Cover Image',
        'upload.public': 'Public',
        'upload.private': 'Private',
        'upload.uploadBtn': 'Upload'
    }
};

// Get translation
function t(key, lang = null) {
    const currentLang = lang || localStorage.getItem('setting_language') || 'tr';
    return translations[currentLang]?.[key] || key;
}

// Apply translations to page
function applyTranslations(lang = null) {
    const currentLang = lang || getUserLanguage();
    
    // Update all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[currentLang]?.[key];
        
        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
}

// Get user's language preference
function getUserLanguage() {
    // First check user data from login
    const userFromLocal = localStorage.getItem('user');
    const userFromSession = sessionStorage.getItem('user');
    const user = JSON.parse(userFromLocal || userFromSession || 'null');
    
    if (user && user.Language) {
        return user.Language;
    }
    
    // Fallback to localStorage setting
    return localStorage.getItem('setting_language') || 'tr';
}

// Change language and save to database
async function changeLanguage(lang) {
    try {
        // Get user ID
        const userFromLocal = localStorage.getItem('user');
        const userFromSession = sessionStorage.getItem('user');
        const user = JSON.parse(userFromLocal || userFromSession || 'null');
        
        if (user && user.UserID) {
            // Update database
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.UserID || user.userId,
                    language: lang
                })
            });
            
            const data = await response.json();
            if (data.success) {
                // Update user object in storage
                user.Language = lang;
                if (userFromLocal) {
                    localStorage.setItem('user', JSON.stringify(user));
                }
                if (userFromSession) {
                    sessionStorage.setItem('user', JSON.stringify(user));
                }
                
                // Apply translations
                applyTranslations(lang);
                
                if (typeof showToast === 'function') {
                    showToast(t('toast.settingsSaved', lang), 'success');
                }
            }
        } else {
            // No user logged in, just apply locally
            localStorage.setItem('setting_language', lang);
            applyTranslations(lang);
        }
    } catch (error) {
        console.error('Language change error:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const userLang = getUserLanguage();
    applyTranslations(userLang);
    
    // Update language selector if exists
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = userLang;
    }
});

// Export for use in other files
window.t = t;
window.applyTranslations = applyTranslations;
window.changeLanguage = changeLanguage;
