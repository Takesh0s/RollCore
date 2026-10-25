import { useRef } from 'react'

interface AvatarUploadProps {
  /** Current image — base64 data URL or null */
  value:    string | null | undefined
  /** Initials to show when no image is set */
  initials: string
  /** Called with a base64 data URL when the user picks an image */
  onChange: (dataUrl: string) => void
  /** Optional size in px — defaults to 72 */
  size?: number
}

/**
 * Circular avatar with an overlay camera button.
 * Converts the selected file to a base64 data URL and calls onChange.
 * No server upload in Fase 1 — stored locally via storage.setUser / character field.
 */
export function AvatarUpload({ value, initials, onChange, size = 72 }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type and size (max 2 MB)
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) return

    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result
      if (typeof result === 'string') onChange(result)
    }
    reader.readAsDataURL(file)

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div
      className="avatar-upload-wrap"
      style={{ width: size, height: size }}
      onClick={() => inputRef.current?.click()}
      title="Clique para alterar a foto"
    >
      {value ? (
        <img
          src={value}
          alt="Avatar"
          className="avatar-img"
          style={{ width: size, height: size }}
        />
      ) : (
        <div className="avatar-initials" style={{ width: size, height: size, fontSize: size * 0.38 }}>
          {initials.toUpperCase()}
        </div>
      )}

      {/* Camera overlay */}
      <div className="avatar-overlay">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ width: size * 0.3, height: size * 0.3 }}>
          <path d="M2 7a2 2 0 0 1 2-2h1l1.5-2h7L15 5h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" />
          <circle cx="10" cy="11" r="3" />
        </svg>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}
