// ===== DOM ELEMENTS =====
// Navigation
const navRequests = document.getElementById('navRequests');
const navMessages = document.getElementById('navMessages');
const navSendMessage = document.getElementById('navSendMessage');
const sectionRequests = document.getElementById('sectionRequests');
const sectionMessages = document.getElementById('sectionMessages');
const sectionSendMessage = document.getElementById('sectionSendMessage');

// Requests
const requestsBody = document.getElementById('requestsBody');
const emptyState = document.getElementById('emptyState');
const totalRequestsEl = document.getElementById('totalRequests');
const pendingRequestsEl = document.getElementById('pendingRequests');
const completedRequestsEl = document.getElementById('completedRequests');
const requestCountEl = document.getElementById('requestCount');

// Messages
const messagesBody = document.getElementById('messagesBody');
const emptyMessages = document.getElementById('emptyMessages');
const sentMessagesEl = document.getElementById('sentMessages');
const readMessagesEl = document.getElementById('readMessages');
const unreadMessagesEl = document.getElementById('unreadMessages');
const messageCountEl = document.getElementById('messageCount');
const messageBadge = document.getElementById('messageBadge');

// Send Message
const sendEmailTo = document.getElementById('sendEmailTo');
const sendSubject = document.getElementById('sendSubject');
const sendMessage = document.getElementById('sendMessage');
const sendNewMessageBtn = document.getElementById('sendNewMessageBtn');
const sendMessageStatus = document.getElementById('sendMessageStatus');

let requests = [];
let messages = [];
let pollingInterval = null;

// ============================================
// ===== NAVIGATION =====
// ============================================

function showSection(section) {
    // Hide all sections
    sectionRequests.style.display = 'none';
    sectionMessages.style.display = 'none';
    sectionSendMessage.style.display = 'none';
    
    // Remove active class from all nav buttons
    navRequests.classList.remove('active');
    navMessages.classList.remove('active');
    navSendMessage.classList.remove('active');
    
    // Show selected section
    if (section === 'requests') {
        sectionRequests.style.display = 'block';
        navRequests.classList.add('active');
    } else if (section === 'messages') {
        sectionMessages.style.display = 'block';
        navMessages.classList.add('active');
        fetchMessages();
    } else if (section === 'send') {
        sectionSendMessage.style.display = 'block';
        navSendMessage.classList.add('active');
    }
}

navRequests.addEventListener('click', () => showSection('requests'));
navMessages.addEventListener('click', () => showSection('messages'));
navSendMessage.addEventListener('click', () => showSection('send'));

// ============================================
// ===== AUTH CHECK =====
// ============================================

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

// ============================================
// ===== FETCH REQUESTS =====
// ============================================

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
        renderRequests(requests);
        updateStats(requests);
        updateRequestCount(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
    }
}

// ============================================
// ===== FETCH MESSAGES =====
// ============================================

