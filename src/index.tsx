import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { z } from 'zod'

// =====================================================
//  UniWay — Backend v2
//  Storage:  Cloudflare D1 (SQLite)
//  Auth:     PBKDF2 (per-user random salt) + Bearer token (stored in D1)
//  AI:       @cf/meta/llama-3-8b-instruct via c.env.AI
//  Validation: Zod
// =====================================================

// ---- Cloudflare Bindings ----
type Env = {
  DB: D1Database
  AI: Ai
  // Set in Cloudflare Pages → Settings → Environment Variables
  // Public vars (can go in wrangler.jsonc vars):
  ALLOWED_ORIGIN?: string          // e.g. https://webapp-f21.pages.dev
  TURNSTILE_SITE_KEY?: string      // public sitekey from dash.cloudflare.com → Turnstile
  GOOGLE_CLIENT_ID?: string        // public OAuth client ID from console.developers.google.com
  // Secrets (add via dashboard "Secrets" — NOT in wrangler.jsonc):
  TURNSTILE_SECRET_KEY?: string    // private secret for server-side verification
}

// ============================================================
//  CACHE HELPERS  (Cloudflare Cache API)
// ============================================================

const CACHE_TTL = {
  tasks: 300,        // 5 min  — static catalogue almost never changes
  candidates: 60,    // 1 min  — company candidates list
  adminStats: 30,    // 30 sec — admin platform stats
  studentStats: 20,  // 20 sec — per-user stats (short, user-specific)
}

/** Build a deterministic cache key URL from a logical key string. */
function cacheKey(key: string): string {
  return `https://uniway-cache.internal/${key}`
}

/** Try to read a cached JSON response. Returns parsed value or null. */
async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const cache = caches.default
    const cached = await cache.match(new Request(cacheKey(key)))
    if (!cached) return null
    return (await cached.json()) as T
  } catch {
    return null
  }
}

