// =============================================
// Library Page JavaScript
// =============================================

const API_BASE_URL = 'http://localhost:3000/api';
let currentUserId = null;
let currentPlaylistId = null;
let currentPlayingTrack = null;
let isPlaying = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    loadLibraryData();
    setupPlayer();
    restorePlayerState();
    
    // Show player by default if no saved state
    const savedState = localStorage.getItem('playerState');
    if (!savedState) {
        const stickyPlayer = document.getElementById('stickyPlayer');
        if (stickyPlayer) {
            stickyPlayer.style.display = 'flex';
        }
    }
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
        const user = JSON.parse(userFromLocal);
        userId = user.UserID || user.userId;
    } else if (userFromSession) {
        const user = JSON.parse(userFromSession);
        userId = user.UserID || user.userId;
    }
    
    if (!userId) {
        console.log('No user ID found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    currentUserId = userId;
    loadUserAvatar();
}

// Load user avatar
async function loadUserAvatar() {
    const avatarImg = document.querySelector('#userAvatar img');
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    
    // Set username in dropdown
    if (username) {
        document.getElementById('userDisplayName').textContent = username;
    }
    
    const cachedAvatar = localStorage.getItem('avatarUrl');
    if (cachedAvatar && avatarImg) {
        avatarImg.src = cachedAvatar;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUserId}`);
        if (response.ok) {
            const data = await response.json();
            let avatarUrl = data.AvatarUrl;
            if (!avatarUrl || avatarUrl.startsWith('/avatars/')) {
                avatarUrl = `https://i.pravatar.cc/150?u=${data.Username}`;
            }
            if (avatarImg) {
                avatarImg.src = avatarUrl;
                localStorage.setItem('avatarUrl', avatarUrl);
                avatarImg.onerror = function() {
                    this.src = `https://i.pravatar.cc/150?u=${data.Username}`;
                };
            }
        }
    } catch (error) {
        console.error('Avatar load error:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.library-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Create playlist
    document.getElementById('createPlaylistBtn').addEventListener('click', openCreatePlaylistModal);
    document.getElementById('submitPlaylistBtn').addEventListener('click', createPlaylist);

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

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Liked tracks search
    const likedSearchInput = document.getElementById('likedTracksSearchInput');
    if (likedSearchInput) {
        let searchTimeout;
        likedSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchLikedTracks(e.target.value.trim());
            }, 300);
        });
    }

    // Modal close on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Switch tabs
