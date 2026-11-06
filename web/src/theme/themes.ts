/**
 * Catálogo de temas do RollCore (espelha as páginas de tema do Figma).
 *
 * Cada tema tem uma paleta escura e uma clara. O Medieval escuro é o padrão
 * definido em index.css, então ele não precisa de nenhuma sobrescrita.
 */

export type ThemeId = 'medieval' | 'neon' | 'cyberpunk' | 'terror' | 'steampunk' | 'pergaminho'
export type ThemeMode = 'dark' | 'light'

/** Valores brutos do Figma; applyTheme converte tudo em variáveis CSS. */
export interface Palette {
  canvas: string   // fundo da página
  body: string     // superfície principal (cartões)
  card: string     // superfície elevada
  card2: string    // superfície mais elevada / hover
  field: string    // campos de formulário
  fieldText: string
  line: string     // bordas
  text: string
  text2: string    // texto de destaque
  dim: string      // texto secundário
  accent: string   // cor de ação (fundos, bordas)
  accentTx: string // cor de ação usada em texto
  green: string
  warn: string
  red: string
  danger: string
  btn: string      // fundo do botão escuro
  btnText: string
}

export interface ThemeDef {
  id: ThemeId
  label: string
  /** Fonte dos títulos; precisa estar carregada em index.html. */
  fontDisplay: string
  /** Três cores de amostra mostradas no seletor. */
  swatch: [string, string, string]
  dark: Palette
  light: Palette
}

const SERIF = "'Source Serif 4', Georgia, serif"

