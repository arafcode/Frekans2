// =============================================
// SoundCloud Clone - Frontend JavaScript
// =============================================
// API Integration, Waveform Visualization, Player
// =============================================

const API_BASE_URL = '/api';

let currentPage = 1;
let currentGenre = 'all';
let currentTrack = null;
let currentTrackIndex = -1;
let trackQueue = [];
let isPlaying = false;
let currentProgress = 0;
let progressInterval = null;
let searchDropdownVisible = false;
let audioPlayer = null;

// =============================================
// Sayfa Yüklendiğinde Çalışacak
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize audio player
    audioPlayer = document.getElementById('audioPlayer');
    setupAudioPlayer();
    
    // Check authentication
    checkAuthAndLoadUser();
    
    // İlk verileri yükle
    loadTrendingTracks();
    loadTracks(currentPage, currentGenre);
    
    // Event listener'ları ayarla
    setupEventListeners();
    
    // Restore player state (must be before checkAutoPlay)
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
    
    // Check URL for play parameter (from track detail page)
    checkAutoPlay();
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
        playNextTrack();
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
// Event Listeners
// =============================================
function setupEventListeners() {
    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTracks(currentPage, currentGenre);
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        loadTracks(currentPage, currentGenre);
    });

    // Genre filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentGenre = e.target.dataset.genre;
            currentPage = 1;
            loadTracks(currentPage, currentGenre);
        });
    });

    // Live Search with Dropdown
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                liveSearch(query);
            }, 300);
        } else {
            searchDropdown.style.display = 'none';
            searchDropdownVisible = false;
        }
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            searchDropdown.style.display = 'block';
            searchDropdownVisible = true;
        }
    });

    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            searchDropdown.style.display = 'none';
            searchDropdownVisible = false;
        }
    });

    // Player controls
    document.getElementById('playBtn').addEventListener('click', togglePlay);
    document.getElementById('prevBtn').addEventListener('click', playPreviousTrack);
    document.getElementById('nextBtn').addEventListener('click', playNextTrack);
    
    document.getElementById('playerLikeBtn').addEventListener('click', () => {
        if (currentTrack) {
            toggleLike(currentTrack.TrackID, document.getElementById('playerLikeBtn'));
        }
    });

    // Progress slider - Preview while dragging
    const progressSlider = document.getElementById('progressSlider');
    progressSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('progressFill').style.width = `${value}%`;
        
        if (currentTrack && audioPlayer.duration) {
            const currentSeconds = Math.floor((value / 100) * audioPlayer.duration);
            document.getElementById('currentTime').textContent = formatTime(currentSeconds);
        }
    });
    
    // Progress slider - Seek when released
    progressSlider.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        
        if (audioPlayer.duration) {
            const seekTime = (value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = seekTime;
        }
    });

    // Volume slider
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
        console.log('🔊 Volume:', e.target.value);
    });
}

// =============================================
// API: Trending Tracks Yükle (Top 5)
// =============================================
async function loadTrendingTracks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tracks?page=1&limit=5`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            renderTrendingCards(data.data);
        }
    } catch (error) {
        console.error('❌ Trending tracks yüklenemedi:', error);
        document.getElementById('trendingCarousel').innerHTML =
            '<div class="loading">Popüler şarkılar yüklenemedi</div>';
    }
}

// =============================================
// API: Track Listesi Yükle (Pagination)
// =============================================
async function loadTracks(page = 1, genre = 'all') {
    try {
        const genreParam = genre !== 'all' ? `&genre=${genre}` : '';
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        const userIdParam = userId ? `&userId=${userId}` : '';
        const response = await fetch(`${API_BASE_URL}/tracks?page=${page}&limit=20${genreParam}${userIdParam}`);
        const data = await response.json();

        if (data.success) {
            renderTrackList(data.data);
            updatePagination(data.pagination);
        }
    } catch (error) {
        console.error('❌ Tracks yüklenemedi:', error);
        document.getElementById('trackList').innerHTML =
            '<div class="loading">Şarkılar yüklenemedi</div>';
    }
}

// =============================================
// API: Live Search (Dropdown)
// =============================================
async function liveSearch(query) {
    const searchDropdown = document.getElementById('searchDropdown');
    
    try {
        searchDropdown.innerHTML = '<div class="search-loading">Aranıyor...</div>';
        searchDropdown.style.display = 'block';
        searchDropdownVisible = true;

        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=8`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            renderSearchDropdown(data.data, query);
        } else {
            searchDropdown.innerHTML = '<div class="search-no-results">No results found for "' + query + '"</div>';
        }
    } catch (error) {
        console.error('❌ Search failed:', error);
        searchDropdown.innerHTML = '<div class="search-error">Search error. Try again.</div>';
    }
}

