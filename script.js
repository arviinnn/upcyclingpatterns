/* =====================================================================
   Upcycling Patterns — Main Script
   Erasmus+ KA210-SCH Project
   ---------------------------------------------------------------------
   Plain-language map:
   - Lines near the top collect all HTML elements that JavaScript controls.
   - The translations object stores every English/Turkish interface sentence.
   - The CMS helpers read JSON files from data/ and safely place that content
     into the page without using raw HTML from editors.
   - The form helpers validate messages, block simple spam, and fall back to
     mailto when the Web3Forms endpoint is unavailable.
   - The final init() function wires everything together in a predictable
     order so the site still works if one optional feature fails.
   ---------------------------------------------------------------------
   Feature checklist:
   - EN/TR language system (single source of truth here)
   - /tr/ and ?lang=tr ready language detection
   - Accessible tabs (ARIA + keyboard)
   - Mobile menu (focus management + Escape)
   - Scroll progress and back-to-top button
   - Reveal animations and counter animation
   - Email obfuscation (mailto built at runtime)
   - Contact form validation + sanitisation + honeypot + cooldown
   - Web3Forms support with graceful mailto fallback
   - Reduced-motion support
   - Dark/light theme toggle (synced with siteTheme localStorage)
   - Cookie consent banner
   - Lightbox for the gallery (with focus trap)
   - Admin/CMS-ready data-* hooks
   ===================================================================== */