export const THEMES: ThemeDef[] = [
  {
    id: 'medieval',
    label: 'Medieval',
    fontDisplay: SERIF,
    swatch: ['#353E43', '#8FB4D4', '#70B596'],
    dark: {
      canvas: '#587E9D', body: '#353E43', card: '#3B454B', card2: '#424D54', field: '#6A89A7', fieldText: '#10202E',
      line: '#6C757A', text: '#C0C0C0', text2: '#FFFFFF', dim: '#9AA4A8', accent: '#4E8B70', accentTx: '#70B596',
      green: '#70B596', warn: '#E6BE55', red: '#E58A8A', danger: '#400101', btn: '#252525', btnText: '#6A89A7',
    },
    light: {
      canvas: '#B9CBD8', body: '#F4F7F9', card: '#E4EAEF', card2: '#DDE6EC', field: '#B9CBD8', fieldText: '#10202E',
      line: '#8AA0B0', text: '#1D2A33', text2: '#0F1A21', dim: '#53626D', accent: '#2F6690', accentTx: '#1F5580',
      green: '#2A7A58', warn: '#8A5F00', red: '#9B2C2C', danger: '#F3D6D6', btn: '#1D2A33', btnText: '#DDE6EC',
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    fontDisplay: "'Orbitron', 'Chakra Petch', sans-serif",
    swatch: ['#FF2E97', '#00F0FF', '#9D5CFF'],
    dark: {
      canvas: '#0A0A12', body: '#12121F', card: '#1E1E36', card2: '#262648', field: '#262648', fieldText: '#EDEDFF',
      line: '#3A3A66', text: '#EDEDFF', text2: '#FFFFFF', dim: '#9A9AC0', accent: '#FF2E97', accentTx: '#FF2E97',
      green: '#35F2A0', warn: '#FFC933', red: '#FF6B9A', danger: '#3D0820', btn: '#0D0D18', btnText: '#00F0FF',
    },
    light: {
      canvas: '#E8E6F5', body: '#F5F3FF', card: '#FFFFFF', card2: '#ECE9FB', field: '#D9D4F2', fieldText: '#1A1030',
      line: '#A9A3D6', text: '#1A1030', text2: '#1A1030', dim: '#5B5780', accent: '#C4166F', accentTx: '#C4166F',
      green: '#0B7A52', warn: '#8A5F00', red: '#C0265C', danger: '#F7D5E4', btn: '#1A1030', btnText: '#00F0FF',
    },
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk 2077',
    fontDisplay: "'Chakra Petch', 'Orbitron', sans-serif",
    swatch: ['#FCEE0A', '#FF003C', '#0A0A0A'],
    dark: {
      canvas: '#050505', body: '#0F0F0F', card: '#181818', card2: '#222222', field: '#262626', fieldText: '#FCEE0A',
      line: '#4A4A18', text: '#EDEDED', text2: '#FFFFFF', dim: '#A0A090', accent: '#FCEE0A', accentTx: '#FCEE0A',
      green: '#00F0A0', warn: '#FF9F1C', red: '#FF003C', danger: '#3A0008', btn: '#050505', btnText: '#FCEE0A',
    },
    light: {
      canvas: '#EDE9B8', body: '#FBF8D8', card: '#FFFDE8', card2: '#F3EFC0', field: '#FFFDE8', fieldText: '#111111',
      line: '#9A9440', text: '#111111', text2: '#000000', dim: '#5A5830', accent: '#B8AC00', accentTx: '#7A7100',
      green: '#0B7A52', warn: '#8A5F00', red: '#C4002E', danger: '#F7D0D6', btn: '#111111', btnText: '#FCEE0A',
    },
  },
  {
    id: 'terror',
    label: 'Terror Cósmico',
    fontDisplay: "'Special Elite', 'Courier Prime', monospace",
    swatch: ['#0A100D', '#B3121B', '#D9CFAE'],
    dark: {
      canvas: '#040706', body: '#0A100D', card: '#101A15', card2: '#16231C', field: '#1D2C24', fieldText: '#D8D1B8',
      line: '#5D5C4C', text: '#D8D1B8', text2: '#ECE6D0', dim: '#8C8872', accent: '#B3121B', accentTx: '#E5474F',
      green: '#78B88C', warn: '#DCB93B', red: '#FF6B6B', danger: '#3A0508', btn: '#050807', btnText: '#E5474F',
    },
    light: {
      canvas: '#B9AE8C', body: '#D9CFAE', card: '#E8DFC4', card2: '#E0D6B8', field: '#F1EADB', fieldText: '#1F1C16',
      line: '#6F6650', text: '#1F1C16', text2: '#12100C', dim: '#5D5848', accent: '#8E0E14', accentTx: '#8E0E14',
      green: '#2F5E40', warn: '#7A5C00', red: '#9B1C1C', danger: '#F0CFC9', btn: '#1F1C16', btnText: '#E9D9B5',
    },
  },
  {
    id: 'steampunk',
    label: 'Steampunk',
    fontDisplay: "'Rye', 'Metamorphous', serif",
    swatch: ['#15181B', '#CF7A3A', '#D9A441'],
    dark: {
      canvas: '#0C0E10', body: '#15181B', card: '#1F2327', card2: '#2A2F34', field: '#3A4148', fieldText: '#E8DFCF',
      line: '#5B6168', text: '#E8DFCF', text2: '#F5EDDC', dim: '#9AA1A6', accent: '#CF7A3A', accentTx: '#E8964F',
      green: '#6FD0B8', warn: '#E6B655', red: '#FF8A6A', danger: '#4A1A10', btn: '#0F1113', btnText: '#E6B655',
    },
    light: {
      canvas: '#BFB29A', body: '#ECE4D3', card: '#F6F1E5', card2: '#ECE3D0', field: '#FBF8EF', fieldText: '#2B241C',
      line: '#8A7F6C', text: '#2B241C', text2: '#17120D', dim: '#6A6153', accent: '#B5651D', accentTx: '#9A4F12',
      green: '#1F6656', warn: '#7D5A10', red: '#A33A1C', danger: '#F2D8CC', btn: '#2B241C', btnText: '#E6B655',
    },
  },
  {
    id: 'pergaminho',
    label: 'Pergaminho',
    fontDisplay: "'Cinzel', serif",
    swatch: ['#CDB68A', '#8A2B14', '#2A1B0D'],
    dark: {
      canvas: '#0F0A06', body: '#1D140D', card: '#2A1D12', card2: '#34251A', field: '#4A3724', fieldText: '#EFE2C3',
      line: '#6B5638', text: '#EFE2C3', text2: '#FFF4D8', dim: '#B09A74', accent: '#C9A13B', accentTx: '#E0BB5A',
      green: '#8FBF78', warn: '#F0BE55', red: '#EF8A70', danger: '#4A140C', btn: '#120C07', btnText: '#E0BB5A',
    },
    light: {
      canvas: '#CDB68A', body: '#ECDFBD', card: '#F4EAD2', card2: '#E8D9B5', field: '#E3D2AA', fieldText: '#2A1B0D',
      line: '#8C7650', text: '#2A1B0D', text2: '#1A1007', dim: '#6B5538', accent: '#8A2B14', accentTx: '#8A2B14',
      green: '#3B5A2C', warn: '#7A5410', red: '#8A2B14', danger: '#E9C7B6', btn: '#2A1B0D', btnText: '#E8C76A',
    },
  },
]

export const DEFAULT_THEME: ThemeId = 'medieval'

export function getTheme(id: ThemeId): ThemeDef {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}
