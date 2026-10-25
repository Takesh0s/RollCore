import { useAppStore } from '@/store/useAppStore'

/** Global toast notification — rendered once at the app root via App.tsx. */
export function Toast() {
  const toast = useAppStore(s => s.toast)
  if (!toast) return null

  return (
    <div className="toast-wrap">
      <div className={`toast ${toast.type}`}>{toast.message}</div>
    </div>
  )
}
