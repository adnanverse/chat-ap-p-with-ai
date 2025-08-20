import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LoginFrom from './components/auth/LoginFrom'
import SignUpForm from './components/auth/SignUpForm'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

createRoot(document.getElementById('root')).render(
<>
<BrowserRouter>

<App/>
</BrowserRouter>

</>
)
