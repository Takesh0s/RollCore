import { useState, type InputHTMLAttributes } from 'react'

/** Campo de senha com botão de olho para mostrar/ocultar (Figma). Aceita as props de um <input>. */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false)
  return (
    <div className="pw-wrap">
      <input {...props} type={show ? 'text' : 'password'} />
      <button
        type="button"
        className="pw-eye"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={show}
        tabIndex={-1}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
          <circle cx="12" cy="12" r="3" />
          {show && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  )
}
