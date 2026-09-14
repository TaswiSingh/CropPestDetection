import { useEffect, useRef, useState } from 'react'
import { ArrowRight, FlaskConical, Leaf, ScanLine } from 'lucide-react'
import { CropContextCard } from '../components/monitor/CropContextCard'
import { ScanProgress } from '../components/monitor/ScanProgress'
import { ResultCard } from '../components/monitor/ResultCard'
import { AdvisoryCard } from '../components/monitor/AdvisoryCard'
import { SensorQuality } from '../components/monitor/SensorQuality'
import { SimulatorModal } from '../components/monitor/SimulatorModal'
import { ScanError } from '../components/monitor/ScanError'
import { useScan } from '../hooks/useScan'
import { createScanRecord, saveScan } from '../services/history'
import { createSensorPayload } from '../data/mockSensors'
import { getPreferences, savePreferences } from '../services/preferences'

export default function Monitor({ t, language }) {
  const [growthStage, setGrowthStage] = useState(() => getPreferences().growthStage)
  const [sensorInput, setSensorInput] = useState(() => createSensorPayload('healthy'))
  const [modalOpen, setModalOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [speechMessage, setSpeechMessage] = useState('')
  const { status, progress, result, sensorPayload, error, startScan, resetScan, retryScan } = useScan()
  const savedResultRef = useRef(null)

  useEffect(() => {
    const preferences = getPreferences()
    savePreferences({ ...preferences, growthStage })
  }, [growthStage])

  useEffect(() => {
    if (status === 'complete' && result && savedResultRef.current !== result) {
      saveScan(createScanRecord(result))
      savedResultRef.current = result
    }
    if (status !== 'complete') savedResultRef.current = null
  }, [status, result])

  const runScan = () => startScan({ growthStage, isSimulation: false })
  const runSimulatedScan = () => {
    setModalOpen(false)
    startScan({ sensorInput: { ...sensorInput, crop: 'tomato', growth_stage: growthStage }, growthStage, isSimulation: true })
  }
  const applyPreset = (scenario) => setSensorInput(createSensorPayload(scenario))
  const onSpeak = () => {
    setSpeechMessage('')
    if (!result) return
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      setSpeechMessage(t('speechUnavailable'))
      return
    }
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const utterance = new SpeechSynthesisUtterance(`${t('recommendedNextSteps')}. ${t(result.pred_L1 === 'Pest' ? result.pred_L2 === 'High' ? 'highPestAdvisory' : result.pred_L2 === 'Low' ? 'lowPestAdvisory' : 'mediumPestAdvisory' : result.pred_L1 === 'Mechanical' ? 'mechanicalAdvisory' : 'noPestSignal')}`)
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => { setSpeaking(false); setSpeechMessage(t('speechError')) }
    try {
      window.speechSynthesis.speak(utterance)
      setSpeaking(true)
    } catch {
      setSpeechMessage(t('speechError'))
    }
  }
  const context = { farm: t('demoFarm'), crop: t('tomato'), growthStage: t(growthStage), plot: t('plotA') }

  return (
    <div className="monitor-page">
      <div className="page-intro"><div><div className="breadcrumb"><span className="breadcrumb-icon"><Leaf size={13} /></span> {t('liveMonitor')} <ArrowRight size={12} /> {t('tomato')}</div><h1>{t('liveCropMonitor')}</h1><p>{t('monitorSubtitle')}</p></div><div className="intro-meta"><span className={`status-chip ${status === 'collecting' || status === 'analyzing' ? 'status-chip--active' : ''}`}><span />{status === 'idle' ? t('scanReady') : status === 'complete' ? t('scanComplete') : status === 'error' ? t('scanFailed') : t('scanning')}</span><span className="scan-id">EVL · 2024</span></div></div>
      <div className="workflow-line"><div className="workflow-item workflow-item--active"><span>01</span>{t('workflowInput')}</div><i /><div className={`workflow-item ${status !== 'idle' && status !== 'error' ? 'workflow-item--active' : ''}`}><span>02</span>{t('workflowProcessing')}</div><i /><div className={`workflow-item ${result ? 'workflow-item--active' : ''}`}><span>03</span>{t('workflowResult')}</div><i /><div className={`workflow-item ${result ? 'workflow-item--active' : ''}`}><span>04</span>{t('workflowAction')}</div></div>
      <CropContextCard t={t} growthStage={growthStage} setGrowthStage={setGrowthStage} />
      {status === 'idle' && <section className="start-panel"><div className="start-panel-art"><div className="art-ring art-ring--one" /><div className="art-ring art-ring--two" /><span><ScanLine size={30} /></span></div><div className="start-copy"><span className="eyebrow">{t('fieldCheck')}</span><h2>{t('scanEvidence')}</h2><p>{t('collectingDetail')}</p></div><button className="button button--primary button--large" onClick={runScan}>{t('startScan')} <ArrowRight size={17} /></button></section>}
      {status === 'collecting' || status === 'analyzing' ? <ScanProgress t={t} status={status} progress={progress} payload={sensorPayload} /> : null}
      {status === 'error' && <ScanError t={t} errorType={error?.type} onRetry={retryScan} />}
      {result && status === 'complete' && <div className="results-layout"><div className="results-main"><ResultCard t={t} result={result} context={context} language={language} /><SensorQuality t={t} quality={result.quality} result={result} /></div><AdvisoryCard t={t} result={result} language={language} speaking={speaking} speechMessage={speechMessage} onSpeak={onSpeak} /></div>}
      {status === 'complete' && <div className="rescan-bar"><div><span className="rescan-icon"><ScanLine size={17} /></span><div><strong>{t('scanComplete')}</strong><span>{t('nextScan')}</span></div></div><button className="button button--secondary" onClick={resetScan}>{t('scanAgain')} <ArrowRight size={15} /></button></div>}
      <button className="demo-trigger" onClick={() => setModalOpen(true)}><FlaskConical size={16} /> {t('demoMode')} <span>· {t('sensorSimulator')}</span></button>
      {modalOpen && <SimulatorModal t={t} sensorInput={sensorInput} onSensorInputChange={setSensorInput} onPreset={applyPreset} onClose={() => setModalOpen(false)} onStart={runSimulatedScan} />}
    </div>
  )
}