/** Store a JSON value in the Cache API with a TTL (seconds). */
async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const cache = caches.default
    const response = new Response(JSON.stringify(value), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${ttlSeconds}`,
      },
    })
    await cache.put(new Request(cacheKey(key)), response)
  } catch {
    // Cache writes are best-effort — never block the request
  }
}

/** Invalidate one or more cache keys (fire-and-forget, use inside waitUntil). */
async function cacheDelete(...keys: string[]): Promise<void> {
  try {
    const cache = caches.default
    await Promise.all(keys.map(k => cache.delete(new Request(cacheKey(k)))))
  } catch {
    // Ignore cache-delete failures
  }
}

// ============================================================
//  BACKGROUND TASK QUEUE  (ctx.waitUntil wrappers)
// ============================================================

type BgTask = (db: D1Database) => Promise<void>

/**
 * Schedule background work via ctx.waitUntil so it doesn't block
 * the HTTP response. Errors are silently swallowed — background
 * tasks must never crash the Worker.
 */
function scheduleTask(ctx: ExecutionContext, task: () => Promise<void>): void {
  ctx.waitUntil(
    task().catch(err => console.error('[bg-task]', err))
  )
}

/** Purge expired sessions older than 30 days from D1 (background). */
async function bgPurgeSessions(db: D1Database): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  await db.prepare('DELETE FROM sessions WHERE createdAt < ?').bind(cutoff).run()
}

/** Invalidate cache keys that depend on a user's submissions data (background). */
async function bgInvalidateUserCaches(userId: string): Promise<void> {
  await cacheDelete(
    `studentStats:${userId}`,
    'candidates',          // company view aggregates all students
    'adminStats',
  )
}

/** Invalidate admin/company-visible aggregate caches (background). */
async function bgInvalidateAggregateCaches(): Promise<void> {
  await cacheDelete('candidates', 'adminStats')
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
  role: z.enum(['student', 'company'], { message: 'Роль: student или company' }),
  direction: z.string().optional(),
  university: z.string().optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
  cfTurnstileToken: z.string().optional(),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  cfTurnstileToken: z.string().optional(),
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
  taskId: z.number({ message: 'taskId обязателен' }),
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
  const salt = new Uint8Array(32)
  crypto.getRandomValues(salt)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 },
    key, 256
  )
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':')
    const saltHex = parts[1]
    const expectedHex = parts[2]
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 },
      key, 256
    )
    const derived = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
    return derived === expectedHex
  }
  // Legacy SHA-256 fallback for existing accounts migrating on next login
  const enc = new TextEncoder()
  const data = enc.encode(password + 'uniway_salt_2025')
  const buf = await crypto.subtle.digest('SHA-256', data)
  const legacyHash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  return legacyHash === storedHash
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

// ---- AI Feedback for task submissions ----
async function getAIFeedback(
  ai: Ai,
  solution: string,
  direction: string,
  lang: 'RU' | 'KZ' | 'EN' = 'RU'
): Promise<{ score: number; feedback: string }> {

  const focusMap: Record<string, string> = {
    IT: 'правильность логики и алгоритма, чистота кода, обработка ошибок, выбор структур данных',
    Маркетинг: 'конкретность стратегии, наличие метрик и KPI, реалистичность бюджета, понимание аудитории',
    Дизайн: 'обоснованность решений, понимание пользователя, знание UX-принципов, проработанность деталей',
    Бизнес: 'структурированность мышления, обоснованность цифрами, учёт рисков, практичность выводов',
    HR: 'системность подхода, знание процессов, конкретные инструменты и метрики',
    Финансы: 'точность терминологии, понимание взаимосвязей показателей, обоснованность расчётов',
    Аналитика: 'методология анализа, качество визуализации, глубина инсайтов, практичность выводов',
    Контент: 'структура и логика, качество текста, SEO-грамотность, соответствие задаче',
    SMM: 'креативность, соответствие аудитории, измеримость результатов, трендовость',
  }
  const focus = focusMap[direction] || focusMap['IT']

  const langInstr: Record<string, string> = {
    RU: 'Отвечай строго на русском языке.',
    KZ: 'Тек қазақ тілінде жауап бер.',
    EN: 'Respond strictly in English.',
  }

  const prompt = `Ты — строгий эксперт-ментор платформы UniWay (Казахстан). Оцени решение студента объективно.

Направление: ${direction}
Критерии оценки: ${focus}

Решение студента:
"""
${solution.substring(0, 1500)}
"""

Правила выставления балла:
- 85-100: Решение полное, конкретное, с обоснованием, видна реальная компетентность
- 65-84: Решение верное, но поверхностное или без деталей
- 40-64: Частично верное, есть существенные пробелы
- 0-39: Решение слабое, не по теме или слишком короткое

ВАЖНО: Если решение короче 50 слов — максимум 45 баллов. Не завышай оценку.

Ответь ТОЛЬКО валидным JSON без лишнего текста:
{"score": <число 0-100>, "feedback": "<3-4 предложения: что конкретно хорошо или плохо, чего не хватает, что сделать дальше>"}

${langInstr[lang]}`

  try {
    const result = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'Ты строгий эксперт. Не завышай оценки. Шаблонные фразы запрещены. Отвечай только JSON.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 350,
      temperature: 0.3,
    }) as { response: string }

    const raw = result.response?.trim() || ''
    const match = raw.match(/\{[\s\S]*?\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 50)))
      const feedback = String(parsed.feedback || '').trim()
      return { score, feedback: feedback || fallbackFeedback(score, direction) }
    }
    throw new Error('no json')
  } catch {
    const score = Math.min(60, Math.max(20, Math.floor(solution.length / 30)))
    return { score, feedback: fallbackFeedback(score, direction) }
  }
}

function fallbackFeedback(score: number, direction: string): string {
  const tips: Record<string, string> = {
    IT: 'Покажи конкретный код или архитектуру — без этого нечего оценивать.',
    Маркетинг: 'Добавь метрики и бюджетный расчёт — идеи без цифр не работают.',
    Дизайн: 'Обоснуй решения через задачу пользователя, а не только эстетику.',
    Бизнес: 'Подкрепи выводы конкретными цифрами — иначе это просто мнение.',
    HR: 'Ссылайся на конкретные инструменты и процессы, а не общие принципы.',
    Финансы: 'Назови конкретные формулы и метрики с расчётами.',
    Аналитика: 'Покажи методику и конкретные выводы из данных.',
    Контент: 'Улучши структуру и добавь конкретные примеры.',
    SMM: 'Добавь конкретные метрики и обоснование выбора платформ.',
  }
  const tip = tips[direction] || tips['IT']
  if (score >= 75) return `Приемлемо, но есть куда расти. ${tip}`
  if (score >= 50) return `Базовый уровень. Для реального собеседования недостаточно. ${tip}`
  return `Слабый ответ. ${tip} Изучи тему глубже и попробуй снова.`
}

// ---- Detect language from Accept-Language or user profile ----
function detectLang(c: any): 'RU' | 'KZ' | 'EN' {
  const al = c.req.header('Accept-Language') || ''
  if (al.startsWith('kk')) return 'KZ'
  if (al.startsWith('en')) return 'EN'
  return 'RU'
}

// ============================================================
//  CAPTCHA (Cloudflare Turnstile)
// ============================================================

/**
 * Verify a Turnstile token. Returns true when the token is valid OR when
 * TURNSTILE_SECRET_KEY is not configured (dev/test environments).
 */
async function verifyTurnstile(secret: string | undefined, token: string | undefined): Promise<boolean> {
  if (!secret) return true          // secret not configured → skip (dev/CI)
  if (!token) return false
  const body = new URLSearchParams({ secret, response: token })
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  })
  const data = await res.json() as { success: boolean }
  return data.success === true
}

// ============================================================
//  GOOGLE OAUTH (One-Tap / Sign-In with Google)
// ============================================================

interface GoogleTokenPayload {
  sub: string        // unique Google user ID
  email: string
  name: string
  picture?: string
  email_verified?: boolean
}

/**
 * Verify a Google ID token by calling Google's tokeninfo endpoint.
 * Only validates audience when GOOGLE_CLIENT_ID is set.
 * Returns the payload or null on failure.
 */
async function verifyGoogleToken(clientId: string | undefined, credential: string): Promise<GoogleTokenPayload | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`)
    if (!res.ok) return null
    const payload = await res.json() as GoogleTokenPayload & { aud: string; exp: string }
    if (clientId && payload.aud !== clientId) return null
    if (Number(payload.exp) < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

// ---- Middleware: auth guard ----
async function requireAuth(c: any, db: D1Database): Promise<User | null> {
  const token = getTokenFromRequest(c)
  return getUserFromToken(db, token)
}

// ============================================================
const app = new Hono<{ Bindings: Env; Variables: { ctx: ExecutionContext } }>()

// Restrict CORS to our known origin; fall back to Pages default if not set
app.use('/api/*', async (c, next) => {
  const origin = c.env?.ALLOWED_ORIGIN || 'https://webapp-f21.pages.dev'
  return cors({
    origin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })(c, next)
})

// Security headers on every response
app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()')
  c.header(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://challenges.cloudflare.com https://accounts.google.com https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com https://accounts.google.com",
    ].join('; ')
  )
})

