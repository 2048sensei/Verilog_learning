import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ProgressProvider } from './context/ProgressContext'
import App from './App'
import './index.css'

// HashRouter：纯静态托管（GitHub Pages）下刷新/直达任意路由都不会 404
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </HashRouter>
  </StrictMode>,
)
