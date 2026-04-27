import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { z } from 'zod'

// =====================================================
//  UniWay — Backend v2
//  Storage:  Cloudflare D1 (SQLite)
//  Auth:     SHA-256 + Bearer token (stored in D1)
//  AI:       @cf/meta/llama-3-8b-instruct via c.env.AI
//  Validation: Zod
// =====================================================

// ---- Cloudflare Bindings ----
type Env = {
  DB: D1Database
  AI: Ai
}

// ---- Domain types ----
interface User {
  id: string
  email: string
  passwordHash: string
  role: 'student' | 'company' | 'admin'
  name: string
  direction?: string
  university?: string
  companyName?: string
  industry?: string
  city?: string
  about?: string
  avatar: string
  createdAt: string
}

interface Submission {
  id: string
  userId: string
  taskId: number
  taskTitle: string
  company: string
  direction: string
  status: 'in_progress' | 'submitted' | 'evaluated'
  submittedAt: string
  score?: number
  feedback?: string
  solutionText?: string
}

interface InterviewResult {
  id: string
  userId: string
  direction: string
  score: number
  date: string
  questionsCount: number
  feedback: string
}

// ---- Zod schemas ----
const RegisterSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().min(1, 'Имя обязательно'),
  role: z.enum(['student', 'company'], { errorMap: () => ({ message: 'Роль: student или company' }) }),
  direction: z.string().optional(),
  university: z.string().optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const ProfileSchema = z.object({
  name: z.string().optional(),
  direction: z.string().optional(),
  university: z.string().optional(),
  city: z.string().optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  about: z.string().optional(),
})

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Новый пароль минимум 6 символов'),
})

const SubmissionCreateSchema = z.object({
  taskId: z.number({ required_error: 'taskId обязателен' }),
  taskTitle: z.string().min(1),
  company: z.string().optional(),
  direction: z.string().optional(),
})

const SubmissionUpdateSchema = z.object({
  status: z.enum(['in_progress', 'submitted', 'evaluated']).optional(),
  solutionText: z.string().optional(),
  score: z.number().optional(),
  feedback: z.string().optional(),
})

const InterviewSchema = z.object({
  direction: z.string().optional(),
  score: z.number().min(0).max(100),
  questionsCount: z.number().optional(),
  feedback: z.string().optional(),
})

// ---- Crypto helpers ----
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'uniway_salt_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

function getAvatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

function safeUser(user: User) {
  const { passwordHash, ...safe } = user
  return safe
}

// ---- Token helpers (D1-based sessions) ----
function getTokenFromRequest(c: any): string | null {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)
  return null
}

async function getUserFromToken(db: D1Database, token: string | null): Promise<User | null> {
  if (!token) return null
  const row = await db
    .prepare('SELECT userId FROM sessions WHERE token = ?')
    .bind(token)
    .first<{ userId: string }>()
  if (!row) return null
  return db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(row.userId)
    .first<User>()
}

// ---- Seed admin (idempotent) ----
async function seedAdmin(db: D1Database) {
  const existing = await db
    .prepare('SELECT id FROM users WHERE id = ?')
    .bind('admin-001')
    .first()
  if (existing) return
  const hash = await hashPassword('admin123')
  await db
    .prepare(`INSERT INTO users (id,email,passwordHash,role,name,avatar,createdAt)
              VALUES (?,?,?,?,?,?,?)`)
    .bind('admin-001', 'admin@uniway.kz', hash, 'admin', 'Администратор UniWay', 'A', new Date().toISOString())
    .run()
}

