import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowRight, BarChart3, CheckCircle2, CircleAlert, Droplets, Leaf, Thermometer, Wrench } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Label, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { HISTORY_UPDATED_EVENT, getScans } from '../services/history'
import { calculateKpis, filterScansByTime, getDetectionOverview, getDetectionTrend, getRecentAlerts, getSensorTrends, getSeverityDistribution } from '../utils/analytics'

const timeFilters = [
  { id: 'all', labelKey: 'allTime' },
  { id: 'today', labelKey: 'today' },
  { id: '7d', labelKey: 'last7Days' },
  { id: '30d', labelKey: 'last30Days' },
]

const chartColors = {
  healthy: '#65a779',
  mechanical: '#b07830',
  pest: '#bd544d',
  low: '#d59a4c',
  medium: '#c86c43',
  high: '#bd423f',
  temperature: '#548398',
  humidity: '#4d9587',
}

function formatDate(timestamp, language) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date)
}

function assessmentType(scan) {
  if (scan.pred_L1 === 'Pest') return 'pest'
  if (scan.pred_L1 === 'Mechanical') return 'mechanical'
  return 'healthy'
}

function assessmentKey(scan) {
  return assessmentType(scan) === 'healthy' ? 'healthyAssessment' : assessmentType(scan) === 'mechanical' ? 'mechanicalAssessment' : 'pestAssessment'
}

function severityLabel(scan, t) {
  if (!scan.pred_L2) return '—'
  return t(scan.pred_L2 === 'High' ? 'highSeverity' : scan.pred_L2 === 'Medium' ? 'mediumSeverity' : 'lowSeverity')
}

function ChartEmpty({ t, message, detail }) {
  return <div className="analytics-chart-empty"><BarChart3 size={22} /><strong>{t(message)}</strong><span>{t(detail)}</span></div>
}

function ChartCard({ eyebrow, title, children, className = '' }) {
  return <section className={`analytics-chart-card ${className}`}><div className="analytics-card-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div></div>{children}</section>
}

function KpiCard({ icon: Icon, label, value, tone }) {
  return <div className={`analytics-kpi analytics-kpi--${tone}`}><span className="analytics-kpi-icon"><Icon size={17} /></span><div><strong>{value}</strong><span>{label}</span></div></div>
}

