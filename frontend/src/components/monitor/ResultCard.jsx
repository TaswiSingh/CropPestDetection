import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react'

export function ResultCard({ t, result, context, language }) {
  const isPest = result.pred_L1 === 'Pest'
  const isMechanical = result.pred_L1 === 'Mechanical'
  const severity = result.pred_L2?.toLowerCase()
  const tone = isPest ? 'result--pest' : isMechanical ? 'result--mechanical' : 'result--healthy'
  const title = isPest ? t('pestDetected') : isMechanical ? t('mechanicalSignal') : t('healthySignal')
  const description = isPest ? t('pestSignalDescription') : isMechanical ? t('mechanicalDescription') : t('healthyDescription')
  const Icon = isPest ? ShieldAlert : isMechanical ? AlertTriangle : CheckCircle2
  const timestamp = result.sensorPayload?.capturedAt ? new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(result.sensorPayload.capturedAt)) : '—'
  return (
    <section className={`result-card card ${tone} ${severity === 'high' ? 'result--high' : ''}`}>
      <div className="result-orb"><Icon size={26} /></div>
      <div className="result-copy">
        <div className="result-heading-row">
          <div className="result-heading">
            <span className="eyebrow">{t('aiCropAssessment')} <span className="result-dot" /> {t('simulated')}</span>
            <h2>{title}</h2>
          </div>
          {isPest && <div className={`severity-pill severity-pill--${severity}`}><span>{severity === 'high' ? '!' : severity === 'medium' ? '!' : 'i'}</span>{severity === 'high' ? t('highSeverity') : severity === 'medium' ? t('mediumSeverity') : t('lowSeverity')}</div>}
          {!isPest && <div className="result-check"><Info size={15} /> {t('signalDetected')}</div>}
        </div>
        <p>{description}</p>
        <div className="result-meta-grid">
          <span><small>{t('timestamp')}</small><strong>{timestamp}</strong></span>
          <span><small>{t('farmDetails')}</small><strong>{context.farm}</strong></span>
          <span><small>{t('cropDetails')}</small><strong>{context.crop}</strong></span>
          <span><small>{t('stageDetails')}</small><strong>{context.growthStage}</strong></span>
          <span><small>{t('plotDetails')}</small><strong>{context.plot}</strong></span>
        </div>
      </div>
    </section>
  )
}