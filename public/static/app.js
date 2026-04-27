/* =====================================================
   UniWay — Career Platform for Kazakhstan Students
   Main Application JavaScript (Single Page App)
   ===================================================== */

// ===== STATE MANAGEMENT =====
const State = {
  currentPage: 'home',
  currentUser: null,
  currentRole: null, // 'student' | 'company' | 'admin'
  lang: 'ru',
  tasks: [],
  notifications: [],
  // Per-user data cache (loaded from API)
  userStats: null,
  userSubmissions: [],
  userInterviews: [],
  adminUsers: [],
  adminStats: null,
  dataLoaded: false,
};

// ===== TRANSLATIONS =====
const T = {
  ru: {
    nav_home: 'Главная', nav_catalog: 'Задания', nav_companies: 'Компании',
    nav_about: 'О нас', nav_login: 'Войти', nav_register: 'Регистрация',
    nav_dashboard: 'Личный кабинет', nav_logout: 'Выйти',
    hero_tag: '🇰🇿 Для студентов Казахстана',
    hero_title: 'Твой первый шаг в карьеру',
    hero_subtitle: 'Выполняй реальные тестовые задания, готовься к собеседованиям с AI и создавай резюме с доказанными навыками',
    hero_cta1: 'Начать бесплатно', hero_cta2: 'Смотреть задания',
    hero_stat1: 'Студентов', hero_stat2: 'Компаний', hero_stat3: 'Заданий',
    hero_stat4: 'Трудоустроились',
    features_tag: 'Почему UniWay?',
    features_title: 'Всё для вашего карьерного старта',
    f1_title: 'Реальные задания', f1_desc: 'Компании публикуют настоящие тестовые задания — выполняй и доказывай свои навыки',
    f2_title: 'AI-собеседование', f2_desc: 'Симуляция настоящего HR-интервью. AI анализирует ответы и даёт рекомендации',
    f3_title: 'Умное резюме', f3_desc: 'Резюме с подтверждёнными результатами — не слова, а факты с баллами',
    f4_title: 'Связь с компаниями', f4_desc: 'Прямой путь от задания до оффера. Компании видят ваши реальные результаты',
    f5_title: 'Портфолио', f5_desc: 'Собирай выполненные задания в профиле и показывай работодателю',
    f6_title: 'AI-проверка', f6_desc: 'Искусственный интеллект анализирует ваши решения и даёт детальную обратную связь',
    how_tag: 'Как это работает',
    how_title: 'Путь к первой работе',
    s1_title: 'Зарегистрируйся', s1_desc: 'Создай профиль за 2 минуты, выбери направление',
    s2_title: 'Выполни задание', s2_desc: 'Возьми тестовое задание от реальной компании',
    s3_title: 'AI-оценка', s3_desc: 'Получи детальный разбор от искусственного интеллекта',
    s4_title: 'Укрепи резюме', s4_desc: 'Результаты автоматически добавляются в профиль',
    s5_title: 'Получи оффер', s5_desc: 'Компании видят твои доказанные навыки и связываются с тобой',
    catalog_title: 'Каталог заданий',
    catalog_sub: 'Выполняй задания от реальных компаний и добавляй результаты в резюме',
    filter_all: 'Все', filter_it: 'IT', filter_marketing: 'Маркетинг',
    filter_design: 'Дизайн', filter_business: 'Бизнес',
    task_deadline: 'Дедлайн', task_level: 'Уровень',
    task_company: 'Компания', task_take: 'Взять задание', task_view: 'Посмотреть',
    login_title: 'Вход в UniWay',
    login_sub: 'Войдите в свой аккаунт',
    login_email: 'Email', login_pass: 'Пароль', login_btn: 'Войти',
    login_demo_student: 'Войти как студент', login_demo_company: 'Войти как компания',
    login_demo_admin: 'Войти как Admin',
    reg_title: 'Регистрация в UniWay',
    reg_sub: 'Создайте аккаунт и начните карьерный путь',
    reg_name: 'Имя и фамилия', reg_email: 'Email', reg_pass: 'Пароль',
    reg_role: 'Кто вы?', reg_student: 'Студент', reg_company: 'Компания',
    reg_direction: 'Направление', reg_btn: 'Зарегистрироваться',
    footer_tagline: 'Платформа для карьерного старта студентов Казахстана',
    footer_students: 'Студентам', footer_companies: 'Компаниям',
    footer_about: 'О нас', footer_contact: 'Контакты',
    interview_title: 'AI-собеседование',
    interview_sub: 'Симуляция реального HR-интервью с анализом ваших ответов',
    resume_title: 'Моё резюме',
    resume_sub: 'Резюме с подтверждёнными навыками и результатами заданий',
  },
  kz: {
    nav_home: 'Басты бет', nav_catalog: 'Тапсырмалар', nav_companies: 'Компаниялар',
    nav_about: 'Біз туралы', nav_login: 'Кіру', nav_register: 'Тіркелу',
    nav_dashboard: 'Жеке кабинет', nav_logout: 'Шығу',
    hero_tag: '🇰🇿 Қазақстан студенттері үшін',
    hero_title: 'Мансапқа алғашқы қадам',
    hero_subtitle: 'Нақты тест тапсырмаларын орындаңыз, AI-мен сұхбатқа дайындалыңыз және дәлелденген дағдылармен түйіндеме жасаңыз',
    hero_cta1: 'Тегін бастаңыз', hero_cta2: 'Тапсырмаларды қараңыз',
    hero_stat1: 'Студент', hero_stat2: 'Компания', hero_stat3: 'Тапсырма',
    hero_stat4: 'Жұмысқа орналасты',
    features_tag: 'Неге UniWay?',
    features_title: 'Мансапты бастауға барлығы',
    f1_title: 'Нақты тапсырмалар', f1_desc: 'Компаниялар шынайы тест тапсырмаларын жариялайды',
    f2_title: 'AI-сұхбат', f2_desc: 'Нақты HR-сұхбатының симуляциясы. AI жауаптарды талдайды',
    f3_title: 'Ақылды түйіндеме', f3_desc: 'Дәлелденген нәтижелері бар түйіндеме',
    f4_title: 'Компаниялармен байланыс', f4_desc: 'Тапсырмадан ұсынысқа дейін тікелей жол',
    f5_title: 'Портфолио', f5_desc: 'Орындалған тапсырмаларды профильде жинаңыз',
    f6_title: 'AI-тексеру', f6_desc: 'Жасанды интеллект шешімдеріңізді талдайды',
    how_tag: 'Қалай жұмыс істейді',
    how_title: 'Алғашқы жұмысқа жол',
    s1_title: 'Тіркелу', s1_desc: '2 минутта профиль жасаңыз',
    s2_title: 'Тапсырманы орындаңыз', s2_desc: 'Нақты компаниядан тест тапсырмасын алыңыз',
    s3_title: 'AI-бағалау', s3_desc: 'Жасанды интеллектен толық талдау алыңыз',
    s4_title: 'Түйіндемені нығайтыңыз', s4_desc: 'Нәтижелер профильге автоматты түрде қосылады',
    s5_title: 'Ұсыныс алыңыз', s5_desc: 'Компаниялар дағдыларыңызды көреді',
    catalog_title: 'Тапсырмалар каталогы',
    catalog_sub: 'Нақты компаниялардан тапсырмаларды орындаңыз',
    filter_all: 'Барлығы', filter_it: 'IT', filter_marketing: 'Маркетинг',
    filter_design: 'Дизайн', filter_business: 'Бизнес',
    task_deadline: 'Мерзімі', task_level: 'Деңгей',
    task_company: 'Компания', task_take: 'Тапсырманы алу', task_view: 'Қарау',
    login_title: 'UniWay-ге кіру',
    login_sub: 'Аккаунтыңызға кіріңіз',
    login_email: 'Email', login_pass: 'Құпиясөз', login_btn: 'Кіру',
    login_demo_student: 'Студент ретінде кіру', login_demo_company: 'Компания ретінде кіру',
    login_demo_admin: 'Admin ретінде кіру',
    reg_title: 'UniWay-де тіркелу',
    reg_sub: 'Аккаунт жасаңыз',
    reg_name: 'Аты-жөні', reg_email: 'Email', reg_pass: 'Құпиясөз',
    reg_role: 'Сіз кімсіз?', reg_student: 'Студент', reg_company: 'Компания',
    reg_direction: 'Бағыт', reg_btn: 'Тіркелу',
    footer_tagline: 'Қазақстан студенттері үшін мансап платформасы',
    footer_students: 'Студенттерге', footer_companies: 'Компанияларға',
    footer_about: 'Біз туралы', footer_contact: 'Байланыс',
    interview_title: 'AI-сұхбат',
    interview_sub: 'Нақты HR-сұхбатының симуляциясы',
    resume_title: 'Менің түйіндемем',
    resume_sub: 'Дәлелденген дағдылар мен тапсырма нәтижелері бар түйіндеме',
  },
  en: {
    nav_home: 'Home', nav_catalog: 'Tasks', nav_companies: 'Companies',
    nav_about: 'About', nav_login: 'Sign In', nav_register: 'Sign Up',
    nav_dashboard: 'Dashboard', nav_logout: 'Sign Out',
    hero_tag: '🇰🇿 For Students of Kazakhstan',
    hero_title: 'Your First Step in Career',
    hero_subtitle: 'Complete real test tasks, prepare for interviews with AI, and build a resume with proven skills',
    hero_cta1: 'Start for Free', hero_cta2: 'Browse Tasks',
    hero_stat1: 'Students', hero_stat2: 'Companies', hero_stat3: 'Tasks',
    hero_stat4: 'Got Hired',
    features_tag: 'Why UniWay?',
    features_title: 'Everything for Your Career Start',
    f1_title: 'Real Tasks', f1_desc: 'Companies publish real test tasks — complete them and prove your skills',
    f2_title: 'AI Interview', f2_desc: 'Simulation of a real HR interview. AI analyzes answers and gives recommendations',
    f3_title: 'Smart Resume', f3_desc: 'Resume with verified results — not words, but facts with scores',
    f4_title: 'Direct Connection', f4_desc: 'Direct path from task to offer. Companies see your real results',
    f5_title: 'Portfolio', f5_desc: 'Collect completed tasks in your profile and show to employers',
    f6_title: 'AI Review', f6_desc: 'Artificial intelligence analyzes your solutions and gives detailed feedback',
    how_tag: 'How It Works',
    how_title: 'Path to Your First Job',
    s1_title: 'Register', s1_desc: 'Create a profile in 2 minutes, choose your direction',
    s2_title: 'Complete a Task', s2_desc: 'Take a test task from a real company',
    s3_title: 'AI Assessment', s3_desc: 'Get a detailed analysis from artificial intelligence',
    s4_title: 'Strengthen Resume', s4_desc: 'Results are automatically added to your profile',
    s5_title: 'Get an Offer', s5_desc: 'Companies see your proven skills and contact you',
    catalog_title: 'Task Catalog',
    catalog_sub: 'Complete tasks from real companies and add results to your resume',
    filter_all: 'All', filter_it: 'IT', filter_marketing: 'Marketing',
    filter_design: 'Design', filter_business: 'Business',
    task_deadline: 'Deadline', task_level: 'Level',
    task_company: 'Company', task_take: 'Take Task', task_view: 'View',
    login_title: 'Sign in to UniWay',
    login_sub: 'Log in to your account',
    login_email: 'Email', login_pass: 'Password', login_btn: 'Sign In',
    login_demo_student: 'Login as Student', login_demo_company: 'Login as Company',
    login_demo_admin: 'Login as Admin',
    reg_title: 'Register in UniWay',
    reg_sub: 'Create an account and start your career journey',
    reg_name: 'Full Name', reg_email: 'Email', reg_pass: 'Password',
    reg_role: 'Who are you?', reg_student: 'Student', reg_company: 'Company',
    reg_direction: 'Direction', reg_btn: 'Register',
    footer_tagline: 'Career platform for Kazakhstan students',
    footer_students: 'For Students', footer_companies: 'For Companies',
    footer_about: 'About Us', footer_contact: 'Contact',
    interview_title: 'AI Interview',
    interview_sub: 'Simulation of a real HR interview with answer analysis',
    resume_title: 'My Resume',
    resume_sub: 'Resume with proven skills and task results',
  }
};

function t(key) { return T[State.lang][key] || T['ru'][key] || key; }

// ===== MOCK DATA =====
const MOCK_TASKS = [
  { id: 1, title: 'Python-разработчик: REST API', company: 'Kolesa Group', companyLogo: 'KG', direction: 'IT', level: 'Junior', deadline: '15 мая 2025', score: null, applicants: 47, description: 'Создай REST API на Python/FastAPI для системы бронирования автомобилей. Необходима авторизация JWT, CRUD операции.', tags: ['Python', 'FastAPI', 'REST API', 'JWT'], reward: '50 000 ₸', color: 'blue' },
  { id: 2, title: 'SMM-стратегия для IT-компании', company: 'Chocofood', companyLogo: 'CF', direction: 'Маркетинг', level: 'Intern', deadline: '20 мая 2025', score: 78, applicants: 63, description: 'Разработай SMM-стратегию для Chocofood на 3 месяца: контент-план, метрики, целевая аудитория.', tags: ['SMM', 'Контент', 'Стратегия', 'Instagram'], reward: '30 000 ₸', color: 'orange' },
  { id: 3, title: 'UI/UX дизайн мобильного приложения', company: 'Kaspi Bank', companyLogo: 'KB', direction: 'Дизайн', level: 'Junior', deadline: '25 мая 2025', score: null, applicants: 89, description: 'Спроектируй пользовательский интерфейс для мобильного приложения финансовых переводов.', tags: ['Figma', 'UI/UX', 'Mobile', 'Prototype'], reward: '60 000 ₸', color: 'purple' },
  { id: 4, title: 'Frontend на React.js', company: 'Jusan Bank', companyLogo: 'JB', direction: 'IT', level: 'Junior', deadline: '18 мая 2025', score: 92, applicants: 34, description: 'Разработай компонент личного кабинета на React.js с использованием TypeScript и Tailwind CSS.', tags: ['React', 'TypeScript', 'CSS', 'API'], reward: '55 000 ₸', color: 'blue' },
  { id: 5, title: 'Финансовый анализ стартапа', company: 'Forte Bank', companyLogo: 'FB', direction: 'Бизнес', level: 'Intern', deadline: '22 мая 2025', score: null, applicants: 21, description: 'Проведи анализ финансовых показателей стартапа и составь инвестиционный меморандум.', tags: ['Excel', 'Финансы', 'Анализ', 'PowerPoint'], reward: '35 000 ₸', color: 'green' },
  { id: 6, title: 'Логотип и брендбук', company: 'Air Astana', companyLogo: 'AA', direction: 'Дизайн', level: 'Intern', deadline: '30 мая 2025', score: 85, applicants: 56, description: 'Создай логотип и базовый брендбук для нового сервиса Air Astana по управлению багажом.', tags: ['Adobe Illustrator', 'Брендинг', 'Логотип', 'Фирменный стиль'], reward: '40 000 ₸', color: 'red' },
  { id: 7, title: 'Data Science: Анализ данных', company: 'Kcell', companyLogo: 'KC', direction: 'IT', level: 'Junior', deadline: '28 мая 2025', score: null, applicants: 28, description: 'Проведи анализ данных о клиентах мобильного оператора и выяви паттерны поведения пользователей.', tags: ['Python', 'Pandas', 'Machine Learning', 'Data Viz'], reward: '70 000 ₸', color: 'blue' },
  { id: 8, title: 'Контент-план для YouTube', company: 'Beeline KZ', companyLogo: 'BL', direction: 'Маркетинг', level: 'Intern', deadline: '12 мая 2025', score: null, applicants: 44, description: 'Разработай контент-план для YouTube канала телеком-компании на 6 месяцев.', tags: ['YouTube', 'Контент', 'Видео', 'Аналитика'], reward: '25 000 ₸', color: 'orange' },
];

const MOCK_STUDENTS = [
  { id: 1, name: 'Айгерим Сейтқали', direction: 'IT', university: 'НУАД', year: 3, score: 88, tasks: 5, avatar: 'АС', skills: ['Python', 'React', 'SQL'], city: 'Алматы' },
  { id: 2, name: 'Даниял Нұрланов', direction: 'Маркетинг', university: 'КазГЮУ', year: 4, score: 76, tasks: 3, avatar: 'ДН', skills: ['SMM', 'SEO', 'Google Ads'], city: 'Нур-Султан' },
  { id: 3, name: 'Мадина Ахметова', direction: 'Дизайн', university: 'КазГАСА', year: 2, score: 94, tasks: 7, avatar: 'МА', skills: ['Figma', 'Photoshop', 'Illustrator'], city: 'Алматы' },
  { id: 4, name: 'Ерлан Байзаков', direction: 'Бизнес', university: 'АДУ', year: 3, score: 81, tasks: 4, avatar: 'ЕБ', skills: ['Excel', 'PowerPoint', 'Анализ'], city: 'Шымкент' },
];

