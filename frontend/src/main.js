import { createApp } from 'vue'
import App from './App.vue'
import LogoIcon from '@/assets/Nav Bar/Logo-icon.png'

// Configure feature flags
window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false

const ensureFavicon = (iconUrl) => {
  if (typeof document === 'undefined') return
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = iconUrl
}

ensureFavicon(LogoIcon)

createApp(App).mount('#app')
