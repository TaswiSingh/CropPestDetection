import { ArrowUpRight, Ear, Eye, RefreshCw, ScanLine, Volume2, VolumeX } from 'lucide-react'
import { getAdvisory } from '../../data/mockPredictions'

export function AdvisoryCard({ t, result, language, speaking, speechMessage, onSpeak }) {
  const advisory = getAdvisory(result)
  const pest = result.pred_L1 === 'Pest'
  return (
    <section className={`advisory-card card ${pest && result.pred_L2 === 'High' ? 'advisory-card--urgent' : ''}`}>
      <div className="advisory-heading"><div><span className="eyebrow">04 / {t('action')}</span><h2>{t('recommendedNextSteps')}</h2></div><button onClick={onSpeak} className="listen-button">{speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}{speaking ? t('stop') : t('listen')}</button></div>
      <p className="advisory-lead">{t(advisory.key)}</p>
      <div className="advisory-list">
        <div className="advisory-row"><span className="advisory-row-icon"><Eye size={17} /></span><div><strong>{t('detected')}</strong><p>{pest ? `${t('pestDetected')} — ${result.pred_L2 === 'High' ? t('highSeverity') : result.pred_L2 === 'Medium' ? t('mediumSeverity') : t('lowSeverity')}` : result.pred_L1 === 'Mechanical' ? t('mechanicalSignal') : t('healthySignal')}</p></div><ArrowUpRight size={15} /></div>
        <div className="advisory-row"><span className="advisory-row-icon"><ScanLine size={17} /></span><div><strong>{t('inspect')}</strong><p>{t(advisory.inspect)}</p></div><ArrowUpRight size={15} /></div>
        <div className="advisory-row"><span className="advisory-row-icon"><Ear size={17} /></span><div><strong>{t('monitor')}</strong><p>{t(advisory.monitor)}</p></div><ArrowUpRight size={15} /></div>
      </div>
      <div className="advisory-footer"><span><RefreshCw size={14} /> {t(advisory.rescan)}</span><span className="advisory-voice">{language === 'hi' ? t('hindiAudio') : t('englishAudio')}</span></div>
      {speechMessage && <div className="speech-note">{speechMessage}</div>}
    </section>
  )
}