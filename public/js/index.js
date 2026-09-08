// ===== DOM ELEMENTS =====
const langToggle = document.getElementById('langToggle');
const langLabel = document.getElementById('langLabel');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navList = document.getElementById('mainNav').querySelector('.nav-list');
const projectForm = document.getElementById('projectForm');
const successModal = document.getElementById('successModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');

// ===== i18n DATA =====
const translations = {
    ar: {
        'nav.home': 'الرئيسية',
        'nav.services': 'الخدمات',
        'nav.process': 'منهجيتنا',
        'nav.about': 'عن الشركة',
        'nav.contact': 'اتصل بنا',
        'hero.title': 'نبني المستقبل الرقمي معاً',
        'hero.subtitle': 'نحن شركة Zero Big، نقدم حلولاً برمجية مبتكرة ومتكاملة لعملائنا في جميع أنحاء العالم.',
        'hero.cta': 'اطلب مشروعك',
        'services.title': 'خدماتنا',
        'services.subtitle': 'نقدم حلولاً برمجية مبتكرة لتلبية احتياجات أعمالكم',
        'services.web.title': 'تطوير الويب',
        'services.web.desc': 'مواقع ويب متجاوبة ومتطورة باستخدام أحدث التقنيات',
        'services.mobile.title': 'تطوير التطبيقات',
        'services.mobile.desc': 'تطبيقات هواتف ذكية عالية الأداء لنظامي iOS و Android',
        'services.analytics.title': 'تحليل البيانات',
        'services.analytics.desc': 'تحليلات متقدمة للبيانات لدعم اتخاذ القرار',
        'process.title': 'منهجيتنا في العمل',
        'process.subtitle': 'نتبع أفضل الممارسات العالمية لضمان نجاح مشاريعكم',
        'process.step1.title': 'تحليل الاحتياجات',
        'process.step1.desc': 'فهم أهدافكم ومتطلباتكم بدقة',
        'process.step2.title': 'التخطيط والتصميم',
        'process.step2.desc': 'وضع خارطة طريق وتصميم النماذج',
        'process.step3.title': 'التطوير والبرمجة',
        'process.step3.desc': 'بناء الحل باستخدام أفضل الممارسات',
        'process.step4.title': 'الاختبار والمراجعة',
        'process.step4.desc': 'ضمان الجودة واختبار الأداء',
        'process.step5.title': 'الإطلاق والمتابعة',
        'process.step5.desc': 'نشر المشروع ودعم مستمر',
        'about.title': 'عن Zero Big',
        'about.subtitle': 'فريق من الخبراء المبدعين لتحويل أفكاركم إلى واقع',
        'about.desc1': 'شركة Zero Big هي شركة رائدة في مجال تطوير البرمجيات، تأسست بهدف تقديم حلول تقنية مبتكرة تساعد الشركات على النمو والازدهار في العصر الرقمي.',
        'about.desc2': 'نحن نؤمن بأن التكنولوجيا الجيدة يجب أن تكون في متناول الجميع، ولهذا نحرص على تقديم خدماتنا بجودة عالية وأسعار تنافسية.',
        'about.team.title': 'فريق العمل',
        'about.team.role1': 'تخصص باك اند',
        'about.team.role2': 'تخصص فرونت اند',
        'about.team.role3': 'تخصص مراجعة',
        'contact.title': 'اطلب مشروعك الآن',
        'contact.subtitle': 'املأ النموذج وسنقوم بالرد عليك في أقرب وقت',
        'form.fullName': 'الاسم الكامل',
        'form.email': 'البريد الإلكتروني',
        'form.phone': 'رقم التليفون',
        'form.projectIdea': 'فكرة الموقع',
        'form.projectType': 'نوع الموقع',
        'form.features': 'الميزات المطلوبة',
        'form.heardAbout': 'كيف سمعت عنا؟',
        'form.selectType': 'اختر نوع الموقع',
        'form.type.ecommerce': 'متجر إلكتروني',
        'form.type.corporate': 'موقع شركة',
        'form.type.portfolio': 'معرض أعمال',
        'form.type.blog': 'مدونة',
        'form.type.educational': 'منصة تعليمية',
        'form.type.other': 'أخرى',
        'form.selectOption': 'اختر',
        'form.heard.google': 'جوجل',
        'form.heard.social': 'وسائل التواصل',
        'form.heard.friend': 'صديق',
        'form.heard.ad': 'إعلان',
        'form.heard.other': 'أخرى',
        'form.submit': 'إرسال الطلب',
        'form.error.name': 'الاسم مطلوب',
        'form.error.email': 'بريد إلكتروني صحيح مطلوب',
        'form.error.phone': 'رقم هاتف صحيح مطلوب',
        'form.error.projectIdea': 'فكرة المشروع مطلوبة',
        'form.error.projectType': 'يرجى اختيار نوع الموقع',
        'modal.success.title': 'تم استقبال طلبكم',
        'modal.success.message': 'برجاء انتظار الرد من فريقنا',
        'modal.close': 'حسناً',
        'footer.quickLinks': 'روابط سريعة',
        'footer.social': 'تابعنا',
        'footer.desc': 'نبني المستقبل الرقمي معاً',
        'footer.rights': 'جميع الحقوق محفوظة'
    },
    en: {
        'nav.home': 'Home',
        'nav.services': 'Services',
        'nav.process': 'Our Process',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'hero.title': 'Building Your Digital Future',
        'hero.subtitle': 'We are Zero Big, providing innovative and integrated software solutions for our clients worldwide.',
        'hero.cta': 'Request Your Project',
        'services.title': 'Our Services',
        'services.subtitle': 'We provide innovative software solutions to meet your business needs',
        'services.web.title': 'Web Development',
        'services.web.desc': 'Responsive and advanced websites using the latest technologies',
        'services.mobile.title': 'App Development',
        'services.mobile.desc': 'High-performance mobile apps for iOS and Android',
        'services.analytics.title': 'Data Analytics',
        'services.analytics.desc': 'Advanced data analytics to support decision making',
        'process.title': 'Our Process',
        'process.subtitle': 'We follow global best practices to ensure your project success',
        'process.step1.title': 'Needs Analysis',
        'process.step1.desc': 'Understanding your goals and requirements precisely',
        'process.step2.title': 'Planning and Design',
        'process.step2.desc': 'Roadmap and prototype design',
        'process.step3.title': 'Development and Coding',
        'process.step3.desc': 'Building the solution using best practices',
        'process.step4.title': 'Testing and Review',
        'process.step4.desc': 'Quality assurance and performance testing',
        'process.step5.title': 'Launch and Support',
        'process.step5.desc': 'Deployment and ongoing support',
        'about.title': 'About Zero Big',
        'about.subtitle': 'A team of creative experts turning your ideas into reality',
        'about.desc1': 'Zero Big is a leading software development company, founded to provide innovative technology solutions that help businesses grow and thrive in the digital age.',
        'about.desc2': 'We believe that good technology should be accessible to everyone, which is why we deliver high-quality services at competitive prices.',
        'about.team.title': 'Team Members',
        'about.team.role1': 'Backend Specialist',
        'about.team.role2': 'Frontend Specialist',
        'about.team.role3': 'QA Specialist',
        'contact.title': 'Request Your Project Now',
        'contact.subtitle': 'Fill out the form and we will get back to you shortly',
        'form.fullName': 'Full Name',
        'form.email': 'Email Address',
        'form.phone': 'Phone Number',
        'form.projectIdea': 'Project Idea',
        'form.projectType': 'Project Type',
        'form.features': 'Required Features',
        'form.heardAbout': 'How did you hear about us?',
        'form.selectType': 'Select project type',
        'form.type.ecommerce': 'E-Commerce',
        'form.type.corporate': 'Corporate Website',
        'form.type.portfolio': 'Portfolio',
        'form.type.blog': 'Blog',
        'form.type.educational': 'Educational Platform',
        'form.type.other': 'Other',
        'form.selectOption': 'Select',
        'form.heard.google': 'Google',
        'form.heard.social': 'Social Media',
        'form.heard.friend': 'Friend',
        'form.heard.ad': 'Advertisement',
        'form.heard.other': 'Other',
        'form.submit': 'Submit Request',
        'form.error.name': 'Name is required',
        'form.error.email': 'Valid email is required',
        'form.error.phone': 'Valid phone number is required',
        'form.error.projectIdea': 'Project idea is required',
        'form.error.projectType': 'Please select project type',
        'modal.success.title': 'Request Received',
        'modal.success.message': 'Please wait for our team to respond',
        'modal.close': 'OK',
        'footer.quickLinks': 'Quick Links',
        'footer.social': 'Follow Us',
        'footer.desc': 'Building the digital future together',
        'footer.rights': 'All Rights Reserved'
    }
};

