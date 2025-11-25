// =============================================
// Track Detail Page JavaScript
// =============================================

let currentTrack = null;
let isPlaying = false;
let currentProgressValue = 0;
let progressInterval = null;
let audioPlayer = null;

// API Base URL
const API_BASE_URL = '/api';

// Check authentication
window.addEventListener('DOMContentLoaded', async () => {
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

    // Load user info
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    const userId = localStorage.getItem('userID') || localStorage.getItem('userId') || sessionStorage.getItem('userID') || sessionStorage.getItem('userId');
    
    if (username) {
        const displayName = document.getElementById('userDisplayName');
        if (displayName) {
            displayName.textContent = username;
        }
    }
    
    // Load avatar from database
    if (userId) {
        const avatar = document.getElementById('userAvatar')?.querySelector('img');
        
        // First, try to load cached avatar immediately
        const cachedAvatar = localStorage.getItem('avatarUrl');
        if (cachedAvatar && avatar) {
            avatar.src = cachedAvatar;
        }
        
        // Then fetch fresh data and update cache
        fetch(`${API_BASE_URL}/users/${userId}`)
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

    // First load the track details
    await loadTrackDetails();
    
    // Then restore player state after a short delay
    setTimeout(() => {
        restorePlayerState();
    }, 500);
});

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

// Get track ID or slug from URL
function getTrackIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('slug');
}

// Load track details from API
async function loadTrackDetails() {
    const identifier = getTrackIdFromURL();
    
    if (!identifier) {
        showError('Şarkı ID veya slug bulunamadı');
        return;
    }

    try {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        const url = userId 
            ? `${API_BASE_URL}/tracks/${identifier}?userId=${userId}`
            : `${API_BASE_URL}/tracks/${identifier}`;
            
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Şarkı bulunamadı');
        }

        const track = await response.json();
        console.log('Track loaded:', track);
        currentTrack = track;
        displayTrackDetails(track);
        loadComments(track.TrackID);
        generateWaveform();
    } catch (error) {
        console.error('Şarkı yükleme hatası:', error);
        showError('Şarkı detayları yüklenemedi: ' + error.message);
    }
}

// Display track details
function displayTrackDetails(track) {
    const container = document.getElementById('trackDetailContent');
    const coverUrl = getCoverImage(track.TrackID);
    const uploadDate = new Date(track.UploadDate).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    container.innerHTML = `
        <div class="track-hero">
            <div class="track-hero-cover">
                <img src="${coverUrl}" alt="${track.Title}">
            </div>
            <div class="track-hero-info">
                <span class="track-genre">${track.Genre || 'Electronic'}</span>
                <h1 class="track-hero-title">${track.Title}</h1>
                <div class="track-hero-artist" style="cursor: pointer;" onclick="window.location.href='profile.html?id=${track.UserID}'">
                    <img src="https://i.pravatar.cc/150?u=${track.Username}" alt="${track.Username}">
                    <div>
                        <div class="artist-name">${track.Username}</div>
                        <div class="upload-date">${uploadDate}</div>
                    </div>
                </div>
                <div class="track-hero-controls">
                    <button class="play-track-btn" onclick="playCurrentTrack()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        Play
                    </button>
                    <button class="like-track-btn ${track.IsLiked ? 'liked' : ''}" onclick="toggleTrackLike()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span id="likeCount">${track.LikeCount || 0}</span>
                    </button>
                    <button class="share-btn" onclick="shareTrack()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        Share
                    </button>
                </div>
                <div class="track-stats">
                    <div class="stat-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <span id="playCount">${track.PlayCount || 0}</span> dinlenme
                    </div>
                    <div class="stat-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span id="likeCountStat">${track.LikeCount || 0}</span> beğeni
                    </div>
                    <div class="stat-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span id="commentCount">${track.CommentCount || 0}</span> yorum
                    </div>
                </div>
            </div>
        </div>

        <div class="waveform-section">
            <div class="waveform-large" id="waveformLarge"></div>
        </div>

        <div class="comments-section">
            <h3>Comments</h3>
            <div class="comment-input">
                <img src="https://i.pravatar.cc/150?u=currentuser" alt="Your avatar">
                <input type="text" id="commentInput" placeholder="Write a comment...">
                <button class="post-comment-btn" onclick="postComment()">Post</button>
            </div>
            <div class="comments-list" id="commentsList">
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading comments...</p>
                </div>
            </div>
        </div>
    `;

    // Hide loading, show content
    document.getElementById('trackLoading').style.display = 'none';
    document.getElementById('trackDetailContent').style.display = 'block';
}