// Store ExecutionContext in c.var so any route handler can call waitUntil.
// Falls back to a no-op stub when running under Vitest (no real Workers runtime).
app.use('*', async (c, next) => {
  try {
    // @ts-ignore
    const ctx = (c as any).executionCtx as ExecutionContext
    c.set('ctx', ctx)
  } catch {
    // Vitest / non-Workers env: stub so scheduleTask becomes a no-op
    c.set('ctx', { waitUntil: () => {}, passThroughOnException: () => {}, props: {} } as unknown as ExecutionContext)
  }
  await next()
})

// Static assets are served by Cloudflare Pages CDN in production;
// this middleware only handles local wrangler dev requests.
// @ts-ignore — manifest binding is injected by wrangler at runtime
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
    const msg = parsed.error.issues[0]?.message || 'Ошибка валидации'
    return c.json({ error: msg }, 400)
  }

  const captchaOk = await verifyTurnstile(c.env.TURNSTILE_SECRET_KEY, parsed.data.cfTurnstileToken)
  if (!captchaOk) return c.json({ error: 'Проверка CAPTCHA не пройдена' }, 400)

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

  const captchaOk = await verifyTurnstile(c.env.TURNSTILE_SECRET_KEY, parsed.data.cfTurnstileToken)
  if (!captchaOk) return c.json({ error: 'Проверка CAPTCHA не пройдена' }, 400)

  const normalizedEmail = parsed.data.email.toLowerCase().trim()
  const user = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first<User>()

  if (!user) return c.json({ error: 'Пользователь с таким email не найден' }, 401)

  const ok = await verifyPassword(parsed.data.password, user.passwordHash)
  if (!ok) return c.json({ error: 'Неверный пароль' }, 401)

  // Transparently upgrade legacy SHA-256 hashes to PBKDF2 on successful login
  if (!user.passwordHash.startsWith('pbkdf2:')) {
    const newHash = await hashPassword(parsed.data.password)
    await db.prepare('UPDATE users SET passwordHash=? WHERE id=?').bind(newHash, user.id).run()
  }

  const token = generateToken()
  await db.prepare('INSERT INTO sessions (token, userId, createdAt) VALUES (?,?,?)')
    .bind(token, user.id, new Date().toISOString())
    .run()

  // Background: probabilistic session cleanup (~10% of logins to avoid D1 overload)
  if (Math.random() < 0.1) {
    scheduleTask(c.get('ctx'), () => bgPurgeSessions(c.env.DB))
  }

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
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400)

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

  // Background: profile changes can affect the candidates list for companies
  scheduleTask(c.get('ctx'), () => bgInvalidateAggregateCaches())

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
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400)

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash)
  if (!ok) return c.json({ error: 'Неверный текущий пароль' }, 401)

  const newHash = await hashPassword(parsed.data.newPassword)
  await db.prepare('UPDATE users SET passwordHash=? WHERE id=?').bind(newHash, user.id).run()
  return c.json({ success: true, message: 'Пароль успешно изменён' })
})

