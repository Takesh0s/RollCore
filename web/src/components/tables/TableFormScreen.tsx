import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { IconPlus } from '@/components/ui/icons'
import { ImageCropModal, COVER_ASPECT, COVER_PREVIEWS } from '@/components/ui/ImageCropModal'
import { imageSrc, readImageFile } from '@/lib/image'
import { storage } from '@/lib/storage'

const SYSTEMS = ['D&D 5e', 'Tormenta20', 'Call of Cthulhu', 'Pathfinder 2e', 'Outro']
const MAX_COVER_BYTES = 2 * 1024 * 1024

/**
 * Criação de Mesa, no layout do Figma. Abaixo do formulário fica o atalho
 * para a Biblioteca de Mapas.
 */
export function TableFormScreen({ edit = false }: { edit?: boolean }) {
  const { navigate, createTable, updateTable, openTable, showToast, tableDetail } = useAppStore()
  const current = edit ? tableDetail?.table : undefined
  const systems = current && !SYSTEMS.includes(current.gameSystem) ? [...SYSTEMS, current.gameSystem] : SYSTEMS

  const [name,        setName]        = useState(current?.name ?? '')
  const [nameErr,     setNameErr]     = useState('')
  const [system,      setSystem]      = useState(current?.gameSystem ?? SYSTEMS[0])
  const [description, setDescription] = useState(current?.description ?? '')
  const [maxPlayers,  setMaxPlayers]  = useState(current?.maxPlayers ?? 5)
  const [cover,       setCover]       = useState<string | undefined>()
  const [removeCover, setRemoveCover] = useState(false)
  // o que aparece no quadro da capa: a nova, ou a que a mesa já tem
  const shownCover = cover ?? (removeCover || !current ? undefined
    : imageSrc(current.coverUrl) ?? storage.getTableCovers()[current.id])
  const [loading,     setLoading]     = useState(false)
  const [pendingCover, setPendingCover] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // sem a mesa carregada (ex.: página recarregada) não há o que editar
  useEffect(() => { if (edit && !current) navigate('mesas') }, [edit, current, navigate])
  if (edit && !current) return null

  async function pickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > MAX_COVER_BYTES) { showToast('A capa deve ter até 2 MB.', 'error'); return }
    setPendingCover(await readImageFile(file))
  }

  async function handleSave() {
    const trimmed = name.trim()
    if (trimmed.length < 3 || trimmed.length > 100) {
      setNameErr('O nome da campanha deve ter de 3 a 100 caracteres.')
      return
    }
    setNameErr('')
    setLoading(true)
    try {
      if (current) {
        const ok = await updateTable(current.id, { name: trimmed, gameSystem: system, description, maxPlayers, cover, removeCover })
        if (ok) { showToast('Mesa atualizada!', 'success'); navigate('mesa') }
        return
      }
      const created = await createTable({ name: trimmed, gameSystem: system, description, maxPlayers, cover })
      showToast('Mesa criada!', 'success')
      await openTable(created.table.id)
    } catch {
      /* a mensagem já foi mostrada pelo store (ex.: limite do plano) */
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="device">
      <AppHeader title={edit ? 'Editar mesa' : 'Criação de Mesa'} onBack={() => navigate(edit ? 'mesa' : 'dashboard')} />

      <div className="page-body">
        <div className="form-group">
          <label className="form-label" htmlFor="mesa-nome">Nome da campanha:</label>
          <input
            id="mesa-nome"
            className={`form-input${nameErr ? ' error' : ''}`}
            maxLength={100}
            value={name}
            onChange={e => { setName(e.target.value); setNameErr('') }}
          />
          {nameErr && <small className="error-msg">{nameErr}</small>}
        </div>

        <div className="form-inline">
          <label className="form-label" htmlFor="mesa-sistema">Sistema</label>
          <select id="mesa-sistema" className="form-input select-compact" value={system} onChange={e => setSystem(e.target.value)}>
            {systems.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="mesa-desc">Descrição da campanha (Opcional):</label>
          <textarea
            id="mesa-desc"
            className="form-input"
            rows={6}
            maxLength={2000}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="form-inline">
          <label className="form-label" htmlFor="mesa-jogadores">Número de jogadores</label>
          <select id="mesa-jogadores" className="form-input select-compact" value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="form-group">
          <span className="form-label">{shownCover ? 'Capa' : 'Adicionar Capa'} (Opcional)</span>
          <button
            type="button"
            className={`cover-drop${shownCover ? ' has-cover' : ''}`}
            style={shownCover ? { backgroundImage: `url("${shownCover}")` } : undefined}
            onClick={() => fileRef.current?.click()}
            aria-label="Escolher capa da mesa"
          >
            {!shownCover && <IconPlus />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickCover} />
          {pendingCover && (
            <ImageCropModal
              src={pendingCover} title="Recortar capa" aspect={COVER_ASPECT} previews={COVER_PREVIEWS} outWidth={960}
              onCancel={() => setPendingCover(null)}
              onConfirm={url => { setPendingCover(null); setCover(url); setRemoveCover(false) }}
            />
          )}
          {shownCover && (
            <button type="button" className="btn btn-outline btn-pill cover-remove" onClick={() => { setCover(undefined); setRemoveCover(true) }}>
              Remover capa
            </button>
          )}
          <small className="field-hint">A capa fica salva na mesa e aparece para todos os jogadores. Máx. 2 MB.</small>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? '…' : edit ? 'Salvar alterações' : 'Salvar'}
        </button>

        <h2 className="section-title">Mapas</h2>
        <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={() => navigate('mapas')}>
          Adicionar mapa
        </button>
      </div>
    </div>
  )
}