async function fetchMessages() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/messages', {
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

        if (!response.ok) throw new Error('Failed to fetch messages');

        const data = await response.json();
        messages = data;
        renderMessages(messages);
        updateMessageStats(messages);
        updateMessageBadge(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// ============================================
// ===== RENDER REQUESTS =====
// ============================================

function renderRequests(data) {
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

// ============================================
// ===== RENDER MESSAGES =====
// ============================================

function renderMessages(data) {
    if (!data || data.length === 0) {
        messagesBody.innerHTML = '';
        emptyMessages.classList.add('show');
        return;
    }

    emptyMessages.classList.remove('show');

    messagesBody.innerHTML = data.map((msg, index) => {
        const statusClass = msg.status === 'read' ? 'read' : 'unread';
        const statusText = msg.status === 'read' ? '✅ متشافه' : '⏳ متشافتش';
        const sentDate = new Date(msg.sentAt);
        const dateStr = sentDate.toLocaleDateString('ar-EG') + ' ' + sentDate.toLocaleTimeString('ar-EG');

        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(msg.recipientName || msg.recipientEmail)}</strong></td>
                <td>${escapeHtml(msg.recipientEmail)}</td>
                <td>${escapeHtml(msg.subject)}</td>
                <td title="${escapeHtml(msg.message)}">${truncate(escapeHtml(msg.message), 40)}</td>
                <td>${dateStr}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

// ============================================
// ===== UPDATE STATS =====
// ============================================

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

function updateMessageStats(data) {
    const total = data.length;
    const sent = data.length;
    const read = data.filter(m => m.status === 'read').length;
    const unread = data.filter(m => m.status === 'unread' || !m.status).length;

    sentMessagesEl.textContent = sent;
    readMessagesEl.textContent = read;
    unreadMessagesEl.textContent = unread;
    messageCountEl.textContent = `${total} رسالة`;
}

function updateMessageBadge(data) {
    const unread = data.filter(m => m.status === 'unread' || !m.status).length;
    messageBadge.textContent = unread;
    messageBadge.style.display = unread > 0 ? 'inline-block' : 'none';
}

// ============================================
// ===== HANDLE COMPLETE =====
// ============================================

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

        await response.json();

        const req = requests.find(r => r.id === id);
        if (req) {
            req.status = 'completed';
        }

        renderRequests(requests);
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

// ============================================
// ===== HANDLE DELETE =====
// ============================================

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

        renderRequests(requests);
        updateStats(requests);
        updateRequestCount(requests);

        showNotification('🗑️ تم حذف الطلب بنجاح');

    } catch (error) {
        console.error('Error deleting request:', error);
        showNotification('❌ حدث خطأ، حاول مرة أخرى', 'error');
    }
}

// ============================================
// ===== SEND NEW MESSAGE =====
// ============================================

sendNewMessageBtn.addEventListener('click', async function() {
    const to = sendEmailTo.value.trim();
    const subject = sendSubject.value.trim();
    const message = sendMessage.value.trim();

    if (!to || !subject || !message) {
        sendMessageStatus.textContent = '⚠️ الرجاء إدخال جميع الحقول';
        sendMessageStatus.className = 'email-status error';
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    sendMessageStatus.textContent = '⏳ جاري إرسال الرسالة...';
    sendMessageStatus.className = 'email-status info';

    try {
        const response = await fetch('/api/send-manual-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                to: to,
                subject: subject,
                message: message
            })
        });

        const result = await response.json();

        if (result.success) {
            sendMessageStatus.textContent = '✅ تم إرسال الرسالة بنجاح!';
            sendMessageStatus.className = 'email-status success';
            sendEmailTo.value = '';
            sendSubject.value = '';
            sendMessage.value = '';
            // Refresh messages
            fetchMessages();
        } else {
            sendMessageStatus.textContent = '❌ ' + (result.message || 'فشل الإرسال');
            sendMessageStatus.className = 'email-status error';
        }
    } catch (error) {
        console.error('Error sending message:', error);
        sendMessageStatus.textContent = '❌ حدث خطأ في الاتصال بالخادم';
        sendMessageStatus.className = 'email-status error';
    } finally {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال الرسالة';
    }
});

// ============================================
// ===== NOTIFICATION =====
// ============================================

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

// ============================================
// ===== UTILITY FUNCTIONS =====
// ============================================

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

// ============================================
// ===== POLLING =====
// ============================================

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(() => {
        fetchRequests();
        if (sectionMessages.style.display !== 'none') {
            fetchMessages();
        }
    }, 5000);
}

// ============================================
// ===== LOGOUT =====
// ============================================

document.querySelector('.btn-logout')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
});

// ============================================
// ===== INIT =====
// ============================================

async function init() {
    const isAuth = await checkAuth();
    if (isAuth) {
        await fetchRequests();
        await fetchMessages();
        startPolling();
        showSection('requests');
    }
}

init();

window.addEventListener('beforeunload', () => {
    if (pollingInterval) clearInterval(pollingInterval);
});

// ============================================
// ===== STYLES =====
// ============================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Navigation Buttons */
    .nav-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        font-family: 'Cairo', sans-serif;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
    }
    .nav-btn:hover {
        background: rgba(37, 99, 235, 0.1);
        color: #e8edf5;
    }
    .nav-btn.active {
        background: rgba(37, 99, 235, 0.15);
        color: #2563eb;
    }
    .nav-btn .badge {
        background: #ef4444;
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 20px;
        position: absolute;
        top: -4px;
        right: -4px;
        display: none;
        min-width: 18px;
        text-align: center;
    }
    .nav-btn .badge.show {
        display: inline-block;
    }
    
    .dashboard-user {
        margin-right: 16px;
    }
    
    .section-content {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Status Badge for Messages */
    .status-badge.read {
        background: #d1fae5;
        color: #059669;
    }
    .status-badge.unread {
        background: #fef3c7;
        color: #d97706;
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
