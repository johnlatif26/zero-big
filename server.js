require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// ============================================
// ===== FIREBASE ADMIN INITIALIZATION =====
// ============================================
const admin = require('firebase-admin');

let firebaseConfig = null;
let db = null;

try {
    if (process.env.FIREBASE_CONFIG) {
        firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
        
        // Initialize Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig)
        });
        
        db = admin.firestore();
        console.log('✅ Firebase Firestore initialized successfully');
    }
} catch (error) {
    console.warn('⚠️ Firebase config not loaded:', error.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// ===== MIDDLEWARE =====
// ============================================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// ===== JWT AUTHENTICATION =====
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || 'zero-big-super-secret-key';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
}

// ============================================
// ===== SMTP 1: AUTO-REPLY EMAIL =====
// ============================================
const autoTransporter = nodemailer.createTransport({
    host: process.env.AUTO_SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.AUTO_SMTP_PORT) || 587,
    secure: process.env.AUTO_SMTP_SECURE === 'true' || false,
    auth: {
        user: process.env.AUTO_SMTP_USER,
        pass: process.env.AUTO_SMTP_PASS
    }
});

// ============================================
// ===== SMTP 2: MANUAL DASHBOARD EMAIL =====
// ============================================
const manualTransporter = nodemailer.createTransport({
    host: process.env.MANUAL_SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MANUAL_SMTP_PORT) || 587,
    secure: process.env.MANUAL_SMTP_SECURE === 'true' || false,
    auth: {
        user: process.env.MANUAL_SMTP_USER,
        pass: process.env.MANUAL_SMTP_PASS
    }
});

// ============================================
// ===== EMAIL SENDING FUNCTIONS =====
// ============================================

