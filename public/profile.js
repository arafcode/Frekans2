// =============================================
// Profile Page JavaScript
// =============================================

const API_BASE_URL = '/api';
let currentUserId = null;
let currentTab = 'tracks';
let audioPlayer = null;
let currentChatUserId = null;

// Helper function to calculate "last seen" text
function getLastSeenText(lastActiveAt) {
    if (!lastActiveAt) return 'Son görülme bilinmiyor';
    
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffMs = now - lastActive;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Online if active within last 2 minutes
    if (diffMins < 2) return 'Çevrimiçi';
    if (diffMins < 60) return `${diffMins} dk önce çevrimiçiydi`;
    if (diffHours < 24) return `${diffHours} saat önce çevrimiçiydi`;
    if (diffDays === 1) return 'Dün çevrimiçiydi';
    if (diffDays < 7) return `${diffDays} gün önce çevrimiçiydi`;
    return 'Uzun süredir çevrimdışı';
}

// Update own activity on page load and periodically
function updateMyActivity() {
    const myUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 
                     localStorage.getItem('userID') || sessionStorage.getItem('userID');
    if (myUserId) {
        fetch(`${API_BASE_URL}/users/${myUserId}/activity`, { method: 'POST' })
            .catch(err => console.error('Activity update failed:', err));
    }
}

// Update activity every 60 seconds
setInterval(updateMyActivity, 60000);

// Check authentication and load profile
window.addEventListener('DOMContentLoaded', () => {
    // Update user activity on page load
    updateMyActivity();
    
    // Initialize audio player
    audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer) {
        setupAudioPlayer();
    }
    const loggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
    if (!loggedIn) {
        window.location.href = '/login.html';
        return;
    }
    
    // Fix userID if missing (backward compatibility)
    console.log('🔍 Checking userID...');
    let userID = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    console.log('Current userID:', userID);
    
    if (!userID) {
        console.log('⚠️ userID not found, trying to fix...');
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        console.log('Found userId (lowercase):', userId);
        
        if (userId) {
            localStorage.setItem('userID', userId);
            sessionStorage.setItem('userID', userId);
            console.log('✅ Fixed userID from userId:', userId);
        } else {
            // Try to get from user object
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            console.log('User object string:', userStr);
            
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    console.log('Parsed user object:', user);
                    
                    if (user.userId) {
                        localStorage.setItem('userID', user.userId);
                        sessionStorage.setItem('userID', user.userId);
                        console.log('✅ Fixed userID from user object:', user.userId);
                    } else {
                        console.error('❌ user.userId not found in object');
                    }
                } catch (e) {
                    console.error('❌ Failed to parse user object:', e);
                }
            } else {
                console.error('❌ No user data found in storage');
                alert('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
            }
        }
    } else {
        console.log('✅ userID already exists:', userID);
    }

    // Load user info for dropdown
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    let sessionUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    
    if (username) {
        const displayName = document.getElementById('userDisplayName');
        if (displayName) {
            displayName.textContent = username;
        }
    }
    
    // Load actual avatar from database
    if (sessionUserId) {
        const avatar = document.getElementById('userAvatar')?.querySelector('img');
        
        // First, try to load cached avatar immediately
        const cachedAvatar = localStorage.getItem('avatarUrl');
        if (cachedAvatar && avatar) {
            avatar.src = cachedAvatar;
        }
        
        // Then fetch fresh data and update cache
        fetch(`${API_BASE_URL}/users/${sessionUserId}`)
            .then(res => res.json())
            .then(user => {
                if (avatar) {
                    let avatarUrl = user.AvatarUrl;
                    if (!avatarUrl || avatarUrl.startsWith('/avatars/')) {
                        avatarUrl = `https://i.pravatar.cc/150?u=${user.Username}`;
                    }
                    avatar.src = avatarUrl;
                    localStorage.setItem('avatarUrl', avatarUrl);
                    avatar.onerror = function() {
                        this.src = `https://i.pravatar.cc/150?u=${user.Username}`;
                    };
                }
            })
            .catch(err => console.error('Error loading avatar:', err));
    }

    // Get userId from URL or session
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('id');
    sessionUserId = sessionUserId || localStorage.getItem('userID') || sessionStorage.getItem('userID');
    
    currentUserId = userIdFromUrl || sessionUserId;

    if (!currentUserId) {
        showError('Kullanıcı bulunamadı');
        return;
    }

    loadUserProfile();
    setupTabs();
    
    // Setup play button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', togglePlay);
    }
    
    // Setup player like button
    const playerLikeBtn = document.getElementById('playerLikeBtn');
    if (playerLikeBtn) {
        playerLikeBtn.addEventListener('click', () => {
            if (currentTrack) {
                togglePlayerLike();
            }
        });
    }
    
    // Setup progress slider
    const progressSlider = document.getElementById('progressSlider');
    if (progressSlider) {
        progressSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('progressFill').style.width = `${value}%`;
            
            if (currentTrack && currentTrack.Duration) {
                const currentSeconds = Math.floor((value / 100) * currentTrack.Duration);
                document.getElementById('currentTime').textContent = formatTime(currentSeconds);
            }
        });
        
        progressSlider.addEventListener('change', (e) => {
            const value = parseFloat(e.target.value);
            
            if (audioPlayer.duration) {
                const seekTime = (value / 100) * audioPlayer.duration;
                audioPlayer.currentTime = seekTime;
            }
            
            savePlayerState();
        });
    }
    
    // Setup volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value / 100;
        });
    }
    
    // Restore player state after page loads
    setTimeout(() => {
        restorePlayerState();
        
        // Show player by default if no saved state
        const savedState = localStorage.getItem('playerState');
        if (!savedState) {
            const stickyPlayer = document.getElementById('stickyPlayer');
            if (stickyPlayer) {
                stickyPlayer.style.display = 'flex';
            }
        }
    }, 500);
});

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUserId}`);
        if (!response.ok) {
            throw new Error('Kullanıcı bulunamadı');
        }

        const user = await response.json();
        await displayProfile(user);
        loadUserTracks();
    } catch (error) {
        console.error('Profile load error:', error);
        showError('Profil yüklenemedi');
    }
}

// Display profile
async function displayProfile(user) {
    // Hide loading
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';

    // Set profile data
    document.getElementById('profileUsername').textContent = user.Username;
    document.getElementById('profileBio').textContent = user.Bio || 'Henüz bir biyografi eklenmemiş.';
    
    // Avatar
    let avatarUrl = user.AvatarUrl;
    if (!avatarUrl || avatarUrl.startsWith('/avatars/')) {
        avatarUrl = `https://i.pravatar.cc/200?u=${user.Username}`;
    }
    const avatarImg = document.getElementById('profileAvatarLarge').querySelector('img');
    avatarImg.src = avatarUrl;
    avatarImg.onerror = function() {
        this.src = `https://i.pravatar.cc/200?u=${user.Username}`;
    };
    
    // Cover
    const coverUrl = user.HeaderImageUrl || `https://picsum.photos/seed/${user.UserID}/1200/300`;
    document.getElementById('profileCover').style.backgroundImage = `url(${coverUrl})`;
    document.getElementById('profileCover').style.backgroundSize = 'cover';
    document.getElementById('profileCover').style.backgroundPosition = 'center';

    // Stats
    document.getElementById('trackCount').textContent = user.TrackCount || 0;
    document.getElementById('followerCount').textContent = formatNumber(user.FollowerCount || 0);
    document.getElementById('followingCount').textContent = formatNumber(user.FollowingCount || 0);
    document.getElementById('totalPlays').textContent = formatNumber(user.TotalPlays || 0);
    
    // Show/hide follow button based on whether viewing own profile
    const sessionUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    const followBtn = document.getElementById('followBtn');
    const editBtn = document.getElementById('editProfileBtn');
    const messageBtn = document.getElementById('messageBtn');
    
    if (currentUserId == sessionUserId) {
        // Own profile - show edit button
        if (followBtn) followBtn.style.display = 'none';
        if (messageBtn) messageBtn.style.display = 'none';
        if (editBtn) {
            editBtn.style.display = 'inline-flex';
            editBtn.onclick = openEditProfileModal;
        }
    } else {
        // Other user's profile - show follow button
        if (editBtn) editBtn.style.display = 'none';
        if (followBtn) {
            followBtn.style.display = 'inline-flex';
            
            // Remove all existing listeners by replacing with new element
            const newBtn = followBtn.cloneNode(true);
            followBtn.parentNode.replaceChild(newBtn, followBtn);
            
            // Then add click event to the NEW button
            const currentBtn = document.getElementById('followBtn');
            if (currentBtn) {
                currentBtn.addEventListener('click', handleProfileFollow);
            }
            
            // Check follow status AFTER setting up the event listener
            const isFriend = await checkFollowStatus(user.UserID, sessionUserId);
            
            // Show message button only if friends
            if (messageBtn) {
                messageBtn.style.display = isFriend ? 'inline-flex' : 'none';
            }
        }
    }
}

