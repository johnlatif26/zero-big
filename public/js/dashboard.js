// ===== DOM ELEMENTS =====
const requestsBody = document.getElementById('requestsBody');
const emptyState = document.getElementById('emptyState');
const totalRequestsEl = document.getElementById('totalRequests');
const pendingRequestsEl = document.getElementById('pendingRequests');
const completedRequestsEl = document.getElementById('completedRequests');
const requestCountEl = document.getElementById('requestCount');

let requests = [];
let pollingInterval = null;

// ===== AUTH CHECK =====
async function checkAuth() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/login';
        return false;
    }

    try {
        const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            window.location.href = '/login';
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
        return false;
    }
}

// ===== FETCH REQUESTS =====
async function fetchRequests() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch('/api/requests', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        requests = data;
        renderTable(requests);
        updateStats(requests);
        updateRequestCount(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
    }
}

// ===== RENDER TABLE =====
function renderTable(data) {
    if (!data || data.length === 0) {
        requestsBody.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }

    emptyState.classList.remove('show');

    requestsBody.innerHTML = data.map((req, index) => {
        const statusClass = req.status === 'completed' ? 'completed' : 'pending';
        const statusText = req.status === 'completed' ? '✅ مكتمل' : '⏳ قيد الانتظار';
        const isCompleted = req.status === 'completed';

        return `
            <tr data-id="${req.id}">
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(req.fullName)}</strong></td>
                <td>${escapeHtml(req.email)}</td>
                <td>${escapeHtml(req.phone)}</td>
                <td>${escapeHtml(req.projectType)}</td>
                <td title="${escapeHtml(req.projectIdea)}">${truncate(escapeHtml(req.projectIdea), 30)}</td>
                <td>${escapeHtml(req.features || '-')}</td>
                <td>${escapeHtml(req.heardAbout || '-')}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-complete" data-id="${req.id}" ${isCompleted ? 'disabled' : ''}>
                        ${isCompleted ? 'تم ✓' : 'تم'}
                    </button>
                    <button class="btn-delete" data-id="${req.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('.btn-complete').forEach(btn => {
        btn.addEventListener('click', handleComplete);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
}

// ===== UPDATE STATS =====
function updateStats(data) {
    const total = data.length;
    const pending = data.filter(r => r.status === 'pending').length;
    const completed = data.filter(r => r.status === 'completed').length;

    totalRequestsEl.textContent = total;
    pendingRequestsEl.textContent = pending;
    completedRequestsEl.textContent = completed;
}

function updateRequestCount(data) {
    const total = data.length;
    requestCountEl.textContent = `${total} طلب`;
}

// ===== HANDLE COMPLETE =====
async function handleComplete(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;

    if (btn.disabled) return;

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'جاري...';

    try {
        const response = await fetch(`/api/requests/${id}/complete`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) throw new Error('Failed to update');

        const result = await response.json();

        const req = requests.find(r => r.id === id);
        if (req) {
            req.status = 'completed';
        }

        renderTable(requests);
        updateStats(requests);
        updateRequestCount(requests);

        showNotification('✅ تم تحديث الحالة وإرسال إشعار للعميل');

    } catch (error) {
        console.error('Error completing request:', error);
        showNotification('❌ حدث خطأ، حاول مرة أخرى', 'error');
        btn.disabled = false;
        btn.textContent = 'تم';
    }
}

// ===== HANDLE DELETE =====
async function handleDelete(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;

    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch(`/api/requests/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) throw new Error('Failed to delete');

        requests = requests.filter(r => r.id !== id);

        renderTable(requests);
        updateStats(requests);
        updateRequestCount(requests);

        showNotification('🗑️ تم حذف الطلب بنجاح');

    } catch (error) {
        console.error('Error deleting request:', error);
        showNotification('❌ حدث خطأ، حاول مرة أخرى', 'error');
    }
}

// ===== NOTIFICATION =====
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.dashboard-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = `dashboard-notification ${type}`;
    notif.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 14px 24px;
        border-radius: 10px;
        background: ${type === 'success' ? '#22c55e' : '#dc2626'};
        color: white;
        font-weight: 600;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideUp 0.3s ease;
        max-width: 400px;
        font-size: 14px;
    `;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateY(20px)';
        notif.style.transition = 'all 0.3s';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(text, maxLen) {
    if (!text) return '';
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

// ===== POLLING =====
function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(() => {
        fetchRequests();
    }, 5000);
}

// ===== LOGOUT =====
document.querySelector('.btn-logout')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
});

// ===== INIT =====
async function init() {
    const isAuth = await checkAuth();
    if (isAuth) {
        await fetchRequests();
        startPolling();
    }
}

init();

window.addEventListener('beforeunload', () => {
    if (pollingInterval) clearInterval(pollingInterval);
});

// ===== STYLES =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
    }
    .status-badge.pending {
        background: #fef3c7;
        color: #d97706;
    }
    .status-badge.completed {
        background: #d1fae5;
        color: #059669;
    }
    
    .btn-complete {
        padding: 6px 16px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.3s;
    }
    .btn-complete:hover:not(:disabled) {
        background: #1d4ed8;
        transform: scale(1.02);
    }
    .btn-complete:disabled {
        background: #9ca3af;
        cursor: not-allowed;
    }
    
    .btn-delete {
        padding: 6px 12px;
        background: transparent;
        color: #dc2626;
        border: 1px solid #fca5a5;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.3s;
        margin-right: 6px;
    }
    .btn-delete:hover {
        background: #fee2e2;
    }
    
    .empty-state {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #9ca3af;
    }
    .empty-state.show {
        display: flex;
    }
    .empty-state i {
        margin-bottom: 16px;
        opacity: 0.3;
    }
`;
document.head.appendChild(style);