(function () {
    "use strict";

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }

    function boot() {
        const body = document.body;
        const html = document.documentElement;

        const pageLoader = document.getElementById("pageLoader");
        const header = document.querySelector(".site-header");
        const navMenu = document.getElementById("navMenu");
        const menuToggle = document.getElementById("menuToggle");
        const navLinks = document.querySelectorAll(
            ".nav-menu-desktop .nav-link, .nav-menu-dropdown .nav-link"
        );
        const sections = document.querySelectorAll("section[id]");
        const langButtons = document.querySelectorAll(".lang-btn");

        const contactForm = document.getElementById("contactForm");
        const formStatus = document.getElementById("formStatus");
        const submitBtn = document.getElementById("submitBtn");

        const pageTitle = document.getElementById("pageTitle");
        const metaDescription = document.getElementById("metaDescription");

        const scrollProgress = document.getElementById("scrollProgress");
        const scrollProgressBar = document.querySelector(".scroll-progress-bar");
        const cursorGlow = document.getElementById("cursorGlow");
        const backToTop = document.getElementById("backToTop");

        const nameInput = document.getElementById("fullName");
        const emailInput = document.getElementById("email");
        const subjectInput = document.getElementById("subject");
        const messageInput = document.getElementById("message");
        const honeypotInput = document.getElementById("websiteField");

        const prefersReducedMotion =
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const isTouchDevice =
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;

        const SAFE_LANGUAGE_KEY = "siteLanguage";
        const SAFE_THEME_KEY = "siteTheme";
        const COOKIE_CONSENT_KEY = "cookieConsentDismissed";

        const DEFAULT_LANGUAGE = "en";
        const SUPPORTED_LANGS = ["en", "tr"];

        const MAX_NAME_LENGTH = 80;
        const MAX_EMAIL_LENGTH = 120;
        const MAX_SUBJECT_LENGTH = 150;
        const MAX_MESSAGE_LENGTH = 2000;

        const SUBMIT_COOLDOWN_MS = 8000;
        const MIN_TIME_ON_PAGE_MS = 1500;

        // Web3Forms public access key for the live contact form.
        // This is safe to keep in client-side code because Web3Forms uses it as a public form ID.
        const WEB3FORMS_ACCESS_KEY = "d1ccc863-13a2-4ab6-ad6d-cd276763dcc5";

        const pageLoadTime = Date.now();
        let lastSubmitTime = 0;
        let currentLanguage = getCurrentLanguage();

        const translations = {
            en: {
                pageTitle: "Upcycling Patterns | Erasmus+ KA210-SCH",
                metaDescription:
                    "Upcycling Patterns is an Erasmus+ KA210-SCH project focused on sustainability, environmental awareness, climate responsibility, and upcycling through international school collaboration.",
                skipToContent: "Skip to content",
                loaderText: "Loading Upcycling Patterns",
                navHome: "Home",
                navAbout: "About",
                navExplore: "Explore",
                navPartners: "Partners",
                navMedia: "Media",
                navFaq: "FAQ",
                navContact: "Contact",
                heroEyebrow: "Erasmus+ KA210-SCH Project",
                heroTitleMain: "Upcycling",
                heroTitleAccent: "Patterns",
                heroDescription:
                    "An international school partnership focused on sustainability, environmental awareness, climate responsibility, and upcycling through creativity, collaboration, and active student participation.",
                heroBtnPrimary: "Explore",
                heroBtnSecondary: "Partners",
                heroProofOne: "Renew",
                heroProofTwo: "Reuse",
                heroProofThree: "Reimagine",
                pulseLabel: "Project Progress",
                pulseComplete: "complete",
                pulseStatusPlanned: "Preparing to start",
                pulseStatusActive: "In progress",
                pulseStatusComplete: "Legacy phase",
                routeLabel: "Partner Route",
                routeCountryTr: "Türkiye",
                routeCountryMk: "North Macedonia",
                routeCountryLt: "Lithuania",
                routeCountryPl: "Poland",
                statCountries: "Countries",
                statMonths: "Months",
                statProjectEnd: "Project End",
                chip1: "Climate Awareness",
                chip3: "Creative Upcycling",
                aboutTag: "About the Project",
                aboutTitle: "Learning Sustainability Through International Collaboration",
                aboutText:
                    "Upcycling Patterns, also referred to as UpCyc, is an Erasmus+ KA210-SCH project built around the themes of environment, climate change, sustainability, and upcycling. The project aims to help students become environmentally responsible individuals through education, research, and practical activities.",
                aboutCard1Title: "Environmental Awareness",
                aboutCard1Text:
                    "The project promotes ecological responsibility and encourages students to understand the importance of protecting natural resources.",
                aboutCard2Title: "Creative Upcycling",
                aboutCard2Text:
                    "Students are encouraged to reuse materials in creative and meaningful ways, transforming waste into useful and innovative products.",
                aboutCard3Title: "International Partnership",
                aboutCard3Text:
                    "Schools from different countries collaborate to share ideas, educational practices, and sustainable project experiences.",
                mission1Title: "Mission",
                mission1Text:
                    "To raise environmentally conscious students through meaningful international cooperation.",
                mission2Title: "Vision",
                mission2Text:
                    "To build a lasting educational culture centered on sustainability, creativity, and shared responsibility.",
                mission3Title: "Approach",
                mission3Text:
                    "Learning by doing through workshops, research, mobility, teamwork, and digital dissemination.",
                snapshotTag: "Impact Snapshot",
                snapshotTitle: "Project Snapshot",
                snapshotCard1Kicker: "Scale",
                snapshotCard1Text:
                    "partner countries linked through shared sustainability work.",
                snapshotCard2Kicker: "Duration",
                snapshotCard2Text:
                    "months of workshops, mobility, production, and dissemination.",
                snapshotCard3Kicker: "Focus",
                snapshotCard3Text:
                    "renew, reuse, and reimagine materials as learning experiences.",
                snapshotCard4Kicker: "Legacy",
                snapshotCard4Text:
                    "resources and habits designed to continue beyond the project.",
                journeyTag: "Learning Journey",
                journeyTitle: "From waste material to shared European know-how",
                journeyText:
                    "The project experience is designed as a clear cycle: observe local needs, create with reused materials, exchange ideas internationally, then publish resources for others to use.",
                journeyStep1Title: "Observe",
                journeyStep1Text:
                    "Students research waste, climate responsibility, and local sustainability habits.",
                journeyStep2Title: "Make",
                journeyStep2Text:
                    "Workshops turn discarded materials into practical, creative learning outputs.",
                journeyStep3Title: "Exchange",
                journeyStep3Text:
                    "Partner schools compare practices through mobility, teamwork, and peer learning.",
                journeyStep4Title: "Share",
                journeyStep4Text:
                    "Guides, media, reports, and classroom resources spread the project results.",
                exploreTag: "Project Insights",
                exploreTitle: "Everything in One Place",
                exploreText:
                    "Browse goals, timeline, activities, results, and core project details in a clean, tabbed interface — without endless scrolling.",
                tabGoals: "Goals",
                tabTimeline: "Timeline",
                tabActivities: "Activities",
                tabResults: "Results",
                tabDetails: "Details",
                goal1Title: "Increase Environmental Awareness",
                goal1Text:
                    "Helping students better understand climate issues, sustainability, and responsible resource use.",
                goal2Title: "Promote Sustainable Development Goals",
                goal2Text:
                    "Integrating sustainability concepts into school-based learning and project practice.",
                goal3Title: "Encourage Active Participation",
                goal3Text:
                    "Enabling students to take part in research, production, workshops, and collaborative project tasks.",
                goal4Title: "Strengthen International Cooperation",
                goal4Text:
                    "Building educational bridges among partner institutions through shared activities and intercultural exchange.",
                goal5Title: "Develop Creativity",
                goal5Text:
                    "Supporting innovative thinking, artistic production, and practical problem-solving through upcycling activities.",
                goal6Title: "Create Long-Term Impact",
                goal6Text:
                    "Establishing sustainable habits and educational resources that can continue beyond the project period.",
                timeline1Title: "Project Launch",
                timeline1Text:
                    "Kick-off meetings, planning, coordination, and role distribution among partners.",
                timeline2Title: "Research & Preparation",
                timeline2Text:
                    "Students and teachers investigate sustainability topics, waste materials, and local practices.",
                timeline3Title: "Workshops & Production",
                timeline3Text:
                    "Hands-on activities, design tasks, upcycling products, and collaborative classroom practices.",
                timeline4Title: "Mobility & Exchange",
                timeline4Text:
                    "Partner visits, intercultural learning, peer interaction, and shared implementation experiences.",
                timeline5Title: "Dissemination",
                timeline5Text:
                    "Sharing project outputs through digital media, school presentations, and public communication.",
                timeline6Title: "Evaluation & Legacy",
                timeline6Text:
                    "Impact review, documentation, reflection, and long-term use of project materials.",
                activity1Title: "Student Workshops",
                activity1Text:
                    "Creative workshops focused on reuse, redesign, and transformation of materials.",
                activity2Title: "Teacher Collaboration",
                activity2Text:
                    "Joint planning, pedagogical exchange, and shared classroom implementation.",
                activity3Title: "Mobility Meetings",
                activity3Text:
                    "International visits and project meetings among partner schools.",
                activity4Title: "Digital Dissemination",
                activity4Text:
                    "Online sharing of project outcomes, videos, visual materials, and reports.",
                result1Title: "Environmentally Aware Students",
                result1Text:
                    "Students will develop stronger awareness of ecological issues and sustainable living practices.",
                result2Title: "Upcycling Products",
                result2Text:
                    "Creative student outputs and project-based products developed through upcycling activities.",
                result3Title: "Educational Materials",
                result3Text:
                    "Learning resources, digital materials, guides, reports, and project documentation.",
                result4Title: "Digital Content",
                result4Text:
                    "Videos, presentations, visual materials, and online project resources.",
                result5Title: "International Experience",
                result5Text:
                    "Students and teachers gain practical experience in European cooperation and intercultural learning.",
                result6Title: "Long-Term Educational Value",
                result6Text:
                    "Project materials and sustainable practices can continue to be used after the official project period ends.",
                projectCard1Title: "Project Type",
                projectCard1Text:
                    "Erasmus+ KA210-SCH\nSchool Education Small-scale Partnership",
                projectCard2Title: "Project Duration",
                projectCard2Text:
                    "From 01/09/2025 to 31/08/2027\nTotal duration: 24 months",
                projectCard3Title: "Methodology",
                projectCard3Text:
                    "Workshops, research, applied learning, collaboration, mobility, and digital production",
                projectCard4Title: "Focus Areas",
                projectCard4Text:
                    "Sustainability, climate awareness, creativity, reuse culture, intercultural partnership, and student-centred production.",
                partnersTag: "Partner Institutions",
                partnersTitle: "Schools Working Together",
                partnersText:
                    "Upcycling Patterns brings together schools from four countries to collaborate on sustainability, student engagement, and innovative learning.",
                badgeCoord: "Coordinator",
                badgePartner: "Partner",
                partner1Country: "Türkiye",
                labelCoordinator: "Coordinator:",
                partner1School: "MEV Koleji Özel Basınköy Anadolu Lisesi",
                labelCity: "City:",
                partner1City: "Istanbul",
                labelRole: "Role:",
                partner1Role: "Coordinating institution",
                partner2Country: "North Macedonia",
                labelSchool: "School:",
                partner2School: 'OEMUC "SV. NAUM OHRIDSKI"',
                partner2City: "Ohrid",
                partner2Role: "Project partner",
                partner3Country: "Lithuania",
                partner3School: "Vilniaus automechanikos ir verslo mokykla",
                partner3City: "Vilnius",
                partner3Role: "Project partner",
                partner4Country: "Poland",
                partner4School:
                    "Zespół Szkół Samochodowych im. Tadeusza Tańskiego",
                partner4City: "Włocławek",
                partner4Role: "Project partner",
                mediaTag: "Media Hub",
                mediaTitle: "Gallery, News & Resources",
                mediaText:
                    "Explore project visuals, latest updates, and downloadable materials — all in one place.",
                tabGallery: "Gallery",
                tabNews: "News",
                tabOutputs: "Outputs",
                galleryCaption1: "Workshop Activities",
                galleryCaption2: "Team Collaboration",
                galleryCaption3: "Partner Meetings",
                galleryCaption4: "",
                galleryCaption5: "",
                galleryCaption6: "",
                news1Title: "Kick-off Meeting Completed",
                news1Text:
                    "Partner schools met to finalize the work plan, responsibilities, and dissemination goals.",
                news2Title: "Student Workshop Series Started",
                news2Text:
                    "Students began hands-on activities focused on transforming waste materials into creative products.",
                news3Title: "Dissemination Materials Published",
                news3Text:
                    "Digital content and visual project outputs were shared with the wider school community.",
                readMore: "Read More",
                comingSoon: "Coming Soon",
                output1Title: "Project Brochure",
                output1Text:
                    "A short introduction to the aims, partners, and activities of the project.",
                output2Title: "Workshop Guide",
                output2Text:
                    "A practical guide containing activity samples and implementation steps.",
                output3Title: "Dissemination Report",
                output3Text:
                    "A summary of project communication, outreach, and visibility activities.",
                downloadBtn: "Download",
                downloadUnavailable: "Coming Soon",
                visitWebsite: "Website",
                sendEmail: "Email",
                faqTag: "FAQ",
                faqTitle: "Frequently Asked Questions",
                faqText:
                    "Key information for students, teachers, parents, and visitors interested in the project.",
                faq1Question: "What is Upcycling Patterns?",
                faq1Answer:
                    "It is an Erasmus+ KA210-SCH school partnership project focused on sustainability, climate awareness, and creative reuse.",
                faq2Question: "Who are the project partners?",
                faq2Answer:
                    "The project includes partner schools from Türkiye, North Macedonia, Lithuania, and Poland.",
                faq3Question: "What kinds of activities are included?",
                faq3Answer:
                    "Workshops, research, mobility meetings, student production, digital dissemination, and collaborative learning activities.",
                faq4Question: "How long does the project last?",
                faq4Answer:
                    "The project duration is 24 months, from 01 September 2025 to 31 August 2027.",
                contactTag: "Contact",
                contactTitle: "Get in Touch",
                contactText:
                    "For further information about the project, partnership activities, or institutional cooperation, please use the contact details below.",
                contactCard1Title: "Coordinating Institution",
                contactCard1Text: "MEV Koleji Özel Basınköy Anadolu Lisesi",
                contactCard2Title: "Location",
                contactCard2Text: "Istanbul, Türkiye",
                contactCard4Title: "Email",
                socialTitle: "Follow Us",
                socialText: "Visit our official project social media pages.",
                contactFormTitle: "Send a Message",
                formNameLabel: "Full Name",
                formEmailLabel: "Email Address",
                formSubjectLabel: "Subject",
                formMessageLabel: "Message",
                formSubmitBtn: "Send Message",
                formNote: "This form is connected to the project email address.",
                formNamePlaceholder: "Your full name",
                formEmailPlaceholder: "your@email.com",
                formSubjectPlaceholder: "Project inquiry",
                formMessagePlaceholder: "Write your message here...",
                disclaimerText:
                    "Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or the Turkish National Agency. Neither the European Union nor the granting authority can be held responsible for them.",
                footerProject: "Erasmus+ KA210-SCH Project",
                footerCoordinatorLabel: "Coordinator:",
                footerCoordinatorValue: "MEV Koleji Özel Basınköy Anadolu Lisesi",
                footerCountriesLabel: "Countries:",
                footerCountriesValue:
                    "Türkiye, North Macedonia, Lithuania, Poland",
                footerCopy:
                    "© 2025–2027 Upcycling Patterns. All rights reserved.",
                formSending: "Sending your message...",
                formSuccess: "Thank you! Your message has been sent successfully.",
                formError: "Please complete all fields correctly.",
                formEmailError: "Please enter a valid email address.",
                formTooShortError:
                    "Please write a slightly more detailed message.",
                formCooldownError:
                    "Please wait a few seconds before submitting again.",
                formNetworkError:
                    "Could not send message. Opening your email app as a fallback...",
                formMissingKey:
                    "The contact form is not fully connected yet. Opening your email app instead...",
                formDisabledMessage: "This content will be added soon.",
                formConsent:
                    "I agree that the information I provide will be used to respond to my message.",
                formConsentRequired:
                    "Please confirm consent before sending your message.",
                themeToggleLabel: "Toggle dark mode",
                themeToLight: "Switch to light mode",
                themeToDark: "Switch to dark mode",
                cookieBannerTitle: "We respect your privacy",
                cookieBannerText:
                    "We use only essential local storage to remember your language and theme preferences. No tracking, no analytics.",
                cookieBannerAccept: "Got it",
                cookieBannerMore: "Learn more",
                lightboxClose: "Close image viewer",
                lightboxPrev: "Previous image",
                lightboxNext: "Next image",
                legalTitle: "Legal",
                footerOfficialTitle: "Official Project & Funding",
                footerPartnersTitle: "Partner Schools",
                privacyPolicyLink: "Privacy Policy",
                cookiePolicyLink: "Cookie Policy",
                termsLink: "Terms of Use",
                accessibilityLink: "Accessibility",
                fundingDisclaimerLink: "Funding Disclaimer",
                adminLink: "Admin"
            },
            tr: {
                pageTitle: "Upcycling Patterns | Erasmus+ KA210-SCH",
                metaDescription:
                    "Upcycling Patterns, sürdürülebilirlik, çevre bilinci, iklim sorumluluğu ve ileri dönüşüm temalarına odaklanan Erasmus+ KA210-SCH projesidir.",
                skipToContent: "İçeriğe geç",
                loaderText: "Upcycling Patterns yükleniyor",
                navHome: "Ana Sayfa",
                navAbout: "Hakkında",
                navExplore: "Keşfet",
                navPartners: "Ortaklar",
                navMedia: "Medya",
                navFaq: "SSS",
                navContact: "İletişim",
                heroEyebrow: "Erasmus+ KA210-SCH Projesi",
                heroTitleMain: "Upcycling",
                heroTitleAccent: "Patterns",
                heroDescription:
                    "Sürdürülebilirlik, çevre bilinci, iklim sorumluluğu ve ileri dönüşüme odaklanan; yaratıcılık, iş birliği ve aktif öğrenci katılımını temel alan uluslararası okul ortaklığı.",
                heroBtnPrimary: "Keşfet",
                heroBtnSecondary: "Ortaklar",
                heroProofOne: "Yenile",
                heroProofTwo: "Yeniden Kullan",
                heroProofThree: "Yeniden Hayal Et",
                pulseLabel: "Proje İlerlemesi",
                pulseComplete: "tamamlandı",
                pulseStatusPlanned: "Başlangıç hazırlığı",
                pulseStatusActive: "Devam ediyor",
                pulseStatusComplete: "Kalıcılık dönemi",
                routeLabel: "Ortak Rotası",
                routeCountryTr: "Türkiye",
                routeCountryMk: "Kuzey Makedonya",
                routeCountryLt: "Litvanya",
                routeCountryPl: "Polonya",
                statCountries: "Ülke",
                statMonths: "Ay",
                statProjectEnd: "Proje Bitişi",
                chip1: "İklim Farkındalığı",
                chip3: "Yaratıcı İleri Dönüşüm",
                aboutTag: "Proje Hakkında",
                aboutTitle:
                    "Uluslararası İş Birliğiyle Sürdürülebilirliği Öğrenmek",
                aboutText:
                    "Upcycling Patterns, diğer adıyla UpCyc, çevre, iklim değişikliği, sürdürülebilirlik ve ileri dönüşüm temaları etrafında şekillenen bir Erasmus+ KA210-SCH projesidir. Proje; öğrencilerin eğitim, araştırma ve uygulamalı etkinlikler yoluyla çevreye duyarlı bireyler olmalarını amaçlamaktadır.",
                aboutCard1Title: "Çevre Bilinci",
                aboutCard1Text:
                    "Proje, ekolojik sorumluluğu destekler ve öğrencileri doğal kaynakları korumanın önemi konusunda bilinçlendirir.",
                aboutCard2Title: "Yaratıcı İleri Dönüşüm",
                aboutCard2Text:
                    "Öğrenciler, atık malzemeleri faydalı ve yenilikçi ürünlere dönüştürerek yaratıcı biçimde yeniden kullanmaya teşvik edilir.",
                aboutCard3Title: "Uluslararası Ortaklık",
                aboutCard3Text:
                    "Farklı ülkelerden okullar; fikir, eğitim uygulamaları ve sürdürülebilir proje deneyimlerini paylaşmak için birlikte çalışır.",
                mission1Title: "Misyon",
                mission1Text:
                    "Anlamlı uluslararası iş birlikleriyle çevreye duyarlı öğrenciler yetiştirmek.",
                mission2Title: "Vizyon",
                mission2Text:
                    "Sürdürülebilirlik, yaratıcılık ve ortak sorumluluk etrafında kalıcı bir eğitim kültürü oluşturmak.",
                mission3Title: "Yaklaşım",
                mission3Text:
                    "Atölye çalışmaları, araştırma, hareketlilik, ekip çalışması ve dijital yaygınlaştırma ile yaparak öğrenme.",
                snapshotTag: "Etki Özeti",
                snapshotTitle: "Proje Özeti",
                snapshotCard1Kicker: "Ölçek",
                snapshotCard1Text:
                    "ortak ülke sürdürülebilirlik çalışmalarıyla birbirine bağlanıyor.",
                snapshotCard2Kicker: "Süre",
                snapshotCard2Text:
                    "ay boyunca atölye, hareketlilik, üretim ve yaygınlaştırma yürütülüyor.",
                snapshotCard3Kicker: "Odak",
                snapshotCard3Text:
                    "malzemeleri yenileme, yeniden kullanma ve öğrenme deneyimine dönüştürme yaklaşımı.",
                snapshotCard4Kicker: "Kalıcılık",
                snapshotCard4Text:
                    "proje sonrasında da devam edecek kaynaklar ve alışkanlıklar.",
                journeyTag: "Öğrenme Yolculuğu",
                journeyTitle: "Atık malzemeden ortak Avrupa deneyimine",
                journeyText:
                    "Proje deneyimi net bir döngü olarak tasarlandı: yerel ihtiyaçları gözlemle, yeniden kullanılan malzemelerle üret, uluslararası fikir alışverişi yap ve kaynakları başkalarının kullanımına aç.",
                journeyStep1Title: "Gözlemle",
                journeyStep1Text:
                    "Öğrenciler atık, iklim sorumluluğu ve yerel sürdürülebilirlik alışkanlıklarını araştırır.",
                journeyStep2Title: "Üret",
                journeyStep2Text:
                    "Atölyeler atık malzemeleri pratik ve yaratıcı öğrenme çıktılarına dönüştürür.",
                journeyStep3Title: "Değişim Yap",
                journeyStep3Text:
                    "Ortak okullar hareketlilik, ekip çalışması ve akran öğrenmesiyle uygulamaları karşılaştırır.",
                journeyStep4Title: "Yaygınlaştır",
                journeyStep4Text:
                    "Kılavuzlar, medya içerikleri, raporlar ve sınıf kaynakları proje sonuçlarını yayar.",
                exploreTag: "Proje İçeriği",
                exploreTitle: "Her Şey Tek Bir Yerde",
                exploreText:
                    "Hedefler, takvim, faaliyetler, sonuçlar ve temel proje detaylarını sürekli aşağı kaydırmadan, sekmeli bir arayüzle keşfedin.",
                tabGoals: "Hedefler",
                tabTimeline: "Takvim",
                tabActivities: "Faaliyetler",
                tabResults: "Sonuçlar",
                tabDetails: "Detaylar",
                goal1Title: "Çevre Bilincini Artırmak",
                goal1Text:
                    "Öğrencilerin iklim konuları, sürdürülebilirlik ve sorumlu kaynak kullanımı hakkında daha fazla farkındalık geliştirmelerini sağlamak.",
                goal2Title: "Sürdürülebilir Kalkınma Amaçlarını Desteklemek",
                goal2Text:
                    "Sürdürülebilirlik kavramlarını okul temelli öğrenmeye ve proje uygulamalarına entegre etmek.",
                goal3Title: "Aktif Katılımı Teşvik Etmek",
                goal3Text:
                    "Öğrencilerin araştırma, üretim, atölye çalışmaları ve ortak proje görevlerinde yer almasını sağlamak.",
                goal4Title: "Uluslararası İş Birliğini Güçlendirmek",
                goal4Text:
                    "Ortak faaliyetler ve kültürlerarası etkileşim yoluyla kurumlar arasında eğitim köprüleri kurmak.",
                goal5Title: "Yaratıcılığı Geliştirmek",
                goal5Text:
                    "İleri dönüşüm etkinlikleriyle yenilikçi düşünmeyi, sanatsal üretimi ve pratik problem çözmeyi desteklemek.",
                goal6Title: "Uzun Vadeli Etki Oluşturmak",
                goal6Text:
                    "Proje süresi sonrasında da devam edebilecek sürdürülebilir alışkanlıklar ve eğitim kaynakları oluşturmak.",
                timeline1Title: "Proje Başlangıcı",
                timeline1Text:
                    "Açılış toplantıları, planlama, koordinasyon ve ortaklar arasında görev dağılımı.",
                timeline2Title: "Araştırma ve Hazırlık",
                timeline2Text:
                    "Öğrenci ve öğretmenlerin sürdürülebilirlik konuları, atık malzemeler ve yerel uygulamalar üzerine çalışması.",
                timeline3Title: "Atölyeler ve Üretim",
                timeline3Text:
                    "Uygulamalı etkinlikler, tasarım çalışmaları, ileri dönüşüm ürünleri ve sınıf içi ortak uygulamalar.",
                timeline4Title: "Hareketlilik ve Değişim",
                timeline4Text:
                    "Ortak ziyaretleri, kültürlerarası öğrenme, akran etkileşimi ve paylaşılan uygulama deneyimleri.",
                timeline5Title: "Yaygınlaştırma",
                timeline5Text:
                    "Proje çıktılarının dijital medya, okul sunumları ve kamu iletişimi aracılığıyla paylaşılması.",
                timeline6Title: "Değerlendirme ve Kalıcılık",
                timeline6Text:
                    "Etki analizi, dokümantasyon, yansıtma ve proje materyallerinin uzun vadeli kullanımı.",
                activity1Title: "Öğrenci Atölyeleri",
                activity1Text:
                    "Malzemelerin yeniden kullanımı, yeniden tasarımı ve dönüştürülmesine odaklanan yaratıcı atölyeler.",
                activity2Title: "Öğretmen İş Birliği",
                activity2Text:
                    "Ortak planlama, pedagojik paylaşım ve sınıf içi ortak uygulamalar.",
                activity3Title: "Hareketlilik Toplantıları",
                activity3Text:
                    "Ortak okullar arasında uluslararası ziyaretler ve proje toplantıları.",
                activity4Title: "Dijital Yaygınlaştırma",
                activity4Text:
                    "Proje çıktılarının, videoların, görsel materyallerin ve raporların çevrim içi paylaşılması.",
                result1Title: "Çevre Bilinci Yüksek Öğrenciler",
                result1Text:
                    "Öğrenciler, ekolojik sorunlar ve sürdürülebilir yaşam uygulamaları konusunda daha güçlü farkındalık geliştirecektir.",
                result2Title: "İleri Dönüşüm Ürünleri",
                result2Text:
                    "İleri dönüşüm etkinlikleri yoluyla geliştirilen yaratıcı öğrenci çıktıları ve proje ürünleri.",
                result3Title: "Eğitim Materyalleri",
                result3Text:
                    "Öğrenme kaynakları, dijital materyaller, kılavuzlar, raporlar ve proje dokümantasyonu.",
                result4Title: "Dijital İçerik",
                result4Text:
                    "Videolar, sunumlar, görsel materyaller ve çevrim içi proje kaynakları.",
                result5Title: "Uluslararası Deneyim",
                result5Text:
                    "Öğrenci ve öğretmenler Avrupa iş birliği ve kültürlerarası öğrenme konusunda uygulamalı deneyim kazanır.",
                result6Title: "Uzun Vadeli Eğitsel Değer",
                result6Text:
                    "Proje materyalleri ve sürdürülebilir uygulamalar resmi proje dönemi sonrasında da kullanılabilir.",
                projectCard1Title: "Proje Türü",
                projectCard1Text:
                    "Erasmus+ KA210-SCH\nOkul Eğitimi Küçük Ölçekli Ortaklık",
                projectCard2Title: "Proje Süresi",
                projectCard2Text:
                    "01/09/2025 - 31/08/2027\nToplam süre: 24 ay",
                projectCard3Title: "Yöntem",
                projectCard3Text:
                    "Atölyeler, araştırma, uygulamalı öğrenme, iş birliği, hareketlilik ve dijital üretim",
                projectCard4Title: "Odak Alanları",
                projectCard4Text:
                    "Sürdürülebilirlik, iklim farkındalığı, yaratıcılık, yeniden kullanım kültürü, kültürlerarası ortaklık ve öğrenci odaklı üretim.",
                partnersTag: "Ortak Kurumlar",
                partnersTitle: "Birlikte Çalışan Okullar",
                partnersText:
                    "Upcycling Patterns; sürdürülebilirlik, öğrenci katılımı ve yenilikçi öğrenme için dört ülkeden okulu bir araya getirir.",
                badgeCoord: "Koordinatör",
                badgePartner: "Ortak",
                partner1Country: "Türkiye",
                labelCoordinator: "Koordinatör:",
                partner1School: "MEV Koleji Özel Basınköy Anadolu Lisesi",
                labelCity: "Şehir:",
                partner1City: "İstanbul",
                labelRole: "Rol:",
                partner1Role: "Koordinatör kurum",
                partner2Country: "Kuzey Makedonya",
                labelSchool: "Okul:",
                partner2School: 'OEMUC "SV. NAUM OHRIDSKI"',
                partner2City: "Ohrid",
                partner2Role: "Proje ortağı",
                partner3Country: "Litvanya",
                partner3School: "Vilniaus automechanikos ir verslo mokykla",
                partner3City: "Vilnius",
                partner3Role: "Proje ortağı",
                partner4Country: "Polonya",
                partner4School:
                    "Zespół Szkół Samochodowych im. Tadeusza Tańskiego",
                partner4City: "Włocławek",
                partner4Role: "Proje ortağı",
                mediaTag: "Medya Merkezi",
                mediaTitle: "Galeri, Haberler ve Kaynaklar",
                mediaText:
                    "Proje görselleri, son güncellemeler ve indirilebilir materyalleri tek bir yerde keşfedin.",
                tabGallery: "Galeri",
                tabNews: "Haberler",
                tabOutputs: "Çıktılar",
                galleryCaption1: "Atölye Çalışmaları",
                galleryCaption2: "Ekip İş Birliği",
                galleryCaption3: "Ortak Toplantıları",
                galleryCaption4: "",
                galleryCaption5: "",
                galleryCaption6: "",
                news1Title: "Açılış Toplantısı Tamamlandı",
                news1Text:
                    "Ortak okullar çalışma planı, sorumluluklar ve yaygınlaştırma hedeflerini netleştirmek için bir araya geldi.",
                news2Title: "Öğrenci Atölye Serisi Başladı",
                news2Text:
                    "Öğrenciler, atık malzemeleri yaratıcı ürünlere dönüştürmeye odaklanan uygulamalı etkinliklere başladı.",
                news3Title: "Yaygınlaştırma Materyalleri Paylaşıldı",
                news3Text:
                    "Dijital içerikler ve görsel proje çıktıları daha geniş okul topluluğuyla paylaşıldı.",
                readMore: "Devamını Oku",
                comingSoon: "Yakında",
                output1Title: "Proje Broşürü",
                output1Text:
                    "Projenin amaçları, ortakları ve faaliyetleri hakkında kısa tanıtım.",
                output2Title: "Atölye Kılavuzu",
                output2Text:
                    "Etkinlik örnekleri ve uygulama adımlarını içeren pratik rehber.",
                output3Title: "Yaygınlaştırma Raporu",
                output3Text:
                    "Proje iletişimi, erişim ve görünürlük faaliyetlerinin özeti.",
                downloadBtn: "İndir",
                downloadUnavailable: "Yakında",
                visitWebsite: "Web sitesi",
                sendEmail: "E-posta",
                faqTag: "SSS",
                faqTitle: "Sık Sorulan Sorular",
                faqText:
                    "Projeyle ilgilenen öğrenciler, öğretmenler, veliler ve ziyaretçiler için temel bilgiler.",
                faq1Question: "Upcycling Patterns nedir?",
                faq1Answer:
                    "Sürdürülebilirlik, iklim farkındalığı ve yaratıcı yeniden kullanıma odaklanan Erasmus+ KA210-SCH okul ortaklığı projesidir.",
                faq2Question: "Proje ortakları kimlerdir?",
                faq2Answer:
                    "Projede Türkiye, Kuzey Makedonya, Litvanya ve Polonya'dan ortak okullar yer almaktadır.",
                faq3Question: "Hangi tür faaliyetler yer alıyor?",
                faq3Answer:
                    "Atölyeler, araştırma, hareketlilik toplantıları, öğrenci üretimi, dijital yaygınlaştırma ve iş birlikçi öğrenme etkinlikleri.",
                faq4Question: "Proje ne kadar sürüyor?",
                faq4Answer:
                    "Proje süresi 24 aydır; 01 Eylül 2025 ile 31 Ağustos 2027 arasındadır.",
                contactTag: "İletişim",
                contactTitle: "İletişime Geçin",
                contactText:
                    "Proje, ortaklık faaliyetleri veya kurumsal iş birliği hakkında daha fazla bilgi için aşağıdaki iletişim bilgilerini kullanabilirsiniz.",
                contactCard1Title: "Koordinatör Kurum",
                contactCard1Text: "MEV Koleji Özel Basınköy Anadolu Lisesi",
                contactCard2Title: "Konum",
                contactCard2Text: "İstanbul, Türkiye",
                contactCard4Title: "E-posta",
                socialTitle: "Bizi Takip Edin",
                socialText: "Resmi proje sosyal medya sayfalarımızı ziyaret edin.",
                contactFormTitle: "Mesaj Gönder",
                formNameLabel: "Ad Soyad",
                formEmailLabel: "E-posta Adresi",
                formSubjectLabel: "Konu",
                formMessageLabel: "Mesaj",
                formSubmitBtn: "Mesaj Gönder",
                formNote: "Bu form proje e-posta adresine bağlıdır.",
                formNamePlaceholder: "Ad Soyad",
                formEmailPlaceholder: "eposta@ornek.com",
                formSubjectPlaceholder: "Proje hakkında bilgi",
                formMessagePlaceholder: "Mesajınızı buraya yazın...",
                disclaimerText:
                    "Avrupa Birliği tarafından finanse edilmektedir. Ancak burada ifade edilen görüş ve düşünceler yalnızca yazar(lar)a aittir ve Avrupa Birliği'nin veya Türkiye Ulusal Ajansı'nın görüşlerini yansıtmak zorunda değildir. Avrupa Birliği ve hibe makamı bunlardan sorumlu tutulamaz.",
                footerProject: "Erasmus+ KA210-SCH Projesi",
                footerCoordinatorLabel: "Koordinatör:",
                footerCoordinatorValue:
                    "MEV Koleji Özel Basınköy Anadolu Lisesi",
                footerCountriesLabel: "Ülkeler:",
                footerCountriesValue:
                    "Türkiye, Kuzey Makedonya, Litvanya, Polonya",
                footerCopy:
                    "© 2025–2027 Upcycling Patterns. Tüm hakları saklıdır.",
                formSending: "Mesajınız gönderiliyor...",
                formSuccess: "Teşekkürler! Mesajınız başarıyla gönderildi.",
                formError: "Lütfen tüm alanları doğru şekilde doldurun.",
                formEmailError: "Lütfen geçerli bir e-posta adresi girin.",
                formTooShortError:
                    "Lütfen mesajınızı biraz daha ayrıntılı yazın.",
                formCooldownError:
                    "Lütfen tekrar göndermeden önce birkaç saniye bekleyin.",
                formNetworkError:
                    "Mesaj gönderilemedi. Yedek olarak e-posta uygulamanız açılıyor...",
                formMissingKey:
                    "İletişim formu henüz tam bağlanmamış. Yedek olarak e-posta uygulamanız açılıyor...",
                formDisabledMessage: "Bu içerik yakında eklenecek.",
                formConsent:
                    "Verdiğim bilgilerin yalnızca mesajıma yanıt vermek için kullanılmasını kabul ediyorum.",
                formConsentRequired:
                    "Mesajınızı göndermeden önce onay kutusunu işaretleyiniz.",
                themeToggleLabel: "Karanlık modu aç/kapat",
                themeToLight: "Açık moda geç",
                themeToDark: "Karanlık moda geç",
                cookieBannerTitle: "Gizliliğinize saygı duyuyoruz",
                cookieBannerText:
                    "Yalnızca dil ve tema tercihlerinizi hatırlamak için yerel depolama kullanıyoruz. Hiçbir izleme veya analiz yapılmamaktadır.",
                cookieBannerAccept: "Anladım",
                cookieBannerMore: "Daha fazla bilgi",
                lightboxClose: "Görsel görüntüleyiciyi kapat",
                lightboxPrev: "Önceki görsel",
                lightboxNext: "Sonraki görsel",
                legalTitle: "Yasal",
                footerOfficialTitle: "Resmi Proje ve Finansman",
                footerPartnersTitle: "Ortak Okullar",
                privacyPolicyLink: "Gizlilik Politikası",
                cookiePolicyLink: "Çerez Politikası",
                termsLink: "Kullanım Koşulları",
                accessibilityLink: "Erişilebilirlik",
                fundingDisclaimerLink: "Finansman Bildirimi",
                adminLink: "Yönetim Paneli"
            }
        };

        /*
         * CMS_DATA_PATHS is the central list of editable JSON files.
         * If a new CMS collection is added later, add its file path here first,
         * then add a matching slot in cmsState and loadCmsData().
         */
        const CMS_DATA_PATHS = {
            site: "/data/site.json",
            content: "/data/content.json",
            logos: "/data/logos.json",
            design: "/data/design.json",
            timeline: "/data/timeline.json",
            mobility: "/data/mobility.json",
            team: "/data/team.json",
            sections: "/data/sections.json",
            partners: "/data/partners.json",
            gallery: "/data/gallery.json",
            news: "/data/news.json",
            outputs: "/data/outputs.json",
            faq: "/data/faq.json"
        };

        /*
         * cmsState is the live in-memory copy of CMS content.
         * Arrays default to [] and objects default to null so rendering
         * functions can fail gently instead of crashing the page.
         */
        const cmsState = {
            loaded: false,
            site: null,
            content: null,
            logos: null,
            design: null,
            timeline: [],
            mobility: [],
            team: [],
            sections: null,
            partners: [],
            gallery: [],
            news: [],
            outputs: [],
            faq: []
        };

        let galleryLightboxBound = false;

        /*
         * Most CMS JSON files use { "items": [...] }, but older exports may use
         * collection-specific names. This helper normalizes those shapes into
         * one array format for the render functions below.
         */
        function normalizeCmsItems(payload) {
            if (!payload) return [];
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload.items)) return payload.items;
            if (Array.isArray(payload.partners)) return payload.partners;
            if (Array.isArray(payload.gallery)) return payload.gallery;
            if (Array.isArray(payload.news)) return payload.news;
            if (Array.isArray(payload.outputs)) return payload.outputs;
            if (Array.isArray(payload.faq)) return payload.faq;
            return [];
        }

        const CMS_CONTENT_FIELDS = {
            timeline: ["title_en", "title_tr", "text_en", "text_tr"],
            mobility: ["title_en", "title_tr", "hostCountry_en", "hostCountry_tr", "hostCity", "hostSchool", "focus_en", "focus_tr"],
            team: ["name", "role_en", "role_tr", "institution", "country_en", "country_tr", "email", "photo", "alt_en", "alt_tr"],
            partners: ["country_en", "country_tr", "school", "city", "role_en", "role_tr", "logo", "website", "email"],
            gallery: ["image", "youtubeUrl", "caption_en", "caption_tr", "alt_en", "alt_tr"],
            news: ["title_en", "title_tr", "summary_en", "summary_tr", "content_en", "content_tr", "image", "alt_en", "alt_tr", "url"],
            outputs: ["title_en", "title_tr", "description_en", "description_tr", "file", "image"],
            faq: ["question_en", "question_tr", "answer_en", "answer_tr"]
        };

        function filterCmsItemsByContent(items, kind) {
            const fields = CMS_CONTENT_FIELDS[kind] || [];
            return (Array.isArray(items) ? items : []).filter(function (item) {
                if (!item || typeof item !== "object") return false;
                return fields.some(function (field) {
                    const value = item[field];
                    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
                });
            });
        }

        function getCmsOrderRank(item) {
            if (!item || typeof item !== "object") return Number.POSITIVE_INFINITY;
            const value = item.displayOrder ?? item.order ?? item.sortOrder ?? item.position;
            const number = Number(value);
            return Number.isFinite(number) ? number : Number.POSITIVE_INFINITY;
        }

        function getCmsTimestamp(item) {
            if (!item || typeof item !== "object") return 0;
            const value = item.uploadDate || item.publishedAt || item.publishDate || item.createdAt || item.date || item.year;
            if (!value) return 0;
            const parsed = Date.parse(String(value));
            if (Number.isFinite(parsed)) return parsed;
            const yearMatch = String(value).match(/\b(20[0-9]{2})\b/);
            return yearMatch ? Date.parse(yearMatch[1] + "-01-01") : 0;
        }

        function sortCmsItemsForDisplay(items) {
            const source = Array.isArray(items) ? items.slice() : [];
            return source
                .map(function (item, index) {
                    return {
                        item: item,
                        index: index,
                        order: getCmsOrderRank(item),
                        timestamp: getCmsTimestamp(item)
                    };
                })
                .sort(function (a, b) {
                    const aHasOrder = Number.isFinite(a.order);
                    const bHasOrder = Number.isFinite(b.order);
                    if (aHasOrder || bHasOrder) {
                        if (a.order !== b.order) return a.order - b.order;
                    }
                    if (a.timestamp !== b.timestamp) return b.timestamp - a.timestamp;
                    return a.index - b.index;
                })
                .map(function (entry) {
                    return entry.item;
                });
        }

        function limitCmsItems(items, limit) {
            const max = Number(limit);
            if (!Number.isFinite(max) || max <= 0) return items;
            return items.slice(0, max);
        }

        function sortCmsItemsByManualOrder(items) {
            const source = Array.isArray(items) ? items.slice() : [];
            return source
                .map(function (item, index) {
                    return {
                        item: item,
                        index: index,
                        order: getCmsOrderRank(item)
                    };
                })
                .sort(function (a, b) {
                    const aHasOrder = Number.isFinite(a.order);
                    const bHasOrder = Number.isFinite(b.order);
                    if (aHasOrder || bHasOrder) {
                        if (a.order !== b.order) return a.order - b.order;
                    }
                    return a.index - b.index;
                })
                .map(function (entry) {
                    return entry.item;
                });
        }

        function filterRemovedAboutCards(items) {
            const blocked = [
                "environmental awareness",
                "creative upcycling",
                "international partnership",
                "cevre bilinci",
                "yaratici ileri donusum",
                "uluslararasi ortaklik"
            ];
            return items.filter(function (item) {
                const title = (getCmsText(item, "title", "en", "") + " " + getCmsText(item, "title", "tr", ""))
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");
                for (let i = 0; i < blocked.length; i++) {
                    if (title.indexOf(blocked[i]) !== -1) return false;
                }
                return true;
            });
        }

        function getCmsText(item, baseKey, lang, fallback) {
            if (!item || typeof item !== "object") return fallback || "";
            const langKey = baseKey + "_" + lang;
            const enKey = baseKey + "_en";
            const trKey = baseKey + "_tr";
            if (typeof item[langKey] === "string" && item[langKey].trim()) return item[langKey].trim();
            if (lang === "tr" && typeof item[trKey] === "string" && item[trKey].trim()) return item[trKey].trim();
            if (typeof item[enKey] === "string" && item[enKey].trim()) return item[enKey].trim();
            if (typeof item[baseKey] === "string" && item[baseKey].trim()) return item[baseKey].trim();
            return fallback || "";
        }

        function cleanCmsString(value) {
            if (typeof value !== "string" && typeof value !== "number") return "";
            return String(value)
                .replace(/[\u0000-\u001F\u007F]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
        }

        /*
         * Public URLs may point to the same site (/images/...) or to an HTTPS
         * address. Encoded and plain path traversal are rejected.
         */
        function getSafePublicUrl(value) {
            const url = cleanCmsString(value);
            if (!url) return "";
            if (/^https:\/\//i.test(url)) {
                try {
                    const parsed = new URL(url);
                    return parsed.protocol === "https:" ? parsed.href : "";
                } catch (error) {
                    return "";
                }
            }
            if (url.charAt(0) !== "/" || url.indexOf("//") === 0 || url.indexOf("\\") !== -1) return "";
            let decoded = url;
            try { decoded = decodeURIComponent(url); } catch (error) { return ""; }
            if (decoded.split("/").indexOf("..") !== -1) return "";
            return url;
        }

        function getSafeExternalUrl(value) {
            const url = cleanCmsString(value);
            if (!/^https:\/\//i.test(url)) return "";
            try {
                const parsed = new URL(url);
                return parsed.protocol === "https:" ? parsed.href : "";
            } catch (error) {
                return "";
            }
        }

        function getSafeEmail(value) {
            const email = cleanCmsString(value);
            return isValidEmail(email) ? email : "";
        }

        function getUiLabel(key, fallback) {
            const dict = getDictionary(currentLanguage);
            return dict[key] || fallback || "";
        }

        function createTextNode(tag, className, text) {
            const node = document.createElement(tag);
            if (className) node.className = className;
            node.textContent = text || "";
            return node;
        }

        function createMultilineTextNode(tag, className, text) {
            const node = document.createElement(tag);
            if (className) node.className = className;
            const clean = typeof text === "string" || typeof text === "number"
                ? String(text).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").trim()
                : "";
            if (!clean) return node;
            const parts = clean.replace(/\r\n?/g, "\n").split("\n");
            for (let i = 0; i < parts.length; i++) {
                if (i > 0) node.appendChild(document.createElement("br"));
                node.appendChild(document.createTextNode(parts[i]));
            }
            return node;
        }

        /*
         * Fetch one CMS JSON file with an 8-second safety timeout.
         * Returning null instead of throwing keeps the static fallback content
         * visible if one CMS file is temporarily missing.
         */
        async function fetchCmsJson(url) {
            let timeoutId = 0;
            try {
                const options = {
                    method: "GET",
                    headers: { Accept: "application/json" },
                    cache: "no-cache",
                    credentials: "same-origin"
                };
                if (window.AbortController) {
                    const controller = new AbortController();
                    options.signal = controller.signal;
                    timeoutId = window.setTimeout(function () {
                        controller.abort();
                    }, 8000);
                }

                const response = await fetch(url, options);
                if (!response.ok) throw new Error("CMS JSON request failed: " + url);
                return await response.json();
            } catch (error) {
                if (window.console && console.warn) console.warn("[CMS] Could not load:", url, error);
                return null;
            } finally {
                if (timeoutId) window.clearTimeout(timeoutId);
            }
        }

        function overrideTranslation(lang, key, value) {
            if (!translations[lang]) return;
            if (typeof value !== "string") return;
            const clean = value.trim();
            if (!clean) return;
            translations[lang][key] = clean;
        }

        function overrideBothTranslations(key, enValue, trValue) {
            overrideTranslation("en", key, enValue);
            overrideTranslation("tr", key, trValue || enValue);
        }

        const EDITABLE_UI_KEYS = [
            "navHome",
            "navAbout",
            "navExplore",
            "navPartners",
            "navMedia",
            "navFaq",
            "navContact",
            "heroEyebrow",
            "heroTitleMain",
            "heroTitleAccent",
            "heroBtnPrimary",
            "heroBtnSecondary",
            "heroProofOne",
            "heroProofTwo",
            "heroProofThree",
            "snapshotTag",
            "snapshotTitle",
            "pulseLabel",
            "pulseComplete",
            "statCountries",
            "statMonths",
            "statProjectEnd",
            "footerOfficialTitle",
            "footerPartnersTitle",
            "footerProject",
            "footerCoordinatorLabel",
            "footerCountriesLabel",
            "footerCopy"
        ];

        function applyCmsEditableTextOverrides() {
            const content = cmsState.content && typeof cmsState.content === "object" ? cmsState.content : null;
            const labels = content && content.labels && typeof content.labels === "object" ? content.labels : content;
            if (!labels || typeof labels !== "object") return;
            for (let i = 0; i < EDITABLE_UI_KEYS.length; i++) {
                const key = EDITABLE_UI_KEYS[i];
                overrideBothTranslations(
                    key,
                    getCmsText(labels, key, "en", ""),
                    getCmsText(labels, key, "tr", "")
                );
            }
        }

        function applyCmsTranslationOverrides() {
            applyCmsEditableTextOverrides();
            const site = cmsState.site;
            if (site && typeof site === "object") {
                const coordinator = cleanCmsString(site.coordinator);
                const city = cleanCmsString(site.coordinatorCity);
                const countryEn = getCmsText(site, "coordinatorCountry", "en", "");
                const countryTr = getCmsText(site, "coordinatorCountry", "tr", countryEn);
                if (coordinator) {
                    overrideBothTranslations("contactCard1Text", coordinator, coordinator);
                    overrideBothTranslations("footerCoordinatorValue", coordinator, coordinator);
                }
                if (city || countryEn || countryTr) {
                    const locationEn = [city, countryEn].filter(Boolean).join(", ");
                    const locationTr = [city, countryTr].filter(Boolean).join(", ");
                    overrideBothTranslations("contactCard2Text", locationEn, locationTr);
                }

                const seo = site.seo && typeof site.seo === "object" ? site.seo : null;
                if (seo) {
                    overrideBothTranslations(
                        "pageTitle",
                        getCmsText(seo, "title", "en", ""),
                        getCmsText(seo, "title", "tr", "")
                    );
                    overrideBothTranslations(
                        "metaDescription",
                        getCmsText(seo, "description", "en", ""),
                        getCmsText(seo, "description", "tr", "")
                    );
                }
            }
            if (cmsState.partners.length) {
                const countries = [];
                for (let i = 0; i < cmsState.partners.length; i++) {
                    const country = getCmsText(cmsState.partners[i], "country", "en", "");
                    if (country && countries.indexOf(country) === -1) countries.push(country);
                }
                if (countries.length) overrideBothTranslations("footerCountriesValue", countries.join(", "), countries.join(", "));
            }

            const partnersLimit = Math.min(cmsState.partners.length, 4);
            for (let i = 0; i < partnersLimit; i++) {
                const item = cmsState.partners[i] || {};
                const n = i + 1;
                overrideBothTranslations("partner" + n + "Country", getCmsText(item, "country", "en", ""), getCmsText(item, "country", "tr", ""));
                overrideBothTranslations("partner" + n + "School", getCmsText(item, "school", "en", ""), getCmsText(item, "school", "tr", ""));
                overrideBothTranslations("partner" + n + "City", getCmsText(item, "city", "en", ""), getCmsText(item, "city", "tr", ""));
                overrideBothTranslations("partner" + n + "Role", getCmsText(item, "role", "en", ""), getCmsText(item, "role", "tr", ""));
            }
            const galleryLimit = Math.min(cmsState.gallery.length, 6);
            for (let i = 0; i < galleryLimit; i++) {
                const item = cmsState.gallery[i] || {};
                overrideBothTranslations("galleryCaption" + (i + 1), getCmsText(item, "caption", "en", ""), getCmsText(item, "caption", "tr", ""));
            }
            const newsLimit = Math.min(cmsState.news.length, 3);
            for (let i = 0; i < newsLimit; i++) {
                const item = cmsState.news[i] || {};
                const n = i + 1;
                overrideBothTranslations("news" + n + "Title", getCmsText(item, "title", "en", ""), getCmsText(item, "title", "tr", ""));
                overrideBothTranslations("news" + n + "Text", getCmsText(item, "summary", "en", "") || getCmsText(item, "content", "en", ""), getCmsText(item, "summary", "tr", "") || getCmsText(item, "content", "tr", ""));
            }
            const outputsLimit = Math.min(cmsState.outputs.length, 3);
            for (let i = 0; i < outputsLimit; i++) {
                const item = cmsState.outputs[i] || {};
                const n = i + 1;
                overrideBothTranslations("output" + n + "Title", getCmsText(item, "title", "en", ""), getCmsText(item, "title", "tr", ""));
                overrideBothTranslations("output" + n + "Text", getCmsText(item, "description", "en", ""), getCmsText(item, "description", "tr", ""));
            }
            const faqLimit = Math.min(cmsState.faq.length, 4);
            for (let i = 0; i < faqLimit; i++) {
                const item = cmsState.faq[i] || {};
                const n = i + 1;
                overrideBothTranslations("faq" + n + "Question", getCmsText(item, "question", "en", ""), getCmsText(item, "question", "tr", ""));
                overrideBothTranslations("faq" + n + "Answer", getCmsText(item, "answer", "en", ""), getCmsText(item, "answer", "tr", ""));
            }
        }

        function getCmsNumber(value, min, max, fallback) {
            const number = Number(value);
            if (!Number.isFinite(number)) return fallback;
            return Math.min(max, Math.max(min, number));
        }

        function getCmsOption(value, allowed, fallback) {
            const clean = cleanCmsString(value).toLowerCase();
            return allowed.indexOf(clean) !== -1 ? clean : fallback;
        }

        function getCmsCssPosition(value, fallback) {
            const clean = cleanCmsString(value);
            if (!clean) return fallback;
            const token = "(?:left|right|center|top|bottom|\\d{1,3}(?:\\.\\d+)?%)";
            const pattern = new RegExp("^" + token + "(?:\\s+" + token + ")?$", "i");
            return pattern.test(clean) ? clean : fallback;
        }

        function getCmsDesignLayout() {
            const design = cmsState.design && typeof cmsState.design === "object" ? cmsState.design : null;
            const layout = design && design.layout && typeof design.layout === "object" ? design.layout : design;
            return layout && typeof layout === "object" ? layout : {};
        }

        function getCmsDesignHotspots() {
            const design = cmsState.design && typeof cmsState.design === "object" ? cmsState.design : null;
            const hotspots = design && design.hotspots && typeof design.hotspots === "object" ? design.hotspots : null;
            return hotspots || {};
        }

        function setRootCssVar(name, value) {
            if (!name || value === undefined || value === null || value === "") return;
            html.style.setProperty(name, String(value));
        }

        function applyCmsDesignSettings() {
            const layout = getCmsDesignLayout();
            const density = getCmsOption(layout.sectionDensity, ["compact", "balanced", "spacious"], "compact");
            const densityMap = {
                compact: {
                    section: "clamp(48px, 6vw, 76px)",
                    feature: "clamp(52px, 6.5vw, 80px)",
                    snapshotTop: "clamp(30px, 4.4vw, 50px)",
                    snapshotBottom: "clamp(42px, 5.4vw, 64px)",
                    mobile: "48px"
                },
                balanced: {
                    section: "clamp(58px, 7vw, 84px)",
                    feature: "clamp(60px, 7vw, 88px)",
                    snapshotTop: "clamp(34px, 5vw, 58px)",
                    snapshotBottom: "clamp(48px, 6vw, 72px)",
                    mobile: "52px"
                },
                spacious: {
                    section: "clamp(72px, 8vw, 104px)",
                    feature: "clamp(76px, 8.5vw, 112px)",
                    snapshotTop: "clamp(44px, 6vw, 72px)",
                    snapshotBottom: "clamp(58px, 7vw, 86px)",
                    mobile: "58px"
                }
            };
            const spacing = densityMap[density] || densityMap.compact;

            const heroDesktop = getCmsNumber(layout.heroHeightDesktop, 84, 100, 90);
            const heroTablet = getCmsNumber(layout.heroHeightTablet, 88, 104, 96);
            const heroMobile = getCmsNumber(layout.heroHeightMobile, 90, 108, 92);
            const heroTopCrop = getCmsNumber(layout.heroTopCrop, -12, 2, -5);
            const heroImageHeight = getCmsNumber(layout.heroImageHeightDesktop, 100, 118, 110);
            const containerWidth = getCmsNumber(layout.containerWidth, 1080, 1440, 1240);
            const cardRadius = getCmsNumber(layout.cardRadius, 6, 18, 8);
            const footerLogoDesktop = getCmsNumber(layout.footerLogoDesktopHeight, 56, 96, 78);
            const footerLogoWideDesktop = getCmsNumber(layout.footerLogoWideDesktopHeight, 60, 104, 80);
            const footerLogoMobile = getCmsNumber(layout.footerLogoMobileHeight, 44, 76, 58);
            const footerLogoWideMobile = getCmsNumber(layout.footerLogoWideMobileHeight, 48, 82, 62);

            setRootCssVar("--container", containerWidth + "px");
            setRootCssVar("--cms-card-radius", cardRadius + "px");
            setRootCssVar("--cms-hero-desktop-height", heroDesktop + "svh");
            setRootCssVar("--cms-hero-tablet-height", heroTablet + "svh");
            setRootCssVar("--cms-hero-mobile-height", heroMobile + "svh");
            setRootCssVar("--cms-hero-backdrop-top", heroTopCrop + "%");
            setRootCssVar("--cms-hero-backdrop-height", heroImageHeight + "%");
            setRootCssVar("--cms-hero-object-position-desktop", getCmsCssPosition(layout.heroObjectPositionDesktop, "center 45%"));
            setRootCssVar("--cms-hero-object-position-tablet", getCmsCssPosition(layout.heroObjectPositionTablet, "62% center"));
            setRootCssVar("--cms-hero-object-position-mobile", getCmsCssPosition(layout.heroObjectPositionMobile, "68% center"));
            setRootCssVar("--cms-section-y", spacing.section);
            setRootCssVar("--cms-feature-section-y", spacing.feature);
            setRootCssVar("--cms-snapshot-top", spacing.snapshotTop);
            setRootCssVar("--cms-snapshot-bottom", spacing.snapshotBottom);
            setRootCssVar("--cms-mobile-section-y", spacing.mobile);
            setRootCssVar("--cms-footer-logo-h", footerLogoDesktop + "px");
            setRootCssVar("--cms-footer-logo-wide-h", footerLogoWideDesktop + "px");
            setRootCssVar("--cms-footer-logo-mobile-h", footerLogoMobile + "px");
            setRootCssVar("--cms-footer-logo-wide-mobile-h", footerLogoWideMobile + "px");

            const hotspots = getCmsDesignHotspots();
            const hotspotMap = [
                ["--hotspot-tr-x", hotspots.turkiyeX, 79],
                ["--hotspot-tr-y", hotspots.turkiyeY, 78],
                ["--hotspot-mk-x", hotspots.northMacedoniaX, 66.3],
                ["--hotspot-mk-y", hotspots.northMacedoniaY, 80.5],
                ["--hotspot-lt-x", hotspots.lithuaniaX, 69.4],
                ["--hotspot-lt-y", hotspots.lithuaniaY, 43.5],
                ["--hotspot-pl-x", hotspots.polandX, 64.7],
                ["--hotspot-pl-y", hotspots.polandY, 55]
            ];
            for (let i = 0; i < hotspotMap.length; i++) {
                setRootCssVar(hotspotMap[i][0], getCmsNumber(hotspotMap[i][1], 0, 100, hotspotMap[i][2]) + "%");
            }
        }

        function setMetaContent(selector, value) {
            const clean = cleanCmsString(value);
            if (!clean) return;
            const node = document.querySelector(selector);
            if (node) node.setAttribute("content", clean);
        }

        function getAbsoluteCmsUrl(value) {
            const safeExternal = getSafeExternalUrl(value);
            const safePublic = safeExternal || getSafePublicUrl(value);
            if (!safePublic) return "";
            try {
                return new URL(safePublic, window.location.origin).href;
            } catch (error) {
                return "";
            }
        }

        function applyCmsSeoMedia() {
            const site = cmsState.site && typeof cmsState.site === "object" ? cmsState.site : null;
            const seo = site && site.seo && typeof site.seo === "object" ? site.seo : null;
            if (!seo) return;
            const image = getAbsoluteCmsUrl(seo.image);
            if (image) {
                setMetaContent('meta[property="og:image"]', image);
                setMetaContent('meta[property="og:image:secure_url"]', image);
                setMetaContent('meta[name="twitter:image"]', image);
            }
            const imageAlt = getCmsText(seo, "imageAlt", currentLanguage, "") || getCmsText(seo, "imageAlt", "en", "");
            if (imageAlt) {
                setMetaContent('meta[property="og:image:alt"]', imageAlt);
                setMetaContent('meta[name="twitter:image:alt"]', imageAlt);
            }
        }

        function applyCmsSiteData() {
            // Always attach the Web3Forms key first, even if /data/site.json is missing.
            // This keeps the contact form working without changing the HTML design.
            if (WEB3FORMS_ACCESS_KEY && contactForm) {
                contactForm.setAttribute("data-access-key", WEB3FORMS_ACCESS_KEY);

                const defaultHiddenKey = contactForm.querySelector('input[name="access_key"]');
                if (defaultHiddenKey) {
                    defaultHiddenKey.value = WEB3FORMS_ACCESS_KEY;
                }
            }

            const site = cmsState.site;
            if (!site || typeof site !== "object") return;
            const projectEmail = getSafeEmail(site.projectEmail);
            if (projectEmail && contactForm) contactForm.setAttribute("data-fallback-email", projectEmail);
            const web3formsKey = typeof site.web3formsKey === "string" ? site.web3formsKey.trim() : "";
            if (web3formsKey && contactForm) {
                contactForm.setAttribute("data-access-key", web3formsKey);
                const hiddenKey = contactForm.querySelector('input[name="access_key"]');
                if (hiddenKey) hiddenKey.value = web3formsKey;
            }
            if (site.heroImage && typeof site.heroImage === "string") {
                const heroImage = getSafePublicUrl(site.heroImage);
                const heroImages = document.querySelectorAll('[data-cms-field="heroImage"], .hero-image');
                for (let i = 0; i < heroImages.length; i++) {
                    if (heroImage && heroImages[i].tagName && heroImages[i].tagName.toLowerCase() === "img") {
                        heroImages[i].src = heroImage;
                    }
                }
            }
            if (site.social && typeof site.social === "object") {
                const socialMap = {
                    instagram: site.social.instagram,
                    x: site.social.x || site.social.twitter,
                    twitter: site.social.twitter || site.social.x,
                    youtube: site.social.youtube,
                    linkedin: site.social.linkedin,
                    facebook: site.social.facebook
                };
                Object.keys(socialMap).forEach(function (key) {
                    const url = getSafeExternalUrl(socialMap[key]);
                    if (!url) return;
                    const links = document.querySelectorAll('[data-social="' + key + '"], [data-cms-social="' + key + '"], .social-link-' + key);
                    for (let i = 0; i < links.length; i++) links[i].setAttribute("href", url);
                });
            }
            applyCmsSeoMedia();
        }

        function getYoutubeVideoId(url) {
            if (!url || typeof url !== "string") return "";
            const value = url.trim();
            if (!value) return "";

            try {
                const parsed = new URL(value);
                const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

                if (host === "youtu.be") {
                    return parsed.pathname.split("/").filter(Boolean)[0] || "";
                }

                if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
                    if (parsed.pathname === "/watch") return parsed.searchParams.get("v") || "";

                    const parts = parsed.pathname.split("/").filter(Boolean);
                    if ((parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") && parts[1]) {
                        return parts[1];
                    }
                }
            } catch (error) {
                const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{6,})/);
                return match ? match[1] : "";
            }

            return "";
        }

        function getYoutubeEmbedUrl(url) {
            const id = getYoutubeVideoId(url);
            return id ? "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?rel=0&modestbranding=1" : "";
        }

        function getYoutubeThumbnailUrl(url) {
            const id = getYoutubeVideoId(url);
            return id ? "https://img.youtube.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg" : "";
        }

        function isYoutubeGalleryItem(item) {
            if (!item || typeof item !== "object") return false;
            const type = typeof item.type === "string" ? item.type.trim().toLowerCase() : "";
            const youtubeUrl = typeof item.youtubeUrl === "string" ? item.youtubeUrl.trim() : "";
            return type === "youtube" || Boolean(getYoutubeVideoId(youtubeUrl));
        }

        function setGalleryCardHidden(card, hidden) {
            if (!card) return;
            card.hidden = Boolean(hidden);
            card.style.display = hidden ? "none" : "";
            card.setAttribute("aria-hidden", hidden ? "true" : "false");
            if (hidden) {
                card.setAttribute("tabindex", "-1");
            } else if (!card.hasAttribute("tabindex")) {
                card.setAttribute("tabindex", "0");
            }
        }

        function ensureGalleryVideoBadge(card) {
            if (!card) return null;
            let badge = card.querySelector(".gallery-video-badge");
            if (badge) return badge;

            badge = document.createElement("span");
            badge.className = "gallery-video-badge";
            badge.setAttribute("aria-hidden", "true");
            badge.textContent = "▶";
            badge.style.position = "absolute";
            badge.style.left = "50%";
            badge.style.top = "50%";
            badge.style.transform = "translate(-50%, -50%)";
            badge.style.width = "58px";
            badge.style.height = "58px";
            badge.style.borderRadius = "999px";
            badge.style.display = "inline-flex";
            badge.style.alignItems = "center";
            badge.style.justifyContent = "center";
            badge.style.paddingLeft = "4px";
            badge.style.color = "#ffffff";
            badge.style.background = "rgba(15, 27, 20, 0.62)";
            badge.style.backdropFilter = "blur(10px)";
            badge.style.webkitBackdropFilter = "blur(10px)";
            badge.style.boxShadow = "0 18px 44px rgba(0, 0, 0, 0.28)";
            badge.style.fontSize = "1.25rem";
            badge.style.fontWeight = "900";
            badge.style.pointerEvents = "none";
            badge.style.zIndex = "3";

            const figure = card.querySelector("figure") || card;
            const computed = window.getComputedStyle(figure);
            if (computed.position === "static") figure.style.position = "relative";
            figure.appendChild(badge);
            return badge;
        }

        function removeGalleryVideoBadge(card) {
            if (!card) return;
            const badge = card.querySelector(".gallery-video-badge");
            if (badge) badge.remove();
        }

        function applyCmsGalleryImages() {
            const items = cmsState.gallery;
            if (!items.length) return;

            const cards = document.querySelectorAll('[data-cms-item="gallery"], .gallery-card');
            if (!cards.length) return;

            const limit = Math.min(items.length, cards.length);

            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                if (!card) continue;

                if (i >= limit) {
                    setGalleryCardHidden(card, true);
                    removeGalleryVideoBadge(card);
                    continue;
                }

                const item = items[i] || {};
                const img = card.querySelector("img");
                const captionNode = card.querySelector("figcaption, .gallery-caption, [data-gallery-caption]");
                const caption = getCmsText(item, "caption", currentLanguage, "");
                const alt = getCmsText(item, "alt", currentLanguage, "") || caption;
                const isYoutube = isYoutubeGalleryItem(item);
                const youtubeUrl = typeof item.youtubeUrl === "string" ? item.youtubeUrl.trim() : "";
                const thumb = isYoutube ? getYoutubeThumbnailUrl(youtubeUrl) : "";

                setGalleryCardHidden(card, false);
                card.classList.toggle("is-video-card", isYoutube);
                card.classList.toggle("is-image-card", !isYoutube);
                card.setAttribute("data-gallery-type", isYoutube ? "youtube" : "image");
                card.setAttribute("data-lightbox-index", String(i));

                // Only image cards act as buttons (they open the lightbox).
                // Video cards contain a YouTube iframe that is already focusable
                // and has its own native controls, so treating the wrapper as a
                // button is misleading for screen readers and steals iframe clicks.
                if (isYoutube) {
                    card.removeAttribute("role");
                    card.removeAttribute("tabindex");
                } else {
                    card.setAttribute("role", "button");
                    card.setAttribute("tabindex", "0");
                }
                card.style.cursor = isYoutube ? "default" : "zoom-in";

                if (isYoutube) {
                    card.setAttribute("data-youtube-url", youtubeUrl);
                    card.setAttribute("data-youtube-embed", getYoutubeEmbedUrl(youtubeUrl));
                    card.setAttribute(
                        "aria-label",
                        (caption || "Project video") + " — YouTube video"
                    );
                    ensureGalleryVideoBadge(card);
                    if (img && thumb) img.src = thumb;
                } else {
                    card.removeAttribute("data-youtube-url");
                    card.removeAttribute("data-youtube-embed");
                    card.setAttribute("aria-label", caption || alt || "Gallery image");
                    removeGalleryVideoBadge(card);
                    if (img && typeof item.image === "string" && item.image.trim()) {
                        img.src = item.image.trim();
                    }
                }

                if (img && alt) img.alt = alt;
                if (captionNode && caption) captionNode.textContent = caption;
            }
        }

        function applyCmsNewsDates() {
            const items = cmsState.news;
            if (!items.length) return;
            const cards = document.querySelectorAll('[data-cms-item="news"], .news-card');
            const limit = Math.min(items.length, cards.length);
            for (let i = 0; i < limit; i++) {
                const item = items[i] || {};
                const card = cards[i];
                if (!card) continue;
                const dateNode = card.querySelector(".news-date");
                const dateValue = item.year || item.date;
                if (dateNode && dateValue) dateNode.textContent = String(dateValue);
            }
        }

        function createPartnerFlag(countryCode) {
            const flag = document.createElement("div");
            flag.className = "partner-flag";
            flag.setAttribute("aria-hidden", "true");

            const code = cleanCmsString(countryCode).slice(0, 2).toUpperCase();
            const lowerCode = code.toLowerCase();
            const span = document.createElement("span");
            if (["tr", "mk", "lt", "pl"].indexOf(lowerCode) !== -1) {
                span.className = "flag-" + lowerCode;
            } else {
                span.className = "flag-code";
                span.textContent = code || "EU";
            }
            flag.appendChild(span);
            return flag;
        }

        function createPartnerInfoLine(labelKey, fallbackLabel, value) {
            if (!value) return null;
            const p = document.createElement("p");
            const strong = document.createElement("strong");
            strong.textContent = getUiLabel(labelKey, fallbackLabel);
            const span = document.createElement("span");
            span.textContent = value;
            p.appendChild(strong);
            p.appendChild(document.createTextNode(" "));
            p.appendChild(span);
            return p;
        }

        function normalizeCmsSectionList(key) {
            const sections = cmsState.sections;
            if (!sections || typeof sections !== "object") return [];
            const list = sections[key];
            if (!Array.isArray(list)) return [];
            return list.filter(function (item) {
                if (!item || typeof item !== "object") return false;
                return Boolean(
                    getCmsText(item, "title", currentLanguage, "") ||
                    getCmsText(item, "text", currentLanguage, "") ||
                    getSafePublicUrl(item.image)
                );
            });
        }

        function formatCmsIndex(index) {
            return String(index + 1).padStart(2, "0");
        }

        function createCmsCardImage(item, fallbackAlt) {
            const image = getSafePublicUrl(item && item.image);
            if (!image) return null;
            const alt = getCmsText(item, "alt", currentLanguage, "") || fallbackAlt || "Project image";
            const wrap = document.createElement("div");
            wrap.className = "cms-card-image-wrap";
            const img = document.createElement("img");
            img.className = "cms-card-image";
            img.src = image;
            img.alt = alt;
            img.loading = "lazy";
            img.decoding = "async";
            img.width = 720;
            img.height = 480;
            wrap.appendChild(img);
            return wrap;
        }

        function createCmsIcon(className, icon, fallback) {
            const clean = cleanCmsString(icon) || fallback || "";
            if (!clean) return null;
            const node = createTextNode("div", className, clean);
            node.setAttribute("aria-hidden", "true");
            return node;
        }

        function createAboutSectionCard(item, index) {
            const title = getCmsText(item, "title", currentLanguage, "Project focus");
            const text = getCmsText(item, "text", currentLanguage, "");
            const card = document.createElement("article");
            card.className = "info-card glass-card visible tilt-card";
            card.setAttribute("data-cms-item", "section-card");

            const image = createCmsCardImage(item, title);
            if (image) card.appendChild(image);
            else {
                const icon = createCmsIcon("info-icon cms-text-icon", item.icon, formatCmsIndex(index));
                if (icon) card.appendChild(icon);
            }

            card.appendChild(createTextNode("h3", "", title));
            if (text) card.appendChild(createMultilineTextNode("p", "", text));
            return card;
        }

        function createMissionSectionItem(item, index) {
            const title = getCmsText(item, "title", currentLanguage, "Mission");
            const text = getCmsText(item, "text", currentLanguage, "");
            const card = document.createElement("article");
            card.className = "mission-item";
            card.setAttribute("data-cms-item", "mission-item");

            const image = createCmsCardImage(item, title);
            if (image) card.appendChild(image);
            card.appendChild(createTextNode("span", "mission-num", cleanCmsString(item.icon) || formatCmsIndex(index)));
            card.appendChild(createTextNode("h3", "", title));
            if (text) card.appendChild(createMultilineTextNode("p", "", text));
            return card;
        }

        function createHighlightSectionCard(item, index) {
            const title = getCmsText(item, "title", currentLanguage, "Project item");
            const text = getCmsText(item, "text", currentLanguage, "");
            const card = document.createElement("article");
            card.className = "highlight-item glass-card visible tilt-card";
            card.setAttribute("data-cms-item", "section-card");

            const image = createCmsCardImage(item, title);
            if (image) card.appendChild(image);
            card.appendChild(createTextNode("span", "card-num", cleanCmsString(item.icon) || formatCmsIndex(index)));
            card.appendChild(createTextNode("h3", "", title));
            if (text) card.appendChild(createMultilineTextNode("p", "", text));
            return card;
        }

        function createTimelineSectionCard(item, index) {
            const title = getCmsText(item, "title", currentLanguage, "Project step");
            const text = getCmsText(item, "text", currentLanguage, "");
            const card = document.createElement("article");
            card.className = "timeline-card glass-card visible";
            card.setAttribute("data-cms-item", "section-card");

            const image = createCmsCardImage(item, title);
            if (image) card.appendChild(image);
            card.appendChild(createTextNode("span", "timeline-step", cleanCmsString(item.icon) || formatCmsIndex(index)));
            card.appendChild(createTextNode("h3", "", title));
            if (text) card.appendChild(createMultilineTextNode("p", "", text));
            return card;
        }

        function createProjectSectionCard(item, index, iconClass) {
            const title = getCmsText(item, "title", currentLanguage, "Project item");
            const text = getCmsText(item, "text", currentLanguage, "");
            const card = document.createElement("article");
            card.className = "project-card glass-card visible tilt-card";
            card.setAttribute("data-cms-item", "section-card");

            const image = createCmsCardImage(item, title);
            if (image) card.appendChild(image);
            const icon = createCmsIcon(iconClass, item.icon, formatCmsIndex(index));
            if (icon) card.appendChild(icon);
            card.appendChild(createTextNode("h3", "", title));
            if (text) card.appendChild(createMultilineTextNode("p", "", text));
            return card;
        }

        function renderCmsSectionList(selector, items, createCard, limit, options) {
            const list = document.querySelector(selector);
            if (!list || !items.length) return;
            const config = options && typeof options === "object" ? options : {};
            const orderedItems = config.preserveNaturalOrder
                ? sortCmsItemsByManualOrder(items)
                : sortCmsItemsForDisplay(items);
            const visibleItems = limitCmsItems(orderedItems, limit);
            list.textContent = "";
            for (let i = 0; i < visibleItems.length; i++) {
                list.appendChild(createCard(visibleItems[i] || {}, i));
            }
        }

        function renderCmsSections() {
            const exploreLimit = 4;
            const timelineItems = cmsState.timeline.length
                ? cmsState.timeline
                : normalizeCmsSectionList("timeline");
            renderCmsSectionList(".about-grid", filterRemovedAboutCards(normalizeCmsSectionList("aboutCards")), createAboutSectionCard);
            renderCmsSectionList(".mission-strip", normalizeCmsSectionList("missionItems"), createMissionSectionItem);
            renderCmsSectionList("#panel-goals .highlights-grid", normalizeCmsSectionList("goals"), createHighlightSectionCard, exploreLimit, { preserveNaturalOrder: true });
            renderCmsSectionList("#panel-timeline .timeline-grid", timelineItems, createTimelineSectionCard, exploreLimit, { preserveNaturalOrder: true });
            renderCmsSectionList("#panel-activities .project-layout", normalizeCmsSectionList("activities"), function (item, index) {
                return createProjectSectionCard(item, index, "activity-icon");
            }, exploreLimit, { preserveNaturalOrder: true });
            renderCmsSectionList("#panel-results .highlights-grid", normalizeCmsSectionList("results"), createHighlightSectionCard, exploreLimit, { preserveNaturalOrder: true });
            renderCmsSectionList("#panel-details .project-layout", normalizeCmsSectionList("details"), function (item, index) {
                return createProjectSectionCard(item, index, "detail-icon");
            }, exploreLimit, { preserveNaturalOrder: true });
        }

        function createPartnerCard(item) {
            const country = getCmsText(item, "country", currentLanguage, cleanCmsString(item.countryCode) || "Partner");
            const school = getCmsText(item, "school", currentLanguage, "");
            const city = getCmsText(item, "city", currentLanguage, "");
            const role = getCmsText(item, "role", currentLanguage, "");
            const isCoordinator = role.toLowerCase().indexOf("coordinat") !== -1 || role.toLowerCase().indexOf("koordinat") !== -1;
            const website = getSafeExternalUrl(item.website);
            const email = getSafeEmail(item.email);

            const card = document.createElement("article");
            card.className = "partner-card glass-card visible tilt-card";
            card.setAttribute("data-cms-item", "partner");
            card.setAttribute("data-country-code", cleanCmsString(item.countryCode).slice(0, 2).toUpperCase());

            const top = document.createElement("div");
            top.className = "partner-card-top";
            top.appendChild(createPartnerFlag(item.countryCode));
            card.appendChild(top);

            card.appendChild(createTextNode("h3", "", country));

            const info = document.createElement("div");
            info.className = "partner-info";
            const schoolLine = createPartnerInfoLine(isCoordinator ? "labelCoordinator" : "labelSchool", isCoordinator ? "Coordinator:" : "School:", school);
            const cityLine = createPartnerInfoLine("labelCity", "City:", city);
            const roleLine = createPartnerInfoLine("labelRole", "Role:", role);
            if (schoolLine) info.appendChild(schoolLine);
            if (cityLine) info.appendChild(cityLine);
            if (roleLine) info.appendChild(roleLine);
            card.appendChild(info);

            if (website || email) {
                const actions = document.createElement("div");
                actions.className = "partner-actions";
                if (website) {
                    const link = document.createElement("a");
                    link.href = website;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.textContent = getUiLabel("visitWebsite", "Website");
                    actions.appendChild(link);
                }
                if (email) {
                    const link = document.createElement("a");
                    link.href = "mailto:" + email;
                    link.textContent = getUiLabel("sendEmail", "Email");
                    actions.appendChild(link);
                }
                card.appendChild(actions);
            }

            const badge = createTextNode("span", isCoordinator ? "partner-badge" : "partner-badge partner-badge-alt", getUiLabel(isCoordinator ? "badgeCoord" : "badgePartner", isCoordinator ? "Coordinator" : "Partner"));
            card.appendChild(badge);

            return card;
        }

        function renderCmsPartners() {
            const grid = document.getElementById("partnersGrid");
            if (!grid || !cmsState.partners.length) return;
            const partners = sortCmsItemsForDisplay(cmsState.partners);
            grid.textContent = "";
            for (let i = 0; i < partners.length; i++) {
                grid.appendChild(createPartnerCard(partners[i] || {}));
            }
        }

        function createGalleryCard(item, index) {
            const youtubeUrl = cleanCmsString(item.youtubeUrl);
            const embedUrl = getYoutubeEmbedUrl(youtubeUrl);
            const isYoutube = isYoutubeGalleryItem(item) && Boolean(embedUrl);
            const caption = getCmsText(item, "caption", currentLanguage, "") || (isYoutube ? "Project video" : "Project image");
            const alt = getCmsText(item, "alt", currentLanguage, "") || caption;

            const card = document.createElement("figure");
            card.className = "gallery-card glass-card " + (isYoutube ? "is-video-card" : "is-image-card");
            card.setAttribute("data-cms-item", "gallery");
            card.setAttribute("data-gallery-type", isYoutube ? "youtube" : "image");
            card.setAttribute("data-lightbox", isYoutube ? "false" : "true");
            card.setAttribute("data-lightbox-index", String(index));

            const wrap = document.createElement("div");
            wrap.className = "gallery-img-wrap";

            if (isYoutube) {
                card.setAttribute("data-youtube-url", youtubeUrl);
                card.setAttribute("data-youtube-embed", embedUrl);
                card.setAttribute("aria-label", caption + " - YouTube video");

                const frame = document.createElement("iframe");
                frame.src = embedUrl;
                frame.title = caption;
                frame.loading = "lazy";
                frame.referrerPolicy = "strict-origin-when-cross-origin";
                frame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
                frame.setAttribute("allowfullscreen", "");
                wrap.appendChild(frame);
            } else {
                card.setAttribute("role", "button");
                card.setAttribute("tabindex", "0");
                card.setAttribute("aria-label", caption || alt || "Gallery image");

                const img = document.createElement("img");
                img.src = getSafePublicUrl(item.image) || "/images/gallery/team-collaboration.jpg";
                img.alt = alt;
                img.loading = "lazy";
                img.decoding = "async";
                img.width = 600;
                img.height = 400;
                wrap.appendChild(img);

                const zoom = createTextNode("span", "gallery-zoom", "\u2295");
                zoom.setAttribute("aria-hidden", "true");
                wrap.appendChild(zoom);
            }

            card.appendChild(wrap);
            card.appendChild(createTextNode("figcaption", "", caption));
            return card;
        }

        function renderCmsGallery() {
            const grid = document.getElementById("galleryGrid");
            if (!grid || !cmsState.gallery.length) return;
            const gallery = sortCmsItemsForDisplay(cmsState.gallery);
            grid.textContent = "";
            for (let i = 0; i < gallery.length; i++) {
                grid.appendChild(createGalleryCard(gallery[i] || {}, i));
            }
        }

        function createNewsCard(item) {
            const title = getCmsText(item, "title", currentLanguage, "Project update");
            const summary = getCmsText(item, "summary", currentLanguage, "") || getCmsText(item, "content", currentLanguage, "");
            const image = getSafePublicUrl(item.image);
            const url = getSafeExternalUrl(item.url);
            const alt = getCmsText(item, "alt", currentLanguage, "") || title;

            const card = document.createElement("article");
            card.className = "news-card glass-card tilt-card";
            card.setAttribute("data-cms-item", "news");

            if (image) {
                const img = document.createElement("img");
                img.className = "news-cover";
                img.src = image;
                img.alt = alt;
                img.loading = "lazy";
                img.decoding = "async";
                img.width = 640;
                img.height = 360;
                card.appendChild(img);
            }

            card.appendChild(createTextNode("span", "news-date", cleanCmsString(item.year || item.date) || "Update"));
            card.appendChild(createTextNode("h3", "", title));
            if (summary) card.appendChild(createTextNode("p", "", summary));

            if (url) {
                const link = createTextNode("a", "news-link", getUiLabel("readMore", "Read More"));
                link.href = url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                card.appendChild(link);
            } else {
                const button = createTextNode("button", "news-link", getUiLabel("comingSoon", "Coming Soon"));
                button.type = "button";
                button.disabled = true;
                button.setAttribute("aria-disabled", "true");
                button.setAttribute("data-status", "coming-soon");
                card.appendChild(button);
            }

            return card;
        }

        function renderCmsNews() {
            const grid = document.getElementById("newsGrid");
            if (!grid || !cmsState.news.length) return;
            const news = sortCmsItemsForDisplay(cmsState.news);
            grid.textContent = "";
            for (let i = 0; i < news.length; i++) {
                grid.appendChild(createNewsCard(news[i] || {}));
            }
        }

        function getOutputIcon(type) {
            const key = cleanCmsString(type).toLowerCase();
            const icons = {
                brochure: "\uD83D\uDCC4",
                guide: "\uD83D\uDCD8",
                report: "\uD83D\uDCCA",
                presentation: "\uD83D\uDCCA",
                other: "\uD83D\uDCE6"
            };
            return icons[key] || icons.other;
        }

        function createOutputCard(item) {
            const title = getCmsText(item, "title", currentLanguage, "Project output");
            const description = getCmsText(item, "description", currentLanguage, "");
            const file = getSafePublicUrl(item.file);
            const image = getSafePublicUrl(item.image);

            const card = document.createElement("article");
            card.className = "output-card glass-card";
            card.setAttribute("data-cms-item", "output");

            if (image) {
                const img = document.createElement("img");
                img.className = "output-cover";
                img.src = image;
                img.alt = title;
                img.loading = "lazy";
                img.decoding = "async";
                img.width = 640;
                img.height = 420;
                card.appendChild(img);
            }

            card.appendChild(createTextNode("div", "output-icon", getOutputIcon(item.type)));
            card.appendChild(createTextNode("h3", "", title));
            if (description) card.appendChild(createTextNode("p", "", description));

            if (file) {
                const link = createTextNode("a", "btn btn-secondary magnetic", getUiLabel("downloadBtn", "Download"));
                link.href = file;
                if (/^https?:\/\//i.test(file)) {
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                } else {
                    link.setAttribute("download", "");
                }
                card.appendChild(link);
            } else {
                const button = createTextNode("button", "btn btn-secondary", getUiLabel("downloadUnavailable", "Coming Soon"));
                button.type = "button";
                button.disabled = true;
                button.setAttribute("aria-disabled", "true");
                button.setAttribute("data-status", "coming-soon");
                card.appendChild(button);
            }

            return card;
        }

        function renderCmsOutputs() {
            const grid = document.getElementById("outputsGrid");
            if (!grid || !cmsState.outputs.length) return;
            const outputs = sortCmsItemsForDisplay(cmsState.outputs);
            grid.textContent = "";
            for (let i = 0; i < outputs.length; i++) {
                grid.appendChild(createOutputCard(outputs[i] || {}));
            }
        }

        function createFaqItem(item) {
            const question = getCmsText(item, "question", currentLanguage, "Question");
            const answer = getCmsText(item, "answer", currentLanguage, "");
            const details = document.createElement("details");
            details.className = "faq-item glass-card visible";
            details.setAttribute("data-cms-item", "faq");

            const summary = document.createElement("summary");
            summary.appendChild(createTextNode("span", "", question));
            const chevron = createTextNode("span", "faq-chevron", "+");
            chevron.setAttribute("aria-hidden", "true");
            summary.appendChild(chevron);
            details.appendChild(summary);
            if (answer) details.appendChild(createTextNode("p", "", answer));
            return details;
        }

        function renderCmsFaq() {
            const list = document.getElementById("faqList");
            if (!list || !cmsState.faq.length) return;
            const faq = sortCmsItemsForDisplay(cmsState.faq);
            list.textContent = "";
            for (let i = 0; i < faq.length; i++) {
                list.appendChild(createFaqItem(faq[i] || {}));
            }
        }

        function getCmsLogoItems(payload) {
            if (!payload || typeof payload !== "object") return [];
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload.official)) return payload.official;
            if (Array.isArray(payload.items)) return payload.items;
            return [];
        }

        function renderCmsFooterOfficialLogos() {
            const list = document.querySelector(".footer-logos-section .official-logos");
            const items = sortCmsItemsForDisplay(getCmsLogoItems(cmsState.logos));
            if (!list || !items.length) return;

            list.textContent = "";
            for (let i = 0; i < items.length; i++) {
                const item = items[i] || {};
                const src = getSafePublicUrl(item.image);
                if (!src) continue;
                const img = document.createElement("img");
                img.className = "footer-logo official-logo" + (item.wide ? " official-logo-wide" : "");
                img.src = src;
                img.alt = getCmsText(item, "alt", currentLanguage, getCmsText(item, "title", currentLanguage, "Official project logo"));
                img.loading = "lazy";
                img.decoding = "async";
                img.width = item.wide ? 200 : 120;
                img.height = 80;
                list.appendChild(img);
            }
        }

        function renderCmsFooterPartnerLogos() {
            const list = document.querySelector(".footer-partners-section .partner-logos");
            if (!list || !cmsState.partners.length) return;
            const partners = sortCmsItemsForDisplay(cmsState.partners);

            list.textContent = "";
            for (let i = 0; i < partners.length; i++) {
                const item = partners[i] || {};
                const logo = cleanCmsString(item.logo);
                if (!logo) continue;
                const img = document.createElement("img");
                img.className = "footer-logo partner-logo";
                img.src = logo;
                img.alt = getCmsText(item, "school", currentLanguage, getCmsText(item, "country", currentLanguage, "Partner school")) + " logo";
                img.loading = "lazy";
                img.decoding = "async";
                img.width = 140;
                img.height = 80;
                list.appendChild(img);
            }
        }

        function calculateProjectMonths(startDate, endDate) {
            const start = cleanCmsString(startDate);
            const end = cleanCmsString(endDate);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return 0;
            const startParts = start.split("-").map(Number);
            const endParts = end.split("-").map(Number);
            const months = (endParts[0] - startParts[0]) * 12 + (endParts[1] - startParts[1]) + 1;
            return months > 0 ? months : 0;
        }

        function parseProjectDate(value, fallback) {
            const clean = cleanCmsString(value) || fallback;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
            const parts = clean.split("-").map(Number);
            return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
        }

        function formatProjectDate(date) {
            if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
            const locale = currentLanguage === "tr" ? "tr-TR" : "en-GB";
            return date.toLocaleDateString(locale, {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        }

        function updateProjectPulse() {
            const site = cmsState.site && typeof cmsState.site === "object" ? cmsState.site : {};
            const start = parseProjectDate(site.startDate, "2025-09-01");
            const end = parseProjectDate(site.endDate, "2027-08-31");
            if (!start || !end || end <= start) return;

            const now = new Date();
            const total = end.getTime() - start.getTime();
            const elapsed = now.getTime() - start.getTime();
            const percent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
            const dict = getDictionary(currentLanguage);
            const statusKey = percent <= 0
                ? "pulseStatusPlanned"
                : percent >= 100
                    ? "pulseStatusComplete"
                    : "pulseStatusActive";

            const pulse = document.querySelector("[data-project-pulse]");
            const statusNode = document.querySelector("[data-project-status]");
            const datesNode = document.querySelector("[data-project-dates]");
            const valueNode = document.querySelector("[data-project-progress-value]");
            const barNode = document.querySelector("[data-project-progress-bar]");
            const meterNode = barNode ? barNode.closest(".pulse-meter") : null;

            if (statusNode) statusNode.textContent = dict[statusKey] || "";
            if (datesNode) datesNode.textContent = formatProjectDate(start) + " - " + formatProjectDate(end);
            if (valueNode) valueNode.textContent = percent + "%";
            if (barNode) barNode.style.width = percent + "%";
            if (meterNode) {
                meterNode.setAttribute("role", "progressbar");
                meterNode.setAttribute("aria-valuemin", "0");
                meterNode.setAttribute("aria-valuemax", "100");
                meterNode.setAttribute("aria-valuenow", String(percent));
            }
            if (pulse) pulse.setAttribute("aria-label", (dict.pulseLabel || "Project progress") + ": " + percent + "%");
        }

        function setStatValue(labelKey, value) {
            if (!value) return;
            const label = document.querySelector('[data-i18n="' + labelKey + '"]');
            const card = label ? label.closest(".stat-card") : null;
            const number = card ? card.querySelector(".stat-number") : null;
            if (!number) return;
            number.textContent = String(value);
            number.setAttribute("data-target", String(value));
            number.dataset.animated = "true";
        }

        function updateCmsDerivedStats() {
            if (cmsState.partners.length) {
                const countries = [];
                for (let i = 0; i < cmsState.partners.length; i++) {
                    const item = cmsState.partners[i] || {};
                    const key = cleanCmsString(item.countryCode || item.country).toLowerCase();
                    if (key && countries.indexOf(key) === -1) countries.push(key);
                }
                setStatValue("statCountries", countries.length || cmsState.partners.length);
            }

            const site = cmsState.site;
            if (!site || typeof site !== "object") return;
            const months = calculateProjectMonths(site.startDate, site.endDate);
            if (months) setStatValue("statMonths", months);

            const end = cleanCmsString(site.endDate);
            if (/^\d{4}-/.test(end)) setStatValue("statProjectEnd", end.slice(0, 4));
        }

        function bindDynamicCmsCardBehaviors() {
            bindComingSoonActions();
            bindImageFallbacks();
            bindTiltCards();
            bindMagneticButtons();
        }

        function applyCmsNonStructuralDomUpdates() {
            applyCmsDesignSettings();
            renderCmsSections();
            renderCmsPartners();
            renderCmsGallery();
            renderCmsNews();
            renderCmsOutputs();
            renderCmsFaq();
            renderCmsFooterOfficialLogos();
            renderCmsFooterPartnerLogos();
            updateCmsDerivedStats();
            updateProjectPulse();
            bindDynamicCmsCardBehaviors();
        }


        // Gallery resolution:
        //   1. If gallery.json has items, use them as-is. This is the
        //      source of truth and is fully editable from /admin/.
        //   2. If gallery.json is missing or empty, fall back to a
        //      built-in set of three items so the homepage never shows
        //      an empty gallery section.
        //
        // The fallback intentionally mirrors the original launch gallery
        // (Workshop video, Team Collaboration photo, Partner Meetings
        // video) so first-time deploys still look complete.
        function buildGalleryItems(items) {
            const source = Array.isArray(items) ? items : [];
            if (source.length > 0) return source;

            return [
                {
                    type: "youtube",
                    image: "",
                    youtubeUrl: "https://youtu.be/D1fjOEujwgw",
                    caption_en: "Workshop Activities",
                    caption_tr: "Atölye Etkinlikleri",
                    alt: "Workshop activities video for the Upcycling Patterns project",
                    category: "workshops"
                },
                {
                    type: "image",
                    image: "/images/gallery/team-collaboration.jpg",
                    youtubeUrl: "",
                    caption_en: "Team Collaboration",
                    caption_tr: "Ekip İş Birliği",
                    alt: "Team collaboration photo for the Upcycling Patterns project",
                    category: "team"
                },
                {
                    type: "youtube",
                    image: "",
                    youtubeUrl: "https://youtu.be/BSiDfplhAxc",
                    caption_en: "Partner Meetings",
                    caption_tr: "Ortak Toplantıları",
                    alt: "Partner meetings video for the Upcycling Patterns project",
                    category: "meetings"
                }
            ];
        }

        function updateCmsLoadStatus(results) {
            const loadedCount = Array.isArray(results)
                ? results.filter(function (item) { return Boolean(item); }).length
                : 0;
            html.setAttribute("data-cms-status", loadedCount > 0 ? "loaded" : "fallback");
            html.setAttribute("data-cms-loaded-count", String(loadedCount));
        }

        async function loadCmsData() {
            const results = await Promise.all([
                fetchCmsJson(CMS_DATA_PATHS.site),
                fetchCmsJson(CMS_DATA_PATHS.content),
                fetchCmsJson(CMS_DATA_PATHS.logos),
                fetchCmsJson(CMS_DATA_PATHS.design),
                fetchCmsJson(CMS_DATA_PATHS.timeline),
                fetchCmsJson(CMS_DATA_PATHS.mobility),
                fetchCmsJson(CMS_DATA_PATHS.team),
                fetchCmsJson(CMS_DATA_PATHS.sections),
                fetchCmsJson(CMS_DATA_PATHS.partners),
                fetchCmsJson(CMS_DATA_PATHS.gallery),
                fetchCmsJson(CMS_DATA_PATHS.news),
                fetchCmsJson(CMS_DATA_PATHS.outputs),
                fetchCmsJson(CMS_DATA_PATHS.faq)
            ]);
            updateCmsLoadStatus(results);
            cmsState.site = results[0] || null;
            cmsState.content = results[1] && typeof results[1] === "object" ? results[1] : null;
            cmsState.logos = results[2] && typeof results[2] === "object" ? results[2] : null;
            cmsState.design = results[3] && typeof results[3] === "object" ? results[3] : null;
            cmsState.timeline = filterCmsItemsByContent(normalizeCmsItems(results[4]), "timeline");
            cmsState.mobility = filterCmsItemsByContent(normalizeCmsItems(results[5]), "mobility");
            cmsState.team = filterCmsItemsByContent(normalizeCmsItems(results[6]), "team");
            cmsState.sections = results[7] && typeof results[7] === "object" ? results[7] : null;
            cmsState.partners = filterCmsItemsByContent(normalizeCmsItems(results[8]), "partners");
            cmsState.gallery = buildGalleryItems(filterCmsItemsByContent(normalizeCmsItems(results[9]), "gallery"));
            cmsState.news = filterCmsItemsByContent(normalizeCmsItems(results[10]), "news");
            cmsState.outputs = filterCmsItemsByContent(normalizeCmsItems(results[11]), "outputs");
            cmsState.faq = filterCmsItemsByContent(normalizeCmsItems(results[12]), "faq");
            cmsState.loaded = true;

            applyCmsTranslationOverrides();
            applyCmsDesignSettings();
            applyCmsSiteData();
            applyTranslations(currentLanguage, { updateUrl: false, animate: false });
            bindImageFallbacks();
        }


        /*
         * Browser storage can be disabled in private mode or locked-down school
         * devices. These wrappers keep language/theme/cookie preferences useful
         * when storage works and harmless when it does not.
         */
        function safeStorageGet(key) {
            try { return localStorage.getItem(key); } catch (error) { return null; }
        }

        function safeStorageSet(key, value) {
            try { localStorage.setItem(key, value); return true; } catch (error) { return false; }
        }

        function getCurrentLanguage() {
            const path = window.location.pathname.toLowerCase();
            if (path === "/tr" || path.startsWith("/tr/")) return "tr";
            try {
                const urlLang = new URLSearchParams(window.location.search).get("lang");
                if (urlLang && SUPPORTED_LANGS.includes(urlLang.toLowerCase())) return urlLang.toLowerCase();
            } catch (error) {}
            const saved = safeStorageGet(SAFE_LANGUAGE_KEY);
            if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
            const browserLang = ((navigator.language || navigator.userLanguage || "en") + "").toLowerCase();
            return browserLang.startsWith("tr") ? "tr" : DEFAULT_LANGUAGE;
        }

        function getDictionary(lang) {
            return translations[lang] || translations[DEFAULT_LANGUAGE];
        }

        function updateUrlLanguage(lang) {
            if (!window.history || !window.history.replaceState) return;
            try {
                const url = new URL(window.location.href);
                const path = url.pathname.toLowerCase();
                if (path === "/tr" || path.startsWith("/tr/")) return;
                if (lang === "tr") url.searchParams.set("lang", "tr");
                else url.searchParams.delete("lang");
                window.history.replaceState({}, "", url.toString());
            } catch (error) {}
        }

        function setTextSafely(element, value) {
            if (!element || typeof value !== "string") return;
            const btnText = element.querySelector(":scope > .btn-text");
            if (btnText) {
                btnText.textContent = value;
                return;
            }
            if (value.indexOf("\n") !== -1) {
                element.textContent = "";
                const parts = value.split("\n");
                for (let i = 0; i < parts.length; i++) {
                    element.appendChild(document.createTextNode(parts[i]));
                    if (i < parts.length - 1) element.appendChild(document.createElement("br"));
                }
                return;
            }
            element.textContent = value;
        }

        function updateMetaForLanguage(lang) {
            const dict = getDictionary(lang);
            if (pageTitle && dict.pageTitle) pageTitle.textContent = dict.pageTitle;
            if (dict.pageTitle) document.title = dict.pageTitle;
            if (metaDescription && dict.metaDescription) metaDescription.setAttribute("content", dict.metaDescription);
            const ogTitle = document.querySelector('meta[property="og:title"]');
            const ogDescription = document.querySelector('meta[property="og:description"]');
            const ogLocale = document.querySelector('meta[property="og:locale"]');
            const ogLocaleAlt = document.querySelector('meta[property="og:locale:alternate"]');
            const twitterTitle = document.querySelector('meta[name="twitter:title"]');
            const twitterDescription = document.querySelector('meta[name="twitter:description"]');
            if (ogTitle && dict.pageTitle) ogTitle.setAttribute("content", dict.pageTitle);
            if (ogDescription && dict.metaDescription) ogDescription.setAttribute("content", dict.metaDescription);
            if (twitterTitle && dict.pageTitle) twitterTitle.setAttribute("content", dict.pageTitle);
            if (twitterDescription && dict.metaDescription) twitterDescription.setAttribute("content", dict.metaDescription);
            if (ogLocale) ogLocale.setAttribute("content", lang === "tr" ? "tr_TR" : "en_US");
            // og:locale:alternate flips with og:locale so the pair stays correct.
            if (ogLocaleAlt) ogLocaleAlt.setAttribute("content", lang === "tr" ? "en_US" : "tr_TR");
        }

        function applyTranslations(lang, options) {
            options = options || {};
            const nextLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANGUAGE;
            const dict = getDictionary(nextLang);
            currentLanguage = nextLang;
            html.setAttribute("lang", nextLang);
            html.setAttribute("dir", "ltr");
            const i18nNodes = document.querySelectorAll("[data-i18n]");
            for (let i = 0; i < i18nNodes.length; i++) {
                const el = i18nNodes[i];
                const key = el.getAttribute("data-i18n");
                if (!key) continue;
                if (Object.prototype.hasOwnProperty.call(dict, key)) setTextSafely(el, dict[key]);
            }
            const placeholderNodes = document.querySelectorAll("[data-i18n-placeholder]");
            for (let i = 0; i < placeholderNodes.length; i++) {
                const el = placeholderNodes[i];
                const key = el.getAttribute("data-i18n-placeholder");
                if (!key) continue;
                if (Object.prototype.hasOwnProperty.call(dict, key)) el.setAttribute("placeholder", dict[key]);
            }
            for (let i = 0; i < langButtons.length; i++) {
                const button = langButtons[i];
                const isActive = button.dataset.lang === nextLang;
                button.classList.toggle("active", isActive);
                button.setAttribute("aria-pressed", String(isActive));
            }
            const themeBtn = document.getElementById("themeToggle");
            if (themeBtn) {
                const isDark = html.getAttribute("data-theme") === "dark";
                themeBtn.setAttribute("aria-label", isDark ? dict.themeToLight : dict.themeToDark);
            }
            updateMetaForLanguage(nextLang);
            if (cmsState.loaded) applyCmsSeoMedia();
            updateProjectPulse();
            safeStorageSet(SAFE_LANGUAGE_KEY, nextLang);
            if (cmsState.loaded) applyCmsNonStructuralDomUpdates();
            if (options.updateUrl) updateUrlLanguage(nextLang);
            if (!prefersReducedMotion && options.animate !== false) {
                body.style.transition = "opacity 0.25s ease";
                body.style.opacity = "0.92";
                window.setTimeout(function () {
                    body.style.opacity = "1";
                    window.setTimeout(function () { body.style.transition = ""; }, 260);
                }, 90);
            }
        }

        function bindLanguageSwitcher() {
            for (let i = 0; i < langButtons.length; i++) {
                (function (button) {
                    button.addEventListener("click", function () {
                        const nextLang = button.dataset.lang;
                        if (!SUPPORTED_LANGS.includes(nextLang)) return;
                        applyTranslations(nextLang, { updateUrl: true, animate: true });
                    });
                })(langButtons[i]);
            }
            window.addEventListener("storage", function (event) {
                if (event.key !== SAFE_LANGUAGE_KEY) return;
                const v = event.newValue;
                if (v && SUPPORTED_LANGS.includes(v) && v !== currentLanguage) applyTranslations(v, { updateUrl: false, animate: false });
            });
        }

        /*
         * Sanitizers remove control characters and angle brackets before any
         * contact-form value is sent. The site does not render submitted values,
         * but cleaning them still protects downstream email/webhook tools.
         */
        function sanitizeText(value, maxLength) {
            if (typeof value !== "string") return "";
            return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
        }

        function sanitizeMultilineText(value, maxLength) {
            if (typeof value !== "string") return "";
            return value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").replace(/[<>]/g, "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, maxLength);
        }

        function isValidEmail(value) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= MAX_EMAIL_LENGTH;
        }

        function setStatusMessage(message, isError) {
            if (!formStatus) return;
            formStatus.textContent = message || "";
            // Use CSS classes so dark mode can restyle these via stylesheet.
            // Removed inline color so the design system stays in control.
            formStatus.classList.toggle("error", Boolean(isError));
            formStatus.classList.toggle("success", Boolean(message) && !isError);
        }

        // validateForm returns either false (validation failed) or an object
        // with the sanitized values ready to send. We deliberately do NOT
        // write the sanitized values back into the input fields — that would
        // move the user's cursor while they are typing or correcting a
        // mistake. The original field values stay untouched; the submission
        // path (handleContactSubmit) uses the sanitized object below.
        function validateForm() {
            const dict = getDictionary(currentLanguage);
            if (!contactForm || !nameInput || !emailInput || !subjectInput || !messageInput) return false;

            const name = sanitizeText(nameInput.value, MAX_NAME_LENGTH);
            const email = sanitizeText(emailInput.value, MAX_EMAIL_LENGTH);
            const subject = sanitizeText(subjectInput.value, MAX_SUBJECT_LENGTH);
            const message = sanitizeMultilineText(messageInput.value, MAX_MESSAGE_LENGTH);

            if (honeypotInput) {
                const botFilled = honeypotInput.type === "checkbox" ? honeypotInput.checked : honeypotInput.value.trim() !== "";
                if (botFilled) {
                    setStatusMessage(dict.formError, true);
                    return false;
                }
            }
            if (!name || !email || !subject || !message) {
                setStatusMessage(dict.formError, true);
                if (!name) nameInput.focus();
                else if (!email) emailInput.focus();
                else if (!subject) subjectInput.focus();
                else messageInput.focus();
                return false;
            }
            if (name.length < 2) {
                setStatusMessage(dict.formError, true);
                nameInput.focus();
                return false;
            }
            if (!isValidEmail(email)) {
                setStatusMessage(dict.formEmailError, true);
                emailInput.setAttribute("aria-invalid", "true");
                emailInput.focus();
                return false;
            }
            emailInput.removeAttribute("aria-invalid");
            if (message.length < 10) {
                setStatusMessage(dict.formTooShortError, true);
                messageInput.focus();
                return false;
            }
            return { name: name, email: email, subject: subject, message: message };
        }

        function getFormAccessKey() {
            if (!contactForm) return "";
            const hiddenKey = contactForm.querySelector('input[name="access_key"]');
            const keyFromInput = hiddenKey ? hiddenKey.value.trim() : "";
            const keyFromData = (contactForm.getAttribute("data-access-key") || "").trim();
            const key = keyFromInput || keyFromData;
            if (!key || key === "YOUR_WEB3FORMS_ACCESS_KEY") return "";
            return key;
        }

        function fallbackToMailto() {
            if (!contactForm || !nameInput || !emailInput || !subjectInput || !messageInput) return;
            const fallbackEmail = contactForm.getAttribute("data-fallback-email") || "upcyclingpatterns@gmail.com";
            const defaultSubject = currentLanguage === "tr"
                ? "Upcycling Patterns web sitesinden mesaj"
                : "Message from Upcycling Patterns website";
            const subject = encodeURIComponent(subjectInput.value || defaultSubject);
            const body = encodeURIComponent(
                (currentLanguage === "tr" ? "Ad" : "Name") + ": " + nameInput.value + "\n" +
                (currentLanguage === "tr" ? "E-posta" : "Email") + ": " + emailInput.value + "\n\n" +
                (currentLanguage === "tr" ? "Mesaj" : "Message") + ":\n" + messageInput.value
            );
            window.location.href = "mailto:" + fallbackEmail + "?subject=" + subject + "&body=" + body;
        }

        function setSubmitState(isSubmitting) {
            if (!submitBtn) return;
            submitBtn.disabled = Boolean(isSubmitting);
            submitBtn.setAttribute("aria-busy", String(Boolean(isSubmitting)));
            const dict = getDictionary(currentLanguage);
            const label = submitBtn.querySelector("[data-i18n]") || submitBtn.querySelector("span");
            if (label) label.textContent = isSubmitting ? dict.formSending : dict.formSubmitBtn;
        }

        async function handleContactSubmit(event) {
            event.preventDefault();
            const dict = getDictionary(currentLanguage);

            const clean = validateForm();
            if (!clean) return;

            const now = Date.now();
            if (now - pageLoadTime < MIN_TIME_ON_PAGE_MS) {
                setStatusMessage(dict.formCooldownError, true);
                return;
            }
            if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
                setStatusMessage(dict.formCooldownError, true);
                return;
            }
            lastSubmitTime = now;
            const accessKey = getFormAccessKey();
            if (!accessKey) {
                setStatusMessage(dict.formMissingKey, true);
                window.setTimeout(fallbackToMailto, 700);
                return;
            }
            setSubmitState(true);
            setStatusMessage(dict.formSending, false);
            try {
                const formData = new FormData(contactForm);
                // Use sanitized values, not the raw field values. This stops
                // any junk control characters or stray HTML from being sent.
                formData.set("access_key", accessKey);
                formData.set("name", clean.name);
                formData.set("email", clean.email);
                formData.set("user_subject", clean.subject);
                formData.set("message", clean.message);
                formData.set("language", currentLanguage);
                formData.set("page_url", window.location.href);
                const response = await fetch(contactForm.action, { method: "POST", body: formData, headers: { Accept: "application/json" } });
                const result = await response.json().catch(function () { return {}; });
                if (!response.ok || result.success === false) throw new Error(result.message || "Form submission failed");
                setStatusMessage(dict.formSuccess, false);
                contactForm.reset();
            } catch (error) {
                setStatusMessage(dict.formNetworkError, true);
                window.setTimeout(fallbackToMailto, 900);
            } finally {
                setSubmitState(false);
            }
        }

        function bindContactForm() {
            if (!contactForm) return;
            contactForm.addEventListener("submit", handleContactSubmit);
        }

        function bindEmailLinks() {
            const links = document.querySelectorAll("a.email-link");
            for (let i = 0; i < links.length; i++) {
                const link = links[i];
                const user = link.getAttribute("data-user");
                const domain = link.getAttribute("data-domain");
                if (!user || !domain) continue;
                const address = user + "@" + domain;
                link.setAttribute("href", "mailto:" + address);
                const display = link.querySelector(".email-display");
                if (display) display.textContent = address;
            }
        }

        function bindFooterLegalToggle() {
            const toggle = document.getElementById("footerLegalToggle");
            const panel = document.getElementById("footerLegalPanel");
            if (!toggle || !panel) return;

            function setLegalPanel(open) {
                toggle.setAttribute("aria-expanded", open ? "true" : "false");
                toggle.classList.toggle("active", open);
                panel.hidden = !open;
            }

            setLegalPanel(false);
            toggle.addEventListener("click", function () {
                setLegalPanel(toggle.getAttribute("aria-expanded") !== "true");
            });
        }

        function isMobile() {
            return window.innerWidth <= 960;
        }

        function openMenu() {
            if (!navMenu || !menuToggle) return;
            navMenu.classList.add("open");
            menuToggle.classList.add("active");
            menuToggle.setAttribute("aria-expanded", "true");
            if (isMobile()) body.style.overflow = "hidden";
            const firstLink = navMenu.querySelector(".nav-link");
            if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 180);
        }

        function closeMenu() {
            if (!navMenu || !menuToggle) return;
            navMenu.classList.remove("open");
            menuToggle.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            body.style.overflow = "";
        }

        function toggleMenu() {
            if (!navMenu) return;
            if (navMenu.classList.contains("open")) closeMenu();
            else openMenu();
        }

        function bindMenuBehavior() {
            if (!menuToggle || !navMenu) return;
            menuToggle.addEventListener("click", toggleMenu);
            document.addEventListener("click", function (event) {
                if (navMenu.classList.contains("open") && !navMenu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
            });
            document.addEventListener("keydown", function (event) {
                if (event.key === "Escape" && navMenu.classList.contains("open")) {
                    closeMenu();
                    menuToggle.focus();
                }
            });
            for (let i = 0; i < navLinks.length; i++) {
                navLinks[i].addEventListener("click", function () { if (isMobile()) closeMenu(); });
            }
            window.addEventListener("resize", throttle(function () { if (!isMobile()) body.style.overflow = ""; }, 150), { passive: true });
        }

        function handleHeaderScroll() {
            if (!header) return;
            header.classList.toggle("scrolled", window.scrollY > 20);
        }

        function updateActiveNav() {
            let current = "";
            const marker = window.scrollY + window.innerHeight * 0.35;
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const top = section.offsetTop;
                const bottom = top + section.offsetHeight;
                if (marker >= top && marker < bottom) current = section.id || "";
            }
            for (let i = 0; i < navLinks.length; i++) {
                const link = navLinks[i];
                const href = link.getAttribute("href") || "";
                const isActive = href === "#" + current || (!current && href === "#home");
                link.classList.toggle("active", isActive);
                if (isActive) link.setAttribute("aria-current", "page");
                else link.removeAttribute("aria-current");
            }
        }

        function updateScrollProgress() {
            if (!scrollProgressBar) return;
            const scrollTop = window.scrollY || window.pageYOffset;
            const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
            const scrollable = Math.max(docHeight - window.innerHeight, 1);
            const percent = Math.min(Math.max((scrollTop / scrollable) * 100, 0), 100);
            scrollProgressBar.style.width = percent + "%";
            if (scrollProgress) {
                scrollProgress.setAttribute("aria-valuenow", String(Math.round(percent)));
                scrollProgress.style.opacity = scrollTop > 10 ? "1" : "0.9";
            }
        }

        function bindBackToTop() {
            if (!backToTop) return;
            backToTop.addEventListener("click", function () {
                window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
            });
        }

        function updateBackToTop() {
            if (!backToTop) return;
            backToTop.classList.toggle("visible", window.scrollY > 500);
        }

        function bindAnchorScroll() {
            const anchors = document.querySelectorAll('a[href^="#"]');
            for (let i = 0; i < anchors.length; i++) {
                const anchor = anchors[i];
                anchor.addEventListener("click", function (event) {
                    const href = anchor.getAttribute("href");
                    if (!href || href === "#") return;
                    let target = null;
                    try { target = document.querySelector(href); } catch (error) { return; }
                    if (!target) return;
                    event.preventDefault();
                    const offset = header ? header.offsetHeight + 18 : 0;
                    const top = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top: top, behavior: prefersReducedMotion ? "auto" : "smooth" });
                    if (history && history.pushState) history.pushState(null, "", href);
                });
            }
        }

        function animateCounter(element) {
            if (!element || element.dataset.animated === "true") return;
            const target = parseInt(element.getAttribute("data-target") || element.textContent, 10);
            if (!Number.isFinite(target)) return;
            if (prefersReducedMotion) {
                element.textContent = String(target);
                element.dataset.animated = "true";
                return;
            }
            const duration = 1600;
            const start = performance.now();
            function step(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = String(Math.floor(target * eased));
                if (progress < 1) requestAnimationFrame(step);
                else {
                    element.textContent = String(target);
                    element.dataset.animated = "true";
                }
            }
            requestAnimationFrame(step);
        }

        function bindRevealAnimations() {
            const revealItems = document.querySelectorAll(".reveal-item");
            const statNumbers = document.querySelectorAll(".stat-number[data-target]");
            if (!("IntersectionObserver" in window)) {
                for (let i = 0; i < revealItems.length; i++) revealItems[i].classList.add("visible");
                for (let i = 0; i < statNumbers.length; i++) animateCounter(statNumbers[i]);
                return;
            }
            const revealObserver = new IntersectionObserver(function (entries, observer) {
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    if (!entry.isIntersecting) continue;
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            }, { threshold: 0.14, rootMargin: "0px 0px -60px 0px" });
            for (let i = 0; i < revealItems.length; i++) revealObserver.observe(revealItems[i]);
            const counterObserver = new IntersectionObserver(function (entries, observer) {
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    if (!entry.isIntersecting) continue;
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            }, { threshold: 0.45 });
            for (let i = 0; i < statNumbers.length; i++) counterObserver.observe(statNumbers[i]);
        }

        function bindTabs() {
            const tabWrappers = document.querySelectorAll(".tabs-wrapper");
            for (let w = 0; w < tabWrappers.length; w++) {
                const wrapper = tabWrappers[w];
                const tabButtons = Array.prototype.slice.call(wrapper.querySelectorAll(".tab-btn"));
                const panels = Array.prototype.slice.call(wrapper.querySelectorAll(".tab-panel"));
                const indicator = wrapper.querySelector(".tab-indicator");
                const tabsNav = wrapper.querySelector(".tabs-nav");
                if (!tabButtons.length || !panels.length) continue;
                function moveIndicator(targetButton) {
                    if (!indicator || !targetButton || !tabsNav) return;
                    const navRect = tabsNav.getBoundingClientRect();
                    const buttonRect = targetButton.getBoundingClientRect();
                    const offsetX = buttonRect.left - navRect.left + tabsNav.scrollLeft;
                    indicator.style.width = buttonRect.width + "px";
                    indicator.style.transform = "translateX(" + (offsetX - 8) + "px)";
                }
                function activateTab(targetButton, focusPanel) {
                    if (!targetButton) return;
                    const targetTab = targetButton.dataset.tab;
                    const targetPanel = wrapper.querySelector("#panel-" + targetTab);
                    if (!targetTab || !targetPanel) return;
                    for (let i = 0; i < tabButtons.length; i++) {
                        const button = tabButtons[i];
                        const isActive = button === targetButton;
                        button.classList.toggle("active", isActive);
                        button.setAttribute("aria-selected", String(isActive));
                        button.setAttribute("tabindex", isActive ? "0" : "-1");
                    }
                    for (let i = 0; i < panels.length; i++) {
                        const panel = panels[i];
                        const isActive = panel === targetPanel;
                        panel.classList.toggle("active", isActive);
                        panel.hidden = !isActive;
                    }
                    moveIndicator(targetButton);
                    if (focusPanel) targetPanel.focus({ preventScroll: true });
                }
                for (let i = 0; i < tabButtons.length; i++) {
                    (function (button) {
                        button.addEventListener("click", function () { activateTab(button, false); });
                        button.addEventListener("keydown", function (event) {
                            const currentIndex = tabButtons.indexOf(button);
                            let nextButton = null;
                            if (event.key === "ArrowRight") nextButton = tabButtons[(currentIndex + 1) % tabButtons.length];
                            else if (event.key === "ArrowLeft") nextButton = tabButtons[(currentIndex - 1 + tabButtons.length) % tabButtons.length];
                            else if (event.key === "Home") nextButton = tabButtons[0];
                            else if (event.key === "End") nextButton = tabButtons[tabButtons.length - 1];
                            if (nextButton) {
                                event.preventDefault();
                                activateTab(nextButton, false);
                                nextButton.focus();
                            }
                        });
                    })(tabButtons[i]);
                }
                const activeButton = wrapper.querySelector(".tab-btn.active") || tabButtons[0];
                requestAnimationFrame(function () {
                    activateTab(activeButton, false);
                    moveIndicator(activeButton);
                });
                window.addEventListener("resize", debounce(function () {
                    const current = wrapper.querySelector(".tab-btn.active") || activeButton;
                    moveIndicator(current);
                }, 120), { passive: true });
                if (tabsNav) {
                    tabsNav.addEventListener("scroll", throttle(function () {
                        const current = wrapper.querySelector(".tab-btn.active") || activeButton;
                        moveIndicator(current);
                    }, 80), { passive: true });
                }
            }
        }

        function bindMagneticButtons() {
            if (prefersReducedMotion || isTouchDevice) return;
            const elements = document.querySelectorAll(".magnetic");
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (element.dataset.magneticBound === "true") continue;
                element.dataset.magneticBound = "true";
                element.addEventListener("mousemove", function (event) {
                    const rect = element.getBoundingClientRect();
                    const x = event.clientX - rect.left - rect.width / 2;
                    const y = event.clientY - rect.top - rect.height / 2;
                    const strength = 0.22;
                    element.style.transform = "translate(" + (x * strength) + "px, " + (y * strength) + "px)";
                });
                element.addEventListener("mouseleave", function () { element.style.transform = ""; });
            }
        }

        function bindTiltCards() {
            if (prefersReducedMotion || isTouchDevice) return;
            const cards = document.querySelectorAll(".tilt-card");
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                if (card.dataset.tiltBound === "true") continue;
                card.dataset.tiltBound = "true";
                card.style.transformStyle = "preserve-3d";
                card.style.willChange = "transform";
                card.addEventListener("mousemove", function (event) {
                    const rect = card.getBoundingClientRect();
                    const x = (event.clientX - rect.left) / rect.width;
                    const y = (event.clientY - rect.top) / rect.height;
                    const rotateX = (0.5 - y) * 6;
                    const rotateY = (x - 0.5) * 6;
                    card.style.transform = "perspective(1000px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-6px)";
                });
                card.addEventListener("mouseleave", function () { card.style.transform = ""; });
            }
        }

        function bindCursorGlow() {
            if (!cursorGlow || prefersReducedMotion || isTouchDevice) {
                if (cursorGlow) cursorGlow.style.display = "none";
                return;
            }
            let mouseX = window.innerWidth / 2;
            let mouseY = window.innerHeight / 2;
            let currentX = mouseX;
            let currentY = mouseY;
            window.addEventListener("mousemove", function (event) {
                mouseX = event.clientX;
                mouseY = event.clientY;
            }, { passive: true });
            function animateGlow() {
                currentX += (mouseX - currentX) * 0.12;
                currentY += (mouseY - currentY) * 0.12;
                cursorGlow.style.transform = "translate(" + (currentX - 140) + "px, " + (currentY - 140) + "px)";
                requestAnimationFrame(animateGlow);
            }
            animateGlow();
        }

        function bindComingSoonActions() {
            const items = document.querySelectorAll('[data-status="coming-soon"]');
            for (let i = 0; i < items.length; i++) {
                if (items[i].dataset.comingSoonBound === "true") continue;
                items[i].dataset.comingSoonBound = "true";
                items[i].addEventListener("click", function (event) {
                    event.preventDefault();
                    const dict = getDictionary(currentLanguage);
                    setStatusMessage(dict.formDisabledMessage, false);
                });
            }
        }

        function bindCountryHotspots() {
            // Country hotspot buttons were intentionally removed from the hero.
            // Keep this no-op function so older cached HTML does not break if it
            // still contains hotspot markup while the new script is already live.
        }

        function bindImageFallbacks() {
            const images = document.querySelectorAll("img");
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                if (img.dataset.fallbackBound === "true") continue;
                img.dataset.fallbackBound = "true";
                img.addEventListener("error", function () {
                    img.classList.add("image-missing");
                    const parent = img.closest(".cms-card-image-wrap, .gallery-card, .hero-visual, .brand, figure");
                    if (parent) parent.classList.add("has-missing-image");
                });
            }
        }

        function bindThemeToggle() {
            const themeBtn = document.getElementById("themeToggle");
            const savedTheme = safeStorageGet(SAFE_THEME_KEY);
            const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            const initialTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : (prefersDark ? "dark" : "light");
            html.setAttribute("data-theme", initialTheme);
            if (themeBtn) {
                themeBtn.setAttribute("aria-pressed", initialTheme === "dark" ? "true" : "false");
                themeBtn.addEventListener("click", function () {
                    const current = html.getAttribute("data-theme") === "dark" ? "dark" : "light";
                    const next = current === "dark" ? "light" : "dark";
                    html.setAttribute("data-theme", next);
                    safeStorageSet(SAFE_THEME_KEY, next);
                    themeBtn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
                    const dict = getDictionary(currentLanguage);
                    themeBtn.setAttribute("aria-label", next === "dark" ? dict.themeToLight : dict.themeToDark);
                });
            }
            window.addEventListener("storage", function (event) {
                if (event.key !== SAFE_THEME_KEY) return;
                if (event.newValue === "dark" || event.newValue === "light") {
                    html.setAttribute("data-theme", event.newValue);
                    if (themeBtn) themeBtn.setAttribute("aria-pressed", event.newValue === "dark" ? "true" : "false");
                }
            });

            // Follow the system theme automatically as long as the user has
            // not explicitly chosen one. Once they click the toggle, their
            // saved preference wins and the system change is ignored.
            if (window.matchMedia) {
                const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
                const onSystemThemeChange = function (e) {
                    const userPick = safeStorageGet(SAFE_THEME_KEY);
                    if (userPick === "dark" || userPick === "light") return;
                    const next = e.matches ? "dark" : "light";
                    html.setAttribute("data-theme", next);
                    if (themeBtn) themeBtn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
                };
                if (typeof systemDark.addEventListener === "function") {
                    systemDark.addEventListener("change", onSystemThemeChange);
                } else if (typeof systemDark.addListener === "function") {
                    // Safari < 14 fallback
                    systemDark.addListener(onSystemThemeChange);
                }
            }
        }

        function bindLoader() {
            if (!pageLoader) return;
            let loaderHidden = false;
            const hideLoader = function () {
                if (loaderHidden) return;
                loaderHidden = true;
                pageLoader.classList.add("hidden");
                pageLoader.setAttribute("aria-hidden", "true");
                window.setTimeout(function () {
                    if (pageLoader && pageLoader.parentNode) pageLoader.parentNode.removeChild(pageLoader);
                }, 800);
            };
            // External fonts or embeds must never leave the page covered by the
            // loader. The application is already interactive when boot() runs.
            window.setTimeout(hideLoader, 900);
            if (document.readyState === "complete") window.setTimeout(hideLoader, 150);
            else window.addEventListener("load", function () { window.setTimeout(hideLoader, 150); }, { once: true });
        }

        function throttle(fn, wait) {
            let lastTime = 0;
            let rafId = null;
            return function throttled() {
                const args = arguments;
                const ctx = this;
                const now = Date.now();
                if (now - lastTime >= wait) {
                    lastTime = now;
                    fn.apply(ctx, args);
                    return;
                }
                if (!rafId) {
                    rafId = requestAnimationFrame(function () {
                        rafId = null;
                        lastTime = Date.now();
                        fn.apply(ctx, args);
                    });
                }
            };
        }

        function debounce(fn, wait) {
            let timeoutId = null;
            return function debounced() {
                const args = arguments;
                const ctx = this;
                window.clearTimeout(timeoutId);
                timeoutId = window.setTimeout(function () {
                    fn.apply(ctx, args);
                }, wait);
            };
        }

        function bindScrollHandlers() {
            const onScroll = throttle(function () {
                handleHeaderScroll();
                updateActiveNav();
                updateScrollProgress();
                updateBackToTop();
            }, 60);
            window.addEventListener("scroll", onScroll, { passive: true });
            window.addEventListener("resize", debounce(function () {
                updateActiveNav();
                updateScrollProgress();
            }, 120), { passive: true });
            onScroll();
        }

        function bindCookieBanner() {
            const banner = document.getElementById("cookieBanner");
            const acceptBtn = document.getElementById("cookieAccept");
            if (!banner || !acceptBtn) return;
            const dismissed = safeStorageGet(COOKIE_CONSENT_KEY) === "true";
            if (!dismissed) {
                banner.hidden = false;
                window.setTimeout(function () { banner.classList.add("is-visible"); }, 500);
            }
            acceptBtn.addEventListener("click", function () {
                banner.classList.remove("is-visible");
                safeStorageSet(COOKIE_CONSENT_KEY, "true");
                window.setTimeout(function () { banner.hidden = true; }, 600);
            });
        }

        function bindLightbox() {
            if (galleryLightboxBound) return;
            galleryLightboxBound = true;

            const lightbox = document.getElementById("lightbox");
            const lightboxImg = document.getElementById("lightboxImage");
            const lightboxCaption = document.getElementById("lightboxCaption");
            const lightboxCounter = document.getElementById("lightboxCounter");
            const closeBtn = document.getElementById("lightboxClose");
            const prevBtn = document.getElementById("lightboxPrev");
            const nextBtn = document.getElementById("lightboxNext");

            if (!lightbox || !lightboxImg) return;

            let currentIndex = 0;
            let lastActiveElement = null;
            let lightboxVideoFrame = document.getElementById("lightboxVideoFrame");

            function getVisibleGalleryCards() {
                // The lightbox only handles image cards. Video cards stay in
                // their YouTube iframe and are not part of the lightbox set.
                return Array.prototype.slice.call(document.querySelectorAll(".gallery-card")).filter(function (card) {
                    if (!card || card.hidden) return false;
                    if (card.style.display === "none") return false;
                    if (card.getAttribute("aria-hidden") === "true") return false;
                    if (card.getAttribute("data-gallery-type") === "youtube") return false;
                    if (card.classList.contains("is-video-card")) return false;
                    return true;
                });
            }

            function ensureVideoFrame() {
                if (lightboxVideoFrame) return lightboxVideoFrame;

                lightboxVideoFrame = document.createElement("iframe");
                lightboxVideoFrame.id = "lightboxVideoFrame";
                lightboxVideoFrame.title = "Project video";
                lightboxVideoFrame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
                lightboxVideoFrame.setAttribute("allowfullscreen", "");
                lightboxVideoFrame.setAttribute("loading", "lazy");
                lightboxVideoFrame.style.display = "none";
                lightboxVideoFrame.style.width = "min(92vw, 980px)";
                lightboxVideoFrame.style.aspectRatio = "16 / 9";
                lightboxVideoFrame.style.border = "0";
                lightboxVideoFrame.style.borderRadius = "24px";
                lightboxVideoFrame.style.background = "#000";
                lightboxVideoFrame.style.boxShadow = "0 26px 80px rgba(0, 0, 0, 0.34)";

                lightboxImg.insertAdjacentElement("afterend", lightboxVideoFrame);
                return lightboxVideoFrame;
            }

            function getCardData(card) {
                if (!card) return null;

                const img = card.querySelector("img");
                const cap = card.querySelector("figcaption, .gallery-caption, [data-gallery-caption]");
                const youtubeUrl = card.getAttribute("data-youtube-url") || "";
                const embedUrl = card.getAttribute("data-youtube-embed") || getYoutubeEmbedUrl(youtubeUrl);
                const isYoutube = (card.getAttribute("data-gallery-type") || "").toLowerCase() === "youtube" || Boolean(embedUrl);

                return {
                    type: isYoutube ? "youtube" : "image",
                    src: img ? img.getAttribute("src") : "",
                    alt: img ? (img.getAttribute("alt") || "") : "",
                    caption: cap ? cap.textContent.trim() : "",
                    youtubeUrl: youtubeUrl,
                    embedUrl: embedUrl,
                    card: card
                };
            }

            function getFocusable() {
                return Array.prototype.slice.call(lightbox.querySelectorAll('button:not([disabled]), iframe, [href], [tabindex]:not([tabindex="-1"])'));
            }

            function clearVideoFrame() {
                const frame = ensureVideoFrame();
                frame.setAttribute("src", "");
                frame.style.display = "none";
            }

            function showItem(index) {
                const cards = getVisibleGalleryCards();
                if (!cards.length) return;

                if (index < 0) index = cards.length - 1;
                if (index >= cards.length) index = 0;

                currentIndex = index;

                const item = getCardData(cards[index]);
                if (!item) return;

                if (item.type === "youtube") {
                    const frame = ensureVideoFrame();
                    lightboxImg.style.display = "none";
                    lightboxImg.setAttribute("src", "");
                    frame.style.display = "block";
                    frame.setAttribute("src", item.embedUrl);
                    frame.setAttribute("title", item.caption || item.alt || "Project video");
                    if (lightboxCaption) lightboxCaption.textContent = item.caption || item.alt || "";
                } else {
                    clearVideoFrame();
                    lightboxImg.style.display = "";
                    lightboxImg.setAttribute("src", item.src || "");
                    lightboxImg.setAttribute("alt", item.alt || "");
                    if (lightboxCaption) lightboxCaption.textContent = item.caption || "";
                }

                if (lightboxCounter) lightboxCounter.textContent = (index + 1) + " / " + cards.length;
                if (prevBtn) prevBtn.disabled = cards.length <= 1;
                if (nextBtn) nextBtn.disabled = cards.length <= 1;
            }

            function openLightbox(index, origin) {
                const cards = getVisibleGalleryCards();
                if (!cards.length) return;

                lastActiveElement = origin || document.activeElement;
                showItem(index);

                lightbox.hidden = false;
                window.requestAnimationFrame(function () {
                    lightbox.classList.add("is-visible");
                });

                document.body.style.overflow = "hidden";
                if (closeBtn) closeBtn.focus();
                document.addEventListener("keydown", handleKey);
            }

            function closeLightbox() {
                lightbox.classList.remove("is-visible");
                document.body.style.overflow = "";
                document.removeEventListener("keydown", handleKey);

                window.setTimeout(function () {
                    lightbox.hidden = true;
                    clearVideoFrame();
                    lightboxImg.style.display = "";
                    lightboxImg.setAttribute("src", "");
                    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
                        lastActiveElement.focus();
                    }
                }, 400);
            }

            function trapFocus(event) {
                const focusable = getFocusable();
                if (!focusable.length) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (event.shiftKey) {
                    if (document.activeElement === first || !lightbox.contains(document.activeElement)) {
                        event.preventDefault();
                        last.focus();
                    }
                } else if (document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }

            function handleKey(event) {
                switch (event.key) {
                    case "Escape":
                        closeLightbox();
                        break;
                    case "ArrowLeft":
                        showItem(currentIndex - 1);
                        break;
                    case "ArrowRight":
                        showItem(currentIndex + 1);
                        break;
                    case "Tab":
                        trapFocus(event);
                        break;
                }
            }

            document.addEventListener("click", function (event) {
                const card = event.target.closest ? event.target.closest(".gallery-card") : null;
                if (!card || card.hidden || card.style.display === "none") return;

                // Video cards use their own YouTube iframe; don't hijack click.
                if (card.getAttribute("data-gallery-type") === "youtube" ||
                    card.classList.contains("is-video-card")) return;

                const cards = getVisibleGalleryCards();
                const index = cards.indexOf(card);
                if (index === -1) return;

                openLightbox(index, card);
            });

            document.addEventListener("keydown", function (event) {
                if (event.key !== "Enter" && event.key !== " ") return;

                const card = event.target && event.target.closest ? event.target.closest(".gallery-card") : null;
                if (!card || card.hidden || card.style.display === "none") return;

                // Video cards skip the lightbox.
                if (card.getAttribute("data-gallery-type") === "youtube" ||
                    card.classList.contains("is-video-card")) return;

                const cards = getVisibleGalleryCards();
                const index = cards.indexOf(card);
                if (index === -1) return;

                event.preventDefault();
                openLightbox(index, card);
            });

            if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
            if (prevBtn) prevBtn.addEventListener("click", function () { showItem(currentIndex - 1); });
            if (nextBtn) nextBtn.addEventListener("click", function () { showItem(currentIndex + 1); });
            lightbox.addEventListener("click", function (event) {
                if (event.target === lightbox) closeLightbox();
            });
        }

        function bindFormConsent() {
            const checkbox = document.getElementById("formConsent");
            if (!contactForm || !checkbox) return;
            contactForm.addEventListener("submit", function (event) {
                if (!checkbox.checked) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    const dict = getDictionary(currentLanguage);
                    setStatusMessage(dict.formConsentRequired, true);
                    checkbox.focus();
                }
            }, true);
        }

        function registerServiceWorker() {
            if (!("serviceWorker" in navigator)) return;
            if (!/^https?:$/.test(window.location.protocol)) return;
            const register = function () {
                navigator.serviceWorker.register("/sw.js").catch(function (error) {
                    if (window.console && console.warn) {
                        console.warn("[PWA] Service worker registration skipped:", error);
                    }
                });
            };
            // Registration should not depend on unrelated third-party resources
            // completing the window load event.
            window.setTimeout(register, 0);
        }

        function init() {
            applyTranslations(currentLanguage, { updateUrl: false, animate: false });
            bindLoader();
            bindThemeToggle();
            bindLanguageSwitcher();
            bindEmailLinks();
            bindFooterLegalToggle();
            bindMenuBehavior();
            bindAnchorScroll();
            bindTabs();
            bindRevealAnimations();
            bindBackToTop();
            bindScrollHandlers();
            bindFormConsent();
            bindContactForm();
            bindMagneticButtons();
            bindTiltCards();
            bindCursorGlow();
            bindComingSoonActions();
            bindCountryHotspots();
            bindImageFallbacks();
            bindLightbox();
            bindCookieBanner();
            registerServiceWorker();
            loadCmsData();
            body.classList.add("is-ready");
        }

        init();
    }
})();