// Load comments
async function loadComments(trackId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tracks/${trackId}/comments`);
        const comments = await response.json();
        
        if (!response.ok) {
            console.error('Comments API error:', comments);
            throw new Error(comments.message || 'Yorumlar yüklenemedi');
        }
        
        displayComments(comments);
    } catch (error) {
        console.error('Yorumlar yükleme hatası:', error);
        document.getElementById('commentsList').innerHTML = '<p style="text-align: center; color: var(--text-muted);">Henüz yorum yok</p>';
    }
}

// Display comments
function displayComments(comments) {
    const container = document.getElementById('commentsList');
    
    if (!comments || comments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Henüz yorum yok. İlk yorumu siz yapın!</p>';
        return;
    }

    container.innerHTML = comments.map(comment => {
        const timeAgo = getTimeAgo(new Date(comment.PostedAt));
        return `
            <div class="comment-item">
                <img class="comment-avatar" src="https://i.pravatar.cc/150?u=${comment.Username}" alt="${comment.Username}">
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.Username}</span>
                        <span class="comment-time">${timeAgo}</span>
                    </div>
                    <p class="comment-text">${escapeHtml(comment.Content)}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Post comment
async function postComment() {
    const input = document.getElementById('commentInput');
    const commentText = input.value.trim();

    if (!commentText) {
        return;
    }

    try {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        const response = await fetch(`${API_BASE_URL}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                trackId: currentTrack.TrackID,
                userId: parseInt(userId),
                content: commentText,
                timestampSeconds: null
            })
        });

        if (!response.ok) {
            throw new Error('Failed to post comment');
        }

        // Clear input
        input.value = '';

        // Reload comments
        await loadComments(currentTrack.TrackID);

        // Update comment count
        const commentCount = document.getElementById('commentCount');
        const currentCount = parseInt(commentCount.textContent);
        commentCount.textContent = `${currentCount + 1} comments`;

    } catch (error) {
        console.error('Yorum gönderme hatası:', error);
        alert('Yorum gönderilemedi. Lütfen tekrar deneyin.');
    }
}

// Generate waveform
function generateWaveform() {
    const container = document.getElementById('waveformLarge');
    container.innerHTML = '';
    
    const barCount = 100;
    
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'waveform-bar-large';
        const height = Math.random() * 100;
        bar.style.height = `${height}%`;
        
        bar.addEventListener('click', () => {
            const progress = (i / barCount) * 100;
            seekToPosition(progress);
        });
        
        container.appendChild(bar);
    }
}

// Seek to position
function seekToPosition(progressPercent) {
    // TODO: Implement seeking when audio player is integrated
    console.log('Seek to:', progressPercent + '%');
}

// Play current track
async function playCurrentTrack() {
    // Get the track from the page (not from player state)
    const trackId = getTrackIdFromURL();
    if (!trackId) return;
    
    // Fetch the track details to ensure we have complete data
    try {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        const url = userId 
            ? `${API_BASE_URL}/tracks/${trackId}?userId=${userId}`
            : `${API_BASE_URL}/tracks/${trackId}`;
            
        const response = await fetch(url);
        if (response.ok) {
            const track = await response.json();
            // Set currentTrack to THIS page's track
            currentTrack = track;
            console.log('▶️ Playing page track:', track.TrackID, '-', track.Title);
        }
    } catch (error) {
        console.error('Error loading track for play:', error);
        // If fetch fails, try to use existing currentTrack
        if (!currentTrack) return;
    }
    
    // Update button
    const playBtn = document.querySelector('.play-track-btn');
    if (playBtn) {
        playBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            Playing
        `;
    }
    
    // Start playing in the local player
    playTrackInDetailPage();
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
            
            // Also update the main like button if on detail page
            const mainLikeBtn = document.querySelector('.like-track-btn');
            if (mainLikeBtn) {
                mainLikeBtn.classList.toggle('liked', data.data.isLiked);
            }
            
            const likeCountSpan = document.getElementById('likeCount');
            if (likeCountSpan) {
                likeCountSpan.textContent = data.data.totalLikes;
            }
            
            // Update stats section like count
            const likeCountStat = document.getElementById('likeCountStat');
            if (likeCountStat) {
                likeCountStat.textContent = data.data.totalLikes;
            }
            
            // Save updated state
            savePlayerState();
            
            console.log('❤️ Player like:', data.data.isLiked ? 'liked' : 'unliked');
        }
    } catch (error) {
        console.error('Error toggling player like:', error);
    }
}

