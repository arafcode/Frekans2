// Global state
let currentPage = 1;
let feedbackData = [];
let filteredData = [];
const pageSize = 20;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    // Check if admin
    const userFromLocal = localStorage.getItem('user');
    const userFromSession = sessionStorage.getItem('user');
    const user = JSON.parse(userFromLocal || userFromSession || 'null');
    
    console.log('User data:', user);
    
    if (!user) {
        showToast('Lütfen giriş yapın', 'error');
        setTimeout(() => window.location.href = '/login.html', 2000);
        return;
    }
    
    if (!user.IsAdmin) {
        showToast('Bu sayfaya erişim yetkiniz yok', 'error');
        setTimeout(() => window.location.href = '/', 2000);
        return;
    }

    await loadStats();
    await loadFeedbacks();
});

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/admin/feedback-stats');
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            const stats = {};
            data.data.forEach(stat => {
                stats[stat.Status] = stat.Count;
            });
            
            const total = data.data.reduce((sum, stat) => sum + parseInt(stat.Count || 0), 0);
            document.getElementById('statTotal').textContent = total;
            document.getElementById('statPending').textContent = stats.pending || 0;
            document.getElementById('statReviewed').textContent = stats.reviewed || 0;
            document.getElementById('statResolved').textContent = stats.resolved || 0;
        } else {
            // Hiç veri yoksa sıfırları göster
            document.getElementById('statTotal').textContent = 0;
            document.getElementById('statPending').textContent = 0;
            document.getElementById('statReviewed').textContent = 0;
            document.getElementById('statResolved').textContent = 0;
        }
    } catch (error) {
        console.error('Stats error:', error);
        showToast('İstatistikler yüklenemedi', 'error');
    }
}

