// =============================================
// Playlist Page JavaScript
// =============================================

const API_BASE_URL = 'http://localhost:3000/api';
let currentPlaylistId = null;
let currentUserId = null;
let playlistTracks = [];
let currentTrackIndex = 0;
let isPlaying = false;
let audioPlayer = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Playlist page loaded');
    
    // Get playlist ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentPlaylistId = urlParams.get('id');
    
    console.log('Playlist ID from URL:', currentPlaylistId);
    
    if (!currentPlaylistId) {
        console.log('No playlist ID, redirecting to library');
        window.location.href = 'library.html';
        return;
    }
    
    checkAuth();
    setupPlayer();
    setupEventListeners();
    loadPlaylistData();
});

// Check authentication
function checkAuth() {
    // Check for user ID in multiple ways
    const userIdFromStorage = localStorage.getItem('userID') || 
                             localStorage.getItem('userId') || 
                             sessionStorage.getItem('userID') || 
                             sessionStorage.getItem('userId');
    
    // Also check user object
    const userFromLocal = localStorage.getItem('user');
    const userFromSession = sessionStorage.getItem('user');
    
    let userId = null;
    
    if (userIdFromStorage) {
        userId = parseInt(userIdFromStorage);
    } else if (userFromLocal) {
        try {
            const user = JSON.parse(userFromLocal);
            userId = user.UserID || user.userId;
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
        }
    } else if (userFromSession) {
        try {
            const user = JSON.parse(userFromSession);
            userId = user.UserID || user.userId;
        } catch (e) {
            console.error('Error parsing user from sessionStorage:', e);
        }
    }
    
    if (!userId) {
        console.log('No user ID found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    currentUserId = userId;
    console.log('User authenticated, ID:', currentUserId);
    loadUserAvatar();
}

// Load user avatar
async function loadUserAvatar() {
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    
    // Set username in dropdown
    if (username) {
        const userDisplayName = document.getElementById('userDisplayName');
        if (userDisplayName) {
            userDisplayName.textContent = username;
        }
    }
    
    const avatarImg = document.querySelector('#userAvatar img');
    
    const cachedAvatar = localStorage.getItem('avatarUrl');
    if (cachedAvatar && avatarImg) {
        avatarImg.src = cachedAvatar;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUserId}`);
        if (response.ok) {
            const data = await response.json();
            const avatarUrl = data.AvatarUrl || `https://i.pravatar.cc/150?u=${data.Username}`;
            if (avatarImg) {
                avatarImg.src = avatarUrl;
                localStorage.setItem('avatarUrl', avatarUrl);
            }
        }
    } catch (error) {
        console.error('Avatar load error:', error);
    }
}

// Setup audio player
function setupPlayer() {
    audioPlayer = document.getElementById('audioPlayer');
    
    // Initialize play button state
    const playBtn = document.getElementById('playPauseBtn');
    if (playBtn) {
        playBtn.classList.remove('playing');
    }
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', playNext);
    audioPlayer.addEventListener('play', updatePlayButton);
    audioPlayer.addEventListener('pause', updatePlayButton);
    audioPlayer.addEventListener('loadedmetadata', () => {
        const totalTime = document.getElementById('totalTime');
        if (totalTime) {
            totalTime.textContent = formatTime(audioPlayer.duration);
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('playAllBtn').addEventListener('click', playAll);
    document.getElementById('addTrackBtn').addEventListener('click', toggleAddTrackSection);
    document.getElementById('deletePlaylistBtn').addEventListener('click', deletePlaylist);
    document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
    document.getElementById('prevBtn').addEventListener('click', playPrevious);
    document.getElementById('nextBtn').addEventListener('click', playNext);
    document.getElementById('volumeSlider').addEventListener('input', changeVolume);
    document.getElementById('progressSlider').addEventListener('input', seek);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // User dropdown toggle
    document.getElementById('userAvatar')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('userDropdown');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Profile button
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        const userId = localStorage.getItem('userId') || localStorage.getItem('userID') || sessionStorage.getItem('userId');
        if (userId) {
            window.location.href = `/profile.html?id=${userId}`;
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    });
    
    // Search
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            document.getElementById('searchResults').classList.remove('active');
            return;
        }
        
        searchTimeout = setTimeout(() => searchTracks(query), 300);
    });
}

