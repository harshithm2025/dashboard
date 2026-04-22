/**
 * Chart utility helpers shared across all dashboard pages.
 */

// Keys that represent metric values — never X-axis labels
const METRIC_KEYS = new Set([
  'posts', 'articles', 'value', 'count', 'interactions',
  'items', 'reach', 'engagement',
])

/**
 * Auto-detect the X-axis key from a chart data array.
 * Looks for the first key that isn't a metric value.
 */
export function detectXKey(data) {
  if (!data?.length) return 'month'
  const key = Object.keys(data[0]).find(k => !METRIC_KEYS.has(k))
  return key || 'month'
}

/**
 * Resolve which data array and X-axis key to use for a chart.
 * Falls back to finer-grained data (dayData, weekData) when main data ≤ 2 points.
 */
export function resolveChartData(chartConfig) {
  const { data = [], dayData, weekData } = chartConfig
  if (data.length <= 2) {
    if (dayData?.length > 2)  return { data: dayData,  xKey: detectXKey(dayData)  }
    if (weekData?.length > 2) return { data: weekData, xKey: detectXKey(weekData) }
  }
  return { data, xKey: detectXKey(data) }
}

/**
 * Darken a hex color by a fractional amount (0–1).
 * e.g. darken('#eb6200', 0.1) → 10% darker
 */
export function darken(hex, amount = 0.1) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (n >> 16) - Math.round(255 * amount))
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount))
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Human-readable timeline tag from X-axis key.
 */
export function timelineTag(xKey) {
  if (xKey === 'day')   return 'Daily trends'
  if (xKey === 'week')  return 'Weekly trends'
  if (xKey === 'month') return 'Monthly trends'
  return 'Trends'
}
