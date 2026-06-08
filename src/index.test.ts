/**
 * index.test.ts — UniWay API Test Suite
 * ======================================
 * Покрытие: Auth, Tasks, Submissions, Interviews, Student/Company/Admin routes
 * Запуск:   npx vitest run --reporter=verbose
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from './index'

// ── Базовые моки окружения ────────────────────────────────────────────────────

/**
 * Фабрика мок-окружения. Позволяет переопределить поведение
 * отдельных методов для конкретного теста через overrides.
 */
function makeEnv(overrides: Partial<{
  dbFirst: () => Promise<unknown>
  dbAll: () => Promise<{ results: unknown[] }>
  dbRun: () => Promise<{ success: boolean }>
  aiRun: () => Promise<{ response: string }>
}> = {}) {
  const dbFirst = overrides.dbFirst ?? (async () => null)
  const dbAll   = overrides.dbAll   ?? (async () => ({ results: [] }))
  const dbRun   = overrides.dbRun   ?? (async () => ({ success: true }))
  const aiRun   = overrides.aiRun   ?? (async () => ({ response: '{"score":75,"feedback":"Хороший ответ, но не хватает деталей."}' }))

  return {
    DB: {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: dbFirst,
      all:   dbAll,
      run:   dbRun,
    },
    AI: { run: aiRun },
    // Stub ExecutionContext so ctx.waitUntil() is a silent no-op in tests
    __executionCtx: { waitUntil: () => {}, passThroughOnException: () => {} },
  }
}

/** Хэш для пароля "correct_password" с солью 'uniway_salt_2025' */
const CORRECT_HASH = await (async () => {
  const encoder = new TextEncoder()
  const data = encoder.encode('correct_password' + 'uniway_salt_2025')
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
})()

/** Типичный пользователь-студент из базы */
const MOCK_STUDENT = {
  id: 'user-001',
  email: 'student@uniway.kz',
  passwordHash: CORRECT_HASH,
  role: 'student',
  name: 'Айгерим Сейтқали',
  direction: 'IT',
  university: 'НУАД',
  city: 'Астана',
  avatar: 'АС',
  createdAt: '2025-01-01T00:00:00.000Z',
}

/** Типичный пользователь-компания */
const MOCK_COMPANY = {
  ...MOCK_STUDENT,
  id: 'company-001',
  email: 'hr@kaspi.kz',
  role: 'company',
  companyName: 'Kaspi Bank',
}

/** Типичный пользователь-админ */
const MOCK_ADMIN = {
  ...MOCK_STUDENT,
  id: 'admin-001',
  email: 'admin@uniway.kz',
  role: 'admin',
  name: 'Администратор UniWay',
}

/**
 * Создаёт окружение, где авторизация всегда возвращает указанного пользователя.
 * first() вызывается для: сессии, пользователя, дублей и т.д.
 * Используем счётчик, чтобы первый вызов (сессия) → { userId } и второй (юзер) → user.
 */
function makeAuthEnv(user: typeof MOCK_STUDENT, extraFirst?: () => Promise<unknown>) {
  let callCount = 0
  return makeEnv({
    dbFirst: async () => {
      callCount++
      if (callCount === 1) return { userId: user.id }  // sessions lookup
      if (callCount === 2) return user                   // users lookup
      return extraFirst ? extraFirst() : null
    },
    dbAll: async () => ({ results: [] }),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('201: создаёт нового студента', async () => {
    const env = makeEnv({ dbFirst: async () => null })

    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'new@uniway.kz',
        password: 'Password123',
        name: 'Тест Пользователь',
        role: 'student',
        direction: 'IT',
        university: 'НУАД',
      }),
    }, env)

    expect(res.status).toBe(201)
    const data = await res.json() as { success: boolean; token: string }
    expect(data.success).toBe(true)
    expect(data.token).toBeTruthy()
  })

  it('409: дублирующийся email', async () => {
    const env = makeEnv({ dbFirst: async () => ({ id: 'existing' }) })

    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'exists@uniway.kz',
        password: 'Password123',
        name: 'Дубль',
        role: 'student',
      }),
    }, env)

    expect(res.status).toBe(409)
  })

  it('400: пропущены обязательные поля', async () => {
    const env = makeEnv()
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'no-password@test.kz' }),
    }, env)

    expect(res.status).toBe(400)
  })

  it('400: невалидный email', async () => {
    const env = makeEnv()
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'Password123',
        name: 'Тест',
        role: 'student',
      }),
    }, env)

    expect(res.status).toBe(400)
  })

  it('400: пароль короче 6 символов', async () => {
    const env = makeEnv()
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.kz',
        password: '123',
        name: 'Тест',
        role: 'student',
      }),
    }, env)

    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('200: успешный вход с правильными данными', async () => {
    const env = makeEnv({ dbFirst: async () => MOCK_STUDENT })

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@uniway.kz', password: 'correct_password' }),
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { token: string; user: { email: string } }
    expect(data.token).toBeTruthy()
    expect(data.user.email).toBe('student@uniway.kz')
  })

  it('401: пользователь не найден', async () => {
    const env = makeEnv({ dbFirst: async () => null })

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost@test.kz', password: 'any' }),
    }, env)

    expect(res.status).toBe(401)
  })

  it('401: неверный пароль', async () => {
    const env = makeEnv({ dbFirst: async () => MOCK_STUDENT })

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@uniway.kz', password: 'wrong_password' }),
    }, env)

    expect(res.status).toBe(401)
  })

  it('400: пустое тело запроса', async () => {
    const env = makeEnv()
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }, env)

    expect(res.status).toBe(400)
  })
})

