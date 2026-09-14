import { getAdvisory } from '../data/mockPredictions.js'

const STORAGE_KEY = 'evil-lary-scan-history'
export const HISTORY_UPDATED_EVENT = 'evil-lary-history-updated'

function createFallbackId() {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function readStoredScans() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((scan) => scan && typeof scan === 'object' && scan.id && scan.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch {
    return []
  }
}

function writeStoredScans(scans) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scans))
  } catch {
    // Storage can be unavailable in private browsing or restricted previews.
  }
}

export function getScans() {
  return readStoredScans()
}

export function saveScan(scan) {
  const normalized = { ...scan, id: scan.id || createFallbackId() }
  const scans = readStoredScans()
  if (scans.some((item) => item.id === normalized.id)) return normalized
  const next = [normalized, ...scans].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  writeStoredScans(next)
  if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT))
  return normalized
}

export function clearScans() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore unavailable storage.
  }
}

export function createScanRecord(result) {
  const metadata = result.metadata || {}
  const advisory = getAdvisory(result)
  const assessment = result.pred_L1 === 'Control' ? 'Healthy' : result.pred_L1
  const sensorPayload = result.sensorPayload || {}

  return {
    id: metadata.scanId || createFallbackId(),
    timestamp: sensorPayload.capturedAt || new Date().toISOString(),
    farm: 'Demo Tomato Farm',
    farmKey: 'demoFarm',
    crop: 'Tomato',
    cropKey: 'tomato',
    growthStage: metadata.growthStage || 'flowering',
    growthStageKey: metadata.growthStage || 'flowering',
    plot: 'Plot A',
    plotKey: 'plotA',
    pred_L1: result.pred_L1 || 'Control',
    pred_L2: result.pred_L2 || null,
    displayedAssessment: assessment,
    displayedAssessmentKey: assessment === 'Healthy' ? 'healthyAssessment' : assessment === 'Mechanical' ? 'mechanicalAssessment' : 'pestAssessment',
    severity: result.pred_L2 || null,
    quality: result.quality || 'good',
    advisory: result.advisory || '',
    advisoryKey: advisory.key,
    temperature: sensorPayload.temperature ?? null,
    humidity: sensorPayload.humidity ?? null,
    sensors: sensorPayload.sensors || {},
    isSimulation: Boolean(metadata.isSimulation),
  }
}