import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      // Если мы внутри Докера, ставим undefined (отключаем прокси), 
      // во всех остальных случаях (например, npm run dev на ноуте) — оставляем стандартный адаптер.
      adapter: process.env.IS_DOCKER === 'true' ? undefined : adapter,
      entry: 'src/index.tsx'
    })
  ]
})