// Load playlist data
async function loadPlaylistData() {
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/tracks`);
        if (!response.ok) throw new Error('Failed to load playlist');
        
        const result = await response.json();
        playlistTracks = result.data || result;
        
        // Update header (assuming first track has playlist info)
        if (playlistTracks.length > 0) {
            // Get playlist details
            const playlistResponse = await fetch(`${API_BASE_URL}/playlists?userId=${currentUserId}`);
            const playlistResult = await playlistResponse.json();
            const playlists = playlistResult.data || playlistResult;
            const playlist = playlists.find(p => p.PlaylistID == currentPlaylistId);
            
            if (playlist) {
                document.getElementById('playlistPageTitle').textContent = playlist.Name;
                document.getElementById('playlistPageDescription').textContent = playlist.Description || '';
                document.getElementById('playlistPageTrackCount').textContent = `${playlist.TrackCount} şarkı`;
                
                // Update cover image
                const coverEl = document.querySelector('#playlistPageCover img');
                if (coverEl) {
                    coverEl.src = playlist.CoverImageUrl || `https://picsum.photos/seed/playlist${currentPlaylistId}/300/300`;
                }
            }
        }
        
        renderTracks();
        
    } catch (error) {
        console.error('Load playlist error:', error);
        document.getElementById('playlistTracks').innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-muted);">Playlist yüklenemedi</p>';
    }
}