const AI_INTERVIEW_QUESTIONS = {
  IT: [
    'Расскажите о своём опыте в разработке. Какие проекты вы реализовали?',
    'Какой стек технологий вы знаете лучше всего? Приведите примеры использования.',
    'Опишите ситуацию, когда вы столкнулись с трудной технической задачей. Как решили?',
    'Как вы подходите к code review и работе в команде?',
    'Где вы видите себя через 2 года в области разработки?',
  ],
  Маркетинг: [
    'Как вы проводите анализ целевой аудитории для маркетинговой кампании?',
    'Расскажите о самом успешном контент-проекте, который вы создали.',
    'Как вы измеряете эффективность digital-маркетинга?',
    'Опишите опыт работы с социальными сетями. Какие результаты достигли?',
    'Как вы справляетесь с негативными комментариями от аудитории?',
  ],
  Дизайн: [
    'Расскажите о своём дизайн-процессе — от идеи до готового продукта.',
    'Как вы проводите пользовательские исследования перед проектированием?',
    'Какие инструменты дизайна вы используете и почему?',
    'Как вы работаете с фидбеком от клиентов или разработчиков?',
    'Опишите проект, которым вы больше всего гордитесь.',
  ],
  Бизнес: [
    'Расскажите о вашем опыте в бизнес-анализе или финансах.',
    'Как вы подходите к решению нестандартных бизнес-задач?',
    'Что для вас важнее — скорость или качество в работе? Почему?',
    'Опишите ситуацию, когда вам пришлось работать под давлением дедлайна.',
    'Какие ключевые метрики вы используете для оценки успеха проекта?',
  ],
};

// ===== ROUTER =====
function navigate(page, params = {}) {
  // Reset data loaded flag when navigating to dashboard pages so fresh data loads
  if (page.includes('dashboard') || page === 'admin') {
    State.dataLoaded = false;
    State.userStats = null;
    State.adminUsers = [];
    State.adminStats = null;
  }
  State.currentPage = page;
  State.routeParams = params;
  renderApp();
  window.scrollTo(0, 0);
  history.pushState({ page, params }, '', getPageUrl(page, params));
}

function getPageUrl(page, params = {}) {
  const urls = {
    home: '/', catalog: '/catalog', login: '/login', register: '/register',
    student_dashboard: '/student/dashboard', student_profile: '/student/profile',
    student_resume: '/student/resume', student_interview: '/student/interview',
    student_tasks: '/student/tasks', student_portfolio: '/student/portfolio',
    company_dashboard: '/company/dashboard', company_tasks: '/company/tasks',
    company_candidates: '/company/candidates', company_profile: '/company/profile',
    admin: '/admin', about: '/about', task_detail: `/task/${params.id || ''}`,
    interview: '/interview',
  };
  return urls[page] || '/';
}

// ===== MAIN RENDER =====
function renderApp() {
  const app = document.getElementById('app');
  app.innerHTML = renderNavbar() + renderCurrentPage() + renderFooter();
  attachEventListeners();
  initScrollReveal();
  updateNavbar();
}

// ===== NAVBAR =====
function renderNavbar() {
  const isLoggedIn = !!State.currentUser;
  const role = State.currentRole;
  return `
  <nav id="navbar">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <button onclick="navigate('home')" class="flex items-center gap-2 font-bold text-xl text-gray-900 hover:opacity-80 transition-opacity">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <i class="fas fa-graduation-cap text-white text-sm"></i>
          </div>
          <span>Uni<span class="text-blue-600">Way</span></span>
        </button>

        <!-- Desktop Nav -->
        <div class="hidden md:flex items-center gap-1">
          <button onclick="navigate('home')" class="nav-link ${State.currentPage === 'home' ? 'active' : ''}">${t('nav_home')}</button>
          <button onclick="navigate('catalog')" class="nav-link ${State.currentPage === 'catalog' ? 'active' : ''}">${t('nav_catalog')}</button>
          <button onclick="navigate('about')" class="nav-link ${State.currentPage === 'about' ? 'active' : ''}">${t('nav_about')}</button>
          ${isLoggedIn ? `
            <button onclick="navigate('${role === 'company' ? 'company_dashboard' : 'student_dashboard'}')" class="nav-link ${State.currentPage.includes('dashboard') ? 'active' : ''}">${t('nav_dashboard')}</button>
          ` : ''}
        </div>

        <!-- Right Side -->
        <div class="flex items-center gap-2">
          <!-- Language Switcher -->
          <div class="hidden md:flex items-center gap-1 mr-2">
            ${['ru','kz','en'].map(l => `
              <button onclick="setLang('${l}')" class="lang-btn ${State.lang === l ? 'active' : ''}">${l.toUpperCase()}</button>
            `).join('')}
          </div>
          
          ${isLoggedIn ? `
            <div class="flex items-center gap-2">
              <div class="avatar w-8 h-8 text-sm cursor-pointer" onclick="navigate('${role}_dashboard')">${State.currentUser.avatar}</div>
              <span class="hidden md:block text-sm font-medium text-gray-700">${State.currentUser.name.split(' ')[0]}</span>
              <button onclick="logout()" class="btn btn-ghost btn-sm hidden md:flex"><i class="fas fa-sign-out-alt"></i></button>
            </div>
          ` : `
            <button onclick="navigate('login')" class="btn btn-ghost btn-sm hidden md:flex">${t('nav_login')}</button>
            <button onclick="navigate('register')" class="btn btn-primary btn-sm">${t('nav_register')}</button>
          `}

          <!-- Mobile menu button -->
          <button onclick="toggleMobileMenu()" class="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <i class="fas fa-bars text-gray-600"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div id="mobile-menu" class="md:hidden border-t border-gray-100 bg-white">
      <div class="px-4 py-3 space-y-1">
        <button onclick="navigate('home'); toggleMobileMenu()" class="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">${t('nav_home')}</button>
        <button onclick="navigate('catalog'); toggleMobileMenu()" class="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">${t('nav_catalog')}</button>
        <button onclick="navigate('about'); toggleMobileMenu()" class="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">${t('nav_about')}</button>
        ${isLoggedIn ? `
          <button onclick="navigate('${role}_dashboard'); toggleMobileMenu()" class="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">${t('nav_dashboard')}</button>
          <button onclick="logout()" class="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">Выйти</button>
        ` : `
          <button onclick="navigate('login'); toggleMobileMenu()" class="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50">${t('nav_login')}</button>
          <button onclick="navigate('register'); toggleMobileMenu()" class="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50">${t('nav_register')}</button>
        `}
        <div class="flex gap-1 mt-2 px-3">
          ${['ru','kz','en'].map(l => `
            <button onclick="setLang('${l}')" class="lang-btn ${State.lang === l ? 'active' : ''}">${l.toUpperCase()}</button>
          `).join('')}
        </div>
      </div>
    </div>
  </nav>`;
}

// ===== PAGE ROUTER =====
function renderCurrentPage() {
  const pages = {
    home: renderHomePage,
    catalog: renderCatalogPage,
    login: renderLoginPage,
    register: renderRegisterPage,
    about: renderAboutPage,
    student_dashboard: renderStudentDashboard,
    student_profile: renderStudentProfile,
    student_resume: renderStudentResume,
    student_interview: renderStudentInterview,
    student_tasks: renderStudentTasks,
    student_portfolio: renderStudentPortfolio,
    company_dashboard: renderCompanyDashboard,
    company_tasks: renderCompanyTasks,
    company_candidates: renderCompanyCandidates,
    company_profile: renderCompanyProfile,
    admin: renderAdminPanel,
    task_detail: renderTaskDetail,
    interview: renderInterviewPage,
  };
  const render = pages[State.currentPage];
  return render ? render() : renderHomePage();
}

