export default function Placeholder({ t, title }) {
  return <div className="placeholder-page"><span className="placeholder-mark">✦</span><span className="eyebrow">{t('phaseOne')}</span><h1>{title}</h1><p>{t('pageComingSoon')}</p></div>
}