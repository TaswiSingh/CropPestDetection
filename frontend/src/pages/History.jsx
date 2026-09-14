import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarClock, CheckCircle2, CircleAlert, Droplets, Leaf, Thermometer, Wrench, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getScans, HISTORY_UPDATED_EVENT } from '../services/history'

const filters = [
  { id: 'all', labelKey: 'filterAll' },
  { id: 'healthy', labelKey: 'filterHealthy' },
  { id: 'mechanical', labelKey: 'filterMechanical' },
  { id: 'pest', labelKey: 'filterPest' },
  { id: 'high', labelKey: 'filterHighSeverity' },
]

function assessmentType(scan) {
  if (scan.pred_L1 === 'Pest') return 'pest'
  if (scan.pred_L1 === 'Mechanical') return 'mechanical'
  return 'healthy'
}

function formatDate(timestamp, language, detailed = false) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', detailed
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date)
}

function formatSeverity(scan, t) {
  if (!scan.pred_L2) return '—'
  if (scan.pred_L2 === 'High') return t('highSeverity')
  if (scan.pred_L2 === 'Medium') return t('mediumSeverity')
  return t('lowSeverity')
}

function formatQuality(scan, t) {
  if (scan.quality === 'fallback') return t('qualityFallbackShort')
  if (scan.quality === 'warning') return t('qualityWarningShort')
  return t('qualityGoodShort')
}

function HistoryBadge({ scan, t }) {
  const type = assessmentType(scan)
  return <span className={`history-badge history-badge--${type}`}><span />{t(scan.displayedAssessmentKey || (type === 'healthy' ? 'healthyAssessment' : type === 'mechanical' ? 'mechanicalAssessment' : 'pestAssessment'))}</span>
}

function QualityBadge({ scan, t }) {
  const quality = scan.quality === 'fallback' ? 'fallback' : scan.quality === 'warning' ? 'warning' : 'good'
  return <span className={`quality-badge quality-badge--${quality}`}><span />{formatQuality(scan, t)}</span>
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  return <div className={`history-summary-card history-summary-card--${tone}`}><span className="history-summary-icon"><Icon size={17} /></span><div><strong>{value}</strong><span>{label}</span></div></div>
}

