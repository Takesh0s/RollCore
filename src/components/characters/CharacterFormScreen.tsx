import { useState, useEffect, useCallback } from 'react'
import { useAppStore, useSelectedCharacter } from '@/store/useAppStore'
import { Modal } from '@/components/ui/Modal'
import {
  calcMod, formatMod, profBonus,
  ATTR_KEYS, ATTR_LABELS, CLASSES, RACES,
  SUBCLASSES, getRaceBonuses,
} from '@/lib/engine'
import type { AttrKey, Attributes } from '@/types'

type Mode = 'new' | 'edit'
interface Props { mode: Mode }

interface AttrFieldProps {
  attrKey: AttrKey; value: string
  onChange: (key: AttrKey, val: string) => void
  error?: string; bonus?: number
}

function AttrField({ attrKey, value, onChange, error, bonus }: AttrFieldProps) {
  const num = parseInt(value, 10)
  const mod = !isNaN(num) && num >= 1 && num <= 30 ? formatMod(calcMod(num)) : '—'
  return (
    <div className="attr-form-item">
      <span className="attr-form-label">{ATTR_LABELS[attrKey]}</span>
      <input
        className={`form-input input-center${error ? ' error' : value && !error ? ' valid' : ''}`}
        type="number" min={1} max={30} placeholder="1–20"
        value={value}
        onChange={e => onChange(attrKey, e.target.value)}
      />
      <div className="attr-form-mod">{mod}</div>
      {bonus !== undefined && bonus !== 0 && (
        <div className="attr-form-race-bonus">+{bonus} racial</div>
      )}
      {error && <small className="error-msg">{error}</small>}
    </div>
  )
}