// Check follow status
async function checkFollowStatus(targetUserId, currentUserId) {
    if (!currentUserId) {
        currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    }
    console.log('🔍 checkFollowStatus called:', { targetUserId, currentUserId });
    
    try {
        // Get following list to check if already following
        const response = await fetch(`http://localhost:3000/api/users/${currentUserId}/following?currentUserID=${currentUserId}`);
        if (!response.ok) {
            console.log('❌ Follow status check failed:', response.status);
            return false;
        }
        
        const result = await response.json();
        console.log('📊 Follow status response:', result);
        const following = result.data || result;
        const followedUser = following.find(u => u.UserID == targetUserId);
        console.log('👤 Found followed user:', followedUser);
        
        // Get the button using ID (after it's been cloned and replaced)
        const followBtn = document.getElementById('followBtn');
        if (!followBtn) {
            console.log('❌ Follow button not found!');
            return false;
        }
        
        if (followedUser) {
            const isFriend = followedUser.IsFriend;
            followBtn.className = `follow-btn ${isFriend ? 'friend' : 'following'}`;
            followBtn.querySelector('span').textContent = isFriend ? 'Arkadaşlar' : 'Takiptesin';
            console.log('✅ Button updated:', isFriend ? 'Arkadaşlar' : 'Takiptesin');
            return isFriend;
        } else {
            followBtn.className = 'follow-btn';
            followBtn.querySelector('span').textContent = 'Takip Et';
            console.log('✅ Button updated: Takip Et');
            return false;
        }
    } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
    }
}

// Load user tracks
async function loadUserTracks() {
    const container = document.getElementById('userTracks');
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUserId}/tracks`);
        if (!response.ok) {
            throw new Error('Şarkılar yüklenemedi');
        }

        const tracks = await response.json();
        
        if (tracks.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Henüz yüklenmiş şarkı yok</p>';
            return;
        }

        console.log('🎵 First track:', tracks[0]);
        console.log('🖼️ Cover URL:', getCoverImage(tracks[0], 'small'));

        container.innerHTML = tracks.map(track => `
            <div class="track-card-profile" onclick="goToTrackDetail(${track.TrackID})">
                <div class="track-card-cover">
                    <img src="${getCoverImage(track, 'small')}" alt="${track.Title}">
                    <div class="track-play-overlay-card">
                        <svg viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
                <div class="track-card-info">
                    <div class="track-card-title">${track.Title}</div>
                    <div class="track-card-stats">
                        <div class="track-card-stat">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            ${formatNumber(track.PlayCount || 0)}
                        </div>
                        <div class="track-card-stat">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            ${formatNumber(track.LikeCount || 0)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Tracks load error:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Şarkılar yüklenirken hata oluştu</p>';
    }
}

// Load liked tracks
async function loadLikedTracks() {
    const container = document.getElementById('likedTracks');
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUserId}/likes`);
        if (!response.ok) {
            throw new Error('Beğeniler yüklenemedi');
        }

        const tracks = await response.json();
        
        if (tracks.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Henüz beğenilen şarkı yok</p>';
            return;
        }

        container.innerHTML = tracks.map(track => `
            <div class="track-card-profile" onclick="goToTrackDetail(${track.TrackID})">
                <div class="track-card-cover">
                    <img src="${getCoverImage(track, 'small')}" alt="${track.Title}">
                    <div class="track-play-overlay-card">
                        <svg viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
                <div class="track-card-info">
                    <div class="track-card-title">${track.Title}</div>
                    <div class="track-card-stats">
                        <div class="track-card-stat">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            ${formatNumber(track.PlayCount || 0)}
                        </div>
                        <div class="track-card-stat">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            ${formatNumber(track.LikeCount || 0)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Liked tracks load error:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Beğenilen şarkılar yüklenirken hata oluştu</p>';
    }
}

