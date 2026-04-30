import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'csp',
      transformIndexHtml: {
        order: 'post',
        handler(html, ctx) {
          if (ctx.server) return

          const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self' blob: https://huggingface.co https://raw.githubusercontent.com",
            "worker-src 'self' blob:",
            "form-action 'self'",
            "base-uri 'self'",
          ].join('; ')

          return html.replace(
            '</head>',
            `  <meta http-equiv="Content-Security-Policy" content="${csp}">\n  </head>`,
          )
        },
      },
    },
  ],
  base: mode === 'production' ? '/SocratISA/' : '/',
}))