let currentLang = 'ar';

// ===== LANGUAGE TOGGLE =====
function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    langLabel.textContent = lang === 'ar' ? 'EN' : 'AR';

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    document.querySelectorAll('input[data-i18n-placeholder], textarea[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    document.querySelectorAll('select option[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
}

langToggle.addEventListener('click', () => {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
});

// ===== MOBILE MENU =====
mobileMenuBtn.addEventListener('click', () => {
    navList.classList.toggle('open');
});

navList.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navList.classList.remove('open');
    });
});

// ===== FORM HANDLING =====
function validateField(input) {
    const group = input.closest('.form-group');
    const errorEl = group?.querySelector('.form-error');

    if (!group || !errorEl) return true;

    group.classList.remove('error', 'success');

    if (input.hasAttribute('required') && !input.value.trim()) {
        group.classList.add('error');
        return false;
    }

    if (input.type === 'email' && input.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value.trim())) {
            group.classList.add('error');
            return false;
        }
    }

    if (input.id === 'phone' && input.value.trim()) {
        const phoneRegex = /^[\d\s\+\-\(\)]{8,20}$/;
        if (!phoneRegex.test(input.value.trim())) {
            group.classList.add('error');
            return false;
        }
    }

    if (input.value.trim()) {
        group.classList.add('success');
    }
    return true;
}

projectForm.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
        const group = input.closest('.form-group');
        if (group?.classList.contains('error')) {
            validateField(input);
        }
    });
});

projectForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    let isValid = true;
    this.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
        if (!validateField(input)) isValid = false;
    });

    if (!isValid) {
        const firstError = this.querySelector('.form-group.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.querySelector('input, select, textarea')?.focus();
        }
        return;
    }

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    const submitBtn = this.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = currentLang === 'ar' ? 'جاري الإرسال...' : 'Sending...';

    try {
        const response = await fetch('/api/submit-project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            successModal.classList.add('active');
            this.reset();
            this.querySelectorAll('.form-group').forEach(g => g.classList.remove('success', 'error'));
            setTimeout(() => {
                successModal.classList.remove('active');
            }, 5000);
        } else {
            alert(result.message || 'حدث خطأ، حاول مرة أخرى');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('حدث خطأ في الاتصال، حاول مرة أخرى');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// ===== MODAL CLOSE =====
modalCloseBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
});

successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('active');
    }
});

// ===== SCROLL EFFECTS =====
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
    } else {
        header.style.boxShadow = 'none';
    }
});

// ===== INIT =====
setLanguage('ar');