// Load user playlists
async function loadUserPlaylists() {
    const container = document.getElementById('userPlaylists');
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUserId}/playlists`);
        if (!response.ok) {
            throw new Error('Çalma listeleri yüklenemedi');
        }

        const playlists = await response.json();
        
        if (playlists.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Henüz çalma listesi yok</p>';
            return;
        }

        container.innerHTML = playlists.map(playlist => `
            <div class="playlist-card" onclick="goToPlaylist(${playlist.PlaylistID})">
                <div class="playlist-cover">
                    ${playlist.CoverImageUrl ? 
                        `<img src="${playlist.CoverImageUrl}" alt="${playlist.Name}">` : 
                        `<svg class="playlist-cover-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                        </svg>`
                    }
                </div>
                <div class="playlist-info">
                    <h3 class="playlist-name">${playlist.Name}</h3>
                    <div class="playlist-meta">
                        <span class="playlist-track-count">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            ${playlist.TrackCount || 0} şarkı
                        </span>
                        ${playlist.IsPublic ? '<span style="color: var(--text-muted);">• Herkese Açık</span>' : '<span style="color: var(--text-muted);">• Özel</span>'}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Playlists load error:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Çalma listeleri yüklenirken hata oluştu</p>';
    }
}

// Navigate to playlist detail
function goToPlaylist(playlistId) {
    window.location.href = `/playlist.html?id=${playlistId}`;
}

// Setup tabs
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update active content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Tab').classList.add('active');

            // Load content based on tab
            if (tabName === 'likes' && currentTab !== 'likes') {
                loadLikedTracks();
            } else if (tabName === 'followers' && currentTab !== 'followers') {
                const userId = new URLSearchParams(window.location.search).get('id') || localStorage.getItem('userID');
                loadFollowers(userId);
            } else if (tabName === 'following' && currentTab !== 'following') {
                const userId = new URLSearchParams(window.location.search).get('id') || localStorage.getItem('userID');
                loadFollowing(userId);
            } else if (tabName === 'playlists' && currentTab !== 'playlists') {
                loadUserPlaylists();
            }

            currentTab = tabName;
        });
    });
}

// Navigate to track detail
function goToTrackDetail(trackId) {
    window.location.href = `/track-detail.html?id=${trackId}`;
}

// Get cover image
function getCoverImage(track, size = 'small') {
    if (typeof track === 'number') {
        // If just trackId is passed
        const dimensions = {
            thumb: 150,
            small: 200,
            large: 300
        };
        const dim = dimensions[size] || 200;
        return `https://picsum.photos/seed/${track}/${dim}/${dim}`;
    }
    
    if (track.CoverImageUrl && track.CoverImageUrl.trim() && !track.CoverImageUrl.includes('placeholder')) {
        return track.CoverImageUrl;
    }
    
    const dimensions = {
        thumb: 150,
        small: 200,
        large: 300
    };
    
    const dim = dimensions[size] || 200;
    const seed = track.TrackID || Math.floor(Math.random() * 1000);
    
    return `https://picsum.photos/seed/${seed}/${dim}/${dim}`;
}

// Format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Show error
function showError(message) {
    document.getElementById('loadingState').innerHTML = `
        <div style="text-align: center; padding: 100px 20px;">
            <h2 style="color: var(--text-primary); margin-bottom: 16px;">Hata!</h2>
            <p style="color: var(--text-secondary);">${message}</p>
            <button onclick="window.location.href='/'" style="margin-top: 24px; padding: 12px 24px; background: var(--primary-color); color: white; border: none; border-radius: 20px; cursor: pointer;">
                Ana Sayfaya Dön
            </button>
        </div>
    `;
}

// =============================================
// User Dropdown Toggle
// =============================================
document.getElementById('userAvatar')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
});

// Profile button click handler
document.getElementById('profileBtn')?.addEventListener('click', () => {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (userId) {
        window.location.href = `/profile.html?id=${userId}`;
    } else {
        window.location.href = '/login.html';
    }
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
});

// =============================================
// Logout Function
// =============================================
function logout() {
    // Remove session data but keep savedUsername and savedPassword for "Remember Me"
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    sessionStorage.clear();
    window.location.href = '/login.html';
}

// =============================================
// =============================================
// Setup Audio Player
// =============================================
function setupAudioPlayer() {
    audioPlayer.addEventListener('loadedmetadata', () => {
        if (currentTrack && audioPlayer.duration) {
            currentTrack.Duration = Math.floor(audioPlayer.duration);
            document.getElementById('totalTime').textContent = formatTime(currentTrack.Duration);
        }
    });

    audioPlayer.addEventListener('timeupdate', () => {
        if (currentTrack && audioPlayer.duration && !isNaN(audioPlayer.duration)) {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            currentProgressValue = progress;
            document.getElementById('progressSlider').value = progress;
            document.getElementById('progressFill').style.width = `${progress}%`;
            document.getElementById('currentTime').textContent = formatTime(Math.floor(audioPlayer.currentTime));
        }
    });

    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        document.getElementById('playBtn').classList.remove('playing');
    });

    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        document.getElementById('playBtn').classList.add('playing');
        savePlayerState();
    });

    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        document.getElementById('playBtn').classList.remove('playing');
        savePlayerState();
    });

    audioPlayer.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        isPlaying = false;
        document.getElementById('playBtn').classList.remove('playing');
    });
}

// =============================================
// Player State Management
// =============================================

// Global player variables
let currentProgressValue = 0;
let progressInterval = null;
let isPlaying = false;
let currentTrack = null;

