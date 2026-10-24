import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(<App />)

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && import.meta.env.PROD && import.meta.env.MODE !== 'single') {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('service worker', e))
}
