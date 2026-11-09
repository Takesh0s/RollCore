import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { useDesktop } from '@/hooks/useDesktop'
import { calcMod, formatMod, profBonus } from '@/lib/engine'
import { formatTimestamp } from '@/lib/dice'
import { TableCover } from '@/components/tables/TableCover'

/**
 * Tela inicial, no layout do Figma: faixa de Mesas e os atalhos grandes
 * (Rolar Dados, Fichas, Comunidade, GM Tools e Anotações).
 */
/** Título de seção com linhas dos dois lados, como nos blocos do dashboard do Figma. */
function SectionTitle({ children }: { children: string }) {
  return <h3 className="dash-sec-title"><span>{children}</span></h3>
}

/** Cartão vazio dos blocos que ainda dependem de recursos futuros (chat, notas, rascunhos). */
function SoonCard({ text }: { text: string }) {
  return (
    <div className="dash-panel dash-panel-empty">
      <strong>Em breve</strong>
      <span>{text}</span>
    </div>
  )
}

/**
 * Dashboard do computador (Figma PC): saudação e blocos de resumo.
 * Usa só dados que o app já tem (mesas, fichas e rolagens); o resto aparece como "Em breve".
 */
function DesktopDashboard() {
  const { navigate, tables, loadTables, openTable, characters, selectCharacter, history, user } = useAppStore()
  useEffect(() => { loadTables() }, [loadTables])

  const next = tables[0] ?? null
  const char = characters[characters.length - 1] ?? null
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const tablesText = tables.length === 0 ? 'nenhuma mesa ainda' : tables.length === 1 ? '1 mesa' : `${tables.length} mesas`

  return (
    <div className="device">
      <AppHeader title="Dashboard" />
      <div className="page-body dash-desk">
        <h2 className="dash-hello">Olá, {user.username || 'aventureiro'}</h2>
        <p className="dash-hello-sub">{today.charAt(0).toUpperCase() + today.slice(1)} · {tablesText}</p>

        <div className="dash-cols">
          <section>
            <SectionTitle>Próxima sessão</SectionTitle>
            {next ? (
              <div className="dash-panel dash-next">
                <TableCover table={next} className="dash-next-cover" />
                <div className="dash-next-info">
                  <strong>{next.name}</strong>
                  <span>{next.gameSystem} · {next.myRole === 'MASTER' ? 'Você é o mestre' : `Mestre ${next.ownerUsername}`}</span>
                  <button className="btn btn-primary btn-pill" onClick={() => openTable(next.id)}>Entrar</button>
                </div>
              </div>
            ) : (
              <div className="dash-panel dash-panel-empty">
                <strong>Nenhuma mesa por aqui</strong>
                <button className="btn btn-primary btn-pill" onClick={() => navigate('nova-mesa')}>Criar mesa</button>
              </div>
            )}
          </section>

          <section>
            <SectionTitle>Personagem recente</SectionTitle>
            {char ? (
              <div className="dash-panel dash-char">
                <div className="dash-char-head">
                  {char.avatar_url
                    ? <img className="dash-char-avatar" src={char.avatar_url} alt="" />
                    : <span className="dash-char-avatar" aria-hidden="true">{char.name.charAt(0).toUpperCase()}</span>}
                  <div>
                    <strong>{char.name}</strong>
                    <span>{char.class} · {char.race} · Nível {char.level}</span>
                  </div>
                </div>
                <div className="dash-char-stats">
                  Iniciativa {formatMod(calcMod(char.attributes.DEX))} · Prof {formatMod(profBonus(char.level))} · CA {char.ac}
                </div>
                <button className="btn btn-primary btn-pill" onClick={() => { selectCharacter(char.id); navigate('ficha') }}>
                  Abrir ficha
                </button>
              </div>
            ) : (
              <div className="dash-panel dash-panel-empty">
                <strong>Nenhuma ficha ainda</strong>
                <button className="btn btn-primary btn-pill" onClick={() => navigate('novo-personagem')}>Criar ficha</button>
              </div>
            )}
          </section>

          <section>
            <SectionTitle>Situação na mesa</SectionTitle>
            {next ? (
              <div className="dash-panel dash-status">
                <strong>{next.name}</strong>
                <span className="dash-status-badge">{next.myRole === 'MASTER' ? 'MESTRE' : next.myRole === 'MODERATOR' ? 'MODERADOR' : 'JOGADOR'}</span>
                <span>{next.playerCount} de {next.maxPlayers} jogadores</span>
              </div>
            ) : (
              <SoonCard text="Entre em uma mesa para ver a situação dela aqui." />
            )}
          </section>

          <section>
            <SectionTitle>Mensagens recentes</SectionTitle>
            <SoonCard text="O chat das mesas chega junto com a comunidade." />
          </section>
          <section>
            <SectionTitle>Criações inacabadas</SectionTitle>
            <SoonCard text="Fichas, mapas e NPCs em andamento vão aparecer aqui." />
          </section>
          <section>
            <SectionTitle>Notas recentes</SectionTitle>
            <SoonCard text="As anotações chegam com a tela de Anotações." />
          </section>
        </div>

        <div className="dash-grow" />
        <SectionTitle>Rolagens recentes</SectionTitle>
        <div className="dash-chips">
          <span className="on">Todas as mesas</span>
          {tables.slice(0, 3).map(t => <span key={t.id}>{t.name}</span>)}
        </div>
        {history.length === 0 ? (
          <div className="dash-panel dash-panel-empty">
            <strong>Nenhuma rolagem ainda</strong>
            <button className="btn btn-primary btn-pill" onClick={() => navigate('dados')}>Rolar dados</button>
          </div>
        ) : (
          <div className="dash-rolls">
            {history.slice(0, 4).map((h, i) => (
              <div key={i} className="dash-roll">
                <div>
                  <strong>{h.formula ?? h.skill ?? `d${h.result.sides}`}</strong>
                  <span>{formatTimestamp(h.timestamp)}</span>
                </div>
                <b>{h.result.total}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function DashboardScreen() {
  return useDesktop() ? <DesktopDashboard /> : <MobileDashboard />
}

function MobileDashboard() {
  const { navigate, tables, loadTables, openTable, history, user } = useAppStore()
  useEffect(() => { loadTables() }, [loadTables])

  const next = tables[0] ?? null
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const [filter, setFilter] = useState<string | null>(null)
  const rolls = history.filter(h => !filter || h.tableId === filter).slice(0, 3)

  return (
    <div className="device">
      <AppHeader title="Dashboard" />
      <div className="page-body md-dash">
        <h2 className="md-hello">Olá, {user.username || 'aventureiro'}</h2>
        <p className="md-date">{today.charAt(0).toUpperCase() + today.slice(1)}</p>

        <SectionTitle>Próxima sessão</SectionTitle>
        {next ? (
          <div className="md-card md-next">
            <TableCover table={next} className="md-next-cover" />
            <div className="md-next-info">
              <strong>{next.name}</strong>
              <span>{next.gameSystem} · {next.myRole === 'MASTER' ? 'você é o mestre' : `Mestre ${next.ownerUsername}`}</span>
            </div>
            <button className="md-enter" onClick={() => openTable(next.id)}>Entrar</button>
          </div>
        ) : (
          <div className="md-card md-empty">
            <strong>Nenhuma mesa por aqui</strong>
            <button className="md-enter" onClick={() => navigate('nova-mesa')}>Criar mesa</button>
          </div>
        )}

        <SectionTitle>Mensagens recentes</SectionTitle>
        <div className="md-card md-empty"><strong>Em breve</strong><span>O chat das mesas chega com a Comunidade.</span></div>

        <SectionTitle>Criações inacabadas</SectionTitle>
        <div className="md-card md-empty"><strong>Em breve</strong><span>Fichas, mapas e NPCs em andamento aparecem aqui.</span></div>

        <SectionTitle>Notas recentes</SectionTitle>
        <div className="md-card md-empty"><strong>Em breve</strong><span>As anotações chegam com a tela de Anotações.</span></div>

        <SectionTitle>Situação na mesa</SectionTitle>
        {next ? (
          <div className="md-card md-status">
            <div className="md-status-head">
              <strong>{next.name}</strong>
              <em>{next.myRole === 'MASTER' ? 'MESTRE' : next.myRole === 'MODERATOR' ? 'MODERADOR' : 'JOGADOR'}</em>
            </div>
            <span>{next.playerCount} de {next.maxPlayers} jogadores</span>
          </div>
        ) : (
          <div className="md-card md-empty"><strong>Sem mesa ativa</strong><span>Entre em uma mesa para ver a situação dela aqui.</span></div>
        )}

        <SectionTitle>Rolagens</SectionTitle>
        <div className="md-chips">
          <button className={!filter ? 'on' : ''} onClick={() => setFilter(null)}>Todas</button>
          {tables.slice(0, 2).map(t => (
            <button key={t.id} className={filter === t.id ? 'on' : ''} onClick={() => setFilter(t.id)}>{t.name}</button>
          ))}
        </div>
        {rolls.length === 0 ? (
          <div className="md-card md-empty">
            <strong>Nenhuma rolagem ainda</strong>
            <button className="md-enter" onClick={() => navigate('dados')}>Rolar dados</button>
          </div>
        ) : rolls.map((h, i) => (
          <div key={i} className="md-card md-roll">
            <div>
              <strong>{h.formula ?? h.skill ?? `d${h.result.sides}`}</strong>
              <span>{formatTimestamp(h.timestamp)}{h.tableName ? ` · ${h.tableName}` : ''}</span>
            </div>
            <b>{h.result.total}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