// Toggle like
async function toggleTrackLike() {
    if (!currentTrack) return;

    const likeBtn = document.querySelector('.like-track-btn');
    const likeCountSpan = document.getElementById('likeCount');
    const isLiked = likeBtn.classList.contains('liked');

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

        if (!data.success) {
            throw new Error('Failed to toggle like');
        }

        // Update UI from API response
        likeBtn.classList.toggle('liked', data.data.isLiked);
        likeCountSpan.textContent = data.data.totalLikes;
        
        // Update currentTrack like status
        currentTrack.IsLiked = data.data.isLiked;
        currentTrack.LikeCount = data.data.totalLikes;
        
        // Also update player like button
        const playerLikeBtn = document.getElementById('playerLikeBtn');
        if (playerLikeBtn) {
            playerLikeBtn.classList.toggle('liked', data.data.isLiked);
        }
        
        // Update stats section like count
        const likeCountStat = document.getElementById('likeCountStat');
        if (likeCountStat) {
            likeCountStat.textContent = data.data.totalLikes;
        }
        
        // Save updated state
        savePlayerState();

    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

// Share track
function shareTrack() {
    if (!currentTrack) return;

    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: currentTrack.Title,
            text: `${currentTrack.Username} sanatçısının ${currentTrack.Title} şarkısını Frekans'ta dinle`,
            url: url
        }).catch(err => console.log('Paylaşım hatası:', err));
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert('Link panoya kopyalandı!');
        }).catch(err => {
            console.error('Kopyalama hatası:', err);
        });
    }
}

// Utility: Get cover image
function getCoverImage(track, size = 'small') {
    if (typeof track === 'number') {
        // If just trackId is passed
        const dimensions = {
            thumb: 40,
            small: 80,
            large: 300
        };
        const dim = dimensions[size] || 80;
        return `https://picsum.photos/seed/${track}/${dim}/${dim}`;
    }
    
    if (track.CoverImageUrl && track.CoverImageUrl.trim() && !track.CoverImageUrl.includes('placeholder')) {
        return track.CoverImageUrl;
    }
    
    const dimensions = {
        thumb: 40,
        small: 80,
        large: 300
    };
    
    const dim = dimensions[size] || 80;
    const seed = track.TrackID || Math.floor(Math.random() * 1000);
    
    return `https://picsum.photos/seed/${seed}/${dim}/${dim}`;
}