// === AUTO-REPLY EMAIL ===
async function sendAutoReply(toEmail, subject, message, requestId = null) {
    try {
        if (!process.env.AUTO_SMTP_USER || !process.env.AUTO_SMTP_PASS) {
            console.log('📧 [DEV MODE - AUTO] Email would be sent to:', toEmail);
            console.log(`   Subject: ${subject}`);
            return true;
        }

        await autoTransporter.verify();
        console.log('✅ AUTO SMTP connection verified');

        const mailOptions = {
            from: `"Zero Big" <${process.env.AUTO_SMTP_USER}>`,
            to: toEmail,
            subject: subject,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0a0e1a; border-radius: 12px; border: 1px solid #1e293b;">
                    <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #1e293b;">
                        <img src="https://i.postimg.cc/jjcsxvkS/Logo.png" alt="Zero Big" style="height: 60px; width: auto;" />
                        <h1 style="color: #2563eb; margin: 10px 0 5px; font-size: 28px; font-weight: 800;">Zero Big</h1>
                        <p style="color: #94a3b8; margin: 0; font-size: 14px;">شركة تطوير برمجيات</p>
                    </div>
                    <div style="padding: 10px 0; color: #e8edf5;">
                        ${message}
                    </div>
                    ${requestId ? `
                    <div style="background: #111827; padding: 12px; border-radius: 8px; margin: 15px 0; text-align: center; border: 1px solid #1e293b;">
                        <p style="margin: 0; color: #94a3b8;">
                            <strong style="color: #2563eb;">رقم الطلب:</strong> #${requestId}
                        </p>
                    </div>
                    ` : ''}
                    <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #1e293b; text-align: center; font-size: 13px; color: #64748b;">
                        <p style="margin: 0;">Zero Big - نبني المستقبل الرقمي معاً</p>
                        <p style="margin: 5px 0 0;">
                            <a href="https://zero-big.vercel.app" style="color: #2563eb; text-decoration: none;">https://zero-big.vercel.app</a>
                        </p>
                        <p style="margin: 10px 0 0; font-size: 11px; color: #475569;">
                            هذا بريد آلي، يرجى عدم الرد على هذا البريد.
                        </p>
                    </div>
                </div>
            `
        };

        await autoTransporter.sendMail(mailOptions);
        console.log('✅ [AUTO] Email sent to:', toEmail);
        return true;
    } catch (error) {
        console.error('❌ [AUTO] Error:', error.message);
        return false;
    }
}

// === MANUAL EMAIL ===
async function sendManualEmail(toEmail, subject, message, requestId = null) {
    try {
        if (!process.env.MANUAL_SMTP_USER || !process.env.MANUAL_SMTP_PASS) {
            console.log('📧 [DEV MODE - MANUAL] Email would be sent to:', toEmail);
            console.log(`   Subject: ${subject}`);
            return true;
        }

        await manualTransporter.verify();
        console.log('✅ MANUAL SMTP connection verified');

        const mailOptions = {
            from: `"Zero Big Support" <${process.env.MANUAL_SMTP_USER}>`,
            to: toEmail,
            subject: subject,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0a0e1a; border-radius: 12px; border: 1px solid #1e293b;">
                    <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #1e293b;">
                        <img src="https://i.postimg.cc/jjcsxvkS/Logo.png" alt="Zero Big" style="height: 60px; width: auto;" />
                        <h1 style="color: #2563eb; margin: 10px 0 5px; font-size: 28px; font-weight: 800;">Zero Big</h1>
                        <p style="color: #94a3b8; margin: 0; font-size: 14px;">فريق الدعم الفني</p>
                    </div>
                    <div style="padding: 10px 0; color: #e8edf5;">
                        ${message}
                    </div>
                    ${requestId ? `
                    <div style="background: #111827; padding: 12px; border-radius: 8px; margin: 15px 0; text-align: center; border: 1px solid #1e293b;">
                        <p style="margin: 0; color: #94a3b8;">
                            <strong style="color: #2563eb;">رقم الطلب:</strong> #${requestId}
                        </p>
                    </div>
                    ` : ''}
                    <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #1e293b; text-align: center; font-size: 13px; color: #64748b;">
                        <p style="margin: 0;">Zero Big - فريق الدعم الفني</p>
                        <p style="margin: 5px 0 0;">
                            <a href="https://zero-big.vercel.app" style="color: #2563eb; text-decoration: none;">https://zero-big.vercel.app</a>
                        </p>
                        <p style="margin: 10px 0 0; font-size: 11px; color: #475569;">
                            هذا بريد آلي، يرجى عدم الرد على هذا البريد.
                        </p>
                    </div>
                </div>
            `
        };

        await manualTransporter.sendMail(mailOptions);
        console.log('✅ [MANUAL] Email sent to:', toEmail);
        return true;
    } catch (error) {
        console.error('❌ [MANUAL] Error:', error.message);
        return false;
    }
}

// ============================================
// ===== ADMIN CREDENTIALS =====
// ============================================
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// ============================================
// ===== API ROUTES =====
// ============================================

/**
 * POST /api/auth/login - Admin login
 */
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم وكلمة المرور مطلوبان'
            });
        }

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const token = jwt.sign(
                { username, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                message: 'تم تسجيل الدخول بنجاح',
                token: token,
                user: { username }
            });
        }

        return res.status(401).json({
            success: false,
            message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

/**
 * POST /api/auth/verify - Verify JWT token
 */
app.post('/api/auth/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.json({
            success: true,
            user: decoded
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// ============================================
// ===== REQUESTS ROUTES =====
// ============================================

/**
 * GET /api/requests - Fetch all project requests from Firestore
 */
app.get('/api/requests', authenticateToken, async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Firestore not initialized'
            });
        }

        const snapshot = await db.collection('requests')
            .orderBy('createdAt', 'desc')
            .get();

        const requests = [];
        snapshot.forEach(doc => {
            requests.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching requests from Firestore:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب البيانات'
        });
    }
});

/**
 * POST /api/submit-project - Submit a new project request to Firestore
 */