describe('GET /api/auth/me', () => {
  it('200: возвращает текущего пользователя', async () => {
    const env = makeAuthEnv(MOCK_STUDENT)
    const res = await app.request('/api/auth/me', {
      headers: { Authorization: 'Bearer valid-token' },
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { user: { email: string; passwordHash?: string } }
    expect(data.user.email).toBe('student@uniway.kz')
    // passwordHash никогда не должен утекать
    expect(data.user.passwordHash).toBeUndefined()
  })

  it('401: без токена', async () => {
    const env = makeEnv()
    const res = await app.request('/api/auth/me', {}, env)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('200: успешный выход', async () => {
    const env = makeEnv()
    const res = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer some-token' },
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { success: boolean }
    expect(data.success).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  it('200: возвращает все задания', async () => {
    const env = makeEnv()
    const res = await app.request('/api/tasks', {}, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { tasks: unknown[]; total: number }
    expect(data.tasks).toBeInstanceOf(Array)
    expect(data.total).toBeGreaterThan(0)
  })

  it('200: фильтрация по direction=IT', async () => {
    const env = makeEnv()
    const res = await app.request('/api/tasks?direction=IT', {}, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { tasks: { id: number }[] }
    expect(data.tasks.length).toBeGreaterThan(0)
    // IT-задания имеют id 101-105
    expect(data.tasks[0].id).toBeGreaterThanOrEqual(101)
  })

  it('200: фильтрация по direction=SMM', async () => {
    const env = makeEnv()
    const res = await app.request('/api/tasks?direction=SMM', {}, env)
    const data = await res.json() as { tasks: unknown[] }
    expect(data.tasks.length).toBe(5)
  })
})

describe('GET /api/tasks/:id', () => {
  it('200: возвращает конкретное задание', async () => {
    const env = makeEnv()
    const res = await app.request('/api/tasks/101', {}, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { task: { id: number; title: string } }
    expect(data.task.id).toBe(101)
    expect(data.task.title).toBeTruthy()
  })

  it('404: задание не существует', async () => {
    const env = makeEnv()
    const res = await app.request('/api/tasks/9999', {}, env)
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/submissions', () => {
  it('200: возвращает submissions студента', async () => {
    const mockSubs = [
      { id: 'sub-1', userId: 'user-001', taskId: 101, status: 'in_progress' },
      { id: 'sub-2', userId: 'user-001', taskId: 102, status: 'evaluated', score: 80 },
    ]
    const env = makeAuthEnv(MOCK_STUDENT)
    env.DB.all = async () => ({ results: mockSubs })

    const res = await app.request('/api/submissions', {
      headers: { Authorization: 'Bearer token' },
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { submissions: unknown[]; total: number }
    expect(data.total).toBe(2)
  })

  it('401: без авторизации', async () => {
    const env = makeEnv()
    const res = await app.request('/api/submissions', {}, env)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/submissions', () => {
  it('201: студент берёт задание', async () => {
    // first() — сессия → юзер → null (нет дубля)
    let calls = 0
    const env = makeEnv({
      dbFirst: async () => {
        calls++
        if (calls === 1) return { userId: MOCK_STUDENT.id }
        if (calls === 2) return MOCK_STUDENT
        return null // нет дублирующего submission
      },
    })

    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: 101, taskTitle: 'REST API на Node.js', direction: 'IT' }),
    }, env)

    expect(res.status).toBe(201)
    const data = await res.json() as { submission: { status: string } }
    expect(data.submission.status).toBe('in_progress')
  })

  it('403: компания не может брать задания', async () => {
    const env = makeAuthEnv(MOCK_COMPANY)

    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: 101, taskTitle: 'Test' }),
    }, env)

    expect(res.status).toBe(403)
  })

  it('409: задание уже взято', async () => {
    let calls = 0
    const env = makeEnv({
      dbFirst: async () => {
        calls++
        if (calls === 1) return { userId: MOCK_STUDENT.id }
        if (calls === 2) return MOCK_STUDENT
        return { id: 'existing-sub' } // дубль найден
      },
    })

    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: 101, taskTitle: 'Test' }),
    }, env)

    expect(res.status).toBe(409)
  })
})

describe('PUT /api/submissions/:id (AI evaluation)', () => {
  it('200: отправка решения запускает AI-оценку', async () => {
    const mockSub = {
      id: 'sub-1', userId: 'user-001', taskId: 101,
      taskTitle: 'REST API', direction: 'IT', status: 'in_progress',
    }

    let calls = 0
    const env = makeEnv({
      dbFirst: async () => {
        calls++
        if (calls === 1) return { userId: 'user-001' }
        if (calls === 2) return MOCK_STUDENT
        if (calls === 3) return mockSub   // submission найден
        return { ...mockSub, status: 'evaluated', score: 75, feedback: 'Хорошо' }
      },
      aiRun: async () => ({ response: '{"score":75,"feedback":"Логика верная, но нет обработки ошибок."}' }),
    })

    const res = await app.request('/api/submissions/sub-1', {
      method: 'PUT',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'submitted',
        solutionText: 'Я реализовал REST API с JWT авторизацией. '.repeat(10),
      }),
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { submission: { status: string } }
    expect(data.submission).toBeDefined()
  })

  it('404: submission не принадлежит пользователю', async () => {
    let calls = 0
    const env = makeEnv({
      dbFirst: async () => {
        calls++
        if (calls === 1) return { userId: 'user-001' }
        if (calls === 2) return MOCK_STUDENT
        return null // submission не найден
      },
    })

    const res = await app.request('/api/submissions/fake-id', {
      method: 'PUT',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'submitted', solutionText: 'text' }),
    }, env)

    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/interview/evaluate', () => {
  it('200: AI оценивает ответ на вопрос собеседования', async () => {
    const env = makeAuthEnv(MOCK_STUDENT)
    env.AI.run = async () => ({
      response: '{"score":82,"feedback":"Ответ развёрнутый, есть примеры из практики."}',
    })

    const res = await app.request('/api/interview/evaluate', {
      method: 'POST',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Что такое REST API?',
        answer: 'REST — архитектурный стиль. '.repeat(15),
        direction: 'IT',
        questionIndex: 0,
        totalQuestions: 5,
      }),
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { score: number; feedback: string }
    expect(data.score).toBeGreaterThanOrEqual(0)
    expect(data.score).toBeLessThanOrEqual(100)
    expect(data.feedback).toBeTruthy()
  })

  it('200: fallback score если AI вернул невалидный JSON', async () => {
    const env = makeAuthEnv(MOCK_STUDENT)
    env.AI.run = async () => ({ response: 'Извините, не могу ответить.' })

    const res = await app.request('/api/interview/evaluate', {
      method: 'POST',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Расскажи о себе',
        answer: 'Я студент третьего курса НУАД. ' .repeat(5),
        direction: 'IT',
      }),
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { score: number }
    expect(data.score).toBeGreaterThanOrEqual(0)
  })

  it('401: без токена', async () => {
    const env = makeEnv()
    const res = await app.request('/api/interview/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Q', answer: 'A', direction: 'IT' }),
    }, env)

    expect(res.status).toBe(401)
  })
})