// =============================================
// Render: Search Dropdown Results
// =============================================
function renderSearchDropdown(tracks, query) {
    const searchDropdown = document.getElementById('searchDropdown');
    
    const html = `
        <div class="search-results-header">
            <span>Results for "${query}"</span>
            <button class="view-all-btn" onclick="viewAllSearchResults('${query}')">Tümünü Gör</button>
        </div>
        <div class="search-results-list">
            ${tracks.map(track => `
                <div class="search-result-item" onclick="playTrackFromSearch(${JSON.stringify(track).replace(/"/g, '&quot;')})">
                    <img src="${getCoverImage(track, 'thumb')}" 
                         alt="${track.Title}"
                         onerror="this.onerror=null; this.src='https://picsum.photos/40/40?random=${track.TrackID}'">
                    <div class="search-result-info">
                        <div class="search-result-title">${track.Title}</div>
                        <div class="search-result-artist">${track.ArtistName}</div>
                    </div>
                    <div class="search-result-stats">
                        <span>▶️ ${formatNumber(track.TotalPlays)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    searchDropdown.innerHTML = html;
}

// =============================================
// Play Track from Search
// =============================================
function playTrackFromSearch(track) {
    playTrack(track);
    document.getElementById('searchDropdown').style.display = 'none';
    searchDropdownVisible = false;
}