// ---- Task catalogue (static, by direction) ----
const TASK_CATALOGUE: Record<string, { id: number; title: string; company: string; description: string }[]> = {
  IT: [
    { id: 101, title: 'REST API на Node.js', company: 'Kaspi Bank', description: 'Разработайте CRUD API для управления задачами с авторизацией JWT.' },
    { id: 102, title: 'Алгоритм сортировки', company: 'EPAM Kazakhstan', description: 'Реализуйте Merge Sort и Quick Sort, сравните их время работы на 10 000 элементов.' },
    { id: 103, title: 'React-дашборд', company: 'Kolesa Group', description: 'Создайте дашборд аналитики с графиками и фильтрацией данных.' },
    { id: 104, title: 'SQL-оптимизация', company: 'Halyk Bank', description: 'Оптимизируйте медленные SQL-запросы, добавьте индексы и объясните план выполнения.' },
    { id: 105, title: 'Docker-compose стек', company: 'Jusan Bank', description: 'Упакуйте приложение (backend + PostgreSQL + Redis) в docker-compose.' },
  ],
  SMM: [
    { id: 201, title: 'Контент-план для Instagram', company: 'Freedom Finance', description: 'Разработайте контент-план на 30 дней для бренда финансовых услуг.' },
    { id: 202, title: 'Вирусный пост в TikTok', company: 'Senim', description: 'Придумайте концепцию вирусного ролика для продвижения мобильного приложения среди молодёжи.' },
    { id: 203, title: 'Ребрендинг страницы', company: 'Air Astana', description: 'Предложите новую визуальную концепцию и тональность для страницы авиакомпании.' },
    { id: 204, title: 'Анализ конкурентов', company: 'Chocofood', description: 'Проведите анализ SMM-стратегий 3 конкурентов и дайте рекомендации.' },
    { id: 205, title: 'Кризисные коммуникации', company: 'Beeline KZ', description: 'Разработайте план реагирования на негативные комментарии и кризисные ситуации в соцсетях.' },
  ],
  Контент: [
    { id: 301, title: 'Лонгрид для корпоративного блога', company: 'Kcell', description: 'Напишите экспертный материал 2000+ слов о цифровизации в Казахстане.' },
    { id: 302, title: 'Email-рассылка', company: 'KazMunaiGas', description: 'Разработайте серию из 5 писем для онбординга новых клиентов.' },
    { id: 303, title: 'SEO-статья', company: 'OLX Kazakhstan', description: 'Напишите SEO-оптимизированную статью по теме "купить авто в Алматы".' },
    { id: 304, title: 'Сценарий для подкаста', company: 'Tengrinews', description: 'Напишите сценарий эпизода подкаста о стартап-экосистеме Казахстана.' },
    { id: 305, title: 'Пресс-релиз', company: 'KEGOC', description: 'Напишите пресс-релиз о запуске нового продукта по международным стандартам.' },
  ],
  Аналитика: [
    { id: 401, title: 'Анализ данных в Python', company: 'Казпочта', description: 'Проведите EDA на датасете продаж, визуализируйте ключевые инсайты.' },
    { id: 402, title: 'BI-дашборд в Power BI', company: 'KPMG Kazakhstan', description: 'Постройте дашборд отчётности по KPI для руководства компании.' },
    { id: 403, title: 'A/B тест', company: 'Forte Bank', description: 'Спроектируйте A/B тест для повышения конверсии кнопки "Оформить кредит".' },
  ],
}

// ---- AI Feedback (real, via Workers AI) ----
async function getAIFeedback(
  ai: Ai,
  solution: string,
  direction: string,
  score: number,
  lang: 'RU' | 'KZ' | 'EN' = 'RU'
): Promise<string> {
  const focusMap: Record<string, string> = {
    IT: `
- Правильность алгоритма и логики
- Чистота и читаемость кода (именование, структура, DRY)
- Обработка граничных случаев и ошибок
- Выбор подходящих структур данных и паттернов
- Масштабируемость и производительность решения`,
    Маркетинг: `
- Понимание целевой аудитории и её болей
- Конкретность: есть ли измеримые метрики и KPI
- Реалистичность стратегии в условиях рынка Казахстана
- Обоснованность выбора каналов продвижения
- Наличие плана B на случай провала`,
    Дизайн: `
- Понимание пользовательских потребностей (не только эстетика)
- Обоснованность дизайн-решений исследованием
- Знание UI/UX принципов (иерархия, типографика, доступность)
- Готовность к итерациям и критике
- Практическая реализуемость решения`,
    Бизнес: `
- Структурированность мышления (MECE, frameworks)
- Обоснованность выводов данными, а не интуицией
- Понимание финансовых метрик и их взаимосвязей
- Учёт рисков и альтернативных сценариев
- Практическая применимость в казахстанском контексте`,
    HR: `
- Умение работать с конфликтными ситуациями
- Знание трудового законодательства РК
- Системный подход к HR-процессам
- Эмпатия в сочетании с принципиальностью
- Конкретные инструменты и метрики, а не общие слова`,
    Финансы: `
- Точность финансовой терминологии
- Понимание взаимосвязей между показателями
- Умение интерпретировать данные, а не просто называть формулы
- Понимание рисков и допущений в расчётах
- Знание реалий казахстанского и международного рынка`,
    Юриспруденция: `
- Точность правовых формулировок
- Ссылки на конкретные нормы законодательства РК
- Практическое мышление, а не только теория
- Умение видеть риски и альтернативные толкования
- Профессиональная этика и независимость суждений`,
  }
  const focus = focusMap[direction] || focusMap['IT']

  const langInstr: Record<string, string> = {
    RU: 'Отвечай ТОЛЬКО на русском языке.',
    KZ: 'Тек қазақ тілінде жауап бер.',
    EN: 'Respond ONLY in English.',
  }

  const prompt = `Ты — опытный HR-менеджер и эксперт-ментор платформы UniWay. Твоя задача — дать ЧЕСТНУЮ, КОНКРЕТНУЮ и ДЕЛОВУЮ оценку ответа кандидата. 

Никакой лишней вежливости. Никаких шаблонных похвал. Если ответ слабый — скажи прямо и объясни почему.

Направление: ${direction}
Автоматический балл системы: ${score}/100

Ответ кандидата:
"""
${solution.substring(0, 1500)}
"""

Критерии оценки для направления ${direction}:
${focus}

ФОРМАТ ОТВЕТА (строго соблюдай):
**Оценка:** [одно предложение — честный вердикт, без воды]

**Что работает:**
- [конкретный плюс из ответа, если есть]

**Что не работает / чего не хватает:**
- [конкретный минус с объяснением]
- [второй минус, если есть]

**Конкретное действие:**
[Одна конкретная рекомендация что сделать прямо сейчас — курс, практика, что изучить]

Объём: 120-180 слов. Без вступлений и заключений.
${langInstr[lang]}`

  try {
    const result = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: 'Ты строгий, но справедливый ментор. Говоришь прямо, без лишних слов. Шаблонные фразы типа "хороший ответ" или "отличная работа" под запретом.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.4,
    }) as { response: string }
    return result.response?.trim() || fallbackFeedback(score, direction)
  } catch {
    return fallbackFeedback(score, direction)
  }
}

