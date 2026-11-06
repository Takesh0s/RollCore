import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { DiceLogo } from '@/components/ui/DiceLogo'
import { TableBanner } from '@/components/tables/TableBanner'
import { useDesktop } from '@/hooks/useDesktop'
import { calcMod, formatMod, profBonus } from '@/lib/engine'
import { formatTimestamp } from '@/lib/dice'
import { IconScroll, IconPlus, IconSheets, IconCommunity, IconWand, IconNotes } from '@/components/ui/icons'

/** Atalhos que já existem no Figma mas ainda não têm tela no web. */
const COMING_SOON = [
  { label: 'Comunidade', icon: <IconCommunity className="dash-card-icon" /> },
  { label: 'GM Tools',   icon: <IconWand className="dash-card-icon" /> },
  { label: 'Anotações',  icon: <IconNotes className="dash-card-icon" /> },
]

/**
 * Tela inicial, no layout do Figma: faixa de Mesas e os atalhos grandes
 * (Rolar Dados, Fichas, Comunidade, GM Tools e Anotações).
 */
/** Título de seção com linhas dos dois lados, como nos blocos do dashboard do Figma. */
function SectionTitle({ children }: { children: string }) {
  return <h3 className="dash-sec-title"><span>{children}</span></h3>
}

/** Exemplos exibidos enquanto chat, rascunhos e notas não existem no app (visual igual ao Figma). */
const DEMO_MESSAGES = [
  { who: 'Susie (Mestre)', text: 'Role iniciativa antes de sexta!', when: '10 min', unread: true },
  { who: 'Mesa · Noites de Sangue', text: 'Noelle: chego 10 min atrasada', when: '1 h', unread: true },
  { who: 'Ralsei', text: 'Mandei o mapa novo no chat', when: 'ontem', unread: false },
  { who: 'Kris', text: 'Posso trocar de classe?', when: '2 d', unread: false },
]
const DEMO_DRAFTS = [
  { name: 'Thorin Punho de Ferro', kind: 'Ficha', pct: 60 },
  { name: 'Em busca dos esquecidos', kind: 'Mapa', pct: 30 },
  { name: 'Mercador Barnabé', kind: 'NPC', pct: 45 },
  { name: 'Reinos de Cinza', kind: 'Mesa', pct: 80 },
]
const DEMO_NOTES = [
  { title: 'Pistas do caso', text: 'O mercador mentiu sobre…', when: 'ontem' },
  { title: 'Regras da casa', text: 'Crítico dobra os dados…', when: '2 d' },
  { title: 'Plano da sessão 12', text: 'Cripta, andar 2…', when: '3 d' },
  { title: 'Lore de Valdoria', text: 'Reino fundado em…', when: '5 d' },
]

function DemoMessages() {
  return (
    <div className="dash-panel dash-list">
      {DEMO_MESSAGES.map(m => (
        <div key={m.who} className="dash-item">
          <span className="dash-item-ico" aria-hidden="true" />
          <div><strong>{m.who}</strong><span>{m.text}</span></div>
          <em>{m.when}{m.unread && <i className="dash-dot" />}</em>
        </div>
      ))}
    </div>
  )
}
function DemoDrafts() {
  return (
    <div className="dash-panel dash-list">
      {DEMO_DRAFTS.map(d => (
        <div key={d.name} className="dash-item dash-draft">
          <div>
            <strong>{d.name}</strong>
            <span>{d.kind} · {d.pct}% concluída</span>
            <div className="dash-bar"><div style={{ width: `${d.pct}%` }} /></div>
          </div>
          <em className="dash-cont">Continuar ›</em>
        </div>
      ))}
    </div>
  )
}
function DemoNotes() {
  return (
    <div className="dash-panel dash-list">
      {DEMO_NOTES.map(n => (
        <div key={n.title} className="dash-item">
          <span className="dash-item-ico" aria-hidden="true"><IconNotes /></span>
          <div><strong>{n.title}</strong><span>{n.text}</span></div>
          <em>{n.when}</em>
        </div>
      ))}
    </div>
  )
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
                <div className="dash-next-cover"><IconCommunity /></div>
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
            <DemoMessages />
          </section>
          <section>
            <SectionTitle>Criações inacabadas</SectionTitle>
            <DemoDrafts />
          </section>
          <section>
            <SectionTitle>Notas recentes</SectionTitle>
            <DemoNotes />
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
  const { navigate, tables, loadTables, openTable, characters, history, showToast } = useAppStore()
  const lastRoll = history[0] ?? null

  useEffect(() => { loadTables() }, [loadTables])

  return (
    <div className="device">
      <AppHeader title="RollCore" />

      <div className="page-body wide">
        <div className="home-section-head">
          <button className="home-icon-btn" aria-label="Ver mesas" onClick={() => navigate('mesas')}>
            <IconScroll />
          </button>
          <h2>Mesas</h2>
          <button className="home-icon-btn" aria-label="Criar mesa" onClick={() => navigate('nova-mesa')}>
            <IconPlus />
          </button>
        </div>

        {tables.length === 0 ? (
          <div className="home-mesas">
            <strong>Nenhuma mesa por aqui</strong>
            <span>Toque no + para criar a sua primeira mesa.</span>
          </div>
        ) : (
          <>
            <div className="table-grid">
              {tables.slice(0, 3).map(t => (
                <TableBanner key={t.id} table={t} onEnter={() => openTable(t.id)} />
              ))}
            </div>
            {tables.length > 3 && (
              <button className="link-btn" style={{ marginBottom: 14 }} onClick={() => navigate('mesas')}>
                ver todas as mesas ({tables.length})
              </button>
            )}
          </>
        )}

        <div className="dash-grid">
          <button className="dash-card" onClick={() => navigate('dados')}>
            <DiceLogo className="dash-card-icon mint" />
            <h3>Rolar Dados</h3>
            <p>
              {lastRoll
                ? `Último: ${lastRoll.formula ?? `d${lastRoll.result.sides}`} = ${lastRoll.result.total}`
                : 'Faça sua primeira rolagem'}
            </p>
          </button>

          <button className="dash-card" onClick={() => navigate('personagens')}>
            <IconSheets className="dash-card-icon" />
            <h3>Fichas</h3>
            <p>
              {characters.length === 0 ? 'Criar primeira ficha'
                : characters.length === 1 ? '1 personagem'
                : `${characters.length} personagens`}
            </p>
          </button>

          {COMING_SOON.map(item => (
            <button
              key={item.label}
              className="dash-card soon"
              onClick={() => showToast(`${item.label} chega em breve.`)}
            >
              {item.icon}
              <h3>{item.label}</h3>
              <p>Em breve</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