// =============================================
// View All Search Results
// =============================================
async function viewAllSearchResults(query) {
    try {
        document.getElementById('searchDropdown').style.display = 'none';
        searchDropdownVisible = false;
        
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=50`);
        const data = await response.json();

        if (data.success) {
            renderTrackList(data.data);
            document.getElementById('pagination').style.display = 'none';
            
            // Scroll to results
            document.querySelector('.track-list-section').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('❌ View all search failed:', error);
    }
}

// =============================================
// API: Like Toggle
// =============================================
async function toggleLike(trackId, buttonElement) {
    try {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        const response = await fetch(`${API_BASE_URL}/like`, {
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
            buttonElement.classList.toggle('liked', data.data.isLiked);
            
            // Update currentTrack if it's the same track
            if (currentTrack && currentTrack.TrackID === trackId) {
                currentTrack.IsLiked = data.data.isLiked;
                currentTrack.LikeCount = data.data.totalLikes;
                savePlayerState();
            }
            


            console.log('❤️', data.data.action, '- Total likes:', data.data.totalLikes);
        }
    } catch (error) {
        console.error('❌ Like işlemi başarısız:', error);
    }
}

// =============================================
// API: Record Play
// =============================================
async function recordPlay(trackId) {
    try {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        
        if (!userId) {
            console.log('⚠️ User not logged in, play not recorded');
            return;
        }
        
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
            console.log('▶️ Play recorded - Total plays:', data.data.playCount);
        }
    } catch (error) {
        console.error('❌ Play kaydı başarısız:', error);
    }
}

// =============================================
// Render: Trending Cards
// =============================================
function renderTrendingCards(tracks) {
    const container = document.getElementById('trendingCarousel');
    
    container.innerHTML = tracks.map((track, index) => `
        <div class="trending-card" onclick="playTrack(${JSON.stringify(track).replace(/"/g, '&quot;')})">
            <div class="trending-card-cover">
                <img src="${getCoverImage(track, 'large')}" 
                     alt="${track.Title}"
                     onerror="this.onerror=null; this.src='https://picsum.photos/300/300?random=${track.TrackID || index}'">
                <span class="trending-badge">#${index + 1}</span>
            </div>
            <div class="trending-card-title">${track.Title}</div>
            <div class="trending-card-artist">${track.ArtistName}</div>
            <div class="trending-card-stats">
                <span class="stat-item">▶️ ${formatNumber(track.TotalPlays)}</span>
                <span class="stat-item">❤️ ${formatNumber(track.TotalLikes)}</span>
            </div>
        </div>
    `).join('');
}

// =============================================
// Render: Track List
// =============================================
function renderTrackList(tracks) {
    const container = document.getElementById('trackList');
    
    if (tracks.length === 0) {
        container.innerHTML = '<div class="loading">Şarkı bulunamadı</div>';
        return;
    }

    // Track queue'yu güncelle (next/prev için)
    trackQueue = tracks;

    container.innerHTML = tracks.map((track, index) => {
        // Waveform data oluştur (eğer yoksa fake data)
        const waveformData = generateWaveformData(track);
        
        return `
            <div class="track-card" data-track-id="${track.TrackID}" data-track-index="${index}">
                <div class="track-cover" onclick="playTrackByIndex(${index})">
                    <img src="${getCoverImage(track, 'small')}" 
                         alt="${track.Title}"
                         onerror="this.onerror=null; this.src='https://picsum.photos/80/80?random=${track.TrackID}'">
                    <div class="track-play-overlay">
                        <svg viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
                
                <div class="track-info" onclick="goToTrackDetail(${track.TrackID})">
                    <div class="track-header">
                        <div class="track-title">${track.Title}</div>
                        ${track.ArtistIsVerified ? '<svg class="verified-badge" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/></svg>' : ''}
                    </div>
                    <div class="track-artist">${track.ArtistName}</div>
                    <div class="track-waveform" data-track-id="${track.TrackID}">
                        ${waveformData.map((height, i) => `
                            <div class="waveform-bar" 
                                 style="height: ${height}%" 
                                 data-index="${i}">
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="track-meta">
                    <div class="track-duration">${formatTime(track.Duration)}</div>
                    <div class="track-stats">
                        <span title="${formatNumber(track.TotalPlays)} plays">▶️ ${formatNumber(track.TotalPlays)}</span>
                        <button class="like-btn" onclick="event.stopPropagation(); toggleLike(${track.TrackID}, this)">
                            <svg viewBox="0 0 24 24">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span class="like-count">${formatNumber(track.TotalLikes)}</span>
                        </button>
                        <button class="add-to-playlist-btn" onclick="event.stopPropagation(); openAddToPlaylistModal(${track.TrackID})" title="Çalma listesine ekle">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <span title="${formatNumber(track.TotalComments || 0)} comments">💬 ${formatNumber(track.TotalComments || 0)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Waveform hover effect ekle
    addWaveformInteractions();
}

// =============================================
// Waveform Data Oluştur (Fake veya Real)
// =============================================
function generateWaveformData(track) {
    // Eğer track'te WaveformData varsa parse et, yoksa fake data üret
    if (track.WaveformData) {
        try {
            return JSON.parse(track.WaveformData);
        } catch (e) {
            console.warn('Invalid waveform data, generating fake');
        }
    }
    
    // Fake waveform data (60 bar, %20 ile %100 arası rastgele yükseklik)
    const barCount = 60;
    return Array.from({ length: barCount }, () => {
        return Math.floor(Math.random() * 80) + 20; // 20-100 arası
    });
}

// =============================================
// Waveform Hover Interactions
// =============================================
function addWaveformInteractions() {
    document.querySelectorAll('.track-waveform').forEach(waveform => {
        const bars = waveform.querySelectorAll('.waveform-bar');
        
        bars.forEach((bar, index) => {
            bar.addEventListener('mouseenter', () => {
                // Mouse üzerindeki bar'a kadar olan barları highlight et
                bars.forEach((b, i) => {
                    if (i <= index) {
                        b.classList.add('played');
                    } else {
                        b.classList.remove('played');
                    }
                });
            });
        });

        waveform.addEventListener('mouseleave', () => {
            bars.forEach(b => b.classList.remove('played'));
        });

        // Waveform'a tıklayınca o noktadan çalmaya başla
        waveform.addEventListener('click', (e) => {
            const clickedBar = e.target.closest('.waveform-bar');
            if (clickedBar) {
                const index = parseInt(clickedBar.dataset.index);
                const percentage = (index / bars.length) * 100;
                
                document.getElementById('progressSlider').value = percentage;
                document.getElementById('progressFill').style.width = `${percentage}%`;
                
                console.log(`🎵 Waveform tıklandı: ${percentage.toFixed(0)}%`);
            }
        });
    });
}

// =============================================
// Pagination Güncelle
// =============================================
function updatePagination(pagination) {
    document.getElementById('pageInfo').textContent = 
        `Page ${pagination.currentPage} of ${pagination.totalPages}`;
    
    document.getElementById('prevPage').disabled = !pagination.hasPrevPage;
    document.getElementById('nextPage').disabled = !pagination.hasNextPage;
    document.getElementById('pagination').style.display = 'flex';
}

// =============================================
// Player: Şarkı Çal
// =============================================
function playTrack(track, trackIndex = -1) {
    currentTrack = track;
    currentTrackIndex = trackIndex;
    
    // Player UI'ı güncelle
    const coverImg = document.getElementById('playerCover');
    coverImg.src = getCoverImage(track, 'small');
    coverImg.onerror = function() {
        this.onerror = null;
        this.src = 'https://picsum.photos/60/60?random=' + track.TrackID;
    };
    
    document.getElementById('playerTitle').textContent = track.Title;
    document.getElementById('playerArtist').textContent = track.ArtistName;
    document.getElementById('totalTime').textContent = formatTime(track.Duration || 0);
    document.getElementById('currentTime').textContent = '0:00';
    
    // Add click handlers for navigation
    const playerCoverWrapper = document.getElementById('playerCoverWrapper');
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const artistId = track.UserID; // Her zaman UserID kullan
    
    if (playerCoverWrapper) {
        playerCoverWrapper.onclick = () => {
            window.location.href = `track-detail.html?id=${track.TrackID}`;
        };
    }
    if (playerTitle) {
        playerTitle.onclick = () => {
            window.location.href = `track-detail.html?id=${track.TrackID}`;
        };
    }
    if (playerArtist && artistId) {
        playerArtist.onclick = () => {
            window.location.href = `profile.html?id=${artistId}`;
        };
    }
    
    // Update player like button state
    const playerLikeBtn = document.getElementById('playerLikeBtn');
    if (playerLikeBtn && track.IsLiked !== undefined) {
        playerLikeBtn.classList.toggle('liked', track.IsLiked);
    }
    
    // Progress sıfırla
    currentProgressValue = 0;
    document.getElementById('progressSlider').value = 0;
    document.getElementById('progressFill').style.width = '0%';
    
    // Load and play audio
    if (track.AudioUrl) {
        audioPlayer.src = track.AudioUrl;
        audioPlayer.load();
        audioPlayer.play().catch(err => {
            console.error('Play error:', err);
            isPlaying = false;
            document.getElementById('playBtn').classList.remove('playing');
        });
    }
    
    // Active track'i highlight et
    highlightActiveTrack(track.TrackID);
    
    // Media Session güncelle (multimedya tuşları için)
    updateMediaSession(track);
    
    // Play count artır (API'ye kaydet)
    recordPlay(track.TrackID);
    
    // Save player state
    savePlayerState();
}

// =============================================
// Play Track by Index (from queue)
// =============================================
function playTrackByIndex(index) {
    if (trackQueue[index]) {
        playTrack(trackQueue[index], index);
    }
}

// =============================================
// Play Next Track
// =============================================
function playNextTrack() {
    if (trackQueue.length === 0) {
        console.log('⚠️ No tracks in queue');
        return;
    }
    
    const nextIndex = currentTrackIndex + 1;
    
    if (nextIndex < trackQueue.length) {
        playTrack(trackQueue[nextIndex], nextIndex);
    } else {
        // Loop to first track
        playTrack(trackQueue[0], 0);
    }
}

// =============================================
// Play Previous Track
// =============================================
function playPreviousTrack() {
    if (trackQueue.length === 0) {
        console.log('⚠️ No tracks in queue');
        return;
    }
    
    // Eğer şarkı 5 saniyeden fazla çalmışsa, başa sar
    if (audioPlayer.currentTime > 5) {
        audioPlayer.currentTime = 0;
        return;
    }
    
    // 5 saniyeden az ise önceki şarkıya geç
    const prevIndex = currentTrackIndex - 1;
    
    if (prevIndex >= 0) {
        playTrack(trackQueue[prevIndex], prevIndex);
    } else {
        // Loop to last track
        const lastIndex = trackQueue.length - 1;
        playTrack(trackQueue[lastIndex], lastIndex);
    }
}

// =============================================
// Highlight Active Track
// =============================================
function highlightActiveTrack(trackId) {
    // Remove previous highlights
    document.querySelectorAll('.track-card').forEach(card => {
        card.classList.remove('playing');
    });
    
    // Add highlight to current track
    const currentCard = document.querySelector(`.track-card[data-track-id="${trackId}"]`);
    if (currentCard) {
        currentCard.classList.add('playing');
    }
}

// =============================================
// Player: Play/Pause Toggle
// =============================================
function togglePlay() {
    const playBtn = document.getElementById('playBtn');
    
    if (!currentTrack) return;
    
    if (isPlaying) {
        audioPlayer.pause();
        savePlayerState();
        
        // Media Session state güncelle
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
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
        
        // Media Session state güncelle
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
    }
}

// =============================================
// Progress Simulation (Demo amaçlı - gerçek zamanlı)
// =============================================
let currentProgressValue = 0; // Track progress globally

// Save player state to localStorage
function savePlayerState() {
    if (currentTrack) {
        const state = {
            track: currentTrack,
            trackIndex: currentTrackIndex,
            progress: currentProgressValue,
            isPlaying: isPlaying,
            currentTime: audioPlayer ? audioPlayer.currentTime : 0,
            timestamp: Date.now()
        };
        localStorage.setItem('playerState', JSON.stringify(state));
        console.log('💾 Player state saved:', state.track.Title);
    }
}

// Restore player state from localStorage
function restorePlayerState() {
    const savedState = localStorage.getItem('playerState');
    if (!savedState) return;
    
    try {
        const state = JSON.parse(savedState);
        const timeDiff = (Date.now() - state.timestamp) / 1000; // seconds
        
        // If saved less than 1 hour ago, restore
        if (timeDiff < 3600) {
            currentTrack = state.track;
            currentTrackIndex = state.trackIndex;
            currentProgressValue = state.progress;
            
            console.log('🔄 Restoring track (app.js):', {
                TrackID: state.track.TrackID,
                Title: state.track.Title,
                Artist: state.track.ArtistName
            });
            
            // Update UI
            const coverImg = document.getElementById('playerCover');
            coverImg.src = getCoverImage(state.track, 'small');
            coverImg.onerror = function() {
                this.onerror = null;
                this.src = 'https://picsum.photos/80/80?random=' + state.track.TrackID;
            };
            
            document.getElementById('playerTitle').textContent = state.track.Title;
            document.getElementById('playerArtist').textContent = state.track.ArtistName || state.track.Username;
            document.getElementById('totalTime').textContent = formatTime(state.track.Duration);
            document.getElementById('progressSlider').value = currentProgressValue;
            document.getElementById('progressFill').style.width = `${currentProgressValue}%`;
            
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
            
            const currentSeconds = Math.floor((currentProgressValue / 100) * state.track.Duration);
            document.getElementById('currentTime').textContent = formatTime(currentSeconds);
            
            document.getElementById('stickyPlayer').style.display = 'flex';
            
            // Update play button state and load audio
            const playBtn = document.getElementById('playBtn');
            if (state.track.AudioUrl) {
                // Only load if it's a different track
                const needsLoad = !audioPlayer.src || !audioPlayer.src.includes(state.track.AudioUrl);
                
                if (needsLoad) {
                    audioPlayer.src = state.track.AudioUrl;
                    
                    // Set up seek position before loading
                    if (state.progress > 0 && state.track.Duration) {
                        const restoreSeekTime = (state.progress / 100) * state.track.Duration;
                        
                        audioPlayer.addEventListener('loadedmetadata', () => {
                            audioPlayer.currentTime = restoreSeekTime;
                            console.log('🔄 Seek to:', restoreSeekTime, 'seconds');
                        }, { once: true });
                    }
                    
                    // Load audio after setting up the event listener
                    audioPlayer.load();
                    
                    // If was playing, auto-play after load
                    if (state.isPlaying) {
                        audioPlayer.addEventListener('canplay', () => {
                            audioPlayer.play().catch(err => console.error('Auto-play error:', err));
                        }, { once: true });
                    }
                } else if (state.progress > 0 && state.track.Duration && audioPlayer.duration) {
                    // Same track, just seek if needed
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
                playBtn.classList.add('playing');
            } else {
                isPlaying = false;
                playBtn.classList.remove('playing');
            }
            
            // Update like button state
            const playerLikeBtn = document.getElementById('playerLikeBtn');
            if (playerLikeBtn && state.track.IsLiked !== undefined) {
                playerLikeBtn.classList.toggle('liked', state.track.IsLiked);
            }
            
            // Highlight the restored track if it's in the current list
            highlightActiveTrack(state.track.TrackID);
            
            console.log('✅ Player state restored (app.js)');
        }
    } catch (error) {
        console.error('Failed to restore player state:', error);
    }
}

function startProgressSimulation() {
    // No longer needed - audio player handles progress
}

function stopProgressSimulation() {
    // No longer needed - audio player handles progress
}

// =============================================
// Utility: Zaman Formatlama
// =============================================
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =============================================
// Utility: Sayı Formatlama
// =============================================
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// =============================================
// Utility: Cover Image Helper
// =============================================
function getCoverImage(track, size = 'small') {
    // Eğer track'te CoverImageUrl varsa ve boş değilse
    if (track.CoverImageUrl && track.CoverImageUrl.trim() && !track.CoverImageUrl.includes('placeholder')) {
        return track.CoverImageUrl;
    }
    
    // Picsum photos ile güvenilir görseller (size'a göre)
    const dimensions = {
        thumb: 40,
        small: 80,
        large: 300
    };
    
    const dim = dimensions[size] || 80;
    const seed = track.TrackID || Math.floor(Math.random() * 1000);
    
    // Picsum'dan TrackID'ye göre tutarlı görsel
    return `https://picsum.photos/seed/${seed}/${dim}/${dim}`;
}

// =============================================
// Media Session API (Multimedya Tuşları)
// =============================================
function updateMediaSession(track) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.Title,
            artist: track.ArtistName,
            album: track.AlbumTitle || 'Single',
            artwork: [
                { src: getCoverImage(track, 'small'), sizes: '96x96', type: 'image/jpeg' },
                { src: getCoverImage(track, 'large'), sizes: '256x256', type: 'image/jpeg' },
                { src: getCoverImage(track, 'large'), sizes: '512x512', type: 'image/jpeg' }
            ]
        });

        // Multimedya tuşları için action handler'ları
        navigator.mediaSession.setActionHandler('play', () => {
            if (!isPlaying) togglePlay();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            if (isPlaying) togglePlay();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
            playPreviousTrack();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
            playNextTrack();
        });

        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const seekOffset = details.seekOffset || 10;
            const progressSlider = document.getElementById('progressSlider');
            const newValue = Math.max(0, parseFloat(progressSlider.value) - (seekOffset / currentTrack.Duration * 100));
            progressSlider.value = newValue;
            document.getElementById('progressFill').style.width = `${newValue}%`;
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const seekOffset = details.seekOffset || 10;
            const progressSlider = document.getElementById('progressSlider');
            const newValue = Math.min(100, parseFloat(progressSlider.value) + (seekOffset / currentTrack.Duration * 100));
            progressSlider.value = newValue;
            document.getElementById('progressFill').style.width = `${newValue}%`;
        });

        // Playback state güncelle
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        console.log('🎮 Media Session API initialized');
    }
}