// Save player state to localStorage
function savePlayerState() {
    if (!currentTrack) return;
    
    const state = {
        track: currentTrack,
        trackIndex: 0, // Profile page doesn't have playlist
        progress: currentProgressValue,
        isPlaying: isPlaying,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem('playerState', JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save player state:', e);
    }
}

// Restore player state from localStorage
function restorePlayerState() {
    try {
        const savedState = localStorage.getItem('playerState');
        if (!savedState) return;
        
        const state = JSON.parse(savedState);
        
        // Check if state is recent (within 1 hour)
        const timeDiff = (Date.now() - state.timestamp) / 1000;
        if (timeDiff > 3600) {
            localStorage.removeItem('playerState');
            return;
        }
        
        // Restore player state
        if (state.track) {
            currentTrack = state.track;
            currentProgressValue = state.progress || 0;
            isPlaying = state.isPlaying || false;
            
            console.log('🔄 Restoring track (profile):', {
                TrackID: state.track.TrackID,
                Title: state.track.Title,
                CoverImageUrl: state.track.CoverImageUrl
            });
            
            // Update player UI
            document.getElementById('stickyPlayer').style.display = 'flex';
            document.getElementById('playerCover').src = getCoverImage(state.track, 'small');
            document.getElementById('playerTitle').textContent = state.track.Title;
            document.getElementById('playerArtist').textContent = state.track.Username || state.track.ArtistName;
            
            // Add click handlers for navigation
            const playerCoverWrapper = document.getElementById('playerCoverWrapper');
            const playerTitle = document.getElementById('playerTitle');
            const playerArtist = document.getElementById('playerArtist');
            const artistId = state.track.ArtistID || state.track.UserID;
            
            if (playerCoverWrapper && state.track.TrackID) {
                playerCoverWrapper.onclick = () => window.location.href = `track-detail.html?id=${state.track.TrackID}`;
            }
            if (playerTitle && state.track.TrackID) {
                playerTitle.onclick = () => window.location.href = `track-detail.html?id=${state.track.TrackID}`;
            }
            if (playerArtist && artistId) {
                playerArtist.onclick = () => window.location.href = `profile.html?id=${artistId}`;
            }
            
            // Update progress bar and fill
            const progressSlider = document.getElementById('progressSlider');
            const progressFill = document.getElementById('progressFill');
            if (progressSlider) {
                progressSlider.value = currentProgressValue;
            }
            if (progressFill) {
                progressFill.style.width = `${currentProgressValue}%`;
            }
            
            // Update time displays
            updateTimeDisplay();
            
            // Load audio and set position
            if (state.track.AudioUrl) {
                const needsLoad = !audioPlayer.src || !audioPlayer.src.includes(state.track.AudioUrl);
                
                if (needsLoad) {
                    audioPlayer.src = state.track.AudioUrl;
                    
                    if (state.progress > 0 && state.track.Duration) {
                        const restoreSeekTime = (state.progress / 100) * state.track.Duration;
                        
                        audioPlayer.addEventListener('loadedmetadata', () => {
                            audioPlayer.currentTime = restoreSeekTime;
                            console.log('🔄 Seek to:', restoreSeekTime, 'seconds');
                        }, { once: true });
                    }
                    
                    audioPlayer.load();
                    
                    // If was playing, auto-play after load
                    if (state.isPlaying) {
                        audioPlayer.addEventListener('canplay', () => {
                            audioPlayer.play().catch(err => console.error('Auto-play error:', err));
                        }, { once: true });
                    }
                } else if (state.progress > 0 && state.track.Duration && audioPlayer.duration) {
                    const restoreSeekTime = (state.progress / 100) * audioPlayer.duration;
                    audioPlayer.currentTime = restoreSeekTime;
                    console.log('🔄 Same track, seek to:', restoreSeekTime, 'seconds');
                    
                    // If was playing, continue playing
                    if (state.isPlaying && audioPlayer.paused) {
                        audioPlayer.play().catch(err => console.error('Continue play error:', err));
                    }
                }
            }
            
            // Restore playing state
            const playBtn = document.getElementById('playBtn');
            if (playBtn) {
                if (state.isPlaying) {
                    isPlaying = true;
                    playBtn.classList.add('playing');
                } else {
                    isPlaying = false;
                    playBtn.classList.remove('playing');
                }
            }
            
            // Update player like button state
            const playerLikeBtn = document.getElementById('playerLikeBtn');
            if (playerLikeBtn && state.track.IsLiked !== undefined) {
                playerLikeBtn.classList.toggle('liked', state.track.IsLiked);
            }
            
            console.log('✅ Player state restored (profile.js)');
        }
    } catch (e) {
        console.error('Failed to restore player state:', e);
    }
}

// Start progress simulation
function startProgressSimulation() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    if (!currentTrack || !currentTrack.Duration) return;
    
    const incrementPerSecond = 100 / currentTrack.Duration;
    let saveCounter = 0;
    
    progressInterval = setInterval(() => {
        currentProgressValue += incrementPerSecond;
        
        if (currentProgressValue >= 100) {
            currentProgressValue = 100;
            stopProgressSimulation();
            isPlaying = false;
            document.getElementById('playBtn').classList.remove('playing');
            savePlayerState();
            return;
        }
        
        // Update progress bar and fill
        const progressSlider = document.getElementById('progressSlider');
        const progressFill = document.getElementById('progressFill');
        if (progressSlider) {
            progressSlider.value = currentProgressValue;
        }
        if (progressFill) {
            progressFill.style.width = `${currentProgressValue}%`;
        }
        
        // Update time display
        updateTimeDisplay();
        
        // Save state every 3 seconds
        saveCounter++;
        if (saveCounter >= 3) {
            savePlayerState();
            saveCounter = 0;
        }
    }, 1000);
}

// Stop progress simulation
function stopProgressSimulation() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// Update time display
function updateTimeDisplay() {
    if (!currentTrack || !currentTrack.Duration) return;
    
    const currentSeconds = Math.floor((currentProgressValue / 100) * currentTrack.Duration);
    const totalSeconds = currentTrack.Duration;
    
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    
    if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(currentSeconds);
    }
    if (totalTimeEl) {
        totalTimeEl.textContent = formatTime(totalSeconds);
    }
}