function switchTab(tabName) {
    document.querySelectorAll('.library-tabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
}

// Load library data
async function loadLibraryData() {
    await loadPlaylists();
    await loadLikedTracks();
}

// Load playlists
async function loadPlaylists() {
    const container = document.getElementById('playlistsGrid');
    
    try {
        console.log('Loading playlists for user:', currentUserId);
        const response = await fetch(`${API_BASE_URL}/playlists?userId=${currentUserId}`);
        if (!response.ok) throw new Error('Failed to load playlists');
        
        const result = await response.json();
        const playlists = result.data || result;
        
        console.log('Playlists loaded:', playlists.length, 'playlists');
        
        if (playlists.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    <h3>Henüz çalma listeniz yok</h3>
                    <p>İlk çalma listesini oluşturmaya başlayın</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = playlists.map(playlist => `
            <div class="playlist-card" data-playlist-id="${playlist.PlaylistID}">
                <div class="playlist-cover">
                    ${playlist.CoverImageUrl ? 
                        `<img src="${playlist.CoverImageUrl}" alt="${playlist.Name}">` :
                        `<img src="https://picsum.photos/seed/playlist${playlist.PlaylistID}/300/300" alt="${playlist.Name}">`
                    }
                </div>
                <div class="playlist-info">
                    <h3 class="playlist-name">${playlist.Name}</h3>
                    <div class="playlist-meta">
                        <span class="playlist-track-count">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 18V5l12-2v13"></path>
                                <circle cx="6" cy="18" r="3"></circle>
                                <circle cx="18" cy="16" r="3"></circle>
                            </svg>
                            ${playlist.TrackCount} şarkı
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click event listeners to playlist cards
        document.querySelectorAll('.playlist-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const playlistId = card.getAttribute('data-playlist-id');
                console.log('Playlist clicked, ID:', playlistId);
                window.location.href = `playlist.html?id=${playlistId}`;
            });
        });
        
    } catch (error) {
        console.error('Playlists load error:', error);
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">Çalma listeleri yüklenirken hata oluştu</p>';
    }
}

// Load liked tracks
async function loadLikedTracks() {
    const container = document.getElementById('likedTracks');
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUserId}/likes`);
        if (!response.ok) throw new Error('Failed to load likes');
        
        const tracks = await response.json();
        
        // Store all liked tracks for search
        window.allLikedTracks = tracks;
        
        displayLikedTracks(tracks);
        
    } catch (error) {
        console.error('Liked tracks load error:', error);
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">Beğenilen şarkılar yüklenirken hata oluştu</p>';
    }
}

// Display liked tracks
function displayLikedTracks(tracks) {
    const container = document.getElementById('likedTracks');
    
    if (tracks.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <h3>Sonuç bulunamadı</h3>
                <p>Arama kriterlerine uygun şarkı bulunamadı</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tracks.map(track => `
        <div class="track-card">
            <div class="track-cover">
                <img src="${getCoverImage(track, 'small')}" alt="${track.Title}" onclick="goToTrackDetail(${track.TrackID})">
                <div class="track-play-overlay" onclick="event.stopPropagation(); playLikedTrack(${track.TrackID})">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </div>
            </div>
            <div class="track-info">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px;">
                    <div style="flex: 1; min-width: 0;" onclick="goToTrackDetail(${track.TrackID})">
                        <div class="track-title">${track.Title}</div>
                        <div class="track-artist">${track.ArtistName || 'Unknown'}</div>
                    </div>
                    <button class="track-add-btn" onclick="event.stopPropagation(); openAddToPlaylistModal(${track.TrackID})" title="Çalma listesine ekle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
                <div class="track-stats">
                    <div class="track-stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        ${formatNumber(track.PlayCount || 0)}
                    </div>
                    <div class="track-stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        ${formatNumber(track.LikeCount || 0)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Search liked tracks
async function searchLikedTracks(query) {
    const container = document.getElementById('likedTracks');
    
    if (!query) {
        // If empty, show all liked tracks
        if (window.allLikedTracks) {
            displayLikedTracks(window.allLikedTracks);
        }
        return;
    }
    
    container.innerHTML = `
        <div class="loading-state" style="grid-column: 1 / -1;">
            <div class="loading-spinner"></div>
            <p>Aranıyor...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUserId}/likes/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const tracks = await response.json();
        displayLikedTracks(tracks);
        
    } catch (error) {
        console.error('Liked tracks search error:', error);
        
        // Fallback to client-side search if server endpoint doesn't exist
        if (window.allLikedTracks) {
            const lowerQuery = query.toLowerCase();
            const filtered = window.allLikedTracks.filter(track => 
                track.Title.toLowerCase().includes(lowerQuery) ||
                (track.ArtistName && track.ArtistName.toLowerCase().includes(lowerQuery))
            );
            displayLikedTracks(filtered);
        } else {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">Arama yapılırken hata oluştu</p>';
        }
    }
}

// Open create playlist modal
function openCreatePlaylistModal() {
    document.getElementById('playlistName').value = '';
    document.getElementById('playlistDescription').value = '';
    document.getElementById('playlistPublic').checked = true;
    document.getElementById('createPlaylistModal').classList.add('active');
}

// Close create playlist modal
function closeCreatePlaylistModal() {
    document.getElementById('createPlaylistModal').classList.remove('active');
}

// Create playlist
async function createPlaylist() {
    const name = document.getElementById('playlistName').value.trim();
    const description = document.getElementById('playlistDescription').value.trim();
    const isPublic = document.getElementById('playlistPublic').checked;
    
    if (!name) {
        alert('Lütfen bir liste adı girin');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUserId,
                name,
                description: description || null,
                isPublic
            })
        });
        
        if (!response.ok) throw new Error('Failed to create playlist');
        
        closeCreatePlaylistModal();
        await loadPlaylists();
        
    } catch (error) {
        console.error('Create playlist error:', error);
        showToast('Çalma listesi oluşturulamıyor', 'error');
    }
}

