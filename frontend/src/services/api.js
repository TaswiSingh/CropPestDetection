import { createSensorPayload } from '../data/mockSensors.js'

const resultTemplates = {
  healthy: { pred_L1: 'Control', pred_L2: null, severity: null, quality: 'good', qa_issues: [], R0_fallback: false },
  mechanical: { pred_L1: 'Mechanical', pred_L2: null, severity: null, quality: 'fallback', qa_issues: [], R0_fallback: true },
  earlyPest: { pred_L1: 'Pest', pred_L2: 'Low', severity: 'low', quality: 'good', qa_issues: [], R0_fallback: false },
  highPest: { pred_L1: 'Pest', pred_L2: 'High', severity: 'high', quality: 'warning', qa_issues: ['sensor_variation'], R0_fallback: false },
}

function classifySensorInput(sensorInput) {
  const readings = Object.values(sensorInput?.sensors || {}).map(Number).filter(Number.isFinite)
  const averageGasSignal = readings.length ? readings.reduce((sum, value) => sum + value, 0) / readings.length : 0
  const temperature = Number(sensorInput?.temperature)
  const humidity = Number(sensorInput?.humidity)

  if (averageGasSignal >= 0.62 || (temperature >= 30 && humidity >= 68)) return 'highPest'
  if (averageGasSignal >= 0.4 || (temperature >= 28.2 && humidity >= 63)) return 'earlyPest'
  if (averageGasSignal >= 0.29 || (temperature >= 28.8 && humidity <= 61)) return 'mechanical'
  return 'healthy'
}

// This is the replaceable analysis boundary for the future FastAPI /predict request.
export async function analyzeSensorReadings(sensorInput, metadata = {}) {
  await new Promise((resolve) => setTimeout(resolve, 700))
  const result = resultTemplates[classifySensorInput(sensorInput)]
  return {
    ...result,
    advisory: result.pred_L1 === 'Pest' ? `${result.pred_L2} severity pest signal` : `${result.pred_L1} crop signal`,
    sensorPayload: sensorInput,
    metadata,
  }
}

// The UI talks to this service boundary, not to a backend contract.
// Replace this implementation with the eventual FastAPI request.
export async function predictScan(sensorInput, metadata = {}) {
  return analyzeSensorReadings(sensorInput, metadata)
}

export function createDemoScan(scenario) {
  return createSensorPayload(scenario)
}