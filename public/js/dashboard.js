/**
 * Zero Big - Dashboard
 * Fetches and displays project requests with real-time updates
 */

// ===== DOM ELEMENTS =====
const requestsBody = document.getElementById('requestsBody');
const emptyState = document.getElementById('emptyState');
const totalRequestsEl = document.getElementById('totalRequests');
const pendingRequestsEl = document.getElementById('pendingRequests');
const completedRequestsEl = document.getElementById('completedRequests');
const requestCountEl = document.getElementById('requestCount');

// Manual Email Elements
const manualEmailSection = document.getElementById('manualEmailSection');
const closeEmailSection = document.getElementById('closeEmailSection');
const emailRecipient = document.getElementById('emailRecipient');
const emailRequestId = document.getElementById('emailRequestId');
const emailSubject = document.getElementById('emailSubject');
const emailMessage = document.getElementById('emailMessage');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const emailStatus = document.getElementById('emailStatus');

let requests = [];
let pollingInterval = null;
let selectedRequestId = null;

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
                    <button class="btn-email" data-id="${req.id}" data-email="${escapeHtml(req.email)}" data-name="${escapeHtml(req.fullName)}">
                        <i class="fas fa-envelope"></i>
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

    document.querySelectorAll('.btn-email').forEach(btn => {
        btn.addEventListener('click', openEmailModal);
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

// ===== OPEN EMAIL MODAL =====
function openEmailModal(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const email = btn.dataset.email;
    const name = btn.dataset.name;

    selectedRequestId = id;
    emailRecipient.textContent = `${name} <${email}>`;
    emailRequestId.textContent = id;
    emailSubject.value = `📩 رسالة من فريق Zero Big - طلب #${id}`;
    emailMessage.value = '';
    emailStatus.textContent = '';
    emailStatus.className = 'email-status';
    manualEmailSection.style.display = 'block';
    manualEmailSection.scrollIntoView({ behavior: 'smooth' });
}

// ===== CLOSE EMAIL SECTION =====
closeEmailSection.addEventListener('click', () => {
    manualEmailSection.style.display = 'none';
});

// ===== SEND MANUAL EMAIL =====
sendEmailBtn.addEventListener('click', async function() {
    const subject = emailSubject.value.trim();
    const message = emailMessage.value.trim();

    if (!subject || !message) {
        emailStatus.textContent = '⚠️ الرجاء إدخال عنوان ونص الرسالة';
        emailStatus.className = 'email-status error';
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    emailStatus.textContent = '⏳ جاري إرسال الرسالة...';
    emailStatus.className = 'email-status info';

    try {
        const response = await fetch('/api/send-manual-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                requestId: selectedRequestId,
                subject: subject,
                message: message
            })
        });

        const result = await response.json();

        if (result.success) {
            emailStatus.textContent = '✅ تم إرسال الرسالة بنجاح!';
            emailStatus.className = 'email-status success';
            emailMessage.value = '';
            setTimeout(() => {
                manualEmailSection.style.display = 'none';
            }, 3000);
        } else {
            emailStatus.textContent = '❌ ' + (result.message || 'فشل الإرسال');
            emailStatus.className = 'email-status error';
        }
    } catch (error) {
        console.error('Error sending email:', error);
        emailStatus.textContent = '❌ حدث خطأ في الاتصال بالخادم';
        emailStatus.className = 'email-status error';
    } finally {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال الرسالة';
    }
});

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

        showNotification('✅ تم تحديث حالة الطلب');

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
        background: #475569;
        cursor: not-allowed;
        opacity: 0.6;
    }
    
    .btn-email {
        padding: 6px 12px;
        background: #059669;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.3s;
        margin-right: 6px;
    }
    .btn-email:hover {
        background: #047857;
        transform: scale(1.02);
    }
    
    .btn-delete {
        padding: 6px 12px;
        background: transparent;
        color: #ef4444;
        border: 1px solid #7f1d1d;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.3s;
        margin-right: 6px;
    }
    .btn-delete:hover {
        background: #7f1d1d;
        color: white;
    }
    
    .empty-state {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #64748b;
    }
    .empty-state.show {
        display: flex;
    }
    .empty-state i {
        margin-bottom: 16px;
        opacity: 0.3;
        color: #2563eb;
    }
    .empty-state p {
        font-size: 16px;
    }

    /* ===== MANUAL EMAIL SECTION ===== */
    .manual-email-section {
        background: #111827;
        border: 1px solid #2563eb;
        border-radius: 12px;
        padding: 24px;
        margin-top: 30px;
    }
    .manual-email-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #1e293b;
    }
    .manual-email-header h2 {
        font-size: 20px;
        color: #2563eb;
    }
    .manual-email-header h2 i {
        margin-left: 10px;
    }
    .btn-close-email {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 20px;
        cursor: pointer;
        transition: color 0.3s;
    }
    .btn-close-email:hover {
        color: #ef4444;
    }
    .manual-email-body {
        padding: 0 4px;
    }
    .email-recipient {
        background: #0a0e1a;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        color: #94a3b8;
    }
    .email-recipient strong {
        color: #e8edf5;
    }
    .email-recipient span {
        color: #e8edf5;
    }
    .manual-email-body .form-group {
        margin-bottom: 16px;
    }
    .manual-email-body .form-group label {
        display: block;
        font-weight: 600;
        margin-bottom: 4px;
        color: #e8edf5;
        font-size: 14px;
    }
    .manual-email-body .form-group input,
    .manual-email-body .form-group textarea {
        width: 100%;
        padding: 12px 14px;
        border: 2px solid #1e293b;
        border-radius: 8px;
        background: #0a0e1a;
        color: #e8edf5;
        font-family: inherit;
        font-size: 14px;
        transition: border-color 0.3s;
    }
    .manual-email-body .form-group input:focus,
    .manual-email-body .form-group textarea:focus {
        outline: none;
        border-color: #2563eb;
    }
    .btn-send-email {
        padding: 12px 32px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.3s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    .btn-send-email:hover:not(:disabled) {
        background: #1d4ed8;
        transform: scale(1.02);
    }
    .btn-send-email:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    .email-status {
        margin-top: 12px;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
    }
    .email-status.success {
        background: #065f46;
        color: #6ee7b7;
    }
    .email-status.error {
        background: #7f1d1d;
        color: #fca5a5;
    }
    .email-status.info {
        background: #1e293b;
        color: #94a3b8;
    }
`;
document.head.appendChild(style);
