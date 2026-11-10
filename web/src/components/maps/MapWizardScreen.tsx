import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useMaps, imageIdOf, type MapBody } from '@/store/useMaps'
import { AppHeader } from '@/components/ui/AppHeader'
import { uploadImage } from '@/lib/image'
import {
  DEFAULT_CELL, GRID_TYPES, gridForImage, KINDS, MAX_NAME, prepareMapImage, SIZES,
  type GridType, type MapKind, type PreparedImage,
} from '@/lib/maps'

type Template = 'custom' | 'upload'
type SizeId = (typeof SIZES)[number]['id']

/**
 * Assistente "Criar mapa" (Figma 09.4): tipo, formato da grade e ponto de partida.
 * "Oficina da Comunidade" e "Continuar mapa" levam direto à outra tela; "Fazer upload" e "Personalizado"
 * são as duas formas de começar um mapa novo (imagem sua ou em branco).
 */
export function MapWizardScreen() {
  const navigate = useAppStore(s => s.navigate)
  const { maps, create, edit } = useMaps()

  const [name, setName] = useState('Novo mapa')
  const [kind, setKind] = useState<MapKind>('MEDIEVAL')
  const [gridType, setGridType] = useState<GridType>('SQUARE')
  const [template, setTemplate] = useState<Template>('custom')
  const [size, setSize] = useState<SizeId>('medium')
  const [image, setImage] = useState<PreparedImage | null>(null)
  const [cols, setCols] = useState(30)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const last = maps[0] // a lista já vem do servidor com o editado por último primeiro
  const fit = image ? gridForImage(image.width, image.height, cols) : null

  async function pick(file: File | undefined) {
    if (!file) return
    setError('')
    const prepared = await prepareMapImage(file)
    if (!prepared) { setError('Escolha uma imagem PNG, JPG ou WebP que o navegador consiga abrir.'); return }
    setImage(prepared)
  }

  function openEditor(id: string) { edit(id); navigate('mapa-editor') }

  async function build(body: MapBody) {
    const res = await create(body)
    if (!res.ok) { setError(res.error); setBusy(false); return }
    openEditor(res.map.id)
  }

  async function save() {
    const trimmed = name.trim()
    if (trimmed.length < 3) { setError('Dê um nome ao mapa (mínimo de 3 letras).'); return }
    setError('')
    setBusy(true)
    if (template === 'upload') {
      if (!image || !fit) { setError('Escolha a imagem do mapa.'); setBusy(false); return }
      const url = await uploadImage(image.dataUrl)
      if (!url) { setError('Não foi possível enviar a imagem. Confira o tamanho (máx. 2 MB) e tente de novo.'); setBusy(false); return }
      await build({ name: trimmed, kind, gridType, ...fit, imageId: imageIdOf(url), layers: '{}', gridVisible: true, fogEnabled: false })
    } else {
      const s = SIZES.find(x => x.id === size) ?? SIZES[1]
      await build({ name: trimmed, kind, gridType, cols: s.cols, rows: s.rows, cellSize: DEFAULT_CELL, layers: '{}', gridVisible: true, fogEnabled: false })
    }
  }

  /** "Pular": um mapa em branco com o padrão (tipo e formato trocam depois, no editor). */
  async function skip() {
    setBusy(true); setError('')
    const s = SIZES[1]
    await build({ name: 'Novo mapa', kind: 'MEDIEVAL', gridType: 'SQUARE', cols: s.cols, rows: s.rows, cellSize: DEFAULT_CELL, layers: '{}', gridVisible: true, fogEnabled: false })
  }

  return (
    <div className="device">
      <AppHeader title="Criar mapa" onBack={() => navigate('mapas')} />

      <div className="page-body map-page">
        <div className="map-wizard">
          <h2 className="map-wizard-title">Vamos iniciar um mapa novo!</h2>

          <label className="form-label" htmlFor="map-name">Nome do mapa</label>
          <input id="map-name" className="form-input" value={name} maxLength={MAX_NAME} autoComplete="off" onChange={e => setName(e.target.value)} />

          <h3 className="map-wizard-q">Que tipo de mapa você gostaria de criar?</h3>
          <div className="map-choices six" role="group" aria-label="Tipo de mapa">
            {KINDS.map(k => (
              <button key={k.id} type="button" className={`map-choice${kind === k.id ? ' on' : ''}`} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
                <strong>{k.label}</strong>
              </button>
            ))}
          </div>

          <h3 className="map-wizard-q">Qual será o formato do mapa?</h3>
          <div className="map-choices two" role="group" aria-label="Formato da grade">
            {GRID_TYPES.map(g => (
              <button key={g.id} type="button" className={`map-choice${gridType === g.id ? ' on' : ''}`} aria-pressed={gridType === g.id} onClick={() => setGridType(g.id)}>
                <strong>{g.label}</strong><small>{g.hint}</small>
              </button>
            ))}
          </div>

          <h3 className="map-wizard-q">Você gostaria de um template?</h3>
          <div className="map-choices four" role="group" aria-label="Ponto de partida">
            <button type="button" className="map-choice" onClick={() => navigate('oficina-mapas')}>
              <strong>Oficina da Comunidade</strong><small>Mapas criados por outros mestres</small>
            </button>
            <button type="button" className={`map-choice${template === 'upload' ? ' on' : ''}`} aria-pressed={template === 'upload'} onClick={() => setTemplate('upload')}>
              <strong>Fazer upload de mapa</strong><small>Do seu dispositivo (PNG, JPG ou WebP)</small>
            </button>
            <button type="button" className="map-choice" disabled={!last} onClick={() => last && openEditor(last.id)}>
              <strong>Continuar mapa</strong><small>{last ? `Retomar "${last.name}"` : 'Você ainda não tem mapas'}</small>
            </button>
            <button type="button" className={`map-choice${template === 'custom' ? ' on' : ''}`} aria-pressed={template === 'custom'} onClick={() => setTemplate('custom')}>
              <strong>Personalizado</strong><small>Começar do zero</small>
            </button>
          </div>

          {template === 'custom' && (
            <div className="map-extra">
              <span className="form-label">Tamanho do mapa</span>
              <div className="map-choices three" role="group" aria-label="Tamanho do mapa">
                {SIZES.map(s => (
                  <button key={s.id} type="button" className={`map-choice${size === s.id ? ' on' : ''}`} aria-pressed={size === s.id} onClick={() => setSize(s.id)}>
                    <strong>{s.label}</strong><small>{s.cols} × {s.rows} células</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {template === 'upload' && (
            <div className="map-extra">
              <label className="btn btn-outline btn-pill map-file">
                {image ? 'Trocar imagem' : 'Escolher imagem'}
                <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Imagem do mapa" onChange={e => pick(e.target.files?.[0])} />
              </label>
              {image && fit && (
                <div className="map-upload">
                  <img src={image.dataUrl} alt="Prévia da imagem escolhida" />
                  <div>
                    <label className="form-label" htmlFor="map-cols">Colunas da grade: {fit.cols}</label>
                    <input id="map-cols" type="range" min={10} max={100} value={cols} onChange={e => setCols(Number(e.target.value))} />
                    <small className="field-hint">A grade ficará com {fit.cols} × {fit.rows} células. Ajuste até casar com o desenho da imagem.</small>
                  </div>
                </div>
              )}
              <small className="field-hint">Imagens grandes são reduzidas automaticamente para caber no limite de 2 MB.</small>
            </div>
          )}

          {error && <small className="field-error map-error" role="alert">{error}</small>}

          <hr className="map-rule" />
          <p className="map-hint">Você pode trocar o tipo e o formato depois, dentro do editor.</p>
          <div className="map-wizard-actions">
            <button type="button" className="btn btn-outline btn-pill" disabled={busy} onClick={skip}>Pular</button>
            <button type="button" className="btn btn-primary btn-pill" disabled={busy} onClick={save}>{busy ? '…' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
