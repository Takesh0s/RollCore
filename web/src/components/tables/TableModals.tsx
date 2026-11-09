import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '@/store/useAppStore'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { imageSrc } from '@/lib/image'
import type { TableMember, TablePreview, TableRole, TableSummary } from '@/types'

const ROLE_LABEL: Record<TableRole, string> = { MASTER: 'Mestre', MODERATOR: 'Moderador', PLAYER: 'Jogador' }

/** Casca comum das janelas de mesa (Figma 25.x): título com ×, texto e botões. */
export function Shell({ title, onClose, children, label }: { title: string; onClose: () => void; children: ReactNode; label?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={label ?? title}
         onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="tm-modal">
        <div className="tm-head">
          <h2>{title}</h2>
          <button type="button" className="tm-close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
)

/** Excluir mesa: só libera o botão depois de digitar o nome da mesa. */
export function DeleteTableModal({ table, onClose }: { table: TableSummary; onClose: () => void }) {
  const deleteTable = useAppStore(s => s.deleteTable)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const ok = typed.trim() === table.name.trim()
  const others = Math.max(0, table.playerCount - 1)

  async function run() {
    setBusy(true)
    const done = await deleteTable(table.id)
    if (!done) setBusy(false)
  }
  return (
    <Shell title="Excluir mesa" onClose={onClose}>
      <p className="tm-text">
        {others > 0 ? `${others} ${others === 1 ? 'jogador perde' : 'jogadores perdem'} o acesso. ` : ''}
        Mapas, notas e histórico das sessões serão apagados. Para confirmar, digite o nome da mesa.
      </p>
      <label className="tm-label" htmlFor="del-table-name">Nome da mesa</label>
      <input id="del-table-name" className="form-input" value={typed} autoComplete="off" onChange={e => setTyped(e.target.value)} placeholder={table.name} />
      <div className="tm-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn tm-danger" disabled={!ok || busy} onClick={run}><TrashIcon /> Excluir mesa</button>
      </div>
    </Shell>
  )
}

/** Sair da mesa (o mestre não pode sair: ele exclui a mesa). */
export function LeaveTableModal({ table, onClose }: { table: TableSummary; onClose: () => void }) {
  const leaveTable = useAppStore(s => s.leaveTable)
  const [busy, setBusy] = useState(false)
  async function run() {
    setBusy(true)
    if (!(await leaveTable(table.id))) setBusy(false)
  }
  return (
    <Shell title="Sair da mesa" onClose={onClose}>
      <p className="tm-text">Você deixa de ver {table.name}. Para voltar, vai precisar de um novo convite.</p>
      <div className="tm-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn tm-danger" disabled={busy} onClick={run}>Sair da mesa</button>
      </div>
    </Shell>
  )
}

/** Remover jogador da mesa (mestre ou moderador). */
export function RemoveMemberModal({ tableId, member, onClose }: { tableId: string; member: TableMember; onClose: () => void }) {
  const removeMember = useAppStore(s => s.removeMember)
  const [busy, setBusy] = useState(false)
  const name = member.displayName || member.username
  async function run() {
    setBusy(true)
    if (await removeMember(tableId, member.userId)) onClose()
    else setBusy(false)
  }
  return (
    <Shell title={`Remover ${name} da mesa`} onClose={onClose}>
      <p className="tm-text">{name} perde o acesso à mesa, mas pode voltar com um novo convite.</p>
      <div className="tm-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn tm-danger" disabled={busy} onClick={run}>Remover da mesa</button>
      </div>
    </Shell>
  )
}

/** Entrar em uma mesa com código de convite: mostra a mesa antes de confirmar. */
export function JoinTableModal({ onClose }: { onClose: () => void }) {
  const { previewTable, joinTable } = useAppStore()
  const [code, setCode] = useState('')
  const [preview, setPreview] = useState<TablePreview | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setPreview(null); setError('')
    const c = code.trim()
    if (c.length < 4) return
    let live = true
    const id = setTimeout(async () => {
      const p = await previewTable(c)
      if (!live) return
      if (p) setPreview(p); else setError('Código de convite não encontrado.')
    }, 350)
    return () => { live = false; clearTimeout(id) }
  }, [code, previewTable])

  async function run() {
    setBusy(true)
    if (await joinTable(code)) onClose()
    else setBusy(false)
  }

  return (
    <Shell title="Entrar em uma mesa" onClose={onClose}>
      <p className="tm-text">Digite o código de convite que o mestre compartilhou.</p>
      <label className="tm-label" htmlFor="join-code">Código de convite</label>
      <input id="join-code" className={`form-input tm-code${error ? ' error' : ''}`} value={code} maxLength={10} autoFocus autoComplete="off"
             onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="K7P2QX" />
      {error && <small className="field-error">{error}</small>}
      {preview && (
        <div className="tm-preview">
          <strong>{preview.name}</strong>
          <span>{preview.gameSystem} · Mestre {preview.ownerUsername} · {preview.playerCount}/{preview.maxPlayers} jogadores</span>
          {preview.description && <span>{preview.description}</span>}
          {preview.full && <em>Esta mesa já está cheia.</em>}
        </div>
      )}
      <div className="tm-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={!preview || preview.full || busy} onClick={run}>Entrar na mesa</button>
      </div>
    </Shell>
  )
}