function fallbackFeedback(score: number, direction: string): string {
  const dirTips: Record<string, string> = {
    IT: 'Покажи конкретный код или архитектурное решение — без этого оценить нечего.',
    Маркетинг: 'Добавь конкретные метрики и бюджетный расчёт — иначе это просто идеи.',
    Дизайн: 'Объясни решение через пользовательскую задачу, а не только через эстетику.',
    Бизнес: 'Обоснуй цифрами. Любое утверждение без данных — это мнение, не анализ.',
    HR: 'Ссылайся на конкретные инструменты и процессы, а не на общие принципы.',
    Финансы: 'Назови конкретные метрики и формулы — теория без расчётов не считается.',
    Юриспруденция: 'Ссылайся на конкретные статьи законов РК, а не на общие нормы.',
  }
  const tip = dirTips[direction] || dirTips['IT']
  if (score >= 80) return `Технически приемлемо, но есть куда расти. ${tip}`
  if (score >= 60) return `Базовый уровень. Для реального собеседования этого недостаточно. ${tip}`
  return `Слабый ответ. ${tip} Изучи материал глубже и попробуй снова.`
}

// ---- Detect language from Accept-Language or user profile ----
function detectLang(c: any): 'RU' | 'KZ' | 'EN' {
  const al = c.req.header('Accept-Language') || ''
  if (al.startsWith('kk')) return 'KZ'
  if (al.startsWith('en')) return 'EN'
  return 'RU'
}

// ---- Middleware: auth guard ----
async function requireAuth(c: any, db: D1Database): Promise<User | null> {
  const token = getTokenFromRequest(c)
  return getUserFromToken(db, token)
}

// ============================================================
const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.use('/static/*', serveStatic({ root: './' }))

// ============================================================
//  AUTH ROUTES
// ============================================================