// Format time helper
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Toggle player like button
async function togglePlayerLike() {
    if (!currentTrack) return;

    const playerLikeBtn = document.getElementById('playerLikeBtn');

    try {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        const response = await fetch(`${API_BASE_URL}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                trackId: currentTrack.TrackID,
                userId: parseInt(userId)
            })
        });

        const data = await response.json();

        if (data.success) {
            playerLikeBtn.classList.toggle('liked', data.data.isLiked);
            
            // Update currentTrack like status
            currentTrack.IsLiked = data.data.isLiked;
            currentTrack.LikeCount = data.data.totalLikes;
            
            // Save updated state
            savePlayerState();
            
            console.log('❤️ Player like:', data.data.isLiked ? 'liked' : 'unliked');
        }
    } catch (error) {
        console.error('Error toggling player like:', error);
    }
}

// Toggle play/pause
function togglePlay() {
    if (!currentTrack) return;
    
    if (isPlaying) {
        audioPlayer.pause();
        savePlayerState();
    } else {
        if (currentTrack.AudioUrl) {
            // Check if we need to load a different track
            const needsLoad = !audioPlayer.src || !audioPlayer.src.includes(currentTrack.AudioUrl);
            
            if (needsLoad) {
                audioPlayer.src = currentTrack.AudioUrl;
                audioPlayer.load();
            }
            audioPlayer.play().catch(err => {
                console.error('Play error:', err);
            });
        }
        savePlayerState();
    }
}

// Save state before leaving page
window.addEventListener('beforeunload', () => {
    if (isPlaying) {
        savePlayerState();
    }
});

// ========== SOCIAL FEATURES ==========

// Load followers list
// Load followers list
async function loadFollowers(userId) {
    let currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    if (!currentUserId) {
        currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    }
    
    console.log('📥 Loading followers for:', { userId, currentUserId });
    
    try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}/followers?currentUserID=${currentUserId}`);
        if (!response.ok) throw new Error('Failed to load followers');
        
        const result = await response.json();
        console.log('👥 Followers API response:', result);
        console.log('👤 First follower:', result.data?.[0]);
        const followers = result.data || result;
        renderUserList(followers, 'followersTab');
    } catch (error) {
        console.error('Error loading followers:', error);
        document.querySelector('#followersTab .users-grid').innerHTML = 
            '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Takipçiler yüklenemedi</p>';
    }
}

// Load following list
async function loadFollowing(userId) {
    let currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    if (!currentUserId) {
        currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    }
    
    console.log('📥 Loading following for:', { userId, currentUserId });
    
    try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}/following?currentUserID=${currentUserId}`);
        if (!response.ok) throw new Error('Failed to load following');
        
        const result = await response.json();
        console.log('👥 Following API response:', result);
        console.log('👤 First following:', result.data?.[0]);
        const following = result.data || result;
        renderUserList(following, 'followingTab');
    } catch (error) {
        console.error('Error loading following:', error);
        document.querySelector('#followingTab .users-grid').innerHTML = 
            '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Takip edilenler yüklenemedi</p>';
    }
}

// Render user list
function renderUserList(users, tabId) {
    const container = document.querySelector(`#${tabId} .users-grid`);
    let currentUserId = parseInt(localStorage.getItem('userID') || sessionStorage.getItem('userID'));
    
    if (!currentUserId) {
        const userIdStr = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (userIdStr) currentUserId = parseInt(userIdStr);
    }
    
    console.log('📋 Rendering user list:', { 
        tabId, 
        userCount: users?.length, 
        currentUserId,
        firstUser: users?.[0] 
    });
    
    if (!users || users.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Henüz kimse yok</p>';
        return;
    }
    
    container.innerHTML = users.map((user, index) => {
        if (index === 0) {
            console.log('🔍 First user details:', {
                UserID: user.UserID,
                Username: user.Username,
                IsFollowedByCurrentUser: user.IsFollowedByCurrentUser,
                IsFriend: user.IsFriend
            });
        }
        
        const avatarUrl = (user.AvatarUrl && !user.AvatarUrl.startsWith('/avatars/')) 
            ? user.AvatarUrl 
            : `https://i.pravatar.cc/150?u=${user.Username}`;
        
        const buttonClass = user.IsFollowedByCurrentUser ? (user.IsFriend ? 'friend' : 'following') : 'primary';
        const buttonText = user.IsFollowedByCurrentUser ? (user.IsFriend ? 'Arkadaş' : 'Takiptesin') : 'Takip Et';
        
        return `
        <div class="user-card" data-user-id="${user.UserID}" onclick="goToUserProfile(${user.UserID})" style="cursor: pointer;">
            <div class="user-card-avatar">
                <img src="${avatarUrl}" alt="${user.Username}" onerror="this.src='https://i.pravatar.cc/150?u=${user.Username}'">
            </div>
            <div class="user-card-info">
                <div class="user-card-username">
                    ${user.Username}
                    ${user.IsFriend ? '<span class="friend-badge">Arkadaş</span>' : ''}
                </div>
                ${user.Bio ? `<div class="user-card-bio">${user.Bio}</div>` : ''}
                <div class="user-card-stats">
                    <span>${user.FollowerCount || 0} takipçi</span>
                    <span>${user.FollowingCount || 0} takip</span>
                </div>
            </div>
            ${user.UserID !== currentUserId ? `
                <div class="user-card-actions" onclick="event.stopPropagation()">
                    <button class="user-card-btn ${buttonClass}" 
                            onclick="handleUserFollow(${user.UserID}, this); event.stopPropagation();">
                        ${buttonText}
                    </button>
                    ${user.IsFriend ? `
                        <button class="user-card-btn secondary" onclick="openChat(${user.UserID}, '${user.Username}'); event.stopPropagation();">
                            Mesaj Gönder
                        </button>
                    ` : ''}
                </div>
            ` : '<div class="user-card-actions"><span style="color: var(--text-secondary); font-size: 14px;">Sen</span></div>'}
        </div>
        `;
    }).join('');
}

// Navigate to user profile
function goToUserProfile(userId) {
    window.location.href = `profile.html?id=${userId}`;
}