// Open playlist detail
async function openPlaylistDetail(playlistId) {
    currentPlaylistId = playlistId;
    const modal = document.getElementById('playlistDetailModal');
    const tracksContainer = document.getElementById('playlistDetailTracks');
    
    modal.classList.add('active');
    
    try {
        // Load playlist tracks
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`);
        if (!response.ok) throw new Error('Failed to load tracks');
        
        const result = await response.json();
        const tracks = result.data || result;
        
        // Get playlist info from playlists grid
        const playlistCards = document.querySelectorAll('.playlist-card');
        let playlistName = 'Çalma Listesi';
        let playlistDescription = '';
        
        if (tracks.length === 0) {
            tracksContainer.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    <h3>Bu listede henüz şarkı yok</h3>
                    <p>Şarkı eklemek için ana sayfadan şarkılara tıklayın</p>
                </div>
            `;
        } else {
            tracksContainer.innerHTML = tracks.map(track => `
                <div class="playlist-track-item">
                    <div class="playlist-track-cover">
                        <img src="${getCoverImage(track, 'thumb')}" alt="${track.Title}">
                    </div>
                    <div class="playlist-track-details">
                        <div class="playlist-track-title">${track.Title}</div>
                        <div class="playlist-track-artist">${track.Username || 'Unknown'}</div>
                    </div>
                    <div class="playlist-track-actions">
                        <button class="track-action-btn" onclick="playTrackFromPlaylist(${track.TrackID})" title="Çal">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                        </button>
                        <button class="track-action-btn" onclick="removeFromPlaylist(${playlistId}, ${track.TrackID})" title="Listeden Çıkar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        document.getElementById('playlistDetailName').textContent = playlistName;
        document.getElementById('playlistDetailDescription').textContent = playlistDescription;
        
    } catch (error) {
        console.error('Playlist detail error:', error);
        tracksContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Şarkılar yüklenirken hata oluştu</p>';
    }
}

// Close playlist detail modal
function closePlaylistDetailModal() {
    document.getElementById('playlistDetailModal').classList.remove('active');
    currentPlaylistId = null;
}

// Remove from playlist
async function removeFromPlaylist(playlistId, trackId) {
    if (!confirm('Bu şarkıyı listeden çıkarmak istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks/${trackId}?userId=${currentUserId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to remove track');
        
        await openPlaylistDetail(playlistId);
        await loadPlaylists();
        
    } catch (error) {
        console.error('Remove from playlist error:', error);
        showToast('Şarkı çıkarılamadı', 'error');
    }
}

// Play track from playlist
function playTrackFromPlaylist(trackId) {
    window.location.href = `track-detail.html?id=${trackId}`;
}

// Go to track detail
function goToTrackDetail(trackId) {
    window.location.href = `track-detail.html?id=${trackId}`;
}

// Get cover image
function getCoverImage(track, size = 'small') {
    if (typeof track === 'number') {
        const dimensions = { thumb: 150, small: 200, large: 300 };
        const dim = dimensions[size] || 200;
        return `https://picsum.photos/seed/${track}/${dim}/${dim}`;
    }
    
    if (track.CoverImageUrl && track.CoverImageUrl.trim() && !track.CoverImageUrl.includes('placeholder')) {
        return track.CoverImageUrl;
    }
    
    const dimensions = { thumb: 150, small: 200, large: 300 };
    const dim = dimensions[size] || 200;
    const seed = track.TrackID || Math.floor(Math.random() * 1000);
    
    return `https://picsum.photos/seed/${seed}/${dim}/${dim}`;
}

// Format numbers
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Logout
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// =============================================
// Track Search and Selection
// =============================================

let selectedTracksForCreate = [];
let searchTimeout = null;

// Initialize search for create playlist modal
document.getElementById('createPlaylistSearchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        document.getElementById('createPlaylistSearchResults').classList.remove('active');
        return;
    }
    
    searchTimeout = setTimeout(() => searchTracks(query, 'create'), 300);
});

// Initialize search for playlist detail modal
document.getElementById('detailSearchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        document.getElementById('detailSearchResults').classList.remove('active');
        return;
    }
    
    searchTimeout = setTimeout(() => searchTracks(query, 'detail'), 300);
});

