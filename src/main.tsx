import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // <--- 檢查這行有沒有寫對路徑！

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)