import { RefreshCw, TriangleAlert, WifiOff } from 'lucide-react'

export function ScanError({ t, errorType = 'scanFailed', onRetry }) {
  const unavailable = errorType === 'sensorUnavailable'
  const noResult = errorType === 'noResult'
  const title = unavailable ? t('sensorUnavailable') : noResult ? t('noResult') : errorType === 'analysisFailed' ? t('analysisFailed') : t('scanFailed')
  return (
    <section className="scan-error card">
      <div className="scan-error-icon">{unavailable ? <WifiOff size={23} /> : <TriangleAlert size={23} />}</div>
      <div><span className="eyebrow">{t('unableToComplete')}</span><h2>{title}</h2><p>{t('checkSensorConnection')}</p></div>
      <button className="button button--secondary" onClick={onRetry}><RefreshCw size={15} /> {t('tryAgain')}</button>
    </section>
  )
}