// =============================================
// Keyboard Shortcuts
// =============================================
document.addEventListener('keydown', (e) => {
    // Space: Play/Pause
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
    }
    
    // Arrow Right: Next track
    if (e.code === 'ArrowRight' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        playNextTrack();
    }
    
    // Arrow Left: Previous track
    if (e.code === 'ArrowLeft' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        playPreviousTrack();
    }
    
    // Arrow Up: Volume up
    if (e.code === 'ArrowUp' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 10);
    }
    
    // Arrow Down: Volume down
    if (e.code === 'ArrowDown' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 10);
    }
});

// =============================================
// Check Authentication and Load User
// =============================================
function checkAuthAndLoadUser() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn) {
        window.location.href = '/login.html';
        return;
    }
    
    // Load user info
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    const userId = localStorage.getItem('userID') || localStorage.getItem('userId') || sessionStorage.getItem('userID') || sessionStorage.getItem('userId');
    
    if (username) {
        document.getElementById('userDisplayName').textContent = username;
    }
    
    // Load avatar from database
    if (userId) {
        const avatarImg = document.getElementById('userAvatar')?.querySelector('img');
        
        // First, try to load cached avatar immediately
        const cachedAvatar = localStorage.getItem('avatarUrl');
        if (cachedAvatar && avatarImg) {
            avatarImg.src = cachedAvatar;
        }
        
        // Then fetch fresh data and update cache
        fetch(`${API_BASE_URL}/users/${userId}`)
            .then(res => res.json())
            .then(user => {
                if (avatarImg) {
                    let avatarUrl = user.AvatarUrl;
                    if (!avatarUrl || avatarUrl.startsWith('/avatars/')) {
                        avatarUrl = `https://i.pravatar.cc/150?u=${user.Username}`;
                    }
                    avatarImg.src = avatarUrl;
                    localStorage.setItem('avatarUrl', avatarUrl);
                    avatarImg.onerror = function() {
                        this.src = `https://i.pravatar.cc/150?u=${user.Username}`;
                    };
                }
            })
            .catch(err => console.error('Error loading avatar:', err));
    }
}