// ============================================================
//  TASK CATALOGUE
// ============================================================

// GET /api/tasks  — list tasks (filter by direction)
app.get('/api/tasks', async (c) => {
  const direction = c.req.query('direction')
  const key = direction ? `tasks:${direction}` : 'tasks:all'

  // Try cache first
  const cached = await cacheGet<{ tasks: unknown[]; total: number }>(key)
  if (cached) return c.json(cached)

  let payload: { tasks: { id: number; title: string; company: string; description: string }[]; total: number }
  if (direction && TASK_CATALOGUE[direction]) {
    payload = { tasks: TASK_CATALOGUE[direction], total: TASK_CATALOGUE[direction].length }
  } else {
    const all = Object.values(TASK_CATALOGUE).flat()
    payload = { tasks: all, total: all.length }
  }

  // Cache in background — don't block the response
  scheduleTask(c.get('ctx'), () => cacheSet(key, payload, CACHE_TTL.tasks))
  return c.json(payload)
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
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400)

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
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400)

  const body = parsed.data
  let { status, solutionText, score, feedback } = { ...sub, ...body }

  // AI evaluation when student submits solution
  if (body.status === 'submitted' && sub.status !== 'evaluated') {
    const solution = solutionText || sub.solutionText || ''
    const direction = sub.direction || user.direction || 'IT'
    const lang = detectLang(c)

    const aiResult = await getAIFeedback(c.env.AI, solution, direction, lang)
    score = aiResult.score
    feedback = aiResult.feedback
    status = 'evaluated'
  }

  await db.prepare(`
    UPDATE submissions SET status=?, solutionText=?, score=?, feedback=? WHERE id=?
  `).bind(status, solutionText ?? sub.solutionText, score ?? sub.score, feedback ?? sub.feedback, subId).run()

  const updated = await db.prepare('SELECT * FROM submissions WHERE id=?').bind(subId).first<Submission>()

  // Background: invalidate caches that include this user's stats/scores
  scheduleTask(c.get('ctx'), () => bgInvalidateUserCaches(user.id))

  return c.json({ success: true, submission: updated })
})

// ============================================================
//  INTERVIEW AI EVALUATION
// ============================================================