// Search tracks
async function searchTracks(query, context) {
    const resultsContainer = context === 'create' ? 
        document.getElementById('createPlaylistSearchResults') : 
        document.getElementById('detailSearchResults');
    
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
        
        resultsContainer.innerHTML = tracks.map(track => {
            const isSelected = context === 'create' && 
                selectedTracksForCreate.some(t => t.TrackID === track.TrackID);
            
            return `
                <div class="search-result-item ${isSelected ? 'selected' : ''}" data-track-id="${track.TrackID}">
                    <img src="${getCoverImage(track, 'thumb')}" alt="${track.Title}" class="search-result-cover">
                    <div class="search-result-info">
                        <div class="search-result-title">${track.Title}</div>
                        <div class="search-result-artist">${track.Username || 'Unknown Artist'}</div>
                    </div>
                    <button class="search-result-add ${isSelected ? 'added' : ''}" 
                            onclick="event.stopPropagation(); ${context === 'create' ? 
                                `toggleTrackSelection(${track.TrackID}, '${track.Title.replace(/'/g, "\\'")}', '${(track.Username || 'Unknown').replace(/'/g, "\\'")}', '${getCoverImage(track, 'thumb')}')` :
                                `addTrackToCurrentPlaylist(${track.TrackID})`
                            }">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${isSelected ? 
                                '<polyline points="20 6 9 17 4 12"></polyline>' :
                                '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'
                            }
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<div class="empty-state"><p>Arama hatası</p></div>';
    }
}

// Toggle track selection for create playlist
function toggleTrackSelection(trackId, title, artist, coverUrl) {
    const index = selectedTracksForCreate.findIndex(t => t.TrackID === trackId);
    
    if (index > -1) {
        selectedTracksForCreate.splice(index, 1);
    } else {
        selectedTracksForCreate.push({ TrackID: trackId, Title: title, Username: artist, CoverUrl: coverUrl });
    }
    
    updateSelectedTracksDisplay();
    updateSearchResultButton(trackId);
}

// Update selected tracks display
function updateSelectedTracksDisplay() {
    const container = document.getElementById('createPlaylistSelectedTracks');
    
    if (selectedTracksForCreate.length === 0) {
        container.classList.remove('has-tracks');
        container.innerHTML = '';
        return;
    }
    
    container.classList.add('has-tracks');
    container.innerHTML = `
        <div class="selected-tracks-header">${selectedTracksForCreate.length} şarkı seçildi</div>
        ${selectedTracksForCreate.map(track => `
            <div class="selected-track-item">
                <img src="${track.CoverUrl}" alt="${track.Title}" class="selected-track-cover">
                <div class="selected-track-info">
                    <div class="selected-track-title">${track.Title}</div>
                    <div class="selected-track-artist">${track.Username}</div>
                </div>
                <button class="selected-track-remove" onclick="toggleTrackSelection(${track.TrackID}, '${track.Title.replace(/'/g, "\\'")}', '${track.Username.replace(/'/g, "\\'")}', '${track.CoverUrl}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `).join('')}
    `;
}

