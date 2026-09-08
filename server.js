require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// ===== FIREBASE INITIALIZATION =====
let firebaseAdmin = null;
let firebaseConfig = null;

try {
    if (process.env.FIREBASE_CONFIG) {
        firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
        console.log('✅ Firebase config loaded successfully');
        
        // Uncomment below if you want to use Firebase
        // const admin = require('firebase-admin');
        // firebaseAdmin = admin.initializeApp({
        //     credential: admin.credential.cert(firebaseConfig)
        // });
        // console.log('✅ Firebase initialized');
    }
} catch (error) {
    console.warn('⚠️ Firebase config not loaded:', error.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== IN-MEMORY STORAGE =====
let projectRequests = [];
let idCounter = 1;

// ===== JWT AUTHENTICATION =====
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

// ===== NODEMAILER CONFIGURATION (GMAIL) =====
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// ===== EMAIL SENDING FUNCTION =====
async function sendAutoReply(toEmail, subject, message, requestId = null) {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('📧 [DEV MODE] Email would be sent to:', toEmail);
            console.log(`   Subject: ${subject}`);
            console.log(`   Message: ${message}`);
            return true;
        }

        // Verify connection
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        const mailOptions = {
            from: `"Zero Big" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: subject,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
                        <img src="https://i.postimg.cc/jjcsxvkS/Logo.png" alt="Zero Big" style="height: 60px; width: auto;" />
                        <h1 style="color: #2563eb; margin: 10px 0 5px; font-size: 28px; font-weight: 800;">Zero Big</h1>
                        <p style="color: #6b7280; margin: 0; font-size: 14px;">شركة تطوير برمجيات</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 10px 0;">
                        ${message}
                    </div>
                    
                    ${requestId ? `
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin: 15px 0; text-align: center;">
                        <p style="margin: 0; color: #4a4a6a;">
                            <strong>رقم الطلب:</strong> #${requestId}
                        </p>
                    </div>
                    ` : ''}
                    
                    <!-- Footer -->
                    <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center; font-size: 13px; color: #9ca3af;">
                        <p style="margin: 0;">Zero Big - نبني المستقبل الرقمي معاً</p>
                        <p style="margin: 5px 0 0;">
                            <a href="https://zerobig.com" style="color: #2563eb; text-decoration: none;">www.zerobig.com</a>
                        </p>
                        <p style="margin: 10px 0 0; font-size: 11px; color: #d1d5db;">
                            هذا بريد آلي، يرجى عدم الرد على هذا البريد.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent to:', toEmail);
        console.log('   Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        if (error.code === 'EAUTH') {
            console.error('   🔑 Authentication failed. Check your SMTP credentials.');
        }
        return false;
    }
}

// ===== ADMIN CREDENTIALS =====
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// ============================================
// ===== API ROUTES =====
// ============================================

/**
 * POST /api/auth/login - Admin login
 * Returns JWT token on success
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

/**
 * GET /api/requests - Fetch all project requests
 * Protected - Requires JWT token
 */
app.get('/api/requests', authenticateToken, (req, res) => {
    try {
        // Sort by date (newest first)
        const sorted = [...projectRequests].reverse();
        res.json(sorted);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب البيانات'
        });
    }
});

/**
 * POST /api/submit-project - Submit a new project request
 * Public - No authentication required
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
            budget,
            timeline,
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

        // Create new request
        const newRequest = {
            id: String(idCounter++),
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            projectIdea: projectIdea.trim(),
            projectType: projectType,
            features: features ? features.trim() : '',
            budget: budget || '',
            timeline: timeline || '',
            heardAbout: heardAbout || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Store in memory
        projectRequests.push(newRequest);
        console.log('📝 New project request:', newRequest.fullName);
        console.log('   📧 Email:', newRequest.email);
        console.log('   📱 Phone:', newRequest.phone);
        console.log('   🏷️ Type:', newRequest.projectType);

        // === Send auto-reply email ===
        const emailMessage = `
            <div style="font-size: 16px; line-height: 1.8; color: #1a1a2e;">
                <p>مرحباً <strong>${fullName}</strong>،</p>
                <p>نشكركم على ثقتكم بنا في <strong style="color: #2563eb;">Zero Big</strong>.</p>
                <p>تم استقبال طلبكم الخاص بـ <strong>${projectType}</strong> بنجاح.</p>
                <p><strong>رقم الطلب:</strong> #${newRequest.id}</p>
                <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2563eb;">
                        ✅ برجاء انتظار الرد من فريقنا
                    </p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">سنتواصل معكم خلال 24 ساعة.</p>
            </div>
        `;

        sendAutoReply(email, '✅ تم استقبال طلبكم - Zero Big', emailMessage, newRequest.id);

        res.status(201).json({
            success: true,
            message: 'تم استقبال طلبكم بنجاح',
            data: newRequest
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
 * PATCH /api/requests/:id/complete - Mark request as completed
 * Protected - Requires JWT token
 */
app.patch('/api/requests/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const request = projectRequests.find(r => r.id === id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        if (request.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'الطلب مكتمل بالفعل'
            });
        }

        // Update status
        request.status = 'completed';
        request.completedAt = new Date().toISOString();

        console.log(`✅ Request ${id} completed for:`, request.fullName);

        // === Send completion email ===
        const emailMessage = `
            <div style="font-size: 16px; line-height: 1.8; color: #1a1a2e;">
                <p>مرحباً <strong>${request.fullName}</strong>،</p>
                <p>نشكركم على ثقتكم بنا في <strong style="color: #2563eb;">Zero Big</strong>.</p>
                <p>تم استقبال طلبكم الخاص بـ <strong>${request.projectType}</strong> بنجاح.</p>
                <p><strong>رقم الطلب:</strong> #${request.id}</p>
                <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2563eb;">
                        ✅ برجاء انتظار الرد من فريقنا
                    </p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">سنتواصل معكم خلال 24 ساعة.</p>
            </div>
        `;

        sendAutoReply(request.email, '✅ تم استقبال طلبكم - Zero Big', emailMessage, request.id);

        res.json({
            success: true,
            message: 'تم تحديث حالة الطلب وإرسال إشعار للعميل',
            data: request
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
 * DELETE /api/requests/:id - Delete a request
 * Protected - Requires JWT token
 */
app.delete('/api/requests/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const index = projectRequests.findIndex(r => r.id === id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        const deleted = projectRequests[index];
        projectRequests.splice(index, 1);
        console.log(`🗑️ Request ${id} deleted for:`, deleted.fullName);

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
 * GET /api/stats - Get dashboard statistics
 * Protected - Requires JWT token
 */
app.get('/api/stats', authenticateToken, (req, res) => {
    try {
        const total = projectRequests.length;
        const pending = projectRequests.filter(r => r.status === 'pending').length;
        const completed = projectRequests.filter(r => r.status === 'completed').length;

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

// Catch-all for static files
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
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║   🚀 Zero Big Server Running!                           ║
    ║   📡 URL: http://localhost:${PORT}                       ║
    ║   🔐 Login: http://localhost:${PORT}/login               ║
    ║   📋 Dashboard: http://localhost:${PORT}/dashboard       ║
    ║                                                          ║
    ║   👤 Admin: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}         ║
    ║                                                          ║
    ║   📧 SMTP: ${process.env.SMTP_USER ? '✅ Configured' : '❌ Not configured'}
    ║   🔑 JWT: ${process.env.JWT_SECRET ? '✅ Configured' : '⚠️ Using default'}
    ║   🔥 Firebase: ${firebaseConfig ? '✅ Loaded' : '❌ Not loaded'}
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