describe('POST /api/interviews (сохранение результата)', () => {
  it('201: сохраняет результат собеседования', async () => {
    let calls = 0
    const env = makeEnv({
      dbFirst: async () => {
        calls++
        if (calls === 1) return { userId: MOCK_STUDENT.id }
        if (calls === 2) return MOCK_STUDENT
        // третий вызов — SELECT после INSERT
        return {
          id: 'ir-1', userId: 'user-001', direction: 'IT',
          score: 85, date: new Date().toISOString(), questionsCount: 5, feedback: 'Хорошо',
        }
      },
    })

    const res = await app.request('/api/interviews', {
      method: 'POST',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: 'IT',
        score: 85,
        questionsCount: 5,
        feedback: 'Хорошо справился',
      }),
    }, env)

    expect(res.status).toBe(201)
    const data = await res.json() as { interview: { score: number } }
    expect(data.interview.score).toBe(85)
  })

  it('400: score вне диапазона 0-100', async () => {
    const env = makeAuthEnv(MOCK_STUDENT)

    const res = await app.request('/api/interviews', {
      method: 'POST',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 150 }),
    }, env)

    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT STATS
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/student/stats', () => {
  it('200: возвращает статистику студента', async () => {
    const env = makeAuthEnv(MOCK_STUDENT)
    env.DB.all = async () => ({
      results: [
        { id: 's1', status: 'evaluated', score: 90 },
        { id: 's2', status: 'in_progress' },
      ],
    })

    const res = await app.request('/api/student/stats', {
      headers: { Authorization: 'Bearer token' },
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as {
      tasksCompleted: number
      tasksInProgress: number
      avgScore: number
    }
    expect(data).toHaveProperty('tasksCompleted')
    expect(data).toHaveProperty('avgScore')
    expect(data).toHaveProperty('interviewsCount')
  })

  it('403: компания не может смотреть student stats', async () => {
    const env = makeAuthEnv(MOCK_COMPANY)
    const res = await app.request('/api/student/stats', {
      headers: { Authorization: 'Bearer token' },
    }, env)

    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/company/candidates', () => {
  it('200: компания видит кандидатов', async () => {
    const env = makeAuthEnv(MOCK_COMPANY)
    env.DB.all = async () => ({
      results: [
        { id: 'u1', name: 'Студент А', avgScore: 88, completedTasks: 3 },
      ],
    })

    const res = await app.request('/api/company/candidates', {
      headers: { Authorization: 'Bearer token' },
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { candidates: unknown[]; total: number }
    expect(data.total).toBe(1)
  })

  it('403: студент не видит кандидатов', async () => {
    const env = makeAuthEnv(MOCK_STUDENT)
    const res = await app.request('/api/company/candidates', {
      headers: { Authorization: 'Bearer token' },
    }, env)

    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/users/list', () => {
  it('200: админ видит всех пользователей', async () => {
    const env = makeAuthEnv(MOCK_ADMIN)
    env.DB.all = async () => ({ results: [MOCK_STUDENT, MOCK_COMPANY] })

    const res = await app.request('/api/users/list', {
      headers: { Authorization: 'Bearer token' },
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { users: unknown[]; total: number }
    expect(data.total).toBe(2)
  })

  it('403: студент не имеет доступа', async () => {
    const env = makeAuthEnv(MOCK_STUDENT)
    const res = await app.request('/api/users/list', {
      headers: { Authorization: 'Bearer token' },
    }, env)

    expect(res.status).toBe(403)
  })
})

describe('GET /api/users/stats', () => {
  it('200: админ видит статистику платформы', async () => {
    const env = makeAuthEnv(MOCK_ADMIN)
    env.DB.first = async () => ({ n: 42 })

    const res = await app.request('/api/users/stats', {
      headers: { Authorization: 'Bearer token' },
    }, env)

    expect(res.status).toBe(200)
    const data = await res.json() as {
      totalStudents: number
      totalCompanies: number
    }
    expect(data).toHaveProperty('totalStudents')
    expect(data).toHaveProperty('totalCompanies')
  })

  it('403: компания не имеет доступа', async () => {
    const env = makeAuthEnv(MOCK_COMPANY)
    const res = await app.request('/api/users/stats', {
      headers: { Authorization: 'Bearer token' },
    }, env)

    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// API DOCS & SECURITY
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/docs', () => {
  it('200: возвращает OpenAPI спецификацию', async () => {
    const env = makeEnv()
    const res = await app.request('/api/docs', {}, env)

    expect(res.status).toBe(200)
    const data = await res.json() as { openapi: string; info: { title: string } }
    expect(data.openapi).toBe('3.0.3')
    expect(data.info.title).toBe('UniWay API')
  })
})

describe('Security: passwordHash никогда не утекает', () => {
  it('login response не содержит passwordHash', async () => {
    const env = makeEnv({ dbFirst: async () => MOCK_STUDENT })

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@uniway.kz', password: 'correct_password' }),
    }, env)

    const body = await res.text()
    expect(body).not.toContain('passwordHash')
    expect(body).not.toContain(CORRECT_HASH)
  })

  it('/api/auth/me response не содержит passwordHash', async () => {
    const env = makeAuthEnv(MOCK_STUDENT)
    const res = await app.request('/api/auth/me', {
      headers: { Authorization: 'Bearer token' },
    }, env)

    const body = await res.text()
    expect(body).not.toContain('passwordHash')
  })
})
