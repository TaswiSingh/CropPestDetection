function toDateKey(timestamp) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfToday(now = new Date()) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

export function filterScansByTime(scans, range, now = new Date()) {
  if (range === 'all') return scans
  const today = startOfToday(now)
  const days = range === 'today' ? 0 : range === '7d' ? 6 : 29
  const start = today - days * 24 * 60 * 60 * 1000
  return scans.filter((scan) => {
    const timestamp = new Date(scan.timestamp).getTime()
    return Number.isFinite(timestamp) && timestamp >= start && timestamp <= now.getTime()
  })
}

export function calculateKpis(scans) {
  return {
    total: scans.length,
    healthy: scans.filter((scan) => scan.pred_L1 === 'Control').length,
    mechanical: scans.filter((scan) => scan.pred_L1 === 'Mechanical').length,
    pest: scans.filter((scan) => scan.pred_L1 === 'Pest').length,
    high: scans.filter((scan) => scan.pred_L1 === 'Pest' && scan.pred_L2 === 'High').length,
  }
}

export function getDetectionOverview(scans) {
  return [
    { key: 'healthy', value: scans.filter((scan) => scan.pred_L1 === 'Control').length },
    { key: 'mechanical', value: scans.filter((scan) => scan.pred_L1 === 'Mechanical').length },
    { key: 'pest', value: scans.filter((scan) => scan.pred_L1 === 'Pest').length },
  ]
}

export function getSeverityDistribution(scans) {
  const pestScans = scans.filter((scan) => scan.pred_L1 === 'Pest')
  return [
    { key: 'low', value: pestScans.filter((scan) => scan.pred_L2 === 'Low').length },
    { key: 'medium', value: pestScans.filter((scan) => scan.pred_L2 === 'Medium').length },
    { key: 'high', value: pestScans.filter((scan) => scan.pred_L2 === 'High').length },
  ]
}

export function getDetectionTrend(scans, language) {
  const grouped = new Map()
  scans.forEach((scan) => {
    const key = toDateKey(scan.timestamp)
    if (!key) return
    if (!grouped.has(key)) grouped.set(key, { date: key, healthy: 0, mechanical: 0, pest: 0 })
    const point = grouped.get(key)
    if (scan.pred_L1 === 'Control') point.healthy += 1
    if (scan.pred_L1 === 'Mechanical') point.mechanical += 1
    if (scan.pred_L1 === 'Pest') point.pest += 1
  })
  return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date)).map((point) => ({
    ...point,
    label: new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short' }).format(new Date(`${point.date}T12:00:00`)),
  }))
}

export function getSensorTrends(scans, language) {
  return [...scans]
    .filter((scan) => Number.isFinite(new Date(scan.timestamp).getTime()))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((scan) => ({
      date: scan.timestamp,
      label: new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short' }).format(new Date(scan.timestamp)),
      temperature: scan.temperature !== null && scan.temperature !== undefined && scan.temperature !== '' && Number.isFinite(Number(scan.temperature)) ? Number(scan.temperature) : null,
      humidity: scan.humidity !== null && scan.humidity !== undefined && scan.humidity !== '' && Number.isFinite(Number(scan.humidity)) ? Number(scan.humidity) : null,
    }))
}

export function getRecentAlerts(scans, limit = 5) {
  return scans.filter((scan) => scan.pred_L1 === 'Pest' || scan.pred_L1 === 'Mechanical').slice(0, limit)
}