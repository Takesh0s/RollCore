import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/figma.css'
import App from './App'
import { initTheme } from './theme/applyTheme'

// Aplica o tema salvo antes do primeiro render, para não piscar no tema padrão.
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
