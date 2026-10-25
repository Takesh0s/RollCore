import { useEffect, useRef } from 'react'

/**
 * "Sign in with Google" button (Google Identity Services).
 *
 * Renders nothing unless VITE_GOOGLE_CLIENT_ID is set, so environments without
 * Google configured keep the plain e-mail/password form. The ID token returned by
 * Google is handed to `onCredential`, which exchanges it at POST /auth/google.
 */

const CLIENT_ID  = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const GSI_SRC    = 'https://accounts.google.com/gsi/client'

interface GoogleCredentialResponse { credential?: string }

interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string
      callback:  (response: GoogleCredentialResponse) => void
    }) => void
    renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
  }
}

declare global {
  interface Window { google?: { accounts: GoogleAccounts } }
}

let scriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src   = GSI_SRC
    script.async = true
    script.defer = true
    script.onload  = () => resolve()
    script.onerror = () => { scriptPromise = null; reject(new Error('Google script failed to load')) }
    document.head.appendChild(script)
  })
  return scriptPromise
}

interface Props {
  onCredential: (idToken: string) => void
}

export function GoogleSignInButton({ onCredential }: Props) {
  const holder = useRef<HTMLDivElement>(null)
  const handler = useRef(onCredential)
  handler.current = onCredential

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !holder.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback:  res => { if (res.credential) handler.current(res.credential) },
        })
        window.google.accounts.id.renderButton(holder.current, {
          theme: 'filled_black',
          size:  'large',
          shape: 'pill',
          text:  'continue_with',
          width: 280,
        })
      })
      .catch(() => { /* offline or blocked: the e-mail form still works */ })

    return () => { cancelled = true }
  }, [])

  if (!CLIENT_ID) return null

  return (
    <div className="google-signin">
      <span className="google-signin-divider">ou</span>
      <div ref={holder} className="google-signin-button" />
    </div>
  )
}