// ===== HOME PAGE =====
function renderHomePage() {
  return `
  <main class="pt-16">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg-pattern"></div>
      <div class="hero-glow w-96 h-96 bg-blue-500 top-10 -left-20"></div>
      <div class="hero-glow w-80 h-80 bg-purple-500 bottom-20 right-10"></div>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <!-- Left Content -->
          <div class="text-white">
            <div class="section-tag" style="background:rgba(59,130,246,0.2);color:#93c5fd;border-color:rgba(59,130,246,0.3)">
              <i class="fas fa-star text-yellow-400"></i>
              ${t('hero_tag')}
            </div>
            <h1 class="text-5xl lg:text-6xl font-black leading-tight mt-4 mb-6">
              ${t('hero_title')}
              <span style="background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text"> в UniWay</span>
            </h1>
            <p class="text-lg text-blue-200 mb-8 leading-relaxed max-w-lg">
              ${t('hero_subtitle')}
            </p>
            <div class="flex flex-wrap gap-3 mb-10">
              <button onclick="navigate('register')" class="btn btn-primary btn-xl">
                <i class="fas fa-rocket"></i> ${t('hero_cta1')}
              </button>
              <button onclick="navigate('catalog')" class="btn btn-xl" style="background:rgba(255,255,255,0.1);color:white;border:1.5px solid rgba(255,255,255,0.2)">
                <i class="fas fa-tasks"></i> ${t('hero_cta2')}
              </button>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-4 gap-6 pt-8 border-t border-white/10">
              ${[
                { n: '12K+', l: t('hero_stat1') },
                { n: '180+', l: t('hero_stat2') },
                { n: '500+', l: t('hero_stat3') },
                { n: '2.4K', l: t('hero_stat4') },
              ].map(s => `
                <div>
                  <div class="text-2xl lg:text-3xl font-black text-white">${s.n}</div>
                  <div class="text-blue-300 text-xs mt-1">${s.l}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Right - Dashboard Preview -->
          <div class="hidden lg:block">
            <div class="relative">
              <!-- Main Card -->
              <div class="card-glass rounded-2xl p-6 max-w-sm ml-auto" style="border-color:rgba(255,255,255,0.15)">
                <div class="flex items-center gap-3 mb-5">
                  <div class="avatar w-12 h-12 text-lg">АС</div>
                  <div>
                    <div class="text-white font-bold">Айгерим Сейтқали</div>
                    <div class="text-blue-300 text-sm">Junior Frontend Developer</div>
                  </div>
                  <div class="ml-auto">
                    <div class="badge-green badge text-xs">✓ Verified</div>
                  </div>
                </div>
                
                <!-- Progress -->
                ${[
                  { label: 'JavaScript', val: 85, color: 'blue' },
                  { label: 'React', val: 72, color: 'purple' },
                  { label: 'CSS/Tailwind', val: 90, color: 'green' },
                ].map(s => `
                  <div class="mb-3">
                    <div class="flex justify-between text-sm text-white/80 mb-1">
                      <span>${s.label}</span><span>${s.val}%</span>
                    </div>
                    <div class="progress-bar" style="background:rgba(255,255,255,0.1)">
                      <div class="progress-fill ${s.color}" style="width:${s.val}%"></div>
                    </div>
                  </div>
                `).join('')}
                
                <div class="mt-4 pt-4 border-t border-white/10">
                  <div class="text-white/70 text-xs mb-2">Последние задания</div>
                  ${[
                    { title: 'React компонент', score: 92, company: 'Jusan Bank' },
                    { title: 'REST API Python', score: 84, company: 'Kolesa Group' },
                  ].map(t => `
                    <div class="flex items-center gap-3 py-2">
                      <div class="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center">
                        <i class="fas fa-code text-blue-400 text-xs"></i>
                      </div>
                      <div class="flex-1">
                        <div class="text-white text-xs font-medium">${t.title}</div>
                        <div class="text-blue-300 text-xs">${t.company}</div>
                      </div>
                      <div class="text-green-400 text-xs font-bold">${t.score}/100</div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <!-- Floating badges -->
              <div class="absolute -top-4 -left-4 card-glass rounded-xl p-3 text-white text-sm" style="border-color:rgba(255,255,255,0.15)">
                <div class="flex items-center gap-2">
                  <i class="fas fa-robot text-blue-400"></i>
                  <span class="text-xs">AI оценка: <strong>88/100</strong></span>
                </div>
              </div>
              <div class="absolute -bottom-4 -left-8 card-glass rounded-xl p-3 text-white text-sm" style="border-color:rgba(255,255,255,0.15)">
                <div class="flex items-center gap-2">
                  <i class="fas fa-briefcase text-green-400"></i>
                  <span class="text-xs text-white/80">Оффер от <strong>Kaspi</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16 reveal">
          <div class="section-tag mx-auto" style="display:inline-flex">
            <i class="fas fa-sparkles"></i> ${t('features_tag')}
          </div>
          <h2 class="section-title mt-3">${t('features_title')}</h2>
          <p class="section-subtitle max-w-2xl mx-auto">${t('hero_subtitle')}</p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${[
            { icon: 'fa-tasks', bg: 'bg-blue-50', iconColor: 'text-blue-600', title: t('f1_title'), desc: t('f1_desc') },
            { icon: 'fa-robot', bg: 'bg-purple-50', iconColor: 'text-purple-600', title: t('f2_title'), desc: t('f2_desc') },
            { icon: 'fa-file-alt', bg: 'bg-green-50', iconColor: 'text-green-600', title: t('f3_title'), desc: t('f3_desc') },
            { icon: 'fa-building', bg: 'bg-orange-50', iconColor: 'text-orange-600', title: t('f4_title'), desc: t('f4_desc') },
            { icon: 'fa-folder-open', bg: 'bg-red-50', iconColor: 'text-red-600', title: t('f5_title'), desc: t('f5_desc') },
            { icon: 'fa-brain', bg: 'bg-indigo-50', iconColor: 'text-indigo-600', title: t('f6_title'), desc: t('f6_desc') },
          ].map((f, i) => `
            <div class="card hover-lift reveal" style="transition-delay:${i*0.1}s">
              <div class="feature-icon ${f.bg} ${f.iconColor} mb-4">
                <i class="fas ${f.icon}"></i>
              </div>
              <h3 class="text-lg font-bold text-gray-900 mb-2">${f.title}</h3>
              <p class="text-gray-500 text-sm leading-relaxed">${f.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-24 bg-gradient-to-br from-slate-900 to-blue-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16 reveal">
          <div class="section-tag" style="display:inline-flex;background:rgba(59,130,246,0.2);color:#93c5fd;border-color:rgba(59,130,246,0.3)">
            <i class="fas fa-route"></i> ${t('how_tag')}
          </div>
          <h2 class="section-title mt-3 text-white">${t('how_title')}</h2>
        </div>
        <div class="relative">
          <!-- Connection line -->
          <div class="absolute top-10 left-0 right-0 h-0.5 hidden lg:block" style="background:linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)"></div>
          <div class="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            ${[
              { n: '01', icon: 'fa-user-plus', title: t('s1_title'), desc: t('s1_desc'), color: 'blue' },
              { n: '02', icon: 'fa-laptop-code', title: t('s2_title'), desc: t('s2_desc'), color: 'purple' },
              { n: '03', icon: 'fa-robot', title: t('s3_title'), desc: t('s3_desc'), color: 'indigo' },
              { n: '04', icon: 'fa-file-alt', title: t('s4_title'), desc: t('s4_desc'), color: 'green' },
              { n: '05', icon: 'fa-handshake', title: t('s5_title'), desc: t('s5_desc'), color: 'yellow' },
            ].map((s, i) => `
              <div class="text-center reveal" style="transition-delay:${i*0.1}s">
                <div class="relative inline-block mb-5">
                  <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto shadow-xl">
                    <i class="fas ${s.icon} text-2xl text-white"></i>
                  </div>
                  <div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-400 flex items-center justify-center text-xs font-black text-white">${s.n}</div>
                </div>
                <h3 class="font-bold text-white text-base mb-2">${s.title}</h3>
                <p class="text-blue-200 text-sm leading-relaxed">${s.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="text-center mt-16 reveal">
          <button onclick="navigate('register')" class="btn btn-primary btn-xl">
            <i class="fas fa-rocket"></i> ${t('hero_cta1')}
          </button>
        </div>
      </div>
    </section>

    <!-- Tasks Preview -->
    <section class="py-24 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between mb-10 reveal">
          <div>
            <div class="section-tag" style="display:inline-flex"><i class="fas fa-fire text-orange-500"></i> Горячие задания</div>
            <h2 class="section-title mt-3">Актуальные тестовые задания</h2>
          </div>
          <button onclick="navigate('catalog')" class="btn btn-secondary hide-mobile">
            Все задания <i class="fas fa-arrow-right"></i>
          </button>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${MOCK_TASKS.slice(0,6).map(task => renderTaskCard(task)).join('')}
        </div>
        <div class="text-center mt-8 md:hidden">
          <button onclick="navigate('catalog')" class="btn btn-secondary">Все задания <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>
    </section>

    <!-- Companies -->
    <section class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 reveal">
          <div class="section-tag mx-auto" style="display:inline-flex"><i class="fas fa-building"></i> Наши партнёры</div>
          <h2 class="section-title mt-3">Компании, которые доверяют UniWay</h2>
          <p class="section-subtitle">Более 180 ведущих компаний Казахстана публикуют задания на нашей платформе</p>
        </div>
        <div class="flex flex-wrap justify-center items-center gap-8 opacity-60">
          ${['Kaspi Bank','Kolesa Group','Jusan Bank','Chocofood','Air Astana','Beeline KZ','Kcell','Forte Bank','Halyk Bank','Megacom','BI Group'].map(c => `
            <div class="text-xl font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">${c}</div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-gradient-to-r from-blue-600 to-purple-700 relative overflow-hidden">
      <div class="hero-bg-pattern opacity-10"></div>
      <div class="relative max-w-4xl mx-auto px-4 text-center reveal">
        <h2 class="text-4xl font-black text-white mb-4">Готов начать карьеру?</h2>
        <p class="text-blue-100 text-lg mb-8 max-w-xl mx-auto">Присоединяйся к 12 000+ студентов, которые уже строят свою карьеру через UniWay</p>
        <div class="flex flex-wrap justify-center gap-4">
          <button onclick="navigate('register')" class="btn btn-xl" style="background:white;color:#2563eb;">
            <i class="fas fa-graduation-cap"></i> Начать как студент
          </button>
          <button onclick="navigate('register')" class="btn btn-xl" style="background:rgba(255,255,255,0.15);color:white;border:1.5px solid rgba(255,255,255,0.3)">
            <i class="fas fa-building"></i> Разместить задание
          </button>
        </div>
      </div>
    </section>
  </main>`;
}

// ===== TASK CARD =====
function renderTaskCard(task) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'badge-blue' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'badge-orange' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'badge-purple' },
    green: { bg: 'bg-green-50', text: 'text-green-700', badge: 'badge-green' },
    red: { bg: 'bg-red-50', text: 'text-red-700', badge: 'badge-red' },
  };
  const c = colorMap[task.color] || colorMap.blue;
  return `
  <div class="card hover-lift cursor-pointer" onclick="navigate('task_detail', {id: ${task.id}})">
    <div class="flex items-start justify-between mb-4">
      <div class="company-logo text-sm">${task.companyLogo}</div>
      <div class="flex gap-2">
        <span class="badge ${c.badge}">${task.direction}</span>
        <span class="badge badge-gray">${task.level}</span>
      </div>
    </div>
    <h3 class="font-bold text-gray-900 mb-1 text-base leading-tight">${task.title}</h3>
    <p class="text-sm text-gray-500 mb-4 line-clamp-2">${task.description}</p>
    <div class="flex flex-wrap gap-1 mb-4">
      ${task.tags.slice(0,3).map(tag => `<span class="skill-tag text-xs">${tag}</span>`).join('')}
    </div>
    <div class="flex items-center justify-between pt-3 border-t border-gray-100">
      <div class="text-sm text-gray-500">
        <i class="fas fa-users text-gray-400 mr-1"></i> ${task.applicants} участников
      </div>
      <span class="badge badge-gray text-xs">${task.level}</span>
    </div>
    <div class="mt-3 flex items-center justify-between">
      <div class="text-xs text-gray-400"><i class="fas fa-clock mr-1"></i> ${task.deadline}</div>
      <button onclick="event.stopPropagation(); navigate('task_detail', {id: ${task.id}})" class="btn btn-primary btn-sm">
        Взять задание
      </button>
    </div>
  </div>`;
}

// ===== CATALOG PAGE =====
function renderCatalogPage() {
  const filter = State.catalogFilter || 'all';
  const filtered = filter === 'all' ? MOCK_TASKS : MOCK_TASKS.filter(t => t.direction === filter || t.direction.toLowerCase() === filter);
  return `
  <main class="pt-24 pb-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-black text-gray-900">${t('catalog_title')}</h1>
        <p class="text-gray-500 mt-2">${t('catalog_sub')}</p>
      </div>

      <!-- Filters + Search -->
      <div class="flex flex-col md:flex-row gap-4 mb-8">
        <div class="relative flex-1">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" placeholder="Поиск заданий..." class="form-input pl-10" id="catalog-search" oninput="filterCatalog()">
        </div>
        <div class="tabs" style="min-width:fit-content">
          ${[
            { key: 'all', label: t('filter_all') },
            { key: 'IT', label: t('filter_it') },
            { key: 'Маркетинг', label: t('filter_marketing') },
            { key: 'Дизайн', label: t('filter_design') },
            { key: 'Бизнес', label: t('filter_business') },
          ].map(f => `
            <button class="tab-btn ${filter === f.key ? 'active' : ''}" onclick="setCatalogFilter('${f.key}')">${f.label}</button>
          `).join('')}
        </div>
      </div>

      <!-- Results count -->
      <div class="text-sm text-gray-500 mb-6">${filtered.length} задани${filtered.length === 1 ? 'е' : 'й'} найдено</div>

      <!-- Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6" id="tasks-grid">
        ${filtered.map(task => renderTaskCard(task)).join('')}
      </div>

      ${filtered.length === 0 ? `
        <div class="text-center py-20">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-search text-3xl text-gray-400"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-700">Заданий не найдено</h3>
          <p class="text-gray-500 mt-2">Попробуйте изменить фильтры</p>
        </div>
      ` : ''}
    </div>
  </main>`;
}

// ===== TASK DETAIL PAGE =====
function renderTaskDetail() {
  const task = MOCK_TASKS.find(t => t.id === (State.routeParams?.id || 1)) || MOCK_TASKS[0];
  return `
  <main class="pt-24 pb-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onclick="navigate('catalog')" class="hover:text-blue-600 transition-colors">Задания</button>
        <i class="fas fa-chevron-right text-xs"></i>
        <span class="text-gray-800 font-medium">${task.title}</span>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2">
          <div class="card mb-6">
            <div class="flex items-start gap-4 mb-6">
              <div class="company-logo text-base w-14 h-14">${task.companyLogo}</div>
              <div class="flex-1">
                <div class="flex flex-wrap gap-2 mb-2">
                  <span class="badge badge-blue">${task.direction}</span>
                  <span class="badge badge-gray">${task.level}</span>
                </div>
                <h1 class="text-2xl font-black text-gray-900">${task.title}</h1>
                <div class="text-gray-500 mt-1">${task.company}</div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-gray-900 mb-3">Описание задания</h3>
              <p class="text-gray-600 leading-relaxed">${task.description}</p>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-gray-900 mb-3">Требования</h3>
              <ul class="space-y-2">
                ${task.tags.map(tag => `
                  <li class="flex items-center gap-2 text-gray-600 text-sm">
                    <i class="fas fa-check-circle text-green-500"></i> Знание ${tag}
                  </li>
                `).join('')}
                <li class="flex items-center gap-2 text-gray-600 text-sm">
                  <i class="fas fa-check-circle text-green-500"></i> Умение работать самостоятельно
                </li>
                <li class="flex items-center gap-2 text-gray-600 text-sm">
                  <i class="fas fa-check-circle text-green-500"></i> Соблюдение дедлайна
                </li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 mb-3">Навыки</h3>
              <div class="flex flex-wrap gap-2">
                ${task.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('')}
              </div>
            </div>
          </div>

          <!-- Upload Solution -->
          <div class="card" id="upload-section">
            <h3 class="font-bold text-gray-900 mb-4">
              <i class="fas fa-upload text-blue-600 mr-2"></i>
              Загрузить решение
            </h3>
            ${State.currentUser ? `
              <div class="upload-zone" id="drop-zone" onclick="document.getElementById('file-input').click()">
                <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3 block"></i>
                <p class="text-gray-600 font-medium">Перетащи файл или нажми для выбора</p>
                <p class="text-gray-400 text-sm mt-1">PDF, ZIP, DOC — до 50 МБ</p>
              </div>
              <input type="file" id="file-input" class="hidden" onchange="handleFileUpload(this)">
              <div class="mt-4">
                <label class="form-label">Или оставь ссылку (GitHub, Figma, Google Drive)</label>
                <input type="url" class="form-input" placeholder="https://github.com/your-repo" id="solution-link">
              </div>
              <div class="mt-4">
                <label class="form-label">Комментарий к решению</label>
                <textarea class="form-textarea" placeholder="Опиши свой подход к решению задачи..." id="solution-comment"></textarea>
              </div>
              <button onclick="submitSolution()" class="btn btn-primary w-full mt-4">
                <i class="fas fa-paper-plane"></i> Отправить решение на проверку
              </button>
            ` : `
              <div class="text-center py-8">
                <i class="fas fa-lock text-3xl text-gray-400 mb-3 block"></i>
                <p class="text-gray-600 mb-4">Войди или зарегистрируйся, чтобы выполнить задание</p>
                <div class="flex gap-3 justify-center">
                  <button onclick="navigate('login')" class="btn btn-secondary">Войти</button>
                  <button onclick="navigate('register')" class="btn btn-primary">Зарегистрироваться</button>
                </div>
              </div>
            `}
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-5">
          <div class="card">
            <h4 class="font-bold text-gray-900 mb-4">Детали задания</h4>
            ${[
              { icon: 'fa-building', label: 'Компания', val: task.company },
              { icon: 'fa-calendar', label: 'Дедлайн', val: task.deadline },
              { icon: 'fa-signal', label: 'Уровень', val: task.level },
              { icon: 'fa-users', label: 'Участников', val: task.applicants },
            ].map(d => `
              <div class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <i class="fas ${d.icon} text-gray-400 w-4"></i>
                <span class="text-sm text-gray-500">${d.label}</span>
                <span class="text-sm font-medium text-gray-900 ml-auto">${d.val}</span>
              </div>
            `).join('')}
          </div>

          <div class="card" style="background:linear-gradient(135deg,#eff6ff,#f0fdf4)">
            <div class="flex items-center gap-3 mb-3">
              <i class="fas fa-robot text-blue-600 text-xl"></i>
              <div>
                <div class="font-bold text-gray-900 text-sm">AI-проверка включена</div>
                <div class="text-gray-500 text-xs">Получи мгновенную обратную связь</div>
              </div>
            </div>
            <p class="text-gray-600 text-xs">После отправки AI проанализирует твоё решение, выставит балл и даст рекомендации</p>
          </div>

          <div class="card">
            <h4 class="font-bold text-gray-900 mb-3">Студенты выполнили</h4>
            <div class="space-y-3">
              ${MOCK_STUDENTS.slice(0,3).map(s => `
                <div class="flex items-center gap-3">
                  <div class="avatar w-8 h-8 text-xs">${s.avatar}</div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 truncate">${s.name}</div>
                    <div class="text-xs text-gray-500">${s.university}</div>
                  </div>
                  <div class="text-xs font-bold text-green-600">${s.score}/100</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== LOGIN PAGE =====
function renderLoginPage() {
  return `
  <main class="pt-24 pb-16 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
    <div class="max-w-md mx-auto px-4">
      <div class="card p-8 mt-8">
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-graduation-cap text-white text-xl"></i>
          </div>
          <h1 class="text-2xl font-black text-gray-900">${t('login_title')}</h1>
          <p class="text-gray-500 text-sm mt-1">${t('login_sub')}</p>
        </div>

        <!-- Error banner -->
        <div id="login-error" class="hidden mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <i class="fas fa-exclamation-circle"></i>
          <span id="login-error-text"></span>
        </div>

        <form onsubmit="handleLogin(event)" autocomplete="on">
          <div class="form-group">
            <label class="form-label"><i class="fas fa-envelope text-gray-400 mr-1"></i> ${t('login_email')}</label>
            <input type="email" class="form-input" id="login-email" placeholder="your@email.com" autocomplete="email" required>
          </div>
          <div class="form-group">
            <label class="form-label"><i class="fas fa-lock text-gray-400 mr-1"></i> ${t('login_pass')}</label>
            <div class="relative">
              <input type="password" class="form-input pr-10" id="login-pass" placeholder="••••••••" autocomplete="current-password" required>
              <button type="button" onclick="togglePasswordVisibility('login-pass', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i class="fas fa-eye text-sm"></i>
              </button>
            </div>
          </div>
          <button type="submit" id="login-submit-btn" class="btn btn-primary w-full btn-lg mt-2">
            <i class="fas fa-sign-in-alt"></i> ${t('login_btn')}
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center gap-3">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span class="text-xs text-gray-400 font-medium">ТЕСТОВЫЕ ДАННЫЕ</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>

        <p class="text-xs text-gray-400 text-center mb-3">Нажмите, чтобы заполнить форму тестовыми данными</p>
        <div class="space-y-2">
          <button onclick="quickLogin('student')" class="btn w-full" style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe">
            <i class="fas fa-user-graduate"></i> ${t('login_demo_student')}
          </button>
          <button onclick="quickLogin('company')" class="btn w-full" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
            <i class="fas fa-building"></i> ${t('login_demo_company')}
          </button>
          <button onclick="quickLogin('admin')" class="btn w-full" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa">
            <i class="fas fa-shield-alt"></i> ${t('login_demo_admin')}
          </button>
        </div>

        <p class="text-center text-sm text-gray-500 mt-6">
          Нет аккаунта? <button onclick="navigate('register')" class="text-blue-600 font-medium hover:underline">Зарегистрироваться</button>
        </p>
      </div>

      <!-- Auth info box -->
      <div class="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
        <i class="fas fa-info-circle mr-1"></i>
        <strong>Новый пользователь?</strong> Зарегистрируйтесь — каждый аккаунт уникален и сохраняется отдельно.
      </div>
    </div>
  </main>`;
}

// ===== REGISTER PAGE =====
function renderRegisterPage() {
  return `
  <main class="pt-24 pb-16 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
    <div class="max-w-lg mx-auto px-4">
      <div class="card p-8 mt-8">
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-graduation-cap text-white text-xl"></i>
          </div>
          <h1 class="text-2xl font-black text-gray-900">${t('reg_title')}</h1>
          <p class="text-gray-500 text-sm mt-1">${t('reg_sub')}</p>
        </div>

        <!-- Error banner -->
        <div id="reg-error" class="hidden mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <i class="fas fa-exclamation-circle flex-shrink-0"></i>
          <span id="reg-error-text"></span>
        </div>

        <!-- Role Toggle -->
        <div class="tabs mb-6">
          <button class="tab-btn active" id="tab-student" onclick="switchRegRole('student')">
            <i class="fas fa-user-graduate mr-1"></i> ${t('reg_student')}
          </button>
          <button class="tab-btn" id="tab-company" onclick="switchRegRole('company')">
            <i class="fas fa-building mr-1"></i> ${t('reg_company')}
          </button>
        </div>

        <form onsubmit="handleRegister(event)" autocomplete="on">
          <div class="form-group">
            <label class="form-label">${t('reg_name')}</label>
            <input type="text" class="form-input" id="reg-name" placeholder="Айгерим Сейтқали" autocomplete="name" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('reg_email')}</label>
            <input type="email" class="form-input" id="reg-email" placeholder="your@email.com" autocomplete="email" required>
          </div>
          <div id="student-fields">
            <div class="form-group">
              <label class="form-label">Университет</label>
              <input type="text" class="form-input" id="reg-university" placeholder="Нуракадемия — НУАД">
            </div>
            <div class="form-group">
              <label class="form-label">${t('reg_direction')}</label>
              <select class="form-select" id="reg-direction">
                <option>IT</option>
                <option>Маркетинг</option>
                <option>Дизайн</option>
                <option>Бизнес / Аналитика</option>
                <option>Другое</option>
              </select>
            </div>
          </div>
          <div id="company-fields" class="hidden">
            <div class="form-group">
              <label class="form-label">Название компании</label>
              <input type="text" class="form-input" id="reg-company" placeholder="Kaspi Bank">
            </div>
            <div class="form-group">
              <label class="form-label">Сфера деятельности</label>
              <select class="form-select" id="reg-industry">
                <option>IT / Технологии</option>
                <option>Финансы / Банкинг</option>
                <option>Маркетинг / Реклама</option>
                <option>Производство</option>
                <option>Другое</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t('reg_pass')}</label>
            <div class="relative">
              <input type="password" class="form-input pr-10" id="reg-pass" placeholder="Минимум 6 символов" minlength="6" autocomplete="new-password" required>
              <button type="button" onclick="togglePasswordVisibility('reg-pass', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i class="fas fa-eye text-sm"></i>
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-1">Не менее 6 символов. Пароль будет зашифрован (SHA-256).</p>
          </div>
          
          <div class="flex items-start gap-3 mb-5 p-3 rounded-xl bg-gray-50 border border-gray-200">
            <input type="checkbox" id="agree-terms" class="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
              onchange="document.getElementById('reg-submit-btn').disabled = !this.checked">
            <label for="agree-terms" class="text-sm text-gray-600 cursor-pointer leading-relaxed">
              Я прочитал(а) и принимаю
              <button type="button" onclick="showTermsModal('terms')" class="text-blue-600 hover:underline font-medium">условия использования</button>
              и
              <button type="button" onclick="showTermsModal('privacy')" class="text-blue-600 hover:underline font-medium">политику конфиденциальности</button>
              платформы UniWay
            </label>
          </div>
          
          <button type="submit" id="reg-submit-btn" disabled
            class="btn btn-primary w-full btn-lg opacity-50 cursor-not-allowed transition-all"
            style="">
            <i class="fas fa-user-plus"></i> ${t('reg_btn')}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Уже есть аккаунт? <button onclick="navigate('login')" class="text-blue-600 font-medium hover:underline">Войти</button>
        </p>
      </div>

      <!-- Security notice -->
      <div class="mt-4 p-4 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
        <i class="fas fa-shield-alt mr-1"></i>
        <strong>Безопасность:</strong> Ваш пароль хранится в зашифрованном виде (SHA-256 + соль). Мы никогда не сохраняем пароль в открытом виде.
      </div>
    </div>
  </main>`;
}

// ===== STUDENT DASHBOARD =====
function renderStudentDashboard() {
  if (!State.currentUser) { navigate('login'); return ''; }
  const user = State.currentUser;
  const stats = State.userStats;
  const subs = State.userSubmissions || [];
  const interviews = State.userInterviews || [];

  // Load real stats if not loaded
  if (!State.dataLoaded) {
    State.dataLoaded = true;
    Promise.all([
      AUTH.apiCall('/api/student/stats'),
      AUTH.apiCall('/api/submissions'),
      AUTH.apiCall('/api/interviews'),
    ]).then(([statsRes, subsRes, intRes]) => {
      if (statsRes.ok) State.userStats = statsRes.data;
      if (subsRes.ok) State.userSubmissions = subsRes.data.submissions || [];
      if (intRes.ok) State.userInterviews = intRes.data.interviews || [];
      renderApp();
    }).catch(() => {});
  }

  const tasksCompleted = stats?.tasksCompleted ?? subs.filter(s => s.status === 'evaluated').length;
  const tasksInProgress = stats?.tasksInProgress ?? subs.filter(s => s.status === 'in_progress').length;
  const avgScore = stats?.avgScore ?? (subs.length > 0 ? Math.round(subs.filter(s=>s.score).reduce((a,b)=>a+(b.score||0),0)/Math.max(1,subs.filter(s=>s.score).length)) : 0);
  const interviewsCount = stats?.interviewsCount ?? interviews.length;

  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex gap-8">
        <!-- Sidebar -->
        ${renderStudentSidebar('dashboard')}

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Header -->
          <div class="mb-8">
            <h1 class="text-2xl font-black text-gray-900">Добро пожаловать, ${user.name.split(' ')[0]}! 👋</h1>
            <p class="text-gray-500 mt-1">Вот твой прогресс на сегодня · <span class="text-blue-600 font-medium">${user.direction || 'IT'}</span> · ${user.university || ''}</p>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            ${[
              { icon: 'fa-tasks', label: 'Заданий выполнено', val: tasksCompleted, bg: 'bg-blue-50', tc: 'text-blue-600' },
              { icon: 'fa-star', label: 'Средний балл', val: avgScore > 0 ? avgScore : '—', bg: 'bg-yellow-50', tc: 'text-yellow-600' },
              { icon: 'fa-robot', label: 'AI-собеседований', val: interviewsCount, bg: 'bg-purple-50', tc: 'text-purple-600' },
              { icon: 'fa-briefcase', label: 'Задания в работе', val: tasksInProgress, bg: 'bg-green-50', tc: 'text-green-600' },
            ].map(s => `
              <div class="card-flat">
                <div class="flex items-center gap-3 mb-2">
                  <div class="feature-icon w-10 h-10 rounded-xl ${s.bg} ${s.tc} text-base"><i class="fas ${s.icon}"></i></div>
                </div>
                <div class="text-2xl font-black text-gray-900">${s.val}</div>
                <div class="text-xs text-gray-500 mt-1">${s.label}</div>
              </div>
            `).join('')}
          </div>

          <div class="grid lg:grid-cols-3 gap-6">
            <!-- Active Tasks (real data) -->
            <div class="lg:col-span-2">
              <div class="card">
                <div class="flex items-center justify-between mb-5">
                  <h3 class="font-bold text-gray-900">Мои задания</h3>
                  <button onclick="navigate('student_tasks')" class="text-blue-600 text-sm font-medium hover:underline">Все задания →</button>
                </div>
                <div class="space-y-4">
                  ${subs.length === 0 ? `
                    <div class="text-center py-8 text-gray-400">
                      <i class="fas fa-tasks text-4xl mb-3 block opacity-30"></i>
                      <p class="text-sm">У вас пока нет заданий</p>
                      <button onclick="navigate('catalog')" class="btn btn-primary btn-sm mt-3">
                        <i class="fas fa-search"></i> Найти задания
                      </button>
                    </div>
                  ` : subs.slice(0,3).map(sub => `
                    <div class="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-code text-blue-600 text-sm"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 text-sm truncate">${sub.taskTitle}</div>
                        <div class="text-xs text-gray-500">${sub.company} · ${new Date(sub.submittedAt).toLocaleDateString('ru')}</div>
                        <div class="mt-1 progress-bar" style="height:4px">
                          <div class="progress-fill ${sub.status === 'evaluated' ? 'green' : 'blue'}" style="width:${sub.status === 'evaluated' ? '100' : '50'}%"></div>
                        </div>
                      </div>
                      <span class="badge ${sub.status === 'evaluated' ? 'badge-green' : 'badge-blue'} flex-shrink-0 text-xs">
                        ${sub.status === 'evaluated' ? (sub.score + ' баллов') : 'В работе'}
                      </span>
                    </div>
                  `).join('')}
                </div>
                ${subs.length === 0 ? '' : `
                  <button onclick="navigate('catalog')" class="btn btn-secondary w-full mt-4 btn-sm">
                    <i class="fas fa-plus"></i> Взять новое задание
                  </button>
                `}
              </div>

              <!-- AI Interviews (real data) -->
              <div class="card mt-6">
                <div class="flex items-center justify-between mb-5">
                  <h3 class="font-bold text-gray-900">Результаты AI-собеседований</h3>
                  <button onclick="navigate('student_interview')" class="text-blue-600 text-sm font-medium hover:underline">Новое →</button>
                </div>
                <div class="space-y-3">
                  ${interviews.length === 0 ? `
                    <div class="text-center py-6 text-gray-400">
                      <i class="fas fa-robot text-4xl mb-3 block opacity-30"></i>
                      <p class="text-sm">Вы ещё не проходили AI-собеседование</p>
                    </div>
                  ` : interviews.slice(0,3).map((iv, idx) => `
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-robot text-purple-600 text-sm"></i>
                      </div>
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">${iv.direction}</div>
                        <div class="text-xs text-gray-500">${new Date(iv.date).toLocaleDateString('ru')}</div>
                      </div>
                      <div class="text-right">
                        <div class="font-bold text-gray-900">${iv.score}<span class="text-xs text-gray-400">/100</span></div>
                      </div>
                      <div class="w-16 progress-bar">
                        <div class="progress-fill ${iv.score > 80 ? 'green' : iv.score > 60 ? 'blue' : 'orange'}" style="width:${iv.score}%"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <button onclick="navigate('student_interview')" class="btn btn-secondary w-full mt-4">
                  <i class="fas fa-robot"></i> Пройти AI-собеседование
                </button>
              </div>
            </div>

            <!-- Profile Completion & Info -->
            <div class="space-y-5">
              <div class="card" style="background:linear-gradient(135deg,#eff6ff,#ede9fe)">
                <div class="text-sm font-bold text-gray-700 mb-1">UniWay Score</div>
                <div class="text-4xl font-black text-blue-600">${avgScore > 0 ? avgScore : interviews.length > 0 ? stats?.avgInterviewScore || '—' : '—'}</div>
                <div class="text-xs text-gray-500 mt-1">${tasksCompleted > 0 ? 'Основан на ваших результатах' : 'Выполните задания для получения балла'}</div>
                <div class="mt-3 space-y-1.5">
                  ${[
                    { done: true, label: 'Аккаунт создан' },
                    { done: !!user.university, label: 'Университет указан' },
                    { done: tasksCompleted > 0, label: 'Первое задание выполнено' },
                    { done: interviews.length > 0, label: 'AI-собеседование пройдено' },
                  ].map(item => `
                    <div class="flex items-center gap-2 text-xs">
                      <i class="fas ${item.done ? 'fa-check-circle text-green-500' : 'fa-circle text-gray-300'}"></i>
                      <span class="${item.done ? 'text-gray-700' : 'text-gray-400'}">${item.label}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="card">
                <h4 class="font-bold text-gray-900 mb-4">Профиль</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="fas fa-envelope w-4 text-center text-blue-400"></i>
                    <span class="truncate">${user.email}</span>
                  </div>
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="fas fa-graduation-cap w-4 text-center text-blue-400"></i>
                    <span>${user.university || 'Не указан'}</span>
                  </div>
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="fas fa-map-marker-alt w-4 text-center text-blue-400"></i>
                    <span>${user.city || 'Казахстан'}</span>
                  </div>
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="fas fa-code w-4 text-center text-blue-400"></i>
                    <span>${user.direction || 'IT'}</span>
                  </div>
                </div>
                <button onclick="navigate('student_profile')" class="btn btn-secondary w-full btn-sm mt-4">
                  <i class="fas fa-edit"></i> Редактировать
                </button>
              </div>

              <div class="card">
                <h4 class="font-bold text-gray-900 mb-3">Рекомендации</h4>
                <div class="space-y-3">
                  ${[
                    { icon: 'fa-star text-yellow-500', text: 'Пройди AI-собеседование для повышения рейтинга', action: "navigate('student_interview')" },
                    { icon: 'fa-rocket text-blue-500', text: 'Возьми задание по React от Jusan Bank', action: "navigate('catalog')" },
                    { icon: 'fa-file text-green-500', text: 'Создай резюме с результатами', action: "navigate('student_resume')" },
                  ].map(r => `
                    <div class="flex items-start gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-1 -m-1" onclick="${r.action}">
                      <i class="fas ${r.icon} mt-0.5 flex-shrink-0"></i>
                      <span class="text-gray-600">${r.text}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== STUDENT SIDEBAR =====
function renderStudentSidebar(active) {
  const items = [
    { key: 'dashboard', icon: 'fa-home', label: 'Дашборд', page: 'student_dashboard' },
    { key: 'profile', icon: 'fa-user', label: 'Мой профиль', page: 'student_profile' },
    { key: 'tasks', icon: 'fa-tasks', label: 'Задания', page: 'student_tasks' },
    { key: 'interview', icon: 'fa-robot', label: 'AI-собеседование', page: 'student_interview' },
    { key: 'portfolio', icon: 'fa-folder-open', label: 'Портфолио', page: 'student_portfolio' },
    { key: 'resume', icon: 'fa-file-alt', label: 'Резюме', page: 'student_resume' },
  ];
  const avgScore = State.userStats?.avgScore || State.userStats?.avgInterviewScore || '';
  return `
  <aside class="hidden lg:block w-56 flex-shrink-0">
    <div class="sticky top-24">
      <div class="card-flat p-4">
        <!-- Mini Profile -->
        <div class="flex flex-col items-center text-center pb-4 mb-4 border-b border-gray-100">
          <div class="avatar w-14 h-14 text-xl mb-3">${State.currentUser?.avatar || 'U'}</div>
          <div class="font-bold text-gray-900 text-sm">${State.currentUser?.name || 'Student'}</div>
          <div class="text-xs text-gray-500 mt-0.5">${State.currentUser?.direction || 'IT'}</div>
          ${avgScore ? `<div class="badge badge-green mt-2 text-xs">⭐ ${avgScore} балл</div>` : '<div class="badge badge-blue mt-2 text-xs">Студент</div>'}
        </div>
        
        <nav class="space-y-1">
          ${items.map(item => `
            <button onclick="navigate('${item.page}')" class="sidebar-nav-link ${active === item.key ? 'active' : ''} w-full">
              <span class="icon"><i class="fas ${item.icon}"></i></span>
              <span>${item.label}</span>
            </button>
          `).join('')}
        </nav>

        <div class="mt-4 pt-4 border-t border-gray-100">
          <button onclick="navigate('catalog')" class="sidebar-nav-link w-full">
            <span class="icon"><i class="fas fa-search"></i></span>
            <span>Найти задание</span>
          </button>
          <button onclick="logout()" class="sidebar-nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
            <span class="icon"><i class="fas fa-sign-out-alt"></i></span>
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </div>
  </aside>`;
}

// ===== STUDENT TASKS =====
function renderStudentTasks() {
  if (!State.currentUser) { navigate('login'); return ''; }
  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex gap-8">
        ${renderStudentSidebar('tasks')}
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-2xl font-black text-gray-900">Мои задания</h1>
              <p class="text-gray-500 text-sm mt-1">Выполненные и активные тестовые задания</p>
            </div>
            <button onclick="navigate('catalog')" class="btn btn-primary btn-sm">
              <i class="fas fa-plus"></i> Найти задание
            </button>
          </div>

          <!-- Tabs -->
          <div class="tabs mb-6" style="max-width:400px">
            <button class="tab-btn active" id="tab-active" onclick="switchTaskTab('active')">Активные (2)</button>
            <button class="tab-btn" id="tab-completed" onclick="switchTaskTab('completed')">Выполнено (3)</button>
            <button class="tab-btn" id="tab-uploaded" onclick="switchTaskTab('uploaded')">Загруженные (1)</button>
          </div>

          <div class="space-y-4">
            ${MOCK_TASKS.map((task, i) => `
              <div class="card hover-lift">
                <div class="flex items-start gap-4">
                  <div class="company-logo w-12 h-12 text-sm flex-shrink-0">${task.companyLogo}</div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <h3 class="font-bold text-gray-900">${task.title}</h3>
                        <div class="text-sm text-gray-500 mt-0.5">${task.company} · ${task.deadline}</div>
                      </div>
                      <div class="flex items-center gap-2 flex-shrink-0">
                        ${task.score ? `
                          <div class="text-right">
                            <div class="text-xl font-black ${task.score >= 80 ? 'text-green-600' : task.score >= 60 ? 'text-blue-600' : 'text-orange-600'}">${task.score}</div>
                            <div class="text-xs text-gray-400">/ 100</div>
                          </div>
                        ` : `<span class="badge badge-orange">В процессе</span>`}
                      </div>
                    </div>
                    
                    ${task.score ? `
                      <div class="mt-3">
                        <div class="progress-bar">
                          <div class="progress-fill ${task.score >= 80 ? 'green' : 'blue'}" style="width:${task.score}%"></div>
                        </div>
                        <div class="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                          <i class="fas fa-robot text-blue-500 mr-1"></i>
                          <strong>AI:</strong> Хорошая работа! Логика реализована правильно. Рекомендую улучшить обработку ошибок и добавить unit-тесты.
                        </div>
                      </div>
                    ` : `
                      <div class="mt-3 flex gap-2">
                        <button onclick="navigate('task_detail', {id: ${task.id}})" class="btn btn-primary btn-sm">
                          <i class="fas fa-upload"></i> Отправить решение
                        </button>
                        <button class="btn btn-ghost btn-sm">
                          <i class="fas fa-eye"></i> Просмотр
                        </button>
                      </div>
                    `}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== STUDENT INTERVIEW (AI) =====
function renderStudentInterview() {
  if (!State.currentUser) { navigate('login'); return ''; }
  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex gap-8">
        ${renderStudentSidebar('interview')}
        <div class="flex-1 min-w-0">
          <div class="mb-6">
            <h1 class="text-2xl font-black text-gray-900">${t('interview_title')}</h1>
            <p class="text-gray-500 text-sm mt-1">${t('interview_sub')}</p>
          </div>

          ${!State.interviewStarted ? renderInterviewSetup() : renderInterviewChat()}
        </div>
      </div>
    </div>
  </main>`;
}

function renderInterviewSetup() {
  return `
  <div class="grid lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <div class="card p-8">
        <div class="text-center mb-8">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-robot text-3xl text-white"></i>
          </div>
          <h2 class="text-2xl font-black text-gray-900">AI HR-собеседование</h2>
          <p class="text-gray-500 mt-2">Симуляция настоящего собеседования с искусственным интеллектом</p>
        </div>

        <div class="grid md:grid-cols-2 gap-4 mb-8">
          <div class="form-group mb-0">
            <label class="form-label">Направление</label>
            <select class="form-select" id="interview-dir">
              <option value="IT">IT / Разработка</option>
              <option value="Маркетинг">Маркетинг</option>
              <option value="Дизайн">Дизайн</option>
              <option value="Бизнес">Бизнес / Аналитика</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Уровень</label>
            <select class="form-select" id="interview-level">
              <option>Intern</option>
              <option>Junior</option>
              <option>Middle</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 mb-8">
          ${[
            { icon: 'fa-comments', label: '5-7 вопросов', color: 'blue' },
            { icon: 'fa-clock', label: '10-15 минут', color: 'purple' },
            { icon: 'fa-chart-bar', label: 'Оценка 0-100', color: 'green' },
          ].map(f => `
            <div class="text-center p-4 rounded-xl bg-gray-50">
              <i class="fas ${f.icon} text-${f.color}-600 text-xl mb-2 block"></i>
              <span class="text-sm font-medium text-gray-700">${f.label}</span>
            </div>
          `).join('')}
        </div>

        <button onclick="startInterview()" class="btn btn-primary w-full btn-xl">
          <i class="fas fa-play"></i> Начать AI-собеседование
        </button>
      </div>
    </div>

    <div class="space-y-5">
      <div class="card">
        <h4 class="font-bold text-gray-900 mb-4">Предыдущие результаты</h4>
        <div class="space-y-3">
          ${[
            { dir: 'IT / Frontend', score: 88, date: '12 апр 2025' },
            { dir: 'IT / Backend', score: 75, date: '8 апр 2025' },
            { dir: 'General HR', score: 63, date: '3 апр 2025' },
          ].map(r => `
            <div class="p-3 rounded-xl bg-gray-50">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-800">${r.dir}</span>
                <span class="font-black text-lg ${r.score >= 80 ? 'text-green-600' : r.score >= 60 ? 'text-blue-600' : 'text-orange-600'}">${r.score}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${r.score >= 80 ? 'green' : 'blue'}" style="width:${r.score}%"></div>
              </div>
              <div class="text-xs text-gray-400 mt-1">${r.date}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="background:linear-gradient(135deg,#eff6ff,#ede9fe)">
        <h4 class="font-bold text-gray-900 mb-3">AI оценивает:</h4>
        <div class="space-y-2">
          ${[
            'Полнота ответа', 'Логичность', 'Уверенность', 
            'Профессиональная лексика', 'Структура ответа'
          ].map(c => `
            <div class="flex items-center gap-2 text-sm text-gray-700">
              <i class="fas fa-check-circle text-blue-500"></i> ${c}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

function renderInterviewChat() {
  const messages = State.interviewMessages || [];
  return `
  <div class="grid lg:grid-cols-4 gap-6">
    <div class="lg:col-span-3">
      <div class="card" style="height:600px;display:flex;flex-direction:column">
        <!-- Chat Header -->
        <div class="flex items-center gap-3 p-4 border-b border-gray-100">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <i class="fas fa-robot text-white text-sm"></i>
          </div>
          <div>
            <div class="font-bold text-gray-900 text-sm">UniWay AI Recruiter</div>
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full bg-green-400"></div>
              <span class="text-xs text-gray-500">Онлайн · Собеседование началось</span>
            </div>
          </div>
          <div class="ml-auto">
            <div class="text-sm font-medium text-gray-700">Вопрос ${State.interviewQ + 1}/${(AI_INTERVIEW_QUESTIONS[State.interviewDir] || AI_INTERVIEW_QUESTIONS.IT).length}</div>
          </div>
        </div>

        <!-- Messages -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages">
          ${messages.map(msg => `
            <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3">
              ${msg.role === 'ai' ? `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0"><i class="fas fa-robot text-white text-xs"></i></div>` : ''}
              <div class="chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}">${msg.text}</div>
              ${msg.role === 'user' ? `<div class="avatar w-8 h-8 text-xs flex-shrink-0">${State.currentUser?.avatar || 'U'}</div>` : ''}
            </div>
            ${msg.feedback ? `
              <div class="ml-11 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <div class="text-xs font-bold text-blue-700 mb-1"><i class="fas fa-lightbulb mr-1"></i> AI Обратная связь</div>
                <p class="text-xs text-blue-600">${msg.feedback}</p>
                <div class="flex items-center gap-3 mt-2">
                  <span class="text-xs text-gray-500">Оценка ответа:</span>
                  <div class="flex gap-1">
                    ${Array.from({length: 5}, (_, i) => `
                      <i class="fas fa-star text-xs ${i < Math.round((msg.score || 70) / 20) ? 'text-yellow-400' : 'text-gray-200'}"></i>
                    `).join('')}
                  </div>
                  <span class="text-xs font-bold text-blue-600">${msg.score || 70}/100</span>
                </div>
              </div>
            ` : ''}
          `).join('')}
          
          ${State.interviewTyping ? `
            <div class="flex justify-start gap-3">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-white text-xs"></i>
              </div>
              <div class="chat-bubble ai">
                <div class="chat-typing"><span></span><span></span><span></span></div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-gray-100">
          ${State.interviewFinished ? `
            <div class="text-center">
              <div class="text-gray-500 text-sm mb-3">Собеседование завершено</div>
              <button onclick="showInterviewResults()" class="btn btn-primary">
                <i class="fas fa-chart-bar"></i> Посмотреть результаты
              </button>
            </div>
          ` : `
            <div class="flex gap-2">
              <textarea class="form-textarea" style="min-height:60px;resize:none" id="user-answer" placeholder="Введите ваш ответ..." onkeydown="handleAnswerKey(event)"></textarea>
              <button onclick="sendAnswer()" class="btn btn-primary flex-shrink-0" style="align-self:flex-end;height:44px;width:44px;padding:0">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          `}
        </div>
      </div>
    </div>

    <!-- Score Sidebar -->
    <div class="space-y-4">
      <div class="card text-center">
        <div class="text-sm font-bold text-gray-700 mb-3">Текущий балл</div>
        <div class="text-5xl font-black text-blue-600 mb-1">${State.interviewScore || 0}</div>
        <div class="text-gray-400 text-sm">/ 100</div>
        <div class="progress-bar mt-3">
          <div class="progress-fill blue" style="width:${State.interviewScore || 0}%"></div>
        </div>
      </div>
      <div class="card">
        <div class="text-sm font-bold text-gray-700 mb-3">Прогресс</div>
        <div class="space-y-2">
          ${(AI_INTERVIEW_QUESTIONS[State.interviewDir] || AI_INTERVIEW_QUESTIONS.IT).map((q, i) => `
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${i < State.interviewQ ? 'bg-green-100 text-green-600' : i === State.interviewQ ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}">
                ${i < State.interviewQ ? '✓' : i + 1}
              </div>
              <div class="text-xs ${i < State.interviewQ ? 'text-green-600' : i === State.interviewQ ? 'text-blue-600 font-medium' : 'text-gray-400'} truncate">
                Вопрос ${i + 1}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <button onclick="State.interviewStarted=false; State.interviewFinished=false; State.interviewMessages=[]; renderApp()" class="btn btn-ghost btn-sm w-full text-red-500">
        <i class="fas fa-times"></i> Завершить
      </button>
    </div>
  </div>`;
}

// ===== STUDENT RESUME =====
function renderStudentResume() {
  if (!State.currentUser) { navigate('login'); return ''; }
  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex gap-8">
        ${renderStudentSidebar('resume')}
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-2xl font-black text-gray-900">${t('resume_title')}</h1>
              <p class="text-gray-500 text-sm mt-1">${t('resume_sub')}</p>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm"><i class="fas fa-download"></i> PDF</button>
              <button class="btn btn-primary btn-sm"><i class="fas fa-share"></i> Поделиться</button>
            </div>
          </div>

          <div class="grid lg:grid-cols-3 gap-6">
            <!-- Resume Preview -->
            <div class="lg:col-span-2">
              <div class="card" style="font-size:0.875rem">
                <!-- Header -->
                <div class="flex items-start gap-4 pb-5 mb-5 border-b border-gray-100">
                  <div class="avatar w-16 h-16 text-xl">${State.currentUser.avatar}</div>
                  <div class="flex-1">
                    <h2 class="text-xl font-black text-gray-900">${State.currentUser.name}</h2>
                    <p class="text-blue-600 font-medium">Junior Frontend Developer</p>
                    <div class="flex flex-wrap gap-3 mt-2 text-gray-500 text-xs">
                      <span><i class="fas fa-map-marker-alt mr-1"></i>Алматы, Казахстан</span>
                      <span><i class="fas fa-envelope mr-1"></i>student@test.kz</span>
                      <span><i class="fas fa-graduation-cap mr-1"></i>НУАД, 3 курс</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="badge badge-green text-xs mb-1">✓ UniWay Verified</div>
                    <div class="text-2xl font-black text-blue-600">84</div>
                    <div class="text-xs text-gray-400">UniWay Score</div>
                  </div>
                </div>

                <!-- Skills Section -->
                <div class="mb-5">
                  <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fas fa-code text-blue-600"></i> Подтверждённые навыки
                  </h3>
                  <div class="space-y-2">
                    ${[
                      { skill: 'JavaScript / TypeScript', score: 84, badge: 'Подтверждено заданием' },
                      { skill: 'React.js', score: 92, badge: 'Jusan Bank' },
                      { skill: 'Python / FastAPI', score: 84, badge: 'Kolesa Group' },
                      { skill: 'CSS / Tailwind CSS', score: 90, badge: 'Подтверждено' },
                    ].map(s => `
                      <div class="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <div class="flex-1">
                          <div class="font-medium text-gray-800 text-sm">${s.skill}</div>
                          <div class="progress-bar mt-1" style="height:4px">
                            <div class="progress-fill blue" style="width:${s.score}%"></div>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="font-bold text-gray-900">${s.score}<span class="text-xs text-gray-400">/100</span></div>
                          <div class="text-xs text-green-600">${s.badge}</div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Completed Tasks -->
                <div class="mb-5">
                  <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fas fa-trophy text-yellow-500"></i> Выполненные тестовые задания
                  </h3>
                  <div class="space-y-3">
                    ${MOCK_TASKS.filter(t => t.score).map(task => `
                      <div class="p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <div class="flex items-center justify-between mb-1">
                          <span class="font-medium text-gray-900">${task.title}</span>
                          <span class="font-black text-green-600">${task.score}/100</span>
                        </div>
                        <div class="text-xs text-gray-500 mb-2">${task.company} · ${task.direction}</div>
                        <div class="text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                          <i class="fas fa-robot text-blue-500 mr-1"></i>
                          AI-оценка: Отличная структура кода. Хорошо применены современные паттерны.
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- AI Interview Results -->
                <div>
                  <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fas fa-robot text-purple-600"></i> AI-собеседования
                  </h3>
                  <div class="grid grid-cols-3 gap-3">
                    ${[
                      { dir: 'Frontend', score: 88, emoji: '💻' },
                      { dir: 'Backend', score: 75, emoji: '⚙️' },
                      { dir: 'General HR', score: 83, emoji: '🗣️' },
                    ].map(r => `
                      <div class="text-center p-3 rounded-xl bg-purple-50 border border-purple-100">
                        <div class="text-2xl mb-1">${r.emoji}</div>
                        <div class="text-lg font-black text-purple-600">${r.score}</div>
                        <div class="text-xs text-gray-500">${r.dir}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="space-y-5">
              <div class="card" style="background:linear-gradient(135deg,#eff6ff,#ede9fe)">
                <h4 class="font-bold text-gray-900 mb-3">UniWay Score</h4>
                <div class="flex items-center gap-4">
                  <div class="text-5xl font-black text-blue-600">84</div>
                  <div>
                    <div class="text-sm font-medium text-gray-700">Отличный результат!</div>
                    <div class="text-xs text-gray-500 mt-1">Топ 15% студентов платформы</div>
                    <div class="progress-bar mt-2" style="width:100px">
                      <div class="progress-fill blue" style="width:84%"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card">
                <h4 class="font-bold text-gray-900 mb-3">Действия</h4>
                <div class="space-y-2">
                  <button class="btn btn-primary w-full btn-sm"><i class="fas fa-download"></i> Скачать PDF</button>
                  <button class="btn btn-secondary w-full btn-sm"><i class="fas fa-link"></i> Публичная ссылка</button>
                  <button class="btn btn-ghost w-full btn-sm"><i class="fas fa-edit"></i> Редактировать</button>
                </div>
              </div>

              <div class="card">
                <h4 class="font-bold text-gray-900 mb-3">Добавить опыт</h4>
                <div class="space-y-2">
                  <button class="btn w-full btn-sm" style="background:#f1f5f9;color:#475569">
                    <i class="fas fa-upload text-blue-500"></i> Загрузить задание
                  </button>
                  <button onclick="navigate('student_interview')" class="btn w-full btn-sm" style="background:#f1f5f9;color:#475569">
                    <i class="fas fa-robot text-purple-500"></i> AI-собеседование
                  </button>
                  <button class="btn w-full btn-sm" style="background:#f1f5f9;color:#475569">
                    <i class="fas fa-certificate text-green-500"></i> Добавить сертификат
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== STUDENT PORTFOLIO =====
function renderStudentPortfolio() {
  if (!State.currentUser) { navigate('login'); return ''; }
  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex gap-8">
        ${renderStudentSidebar('portfolio')}
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-2xl font-black text-gray-900">Моё портфолио</h1>
              <p class="text-gray-500 text-sm mt-1">Выполненные задания и проекты</p>
            </div>
            <button onclick="showUploadPortfolioModal()" class="btn btn-primary btn-sm">
              <i class="fas fa-plus"></i> Добавить работу
            </button>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${MOCK_TASKS.map(task => `
              <div class="card hover-lift">
                <div class="flex items-start justify-between mb-3">
                  <div class="company-logo w-10 h-10 text-xs">${task.companyLogo}</div>
                  <div class="flex gap-1">
                    <span class="badge badge-blue text-xs">${task.direction}</span>
                    ${task.score ? `<span class="badge badge-green text-xs">${task.score}/100</span>` : `<span class="badge badge-orange text-xs">В процессе</span>`}
                  </div>
                </div>
                <h3 class="font-bold text-gray-900 text-sm mb-1">${task.title}</h3>
                <p class="text-xs text-gray-500 mb-3">${task.company}</p>
                <div class="flex flex-wrap gap-1 mb-3">
                  ${task.tags.slice(0,2).map(tag => `<span class="skill-tag text-xs">${tag}</span>`).join('')}
                </div>
                ${task.score ? `
                  <div class="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                    <i class="fas fa-robot text-blue-400 mr-1"></i> Подтверждено AI-оценкой
                  </div>
                ` : ''}
                <div class="flex gap-2 mt-3">
                  <button class="btn btn-ghost btn-sm flex-1 text-xs"><i class="fas fa-eye"></i> Открыть</button>
                  <button class="btn btn-secondary btn-sm flex-1 text-xs"><i class="fas fa-share"></i> Поделиться</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== STUDENT PROFILE =====
function renderStudentProfile() {
  if (!State.currentUser) { navigate('login'); return ''; }
  const user = State.currentUser;
  const nameParts = user.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const avgScore = State.userStats?.avgScore || State.userStats?.avgInterviewScore || null;
  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex gap-8">
        ${renderStudentSidebar('profile')}
        <div class="flex-1 min-w-0">
          <div class="mb-6">
            <h1 class="text-2xl font-black text-gray-900">Мой профиль</h1>
          </div>
          <div class="grid lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-5">
              <div class="card">
                <h3 class="font-bold text-gray-900 mb-5">Личная информация</h3>
                <div class="flex items-center gap-5 mb-6">
                  <div class="avatar w-20 h-20 text-2xl">${user.avatar}</div>
                  <div>
                    <div class="text-xl font-black text-gray-900">${user.name}</div>
                    <div class="text-blue-600 text-sm">${user.direction || 'IT'}${user.university ? ' · ' + user.university : ''}</div>
                    <div class="text-xs text-gray-400 mt-0.5">${user.city || 'Казахстан'} · С ${new Date(user.createdAt).toLocaleDateString('ru')}</div>
                  </div>
                </div>
                <div class="grid md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label class="form-label">Имя</label>
                    <input type="text" class="form-input" id="prof-name" value="${firstName}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Фамилия</label>
                    <input type="text" class="form-input" id="prof-lastname" value="${lastName}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" value="${user.email}" readonly style="background:#f8fafc;color:#64748b">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Город</label>
                    <input type="text" class="form-input" id="prof-city" value="${user.city || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Университет</label>
                    <input type="text" class="form-input" id="prof-university" value="${user.university || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Направление</label>
                    <select class="form-select" id="prof-direction-select">
                      ${['IT', 'Маркетинг', 'Дизайн', 'Бизнес'].map(d => `<option value="${d}" ${(user.direction || 'IT') === d ? 'selected' : ''}>${d}</option>`).join('')}
                    </select>
                  </div>
                </div>
                <button onclick="saveProfileFull()" class="btn btn-primary mt-2">
                  <i class="fas fa-save"></i> Сохранить изменения
                </button>
              </div>

              <!-- Change Password -->
              <div class="card">
                <h4 class="font-bold text-gray-900 mb-3"><i class="fas fa-lock text-blue-500 mr-1"></i> Безопасность</h4>
                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label text-xs">Текущий пароль</label>
                    <input type="password" class="form-input" id="curr-pass" placeholder="••••••">
                  </div>
                  <div>
                    <label class="form-label text-xs">Новый пароль (мин. 6 символов)</label>
                    <input type="password" class="form-input" id="new-pass" placeholder="Новый пароль">
                  </div>
                </div>
                <button onclick="changePassword()" class="btn btn-secondary btn-sm mt-3">
                  <i class="fas fa-key"></i> Сменить пароль
                </button>
                <p class="text-xs text-gray-400 mt-2">
                  <i class="fas fa-shield-alt text-green-500 mr-1"></i>
                  Ваш пароль хранится в зашифрованном виде (SHA-256 + соль)
                </p>
              </div>
            </div>

            <div class="space-y-5">
              <div class="card" style="background:linear-gradient(135deg,#eff6ff,#ede9fe)">
                <div class="text-sm font-bold text-gray-700 mb-1">UniWay Score</div>
                <div class="text-4xl font-black text-blue-600">${avgScore || '—'}</div>
                <div class="text-xs text-gray-500 mt-1">${avgScore ? 'Основан на ваших результатах' : 'Выполните задания для получения балла'}</div>
              </div>

              <div class="card">
                <h4 class="font-bold text-gray-900 mb-3">Статистика</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Заданий выполнено</span>
                    <span class="font-bold text-gray-900">${State.userStats?.tasksCompleted ?? (State.userSubmissions?.filter(s => s.status === 'evaluated').length ?? 0)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Собеседований</span>
                    <span class="font-bold text-gray-900">${State.userStats?.interviewsCount ?? (State.userInterviews?.length ?? 0)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Дата регистрации</span>
                    <span class="font-bold text-gray-900">${new Date(user.createdAt).toLocaleDateString('ru')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== COMPANY SIDEBAR =====
function renderCompanySidebar(active) {
  const items = [
    { key: 'dashboard', icon: 'fa-home', label: 'Дашборд', page: 'company_dashboard' },
    { key: 'tasks', icon: 'fa-tasks', label: 'Мои задания', page: 'company_tasks' },
    { key: 'candidates', icon: 'fa-users', label: 'Кандидаты', page: 'company_candidates' },
    { key: 'profile', icon: 'fa-building', label: 'Профиль компании', page: 'company_profile' },
  ];
  const user = State.currentUser;
  const companyName = user?.companyName || user?.name || 'Компания';
  const logoLetters = companyName.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  return `
  <aside class="hidden lg:block w-56 flex-shrink-0">
    <div class="sticky top-24">
      <div class="card-flat p-4">
        <div class="flex flex-col items-center text-center pb-4 mb-4 border-b border-gray-100">
          <div class="company-logo w-12 h-12 text-sm mb-3">${logoLetters}</div>
          <div class="font-bold text-gray-900 text-sm">${companyName}</div>
          <div class="text-xs text-gray-500 mt-0.5">${user?.industry || 'IT / Технологии'}</div>
          <div class="badge badge-blue mt-2 text-xs">Компания</div>
        </div>
        <nav class="space-y-1">
          ${items.map(item => `
            <button onclick="navigate('${item.page}')" class="sidebar-nav-link ${active === item.key ? 'active' : ''} w-full">
              <span class="icon"><i class="fas ${item.icon}"></i></span>
              <span>${item.label}</span>
            </button>
          `).join('')}
        </nav>
        <div class="mt-4 pt-4 border-t border-gray-100">
          <button onclick="logout()" class="sidebar-nav-link w-full text-red-500 hover:bg-red-50">
            <span class="icon"><i class="fas fa-sign-out-alt"></i></span><span>Выйти</span>
          </button>
        </div>
      </div>
    </div>
  </aside>`;
}

// ===== COMPANY DASHBOARD =====
function renderCompanyDashboard() {
  if (!State.currentUser) { navigate('login'); return ''; }
  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex gap-8">
        ${renderCompanySidebar('dashboard')}
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h1 class="text-2xl font-black text-gray-900">Панель компании</h1>
              <p class="text-gray-500 text-sm mt-1">Управление заданиями и кандидатами</p>
            </div>
            <button onclick="showCreateTaskModal()" class="btn btn-primary">
              <i class="fas fa-plus"></i> Создать задание
            </button>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            ${[
              { icon: 'fa-tasks', label: 'Активных заданий', val: '6', bg: 'bg-blue-50', tc: 'text-blue-600' },
              { icon: 'fa-users', label: 'Кандидатов', val: '247', bg: 'bg-green-50', tc: 'text-green-600' },
              { icon: 'fa-check-circle', label: 'Проверено', val: '189', bg: 'bg-purple-50', tc: 'text-purple-600' },
              { icon: 'fa-star', label: 'Ср. балл', val: '78', bg: 'bg-orange-50', tc: 'text-orange-600' },
            ].map(s => `
              <div class="card-flat">
                <div class="feature-icon w-10 h-10 rounded-xl ${s.bg} ${s.tc} text-base mb-2"><i class="fas ${s.icon}"></i></div>
                <div class="text-2xl font-black text-gray-900">${s.val}</div>
                <div class="text-xs text-gray-500 mt-1">${s.label}</div>
              </div>
            `).join('')}
          </div>

          <div class="grid lg:grid-cols-5 gap-6">
            <!-- Tasks -->
            <div class="lg:col-span-3">
              <div class="card">
                <div class="flex items-center justify-between mb-5">
                  <h3 class="font-bold text-gray-900">Мои задания</h3>
                  <button onclick="navigate('company_tasks')" class="text-blue-600 text-sm hover:underline">Управлять →</button>
                </div>
                <div class="space-y-3">
                  ${MOCK_TASKS.slice(0,4).map(task => `
                    <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-tasks text-blue-600 text-sm"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 text-sm truncate">${task.title}</div>
                        <div class="text-xs text-gray-500">${task.applicants} участников · ${task.deadline}</div>
                      </div>
                      <div class="flex gap-2 flex-shrink-0">
                        <button onclick="navigate('company_candidates')" class="btn btn-secondary btn-sm text-xs px-3">Кандидаты</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Top Candidates -->
            <div class="lg:col-span-2">
              <div class="card">
                <div class="flex items-center justify-between mb-5">
                  <h3 class="font-bold text-gray-900">Топ кандидаты</h3>
                  <button onclick="navigate('company_candidates')" class="text-blue-600 text-sm hover:underline">Все →</button>
                </div>
                <div class="space-y-3">
                  ${MOCK_STUDENTS.map((s, i) => `
                    <div class="flex items-center gap-3">
                      <div class="relative">
                        <div class="avatar w-10 h-10 text-sm">${s.avatar}</div>
                        ${i === 0 ? `<div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs">👑</div>` : ''}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 text-sm truncate">${s.name}</div>
                        <div class="text-xs text-gray-500">${s.direction} · ${s.tasks} заданий</div>
                      </div>
                      <div class="text-right">
                        <div class="font-black text-lg ${s.score >= 85 ? 'text-green-600' : 'text-blue-600'}">${s.score}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== COMPANY TASKS =====
function renderCompanyTasks() {
  if (!State.currentUser) { navigate('login'); return ''; }
  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex gap-8">
        ${renderCompanySidebar('tasks')}
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-black text-gray-900">Мои задания</h1>
            <button onclick="showCreateTaskModal()" class="btn btn-primary">
              <i class="fas fa-plus"></i> Создать задание
            </button>
          </div>
          <div class="space-y-4">
            ${MOCK_TASKS.map(task => `
              <div class="card">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-tasks text-blue-600"></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 class="font-bold text-gray-900">${task.title}</h3>
                        <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span><i class="fas fa-users mr-1"></i>${task.applicants} участников</span>
                          <span><i class="fas fa-calendar mr-1"></i>${task.deadline}</span>
                          <span class="badge badge-blue">${task.direction}</span>
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <button onclick="navigate('company_candidates')" class="btn btn-secondary btn-sm">
                          <i class="fas fa-users"></i> Кандидаты
                        </button>
                        <button class="btn btn-ghost btn-sm"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-ghost btn-sm text-red-400"><i class="fas fa-trash"></i></button>
                      </div>
                    </div>
                    <div class="mt-3 flex items-center gap-4">
                      <div class="flex-1 progress-bar" style="height:6px">
                        <div class="progress-fill blue" style="width:${Math.round(task.applicants/100*100)}%"></div>
                      </div>
                      <span class="text-xs text-gray-500">${task.applicants}/100 мест</span>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== COMPANY CANDIDATES =====
function renderCompanyCandidates() {
  if (!State.currentUser) { navigate('login'); return ''; }
  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex gap-8">
        ${renderCompanySidebar('candidates')}
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-2xl font-black text-gray-900">Кандидаты</h1>
              <p class="text-gray-500 text-sm mt-1">${MOCK_STUDENTS.length} кандидатов по всем заданиям</p>
            </div>
            <div class="flex gap-2">
              <select class="form-select" style="width:auto">
                <option>Все задания</option>
                ${MOCK_TASKS.map(t => `<option>${t.title}</option>`).join('')}
              </select>
              <select class="form-select" style="width:auto">
                <option>Сортировка: Балл ↓</option>
                <option>По дате</option>
                <option>По имени</option>
              </select>
            </div>
          </div>

          <div class="card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Студент</th>
                    <th>Направление</th>
                    <th>Задание</th>
                    <th>Балл</th>
                    <th>AI-оценка</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  ${MOCK_STUDENTS.flatMap(s => 
                    MOCK_TASKS.slice(0, 2).map(task => `
                      <tr>
                        <td>
                          <div class="flex items-center gap-3">
                            <div class="avatar w-9 h-9 text-sm">${s.avatar}</div>
                            <div>
                              <div class="font-medium text-gray-900 text-sm">${s.name}</div>
                              <div class="text-xs text-gray-500">${s.university}</div>
                            </div>
                          </div>
                        </td>
                        <td><span class="badge badge-blue text-xs">${s.direction}</span></td>
                        <td class="text-sm text-gray-600 max-w-xs truncate">${task.title}</td>
                        <td>
                          <div class="flex items-center gap-2">
                            <div class="font-bold text-lg ${s.score >= 85 ? 'text-green-600' : s.score >= 70 ? 'text-blue-600' : 'text-orange-600'}">${s.score}</div>
                            <div class="w-16 progress-bar" style="height:4px">
                              <div class="progress-fill ${s.score >= 85 ? 'green' : 'blue'}" style="width:${s.score}%"></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="text-xs text-gray-600 max-w-xs">
                            <i class="fas fa-robot text-blue-400 mr-1"></i>
                            Хорошее решение. ${s.score >= 85 ? 'Рекомендуем!' : 'Требует улучшения.'}
                          </div>
                        </td>
                        <td>
                          <div class="flex gap-1">
                            <button class="btn btn-primary btn-sm text-xs" onclick="showNotification('Приглашение отправлено!', 'success')">
                              <i class="fas fa-envelope"></i> Пригласить
                            </button>
                            <button class="btn btn-ghost btn-sm">
                              <i class="fas fa-eye text-gray-400"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `)
                  ).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== COMPANY PROFILE =====
function renderCompanyProfile() {
  if (!State.currentUser) { navigate('login'); return ''; }
  const user = State.currentUser;
  const companyName = user.companyName || user.name;
  const logoLetters = companyName.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex gap-8">
        ${renderCompanySidebar('profile')}
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-black text-gray-900 mb-6">Профиль компании</h1>
          <div class="grid lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
              <div class="card">
                <div class="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
                  <div class="company-logo w-16 h-16 text-xl">${logoLetters}</div>
                  <div>
                    <h2 class="text-xl font-black text-gray-900">${companyName}</h2>
                    <p class="text-gray-500">${user.industry || 'IT / Технологии'}</p>
                    <p class="text-xs text-gray-400 mt-0.5">${user.city || 'Казахстан'}</p>
                  </div>
                </div>
                <div class="grid md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label class="form-label">Название компании</label>
                    <input type="text" class="form-input" id="comp-name" value="${companyName}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Сфера деятельности</label>
                    <input type="text" class="form-input" id="comp-industry" value="${user.industry || 'IT / Технологии'}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" value="${user.email}" readonly style="background:#f8fafc;color:#64748b">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Город</label>
                    <input type="text" class="form-input" id="comp-city" value="${user.city || ''}">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">О компании</label>
                  <textarea class="form-textarea" id="comp-about" placeholder="Расскажите о вашей компании, миссии и ценностях...">${user.about || ''}</textarea>
                </div>
                <button onclick="saveCompanyProfile()" class="btn btn-primary">
                  <i class="fas fa-save"></i> Сохранить изменения
                </button>
              </div>

              <!-- Change Password for company -->
              <div class="card mt-5">
                <h4 class="font-bold text-gray-900 mb-3"><i class="fas fa-lock text-blue-500 mr-1"></i> Сменить пароль</h4>
                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label text-xs">Текущий пароль</label>
                    <input type="password" class="form-input" id="curr-pass" placeholder="••••••">
                  </div>
                  <div>
                    <label class="form-label text-xs">Новый пароль</label>
                    <input type="password" class="form-input" id="new-pass" placeholder="Минимум 6 символов">
                  </div>
                </div>
                <button onclick="changePassword()" class="btn btn-secondary btn-sm mt-3">
                  <i class="fas fa-key"></i> Сменить пароль
                </button>
              </div>
            </div>

            <div class="space-y-5">
              <div class="card text-center" style="background:linear-gradient(135deg,#eff6ff,#ede9fe)">
                <div class="text-sm font-bold text-gray-700 mb-2">Информация профиля</div>
                <div class="flex items-center gap-2 text-sm text-left mt-3">
                  <i class="fas fa-envelope text-blue-400 w-4 text-center"></i>
                  <span class="text-gray-600 truncate">${user.email}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-left mt-2">
                  <i class="fas fa-calendar text-blue-400 w-4 text-center"></i>
                  <span class="text-gray-600">С ${new Date(user.createdAt).toLocaleDateString('ru')}</span>
                </div>
              </div>
              <div class="card">
                <h4 class="font-bold text-gray-900 mb-3">Быстрые действия</h4>
                <div class="space-y-2">
                  <button onclick="showCreateTaskModal()" class="btn btn-primary w-full btn-sm"><i class="fas fa-plus"></i> Создать задание</button>
                  <button onclick="navigate('company_candidates')" class="btn btn-secondary w-full btn-sm"><i class="fas fa-users"></i> Кандидаты</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== ADMIN PANEL =====
function renderAdminPanel() {
  if (!State.currentUser || State.currentRole !== 'admin') { navigate('login'); return ''; }

  // Load real data if not loaded
  if (!State.dataLoaded) {
    State.dataLoaded = true;
    Promise.all([
      AUTH.apiCall('/api/users/list'),
      AUTH.apiCall('/api/users/stats'),
    ]).then(([usersRes, statsRes]) => {
      if (usersRes.ok) State.adminUsers = usersRes.data.users || [];
      if (statsRes.ok) State.adminStats = statsRes.data;
      renderApp();
    }).catch(() => {});
  }

  const adminUsers = State.adminUsers || [];
  const stats = State.adminStats;
  const students = adminUsers.filter(u => u.role === 'student');
  const companies = adminUsers.filter(u => u.role === 'company');

  return `
  <main class="pt-16 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black text-gray-900">Панель администратора</h1>
          <p class="text-gray-500 mt-1">UniWay — Управление платформой</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="avatar w-10 h-10 text-sm">${State.currentUser.avatar}</div>
          <div>
            <div class="text-sm font-bold text-gray-900">${State.currentUser.name}</div>
            <div class="text-xs text-gray-500">Администратор</div>
          </div>
          <button onclick="logout()" class="btn btn-ghost btn-sm text-red-500">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      <!-- Live Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        ${[
          { icon: 'fa-user-graduate', label: 'Студентов', val: students.length, color: 'blue' },
          { icon: 'fa-building', label: 'Компаний', val: companies.length, color: 'green' },
          { icon: 'fa-file-alt', label: 'Решений', val: stats?.totalSubmissions ?? '—', color: 'purple' },
          { icon: 'fa-robot', label: 'Собеседований', val: stats?.totalInterviews ?? '—', color: 'orange' },
        ].map(s => `
          <div class="card-flat">
            <div class="feature-icon w-10 h-10 rounded-xl bg-${s.color}-50 text-${s.color}-600 text-base mb-2"><i class="fas ${s.icon}"></i></div>
            <div class="text-2xl font-black text-gray-900">${s.val}</div>
            <div class="text-xs text-gray-500">${s.label}</div>
          </div>
        `).join('')}
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Real Users List -->
        <div class="card">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold text-gray-900">Зарегистрированные пользователи</h3>
            <span class="badge badge-blue">${adminUsers.length} всего</span>
          </div>
          <div class="space-y-3 max-h-80 overflow-y-auto">
            ${adminUsers.length === 0 ? `
              <div class="text-center py-6 text-gray-400">
                <i class="fas fa-users text-3xl mb-2 block opacity-30"></i>
                <p class="text-sm">Нет зарегистрированных пользователей</p>
              </div>
            ` : adminUsers.map(u => `
              <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div class="avatar w-9 h-9 text-xs flex-shrink-0" style="font-size:12px">${u.avatar || u.name[0]}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 text-sm truncate">${u.name}</div>
                  <div class="text-xs text-gray-500 truncate">${u.email}</div>
                  ${u.role === 'student' ? `<div class="text-xs text-blue-500">${u.university || ''} ${u.direction ? '· ' + u.direction : ''}</div>` : `<div class="text-xs text-green-500">${u.industry || ''}</div>`}
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                  <span class="badge ${u.role === 'student' ? 'badge-blue' : u.role === 'company' ? 'badge-green' : 'badge-orange'} text-xs">
                    ${u.role === 'student' ? 'Студент' : u.role === 'company' ? 'Компания' : 'Админ'}
                  </span>
                  <span class="text-xs text-gray-400">${new Date(u.createdAt).toLocaleDateString('ru')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Platform Tasks -->
        <div class="card">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold text-gray-900">Задания платформы</h3>
            <span class="badge badge-blue">На модерации</span>
          </div>
          <div class="space-y-3">
            ${MOCK_TASKS.slice(0,4).map(task => `
              <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div class="company-logo w-10 h-10 text-xs">${task.companyLogo}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 text-sm truncate">${task.title}</div>
                  <div class="text-xs text-gray-500">${task.company} · ${task.applicants} участников</div>
                </div>
                <div class="flex gap-1">
                  <button onclick="showNotification('Задание одобрено!', 'success')" class="btn btn-accent btn-sm text-xs">Одобрить</button>
                  <button onclick="showNotification('Задание отклонено', 'error')" class="btn btn-ghost btn-sm text-red-400 text-xs">✕</button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- System Info -->
          <div class="mt-5 pt-4 border-t border-gray-100">
            <h4 class="font-bold text-gray-900 mb-3 text-sm">Системная информация</h4>
            <div class="space-y-2 text-xs text-gray-500">
              <div class="flex justify-between">
                <span>Всего аккаунтов</span>
                <span class="font-medium text-gray-700">${adminUsers.length}</span>
              </div>
              <div class="flex justify-between">
                <span>Студентов</span>
                <span class="font-medium text-blue-600">${students.length}</span>
              </div>
              <div class="flex justify-between">
                <span>Компаний</span>
                <span class="font-medium text-green-600">${companies.length}</span>
              </div>
              <div class="flex justify-between">
                <span>Версия платформы</span>
                <span class="font-medium text-gray-700">UniWay v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

// ===== ABOUT PAGE =====
function renderAboutPage() {
  return `
  <main class="pt-24 pb-16">
    <section class="py-20 text-center bg-gradient-to-br from-slate-900 to-blue-900 text-white">
      <div class="max-w-4xl mx-auto px-4">
        <div class="section-tag mx-auto mb-4" style="display:inline-flex;background:rgba(59,130,246,0.2);color:#93c5fd;border-color:rgba(59,130,246,0.3)">
          О платформе UniWay
        </div>
        <h1 class="text-5xl font-black mb-6">Миссия — дать каждому студенту шанс</h1>
        <p class="text-blue-200 text-lg max-w-2xl mx-auto leading-relaxed">
          Мы верим, что каждый студент Казахстана заслуживает справедливого шанса на карьеру. 
          UniWay создаёт мост между студентами и работодателями через реальные задания и AI-технологии.
        </p>
      </div>
    </section>

    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-4">
        <div class="grid md:grid-cols-3 gap-8">
          ${[
            { icon: 'fa-bullseye', color: 'blue', title: 'Наша цель', desc: 'Сделать первый шаг в карьеру доступным для каждого студента Казахстана, независимо от города или университета' },
            { icon: 'fa-eye', color: 'purple', title: 'Наше видение', desc: 'Стать ведущей EdTech-платформой в Центральной Азии, где доказанные навыки важнее диплома' },
            { icon: 'fa-heart', color: 'red', title: 'Наши ценности', desc: 'Честность, прозрачность и реальные результаты. Мы не обещаем — мы доказываем' },
          ].map(v => `
            <div class="card text-center hover-lift">
              <div class="feature-icon bg-${v.color}-50 text-${v.color}-600 mx-auto mb-5 text-2xl">
                <i class="fas ${v.icon}"></i>
              </div>
              <h3 class="text-xl font-black text-gray-900 mb-3">${v.title}</h3>
              <p class="text-gray-500 leading-relaxed">${v.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="py-20 bg-gray-50">
      <div class="max-w-6xl mx-auto px-4 text-center">
        <h2 class="section-title mb-4">Наша команда</h2>
        <p class="section-subtitle mb-12">Мы — команда из Алматы, которая верит в образование</p>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
          ${[
            { name: 'Турлыбеков Ахмедияр', avatar: 'ТА' },
            { name: 'Лян Арина',            avatar: 'ЛА' },
            { name: 'Сансызбаева Елдана',   avatar: 'СЕ' },
            { name: 'Каблакатова Карина',   avatar: 'КК' },
            { name: 'Аманжол Аделя',        avatar: 'АА' },
          ].map(m => `
            <div class="card text-center hover-lift">
              <div class="avatar w-16 h-16 text-xl mx-auto mb-4">${m.avatar}</div>
              <div class="font-bold text-gray-900">${m.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white text-center">
      <div class="max-w-2xl mx-auto px-4">
        <h2 class="text-4xl font-black mb-4">Присоединяйся к нам!</h2>
        <p class="text-blue-100 mb-8">Начни свой карьерный путь прямо сейчас</p>
        <button onclick="navigate('register')" class="btn btn-xl" style="background:white;color:#2563eb">
          <i class="fas fa-rocket"></i> Начать бесплатно
        </button>
      </div>
    </section>
  </main>`;
}

// ===== INTERVIEW PAGE (Public) =====
function renderInterviewPage() {
  if (!State.currentUser) { navigate('login'); return ''; }
  navigate('student_interview');
  return '';
}

// ===== FOOTER =====
function renderFooter() {
  const page = State.currentPage;
  if (page.includes('dashboard') || page.includes('profile') || page.includes('tasks') || 
      page.includes('interview') || page.includes('portfolio') || page.includes('resume') || 
      page.includes('candidates') || page === 'admin') {
    return ''; // No footer in dashboard pages
  }
  return `
  <footer class="bg-slate-900 text-white py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid md:grid-cols-4 gap-10 mb-12">
        <div>
          <div class="flex items-center gap-2 font-bold text-xl mb-4">
            <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <i class="fas fa-graduation-cap text-xs text-white"></i>
            </div>
            Uni<span class="text-blue-400">Way</span>
          </div>
          <p class="text-slate-400 text-sm leading-relaxed">${t('footer_tagline')}</p>
          <div class="flex gap-3 mt-4">
            ${['fa-instagram','fa-linkedin','fa-telegram-plane'].map(i => `
              <a href="#" class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                <i class="fab ${i} text-sm text-slate-400 hover:text-white"></i>
              </a>
            `).join('')}
          </div>
        </div>
        ${[
          { title: t('footer_students'), links: ['Задания', 'AI-собеседование', 'Резюме', 'Портфолио'] },
          { title: t('footer_companies'), links: ['Разместить задание', 'Поиск кандидатов', 'Тарифы', 'API'] },
          { title: 'Платформа', links: [t('footer_about'), 'Блог', t('footer_contact'), 'Политика'] },
        ].map(col => `
          <div>
            <h4 class="font-bold text-white mb-4">${col.title}</h4>
            <ul class="space-y-2">
              ${col.links.map(l => `<li><a href="#" class="footer-link hover:text-white">${l}</a></li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      <div class="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-slate-500 text-sm">© 2025 UniWay. Все права защищены. 🇰🇿 Сделано в Казахстане</p>
        <div class="flex gap-4">
          ${['ru','kz','en'].map(l => `
            <button onclick="setLang('${l}')" class="lang-btn text-xs ${State.lang === l ? 'active' : ''}">${l.toUpperCase()}</button>
          `).join('')}
        </div>
      </div>
    </div>
  </footer>`;
}

// ===== MODALS =====
function showCreateTaskModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'create-task-modal';
  modal.innerHTML = `
    <div class="modal-box p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-black text-gray-900">Создать задание</h2>
        <button onclick="closeModal('create-task-modal')" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
          <i class="fas fa-times text-gray-500 text-sm"></i>
        </button>
      </div>
      <form onsubmit="handleCreateTask(event)">
        <div class="form-group"><label class="form-label">Название задания</label><input type="text" class="form-input" placeholder="React компонент..." required></div>
        <div class="form-group"><label class="form-label">Описание</label><textarea class="form-textarea" placeholder="Подробное описание задания..." required></textarea></div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group"><label class="form-label">Направление</label>
            <select class="form-select"><option>IT</option><option>Маркетинг</option><option>Дизайн</option><option>Бизнес</option></select>
          </div>
          <div class="form-group"><label class="form-label">Уровень</label>
            <select class="form-select"><option>Intern</option><option>Junior</option><option>Middle</option></select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group"><label class="form-label">Дедлайн</label><input type="date" class="form-input"></div>
          <div class="form-group"><label class="form-label">Вознаграждение (₸)</label><input type="number" class="form-input" placeholder="50000"></div>
        </div>
        <div class="flex gap-3 mt-2">
          <button type="submit" class="btn btn-primary flex-1"><i class="fas fa-check"></i> Создать задание</button>
          <button type="button" onclick="closeModal('create-task-modal')" class="btn btn-ghost">Отмена</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal('create-task-modal'); });
}

function showUploadPortfolioModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'upload-portfolio-modal';
  modal.innerHTML = `
    <div class="modal-box p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-black text-gray-900">Добавить работу в портфолио</h2>
        <button onclick="closeModal('upload-portfolio-modal')" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
          <i class="fas fa-times text-gray-500 text-sm"></i>
        </button>
      </div>
      <div class="upload-zone mb-4" onclick="showNotification('Файл загружен!', 'success')">
        <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2 block"></i>
        <p class="text-gray-600 font-medium">Перетащи файл или нажми</p>
        <p class="text-gray-400 text-sm">PDF, ZIP, PNG, Figma — до 50 МБ</p>
      </div>
      <div class="form-group"><label class="form-label">Название проекта</label><input type="text" class="form-input" placeholder="Мой проект"></div>
      <div class="form-group"><label class="form-label">Ссылка (GitHub/Figma/Drive)</label><input type="url" class="form-input" placeholder="https://..."></div>
      <div class="form-group"><label class="form-label">Описание</label><textarea class="form-textarea" placeholder="Что ты сделал в этом проекте?"></textarea></div>
      <div class="flex gap-3">
        <button onclick="closeModal('upload-portfolio-modal'); showNotification('Работа добавлена в портфолио!', 'success')" class="btn btn-primary flex-1"><i class="fas fa-check"></i> Добавить</button>
        <button onclick="closeModal('upload-portfolio-modal')" class="btn btn-ghost">Отмена</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
}

// ===== NOTIFICATIONS =====
function showNotification(text, type = 'success') {
  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  notif.innerHTML = `<i class="fas ${icons[type]}"></i> ${text}`;
  document.body.appendChild(notif);
  setTimeout(() => { notif.style.opacity = '0'; notif.style.transform = 'translateX(100%)'; notif.style.transition = 'all 0.3s'; setTimeout(() => notif.remove(), 300); }, 3000);
}

// ===== AUTH SYSTEM =====
// Uses real backend API + localStorage for token persistence

const AUTH = {
  // --- Token storage ---
  saveToken(token) { localStorage.setItem('uniway_token', token); },
  getToken()       { return localStorage.getItem('uniway_token'); },
  clearToken()     { localStorage.removeItem('uniway_token'); localStorage.removeItem('uniway_user'); },

  // --- User cache ---
  saveUser(user)   { localStorage.setItem('uniway_user', JSON.stringify(user)); },
  loadUser()       {
    try { return JSON.parse(localStorage.getItem('uniway_user') || 'null'); }
    catch { return null; }
  },

  // --- API base helper ---
  async apiCall(path, method = 'GET', body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const token = AUTH.getToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },
};

// --- REGISTER ---
async function handleRegister(e) {
  e.preventDefault();
  hideFormError('reg-error');

  const name      = document.getElementById('reg-name')?.value?.trim();
  const email     = document.getElementById('reg-email')?.value?.trim();
  const password  = document.getElementById('reg-pass')?.value;
  const role      = document.getElementById('tab-company')?.classList.contains('active') ? 'company' : 'student';
  const direction   = document.getElementById('reg-direction')?.value;
  const university  = document.getElementById('reg-university')?.value?.trim();
  const companyName = document.getElementById('reg-company')?.value?.trim();
  const industry    = document.getElementById('reg-industry')?.value;

  if (!name || !email || !password) {
    showFormError('reg-error','reg-error-text','Заполните все обязательные поля'); return;
  }
  if (password.length < 6) {
    showFormError('reg-error','reg-error-text','Пароль должен быть не менее 6 символов'); return;
  }
  const termsChecked = document.getElementById('agree-terms')?.checked;
  if (!termsChecked) {
    showFormError('reg-error','reg-error-text','Необходимо принять условия использования'); return;
  }

  // Show loading state
  const btn = document.querySelector('#reg-submit-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...'; }

  try {
    const { ok, data } = await AUTH.apiCall('/api/auth/register', 'POST', {
      email, password, name, role, direction, university, companyName, industry
    });

    if (!ok) {
      showFormError('reg-error','reg-error-text', data.error || 'Ошибка регистрации');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> ' + t('reg_btn'); }
      return;
    }

    // Success: save token + user
    AUTH.saveToken(data.token);
    AUTH.saveUser(data.user);
    State.currentUser = data.user;
    State.currentRole = data.user.role;

    showNotification(data.message || 'Регистрация прошла успешно!', 'success');
    setTimeout(() => {
      if (data.user.role === 'company') navigate('company_dashboard');
      else navigate('student_dashboard');
    }, 400);

  } catch (err) {
    showFormError('reg-error','reg-error-text','Ошибка соединения с сервером');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> ' + t('reg_btn'); }
  }
}

// --- LOGIN ---
async function handleLogin(e) {
  e.preventDefault();
  hideFormError('login-error');

  const email    = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-pass')?.value;

  if (!email || !password) {
    showFormError('login-error','login-error-text','Введите email и пароль'); return;
  }

  const btn = document.querySelector('#login-submit-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...'; }

  try {
    const { ok, data } = await AUTH.apiCall('/api/auth/login', 'POST', { email, password });

    if (!ok) {
      showFormError('login-error','login-error-text', data.error || 'Неверный email или пароль');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ' + t('login_btn'); }
      return;
    }

    AUTH.saveToken(data.token);
    AUTH.saveUser(data.user);
    State.currentUser = data.user;
    State.currentRole = data.user.role;

    showNotification(data.message || `Добро пожаловать!`, 'success');
    setTimeout(() => {
      if (data.user.role === 'admin')   navigate('admin');
      else if (data.user.role === 'company') navigate('company_dashboard');
      else navigate('student_dashboard');
    }, 400);

  } catch (err) {
    showFormError('login-error','login-error-text','Ошибка соединения с сервером');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ' + t('login_btn'); }
  }
}

// --- QUICK ROLE FILL (fills form, user must login manually) ---
function quickLogin(role) {
  const demoCredentials = {
    student: { email: 'demo.student@test.kz', password: 'demo1234' },
    company: { email: 'demo.company@test.kz', password: 'demo1234' },
    admin:   { email: 'admin@uniway.kz',      password: 'admin123' },
  };
  const creds = demoCredentials[role];
  if (!creds) return;

  // Fill the login form fields
  const emailInput = document.getElementById('login-email');
  const passInput  = document.getElementById('login-pass');
  if (emailInput) emailInput.value = creds.email;
  if (passInput)  passInput.value  = creds.password;

  // Highlight the form to draw attention
  const form = document.querySelector('#login-email')?.closest('form');
  if (form) {
    form.style.transition = 'box-shadow 0.3s';
    form.style.boxShadow  = '0 0 0 3px rgba(37,99,235,0.25)';
    setTimeout(() => { form.style.boxShadow = ''; }, 1500);
  }

  showNotification('Данные заполнены — нажмите «Войти» для входа', 'info');
}

// --- LOGOUT ---
async function logout() {
  try { await AUTH.apiCall('/api/auth/logout', 'POST'); } catch(_) {}
  AUTH.clearToken();
  State.currentUser = null;
  State.currentRole = null;
  showNotification('Вы вышли из системы', 'info');
  navigate('home');
}

// --- CHANGE PASSWORD ---
async function changePassword() {
  const currentPassword = document.getElementById('curr-pass')?.value;
  const newPassword     = document.getElementById('new-pass')?.value;
  if (!currentPassword || !newPassword) {
    showNotification('Заполните оба поля', 'error'); return;
  }
  if (newPassword.length < 6) {
    showNotification('Новый пароль слишком короткий (мин. 6 символов)', 'error'); return;
  }
  const { ok, data } = await AUTH.apiCall('/api/auth/change-password', 'PUT', { currentPassword, newPassword });
  if (ok) {
    showNotification(data.message || 'Пароль успешно изменён!', 'success');
    document.getElementById('curr-pass').value = '';
    document.getElementById('new-pass').value  = '';
  } else {
    showNotification(data.error || 'Ошибка смены пароля', 'error');
  }
}

// --- SAVE PROFILE ---
async function saveProfileFull() {
  const firstName  = document.getElementById('prof-name')?.value?.trim() || '';
  const lastName   = document.getElementById('prof-lastname')?.value?.trim() || '';
  const city       = document.getElementById('prof-city')?.value?.trim();
  const university = document.getElementById('prof-university')?.value?.trim();
  const direction  = document.getElementById('prof-direction-select')?.value ||
                     document.querySelector('input[name="direction"]:checked')?.value;

  const name = lastName ? `${firstName} ${lastName}` : firstName;
  if (!name) { showNotification('Введите имя', 'error'); return; }

  const { ok, data } = await AUTH.apiCall('/api/auth/profile', 'PUT', { name, city, university, direction });
  if (ok) {
    AUTH.saveUser(data.user);
    State.currentUser = data.user;
    State.currentRole = data.user.role;
    showNotification('Профиль сохранён!', 'success');
    renderApp();
  } else {
    showNotification(data.error || 'Ошибка сохранения', 'error');
  }
}

async function saveProfile() {
  // Legacy wrapper — calls saveProfileFull
  return saveProfileFull();
}

async function saveCompanyProfile() {
  const companyName = document.getElementById('comp-name')?.value?.trim();
  const industry    = document.getElementById('comp-industry')?.value?.trim();
  const city        = document.getElementById('comp-city')?.value?.trim();
  const about       = document.getElementById('comp-about')?.value?.trim();

  const { ok, data } = await AUTH.apiCall('/api/auth/profile', 'PUT', {
    name: companyName,
    companyName,
    industry,
    city,
    about,
  });
  if (ok) {
    AUTH.saveUser(data.user);
    State.currentUser = data.user;
    showNotification('Профиль компании сохранён!', 'success');
    renderApp();
  } else {
    showNotification(data.error || 'Ошибка сохранения', 'error');
  }
}

// ===== CATALOG HANDLERS =====
function setCatalogFilter(filter) {
  State.catalogFilter = filter;
  renderApp();
}

function filterCatalog() {
  const search = document.getElementById('catalog-search')?.value?.toLowerCase() || '';
  const filter = State.catalogFilter || 'all';
  const filtered = MOCK_TASKS.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search) || t.company.toLowerCase().includes(search) || t.tags.some(tag => tag.toLowerCase().includes(search));
    const matchFilter = filter === 'all' || t.direction === filter;
    return matchSearch && matchFilter;
  });
  const grid = document.getElementById('tasks-grid');
  if (grid) grid.innerHTML = filtered.map(t => renderTaskCard(t)).join('');
}

// ===== AI INTERVIEW =====
function startInterview() {
  const dir = document.getElementById('interview-dir')?.value || 'IT';
  State.interviewStarted = true;
  State.interviewDir = dir;
  State.interviewQ = 0;
  State.interviewScore = 0;
  State.interviewMessages = [];
  State.interviewFinished = false;
  renderApp();
  setTimeout(() => {
    const questions = AI_INTERVIEW_QUESTIONS[dir] || AI_INTERVIEW_QUESTIONS.IT;
    addAIMessage(`Привет! Я — AI HR-менеджер UniWay. Сегодня я проведу с тобой симуляцию собеседования на позицию ${dir === 'IT' ? 'разработчика' : dir === 'Маркетинг' ? 'маркетолога' : dir === 'Дизайн' ? 'дизайнера' : 'аналитика'}.\n\nПостарайся отвечать развёрнуто и уверенно. Готов? Начнём!\n\n**${questions[0]}**`);
  }, 500);
}

function addAIMessage(text, feedback = null, score = null) {
  State.interviewTyping = false;
  State.interviewMessages = [...(State.interviewMessages || []), { role: 'ai', text, feedback, score }];
  renderApp();
  setTimeout(scrollChatBottom, 100);
}

function sendAnswer() {
  const input = document.getElementById('user-answer');
  const text = input?.value?.trim();
  if (!text) return;

  const questions = AI_INTERVIEW_QUESTIONS[State.interviewDir] || AI_INTERVIEW_QUESTIONS.IT;
  State.interviewMessages = [...State.interviewMessages, { role: 'user', text }];
  State.interviewTyping = true;
  renderApp();
  if (input) input.value = '';

  setTimeout(() => {
    const score = Math.floor(Math.random() * 30) + 60;
    State.interviewScore = Math.round(((State.interviewScore || 0) * State.interviewQ + score) / (State.interviewQ + 1));

    const feedbacks = [
      'Хороший ответ! Вы показали понимание темы. Попробуйте добавить конкретные примеры из своего опыта.',
      'Отличная структура ответа. Видна логическая последовательность мыслей.',
      'Рекомендую быть более конкретным. Работодатели ценят примеры из реальной практики.',
      'Профессиональная лексика на высоком уровне. Уверенность в изложении — сильная сторона.',
    ];
    const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];

    State.interviewQ++;
    if (State.interviewQ < questions.length) {
      addAIMessage(`${feedback}\n\n**Следующий вопрос:** ${questions[State.interviewQ]}`, feedback, score);
    } else {
      State.interviewFinished = true;
      addAIMessage(`Отличная работа! Собеседование завершено. 🎉\n\nТвой итоговый балл: **${State.interviewScore}/100**\n\nЯ проанализировал твои ответы. Нажми "Посмотреть результаты" для полного разбора.`, feedback, score);
    }
  }, 1800);
}

function handleAnswerKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); }
}

function showInterviewResults() {
  const score = State.interviewScore || 0;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'interview-results-modal';
  modal.innerHTML = `
    <div class="modal-box p-8 text-center">
      <div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-trophy text-3xl text-white"></i>
      </div>
      <h2 class="text-2xl font-black text-gray-900 mb-2">Результат собеседования</h2>
      <div class="text-6xl font-black text-blue-600 my-4">${score}</div>
      <div class="text-gray-400 mb-6">/ 100 баллов</div>
      
      <div class="grid grid-cols-3 gap-3 mb-6">
        ${[
          { label: 'Полнота', val: Math.round(score * 0.95) },
          { label: 'Логика', val: Math.round(score * 1.05) },
          { label: 'Уверенность', val: Math.round(score * 0.9) },
        ].map(c => `
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xl font-black text-gray-900">${Math.min(100, c.val)}</div>
            <div class="text-xs text-gray-500">${c.label}</div>
          </div>
        `).join('')}
      </div>

      <div class="text-left bg-blue-50 rounded-xl p-4 mb-6 text-sm text-gray-700">
        <strong class="text-blue-700">Рекомендации AI:</strong><br>
        ${score >= 80 ? 'Отличный результат! Вы готовы к реальным собеседованиям. Ваши ответы показали глубокое понимание предметной области.' : 
          score >= 60 ? 'Хороший результат. Поработайте над конкретикой примеров и уверенностью в ответах.' :
          'Продолжайте практиковаться. Сфокусируйтесь на изучении материала и структурировании ответов.'}
      </div>

      <div class="flex gap-3">
        <button onclick="saveInterviewResult()" class="btn btn-primary flex-1">
          <i class="fas fa-save"></i> Сохранить в профиль
        </button>
        <button onclick="closeModal('interview-results-modal'); State.interviewStarted=false; State.interviewFinished=false; State.interviewMessages=[]; renderApp()" class="btn btn-secondary">
          Заново
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function scrollChatBottom() {
  const chat = document.getElementById('chat-messages');
  if (chat) chat.scrollTop = chat.scrollHeight;
}

async function saveInterviewResult() {
  const score = State.interviewScore || 0;
  const dir = State.interviewDir || 'IT';
  closeModal('interview-results-modal');

  if (!State.currentUser) {
    showNotification('Войдите, чтобы сохранить результат', 'error');
    return;
  }

  try {
    const { ok, data } = await AUTH.apiCall('/api/interviews', 'POST', {
      direction: dir,
      score,
      questionsCount: State.interviewQ || 5,
      feedback: score >= 80 ? 'Отличный результат! Готовы к реальным собеседованиям.' :
                score >= 60 ? 'Хороший результат. Продолжайте практиковаться.' :
                'Изучите материал и попробуйте снова.',
    });
    if (ok) {
      State.userInterviews = [data.interview, ...(State.userInterviews || [])];
      showNotification(`Результат ${score}/100 сохранён в профиле!`, 'success');
    } else {
      showNotification(data.error || 'Ошибка сохранения', 'error');
    }
  } catch {
    showNotification('Ошибка соединения', 'error');
  }

  State.interviewStarted = false;
  State.interviewFinished = false;
  State.interviewMessages = [];
}

// ===== OTHER HANDLERS =====
function handleCreateTask(e) {
  e.preventDefault();
  closeModal('create-task-modal');
  showNotification('Задание успешно создано!', 'success');
}

function handleFileUpload(input) {
  if (input.files?.[0]) {
    showNotification(`Файл "${input.files[0].name}" загружен`, 'success');
  }
}

async function submitSolution() {
  if (!State.currentUser) { navigate('login'); return; }

  const task = MOCK_TASKS.find(t => t.id === (State.routeParams?.id || 1)) || MOCK_TASKS[0];
  const solutionLink = document.getElementById('solution-link')?.value?.trim();
  const comment = document.getElementById('solution-comment')?.value?.trim();

  const btn = document.querySelector('#upload-section .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...'; }

  try {
    // First ensure the task is "taken"
    let subRes = await AUTH.apiCall('/api/submissions', 'POST', {
      taskId: task.id,
      taskTitle: task.title,
      company: task.company,
      direction: task.direction,
    });

    // If already taken, get existing
    if (!subRes.ok && subRes.status === 409) {
      const listRes = await AUTH.apiCall('/api/submissions');
      const existing = listRes.ok ? listRes.data.submissions.find(s => s.taskId === task.id) : null;
      if (existing) subRes = { ok: true, data: { submission: existing } };
    }

    if (!subRes.ok) {
      showNotification(subRes.data?.error || 'Ошибка при взятии задания', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить решение'; }
      return;
    }

    const subId = subRes.data.submission.id;

    // Submit solution
    const updateRes = await AUTH.apiCall(`/api/submissions/${subId}`, 'PUT', {
      status: 'submitted',
      solutionText: comment,
      fileUrl: solutionLink,
    });

    if (updateRes.ok) {
      const score = updateRes.data.submission.score || 0;
      const feedback = updateRes.data.submission.feedback || '';
      // Update cached submissions
      State.userSubmissions = State.userSubmissions.filter(s => s.taskId !== task.id);
      State.userSubmissions.push(updateRes.data.submission);
      showNotification(`Решение отправлено! AI-оценка: ${score}/100`, 'success');
      setTimeout(() => showNotification(feedback.substring(0, 80) + '...', 'info'), 2000);
    } else {
      showNotification(updateRes.data?.error || 'Ошибка отправки', 'error');
    }
  } catch (err) {
    showNotification('Ошибка соединения с сервером', 'error');
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить решение на проверку'; }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  const icon = btn.querySelector('i');
  if (icon) { icon.className = isPass ? 'fas fa-eye-slash text-sm' : 'fas fa-eye text-sm'; }
}

function showFormError(bannerId, textId, message) {
  const banner = document.getElementById(bannerId);
  const text   = document.getElementById(textId);
  if (banner) banner.classList.remove('hidden');
  if (text)   text.textContent = message;
}

function hideFormError(bannerId) {
  const banner = document.getElementById(bannerId);
  if (banner) banner.classList.add('hidden');
}

function switchRegRole(role) {
  document.getElementById('tab-student')?.classList.toggle('active', role === 'student');
  document.getElementById('tab-company')?.classList.toggle('active', role === 'company');
  document.getElementById('student-fields')?.classList.toggle('hidden', role !== 'student');
  document.getElementById('company-fields')?.classList.toggle('hidden', role !== 'company');
}

// ===== TERMS / PRIVACY MODAL =====
function showTermsModal(type) {
  const isTerms = type === 'terms';
  const title   = isTerms ? 'Условия использования UniWay' : 'Политика конфиденциальности UniWay';
  const content = isTerms ? `
    <h3 class="font-bold text-gray-900 mb-2">1. Общие положения</h3>
    <p class="text-gray-600 text-sm mb-3">Настоящие Условия использования регулируют порядок пользования образовательной платформой UniWay (далее — «Платформа»), расположенной по адресу uniway.kz. Регистрируясь на Платформе, вы подтверждаете согласие с настоящими Условиями.</p>

    <h3 class="font-bold text-gray-900 mb-2">2. Описание сервиса</h3>
    <p class="text-gray-600 text-sm mb-3">UniWay — образовательная платформа для студентов Казахстана, предоставляющая доступ к тестовым заданиям от компаний-партнёров, AI-инструментам подготовки к собеседованиям и формированию профессионального резюме. Платформа не является биржей труда или фриланс-сервисом.</p>

    <h3 class="font-bold text-gray-900 mb-2">3. Права и обязанности пользователя</h3>
    <ul class="text-gray-600 text-sm mb-3 space-y-1 list-disc ml-4">
      <li>Вы обязуетесь предоставлять достоверные данные при регистрации.</li>
      <li>Запрещено использовать платформу в целях, нарушающих законодательство Республики Казахстан.</li>
      <li>Вы несёте ответственность за сохранность учётных данных и паролей.</li>
      <li>Запрещено публиковать плагиат, оскорбительный или незаконный контент.</li>
      <li>Решения заданий должны быть выполнены самостоятельно.</li>
    </ul>

    <h3 class="font-bold text-gray-900 mb-2">4. Ограничение ответственности</h3>
    <p class="text-gray-600 text-sm mb-3">UniWay не гарантирует трудоустройство и не несёт ответственности за решения компаний-партнёров в отношении пользователей. Оценки AI носят рекомендательный характер.</p>

    <h3 class="font-bold text-gray-900 mb-2">5. Изменения условий</h3>
    <p class="text-gray-600 text-sm">UniWay вправе изменять настоящие Условия. Актуальная версия публикуется на сайте. Продолжение использования платформы означает согласие с новой редакцией.</p>
  ` : `
    <h3 class="font-bold text-gray-900 mb-2">1. Оператор персональных данных</h3>
    <p class="text-gray-600 text-sm mb-3">ТОО «UniWay», БИН 250140012345, г. Алматы, Республика Казахстан (далее — «Оператор»). Контакт: privacy@uniway.kz</p>

    <h3 class="font-bold text-gray-900 mb-2">2. Какие данные мы собираем</h3>
    <ul class="text-gray-600 text-sm mb-3 space-y-1 list-disc ml-4">
      <li><strong>Регистрационные данные:</strong> имя, email, роль (студент / компания).</li>
      <li><strong>Профиль:</strong> университет, направление, город, информация о себе.</li>
      <li><strong>Активность:</strong> взятые задания, отправленные решения, результаты AI-собеседований.</li>
      <li><strong>Технические данные:</strong> IP-адрес, тип устройства, браузер (для безопасности).</li>
    </ul>

    <h3 class="font-bold text-gray-900 mb-2">3. Цели обработки данных</h3>
    <ul class="text-gray-600 text-sm mb-3 space-y-1 list-disc ml-4">
      <li>Предоставление функциональности платформы и персонализации.</li>
      <li>AI-анализ решений для формирования обратной связи.</li>
      <li>Отображение профиля студента компаниям-партнёрам (только с вашего согласия).</li>
      <li>Улучшение качества сервиса и безопасности.</li>
    </ul>

    <h3 class="font-bold text-gray-900 mb-2">4. Защита данных</h3>
    <p class="text-gray-600 text-sm mb-3">Пароли хранятся исключительно в хешированном виде (SHA-256 + соль). Передача данных осуществляется по протоколу HTTPS. Доступ к данным имеют только авторизованные сотрудники Оператора.</p>

    <h3 class="font-bold text-gray-900 mb-2">5. Ваши права</h3>
    <p class="text-gray-600 text-sm mb-3">Вы вправе запросить доступ, исправление или удаление своих данных, направив запрос на privacy@uniway.kz. Данные удаляются в течение 30 дней с момента обращения.</p>

    <h3 class="font-bold text-gray-900 mb-2">6. Cookies</h3>
    <p class="text-gray-600 text-sm">Платформа использует localStorage для хранения токена сессии. Сторонние рекламные cookie не используются.</p>
  `;

  const existing = document.getElementById('terms-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'terms-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:600px;max-height:80vh;display:flex;flex-direction:column;">
      <div class="flex items-center justify-between mb-5 flex-shrink-0">
        <h2 class="text-lg font-black text-gray-900">${title}</h2>
        <button onclick="closeModal('terms-modal')" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <i class="fas fa-times text-gray-600 text-sm"></i>
        </button>
      </div>
      <div class="overflow-y-auto flex-1 pr-1">${content}</div>
      <div class="mt-5 pt-4 border-t border-gray-100 flex-shrink-0">
        <button onclick="closeModal('terms-modal'); document.getElementById('agree-terms').checked=true; document.getElementById('reg-submit-btn').disabled=false; document.getElementById('reg-submit-btn').classList.remove('opacity-50','cursor-not-allowed')"
          class="btn btn-primary w-full">
          <i class="fas fa-check"></i> Принять и закрыть
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function switchTaskTab(tab) {
  ['active','completed','uploaded'].forEach(t => {
    document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab);
  });
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

function setLang(lang) {
  State.lang = lang;
  renderApp();
}

function updateNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 10);
  window.removeEventListener('scroll', onScroll);
  window.addEventListener('scroll', onScroll);
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ===== EVENT LISTENERS =====
function attachEventListeners() {
  // Drag and Drop for upload zone
  const dropZone = document.getElementById('drop-zone');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragging'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault(); dropZone.classList.remove('dragging');
      const files = e.dataTransfer?.files;
      if (files?.[0]) showNotification(`Файл "${files[0].name}" загружен`, 'success');
    });
  }
}

// ===== INIT =====
async function init() {
  const path = window.location.pathname;
  const pageMap = {
    '/': 'home', '/catalog': 'catalog', '/login': 'login',
    '/register': 'register', '/about': 'about', '/interview': 'interview',
  };

  if (path.startsWith('/student')) State.currentPage = path.replace('/student/', 'student_').replace('/', '') || 'student_dashboard';
  else if (path.startsWith('/company')) State.currentPage = path.replace('/company/', 'company_').replace('/', '') || 'company_dashboard';
  else if (path.startsWith('/admin')) State.currentPage = 'admin';
  else if (path.startsWith('/task/')) { State.currentPage = 'task_detail'; State.routeParams = { id: parseInt(path.split('/')[2]) || 1 }; }
  else State.currentPage = pageMap[path] || 'home';

  // --- Restore session from localStorage ---
  const cachedUser = AUTH.loadUser();
  const token = AUTH.getToken();

  if (cachedUser && token) {
    // Optimistically restore from cache
    State.currentUser = cachedUser;
    State.currentRole = cachedUser.role;

    // Verify token with server in background
    AUTH.apiCall('/api/auth/me').then(({ ok, data }) => {
      if (ok && data.user) {
        // Update with fresh data from server
        State.currentUser = data.user;
        State.currentRole = data.user.role;
        AUTH.saveUser(data.user);
        renderApp();
      } else {
        // Token invalid — clear session
        AUTH.clearToken();
        State.currentUser = null;
        State.currentRole = null;
        renderApp();
      }
    }).catch(() => { /* keep cached data on network error */ });
  }

  renderApp();

  window.addEventListener('popstate', (e) => {
    if (e.state) { State.currentPage = e.state.page; State.routeParams = e.state.params; renderApp(); }
  });
}

document.addEventListener('DOMContentLoaded', init);
