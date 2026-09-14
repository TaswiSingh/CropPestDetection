import { CheckCircle2, RotateCcw, TriangleAlert } from 'lucide-react'

export function SensorQuality({ t, quality, result }) {
  const fallback = quality === 'fallback'
  const warning = quality === 'warning'
  const fallbackFromBackend = result?.R0_fallback === true
  return <div className={`quality-card ${warning ? 'quality-card--warning' : fallback || fallbackFromBackend ? 'quality-card--fallback' : ''}`}><span className="quality-icon">{warning || fallback || fallbackFromBackend ? <TriangleAlert size={17} /> : <CheckCircle2 size={17} />}</span><div><strong>{warning ? t('qualityWarning') : fallback || fallbackFromBackend ? t('qualityFallback') : t('qualityGood')}</strong><span>{warning ? t('qualityFallback') : fallback || fallbackFromBackend ? t('qualityFallback') : t('qualityGoodDetail')}</span></div>{(fallback || fallbackFromBackend) && <RotateCcw size={16} />}</div>
}