/** Perfil na mesa (Figma 04.5): nome e avatar só valem nesta mesa; silenciar é pessoal. */
export function MyTableProfileModal({ table, onClose }: { table: TableSummary; onClose: () => void }) {
  const { tableDetail, updateMyProfile, user } = useAppStore()
  const me = tableDetail?.me
  const [name, setName] = useState(me?.displayName ?? '')
  const [muted, setMuted] = useState(me?.muted ?? false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    if (await updateMyProfile(table.id, { displayName: name, muted, avatar })) onClose()
    else setBusy(false)
  }
  const shown = avatar ?? imageSrc(me?.avatarUrl) ?? null
  return (
    <Shell title="Perfil na mesa" onClose={onClose}>
      <div className="tm-profile-head">
        <AvatarUpload value={shown} initials={(name || user.username).charAt(0)} onChange={setAvatar} size={72} />
        <span className="tm-role-badge">{ROLE_LABEL[table.myRole]}</span>
      </div>
      <label className="tm-label" htmlFor="my-table-name">Nome de exibição (apenas para esta mesa)</label>
      <input id="my-table-name" className="form-input" value={name} maxLength={50} autoComplete="off"
             placeholder={user.username} onChange={e => setName(e.target.value)} />
      <label className="tm-switch">
        <span>Silenciar notificações desta mesa</span>
        <input type="checkbox" role="switch" checked={muted} onChange={e => setMuted(e.target.checked)} />
      </label>
      <div className="tm-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={run}>Salvar perfil</button>
      </div>
    </Shell>
  )
}

/** Ações sobre um membro (Figma 14.4): mudar cargo, passar o cargo de Mestre ou remover. */
export function MemberActionsModal({ tableId, member, canPromote, canTransfer, canRemove, onTransfer, onRemove, onClose }: {
  tableId: string; member: TableMember; canPromote: boolean; canTransfer: boolean; canRemove: boolean
  onTransfer: () => void; onRemove: () => void; onClose: () => void
}) {
  const changeRole = useAppStore(s => s.changeRole)
  const [busy, setBusy] = useState(false)
  const name = member.displayName || member.username
  const next = member.role === 'MODERATOR' ? 'PLAYER' : 'MODERATOR'

  async function setRole() {
    setBusy(true)
    if (await changeRole(tableId, member.userId, next)) onClose()
    else setBusy(false)
  }
  return (
    <Shell title={name} onClose={onClose}>
      <p className="tm-text">{ROLE_LABEL[member.role]} · @{member.username}</p>
      <div className="tm-actions tm-stack">
        {canPromote && (
          <button type="button" className="btn btn-outline" disabled={busy} onClick={setRole}>
            {next === 'MODERATOR' ? 'Promover a moderador' : 'Tornar jogador'}
          </button>
        )}
        {canTransfer && <button type="button" className="btn btn-outline" onClick={onTransfer}>Passar cargo de Mestre</button>}
        {canRemove && <button type="button" className="btn tm-danger" onClick={onRemove}>Remover da mesa</button>}
      </div>
    </Shell>
  )
}

/** Confirmação de transferência do cargo de Mestre (Figma 14.7/14.8). */
export function TransferHostModal({ tableId, member, onClose }: { tableId: string; member: TableMember; onClose: () => void }) {
  const transferHost = useAppStore(s => s.transferHost)
  const [busy, setBusy] = useState(false)
  const name = member.displayName || member.username
  async function run() {
    setBusy(true)
    if (await transferHost(tableId, member.userId)) onClose()
    else setBusy(false)
  }
  return (
    <Shell title="Passar cargo de Mestre" onClose={onClose}>
      <p className="tm-text">
        {name} passa a ser o Mestre desta mesa e você vira moderador. Só quem criou a mesa pode transferi-la.
      </p>
      <div className="tm-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={run}>Confirmar transferência</button>
      </div>
    </Shell>
  )
}

/** Limite de mesas do plano grátis (Figma 14.9). */
export function TableLimitModal({ message, onClose }: { message: string; onClose: () => void }) {
  const navigate = useAppStore(s => s.navigate)
  return (
    <Shell title="Limite de mesas" onClose={onClose}>
      <p className="tm-text">{message}</p>
      <div className="tm-actions">
        <button type="button" className="btn btn-primary" onClick={() => { onClose(); navigate('mesas') }}>Gerenciar minhas mesas</button>
        <button type="button" className="btn btn-outline" onClick={onClose}>Fechar</button>
      </div>
    </Shell>
  )
}
