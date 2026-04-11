import { useAppStore } from '@/store/useAppStore'

export function Toast() {
  const toast = useAppStore(s => s.toast)
  if (!toast) return null

  return (
    <div className="toast-wrap">
      <div className={`toast ${toast.type}`}>{toast.message}</div>
    </div>
  )
}