export function CharacterFormScreen({ mode }: Props) {
  const { navigate, addCharacter, updateCharacter, deleteCharacter, showToast } = useAppStore()
  const existing = useSelectedCharacter()
  const isEdit   = mode === 'edit'
  const title    = isEdit ? 'Editar Personagem' : 'Novo Personagem'

  const [name,     setName]     = useState('')
  const [level,    setLevel]    = useState('')
  const [cls,      setCls]      = useState('')
  const [subclass, setSubclass] = useState('')
  const [race,     setRace]     = useState('')

  const [attrs, setAttrs] = useState<Record<AttrKey, string>>(
    { STR: '', DEX: '', CON: '', INT: '', WIS: '', CHA: '' }
  )
  const [maxHp, setMaxHp] = useState('')
  const [ac,    setAc]    = useState('')

  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [showDelete, setShowDelete] = useState(false)

  // Pre-fill on edit
  useEffect(() => {
    if (isEdit && existing) {
      setName(existing.name); setLevel(String(existing.level))
      setCls(existing.class); setSubclass(existing.subclass ?? '')
      setRace(existing.race)
      setMaxHp(String(existing.max_hp ?? existing.hp))
      setAc(String(existing.ac))
      const filled: Record<AttrKey, string> = { STR:'', DEX:'', CON:'', INT:'', WIS:'', CHA:'' }
      ATTR_KEYS.forEach(k => { filled[k] = String(existing.attributes[k]) })
      setAttrs(filled)
    }
  }, [isEdit, existing])

  // When race changes, show what bonuses will be applied
  const raceBonuses = getRaceBonuses(race)

  // Subclass options for current class
  const subclassInfo = SUBCLASSES[cls]
  const lvNum        = parseInt(level, 10)
  const profPreview  = !isNaN(lvNum) && lvNum >= 1 && lvNum <= 20 ? `+${profBonus(lvNum)}` : '+?'
  const showSubclass = cls && subclassInfo && (!isNaN(lvNum) && lvNum >= subclassInfo.choiceLevel)

  const handleAttrChange = useCallback((key: AttrKey, val: string) => {
    setAttrs(prev => ({ ...prev, [key]: val }))
  }, [])

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name  = 'Informe o nome do personagem'
    if (!cls)         errs.class = 'Selecione a classe'
    if (!race)        errs.race  = 'Selecione a raça'
    const lv = parseInt(level, 10)
    if (!level || isNaN(lv) || lv < 1 || lv > 20)
      errs.level = 'Nível inválido. Informe um valor entre 1 e 20.'
    ATTR_KEYS.forEach(k => {
      const v = parseInt(attrs[k], 10)
      if (!attrs[k] || isNaN(v) || v < 1 || v > 30) errs[`attr_${k}`] = 'Valor deve ser entre 1 e 30'
    })
    const hp  = parseInt(maxHp, 10)
    const acN = parseInt(ac,    10)
    if (!maxHp || isNaN(hp) || hp < 1)     errs.combat = 'Informe HP Máximo e CA válidos'
    if (ac === '' || isNaN(acN) || acN < 0) errs.combat = 'Informe HP Máximo e CA válidos'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const lv   = parseInt(level, 10)
    const bonuses = getRaceBonuses(race)
    const attributes = ATTR_KEYS.reduce((acc, key) => {
      // Apply racial bonuses on top of entered base values
      const base  = parseInt(attrs[key], 10)
      acc[key] = base + (bonuses[key] ?? 0)
      return acc
    }, {} as Attributes)

    const data = {
      name: name.trim(), class: cls, subclass, race, level: lv,
      hp: parseInt(maxHp, 10), max_hp: parseInt(maxHp, 10),
      temp_hp: existing?.temp_hp ?? 0,
      ac: parseInt(ac, 10), attributes,
    }

    if (isEdit && existing) {
      updateCharacter(existing.id, data)
      showToast('Alterações salvas com sucesso!', 'success')
    } else {
      addCharacter(data)
      showToast('Personagem salvo com sucesso!', 'success')
    }
    navigate('personagens')
  }

  function handleDelete() {
    if (!existing) return
    deleteCharacter(existing.id)
    showToast('Personagem excluído.')
    navigate('personagens')
  }

  return (
    <>
      <div className="device">
        <div className="topbar">
          <button className="topbar-back" onClick={() => navigate('personagens')}>←</button>
          <div className="topbar-info">
            <div className="top-title">{title}</div>
          </div>
        </div>

        <div className="page-body">
          {/* ── Identity ── */}
          <h2 className="section-title">Identidade</h2>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input className={`form-input${errors.name ? ' error' : name ? ' valid' : ''}`}
                placeholder="Ex: Thorin Kettleback" maxLength={100}
                value={name} onChange={e => setName(e.target.value)} />
              {errors.name && <small className="error-msg">{errors.name}</small>}
            </div>
            <div className="form-group">
              <label className="form-label">Nível (1–20)</label>
              <input className={`form-input${errors.level ? ' error' : level && !errors.level ? ' valid' : ''}`}
                type="number" min={1} max={20} placeholder="1–20"
                value={level} onChange={e => setLevel(e.target.value)} />
              {errors.level && <small className="error-msg">{errors.level}</small>}
            </div>
            <div className="form-group">
              <label className="form-label">Classe</label>
              <select className={`form-input${errors.class ? ' error' : cls ? ' valid' : ''}`}
                value={cls} onChange={e => { setCls(e.target.value); setSubclass('') }}>
                <option value="">Selecione a classe</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              {errors.class && <small className="error-msg">{errors.class}</small>}
            </div>
            <div className="form-group">
              <label className="form-label">Raça</label>
              <select className={`form-input${errors.race ? ' error' : race ? ' valid' : ''}`}
                value={race} onChange={e => setRace(e.target.value)}>
                <option value="">Selecione a raça</option>
                {RACES.map(r => <option key={r}>{r}</option>)}
              </select>
              {errors.race && <small className="error-msg">{errors.race}</small>}
            </div>
          </div>

          {/* ── Subclass (conditional) ── */}
          {showSubclass && (
            <>
              <h2 className="section-title" style={{ marginTop: 6 }}>
                Subclasse
                <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
                  disponível a partir do {subclassInfo!.choiceLevel}° nível
                </span>
              </h2>
              <div className="form-group">
                <select className={`form-input${subclass ? ' valid' : ''}`}
                  value={subclass} onChange={e => setSubclass(e.target.value)}>
                  <option value="">Selecione a subclasse (opcional)</option>
                  {subclassInfo!.options.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}

          {/* ── Race bonuses notice ── */}
          {race && Object.keys(raceBonuses).length > 0 && (
            <div className="race-bonus-notice">
              <span className="race-bonus-icon">🧬</span>
              <span>
                <strong>{race}</strong>: bônus raciais serão aplicados automaticamente aos atributos —{' '}
                {Object.entries(raceBonuses).map(([k, v]) => `${ATTR_LABELS[k as AttrKey]} +${v}`).join(', ')}
              </span>
            </div>
          )}

          {/* ── Attributes ── */}
          <h2 className="section-title" style={{ marginTop: 6 }}>
            Atributos Base (1–20)
            {race && <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>insira os valores antes dos bônus raciais</span>}
          </h2>
          <div className="attr-form-grid">
            {ATTR_KEYS.map(k => (
              <AttrField key={k} attrKey={k} value={attrs[k]}
                onChange={handleAttrChange}
                error={errors[`attr_${k}`]}
                bonus={raceBonuses[k]} />
            ))}
          </div>

          {/* ── Combat ── */}
          <h2 className="section-title" style={{ marginTop: 6 }}>Combate</h2>
          <div className="attr-grid">
            <div className="attr-box">
              <span className="attr-box-label">Proficiência</span>
              <strong className="attr-box-value" style={{ fontSize: 22 }}>{profPreview}</strong>
              <span className="attr-box-mod">calculado</span>
            </div>
            <div className="attr-box">
              <span className="attr-box-label">HP Máx.</span>
              <input className={`form-input input-center${errors.combat ? ' error' : ''}`}
                type="number" min={1} placeholder="0" value={maxHp}
                onChange={e => setMaxHp(e.target.value)} style={{ marginTop: 4 }} />
            </div>
            <div className="attr-box">
              <span className="attr-box-label">CA</span>
              <input className={`form-input input-center${errors.combat ? ' error' : ''}`}
                type="number" min={0} placeholder="0" value={ac}
                onChange={e => setAc(e.target.value)} style={{ marginTop: 4 }} />
            </div>
          </div>
          {errors.combat && <small className="error-msg">{errors.combat}</small>}

          <div className="form-actions">
            {isEdit && (
              <button className="btn btn-danger" onClick={() => setShowDelete(true)}>Excluir</button>
            )}
            <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
              <button className="btn btn-outline btn-auto" onClick={() => navigate('personagens')}>Cancelar</button>
              <button className="btn btn-primary btn-auto" style={{ marginTop: 0 }} onClick={handleSave}>
                {isEdit ? 'Salvar Alterações' : 'Salvar Personagem'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDelete && (
        <Modal title="Excluir Personagem" body="Tem certeza? Esta ação não pode ser desfeita."
          confirmLabel="Excluir" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      )}
    </>
  )
}