// Update search result button state
function updateSearchResultButton(trackId) {
    const searchResults = document.getElementById('createPlaylistSearchResults');
    const item = searchResults.querySelector(`[data-track-id="${trackId}"]`);
    
    if (!item) return;
    
    const isSelected = selectedTracksForCreate.some(t => t.TrackID === trackId);
    const button = item.querySelector('.search-result-add');
    
    item.classList.toggle('selected', isSelected);
    button.classList.toggle('added', isSelected);
    
    button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${isSelected ? 
                '<polyline points="20 6 9 17 4 12"></polyline>' :
                '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'
            }
        </svg>
    `;
}

// Add track to current playlist (from detail modal)
async function addTrackToCurrentPlaylist(trackId) {
    if (!currentPlaylistId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${currentPlaylistId}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trackId: trackId,
                userId: currentUserId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            showToast(error.message || 'Şarkı eklenemedi', 'error');
            return;
        }
        
        showToast('Şarkı başarıyla eklendi', 'success');
        document.getElementById('detailSearchInput').value = '';
        document.getElementById('detailSearchResults').classList.remove('active');
        
        // Reload playlist tracks
        await openPlaylistDetail(currentPlaylistId);
        
    } catch (error) {
        console.error('Add track error:', error);
        showToast('Bir hata oluştu', 'error');
    }
}

// Override createPlaylist function to include selected tracks
const originalCreatePlaylist = createPlaylist;
createPlaylist = async function() {
    const name = document.getElementById('playlistName').value.trim();
    const description = document.getElementById('playlistDescription').value.trim();
    const isPublic = document.getElementById('playlistPublic').checked;
    
    if (!name) {
        alert('Lütfen bir liste adı girin');
        return;
    }
    
    try {
        // Create playlist
        const response = await fetch(`${API_BASE_URL}/playlists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUserId,
                name,
                description: description || null,
                isPublic
            })
        });
        
        if (!response.ok) throw new Error('Failed to create playlist');
        
        const result = await response.json();
        const playlistData = result.data || result;
        const newPlaylistId = playlistData.PlaylistID || playlistData.playlistId;
        
        // Add selected tracks to playlist
        if (selectedTracksForCreate.length > 0) {
            for (const track of selectedTracksForCreate) {
                await fetch(`${API_BASE_URL}/playlists/${newPlaylistId}/tracks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trackId: track.TrackID,
                        userId: currentUserId
                    })
                });
            }
        }
        
        // Reset and close
        selectedTracksForCreate = [];
        document.getElementById('createPlaylistSearchInput').value = '';
        document.getElementById('createPlaylistSearchResults').classList.remove('active');
        updateSelectedTracksDisplay();
        
        closeCreatePlaylistModal();
        await loadPlaylists();
        
    } catch (error) {
        console.error('Create playlist error:', error);
        showToast('Çalma listesi oluşturulamıyor', 'error');
    }
};

// Override closeCreatePlaylistModal to reset selections
const originalCloseCreateModal = closeCreatePlaylistModal;
closeCreatePlaylistModal = function() {
    selectedTracksForCreate = [];
    document.getElementById('createPlaylistSearchInput').value = '';
    document.getElementById('createPlaylistSearchResults').classList.remove('active');
    updateSelectedTracksDisplay();
    originalCloseCreateModal();
};

// Add edit playlist functionality
document.getElementById('editPlaylistBtn').addEventListener('click', () => {
    const addTrackSection = document.getElementById('addTrackSection');
    if (addTrackSection.style.display === 'none') {
        addTrackSection.style.display = 'block';
    } else {
        addTrackSection.style.display = 'none';
        document.getElementById('detailSearchInput').value = '';
        document.getElementById('detailSearchResults').classList.remove('active');
    }
});

// ========== ADD TO PLAYLIST FUNCTIONALITY ==========

let currentTrackToAdd = null;

// Open add to playlist modal
async function openAddToPlaylistModal(trackId) {
    console.log('🎵 Opening modal for track:', trackId);
    currentTrackToAdd = trackId;
    document.getElementById('addToPlaylistModal').classList.add('active');
    await loadPlaylistsForSelection();
}

// Close add to playlist modal
function closeAddToPlaylistModal() {
    document.getElementById('addToPlaylistModal').classList.remove('active');
    currentTrackToAdd = null;
}

// Load playlists for selection
async function loadPlaylistsForSelection() {
    const container = document.getElementById('playlistSelectionList');
    const userId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    
    console.log('📋 Loading playlists for user:', userId);
    console.log('🔗 API URL:', `${API_BASE_URL}/users/${userId}/playlists`);
    
    try {
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Çalma listeleri yükleniyor...</p></div>';
        
        const response = await fetch(`${API_BASE_URL}/users/${userId}/playlists`);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error('Failed to load playlists');
        }
        
        const playlists = await response.json();
        console.log('✅ Playlists loaded:', playlists);
        
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
        console.error('❌ Error loading playlists:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Çalma listeleri yüklenirken hata oluştu</p>';
    }
}

// Add track to selected playlist
async function addTrackToSelectedPlaylist(playlistId) {
    if (!currentTrackToAdd) return;
    
    console.log('➕ Adding track:', currentTrackToAdd, 'to playlist:', playlistId);
    console.log('👤 User ID:', currentUserId);
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                trackId: currentTrackToAdd,
                userId: currentUserId
            })
        });
        
        console.log('📡 Add track response status:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Server error:', error);
            throw new Error(error.message || 'Şarkı eklenemedi');
        }
        
        const result = await response.json();
        console.log('✅ Success:', result);
        
        showToast('Şarkı çalma listesine eklendi', 'success');
        closeAddToPlaylistModal();
        
    } catch (error) {
        console.error('❌ Error adding track to playlist:', error);
        if (error.message.includes('already exists') || error.message.includes('zaten')) {
            showToast('Bu şarkı zaten çalma listesinde', 'warning');
        } else {
            showToast('Şarkı eklenirken hata oluştu', 'error');
        }
    }
}

// ========== PLAYER FUNCTIONALITY ==========

// Setup player
function setupPlayer() {
    console.log('🎵 setupPlayer called');
    const audioPlayer = document.getElementById('audioPlayer');
    const stickyPlayer = document.getElementById('stickyPlayer');
    
    console.log('Audio element:', audioPlayer);
    if (!audioPlayer) {
        console.log('❌ Audio player not found!');
        return;
    }
    
    // Audio event listeners
    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayButtonUI(false);
        savePlayerState();
    });
    
    audioPlayer.addEventListener('timeupdate', () => {
        if (audioPlayer.duration) {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            const progressFill = document.getElementById('progressFill');
            const progressSlider = document.getElementById('progressSlider');
            const currentTime = document.getElementById('currentTime');
            const totalTime = document.getElementById('totalTime');
            
            if (progressFill) progressFill.style.width = progress + '%';
            if (progressSlider) progressSlider.value = progress;
            if (currentTime) currentTime.textContent = formatTime(audioPlayer.currentTime);
            if (totalTime) totalTime.textContent = formatTime(audioPlayer.duration);
            
            savePlayerState();
        }
    });
    
    // Play button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', togglePlay);
    }
    
    // Progress slider
    const progressSlider = document.getElementById('progressSlider');
    if (progressSlider) {
        progressSlider.addEventListener('input', (e) => {
            if (audioPlayer.duration) {
                const time = (e.target.value / 100) * audioPlayer.duration;
                audioPlayer.currentTime = time;
            }
        });
    }
    
    // Volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    console.log('Volume slider element:', volumeSlider);
    if (volumeSlider) {
        const savedVolume = localStorage.getItem('playerVolume') || 70;
        volumeSlider.value = savedVolume;
        audioPlayer.volume = savedVolume / 100;
        
        // Update volume gradient
        const updateVolumeGradient = (value) => {
            const percentage = value;
            volumeSlider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${percentage}%, var(--border-color) ${percentage}%, var(--border-color) 100%)`;
        };
        
        updateVolumeGradient(savedVolume);
        console.log('✅ Volume slider initialized:', savedVolume);
        
        volumeSlider.addEventListener('input', (e) => {
            console.log('🔊 Volume changed:', e.target.value);
            audioPlayer.volume = e.target.value / 100;
            localStorage.setItem('playerVolume', e.target.value);
            updateVolumeGradient(e.target.value);
        });
    } else {
        console.log('❌ Volume slider not found!');
    }
}