app.post('/api/interview/evaluate', async (c) => {
  const db = c.env.DB
  const user = await requireAuth(c, db)
  if (!user) return c.json({ error: 'Не авторизован' }, 401)

  let raw: unknown
  try { raw = await c.req.json() }
  catch { return c.json({ error: 'Неверный формат данных' }, 400) }

  const schema = z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
    direction: z.string().default('IT'),
    questionIndex: z.number().default(0),
    totalQuestions: z.number().default(5),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400)

  const { question, answer, direction, questionIndex, totalQuestions } = parsed.data
  const lang = detectLang(c)

  const langInstr: Record<string, string> = {
    RU: 'Отвечай строго на русском языке.',
    KZ: 'Тек қазақ тілінде жауап бер.',
    EN: 'Respond strictly in English.',
  }

  const prompt = `Ты — опытный HR-эксперт на платформе UniWay (Казахстан). Проводишь симуляцию собеседования.

Направление кандидата: ${direction}
Вопрос ${questionIndex + 1} из ${totalQuestions}: "${question}"

Ответ кандидата:
"""
${answer.substring(0, 800)}
"""

Правила выставления балла:
- 80-100: Ответ развёрнутый, конкретный, с примерами из практики
- 60-79: Ответ правильный, но поверхностный или без примеров
- 35-59: Частично верный, есть серьёзные пробелы
- 0-34: Слишком короткий, не по теме или некомпетентный

Ответ из 1-2 предложений без конкретики — максимум 45 баллов. Не завышай.

Ответь ТОЛЬКО валидным JSON:
{"score": <0-100>, "feedback": "<2-3 конкретных предложения: что хорошо/плохо в ответе и что улучшить>"}

${langInstr[lang]}`

  try {
    const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'Строгий HR-эксперт. Не завышай оценки. Только JSON в ответе.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 250,
      temperature: 0.3,
    }) as { response: string }

    const text = result.response?.trim() || ''
    const match = text.match(/\{[\s\S]*?\}/)
    if (match) {
      const data = JSON.parse(match[0])
      const score = Math.max(0, Math.min(100, Math.round(Number(data.score) || 50)))
      const feedback = String(data.feedback || '').trim()
      return c.json({ score, feedback })
    }
    throw new Error('no json')
  } catch {
    // Fallback: score by answer length
    const score = Math.min(60, Math.max(15, Math.floor(answer.length / 15)))
    const fallbacks: Record<string, string> = {
      IT: 'Ответ слишком общий. Назови конкретные технологии и приведи пример из практики.',
      Маркетинг: 'Не хватает конкретных цифр и метрик. Обоснуй свой подход данными.',
      Дизайн: 'Объясни решение через задачу пользователя, а не через визуал.',
      Бизнес: 'Подкрепи ответ конкретными расчётами или примерами.',
      HR: 'Назови конкретные инструменты и метрики, а не общие принципы.',
      Финансы: 'Приведи конкретные формулы и числовые примеры.',
    }
    return c.json({ score, feedback: fallbacks[direction] || 'Развернись подробнее и приведи конкретный пример.' })
  }
})