app.post('/api/submit-project', async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            projectIdea,
            projectType,
            features,
            heardAbout
        } = req.body;

        // Validation
        const errors = [];
        if (!fullName || !fullName.trim()) errors.push('الاسم الكامل مطلوب');
        if (!email || !email.trim()) errors.push('البريد الإلكتروني مطلوب');
        if (!phone || !phone.trim()) errors.push('رقم الهاتف مطلوب');
        if (!projectIdea || !projectIdea.trim()) errors.push('فكرة المشروع مطلوبة');
        if (!projectType) errors.push('نوع المشروع مطلوب');

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'يرجى تصحيح الأخطاء التالية:',
                errors: errors
            });
        }

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Firestore not initialized'
            });
        }

        // Create new request
        const newRequest = {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            projectIdea: projectIdea.trim(),
            projectType: projectType,
            features: features ? features.trim() : '',
            heardAbout: heardAbout || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to Firestore
        const docRef = await db.collection('requests').add(newRequest);
        const requestId = docRef.id;

        console.log('📝 New project request saved to Firestore:', newRequest.fullName);
        console.log('   📧 Email:', newRequest.email);
        console.log('   📱 Phone:', newRequest.phone);
        console.log('   🏷️ Type:', newRequest.projectType);
        console.log('   🆔 Document ID:', requestId);

        // Send AUTO-REPLY email
        const emailMessage = `
            <div style="font-size: 16px; line-height: 1.8;">
                <p>مرحباً <strong>${fullName}</strong>،</p>
                <p>نشكركم على ثقتكم بنا في <strong style="color: #2563eb;">Zero Big</strong>.</p>
                <p>تم استقبال طلبكم الخاص بـ <strong>${projectType}</strong> بنجاح.</p>
                <p><strong>رقم الطلب:</strong> #${requestId}</p>
                <div style="background: #111827; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; border: 1px solid #1e293b;">
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2563eb;">
                        ✅ برجاء انتظار الرد من فريقنا
                    </p>
                </div>
                <p style="color: #94a3b8; font-size: 14px;">سنتواصل معكم خلال 24 ساعة.</p>
            </div>
        `;

        sendAutoReply(email, '✅ تم استقبال طلبكم - Zero Big', emailMessage, requestId);

        res.status(201).json({
            success: true,
            message: 'تم استقبال طلبكم بنجاح',
            data: {
                id: requestId,
                ...newRequest
            }
        });

    } catch (error) {
        console.error('Error submitting project:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم، حاول مرة أخرى'
        });
    }
});

/**
 * PATCH /api/requests/:id/complete - Mark request as completed in Firestore
 */
app.patch('/api/requests/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Firestore not initialized'
            });
        }

        const docRef = db.collection('requests').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        const request = doc.data();
        if (request.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'الطلب مكتمل بالفعل'
            });
        }

        // Update in Firestore
        await docRef.update({
            status: 'completed',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        console.log(`✅ Request ${id} completed for:`, request.fullName);

        res.json({
            success: true,
            message: 'تم تحديث حالة الطلب',
            data: {
                id: id,
                ...request,
                status: 'completed'
            }
        });

    } catch (error) {
        console.error('Error completing request:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

/**
 * DELETE /api/requests/:id - Delete a request from Firestore
 */
app.delete('/api/requests/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Firestore not initialized'
            });
        }

        const docRef = db.collection('requests').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        const request = doc.data();
        await docRef.delete();

        console.log(`🗑️ Request ${id} deleted for:`, request.fullName);

        res.json({
            success: true,
            message: 'تم حذف الطلب بنجاح'
        });

    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

/**
 * GET /api/stats - Get dashboard statistics from Firestore
 */
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Firestore not initialized'
            });
        }

        const snapshot = await db.collection('requests').get();
        const requests = [];
        snapshot.forEach(doc => {
            requests.push(doc.data());
        });

        const total = requests.length;
        const pending = requests.filter(r => r.status === 'pending').length;
        const completed = requests.filter(r => r.status === 'completed').length;

        res.json({
            success: true,
            data: {
                total,
                pending,
                completed
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// ============================================
// ===== MESSAGES ROUTES =====
// ============================================

/**
 * GET /api/messages - Fetch all messages from Firestore
 */
app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Firestore not initialized'
            });
        }

        const snapshot = await db.collection('messages')
            .orderBy('sentAt', 'desc')
            .get();

        const messages = [];
        snapshot.forEach(doc => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages from Firestore:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب الرسائل'
        });
    }
});

