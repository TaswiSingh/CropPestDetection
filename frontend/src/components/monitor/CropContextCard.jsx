import { Leaf, MapPin, Sprout } from 'lucide-react'

export function CropContextCard({ t, growthStage, setGrowthStage }) {
  const stages = [
    { id: 'seedling', label: t('seedling') },
    { id: 'vegetative', label: t('vegetative') },
    { id: 'flowering', label: t('flowering') },
    { id: 'fruiting', label: t('fruiting') },
  ]
  return (
    <section className="card context-card">
      <div className="section-heading"><div><span className="eyebrow">01 / {t('cropContext')}</span><h2>{t('cropContext')}</h2></div><div className="context-icon"><Leaf size={18} /></div></div>
      <div className="context-grid">
        <div className="context-item"><span className="context-label">{t('farm')}</span><strong>{t('demoFarm')}</strong><span className="context-sub"><MapPin size={13} /> {t('plotA')}</span></div>
        <div className="context-item"><span className="context-label">{t('crop')}</span><strong><span className="tomato-dot" />{t('tomato')}</strong><span className="context-sub">{t('appDescription')}</span></div>
        <div className="context-item context-item--stage"><span className="context-label">{t('growthStage')}</span><div className="stage-options">{stages.map((stage) => <button key={stage.id} onClick={() => setGrowthStage(stage.id)} className={growthStage === stage.id ? 'stage-option stage-option--active' : 'stage-option'}>{stage.label}</button>)}</div></div>
      </div>
    </section>
  )
}