export default function History({ t, language }) {
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedScan, setSelectedScan] = useState(null)

  useEffect(() => {
    const loadScans = () => setScans(getScans())
    loadScans()
    window.addEventListener('storage', loadScans)
    window.addEventListener(HISTORY_UPDATED_EVENT, loadScans)
    return () => {
      window.removeEventListener('storage', loadScans)
      window.removeEventListener(HISTORY_UPDATED_EVENT, loadScans)
    }
  }, [])

  const summary = useMemo(() => ({
    total: scans.length,
    pest: scans.filter((scan) => scan.pred_L1 === 'Pest').length,
    healthy: scans.filter((scan) => scan.pred_L1 === 'Control').length,
    mechanical: scans.filter((scan) => scan.pred_L1 === 'Mechanical').length,
  }), [scans])

  const filteredScans = useMemo(() => scans.filter((scan) => {
    if (activeFilter === 'healthy') return scan.pred_L1 === 'Control'
    if (activeFilter === 'mechanical') return scan.pred_L1 === 'Mechanical'
    if (activeFilter === 'pest') return scan.pred_L1 === 'Pest'
    if (activeFilter === 'high') return scan.pred_L1 === 'Pest' && scan.pred_L2 === 'High'
    return true
  }), [activeFilter, scans])

  const openDetails = (scan) => setSelectedScan(scan)
  const closeDetails = () => setSelectedScan(null)

  return (
    <div className="history-page">
      <div className="history-page-intro">
        <div>
          <div className="breadcrumb"><span className="breadcrumb-icon"><Leaf size={13} /></span> {t('scanHistory')}</div>
          <h1>{t('scanHistory')}</h1>
          <p>{t('historySubtitle')}</p>
        </div>
        <button className="button button--primary" onClick={() => navigate('/monitor')}>{t('startScan')} <ArrowRight size={16} /></button>
      </div>

      <div className="history-summary-grid">
        <SummaryCard icon={CalendarClock} label={t('totalScans')} value={summary.total} tone="neutral" />
        <SummaryCard icon={CircleAlert} label={t('pestAlerts')} value={summary.pest} tone="pest" />
        <SummaryCard icon={CheckCircle2} label={t('healthyScans')} value={summary.healthy} tone="healthy" />
        <SummaryCard icon={Wrench} label={t('mechanicalStress')} value={summary.mechanical} tone="mechanical" />
      </div>

      <section className="history-list-section">
        <div className="history-list-header">
          <div><span className="eyebrow">{t('historyRecords')}</span><h2>{t('previousScans')}</h2></div>
          <span className="history-count">{filteredScans.length} {t('matchingScans')}</span>
        </div>
        <div className="history-filters" role="group" aria-label={t('historyFilters')}>
          {filters.map((filter) => <button key={filter.id} className={`history-filter ${activeFilter === filter.id ? 'history-filter--active' : ''}`} onClick={() => setActiveFilter(filter.id)}>{t(filter.labelKey)}</button>)}
        </div>

        {scans.length === 0 ? (
          <div className="history-empty"><span className="history-empty-icon"><Leaf size={24} /></span><h2>{t('noScansYet')}</h2><p>{t('noScansDescription')}</p><button className="button button--primary" onClick={() => navigate('/monitor')}>{t('startScan')} <ArrowRight size={16} /></button></div>
        ) : filteredScans.length === 0 ? (
          <div className="history-empty history-empty--filtered"><span className="history-empty-icon"><CircleAlert size={24} /></span><h2>{t('noMatchingScans')}</h2><p>{t('noMatchingScansDescription')}</p></div>
        ) : (
          <div className="history-table" role="table" aria-label={t('scanHistory')}>
            <div className="history-table-head" role="row">
              <span>{t('dateTime')}</span><span>{t('crop')}</span><span>{t('growthStage')}</span><span>{t('assessment')}</span><span>{t('severity')}</span><span>{t('sensorQuality')}</span>
            </div>
            {filteredScans.map((scan) => (
              <div key={scan.id} className="history-table-row" role="button" tabIndex="0" onClick={() => openDetails(scan)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetails(scan) } }}>
                <span className="history-cell history-cell--date" data-label={t('dateTime')}><strong>{formatDate(scan.timestamp, language)}</strong>{scan.isSimulation && <small>{t('demoSimulation')}</small>}</span>
                <span className="history-cell" data-label={t('crop')}>{t(scan.cropKey || 'tomato')}</span>
                <span className="history-cell" data-label={t('growthStage')}>{t(scan.growthStageKey || scan.growthStage || 'flowering')}</span>
                <span className="history-cell" data-label={t('assessment')}><HistoryBadge scan={scan} t={t} /></span>
                <span className="history-cell" data-label={t('severity')}><span className={`severity-badge severity-badge--${scan.pred_L2?.toLowerCase() || 'none'}`}>{formatSeverity(scan, t)}</span></span>
                <span className="history-cell" data-label={t('sensorQuality')}><QualityBadge scan={scan} t={t} /></span>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedScan && (
        <div className="history-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetails() }}>
          <section className="history-detail-modal" role="dialog" aria-modal="true" aria-labelledby="history-detail-title">
            <div className="history-detail-header">
              <div><span className="eyebrow">{t('scanDetails')}</span><h2 id="history-detail-title">{t('aiCropAssessment')}</h2></div>
              <button className="modal-close" onClick={closeDetails} aria-label={t('close')}><X size={19} /></button>
            </div>
            <div className="history-detail-result"><HistoryBadge scan={selectedScan} t={t} /><span className={`severity-badge severity-badge--${selectedScan.pred_L2?.toLowerCase() || 'none'}`}>{formatSeverity(selectedScan, t)}</span>{selectedScan.isSimulation && <span className="simulation-badge">{t('demoSimulation')}</span>}</div>
            <div className="history-detail-grid">
              <span><small>{t('dateTime')}</small><strong>{formatDate(selectedScan.timestamp, language, true)}</strong></span>
              <span><small>{t('farmDetails')}</small><strong>{t(selectedScan.farmKey || 'demoFarm')}</strong></span>
              <span><small>{t('cropDetails')}</small><strong>{t(selectedScan.cropKey || 'tomato')}</strong></span>
              <span><small>{t('stageDetails')}</small><strong>{t(selectedScan.growthStageKey || 'flowering')}</strong></span>
              <span><small>{t('plotDetails')}</small><strong>{t(selectedScan.plotKey || 'plotA')}</strong></span>
              <span><small>{t('sensorQuality')}</small><strong><QualityBadge scan={selectedScan} t={t} /></strong></span>
            </div>
            <div className="history-detail-section"><span className="eyebrow">{t('sensorReadings')}</span><div className="history-reading-grid"><span><Thermometer size={15} /><small>{t('temperature')}</small><strong>{selectedScan.temperature ?? '—'}°C</strong></span><span><Droplets size={15} /><small>{t('humidity')}</small><strong>{selectedScan.humidity ?? '—'}%</strong></span></div></div>
            <div className="history-advisory"><span className="eyebrow">{t('recommendedNextSteps')}</span><p>{selectedScan.advisoryKey ? t(selectedScan.advisoryKey) : selectedScan.advisory || '—'}</p></div>
          </section>
        </div>
      )}
    </div>
  )
}