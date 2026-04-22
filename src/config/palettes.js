/**
 * BMS Dashboard — Chart Color Palettes
 * 10 industry-themed preset palettes.
 * Each palette defines:
 *   smColor      – SM area/line primary color
 *   tmColor      – TM area/line primary color
 *   chartColors  – 6 categorical colors (indexed, used for bars & pies without per-entry color)
 */
export const PALETTES = [
  {
    id:          'default',
    name:        'AlphaMetricx',
    industry:    'Default',
    smColor:     '#3b82f6',
    tmColor:     '#0d9488',
    chartColors: ['#893ffc','#d02670','#1192e8','#eb6200','#007d79','#d2a106'],
  },
  {
    id:          'pharma',
    name:        'Clinical',
    industry:    'Pharma / Healthcare',
    smColor:     '#0e62fe',
    tmColor:     '#198038',
    chartColors: ['#0e62fe','#198038','#6929c4','#005d5d','#1192e8','#9f1853'],
  },
  {
    id:          'qsr',
    name:        'Appetite',
    industry:    'QSR / Food & Beverage',
    smColor:     '#eb6200',
    tmColor:     '#b45309',
    chartColors: ['#eb6200','#f59e0b','#d97706','#dc2626','#b45309','#92400e'],
  },
  {
    id:          'tech',
    name:        'Digital',
    industry:    'Tech / SaaS',
    smColor:     '#6929c4',
    tmColor:     '#1192e8',
    chartColors: ['#6929c4','#1192e8','#005d5d','#9f1853','#0072c3','#8a3ffc'],
  },
  {
    id:          'beauty',
    name:        'Glow',
    industry:    'Cosmetics & Beauty',
    smColor:     '#d02670',
    tmColor:     '#9f1853',
    chartColors: ['#d02670','#9f1853','#e8507a','#6929c4','#f4a7b9','#a02669'],
  },
  {
    id:          'finance',
    name:        'Equities',
    industry:    'Finance / Corporate',
    smColor:     '#0353e9',
    tmColor:     '#005d5d',
    chartColors: ['#0353e9','#005d5d','#6929c4','#697077','#0072c3','#198038'],
  },
  {
    id:          'retail',
    name:        'Commerce',
    industry:    'Retail / CPG',
    smColor:     '#198038',
    tmColor:     '#005d5d',
    chartColors: ['#198038','#005d5d','#0e62fe','#eb6200','#d02670','#6929c4'],
  },
  {
    id:          'media',
    name:        'Broadcast',
    industry:    'Media / Entertainment',
    smColor:     '#8a3ffc',
    tmColor:     '#d02670',
    chartColors: ['#8a3ffc','#d02670','#1192e8','#eb6200','#007d79','#f59e0b'],
  },
  {
    id:          'auto',
    name:        'Velocity',
    industry:    'Automotive',
    smColor:     '#334155',
    tmColor:     '#1e3a5f',
    chartColors: ['#1e3a5f','#334155','#0e62fe','#0d9488','#eb6200','#6b7280'],
  },
  {
    id:          'energy',
    name:        'Terra',
    industry:    'Energy / Sustainability',
    smColor:     '#0d9488',
    tmColor:     '#16a34a',
    chartColors: ['#0d9488','#16a34a','#0e62fe','#d2a106','#005d5d','#1192e8'],
  },
]

export const DEFAULT_PALETTE = PALETTES[0]

export const CUSTOM_PALETTE_DEFAULTS = {
  id:          'custom',
  name:        'Custom',
  industry:    'Brand-specific',
  smColor:     '#5f39f8',
  tmColor:     '#0d9488',
  chartColors: ['#5f39f8','#d02670','#1192e8','#eb6200','#007d79','#d2a106'],
}

/**
 * Resolve a palette.
 * For id='custom', tokens from the brand are passed in and used directly.
 */
export function getPalette(id, customTokens) {
  if (id === 'custom' && customTokens) {
    return {
      ...CUSTOM_PALETTE_DEFAULTS,
      smColor:     customTokens.smColor     || CUSTOM_PALETTE_DEFAULTS.smColor,
      tmColor:     customTokens.tmColor     || CUSTOM_PALETTE_DEFAULTS.tmColor,
      chartColors: customTokens.chartColors || CUSTOM_PALETTE_DEFAULTS.chartColors,
    }
  }
  return PALETTES.find(p => p.id === id) || DEFAULT_PALETTE
}