// Restore player state from localStorage
function restorePlayerState() {
    const savedState = localStorage.getItem('playerState');
    console.log('🔍 Checking playerState:', savedState ? 'Found' : 'Not found');
    
    if (!savedState) return;
    
    try {
        const state = JSON.parse(savedState);
        console.log('📦 Parsed state:', state);
        
        if (!state.track) {
            console.log('❌ No track in state');
            return;
        }
        
        currentPlayingTrack = state.track;
        const audioPlayer = document.getElementById('audioPlayer');
        const stickyPlayer = document.getElementById('stickyPlayer');
        
        console.log('🎵 Restoring track:', state.track.Title);
        
        // Update UI
        updatePlayerUI(state.track);
        
        // Set audio source and time
        if (audioPlayer) {
            audioPlayer.src = state.track.AudioUrl;
            audioPlayer.currentTime = state.currentTime || state.progress || 0;
            
            if (state.isPlaying) {
                audioPlayer.play().catch(e => console.log('⚠️ Auto-play prevented:', e));
                isPlaying = true;
            }
        }
        
        // Show player
        if (stickyPlayer) {
            stickyPlayer.style.display = 'flex';
            console.log('✅ Player shown');
        }
        
        updatePlayButtonUI(state.isPlaying);
        
    } catch (error) {
        console.error('❌ Error restoring player state:', error);
    }
}