// Utility: Format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Utility: Time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + ' year' + (interval > 1 ? 's' : '') + ' ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + ' month' + (interval > 1 ? 's' : '') + ' ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + ' day' + (interval > 1 ? 's' : '') + ' ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + ' hour' + (interval > 1 ? 's' : '') + ' ago';
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + ' minute' + (interval > 1 ? 's' : '') + ' ago';
    
    return 'Just now';
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error
function showError(message) {
    document.getElementById('trackLoading').style.display = 'none';
    document.getElementById('trackDetailContent').style.display = 'block';
    
    const container = document.getElementById('trackDetailContent');
    container.innerHTML = `
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
// Player Functions (from app.js)
// =============================================

// Save player state to localStorage
function savePlayerState() {
    if (currentTrack) {
        localStorage.setItem('playerState', JSON.stringify({
            track: currentTrack,
            trackIndex: -1,
            progress: currentProgressValue,
            isPlaying: isPlaying,
            timestamp: Date.now()
        }));
    }
}

// Restore player state from localStorage
function restorePlayerState() {
    const savedState = localStorage.getItem('playerState');
    if (!savedState) return;
    
    try {
        const state = JSON.parse(savedState);
        const timeDiff = (Date.now() - state.timestamp) / 1000;
        
        if (timeDiff < 3600) {
            // Get current page track ID - wait for currentTrack to be loaded
            const currentPageTrackId = currentTrack ? currentTrack.TrackID : null;
            const savedTrackId = state.track.TrackID;
            
            console.log('🔄 Detail page restore check:');
            console.log('  Saved:', savedTrackId, '-', state.track.Title);
            console.log('  Page:', currentPageTrackId);
            
            // Always show player with saved track info
            document.getElementById('stickyPlayer').style.display = 'flex';
            
            const coverImg = document.getElementById('playerCover');
            coverImg.src = getCoverImage(state.track, 'small');
            coverImg.onerror = function() {
                this.onerror = null;
                this.src = 'https://picsum.photos/80/80?random=' + state.track.TrackID;
            };
            
            document.getElementById('playerTitle').textContent = state.track.Title;
            document.getElementById('playerArtist').textContent = state.track.Username || state.track.ArtistName;
            document.getElementById('totalTime').textContent = formatTime(state.track.Duration);
            document.getElementById('progressSlider').value = state.progress;
            document.getElementById('progressFill').style.width = `${state.progress}%`;
            
            // Add click handlers for navigation
            const playerCoverWrapper = document.getElementById('playerCoverWrapper');
            const playerTitle = document.getElementById('playerTitle');
            const playerArtist = document.getElementById('playerArtist');
            const artistId = state.track.UserID; // Her zaman UserID kullan
            
            if (playerCoverWrapper && state.track.TrackID) {
                playerCoverWrapper.onclick = () => window.location.href = `track-detail.html?id=${state.track.TrackID}`;
            }
            if (playerTitle && state.track.TrackID) {
                playerTitle.onclick = () => window.location.href = `track-detail.html?id=${state.track.TrackID}`;
            }
            if (playerArtist && artistId) {
                playerArtist.onclick = () => window.location.href = `profile.html?id=${artistId}`;
            }
            
            const currentSeconds = Math.floor((state.progress / 100) * state.track.Duration);
            document.getElementById('currentTime').textContent = formatTime(currentSeconds);
            
            // If saved track is DIFFERENT from page track, restore it to currentTrack
            if (savedTrackId !== currentPageTrackId) {
                currentTrack = state.track;
                currentProgressValue = state.progress;
                console.log('✅ Different track restored to player');
            } else {
                // Same track - update currentTrack and progress
                currentTrack = state.track;
                currentProgressValue = state.progress;
                console.log('✅ Same track - UI updated');
            }
            
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
            if (state.isPlaying) {
                isPlaying = true;
                document.getElementById('playBtn').classList.add('playing');
            } else {
                isPlaying = false;
                document.getElementById('playBtn').classList.remove('playing');
            }
            
            // Update player like button state
            const playerLikeBtn = document.getElementById('playerLikeBtn');
            if (playerLikeBtn && state.track.IsLiked !== undefined) {
                playerLikeBtn.classList.toggle('liked', state.track.IsLiked);
            }
        }
    } catch (error) {
        console.error('Failed to restore player state:', error);
    }
}

function playTrackInDetailPage() {
    if (!currentTrack) {
        console.error('❌ No current track');
        return;
    }
    
    if (!currentTrack.Duration) {
        console.error('❌ Track has no Duration:', currentTrack);
        return;
    }
    
    console.log('🎵 Playing track in detail page:');
    console.log('  TrackID:', currentTrack.TrackID);
    console.log('  Title:', currentTrack.Title);
    console.log('  Artist:', currentTrack.Username || currentTrack.ArtistName);
    console.log('  Duration:', currentTrack.Duration);
    
    // Show player
    document.getElementById('stickyPlayer').style.display = 'flex';
    
    // Update player UI with current track
    const coverImg = document.getElementById('playerCover');
    coverImg.src = getCoverImage(currentTrack.TrackID, 'small');
    coverImg.onerror = function() {
        this.onerror = null;
        this.src = 'https://picsum.photos/80/80?random=' + currentTrack.TrackID;
    };
    
    document.getElementById('playerTitle').textContent = currentTrack.Title;
    document.getElementById('playerArtist').textContent = currentTrack.Username || currentTrack.ArtistName;
    document.getElementById('totalTime').textContent = formatTime(currentTrack.Duration);
    document.getElementById('currentTime').textContent = '0:00';
    
    // Add click handlers for navigation
    const playerCoverWrapper = document.getElementById('playerCoverWrapper');
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const artistId = currentTrack.UserID; // Her zaman UserID kullan
    
    if (playerCoverWrapper && currentTrack.TrackID) {
        playerCoverWrapper.onclick = () => window.location.href = `track-detail.html?id=${currentTrack.TrackID}`;
    }
    if (playerTitle && currentTrack.TrackID) {
        playerTitle.onclick = () => window.location.href = `track-detail.html?id=${currentTrack.TrackID}`;
    }
    if (playerArtist && artistId) {
        playerArtist.onclick = () => window.location.href = `profile.html?id=${artistId}`;
    }
    
    // Update player like button state
    const playerLikeBtn = document.getElementById('playerLikeBtn');
    if (playerLikeBtn && currentTrack.IsLiked !== undefined) {
        playerLikeBtn.classList.toggle('liked', currentTrack.IsLiked);
    }
    
    // Reset progress
    currentProgressValue = 0;
    document.getElementById('progressSlider').value = 0;
    document.getElementById('progressFill').style.width = '0%';
    
    // Load and play audio
    if (currentTrack.AudioUrl) {
        audioPlayer.src = currentTrack.AudioUrl;
        audioPlayer.load();
        audioPlayer.play().catch(err => {
            console.error('Play error:', err);
            isPlaying = false;
            document.getElementById('playBtn').classList.remove('playing');
        });
    }
    
    // Save player state
    savePlayerState();
    console.log('💾 Player state saved:');
    console.log('  TrackID:', currentTrack.TrackID);
    console.log('  Title:', currentTrack.Title);
    console.log('  Progress:', currentProgressValue);
    
    // Record play count
    recordPlay(currentTrack.TrackID);
}

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

function startProgressSimulation() {
    // No longer needed - audio player handles progress
}

function stopProgressSimulation() {
    // No longer needed - audio player handles progress
}

async function recordPlay(trackId) {
    try {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        
        if (!userId) return;
        
        const response = await fetch(`${API_BASE_URL}/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: parseInt(userId),
                trackId: trackId
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update play count in UI
            const playCountSpan = document.getElementById('playCount');
            if (playCountSpan) {
                playCountSpan.textContent = formatNumber(data.data.playCount);
            }
            console.log('▶️ Play recorded - Total plays:', data.data.playCount);
        }
    } catch (error) {
        console.error('❌ Play recording error:', error);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =============================================
// Player Event Listeners
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Comment input enter key
    const commentInput = document.getElementById('commentInput');
    if (commentInput) {
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                postComment();
            }
        });
    }
    
    // Player controls
    document.getElementById('playBtn')?.addEventListener('click', togglePlay);
    
    // Player like button
    document.getElementById('playerLikeBtn')?.addEventListener('click', () => {
        if (currentTrack) {
            togglePlayerLike();
        }
    });
    
    // Progress slider
    const progressSlider = document.getElementById('progressSlider');
    progressSlider?.addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('progressFill').style.width = `${value}%`;
        
        if (audioPlayer && audioPlayer.duration) {
            const currentSeconds = Math.floor((value / 100) * audioPlayer.duration);
            document.getElementById('currentTime').textContent = formatTime(currentSeconds);
        }
    });
    
    progressSlider?.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        
        if (audioPlayer && audioPlayer.duration) {
            const seekTime = (value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = seekTime;
        }
    });
    
    // Volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider?.addEventListener('input', (e) => {
        if (audioPlayer) {
            audioPlayer.volume = e.target.value / 100;
        }
    });
    
    // Volume slider
    document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
        console.log('🔊 Volume:', e.target.value);
    });
    
    // User dropdown toggle
    document.getElementById('userAvatar')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    });
    
    // Profile button
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (userId) {
            window.location.href = `/profile.html?id=${userId}`;
        } else {
            window.location.href = '/login.html';
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userId');
        window.location.href = '/login.html';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    });
});

