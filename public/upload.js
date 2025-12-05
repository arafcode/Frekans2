const API_BASE_URL = '/api';

// Check login
window.addEventListener('DOMContentLoaded', () => {
    const loggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
    if (!loggedIn) {
        window.location.href = '/login.html';
        return;
    }

    // Load user info
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    let userId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    
    if (!userId) {
        userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    }
    
    if (username) {
        const displayName = document.getElementById('userDisplayName');
        if (displayName) {
            displayName.textContent = username;
        }
    }
    
    // Load actual avatar from database
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

    setupFileUploads();
    setupFormSubmit();
    setupUserDropdown();
});

// Setup file upload areas
function setupFileUploads() {
    // Audio file
    const audioArea = document.getElementById('audioUploadArea');
    const audioInput = document.getElementById('audioFile');
    const audioFileName = document.getElementById('audioFileName');

    audioArea.addEventListener('click', () => audioInput.click());
    audioInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            audioFileName.textContent = e.target.files[0].name;
            audioArea.classList.add('has-file');
        }
    });

    // Cover image
    const coverArea = document.getElementById('coverUploadArea');
    const coverInput = document.getElementById('coverImage');
    const coverFileName = document.getElementById('coverFileName');

    coverArea.addEventListener('click', () => coverInput.click());
    coverInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            coverFileName.textContent = e.target.files[0].name;
            coverArea.classList.add('has-file');
        }
    });

    // Drag & drop for audio
    audioArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        audioArea.classList.add('drag-over');
    });

    audioArea.addEventListener('dragleave', () => {
        audioArea.classList.remove('drag-over');
    });

    audioArea.addEventListener('drop', (e) => {
        e.preventDefault();
        audioArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            audioInput.files = e.dataTransfer.files;
            audioFileName.textContent = e.dataTransfer.files[0].name;
            audioArea.classList.add('has-file');
        }
    });
}

// Setup form submit
function setupFormSubmit() {
    const form = document.getElementById('uploadForm');
    form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
    e.preventDefault();

    const audioFile = document.getElementById('audioFile').files[0];
    const coverImage = document.getElementById('coverImage').files[0];
    const title = document.getElementById('title').value;
    const genre = document.getElementById('genre').value;
    const album = document.getElementById('album').value;
    const privacy = document.querySelector('input[name="privacy"]:checked').value;

    if (!audioFile) {
        alert('Lütfen bir ses dosyası seçin!');
        return;
    }

    if (!title) {
        alert('Lütfen şarkı adını girin!');
        return;
    }

    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) {
        alert('Kullanıcı bilgisi bulunamadı!');
        return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('audioFile', audioFile);
    if (coverImage) {
        formData.append('coverImage', coverImage);
    }
    formData.append('title', title);
    formData.append('genre', genre || 'Other');
    formData.append('album', album);
    formData.append('userId', userId);
    formData.append('isPublic', privacy === 'public' ? 'true' : 'false');

    // Show progress
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const submitBtn = document.getElementById('submitBtn');

    progressDiv.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Yükleniyor...';

    try {
        const xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressFill.style.width = percentComplete + '%';
                
                if (percentComplete < 100) {
                    progressText.textContent = `Yükleniyor... ${Math.round(percentComplete)}%`;
                } else {
                    progressText.textContent = 'İşleniyor... Lütfen bekleyin';
                }
            }
        });

        // Complete
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                progressText.textContent = 'Yükleme tamamlandı! ✓';
                progressFill.style.width = '100%';
                
                setTimeout(() => {
                    window.location.href = `/track-detail.html?slug=${response.slug}`;
                }, 1500);
            } else {
                const errorMsg = xhr.responseText ? JSON.parse(xhr.responseText).message : 'Bilinmeyen hata';
                throw new Error(errorMsg);
            }
        });

        // Error
        xhr.addEventListener('error', () => {
            throw new Error('Yükleme başarısız!');
        });

        xhr.open('POST', `${API_BASE_URL}/upload`, true);
        xhr.send(formData);

    } catch (error) {
        console.error('Upload error:', error);
        alert('Yükleme başarısız: ' + error.message);
        
        progressDiv.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Yükle
        `;
    }
}

// User dropdown
function setupUserDropdown() {
    document.getElementById('userAvatar')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    });

    document.getElementById('profileBtn')?.addEventListener('click', () => {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (userId) {
            window.location.href = `/profile.html?id=${userId}`;
        }
    });

    document.addEventListener('click', () => {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    });
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('username');
    window.location.href = '/login.html';
}
