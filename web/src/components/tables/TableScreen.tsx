import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { storage } from '@/lib/storage'
import type { TableMember, TableRole } from '@/types'
import { DeleteTableModal, LeaveTableModal, RemoveMemberModal } from './TableModals'

const ROLE_LABEL: Record<TableRole, string> = { MASTER: 'Mestre', MODERATOR: 'Moderador', PLAYER: 'Jogador' }

/**
 * Visão geral da mesa: capa, dados da campanha, código de convite e membros.
 * É a base onde a sessão ao vivo (rolagens e presença) vai entrar.
 */
export function TableScreen() {
  const { tableDetail, navigate, showToast, regenerateInvite, user } = useAppStore()
  const [dialog, setDialog] = useState<'delete' | 'leave' | null>(null)
  const [removing, setRemoving] = useState<TableMember | null>(null)

  if (!tableDetail) {
    return (
      <div className="device">
        <AppHeader title="Mesa" onBack={() => navigate('dashboard')} />
        <div className="page-body"><p className="empty-state" style={{ textAlign: 'center' }}>Carregando mesa…</p></div>
      </div>
    )
  }

  const { table, inviteCode, members } = tableDetail
  const cover = table.coverUrl ?? storage.getTableCovers()[table.id] ?? null

  async function copyInvite() {
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      showToast('Código copiado!', 'success')
    } catch {
      showToast(`Código: ${inviteCode}`)
    }
  }

  return (
    <div className="device">
      <AppHeader title={table.name} onBack={() => navigate('dashboard')} />

      <div className="page-body">
        {cover && <div className="table-cover" style={{ backgroundImage: `url("${cover}")` }} role="img" aria-label={`Capa de ${table.name}`} />}

        <div className="profile-row"><span>Sistema</span><strong>{table.gameSystem}</strong></div>
        <div className="profile-row"><span>Seu papel</span><strong>{ROLE_LABEL[table.myRole]}</strong></div>
        <div className="profile-row"><span>Mestre</span><strong>{table.ownerUsername}</strong></div>
        <div className="profile-row"><span>Jogadores</span><strong>{table.playerCount}/{table.maxPlayers}</strong></div>

        {table.description && (
          <>
            <h2 className="section-title">Descrição</h2>
            <p className="table-description">{table.description}</p>
          </>
        )}

        {inviteCode && (
          <>
            <h2 className="section-title">Convite</h2>
            <div className="invite-row">
              <div className="invite-tiles" aria-label={`Código ${inviteCode}`}>
                {inviteCode.split('').map((ch, i) => <span key={i} className="invite-tile" aria-hidden="true">{ch}</span>)}
              </div>
            </div>
            <div className="tm-inline-actions">
              <button className="btn btn-primary btn-pill" onClick={copyInvite}>Copiar código</button>
              {table.myRole === 'MASTER' && (
                <button className="btn btn-outline btn-pill" onClick={() => regenerateInvite(table.id)}>Gerar novo código</button>
              )}
            </div>
          </>
        )}

        <h2 className="section-title">Membros</h2>
        {members.map(m => {
          const canRemove = (table.myRole === 'MASTER' || table.myRole === 'MODERATOR') && m.role !== 'MASTER' && m.username !== user.username
          return (
            <div className="profile-row" key={m.userId}>
              <span>{m.displayName || m.username}</span>
              <span className="member-end">
                <small>{ROLE_LABEL[m.role]}</small>
                {canRemove && (
                  <button type="button" className="member-remove" onClick={() => setRemoving(m)}
                          aria-label={`Remover ${m.displayName || m.username} da mesa`}>×</button>
                )}
              </span>
            </div>
          )
        })}

        <div className="home-mesas" style={{ marginTop: 18 }}>
          <strong>Sessão ao vivo</strong>
          <span>As rolagens em tempo real e quem está online chegam em breve no web.</span>
        </div>

        <div className="table-danger-zone">
          {table.myRole === 'MASTER'
            ? <button type="button" className="btn btn-danger btn-auto" onClick={() => setDialog('delete')}>Excluir mesa</button>
            : <button type="button" className="btn btn-danger btn-auto" onClick={() => setDialog('leave')}>Sair da mesa</button>}
        </div>
      </div>
      {dialog === 'delete' && <DeleteTableModal table={table} onClose={() => setDialog(null)} />}
      {dialog === 'leave' && <LeaveTableModal table={table} onClose={() => setDialog(null)} />}
      {removing && <RemoveMemberModal tableId={table.id} member={removing} onClose={() => setRemoving(null)} />}
    </div>
  )
}