// Save state before leaving page
window.addEventListener('beforeunload', () => {
    if (isPlaying) {
        savePlayerState();
    }
});

// Refresh like count when page becomes visible (user switches back to tab)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentTrack) {
        // Only refresh like count, don't reload entire page
        refreshLikeCount();
    }
});

// Also refresh when window gets focus (user switches back from another window)
window.addEventListener('focus', () => {
    if (currentTrack) {
        refreshLikeCount();
    }
});

// Refresh like count without reloading entire page
async function refreshLikeCount() {
    try {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        const url = userId 
            ? `${API_BASE_URL}/tracks/${currentTrack.TrackID}?userId=${userId}`
            : `${API_BASE_URL}/tracks/${currentTrack.TrackID}`;
            
        const response = await fetch(url);
        if (response.ok) {
            const track = await response.json();
            
            // Update like count in UI
            const likeCountSpan = document.getElementById('likeCount');
            if (likeCountSpan) {
                likeCountSpan.textContent = track.LikeCount || 0;
            }
            
            const likeCountStat = document.getElementById('likeCountStat');
            if (likeCountStat) {
                likeCountStat.textContent = track.LikeCount || 0;
            }
            
            // Update like button state
            const mainLikeBtn = document.querySelector('.like-track-btn');
            if (mainLikeBtn) {
                if (track.IsLiked) {
                    mainLikeBtn.classList.add('liked');
                } else {
                    mainLikeBtn.classList.remove('liked');
                }
            }
            
            // Update currentTrack
            currentTrack.LikeCount = track.LikeCount;
            currentTrack.IsLiked = track.IsLiked;
            
            console.log('🔄 Like count refreshed:', track.LikeCount);
        }
    } catch (error) {
        console.error('Failed to refresh like count:', error);
    }
}

