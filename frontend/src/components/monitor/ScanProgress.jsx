import { Check, Cpu, Radio } from 'lucide-react'
import { SensorPanel } from './SensorPanel'

export function ScanProgress({ t, status, progress, payload }) {
  const analyzing = status === 'analyzing'
  return (
    <section className="scan-panel card">
      <div className="scan-panel-header"><div className="scan-status-icon"><span className={analyzing ? 'spinner-ring' : 'signal-ring'}>{analyzing ? <Cpu size={23} /> : <Radio size={23} />}</span></div><div><span className="eyebrow">{analyzing ? `02 / ${t('aiEngine')}` : `01 / ${t('sensorLayer')}`}</span><h2>{analyzing ? t('aiAnalysis') : t('collecting')}</h2><p>{analyzing ? t('analysisDetail') : t('collectingDetail')}</p></div><span className="scan-badge">{t('scanning')}</span></div>
      {!analyzing ? <SensorPanel t={t} payload={payload} progress={progress} status={status} /> : <div className="analysis-steps">{[t('sensorReadings'), t('processingResponse'), t('analyzingCondition')].map((step, i) => <div key={step} className={`analysis-step ${i < 2 ? 'analysis-step--done' : 'analysis-step--active'}`}><span>{i < 2 ? <Check size={15} /> : <span className="step-dot" />}</span><strong>{step}</strong>{i < 2 && <em>{t('complete')}</em>}</div>)}</div>}
      {analyzing && <div className="analysis-bar"><div className="shimmer-bar" /></div>}
    </section>
  )
}