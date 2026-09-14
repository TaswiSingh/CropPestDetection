import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleAlert, MapPinned, Minus, Plus, RotateCcw } from 'lucide-react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getRiskMapData } from '../services/riskMap'

const NASHIK_CENTER = [20.0059, 73.7874]
const riskOrder = ['low', 'medium', 'high']
const cropOrder = ['all', 'tomato', 'capsicum']
const riskColors = { low: '#65a779', medium: '#d59a4c', high: '#bd544d' }

function formatScanTime(timestamp, language) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

function riskLabel(risk, t) {
  return t(risk === 'low' ? 'lowRisk' : risk === 'medium' ? 'mediumRisk' : 'highRisk')
}

function predictionLabel(prediction, t) {
  if (prediction === 'Control') return t('healthyCropSignal')
  if (prediction === 'Mechanical') return t('mechanicalStressDetected')
  return t('pestDetected')
}

function statusLabel(status, t) {
  return t(status === 'alert' ? 'alertStatus' : status === 'watch' ? 'watchStatus' : 'clearStatus')
}

function createMarkerIcon(farm, selected) {
  const letter = farm.risk === 'low' ? 'L' : farm.risk === 'medium' ? 'M' : 'H'
  return L.divIcon({
    className: 'risk-leaflet-marker-wrapper',
    html: `<span class="risk-leaflet-marker risk-leaflet-marker--${farm.risk} ${selected ? 'risk-leaflet-marker--selected' : ''}" aria-hidden="true"><b>${letter}</b></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

function MapFocus({ farm }) {
  const map = useMap()
  const firstRender = useRef(true)

  useEffect(() => {
    if (!farm) return
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    map.flyTo([farm.latitude, farm.longitude], Math.max(map.getZoom(), 11), { duration: 0.55 })
  }, [farm, map])

  return null
}

function MapZoomControls({ t }) {
  const map = useMap()

  return (
    <div className="risk-leaflet-controls" aria-label={t('mapControls')}>
      <button type="button" onClick={() => map.zoomIn()} aria-label={t('zoomIn')}><Plus size={15} /></button>
      <button type="button" onClick={() => map.zoomOut()} aria-label={t('zoomOut')}><Minus size={15} /></button>
      <button type="button" onClick={() => map.flyTo(NASHIK_CENTER, 10, { duration: 0.45 })} aria-label={t('resetMap')}><RotateCcw size={14} /></button>
    </div>
  )
}

function FarmNetworkMap({ farms, selectedFarm, onSelect, t }) {
  return (
    <div className="risk-network-map">
      <MapContainer center={NASHIK_CENTER} zoom={10} minZoom={8} maxZoom={16} scrollWheelZoom={false} zoomControl={false} attributionControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocus farm={selectedFarm} />
        <MapZoomControls t={t} />
        {farms.map((farm) => (
          <Marker
            key={farm.id}
            position={[farm.latitude, farm.longitude]}
            icon={createMarkerIcon(farm, selectedFarm?.id === farm.id)}
            alt={`${farm.name}, ${riskLabel(farm.risk, t)}`}
            eventHandlers={{ click: () => onSelect(farm) }}
          />
        ))}
      </MapContainer>
      <div className="risk-map-note"><MapPinned size={12} />{t('demoMapLabel')}</div>
    </div>
  )
}

function RiskLegend({ t }) {
  return (
    <div className="risk-network-legend" aria-label={t('riskLevel')}>
      {riskOrder.map((risk) => <span key={risk}><i style={{ background: riskColors[risk] }} />{riskLabel(risk, t)}</span>)}
    </div>
  )
}

function SummaryStrip({ summary, t }) {
  return (
    <div className="risk-summary-strip" aria-label={t('riskLevel')}>
      <span><strong>{summary.total}</strong> {t('monitoredPlots')}</span>
      <span><i className="risk-dot risk-dot--low" />{summary.low} {t('lowRisk')}</span>
      <span><i className="risk-dot risk-dot--medium" />{summary.medium} {t('mediumRisk')}</span>
      <span><i className="risk-dot risk-dot--high" />{summary.high} {t('highRisk')}</span>
    </div>
  )
}

function MonitoredLocations({ farms, selectedFarm, onSelect, language, t }) {
  return (
    <section className="risk-locations-panel" aria-labelledby="monitored-locations-title">
      <div className="risk-panel-heading">
        <div>
          <span className="eyebrow">{t('monitoredLocations')}</span>
          <h2 id="monitored-locations-title">{farms.length} {t('farms')}</h2>
        </div>
        <span className="risk-location-count">{t('simulated')}</span>
      </div>
      <div className="risk-location-list">
        {farms.length === 0 ? (
          <div className="risk-location-empty"><CircleAlert size={17} /><span>{t('noMatchingLocations')}</span></div>
        ) : farms.map((farm) => (
          <button
            key={farm.id}
            type="button"
            className={`risk-location-row ${selectedFarm?.id === farm.id ? 'risk-location-row--selected' : ''}`}
            onClick={() => onSelect(farm)}
          >
            <span className={`risk-location-dot risk-location-dot--${farm.risk}`} />
            <span className="risk-location-copy">
              <strong>{farm.name}</strong>
              <small>{t(farm.crop.toLowerCase())} · {formatScanTime(farm.lastScan, language)}</small>
            </span>
            <span className={`risk-status risk-status--${farm.status}`}>{statusLabel(farm.status, t)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function SelectedFarm({ farm, language, t }) {
  if (!farm) {
    return <section className="risk-selected-farm risk-selected-farm--empty"><span className="eyebrow">{t('selectedFarm')}</span><p>{t('selectMarkerDescription')}</p></section>
  }

  return (
    <section className={`risk-selected-farm risk-selected-farm--${farm.risk}`}>
      <div className="risk-selected-farm-title">
        <span className="risk-selected-icon"><CircleAlert size={18} /></span>
        <div>
          <span className="eyebrow">{t('selectedFarm')}</span>
          <h2>{farm.name}</h2>
          <p>{t(farm.crop.toLowerCase())} <span>·</span> {t('lastScan')} {formatScanTime(farm.lastScan, language)}</p>
        </div>
      </div>
      <div className="risk-selected-metrics">
        <div><small>{t('latestDetection')}</small><strong>{predictionLabel(farm.prediction, t)}</strong></div>
        <div><small>{t('severity')}</small><strong>{farm.severity ? t(`${farm.severity.toLowerCase()}Severity`) : t('noSeverity')}</strong></div>
        <div><small>{t('signalStatus')}</small><strong>{statusLabel(farm.status, t) === t('alertStatus') ? t('reviewRecommended') : statusLabel(farm.status, t) === t('watchStatus') ? t('monitorSignal') : t('clearSignal')}</strong></div>
      </div>
    </section>
  )
}

export default function RiskMap({ t, language }) {
  const [farms] = useState(() => getRiskMapData())
  const [riskFilter, setRiskFilter] = useState('all')
  const [cropFilter, setCropFilter] = useState('all')
  const [selectedFarm, setSelectedFarm] = useState(farms[0] || null)

  const visibleFarms = useMemo(() => farms.filter((farm) => (
    (riskFilter === 'all' || farm.risk === riskFilter) &&
    (cropFilter === 'all' || farm.crop.toLowerCase() === cropFilter)
  )), [farms, riskFilter, cropFilter])

  const summary = useMemo(() => ({
    total: visibleFarms.length,
    low: visibleFarms.filter((farm) => farm.risk === 'low').length,
    medium: visibleFarms.filter((farm) => farm.risk === 'medium').length,
    high: visibleFarms.filter((farm) => farm.risk === 'high').length,
  }), [visibleFarms])

  useEffect(() => {
    if (!selectedFarm || !visibleFarms.some((farm) => farm.id === selectedFarm.id)) setSelectedFarm(visibleFarms[0] || null)
  }, [selectedFarm, visibleFarms])

  return (
    <div className="risk-map-page">
      <div className="risk-page-heading">
        <div>
          <div className="breadcrumb"><span className="breadcrumb-icon"><MapPinned size={13} /></span> {t('riskMap')}</div>
          <h1>{t('riskMap')}</h1>
          <p>{t('riskMapSubtitle')}</p>
        </div>
        <span className="risk-context-pill"><MapPinned size={13} />{t('maharashtra')}</span>
      </div>

      <div className="risk-toolbar">
        <div className="risk-filter-group">
          <span>{t('riskFilter')}</span>
          <div>{['all', ...riskOrder].map((risk) => <button key={risk} type="button" className={riskFilter === risk ? 'risk-filter--active' : ''} onClick={() => setRiskFilter(risk)}>{risk === 'all' ? t('allRisks') : riskLabel(risk, t)}</button>)}</div>
        </div>
        <div className="risk-filter-group">
          <span>{t('cropFilter')}</span>
          <div>{cropOrder.map((crop) => <button key={crop} type="button" className={cropFilter === crop ? 'risk-filter--active' : ''} onClick={() => setCropFilter(crop)}>{crop === 'all' ? t('allCrops') : t(crop)}</button>)}</div>
        </div>
      </div>

      <SummaryStrip summary={summary} t={t} />

      <section className="risk-dashboard-card">
        <div className="risk-network-panel">
          <div className="risk-panel-heading risk-network-heading">
            <div>
              <span className="eyebrow">{t('liveFieldSignals')}</span>
              <h2>{t('farmNetwork')}</h2>
            </div>
            <RiskLegend t={t} />
          </div>
          <FarmNetworkMap farms={visibleFarms} selectedFarm={selectedFarm} onSelect={setSelectedFarm} t={t} />
        </div>
        <MonitoredLocations farms={visibleFarms} selectedFarm={selectedFarm} onSelect={setSelectedFarm} language={language} t={t} />
      </section>

      <SelectedFarm farm={selectedFarm} language={language} t={t} />
      <p className="risk-map-disclaimer">{t('riskMapDisclaimer')}</p>
    </div>
  )
}