// Load feedbacks
async function loadFeedbacks() {
    try {
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('tableContainer').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';

        const response = await fetch('/api/admin/feedbacks?limit=1000');
        const data = await response.json();
        
        if (data.success) {
            feedbackData = data.data || [];
            filteredData = [...feedbackData];
            renderTable();
        } else {
            showToast(data.message || 'Veriler yüklenemedi', 'error');
        }
    } catch (error) {
        console.error('Load feedbacks error:', error);
        showToast('Bağlantı hatası', 'error');
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

// Render table
function renderTable() {
    const tbody = document.getElementById('feedbackTableBody');
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filteredData.slice(start, end);
    
    if (pageData.length === 0) {
        document.getElementById('tableContainer').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('pagination').style.display = 'none';
        return;
    }
    
    document.getElementById('tableContainer').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    
    tbody.innerHTML = pageData.map(item => `
        <tr>
            <td>#${item.FeedbackID}</td>
            <td>
                <strong>${item.Username || 'Anonim'}</strong><br>
                <small style="color: var(--text-muted);">${item.Email || ''}</small>
            </td>
            <td><span class="badge ${item.TypeKey}">${getTypeLabel(item.TypeKey)}</span></td>
            <td>
                <strong>${item.Title || item.Category || '-'}</strong><br>
                <small style="color: var(--text-muted);">${truncate(item.Message, 50)}</small>
            </td>
            <td><span class="badge ${item.Status}">${getStatusLabel(item.Status)}</span></td>
            <td><span class="badge ${item.Priority}">${getPriorityLabel(item.Priority)}</span></td>
            <td>
                <small style="color: var(--text-muted);">${formatDate(item.CreatedDate)}</small>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="action-btn view" onclick="viewFeedback(${item.FeedbackID})">Görüntüle</button>
                    <button class="action-btn edit" onclick="editFeedback(${item.FeedbackID})">Düzenle</button>
                    <button class="action-btn delete" style="background: #ef4444;" onclick="deleteFeedback(${item.FeedbackID})">Sil</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Update pagination
    const totalPages = Math.ceil(filteredData.length / pageSize);
    document.getElementById('pagination').style.display = totalPages > 1 ? 'flex' : 'none';
    document.getElementById('pageInfo').textContent = `Sayfa ${currentPage} / ${totalPages}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

// Apply filters
function applyFilters() {
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    filteredData = feedbackData.filter(item => {
        const matchType = !typeFilter || item.TypeKey === typeFilter;
        const matchStatus = !statusFilter || item.Status === statusFilter;
        const matchSearch = !searchQuery || 
            item.Message.toLowerCase().includes(searchQuery) ||
            (item.Username && item.Username.toLowerCase().includes(searchQuery)) ||
            (item.Title && item.Title.toLowerCase().includes(searchQuery));
        
        return matchType && matchStatus && matchSearch;
    });
    
    currentPage = 1;
    renderTable();
}

// View feedback
function viewFeedback(id) {
    const feedback = feedbackData.find(f => f.FeedbackID === id);
    if (!feedback) return;
    
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;" id="viewModal" onclick="if(event.target.id === 'viewModal') closeViewModal()">
            <div style="background: var(--bg-secondary); padding: 30px; border-radius: 12px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: var(--text-primary);">Geri Bildirim Detayları</h2>
                    <button onclick="closeViewModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-muted);">&times;</button>
                </div>
                
                <div style="display: grid; gap: 16px;">
                    <div>
                        <label style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">ID</label>
                        <p style="margin: 4px 0 0 0; color: var(--text-primary);">#${feedback.FeedbackID}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <label style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Kullanıcı</label>
                            <p style="margin: 4px 0 0 0; color: var(--text-primary);">${feedback.Username || 'Anonim'}</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: var(--text-muted);">${feedback.Email || ''}</p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Tarih</label>
                            <p style="margin: 4px 0 0 0; color: var(--text-primary);">${formatDate(feedback.CreatedDate)}</p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                        <div>
                            <label style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Tip</label>
                            <p style="margin: 4px 0 0 0;"><span class="badge ${feedback.TypeKey}">${getTypeLabel(feedback.TypeKey)}</span></p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Durum</label>
                            <p style="margin: 4px 0 0 0;"><span class="badge ${feedback.Status}">${getStatusLabel(feedback.Status)}</span></p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Öncelik</label>
                            <p style="margin: 4px 0 0 0;"><span class="badge ${feedback.Priority}">${getPriorityLabel(feedback.Priority)}</span></p>
                        </div>
                    </div>
                    
                    ${feedback.Title ? `
                        <div>
                            <label style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Başlık</label>
                            <p style="margin: 4px 0 0 0; color: var(--text-primary);">${feedback.Title}</p>
                        </div>
                    ` : ''}
                    
                    ${feedback.Category ? `
                        <div>
                            <label style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Kategori</label>
                            <p style="margin: 4px 0 0 0; color: var(--text-primary);">${feedback.Category}</p>
                        </div>
                    ` : ''}
                    
                    <div>
                        <label style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Mesaj</label>
                        <p style="margin: 4px 0 0 0; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; color: var(--text-primary); white-space: pre-wrap;">${feedback.Message}</p>
                    </div>
                    
                    ${feedback.AdminNotes ? `
                        <div>
                            <label style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Admin Notları</label>
                            <p style="margin: 4px 0 0 0; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; color: var(--text-primary); white-space: pre-wrap;">${feedback.AdminNotes}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 24px; display: flex; gap: 10px;">
                    <button onclick="editFeedback(${feedback.FeedbackID}); closeViewModal();" style="flex: 1; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Düzenle</button>
                    <button onclick="closeViewModal()" style="flex: 1; padding: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Kapat</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) modal.remove();
}

// Edit feedback
function editFeedback(id) {
    const feedback = feedbackData.find(f => f.FeedbackID === id);
    if (!feedback) return;
    
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;" id="editModal" onclick="if(event.target.id === 'editModal') closeEditModal()">
            <div style="background: var(--bg-secondary); padding: 30px; border-radius: 12px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin: 0 0 20px 0; color: var(--text-primary);">Geri Bildirim Düzenle #${id}</h2>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Durum</label>
                    <select id="editStatus" style="width: 100%; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                        <option value="pending" ${feedback.Status === 'pending' ? 'selected' : ''}>Bekleyen</option>
                        <option value="reviewed" ${feedback.Status === 'reviewed' ? 'selected' : ''}>İncelenen</option>
                        <option value="resolved" ${feedback.Status === 'resolved' ? 'selected' : ''}>Çözülen</option>
                        <option value="closed" ${feedback.Status === 'closed' ? 'selected' : ''}>Kapalı</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Öncelik</label>
                    <select id="editPriority" style="width: 100%; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                        <option value="low" ${feedback.Priority === 'low' ? 'selected' : ''}>Düşük</option>
                        <option value="normal" ${feedback.Priority === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="high" ${feedback.Priority === 'high' ? 'selected' : ''}>Yüksek</option>
                        <option value="urgent" ${feedback.Priority === 'urgent' ? 'selected' : ''}>Acil</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Admin Notları</label>
                    <textarea id="editNotes" style="width: 100%; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); min-height: 120px; resize: vertical; font-family: inherit;">${feedback.AdminNotes || ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="saveFeedbackChanges(${id})" style="flex: 1; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Kaydet</button>
                    <button onclick="closeEditModal()" style="flex: 1; padding: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">İptal</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.remove();
}

async function saveFeedbackChanges(id) {
    const status = document.getElementById('editStatus').value;
    const priority = document.getElementById('editPriority').value;
    const adminNotes = document.getElementById('editNotes').value;
    
    try {
        const userFromLocal = localStorage.getItem('user');
        const userFromSession = sessionStorage.getItem('user');
        const user = JSON.parse(userFromLocal || userFromSession);
        
        if (!user) {
            showToast('Kullanıcı bilgisi bulunamadı', 'error');
            return;
        }
        
        const response = await fetch(`/api/admin/feedback/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status,
                priority,
                adminNotes,
                reviewedBy: user.UserID || user.userId
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Güncellendi', 'success');
            closeEditModal();
            await loadStats();
            await loadFeedbacks();
        } else {
            showToast(data.message || 'Güncelleme başarısız', 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        showToast('Bağlantı hatası', 'error');
    }
}

// Pagination
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

// Refresh data
async function refreshData() {
    await loadStats();
    await loadFeedbacks();
    showToast('Veriler güncellendi', 'success');
}

// Delete feedback
function deleteFeedback(id) {
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;" id="deleteModal">
            <div style="background: var(--bg-secondary); padding: 30px; border-radius: 12px; max-width: 400px; width: 100%;">
                <h3 style="margin: 0 0 16px 0; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Silme Onayı
                </h3>
                <p style="color: var(--text-muted); margin-bottom: 24px;">Bu geri bildirimi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="confirmDelete(${id})" style="flex: 1; padding: 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Evet, Sil</button>
                    <button onclick="closeDeleteModal()" style="flex: 1; padding: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">İptal</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.remove();
}

async function confirmDelete(id) {
    closeDeleteModal();
    
    try {
        const response = await fetch(`/api/admin/feedback/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Geri bildirim silindi', 'success');
            await loadStats();
            await loadFeedbacks();
        } else {
            showToast(data.message || 'Silme başarısız', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Bağlantı hatası', 'error');
    }
}

// Go to home
function goToHome() {
    window.location.href = '/';
}

// Helper functions
function getTypeLabel(type) {
    const labels = {
        'feedback': 'Geri Bildirim',
        'complaint': 'Şikayet',
        'suggestion': 'Öneri'
    };
    return labels[type] || type;
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Bekleyen',
        'reviewed': 'İncelenen',
        'resolved': 'Çözülen',
        'closed': 'Kapalı'
    };
    return labels[status] || status;
}

function getPriorityLabel(priority) {
    const labels = {
        'low': 'Düşük',
        'normal': 'Normal',
        'high': 'Yüksek',
        'urgent': 'Acil'
    };
    return labels[priority] || priority;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncate(text, length) {
    if (!text) return '-';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

// =============================================
// Tab Switching
// =============================================
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'feedbacks') {
        document.getElementById('feedbacksTab').classList.add('active');
    } else if (tabName === 'users') {
        document.getElementById('usersTab').classList.add('active');
        loadUsers();
    }
}

// =============================================
// User Management
// =============================================
let currentUserPage = 1;
let userData = [];
const userPageSize = 20;

async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (data.success) {
            userData = data.data;
            
            // Calculate stats
            const totalUsers = userData.length;
            const adminUsers = userData.filter(u => u.IsAdmin).length;
            const normalUsers = totalUsers - adminUsers;
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentUsers = userData.filter(u => new Date(u.CreatedAt) >= sevenDaysAgo).length;
            
            document.getElementById('userStatTotal').textContent = totalUsers;
            document.getElementById('userStatAdmin').textContent = adminUsers;
            document.getElementById('userStatNormal').textContent = normalUsers;
            document.getElementById('userStatRecent').textContent = recentUsers;
            
            displayUsers();
        }
    } catch (error) {
        console.error('Load users error:', error);
        showToast('Kullanıcılar yüklenemedi', 'error');
    }
}

function displayUsers() {
    const tbody = document.getElementById('userTableBody');
    const start = (currentUserPage - 1) * userPageSize;
    const end = start + userPageSize;
    const pageData = userData.slice(start, end);
    
    if (pageData.length === 0) {
        tbody.innerHTML = '';
        document.getElementById('userTableContainer').style.display = 'none';
        document.getElementById('userEmptyState').style.display = 'flex';
        document.getElementById('userPagination').style.display = 'none';
        return;
    }
    
    document.getElementById('userTableContainer').style.display = 'block';
    document.getElementById('userEmptyState').style.display = 'none';
    
    tbody.innerHTML = pageData.map(user => `
        <tr>
            <td>${user.UserID}</td>
            <td>${user.Username}</td>
            <td>${user.Email || '-'}</td>
            <td>
                <span class="badge ${user.IsAdmin ? 'badge-admin' : 'badge-user'}">
                    ${user.IsAdmin ? 'Admin' : 'Kullanıcı'}
                </span>
            </td>
            <td>${user.Language || 'tr'}</td>
            <td>${formatDate(user.CreatedAt)}</td>
            <td>
                <div class="user-actions">
                    <button class="btn-edit" onclick="editUser(${user.UserID})">Düzenle</button>
                    <button class="btn-delete" onclick="deleteUser(${user.UserID})">Sil</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Update pagination
    const totalPages = Math.ceil(userData.length / userPageSize);
    if (totalPages > 1) {
        document.getElementById('userPagination').style.display = 'flex';
        document.getElementById('userPageInfo').textContent = `Sayfa ${currentUserPage} / ${totalPages}`;
        document.getElementById('userPrevBtn').disabled = currentUserPage === 1;
        document.getElementById('userNextBtn').disabled = currentUserPage === totalPages;
    } else {
        document.getElementById('userPagination').style.display = 'none';
    }
}

function prevUserPage() {
    if (currentUserPage > 1) {
        currentUserPage--;
        displayUsers();
    }
}

function nextUserPage() {
    const totalPages = Math.ceil(userData.length / userPageSize);
    if (currentUserPage < totalPages) {
        currentUserPage++;
        displayUsers();
    }
}

function editUser(userId) {
    const user = userData.find(u => u.UserID === userId);
    if (!user) return;
    
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;" id="editUserModal" onclick="if(event.target.id === 'editUserModal') closeEditUserModal()">
            <div style="background: var(--bg-secondary); border-radius: 12px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 20px;">Kullanıcı Düzenle</h2>
                    <button onclick="closeEditUserModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-muted);">&times;</button>
                </div>
                <div style="padding: 24px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 14px;">Kullanıcı Adı</label>
                        <input type="text" id="editUsername" value="${user.Username}" style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 14px;">Email</label>
                        <input type="email" id="editEmail" value="${user.Email || ''}" style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 14px;">Dil</label>
                        <select id="editLanguage" style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                            <option value="tr" ${user.Language === 'tr' ? 'selected' : ''}>Türkçe</option>
                            <option value="en" ${user.Language === 'en' ? 'selected' : ''}>English</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="editIsAdmin" ${user.IsAdmin ? 'checked' : ''} style="margin-right: 8px;">
                            <span style="color: var(--text-primary);">Admin Yetkisi</span>
                        </label>
                    </div>
                </div>
                <div style="padding: 20px 24px; border-top: 1px solid var(--border-color); display: flex; gap: 12px;">
                    <button onclick="saveUserChanges(${userId})" style="flex: 1; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Kaydet</button>
                    <button onclick="closeEditUserModal()" style="flex: 1; padding: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">İptal</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) modal.remove();
}

async function saveUserChanges(userId) {
    try {
        const username = document.getElementById('editUsername').value;
        const email = document.getElementById('editEmail').value;
        const language = document.getElementById('editLanguage').value;
        const isAdmin = document.getElementById('editIsAdmin').checked;
        
        const response = await fetch(`/api/admin/user/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, isAdmin, language })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Kullanıcı güncellendi', 'success');
            closeEditUserModal();
            await loadUsers();
        } else {
            showToast(data.message || 'Güncelleme başarısız', 'error');
        }
    } catch (error) {
        console.error('Save user error:', error);
        showToast('Kullanıcı güncellenemedi', 'error');
    }
}

function deleteUser(userId) {
    const user = userData.find(u => u.UserID === userId);
    if (!user) return;
    
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;" id="deleteUserModal" onclick="if(event.target.id === 'deleteUserModal') closeDeleteUserModal()">
            <div style="background: var(--bg-secondary); border-radius: 12px; max-width: 400px; width: 100%; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <h2 style="margin: 0 0 16px 0; font-size: 20px;">Kullanıcıyı Sil</h2>
                <p style="color: var(--text-muted); margin-bottom: 24px;">
                    <strong>${user.Username}</strong> kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div style="display: flex; gap: 12px;">
                    <button onclick="confirmDeleteUser(${userId})" style="flex: 1; padding: 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Sil</button>
                    <button onclick="closeDeleteUserModal()" style="flex: 1; padding: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">İptal</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeDeleteUserModal() {
    const modal = document.getElementById('deleteUserModal');
    if (modal) modal.remove();
}

async function confirmDeleteUser(userId) {
    try {
        const response = await fetch(`/api/admin/user/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Kullanıcı silindi', 'success');
            closeDeleteUserModal();
            await loadUsers();
        } else {
            showToast(data.message || 'Silme başarısız', 'error');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showToast('Kullanıcı silinemedi', 'error');
    }
}

// =============================================
// Logout
// =============================================
function logout() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    window.location.href = '/login.html';
}