export default function Analytics({ t, language }) {
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [timeFilter, setTimeFilter] = useState('all')

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

  const filteredScans = useMemo(() => filterScansByTime(scans, timeFilter), [scans, timeFilter])
  const kpis = useMemo(() => calculateKpis(filteredScans), [filteredScans])
  const overview = useMemo(() => getDetectionOverview(filteredScans).map((item) => ({ ...item, name: t(`${item.key}Assessment`) })), [filteredScans, t])
  const severity = useMemo(() => getSeverityDistribution(filteredScans).map((item) => ({ ...item, name: t(`${item.key}Severity`) })), [filteredScans, t])
  const detectionTrend = useMemo(() => getDetectionTrend(filteredScans, language), [filteredScans, language])
  const sensorTrends = useMemo(() => getSensorTrends(filteredScans, language), [filteredScans, language])
  const recentAlerts = useMemo(() => getRecentAlerts(filteredScans), [filteredScans])
  const latestScan = filteredScans[0]

  if (scans.length === 0) {
    return (
      <div className="analytics-page">
        <div className="analytics-page-intro"><div><div className="breadcrumb"><span className="breadcrumb-icon"><Leaf size={13} /></span> {t('analytics')}</div><h1>{t('cropAnalytics')}</h1><p>{t('analyticsSubtitle')}</p></div><TimeFilter value={timeFilter} onChange={setTimeFilter} t={t} /></div>
        <div className="analytics-empty"><span className="analytics-empty-icon"><Activity size={25} /></span><h2>{t('noAnalyticsYet')}</h2><p>{t('noAnalyticsDescription')}</p><button className="button button--primary" onClick={() => navigate('/monitor')}>{t('startScan')} <ArrowRight size={16} /></button></div>
      </div>
    )
  }

  return (
    <div className="analytics-page">
      <div className="analytics-page-intro">
        <div><div className="breadcrumb"><span className="breadcrumb-icon"><Leaf size={13} /></span> {t('analytics')}</div><h1>{t('cropAnalytics')}</h1><p>{t('analyticsSubtitle')}</p></div>
        <TimeFilter value={timeFilter} onChange={setTimeFilter} t={t} />
      </div>

      {filteredScans.length === 0 ? (
        <div className="analytics-filter-empty"><CircleAlert size={19} /><span>{t('noAnalyticsForPeriod')}</span></div>
      ) : (
        <>
          <div className="analytics-kpi-grid">
            <KpiCard icon={Activity} label={t('totalScans')} value={kpis.total} tone="neutral" />
            <KpiCard icon={CheckCircle2} label={t('healthyScans')} value={kpis.healthy} tone="healthy" />
            <KpiCard icon={Wrench} label={t('mechanicalStress')} value={kpis.mechanical} tone="mechanical" />
            <KpiCard icon={AlertTriangle} label={t('pestAlerts')} value={kpis.pest} tone="pest" />
            <KpiCard icon={CircleAlert} label={t('highSeverityAlerts')} value={kpis.high} tone="high" />
          </div>

          <div className="analytics-chart-grid">
            <ChartCard eyebrow={t('analyticsOverview')} title={t('detectionOverview')}>
              <div className="analytics-chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={overview} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none">
                      {overview.map((item) => <Cell key={item.key} fill={chartColors[item.key]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ border: '1px solid #dfe6df', borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="analytics-legend">{overview.map((item) => <span key={item.key}><i style={{ background: chartColors[item.key] }} />{item.name}<strong>{item.value}</strong></span>)}</div>
              </div>
            </ChartCard>

            <ChartCard eyebrow={t('pestAnalysis')} title={t('pestSeverity')}>
              {kpis.pest === 0 ? <ChartEmpty t={t} message="noPestAlerts" detail="noPestAlertsDescription" /> : <ResponsiveContainer width="100%" height={250}><BarChart data={severity} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8eee9" /><XAxis dataKey="name" tick={{ fill: '#829188', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: '#829188', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: '1px solid #dfe6df', borderRadius: 8, fontSize: 11 }} /><Bar dataKey="value" name={t('pestAlerts')} radius={[5, 5, 0, 0]}>{severity.map((item) => <Cell key={item.key} fill={chartColors[item.key]} />)}</Bar></BarChart></ResponsiveContainer>}
            </ChartCard>

            <ChartCard eyebrow={t('trendAnalysis')} title={t('detectionTrend')} className="analytics-chart-card--wide">
              {detectionTrend.length === 0 ? <ChartEmpty t={t} message="noScanData" detail="noScanDataDescription" /> : <ResponsiveContainer width="100%" height={255}><BarChart data={detectionTrend} margin={{ top: 10, right: 12, left: 4, bottom: 8 }}><CartesianGrid vertical={false} stroke="#e8eee9" /><XAxis dataKey="label" tick={{ fill: '#829188', fontSize: 10 }} axisLine={false} tickLine={false}><Label value={t('dateAxis')} offset={-2} position="insideBottom" style={{ fill: '#829188', fontSize: 10 }} /></XAxis><YAxis allowDecimals={false} tick={{ fill: '#829188', fontSize: 10 }} axisLine={false} tickLine={false}><Label value={t('scansAxis')} angle={-90} position="insideLeft" style={{ fill: '#829188', fontSize: 10, textAnchor: 'middle' }} /></YAxis><Tooltip content={<DetectionTooltip t={t} />} /><Bar dataKey="healthy" name={t('healthyAssessment')} stackId="detections" fill={chartColors.healthy} /><Bar dataKey="mechanical" name={t('mechanicalAssessment')} stackId="detections" fill={chartColors.mechanical} /><Bar dataKey="pest" name={t('pestAssessment')} stackId="detections" fill={chartColors.pest} /></BarChart></ResponsiveContainer>}
              <div className="analytics-inline-legend"><span><i style={{ background: chartColors.healthy }} />{t('healthyAssessment')}</span><span><i style={{ background: chartColors.mechanical }} />{t('mechanicalAssessment')}</span><span><i style={{ background: chartColors.pest }} />{t('pestAssessment')}</span></div>
            </ChartCard>

            <ChartCard eyebrow={t('sensorTrends')} title={t('temperatureTrend')}>
              <SensorChart data={sensorTrends} dataKey="temperature" color={chartColors.temperature} unit="°C" label={t('temperature')} t={t} />
            </ChartCard>
            <ChartCard eyebrow={t('sensorTrends')} title={t('humidityTrend')}>
              <SensorChart data={sensorTrends} dataKey="humidity" color={chartColors.humidity} unit="%" label={t('humidity')} t={t} />
            </ChartCard>
          </div>

          <div className="analytics-bottom-grid">
            <ChartCard eyebrow={t('fieldSummary')} title={t('currentFieldStatus')} className="analytics-field-card">
              <div className={`analytics-field-status analytics-field-status--${assessmentType(latestScan)}`}><span className="analytics-field-status-icon">{assessmentType(latestScan) === 'healthy' ? <CheckCircle2 size={19} /> : assessmentType(latestScan) === 'mechanical' ? <Wrench size={19} /> : <AlertTriangle size={19} />}</span><div><strong>{t('latestScan')}</strong><p>{t(latestScan.pred_L1 === 'Control' ? 'fieldStatusHealthy' : latestScan.pred_L1 === 'Mechanical' ? 'fieldStatusMechanical' : latestScan.pred_L2 === 'High' ? 'fieldStatusPestHigh' : latestScan.pred_L2 === 'Medium' ? 'fieldStatusPestMedium' : 'fieldStatusPestLow')}</p><small>{formatDate(latestScan.timestamp, language)} · {t(assessmentKey(latestScan))} {latestScan.pred_L2 ? `· ${severityLabel(latestScan, t)}` : ''}</small></div></div>
            </ChartCard>
            <ChartCard eyebrow={t('attentionNeeded')} title={t('recentAlerts')} className="analytics-alerts-card">
              {recentAlerts.length === 0 ? <div className="analytics-no-alerts"><CheckCircle2 size={18} /><span>{t('noAlertsRecorded')}</span></div> : <div className="analytics-alert-list">{recentAlerts.map((scan) => <button key={scan.id} className={`analytics-alert-row analytics-alert-row--${assessmentType(scan)}`} onClick={() => navigate('/history')}><span className="analytics-alert-icon">{assessmentType(scan) === 'mechanical' ? <Wrench size={15} /> : <AlertTriangle size={15} />}</span><span><strong>{t(assessmentKey(scan))}{scan.pred_L2 ? ` · ${severityLabel(scan, t)}` : ''}</strong><small>{formatDate(scan.timestamp, language)} · {t(scan.growthStageKey || 'flowering')} · {t(scan.plotKey || 'plotA')}</small></span><ArrowRight size={14} /></button>)}</div>}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}

function TimeFilter({ value, onChange, t }) {
  return <div className="analytics-time-filter" role="group" aria-label={t('timeFilter')}>{timeFilters.map((filter) => <button key={filter.id} className={value === filter.id ? 'analytics-time-filter--active' : ''} onClick={() => onChange(filter.id)}>{t(filter.labelKey)}</button>)}</div>
}

function DetectionTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null
  const values = payload.reduce((result, item) => ({ ...result, [item.dataKey]: Number(item.value) || 0 }), {})
  const total = (values.healthy || 0) + (values.mechanical || 0) + (values.pest || 0)
  return <div className="analytics-tooltip"><strong>{t('dateAxis')}: {label}</strong><span><i style={{ background: chartColors.healthy }} />{t('healthyAssessment')}: {values.healthy || 0}</span><span><i style={{ background: chartColors.mechanical }} />{t('mechanicalAssessment')}: {values.mechanical || 0}</span><span><i style={{ background: chartColors.pest }} />{t('pestAssessment')}: {values.pest || 0}</span><b>{t('totalScans')}: {total}</b></div>
}

function SensorChart({ data, dataKey, color, unit, label, t }) {
  const hasValue = data.some((point) => point[dataKey] !== null)
  if (!hasValue) return <ChartEmpty t={t} message="sensorNoData" detail="sensorNoDataDescription" />
  const values = data.map((point) => point[dataKey]).filter((value) => value !== null)
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const isFlat = minimum === maximum
  const padding = dataKey === 'humidity' ? 2 : 0.5
  const domain = isFlat ? [minimum - padding, maximum + padding] : ['auto', 'auto']
  return <ResponsiveContainer width="100%" height={220}><LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8eee9" /><XAxis dataKey="label" tick={{ fill: '#829188', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis domain={domain} unit={unit} tick={{ fill: '#829188', fontSize: 10 }} axisLine={false} tickLine={false} /><Line connectNulls={false} type="linear" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} /></LineChart></ResponsiveContainer>
}