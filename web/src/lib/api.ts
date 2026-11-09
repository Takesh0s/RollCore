/**
 * Axios HTTP client for the RollCore REST API.
 *
 * Responsibilities:
 *  - Sets the base URL from VITE_API_URL (falls back to localhost:8080 in dev)
 *  - Injects `Authorization: Bearer <accessToken>` on every request
 *  - On 401, attempts one silent token refresh via POST /auth/refresh
 *    (UC-01 S01 / UC-02 E02 / UC-03 E02) then retries the original request
 *  - On second 401 (refresh also expired), clears tokens and reloads to login
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY   = 'rollcore_access_token'
const REFRESH_KEY = 'rollcore_refresh_token'

export const tokenStorage = {
  getAccess():  string | null { return localStorage.getItem(TOKEN_KEY) },
  getRefresh(): string | null { return localStorage.getItem(REFRESH_KEY) },

  set(access: string, refresh: string): void {
    localStorage.setItem(TOKEN_KEY,   access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// ── Axios instance ────────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// ── Request interceptor — inject access token ─────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess()
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — silent token refresh on 401 ───────────────────────

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject:  (reason?: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else       resolve(token)
  })
  failedQueue = []
}

/** What the failed request was doing, in words for the "Algo deu errado" window. */
function describeRequest(method?: string, url?: string): string {
  const u = url ?? ''
  const write = method && method.toLowerCase() !== 'get'
  if (/^\/characters/.test(u)) return write ? 'salvar a ficha' : 'carregar as fichas'
  if (/^\/tables\/[^/]+\/events|^\/events/.test(u)) return write ? 'salvar o evento' : 'carregar o calendário'
  if (/^\/tables/.test(u)) return write ? 'salvar a mesa' : 'carregar as mesas'
  if (/^\/images/.test(u)) return write ? 'enviar a imagem' : 'carregar a imagem'
  if (/^\/dice/.test(u)) return 'rolar os dados'
  return 'concluir a ação'
}

/** Tells the app (App.tsx listens) that the network or the server failed, so it can open Figma 25.14 / 25.15. */
function notifyNetwork(detail: { kind: 'offline' } | { kind: 'error'; status: number; what: string }) {
  window.dispatchEvent(new CustomEvent('rollcore:net', { detail }))
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (!error.response && error.code !== 'ERR_CANCELED') {
      notifyNetwork({ kind: 'offline' })
    } else if (error.response?.status >= 500) {
      notifyNetwork({ kind: 'error', status: error.response.status, what: describeRequest(originalRequest?.method, originalRequest?.url) })
    }

    // Only attempt refresh on 401, and only once per request (_retry guard)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Queue concurrent requests that arrived while refresh is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.headers['Authorization'] = `Bearer ${token}`
        return api(originalRequest)
      }).catch(err => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = tokenStorage.getRefresh()

    if (!refreshToken) {
      // No refresh token → force logout
      tokenStorage.clear()
      window.location.href = '/'
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/auth/refresh`,
        { refreshToken },
      )

      tokenStorage.set(data.accessToken, data.refreshToken)
      processQueue(null, data.accessToken)

      originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      tokenStorage.clear()
      window.location.href = '/'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api