// Save player state to localStorage
function savePlayerState() {
    if (!currentPlayingTrack) return;
    
    const audioPlayer = document.getElementById('audioPlayer');
    const state = {
        track: currentPlayingTrack,
        isPlaying: isPlaying,
        currentTime: audioPlayer ? audioPlayer.currentTime : 0
    };
    
    localStorage.setItem('playerState', JSON.stringify(state));
}

// Update player UI
function updatePlayerUI(track) {
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const playerCover = document.getElementById('playerCover');
    
    if (playerTitle) playerTitle.textContent = track.Title;
    if (playerArtist) playerArtist.textContent = track.ArtistName || track.Username || 'Unknown';
    if (playerCover) playerCover.src = getCoverImage(track, 'small');
    
    // Add click handlers for navigation
    const playerCoverWrapper = document.getElementById('playerCoverWrapper');
    const artistId = track.ArtistID || track.UserID;
    
    console.log('🎵 Library - Setting up player clicks:', { TrackID: track.TrackID, ArtistID: track.ArtistID, UserID: track.UserID, artistId });
    
    if (playerCoverWrapper && track.TrackID) {
        playerCoverWrapper.onclick = () => {
            console.log('🖼️ Cover clicked');
            window.location.href = `track-detail.html?id=${track.TrackID}`;
        };
    }
    if (playerTitle && track.TrackID) {
        playerTitle.onclick = () => {
            console.log('🎵 Title clicked');
            window.location.href = `track-detail.html?id=${track.TrackID}`;
        };
    }
    if (playerArtist && artistId) {
        playerArtist.onclick = () => {
            console.log('👤 Artist clicked, going to:', `profile.html?id=${artistId}`);
            window.location.href = `profile.html?id=${artistId}`;
        };
    } else {
        console.log('❌ Artist click NOT set:', { playerArtist: !!playerArtist, artistId });
    }
}

// Update play button UI
function updatePlayButtonUI(playing) {
    const playBtn = document.getElementById('playBtn');
    if (!playBtn) return;
    
    if (playing) {
        playBtn.classList.add('playing');
    } else {
        playBtn.classList.remove('playing');
    }
}

// Play track directly in library
async function playLikedTrack(trackId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tracks/${trackId}`);
        if (!response.ok) throw new Error('Track not found');
        
        const track = await response.json();
        currentPlayingTrack = track;
        
        // Update player UI
        updatePlayerUI(track);
        
        // Set audio source and play
        const audioPlayer = document.getElementById('audioPlayer');
        const stickyPlayer = document.getElementById('stickyPlayer');
        
        audioPlayer.src = track.AudioUrl;
        audioPlayer.play();
        isPlaying = true;
        
        // Show player
        if (stickyPlayer) stickyPlayer.style.display = 'flex';
        
        // Update play button
        updatePlayButtonUI(true);
        
        // Save state
        savePlayerState();
        
    } catch (error) {
        console.error('Error playing track:', error);
        showToast('Şarkı çalınamadı', 'error');
    }
}

// Toggle play/pause
function togglePlay() {
    const audioPlayer = document.getElementById('audioPlayer');
    if (!audioPlayer || !audioPlayer.src) return;
    
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
    } else {
        audioPlayer.play();
        isPlaying = true;
    }
    
    updatePlayButtonUI(isPlaying);
    savePlayerState();
}

// Format time helper
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get cover image helper
function getCoverImage(track, size = 'medium') {
    if (track.CoverUrl) {
        return track.CoverUrl;
    }
    const randomNum = track.TrackID || Math.floor(Math.random() * 1000);
    const dimensions = size === 'small' ? '60/60' : size === 'large' ? '300/300' : '150/150';
    return `https://picsum.photos/${dimensions}?random=${randomNum}`;
}

// Save player state before page unload
window.addEventListener('beforeunload', () => {
    savePlayerState();
});