// ============================================================
//  INTERVIEW RESULTS
// ============================================================

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
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400)

  const { direction, score, questionsCount, feedback } = parsed.data
  const id = generateId()
  const date = new Date().toISOString()

  await db.prepare(`
    INSERT INTO interview_results (id,userId,direction,score,date,questionsCount,feedback)
    VALUES (?,?,?,?,?,?,?)
  `).bind(id, user.id, direction || 'IT', Math.min(100, Math.max(0, score)), date, questionsCount || 5, feedback || '').run()

  const result = await db.prepare('SELECT * FROM interview_results WHERE id=?').bind(id).first<InterviewResult>()

  // Background: invalidate user-specific and aggregate caches
  scheduleTask(c.get('ctx'), () => bgInvalidateUserCaches(user.id))

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

  const key = `studentStats:${user.id}`
  const cached = await cacheGet<object>(key)
  if (cached) return c.json(cached)

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

  const payload = {
    tasksCompleted: evaluated.length,
    tasksInProgress: subs.filter(s => s.status === 'in_progress').length,
    avgScore,
    interviewsCount: interviews.length,
    avgInterviewScore,
    recentSubmissions: subs.slice(0, 3),
    recentInterviews: interviews.slice(0, 3),
  }

  scheduleTask(c.get('ctx'), () => cacheSet(key, payload, CACHE_TTL.studentStats))
  return c.json(payload)
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

  const key = 'candidates'
  const cached = await cacheGet<object>(key)
  if (cached) return c.json(cached)

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

  const payload = { candidates: results, total: results.length }
  scheduleTask(c.get('ctx'), () => cacheSet(key, payload, CACHE_TTL.candidates))
  return c.json(payload)
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

  const key = 'adminStats'
  const cached = await cacheGet<object>(key)
  if (cached) return c.json(cached)

  const studentsRow = await db.prepare("SELECT COUNT(*) as n FROM users WHERE role='student'").first<{ n: number }>()
  const companiesRow = await db.prepare("SELECT COUNT(*) as n FROM users WHERE role='company'").first<{ n: number }>()
  const subsRow = await db.prepare('SELECT COUNT(*) as n FROM submissions').first<{ n: number }>()
  const interviewsRow = await db.prepare('SELECT COUNT(*) as n FROM interview_results').first<{ n: number }>()

  const payload = {
    totalStudents: studentsRow?.n ?? 0,
    totalCompanies: companiesRow?.n ?? 0,
    totalSubmissions: subsRow?.n ?? 0,
    totalInterviews: interviewsRow?.n ?? 0,
  }

  scheduleTask(c.get('ctx'), () => cacheSet(key, payload, CACHE_TTL.adminStats))
  return c.json(payload)
})

// ============================================================
//  GOOGLE OAUTH ROUTE
// ============================================================

// POST /api/auth/google
// Body: { credential: string }  — the Google ID token from GIS / One-Tap
app.post('/api/auth/google', async (c) => {
  const db = c.env.DB
  await seedAdmin(db)

  let raw: unknown
  try { raw = await c.req.json() }
  catch { return c.json({ error: 'Неверный формат данных' }, 400) }

  const schema = z.object({ credential: z.string().min(1) })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return c.json({ error: 'Google credential обязателен' }, 400)

  const payload = await verifyGoogleToken(c.env.GOOGLE_CLIENT_ID, parsed.data.credential)
  if (!payload) return c.json({ error: 'Недействительный Google токен' }, 401)
  if (!payload.email_verified) return c.json({ error: 'Email в Google аккаунте не подтверждён' }, 400)

  const normalizedEmail = payload.email.toLowerCase().trim()
  let user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).first<User>()

  if (!user) {
    // Auto-register: Google users become students by default
    const id = generateId()
    const avatar = getAvatarInitials(payload.name || payload.email)
    const createdAt = new Date().toISOString()
    await db.prepare(`
      INSERT INTO users (id,email,passwordHash,role,name,direction,avatar,createdAt)
      VALUES (?,?,?,?,?,?,?,?)
    `).bind(id, normalizedEmail, '', 'student', payload.name || normalizedEmail, 'IT', avatar, createdAt).run()
    user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>()
  }

  const token = generateToken()
  await db.prepare('INSERT INTO sessions (token, userId, createdAt) VALUES (?,?,?)')
    .bind(token, user!.id, new Date().toISOString())
    .run()

  return c.json({
    success: true,
    token,
    user: safeUser(user!),
    message: `Добро пожаловать, ${user!.name}!`,
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
function getHTML(env?: Env): string {
  // Cloudflare Turnstile test sitekey (always passes) — replace with real key in production
  const turnstileSiteKey = env?.TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
  const googleClientId   = env?.GOOGLE_CLIENT_ID   || ''
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
  <!-- Cloudflare Turnstile CAPTCHA -->
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <!-- Google Identity Services (Sign-In with Google) -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <script>
    window.TURNSTILE_SITE_KEY = '${turnstileSiteKey}';
    window.GOOGLE_CLIENT_ID   = '${googleClientId}';
  </script>
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
  app.get(route, (c) => c.html(getHTML(c.env)))
}

export default app