// Render tracks
function renderTracks() {
    const container = document.getElementById('playlistTracks');
    
    if (playlistTracks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                </svg>
                <h3>Bu listede henüz şarkı yok</h3>
                <p>Şarkı eklemek için yukarıdaki + butonuna tıklayın</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = playlistTracks.map((track, index) => `
        <div class="playlist-track-row" data-index="${index}" onclick="playTrack(${index})">
            <div class="track-number">${index + 1}</div>
            <div class="track-cover">
                <img src="${getCoverImage(track)}" alt="${track.Title}">
                <div class="track-play-overlay">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </div>
            </div>
            <div class="track-info">
                <div class="track-title">${track.Title}</div>
                <div class="track-artist">${track.Username || 'Unknown Artist'}</div>
            </div>
            <div class="track-actions">
                <button class="btn-icon-sm" onclick="event.stopPropagation(); removeTrack(${track.TrackID})" title="Listeden Çıkar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Play all tracks
function playAll() {
    if (playlistTracks.length === 0) return;
    currentTrackIndex = 0;
    playTrack(0);
}

// Play specific track
function playTrack(index) {
    if (index < 0 || index >= playlistTracks.length) return;
    
    currentTrackIndex = index;
    const track = playlistTracks[index];
    
    // Update UI
    document.querySelectorAll('.playlist-track-row').forEach((row, i) => {
        row.classList.toggle('playing', i === index);
    });
    
    // Update player
    audioPlayer.src = track.AudioUrl;
    audioPlayer.load();
    audioPlayer.play().catch(err => console.error('Play error:', err));
    
    // Update player info
    document.getElementById('playerTitle').textContent = track.Title;
    document.getElementById('playerArtist').textContent = track.Username || 'Unknown Artist';
    document.getElementById('playerCover').src = getCoverImage(track);
    document.getElementById('stickyPlayer').style.display = 'block';
    
    // Add click handlers for navigation
    const playerCoverWrapper = document.getElementById('playerCoverWrapper');
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const artistId = track.ArtistID || track.UserID;
    
    if (playerCoverWrapper && track.TrackID) {
        playerCoverWrapper.onclick = () => window.location.href = `track-detail.html?id=${track.TrackID}`;
    }
    if (playerTitle && track.TrackID) {
        playerTitle.onclick = () => window.location.href = `track-detail.html?id=${track.TrackID}`;
    }
    if (playerArtist && artistId) {
        playerArtist.onclick = () => window.location.href = `profile.html?id=${artistId}`;
    }
    
    updatePlayButton();
}

// Toggle play/pause
function togglePlayPause() {
    if (!audioPlayer.src) {
        // Eğer şarkı yoksa ilk şarkıyı çal
        if (playlistTracks.length > 0) {
            playTrack(0);
        }
        return;
    }
    
    if (audioPlayer.paused) {
        audioPlayer.play().catch(err => console.error('Play error:', err));
    } else {
        audioPlayer.pause();
    }
}

// Play next
function playNext() {
    if (currentTrackIndex < playlistTracks.length - 1) {
        playTrack(currentTrackIndex + 1);
    } else {
        // Loop back to first track
        playTrack(0);
    }
}

// Play previous
function playPrevious() {
    if (currentTrackIndex > 0) {
        playTrack(currentTrackIndex - 1);
    } else {
        // Go to last track
        playTrack(playlistTracks.length - 1);
    }
}

// Update play button icon
function updatePlayButton() {
    const btn = document.getElementById('playPauseBtn');
    
    if (!audioPlayer.paused) {
        btn.classList.add('playing');
    } else {
        btn.classList.remove('playing');
    }
}

// Update progress
function updateProgress() {
    const current = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    
    if (duration) {
        const percentage = (current / duration) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        document.getElementById('progressSlider').value = percentage;
        document.getElementById('currentTime').textContent = formatTime(current);
        document.getElementById('totalTime').textContent = formatTime(duration);
    }
}

// Seek
function seek(e) {
    const seekTime = (e.target.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
}

// Change volume
function changeVolume(e) {
    const volume = e.target.value / 100;
    audioPlayer.volume = volume;
    
    // Update slider background
    const percentage = e.target.value;
    e.target.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${percentage}%, var(--border-color) ${percentage}%, var(--border-color) 100%)`;
}

// Toggle add track section
function toggleAddTrackSection() {
    const section = document.getElementById('addTrackSection');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
    
    if (section.style.display === 'block') {
        document.getElementById('searchInput').focus();
    } else {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').classList.remove('active');
    }
}

// Search tracks
async function searchTracks(query) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.classList.add('active');
    resultsContainer.innerHTML = '<div class="loading-state"><p>Aranıyor...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/tracks/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const result = await response.json();
        const tracks = result.data || result;
        
        if (tracks.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state"><p>Sonuç bulunamadı</p></div>';
            return;
        }
        
        resultsContainer.innerHTML = tracks.map(track => `
            <div class="search-result-item">
                <img src="${getCoverImage(track)}" alt="${track.Title}" class="search-result-cover">
                <div class="search-result-info">
                    <div class="search-result-title">${track.Title}</div>
                    <div class="search-result-artist">${track.Username || 'Unknown Artist'}</div>
                </div>
                <button class="search-result-add" onclick="addTrackToPlaylist(${track.TrackID})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<div class="empty-state"><p>Arama hatası</p></div>';
    }
}

// Add track to playlist
async function addTrackToPlaylist(trackId) {
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackId, userId: currentUserId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            showToast(error.message || 'Şarkı eklenemedi', 'error');
            return;
        }
        
        showToast('Şarkı başarıyla eklendi', 'success');
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').classList.remove('active');
        document.getElementById('addTrackSection').style.display = 'none';
        
        // Reload playlist
        await loadPlaylistData();
        
    } catch (error) {
        console.error('Add track error:', error);
        alert('Bir hata oluştu');
    }
}

// Remove track from playlist
function removeTrack(trackId) {
    showConfirm(
        'Şarkıyı Çıkar',
        'Bu şarkıyı çalma listesinden çıkarmak istediğinizden emin misiniz?',
        async () => {
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/tracks/${trackId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId })
        });
        
        if (!response.ok) throw new Error('Remove failed');
        
        // Reload playlist
        await loadPlaylistData();
        showToast('Şarkı listeden çıkarıldı', 'success');
        
    } catch (error) {
        console.error('Remove track error:', error);
        showToast('Şarkı çıkarılamadı', 'error');
    }
        }
    );
}

// Delete playlist
function deletePlaylist() {
    showConfirm(
        'Playlist\'i Sil',
        'Bu çalma listesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId })
                });
                
                if (!response.ok) throw new Error('Delete failed');
                
                showToast('Çalma listesi başarıyla silindi', 'success');
                setTimeout(() => {
                    window.location.href = 'library.html';
                }, 1000);
                
            } catch (error) {
                console.error('Delete playlist error:', error);
                showToast('Silme işlemi başarısız oldu', 'error');
            }
        }
    );
}

// Get cover image
function getCoverImage(track) {
    if (track.CoverImageUrl && track.CoverImageUrl.trim() && !track.CoverImageUrl.includes('placeholder') && !track.CoverImageUrl.includes('default-cover')) {
        // Check if it's a relative path and prepend base URL
        if (track.CoverImageUrl.startsWith('/uploads')) {
            return track.CoverImageUrl;
        }
        return track.CoverImageUrl;
    }
    const seed = track.TrackID || Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}/200/200`;
}

// Format time
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Logout
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
