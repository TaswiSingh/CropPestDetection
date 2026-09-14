import { useCallback, useRef, useState } from 'react'
import { createDemoScan, analyzeSensorReadings } from '../services/api'

export function useScan() {
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [sensorPayload, setSensorPayload] = useState(null)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)
  const lastRequestRef = useRef({ growthStage: 'flowering', isSimulation: false })

  const startScan = useCallback(async ({ sensorInput, growthStage = 'flowering', isSimulation = false } = {}) => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    const submittedSensorInput = sensorInput || createDemoScan('healthy')
    lastRequestRef.current = { sensorInput: submittedSensorInput, growthStage, isSimulation }
    const scanId = window.crypto?.randomUUID?.() || `scan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    setResult(null)
    setSensorPayload(null)
    setProgress(0)
    setError(null)
    setStatus('collecting')
    let failureType = 'sensorUnavailable'
    try {
      setSensorPayload(submittedSensorInput)

      await new Promise((resolve) => {
        let value = 0
        timerRef.current = window.setInterval(() => {
          value += 5
          setProgress(value)
          if (value >= 100) {
            window.clearInterval(timerRef.current)
            resolve()
          }
        }, 45)
      })

      failureType = 'analysisFailed'
      setStatus('analyzing')
      await new Promise((resolve) => window.setTimeout(resolve, 1200))
      const prediction = await analyzeSensorReadings(submittedSensorInput, { growthStage, isSimulation, scanId })
      if (!prediction) {
        setError({ type: 'noResult' })
        setStatus('error')
        return null
      }
      setResult(prediction)
      setStatus('complete')
      return prediction
    } catch (scanError) {
      setError({ type: failureType === 'sensorUnavailable' ? 'sensorUnavailable' : failureType === 'analysisFailed' ? 'analysisFailed' : 'scanFailed' })
      setStatus('error')
      return null
    }
  }, [])

  const resetScan = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    setStatus('idle')
    setProgress(0)
    setResult(null)
    setSensorPayload(null)
    setError(null)
  }, [])

  const retryScan = useCallback(() => startScan(lastRequestRef.current), [startScan])

  return { status, progress, result, sensorPayload, error, startScan, resetScan, retryScan }
}