// Handle follow/unfollow
async function handleUserFollow(targetUserId, buttonElement) {
    // Try multiple sources for currentUserId
    let currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    
    if (!currentUserId) {
        // Try lowercase version
        currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (currentUserId) {
            localStorage.setItem('userID', currentUserId);
            sessionStorage.setItem('userID', currentUserId);
        }
    }
    
    if (!currentUserId) {
        // Try from user object
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                currentUserId = user.userId || user.UserID;
                if (currentUserId) {
                    localStorage.setItem('userID', currentUserId);
                    sessionStorage.setItem('userID', currentUserId);
                }
            } catch (e) {}
        }
    }
    
    console.log('🎯 handleUserFollow called:', { currentUserId, targetUserId });
    
    if (!currentUserId) {
        console.error('No current user ID found!');
        alert('Oturum bilgisi bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın.');
        return;
    }
    
    try {
        const requestBody = {
            followerID: parseInt(currentUserId),
            followingID: parseInt(targetUserId)
        };
        
        console.log('📤 Sending request:', requestBody);
        
        const response = await fetch('http://localhost:3000/api/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error:', errorData);
            throw new Error(errorData.message || 'Follow action failed');
        }
        
        const result = await response.json();
        console.log('📊 Follow response:', result);
        const data = result.data || result;
        
        // Update button state
        const card = buttonElement.closest('.user-card');
        const isFriend = data.IsFriend;
        const isFollowing = data.IsFollowing;
        
        console.log('✨ Updating button:', { isFollowing, isFriend });
        
        buttonElement.className = `user-card-btn ${isFollowing ? (isFriend ? 'friend' : 'following') : 'primary'}`;
        buttonElement.textContent = isFollowing ? (isFriend ? 'Arkadaş' : 'Takiptesin') : 'Takip Et';
        
        console.log('✅ Button text updated to:', buttonElement.textContent);
        
        // Update friend badge
        const username = card.querySelector('.user-card-username');
        const existingBadge = username.querySelector('.friend-badge');
        if (isFriend && !existingBadge) {
            username.innerHTML += '<span class="friend-badge">Arkadaş</span>';
        } else if (!isFriend && existingBadge) {
            existingBadge.remove();
        }
        
        // Update message button
        const actions = card.querySelector('.user-card-actions');
        const messageBtn = actions.querySelector('.secondary');
        if (isFriend && !messageBtn) {
            const targetUsername = card.querySelector('.user-card-username').firstChild.textContent.trim();
            actions.innerHTML += `
                <button class="user-card-btn secondary" onclick="openChat(${targetUserId}, '${targetUsername}')">
                    Mesaj Gönder
                </button>
            `;
        } else if (!isFriend && messageBtn) {
            messageBtn.remove();
        }
        
        // Reload profile stats if viewing their profile
        const profileUserId = new URLSearchParams(window.location.search).get('id') || currentUserId;
        loadUserProfile();
        
    } catch (error) {
        console.error('Error toggling follow:', error);
        alert('Takip işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
}

// Handle profile follow button
async function handleProfileFollow() {
    const followBtn = document.getElementById('followBtn');
    const profileUserId = new URLSearchParams(window.location.search).get('id');
    
    // Try multiple sources for currentUserId
    let currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    
    if (!currentUserId) {
        // Try lowercase version
        currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (currentUserId) {
            localStorage.setItem('userID', currentUserId);
            sessionStorage.setItem('userID', currentUserId);
        }
    }
    
    if (!currentUserId) {
        // Try from user object
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                currentUserId = user.userId;
                if (currentUserId) {
                    localStorage.setItem('userID', currentUserId);
                    sessionStorage.setItem('userID', currentUserId);
                }
            } catch (e) {}
        }
    }
    
    console.log('Follow attempt:', { profileUserId, currentUserId });
    
    if (!profileUserId || profileUserId == currentUserId) {
        console.log('Follow blocked: same user or no profile ID');
        return;
    }
    
    if (!currentUserId) {
        console.error('No current user ID found anywhere!');
        console.log('localStorage:', {...localStorage});
        console.log('sessionStorage:', {...sessionStorage});
        alert('Oturum bilgisi bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın.');
        return;
    }
    
    try {
        const requestBody = {
            followerID: parseInt(currentUserId),
            followingID: parseInt(profileUserId)
        };
        
        console.log('Sending follow request:', requestBody);
        
        const response = await fetch('http://localhost:3000/api/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Follow response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Follow API error:', errorData);
            alert(`Takip işlemi başarısız: ${errorData.message || errorData.error || 'Bilinmeyen hata'}`);
            throw new Error(errorData.message || 'Follow action failed');
        }
        
        const result = await response.json();
        console.log('Follow success:', result);
        const data = result.data || result;
        
        // Update button state
        const isFollowing = data.IsFollowing;
        const isFriend = data.IsFriend;
        
        console.log('📊 Follow result:', { isFollowing, isFriend });
        
        followBtn.className = `follow-btn ${isFollowing ? (isFriend ? 'friend' : 'following') : ''}`;
        
        const btnText = followBtn.querySelector('span');
        btnText.textContent = isFollowing ? (isFriend ? 'Arkadaşlar' : 'Takiptesin') : 'Takip Et';
        
        console.log('✅ Button updated to:', btnText.textContent);
        
        // Show/hide message button based on friend status
        const messageBtn = document.getElementById('messageBtn');
        if (messageBtn) {
            messageBtn.style.display = isFriend ? 'inline-flex' : 'none';
        }
        
        // Update follower counts without reloading entire profile
        const response2 = await fetch(`${API_BASE_URL}/users/${profileUserId}`);
        if (response2.ok) {
            const userData = await response2.json();
            document.getElementById('followerCount').textContent = formatNumber(userData.FollowerCount || 0);
            document.getElementById('followingCount').textContent = formatNumber(userData.FollowingCount || 0);
        }
        
    } catch (error) {
        console.error('Error toggling follow:', error);
        alert('Takip işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
}

// Open chat with user - redirect to existing messaging modal
async function openChat(userId, username) {
    // Set up the chat for the specific user
    currentChatUserId = userId;
    
    // Get current user
    let currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    if (!currentUserId) {
        currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    }
    
    if (!currentUserId) {
        showToast('Mesaj göndermek için giriş yapmalısınız', 'error');
        return;
    }
    
    // Load user info and status
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (response.ok) {
            const user = await response.json();
            document.getElementById('chatUsername').textContent = user.Username;
            document.getElementById('chatUserAvatar').src = user.AvatarUrl || `https://i.pravatar.cc/150?u=${user.Username}`;
            
            // Update user status
            const statusText = getLastSeenText(user.LastActiveAt);
            const statusElement = document.getElementById('chatUserStatus');
            statusElement.textContent = statusText;
            
            // Color based on online status
            if (statusText === 'Çevrimiçi') {
                statusElement.style.color = '#22c55e'; // Green
            } else {
                statusElement.style.color = 'var(--text-muted)';
            }
        } else {
            document.getElementById('chatUsername').textContent = username;
            document.getElementById('chatUserAvatar').src = `https://i.pravatar.cc/150?u=${username}`;
            document.getElementById('chatUserStatus').textContent = 'Son görülme bilinmiyor';
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        document.getElementById('chatUsername').textContent = username;
        document.getElementById('chatUserAvatar').src = `https://i.pravatar.cc/150?u=${username}`;
        document.getElementById('chatUserStatus').textContent = 'Son görülme bilinmiyor';
    }
    
    // Load messages
    await loadChatMessages();
    
    // Show modal
    document.getElementById('chatModal').classList.add('active');
}

// Close chat modal
function closeChatModal() {
    document.getElementById('chatModal').classList.remove('active');
    currentChatUserId = null;
}

// Load chat messages
async function loadChatMessages() {
    let currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    if (!currentUserId) {
        currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    }
    const messagesContainer = document.getElementById('chatMessages');
    
    if (!currentChatUserId || !currentUserId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages/${currentUserId}/${currentChatUserId}`);
        
        if (!response.ok) {
            throw new Error('Mesajlar yüklenemedi');
        }
        
        const result = await response.json();
        const messages = result.data || result;
        
        if (!messages || messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="chat-empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>Henüz mesaj yok</p>
                    <p style="font-size: 14px;">İlk mesajı göndererek sohbeti başlatın</p>
                </div>
            `;
            return;
        }
        
        messagesContainer.innerHTML = messages.map(msg => {
            const isSent = msg.SenderID == currentUserId;
            const messageDate = new Date(msg.SentDate || msg.SentAt);
            const time = formatMessageTime(messageDate);
            
            // Use sender's avatar from database
            const avatarUrl = msg.SenderAvatar || `https://i.pravatar.cc/150?u=${msg.SenderUsername || msg.SenderID}`;
            
            // Check if message has track metadata
            let trackCard = '';
            if (msg.Metadata) {
                try {
                    const metadata = JSON.parse(msg.Metadata);
                    if (metadata.type === 'track_share') {
                        // Fix cover image URL - remove any localhost prefix and add correct one
                        let coverUrl = metadata.coverImage || '';
                        if (coverUrl) {
                            // Remove existing localhost if present
                            coverUrl = coverUrl.replace(/^https?:\/\/localhost:\d+/, '');
                            // Add correct localhost
                            coverUrl = coverUrl.startsWith('http') ? coverUrl : `http://localhost:3000${coverUrl}`;
                        } else {
                            coverUrl = `https://picsum.photos/seed/${metadata.trackId}/60/60`;
                        }
                        
                        trackCard = `
                            <div class="track-share-card" onclick="window.location.href='track-detail.html?id=${metadata.trackId}'">
                                <img src="${coverUrl}" alt="${metadata.title}" onerror="this.src='https://picsum.photos/seed/${metadata.trackId}/60/60'">
                                <div class="track-share-info">
                                    <div class="track-share-title">${escapeHtml(metadata.title)}</div>
                                    <div class="track-share-artist">${escapeHtml(metadata.artist)}</div>
                                </div>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                        `;
                    }
                } catch (e) {
                    console.error('Error parsing metadata:', e);
                }
            }
            
            const hasTextMessage = msg.MessageText && msg.MessageText.trim() && msg.MessageText.trim() !== ' ';
            
            return `
                <div class="chat-message ${isSent ? 'sent' : 'received'}">
                    <img class="chat-message-avatar" src="${avatarUrl}" alt="Avatar">
                    <div class="chat-message-content">
                        ${hasTextMessage ? `<div class="chat-message-bubble">${escapeHtml(msg.MessageText)}</div>` : ''}
                        ${trackCard}
                        <div class="chat-message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = `
            <div class="chat-empty-state">
                <p>Mesajlar yüklenirken hata oluştu</p>
            </div>
        `;
    }
}

// Send chat message
async function sendChatMessage() {
    let currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    if (!currentUserId) {
        currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    }
    const input = document.getElementById('chatMessageInput');
    const messageText = input.value.trim();
    
    if (!messageText || !currentChatUserId || !currentUserId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderID: parseInt(currentUserId),
                receiverID: parseInt(currentChatUserId),
                messageText: messageText
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            showToast(errorData.message || 'Mesaj gönderilemedi. Sadece arkadaşlarınıza mesaj gönderebilirsiniz.', 'error');
            return;
        }
        
        // Clear input
        input.value = '';
        
        // Reload messages
        await loadChatMessages();
        
        showToast('Mesaj gönderildi', 'success');
        
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Mesaj gönderilirken hata oluştu', 'error');
    }
}

// Format message timestamp
function formatMessageTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== USER SEARCH MODAL ==========

let searchTimeout;

// Open user search modal
function openUserSearchModal() {
    const modal = document.getElementById('userSearchModal');
    modal.classList.add('active');
    document.getElementById('userSearchInput').focus();
}

// Close user search modal
function closeUserSearchModal() {
    const modal = document.getElementById('userSearchModal');
    modal.classList.remove('active');
    document.getElementById('userSearchInput').value = '';
    document.getElementById('userSearchResults').innerHTML = 
        '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Aramaya başlamak için kullanıcı adı yazın</p>';
}

// Search users
async function searchUsers(query) {
    const currentUserId = localStorage.getItem('userID');
    const resultsContainer = document.getElementById('userSearchResults');
    
    if (!query || query.trim().length < 2) {
        resultsContainer.innerHTML = 
            '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">En az 2 karakter girin</p>';
        return;
    }
    
    resultsContainer.innerHTML = 
        '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Aranıyor...</p>';
    
    try {
        const response = await fetch(`http://localhost:3000/api/users/search?query=${encodeURIComponent(query)}&currentUserID=${currentUserId}`);
        if (!response.ok) throw new Error('Search failed');
        
        const users = await response.json();
        
        if (users.length === 0) {
            resultsContainer.innerHTML = 
                '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Kullanıcı bulunamadı</p>';
            return;
        }
        
        resultsContainer.innerHTML = users.map(user => {
            const avatarUrl = (user.AvatarUrl && !user.AvatarUrl.startsWith('/avatars/')) 
                ? user.AvatarUrl 
                : `https://i.pravatar.cc/100?u=${user.Username}`;
            
            return `
            <div class="search-user-item" onclick="goToUserProfile(${user.UserID})">
                <div class="search-user-avatar">
                    <img src="${avatarUrl}" alt="${user.Username}" onerror="this.src='https://i.pravatar.cc/100?u=${user.Username}'">
                </div>
                <div class="search-user-info">
                    <div class="search-user-username">
                        ${user.Username}
                        ${user.IsFriend ? '<span class="friend-badge" style="margin-left: 8px;">Arkadaş</span>' : ''}
                    </div>
                    <div class="search-user-stats">
                        <span>${user.FollowerCount || 0} takipçi</span>
                        <span>${user.FollowingCount || 0} takip</span>
                    </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error searching users:', error);
        resultsContainer.innerHTML = 
            '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Arama sırasında hata oluştu</p>';
    }
}

// Go to user profile
function goToUserProfile(userId) {
    closeUserSearchModal();
    window.location.href = `profile.html?id=${userId}`;
}

// Initialize user search
document.addEventListener('DOMContentLoaded', () => {
    const findFriendsBtn = document.getElementById('findFriendsBtn');
    if (findFriendsBtn) {
        findFriendsBtn.addEventListener('click', openUserSearchModal);
    }
    
    const userSearchInput = document.getElementById('userSearchInput');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchUsers(e.target.value);
            }, 300);
        });
    }
    
    // Close modal on overlay click
    const modal = document.getElementById('userSearchModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeUserSearchModal();
            }
        });
    }
    
    // Messages modal setup
    const messagesModal = document.getElementById('messagesModal');
    if (messagesModal) {
        messagesModal.addEventListener('click', (e) => {
            if (e.target === messagesModal) {
                closeMessagesModal();
            }
        });
    }
    
    const messageBtn = document.getElementById('messageBtn');
    if (messageBtn) {
        messageBtn.addEventListener('click', () => {
            const profileUserId = new URLSearchParams(window.location.search).get('id');
            const username = document.getElementById('profileUsername').textContent;
            openChat(parseInt(profileUserId), username);
        });
    }
    
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

// =============================================
// MESSAGING FUNCTIONS
// =============================================

// Open messages modal
async function openMessagesModal() {
    const profileUserId = new URLSearchParams(window.location.search).get('id');
    const currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    
    if (!profileUserId || !currentUserId) return;
    
    currentChatUserId = profileUserId;
    
    // Get user info
    try {
        const response = await fetch(`${API_BASE_URL}/users/${profileUserId}`);
        if (response.ok) {
            const user = await response.json();
            document.getElementById('messageUsername').textContent = user.Username;
            
            const avatar = document.getElementById('messageUserAvatar');
            let avatarUrl = user.AvatarUrl;
            if (!avatarUrl || avatarUrl.startsWith('/avatars/')) {
                avatarUrl = `https://i.pravatar.cc/100?u=${user.Username}`;
            }
            avatar.src = avatarUrl;
            
            // Show friend badge if friends
            const followingResponse = await fetch(`${API_BASE_URL}/users/${currentUserId}/following?currentUserID=${currentUserId}`);
            if (followingResponse.ok) {
                const result = await followingResponse.json();
                const following = result.data || result;
                const followedUser = following.find(u => u.UserID == profileUserId);
                if (followedUser && followedUser.IsFriend) {
                    document.getElementById('messageFriendBadge').style.display = 'inline-flex';
                } else {
                    document.getElementById('messageFriendBadge').style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
    
    // Load messages
    await loadMessages();
    
    document.getElementById('messagesModal').classList.add('active');
}

// Close messages modal
function closeMessagesModal() {
    document.getElementById('messagesModal').classList.remove('active');
    currentChatUserId = null;
}

// Load messages
async function loadMessages() {
    const currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    const messagesContainer = document.getElementById('messagesContainer');
    
    if (!currentChatUserId || !currentUserId) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/messages/${currentUserId}/${currentChatUserId}`);
        
        if (!response.ok) {
            throw new Error('Mesajlar yüklenemedi');
        }
        
        const result = await response.json();
        const messages = result.data || result;
        
        if (!messages || messages.length === 0) {
            messagesContainer.innerHTML = 
                '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Henüz mesaj yok</p>';
            return;
        }
        
        messagesContainer.innerHTML = messages.map(msg => {
            const isSent = msg.SenderID == currentUserId;
            const messageDate = new Date(msg.SentDate);
            const timeStr = messageDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="message-bubble ${isSent ? 'sent' : 'received'}">
                    <p class="message-text">${escapeHtml(msg.MessageText)}</p>
                    <span class="message-time">${timeStr}</span>
                </div>
            `;
        }).join('');
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = 
            '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Mesajlar yüklenirken hata oluştu</p>';
    }
}

// Send message
async function sendMessage() {
    const currentUserId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !currentChatUserId || !currentUserId) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderID: parseInt(currentUserId),
                receiverID: parseInt(currentChatUserId),
                messageText: messageText
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.message || 'Mesaj gönderilemedi. Sadece arkadaşlarınıza mesaj gönderebilirsiniz.');
            return;
        }
        
        // Clear input
        messageInput.value = '';
        
        // Reload messages
        await loadMessages();
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Mesaj gönderilirken hata oluştu');
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================================
// Edit Profile Functions
// =============================================

function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    const username = document.getElementById('profileUsername').textContent;
    const bio = document.getElementById('profileBio').textContent;
    
    // Set current values
    document.getElementById('editUsername').value = username;
    document.getElementById('editBio').value = bio === 'Henüz bir biyografi eklenmemiş.' ? '' : bio;
    
    // Update character count
    updateBioCharCount();
    
    // Show modal
    modal.style.display = 'flex';
    
    // Add event listeners
    document.getElementById('editBio').addEventListener('input', updateBioCharCount);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'none';
    
    // Remove event listeners
    document.getElementById('editBio').removeEventListener('input', updateBioCharCount);
    document.getElementById('saveProfileBtn').removeEventListener('click', saveProfile);
}