// Watch for URL changes (when user clicks another track link while on detail page)
let lastTrackId = getTrackIdFromURL();
setInterval(() => {
    const currentTrackId = getTrackIdFromURL();
    if (currentTrackId && currentTrackId !== lastTrackId) {
        console.log('🔄 Track ID changed from', lastTrackId, 'to', currentTrackId);
        lastTrackId = currentTrackId;
        // Reload the page to load new track
        location.reload();
    }
}, 500);

// =============================================
// ADD TO PLAYLIST FUNCTIONALITY
// =============================================

let currentTrackToAdd = null;

// Open add to playlist modal
async function openAddToPlaylistModal(trackId) {
    currentTrackToAdd = trackId;
    const modal = document.getElementById('addToPlaylistModal');
    if (modal) {
        modal.classList.add('active');
        await loadPlaylistsForSelection();
    }
}

// Close add to playlist modal
function closeAddToPlaylistModal() {
    const modal = document.getElementById('addToPlaylistModal');
    if (modal) {
        modal.classList.remove('active');
        currentTrackToAdd = null;
    }
}

// Load playlists for selection
async function loadPlaylistsForSelection() {
    const container = document.getElementById('playlistSelectionList');
    if (!container) return;
    
    const userId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    
    try {
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Çalma listeleri yükleniyor...</p></div>';
        
        const response = await fetch(`${API_BASE_URL}/playlists/user/${userId}?userId=${userId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load playlists');
        }
        
        const playlists = await response.json();
        
        if (!playlists || playlists.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Henüz çalma listeniz yok</p>
                    <p style="font-size: 14px; margin-top: 8px;">Önce bir çalma listesi oluşturun</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = playlists.map(playlist => `
            <div class="playlist-selection-item" onclick="addTrackToSelectedPlaylist(${playlist.PlaylistID})">
                <img class="playlist-selection-cover" src="${playlist.CoverImageUrl || `https://picsum.photos/seed/playlist${playlist.PlaylistID}/300/300`}" alt="${playlist.Name}">
                <div class="playlist-selection-info">
                    <div class="playlist-selection-name">${playlist.Name}</div>
                    <div class="playlist-selection-count">${playlist.TrackCount || 0} şarkı</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading playlists:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Çalma listeleri yüklenirken hata oluştu</p>';
    }
}

// Add track to selected playlist
async function addTrackToSelectedPlaylist(playlistId) {
    if (!currentTrackToAdd) return;
    
    const userId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                trackId: currentTrackToAdd,
                userId: parseInt(userId)
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Şarkı eklenemedi');
        }
        
        showToast('Şarkı çalma listesine eklendi', 'success');
        closeAddToPlaylistModal();
        
    } catch (error) {
        console.error('Error adding track to playlist:', error);
        if (error.message.includes('already exists') || error.message.includes('zaten')) {
            showToast('Bu şarkı zaten çalma listesinde', 'warning');
        } else {
            showToast('Şarkı eklenirken hata oluştu', 'error');
        }
    }
}

// Setup add to playlist button
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addToPlaylistBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (currentTrack) {
                openAddToPlaylistModal(currentTrack.TrackID);
            }
        });
    }
});
