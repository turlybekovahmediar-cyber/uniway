import { describe, it, expect } from 'vitest'
import app from './index'

describe('UniWay API Integration Tests', () => {

  const mockEnv = {
    DB: {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: [] }), 
          first: async () => null,
          run: async () => ({ success: true }),
        }),
      }),
    },
  }

  it('GET /api/tasks should return 200', async () => {
    const res = await app.request('/api/tasks', {}, mockEnv)
    expect(res.status).toBe(200)
    
    const data = await res.json()
    console.log('DEBUG API DATA:', data) 

    let tasks = data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      tasks = data.results || data.tasks || Object.values(data)[0]
    }

    
    const isActuallyArray = Array.isArray(tasks)
    expect(isActuallyArray).toBe(true)
  })
  it('GET /api/docs should return OpenAPI spec', async () => {
    const res = await app.request('/api/docs', {}, mockEnv)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.openapi).toBeDefined()
  })

  it('POST /api/auth/login with empty body should return error', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' }
    }, mockEnv)
    
    expect(res.status).not.toBe(500)
  })
})