function updateBioCharCount() {
    const bioInput = document.getElementById('editBio');
    const charCount = document.getElementById('bioCharCount');
    charCount.textContent = `${bioInput.value.length}/500 karakter`;
}

async function saveProfile() {
    const username = document.getElementById('editUsername').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    
    if (!username) {
        showToast('Kullanıcı adı boş olamaz', 'error');
        return;
    }
    
    const saveBtn = document.getElementById('saveProfileBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Kaydediliyor...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Username: username,
                Bio: bio
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Profil güncellenirken hata oluştu');
        }
        
        // Update localStorage
        localStorage.setItem('username', username);
        sessionStorage.setItem('username', username);
        
        // Update UI
        document.getElementById('profileUsername').textContent = username;
        document.getElementById('profileBio').textContent = bio || 'Henüz bir biyografi eklenmemiş.';
        
        // Update header dropdown if exists
        const displayName = document.getElementById('userDisplayName');
        if (displayName) {
            displayName.textContent = username;
        }
        
        showToast('Profil başarıyla güncellendi!', 'success');
        closeEditProfileModal();
        
    } catch (error) {
        console.error('Profile update error:', error);
        showToast(error.message || 'Profil güncellenirken hata oluştu', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Kaydet';
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('editProfileModal');
    if (e.target === modal) {
        closeEditProfileModal();
    }
});