// =============================================
// Auto-play from URL parameter
// =============================================
async function checkAutoPlay() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get('play');
    
    if (trackId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tracks/${trackId}`);
            const track = await response.json();
            
            if (track && track.TrackID) {
                // Wait a bit for track queue to load
                setTimeout(() => {
                    playTrack(track, -1);
                }, 1000);
            }
        } catch (error) {
            console.error('Auto-play error:', error);
        }
        
        // Clean URL
        window.history.replaceState({}, document.title, '/');
    }
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
// Navigate to Track Detail Page
// =============================================
function goToTrackDetail(trackId) {
    window.location.href = `/track-detail.html?id=${trackId}`;
}

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
        
        const response = await fetch(`/api/playlists/user/${userId}?userId=${userId}`);
        
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
    
    try {
        const userId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
        const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
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
        if (error.message.includes('already exists')) {
            showToast('Bu şarkı zaten çalma listesinde', 'warning');
        } else {
            showToast('Şarkı eklenirken hata oluştu', 'error');
        }
    }
}

// =============================================
// Cleanup on page unload
// =============================================
window.addEventListener('beforeunload', () => {
    // Save state but don't stop playback - will continue on next page
    if (isPlaying) {
        savePlayerState();
    }
});

// =============================================
// Playlist Functions
// =============================================
let selectedTrackId = null;

async function openAddToPlaylistModal(trackId) {
    selectedTrackId = trackId;
    const modal = document.getElementById('addToPlaylistModal');
    const playlistsList = document.getElementById('playlistsList');
    
    modal.style.display = 'flex';
    playlistsList.innerHTML = '<div class="loading-spinner"></div><p>Çalma listeleri yükleniyor...</p>';
    
    try {
        const userId = localStorage.getItem('userID') || localStorage.getItem('userId');
        if (!userId) {
            showToast('Lütfen giriş yapın', 'warning');
            modal.style.display = 'none';
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/playlists?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to load playlists');
        
        const result = await response.json();
        const playlists = result.data || result;
        
        if (playlists.length === 0) {
            playlistsList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                    <p>Henüz çalma listeniz yok</p>
                    <a href="library.html" style="color: var(--primary-color); text-decoration: none;">Çalma listesi oluştur</a>
                </div>
            `;
            return;
        }
        
        playlistsList.innerHTML = playlists.map(playlist => `
            <div class="playlist-select-item" onclick="addTrackToPlaylist(${playlist.PlaylistID}, ${trackId})">
                <div class="playlist-select-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                </div>
                <div class="playlist-select-info">
                    <div class="playlist-select-name">${playlist.Name}</div>
                    <div class="playlist-select-count">${playlist.TrackCount} şarkı</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Load playlists error:', error);
        playlistsList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Yüklenirken hata oluştu</p>';
    }
}

function closeAddToPlaylistModal() {
    document.getElementById('addToPlaylistModal').style.display = 'none';
    selectedTrackId = null;
}

async function addTrackToPlaylist(playlistId, trackId) {
    try {
        const userId = localStorage.getItem('userID') || localStorage.getItem('userId');
        
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trackId: trackId,
                userId: parseInt(userId)
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Şarkı çalma listesine eklendi', 'success');
            closeAddToPlaylistModal();
        } else {
            if (result.message && result.message.includes('zaten')) {
                showToast('Bu şarkı zaten çalma listesinde', 'warning');
            } else {
                showToast(result.message || 'Şarkı eklenemedi', 'error');
            }
        }
        
    } catch (error) {
        console.error('Add to playlist error:', error);
        showToast('Bir hata oluştu', 'error');
    }
}

// Modal outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('addToPlaylistModal');
    if (e.target === modal) {
        closeAddToPlaylistModal();
    }
});
