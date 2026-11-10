import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/figma.css'
import './styles/desktop.css'
import './styles/mobile.css'
import './styles/dice.css'
import './styles/crop.css'
import './styles/calendar.css'
import './styles/tablemodals.css'
import './styles/maps.css'
import './styles/cyberpunk.css'
import App from './App'
import { initTheme } from './theme/applyTheme'

// Aplica o tema salvo antes do primeiro render, para não piscar no tema padrão.
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