/**
 * POST /api/send-manual-email - Send manual email and save to Firestore
 */
app.post('/api/send-manual-email', authenticateToken, async (req, res) => {
    try {
        const { to, subject, message, requestId } = req.body;

        if (!to || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة (to, subject, message)'
            });
        }

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Firestore not initialized'
            });
        }

        // Get sender info
        let recipientName = to;
        let requestData = null;

        // If requestId is provided, get the request data
        if (requestId) {
            const docRef = db.collection('requests').doc(requestId);
            const doc = await docRef.get();
            if (doc.exists) {
                requestData = doc.data();
                recipientName = requestData.fullName || to;
            }
        }

        // Send manual email
        const emailMessage = `
            <div style="font-size: 16px; line-height: 1.8;">
                <p>مرحباً <strong>${recipientName}</strong>،</p>
                ${message.replace(/\n/g, '<br />')}
                ${requestId ? `
                <div style="background: #111827; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; border: 1px solid #1e293b;">
                    <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                        <strong style="color: #2563eb;">رقم الطلب:</strong> #${requestId}
                    </p>
                </div>
                ` : ''}
                <p style="color: #94a3b8; font-size: 14px;">شكراً لثقتكم بنا.</p>
            </div>
        `;

        const success = await sendManualEmail(
            to,
            subject || `📩 رسالة من فريق Zero Big`,
            emailMessage,
            requestId
        );

        if (success) {
            // Save message to Firestore
            const messageData = {
                recipientEmail: to,
                recipientName: recipientName,
                subject: subject,
                message: message,
                requestId: requestId || null,
                status: 'unread',
                sentAt: new Date().toISOString(),
                sentBy: req.user.username
            };

            await db.collection('messages').add(messageData);

            console.log(`📨 Manual email saved to Firestore for:`, to);

            res.json({
                success: true,
                message: 'تم إرسال الرسالة بنجاح'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'فشل إرسال البريد الإلكتروني، تحقق من إعدادات SMTP'
            });
        }

    } catch (error) {
        console.error('Error sending manual email:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

/**
 * PATCH /api/messages/:id/read - Mark message as read
 */
app.patch('/api/messages/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Firestore not initialized'
            });
        }

        const docRef = db.collection('messages').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'الرسالة غير موجودة'
            });
        }

        await docRef.update({
            status: 'read',
            readAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'تم تحديث حالة الرسالة'
        });

    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

/**
 * DELETE /api/messages/:id - Delete a message from Firestore
 */
app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Firestore not initialized'
            });
        }

        const docRef = db.collection('messages').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'الرسالة غير موجودة'
            });
        }

        await docRef.delete();

        console.log(`🗑️ Message ${id} deleted`);

        res.json({
            success: true,
            message: 'تم حذف الرسالة بنجاح'
        });

    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// ============================================
// ===== SERVE HTML PAGES =====
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('*', (req, res) => {
    if (req.path.includes('.')) {
        return res.status(404).send('File not found');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// ===== START SERVER =====
// ============================================

app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════════════════╗
    ║                                                                      ║
    ║   🚀 Zero Big Server Running!                                       ║
    ║   📡 URL: http://localhost:${PORT}                                   ║
    ║   🔐 Login: http://localhost:${PORT}/login                           ║
    ║   📋 Dashboard: http://localhost:${PORT}/dashboard                   ║
    ║                                                                      ║
    ║   👤 Admin: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}                     ║
    ║                                                                      ║
    ║   📧 AUTO SMTP: ${process.env.AUTO_SMTP_USER ? '✅ Configured' : '❌ Not configured'}
    ║   📧 MANUAL SMTP: ${process.env.MANUAL_SMTP_USER ? '✅ Configured' : '❌ Not configured'}
    ║   🔥 Firestore: ${db ? '✅ Connected' : '❌ Not connected'}
    ║                                                                      ║
    ╚══════════════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