// POST /api/auth/register
app.post('/api/auth/register', async (c) => {
  const db = c.env.DB
  await seedAdmin(db)

  let raw: unknown
  try { raw = await c.req.json() }
  catch { return c.json({ error: 'Неверный формат данных' }, 400) }

  const parsed = RegisterSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || 'Ошибка валидации'
    return c.json({ error: msg }, 400)
  }

  const { email, password, name, role, direction, university, companyName, industry, city } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  // Check uniqueness
  const existing = await db
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first()
  if (existing) return c.json({ error: 'Пользователь с таким email уже существует' }, 409)

  const id = generateId()
  const passwordHash = await hashPassword(password)
  const avatar = getAvatarInitials(name)
  const createdAt = new Date().toISOString()

  await db.prepare(`
    INSERT INTO users (id,email,passwordHash,role,name,direction,university,companyName,industry,city,avatar,createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id, normalizedEmail, passwordHash, role, name.trim(),
    role === 'student' ? (direction || 'IT') : null,
    role === 'student' ? (university || '') : null,
    role === 'company' ? (companyName || name) : null,
    role === 'company' ? (industry || 'IT') : null,
    city || '',
    avatar, createdAt
  ).run()

  const token = generateToken()
  await db.prepare('INSERT INTO sessions (token, userId, createdAt) VALUES (?,?,?)')
    .bind(token, id, createdAt)
    .run()

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>()

  return c.json({
    success: true,
    token,
    user: safeUser(user!),
    message: `Добро пожаловать, ${name.trim()}!`,
  }, 201)
})

// POST /api/auth/login
app.post('/api/auth/login', async (c) => {
  const db = c.env.DB
  await seedAdmin(db)

  let raw: unknown
  try { raw = await c.req.json() }
  catch { return c.json({ error: 'Неверный формат данных' }, 400) }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) return c.json({ error: 'Введите email и пароль' }, 400)

  const normalizedEmail = parsed.data.email.toLowerCase().trim()
  const user = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first<User>()

  if (!user) return c.json({ error: 'Пользователь с таким email не найден' }, 401)

  const inputHash = await hashPassword(parsed.data.password)
  if (inputHash !== user.passwordHash) return c.json({ error: 'Неверный пароль' }, 401)

  const token = generateToken()
  await db.prepare('INSERT INTO sessions (token, userId, createdAt) VALUES (?,?,?)')
    .bind(token, user.id, new Date().toISOString())
    .run()

  return c.json({
    success: true,
    token,
    user: safeUser(user),
    message: `Добро пожаловать, ${user.name}!`,
  })
})

// GET /api/auth/me
app.get('/api/auth/me', async (c) => {
  const user = await requireAuth(c, c.env.DB)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)
  return c.json({ user: safeUser(user) })
})

// POST /api/auth/logout
app.post('/api/auth/logout', async (c) => {
  const token = getTokenFromRequest(c)
  if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
  return c.json({ success: true })
})

// PUT /api/auth/profile
app.put('/api/auth/profile', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)

  let raw: unknown
  try { raw = await c.req.json() }
  catch { return c.json({ error: 'Неверный формат данных' }, 400) }

  const parsed = ProfileSchema.safeParse(raw)
  if (!parsed.success) return c.json({ error: parsed.error.errors[0]?.message }, 400)

  const { name, direction, university, city, companyName, industry, about } = parsed.data
  const newName = name?.trim() || user.name
  const avatar = name ? getAvatarInitials(name) : user.avatar

  await db.prepare(`
    UPDATE users SET
      name=?, avatar=?, direction=?, university=?,
      city=?, companyName=?, industry=?, about=?
    WHERE id=?
  `).bind(
    newName, avatar,
    direction ?? user.direction,
    university ?? user.university,
    city ?? user.city,
    companyName?.trim() ?? user.companyName,
    industry ?? user.industry,
    about ?? user.about,
    user.id
  ).run()

  const updated = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first<User>()
  return c.json({ success: true, user: safeUser(updated!) })
})

// PUT /api/auth/change-password
app.put('/api/auth/change-password', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)

  let raw: unknown
  try { raw = await c.req.json() }
  catch { return c.json({ error: 'Неверный формат данных' }, 400) }

  const parsed = ChangePasswordSchema.safeParse(raw)
  if (!parsed.success) return c.json({ error: parsed.error.errors[0]?.message }, 400)

  const currentHash = await hashPassword(parsed.data.currentPassword)
  if (currentHash !== user.passwordHash) return c.json({ error: 'Неверный текущий пароль' }, 401)

  const newHash = await hashPassword(parsed.data.newPassword)
  await db.prepare('UPDATE users SET passwordHash=? WHERE id=?').bind(newHash, user.id).run()
  return c.json({ success: true, message: 'Пароль успешно изменён' })
})

// ============================================================
//  TASK CATALOGUE
// ============================================================

// GET /api/tasks  — list tasks (filter by direction)
app.get('/api/tasks', (c) => {
  const direction = c.req.query('direction')
  if (direction && TASK_CATALOGUE[direction]) {
    return c.json({ tasks: TASK_CATALOGUE[direction], total: TASK_CATALOGUE[direction].length })
  }
  const all = Object.values(TASK_CATALOGUE).flat()
  return c.json({ tasks: all, total: all.length })
})

// GET /api/tasks/:id
app.get('/api/tasks/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const all = Object.values(TASK_CATALOGUE).flat()
  const task = all.find(t => t.id === id)
  if (!task) return c.json({ error: 'Задание не найдено' }, 404)
  return c.json({ task })
})

// ============================================================
//  SUBMISSIONS (tasks taken by students)
// ============================================================

// GET /api/submissions
app.get('/api/submissions', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)

  const { results } = await db
    .prepare('SELECT * FROM submissions WHERE userId=? ORDER BY submittedAt DESC')
    .bind(user.id)
    .all<Submission>()

  return c.json({ submissions: results, total: results.length })
})

// POST /api/submissions  — take a task
app.post('/api/submissions', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)
  if (user.role !== 'student') return c.json({ error: 'Только студенты могут брать задания' }, 403)

  let raw: unknown
  try { raw = await c.req.json() }
  catch { return c.json({ error: 'Неверный формат данных' }, 400) }

  const parsed = SubmissionCreateSchema.safeParse(raw)
  if (!parsed.success) return c.json({ error: parsed.error.errors[0]?.message }, 400)

  const { taskId, taskTitle, company, direction } = parsed.data

  // Check duplicate
  const exists = await db
    .prepare('SELECT id FROM submissions WHERE userId=? AND taskId=?')
    .bind(user.id, taskId)
    .first()
  if (exists) return c.json({ error: 'Вы уже взяли это задание' }, 409)

  const sub: Submission = {
    id: generateId(),
    userId: user.id,
    taskId,
    taskTitle,
    company: company || '',
    direction: direction || user.direction || 'IT',
    status: 'in_progress',
    submittedAt: new Date().toISOString(),
  }

  await db.prepare(`
    INSERT INTO submissions (id,userId,taskId,taskTitle,company,direction,status,submittedAt)
    VALUES (?,?,?,?,?,?,?,?)
  `).bind(sub.id, sub.userId, sub.taskId, sub.taskTitle, sub.company, sub.direction, sub.status, sub.submittedAt).run()

  return c.json({ success: true, submission: sub }, 201)
})

// PUT /api/submissions/:id  — submit solution → AI evaluation
app.put('/api/submissions/:id', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)

  const subId = c.req.param('id')
  const sub = await db
    .prepare('SELECT * FROM submissions WHERE id=? AND userId=?')
    .bind(subId, user.id)
    .first<Submission>()
  if (!sub) return c.json({ error: 'Решение не найдено' }, 404)

  let raw: unknown
  try { raw = await c.req.json() }
  catch { return c.json({ error: 'Неверный формат данных' }, 400) }

  const parsed = SubmissionUpdateSchema.safeParse(raw)
  if (!parsed.success) return c.json({ error: parsed.error.errors[0]?.message }, 400)

  const body = parsed.data
  let { status, solutionText, score, feedback } = { ...sub, ...body }

  // AI evaluation when student submits solution
  if (body.status === 'submitted' && sub.status !== 'evaluated') {
    const solution = solutionText || sub.solutionText || '(решение не предоставлено)'
    const direction = sub.direction || user.direction || 'IT'

    // Score: base random + bonus for solution length
    const baseScore = Math.floor(Math.random() * 25) + 65 // 65–90
    score = Math.min(100, baseScore + (solution.length > 300 ? 5 : 0))

    const lang = detectLang(c)
    feedback = await getAIFeedback(c.env.AI, solution, direction, score, lang)
    status = 'evaluated'
  }

  await db.prepare(`
    UPDATE submissions SET status=?, solutionText=?, score=?, feedback=? WHERE id=?
  `).bind(status, solutionText ?? sub.solutionText, score ?? sub.score, feedback ?? sub.feedback, subId).run()

  const updated = await db.prepare('SELECT * FROM submissions WHERE id=?').bind(subId).first<Submission>()
  return c.json({ success: true, submission: updated })
})

// ============================================================
//  INTERVIEW EVALUATION  (real AI, not random)
// ============================================================

const InterviewEvalSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  direction: z.string().default('IT'),
  questionIndex: z.number().default(0),
  totalQuestions: z.number().default(5),
  history: z.array(z.any()).optional(),
})

app.post('/api/interview/evaluate', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)

  let raw: unknown
  try { raw = await c.req.json() }
  catch { return c.json({ error: 'Неверный формат данных' }, 400) }

  const parsed = InterviewEvalSchema.safeParse(raw)
  if (!parsed.success) return c.json({ error: parsed.error.errors[0]?.message }, 400)

  const { question, answer, direction, questionIndex, totalQuestions } = parsed.data
  const lang = detectLang(c)

  const langInstr: Record<string, string> = {
    RU: 'Отвечай ТОЛЬКО на русском языке.',
    KZ: 'Тек қазақ тілінде жауап бер.',
    EN: 'Respond ONLY in English.',
  }

  const evalPrompt = `Ты — строгий HR-эксперт и ментор на платформе UniWay (Казахстан).

Направление кандидата: ${direction}
Вопрос ${questionIndex + 1} из ${totalQuestions}: "${question}"

Ответ кандидата:
"""
${answer.substring(0, 1000)}
"""

Твоя задача:
1. Поставь балл от 0 до 100 исходя из РЕАЛЬНОГО качества ответа
2. Дай конкретную обратную связь — без шаблонов, без лишней вежливости

Правила выставления балла:
- 85-100: Ответ развёрнутый, конкретный, с примерами, показывает реальный опыт
- 65-84: Ответ правильный, но поверхностный или без примеров
- 40-64: Ответ частично верный, есть серьёзные пробелы
- 0-39: Ответ не по теме, слишком короткий или некомпетентный

ВАЖНО: Короткий ответ из 1-2 предложений без примеров — максимум 55 баллов. Не завышай оценки.

Ответь СТРОГО в формате JSON (ничего лишнего, только JSON):
{
  "score": <число от 0 до 100>,
  "feedback": "<2-4 предложения: что хорошо (если есть), что конкретно не хватает, что сделать>"
}

${langInstr[lang]}`

  try {
    const result = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: 'Ты строгий, честный эксперт. Никогда не завышай оценки. Шаблонные фразы запрещены. Отвечай только валидным JSON.',
        },
        { role: 'user', content: evalPrompt },
      ],
      max_tokens: 300,
      temperature: 0.3,
    }) as { response: string }

    // Parse AI JSON response
    const raw = result.response?.trim() || ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 50)))
      const feedback = String(parsed.feedback || '').trim()
      return c.json({ score, feedback: feedback || fallbackFeedback(score, direction) })
    }
    throw new Error('No JSON in AI response')
  } catch {
    // Fallback: score based on answer length + random
    const lengthScore = Math.min(30, Math.floor(answer.length / 20))
    const score = Math.max(20, Math.min(75, 30 + lengthScore + Math.floor(Math.random() * 20)))
    return c.json({ score, feedback: fallbackFeedback(score, direction) })
  }
})



// GET /api/interviews
app.get('/api/interviews', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)

  const { results } = await db
    .prepare('SELECT * FROM interview_results WHERE userId=? ORDER BY date DESC')
    .bind(user.id)
    .all<InterviewResult>()

  return c.json({ interviews: results, total: results.length })
})

// POST /api/interviews
app.post('/api/interviews', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)

  let raw: unknown
  try { raw = await c.req.json() }
  catch { return c.json({ error: 'Неверный формат данных' }, 400) }

  const parsed = InterviewSchema.safeParse(raw)
  if (!parsed.success) return c.json({ error: parsed.error.errors[0]?.message }, 400)

  const { direction, score, questionsCount, feedback } = parsed.data
  const id = generateId()
  const date = new Date().toISOString()

  await db.prepare(`
    INSERT INTO interview_results (id,userId,direction,score,date,questionsCount,feedback)
    VALUES (?,?,?,?,?,?,?)
  `).bind(id, user.id, direction || 'IT', Math.min(100, Math.max(0, score)), date, questionsCount || 5, feedback || '').run()

  const result = await db.prepare('SELECT * FROM interview_results WHERE id=?').bind(id).first<InterviewResult>()
  return c.json({ success: true, interview: result }, 201)
})

// ============================================================
//  STUDENT ROUTES (role-guarded)
// ============================================================

// GET /api/student/stats
app.get('/api/student/stats', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)
  if (user.role !== 'student') return c.json({ error: 'Доступ запрещён' }, 403)

  const { results: subs } = await db
    .prepare('SELECT * FROM submissions WHERE userId=?')
    .bind(user.id)
    .all<Submission>()
  const { results: interviews } = await db
    .prepare('SELECT * FROM interview_results WHERE userId=? ORDER BY date DESC')
    .bind(user.id)
    .all<InterviewResult>()

  const evaluated = subs.filter(s => s.status === 'evaluated')
  const avgScore = evaluated.length > 0
    ? Math.round(evaluated.reduce((a, b) => a + (b.score || 0), 0) / evaluated.length) : 0
  const avgInterviewScore = interviews.length > 0
    ? Math.round(interviews.reduce((a, b) => a + b.score, 0) / interviews.length) : 0

  return c.json({
    tasksCompleted: evaluated.length,
    tasksInProgress: subs.filter(s => s.status === 'in_progress').length,
    avgScore,
    interviewsCount: interviews.length,
    avgInterviewScore,
    recentSubmissions: subs.slice(0, 3),
    recentInterviews: interviews.slice(0, 3),
  })
})

// ============================================================
//  COMPANY ROUTES (role-guarded)
// ============================================================

// GET /api/company/candidates  — view evaluated students
app.get('/api/company/candidates', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)
  if (user.role !== 'company') return c.json({ error: 'Доступ запрещён' }, 403)

  // Return students with their avg scores
  const { results } = await db
    .prepare(`
      SELECT u.id, u.name, u.direction, u.university, u.city, u.avatar,
             AVG(s.score) as avgScore, COUNT(s.id) as completedTasks
      FROM users u
      LEFT JOIN submissions s ON u.id = s.userId AND s.status='evaluated'
      WHERE u.role='student'
      GROUP BY u.id
      ORDER BY avgScore DESC
    `)
    .all()

  return c.json({ candidates: results, total: results.length })
})

// ============================================================
//  ADMIN ROUTES
// ============================================================

// GET /api/users/list  — admin only
app.get('/api/users/list', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user || user.role !== 'admin') return c.json({ error: 'Доступ запрещён' }, 403)

  const { results } = await db
    .prepare('SELECT id,email,role,name,direction,university,companyName,industry,city,avatar,createdAt FROM users')
    .all()
  return c.json({ users: results, total: results.length })
})

// GET /api/users/stats  — admin only
app.get('/api/users/stats', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user || user.role !== 'admin') return c.json({ error: 'Доступ запрещён' }, 403)

  const studentsRow = await db.prepare("SELECT COUNT(*) as n FROM users WHERE role='student'").first<{ n: number }>()
  const companiesRow = await db.prepare("SELECT COUNT(*) as n FROM users WHERE role='company'").first<{ n: number }>()
  const subsRow = await db.prepare('SELECT COUNT(*) as n FROM submissions').first<{ n: number }>()
  const interviewsRow = await db.prepare('SELECT COUNT(*) as n FROM interview_results').first<{ n: number }>()

  return c.json({
    totalStudents: studentsRow?.n ?? 0,
    totalCompanies: companiesRow?.n ?? 0,
    totalSubmissions: subsRow?.n ?? 0,
    totalInterviews: interviewsRow?.n ?? 0,
  })
})

// ============================================================
//  API DOCUMENTATION  (Swagger-compatible OpenAPI 3.0 schema)
// ============================================================

app.get('/api/docs', (c) => {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'UniWay API',
      version: '2.0.0',
      description: 'REST API для образовательной платформы UniWay — карьерный старт для студентов Казахстана.',
      contact: { email: 'dev@uniway.kz' },
    },
    servers: [{ url: 'https://webapp.pages.dev', description: 'Production (Cloudflare Pages)' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'hex-token-64chars' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' }, email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['student', 'company', 'admin'] },
            name: { type: 'string' }, direction: { type: 'string' },
            university: { type: 'string' }, companyName: { type: 'string' },
            avatar: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Submission: {
          type: 'object',
          properties: {
            id: { type: 'string' }, taskId: { type: 'integer' }, taskTitle: { type: 'string' },
            company: { type: 'string' }, direction: { type: 'string' },
            status: { type: 'string', enum: ['in_progress', 'submitted', 'evaluated'] },
            submittedAt: { type: 'string', format: 'date-time' },
            score: { type: 'integer', minimum: 0, maximum: 100 }, feedback: { type: 'string' },
            solutionText: { type: 'string' },
          },
        },
        InterviewResult: {
          type: 'object',
          properties: {
            id: { type: 'string' }, direction: { type: 'string' },
            score: { type: 'integer' }, date: { type: 'string', format: 'date-time' },
            questionsCount: { type: 'integer' }, feedback: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'], summary: 'Регистрация нового пользователя',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: {
              type: 'object', required: ['email','password','name','role'],
              properties: {
                email: { type: 'string', format: 'email', example: 'student@test.kz' },
                password: { type: 'string', minLength: 6, example: 'secret123' },
                name: { type: 'string', example: 'Айгерим Сейтқали' },
                role: { type: 'string', enum: ['student','company'] },
                direction: { type: 'string', example: 'IT' },
                university: { type: 'string', example: 'НУАД' },
              },
            }}},
          },
          responses: {
            '201': { description: 'Успешная регистрация', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, token: { type: 'string' }, user: { '$ref': '#/components/schemas/User' } } } } } },
            '400': { description: 'Ошибка валидации', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
            '409': { description: 'Email уже занят' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'], summary: 'Вход в систему',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['email','password'], properties: { email: { type: 'string' }, password: { type: 'string' } } } } },
          },
          responses: {
            '200': { description: 'Успешный вход', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { '$ref': '#/components/schemas/User' } } } } } },
            '401': { description: 'Неверные учётные данные' },
          },
        },
      },
      '/api/auth/me': {
        get: { tags: ['Auth'], summary: 'Получить текущего пользователя', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Текущий пользователь' }, '401': { description: 'Не авторизован' } } },
      },
      '/api/auth/logout': {
        post: { tags: ['Auth'], summary: 'Выход из системы', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Успешный выход' } } },
      },
      '/api/auth/profile': {
        put: { tags: ['Auth'], summary: 'Обновить профиль', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Обновлённый профиль' } } },
      },
      '/api/auth/change-password': {
        put: { tags: ['Auth'], summary: 'Сменить пароль', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Пароль изменён' }, '401': { description: 'Неверный текущий пароль' } } },
      },
      '/api/tasks': {
        get: { tags: ['Tasks'], summary: 'Список заданий', parameters: [{ name: 'direction', in: 'query', schema: { type: 'string', enum: ['IT','SMM','Контент','Аналитика'] } }], responses: { '200': { description: 'Массив заданий' } } },
      },
      '/api/tasks/{id}': {
        get: { tags: ['Tasks'], summary: 'Детали задания', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Задание' }, '404': { description: 'Не найдено' } } },
      },
      '/api/submissions': {
        get: { tags: ['Submissions'], summary: 'Задания студента', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Список submissions' } } },
        post: { tags: ['Submissions'], summary: 'Взять задание', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['taskId','taskTitle'], properties: { taskId: { type: 'integer' }, taskTitle: { type: 'string' }, company: { type: 'string' }, direction: { type: 'string' } } } } } }, responses: { '201': { description: 'Задание взято' }, '409': { description: 'Уже взято' } } },
      },
      '/api/submissions/{id}': {
        put: {
          tags: ['Submissions'], summary: 'Отправить решение (запускает AI-оценку)', security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['submitted'] }, solutionText: { type: 'string', description: 'Текст решения — анализируется AI' } } } } } },
          responses: { '200': { description: 'Решение оценено AI', content: { 'application/json': { schema: { type: 'object', properties: { submission: { '$ref': '#/components/schemas/Submission' } } } } } } },
      },
      '/api/interviews': {
        get: { tags: ['Interviews'], summary: 'Результаты собеседований', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Список результатов' } } },
        post: { tags: ['Interviews'], summary: 'Сохранить результат собеседования', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['score'], properties: { direction: { type: 'string' }, score: { type: 'integer', minimum: 0, maximum: 100 }, questionsCount: { type: 'integer' }, feedback: { type: 'string' } } } } } }, responses: { '201': { description: 'Результат сохранён' } } },
      },
      '/api/student/stats': {
        get: { tags: ['Student'], summary: 'Статистика студента (только role=student)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Агрегированная статистика' }, '403': { description: 'Доступ запрещён' } } },
      },
      '/api/company/candidates': {
        get: { tags: ['Company'], summary: 'Список кандидатов (только role=company)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Студенты с оценками' }, '403': { description: 'Доступ запрещён' } } },
      },
      '/api/users/list': {
        get: { tags: ['Admin'], summary: 'Список всех пользователей (только role=admin)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Все пользователи' }, '403': { description: 'Доступ запрещён' } } },
      },
      '/api/users/stats': {
        get: { tags: ['Admin'], summary: 'Статистика платформы (только role=admin)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Агрегированная статистика' } } },
      },
      '/api/docs': {
        get: { tags: ['Meta'], summary: 'OpenAPI 3.0 документация (этот endpoint)', responses: { '200': { description: 'OpenAPI JSON schema' } } },
      },
    },
  },
};
  return c.json(spec)
})

// ============================================================
//  HTML SHELL (SPA)
// ============================================================
function getHTML(): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UniWay — Платформа для карьеры студентов Казахстана</title>
  <meta name="description" content="UniWay помогает студентам Казахстана подготовиться к стажировкам через реальные задания и AI-собеседования" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
  <link rel="stylesheet" href="/static/style.css" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
            accent:  { 50:'#f0fdf4',100:'#dcfce7',400:'#4ade80',500:'#22c55e',600:'#16a34a' },
            dark:    { 800:'#1e293b',900:'#0f172a' }
          },
          fontFamily: { sans: ['Inter','system-ui','sans-serif'] }
        }
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body class="font-sans bg-gray-50 text-gray-900">
  <div id="app"></div>
  <script src="/static/app.js"></script>
</body>
</html>`
}

const SPA_ROUTES = ['/', '/about', '/register', '/login', '/catalog',
  '/task/*', '/student/*', '/company/*', '/interview', '/resume', '/admin', '/*']

for (const route of SPA_ROUTES) {
  app.get(route, (c) => c.html(getHTML()))
}

export default app
