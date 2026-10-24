import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// mode "single": one self-contained HTML (for sharing as a standalone page).
// The external A&I menu script is only injected in the regular build.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    ...(mode === 'single' ? [viteSingleFile()] : []),
    {
      // the standalone page has no manifest / service worker next to it
      name: 'strip-pwa-links',
      transformIndexHtml: (html) =>
        mode === 'single' ? html.replace(/\s*<link rel="(manifest|icon)"[^>]*>/g, '') : html,
    },
    {
      name: 'ai-menu-script',
      transformIndexHtml: () =>
        mode === 'single'
          ? []
          : [{ tag: 'script', attrs: { src: 'https://appofapp-gh.vercel.app/ai-menu.js', defer: true }, injectTo: 'head' }],
    },
  ],
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
}))
