import { Activity, Droplets, Gauge, Thermometer } from 'lucide-react'
import { sensorNames } from '../../data/mockSensors'

export function SensorPanel({ t, payload, progress, status }) {
  const temp = payload?.temperature || 28.4
  const humidity = payload?.humidity || 64
  return (
    <div className="sensor-grid">
      <div className="reading-card"><div className="reading-icon reading-icon--blue"><Thermometer size={18} /></div><span>{t('temperature')}</span><strong>{temp.toFixed(1)}<small>°C</small></strong><em><span className="mini-pulse" />{status === 'collecting' ? t('readingLive') : t('liveData')}</em></div>
      <div className="reading-card"><div className="reading-icon reading-icon--teal"><Droplets size={18} /></div><span>{t('humidity')}</span><strong>{humidity}<small>% RH</small></strong><em><span className="mini-pulse" />{status === 'collecting' ? t('readingLive') : t('liveData')}</em></div>
      <div className="reading-card"><div className="reading-icon reading-icon--green"><Activity size={18} /></div><span>{t('eNose')}</span><strong className="reading-status">{t('connectedStatus')}</strong><em><span className="mini-pulse" />{t('sensorReadings')}</em></div>
      <div className="collection-card"><div className="collection-top"><span><Gauge size={16} /> {t('collecting')}</span><strong>{progress}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div><div className="channel-grid">{sensorNames.map((name) => <span className="channel-chip" key={name}><span />{name}</span>)}</div><div className="collection-foot"><span>{sensorNames.length} {t('sensorChannels')}</span><span>{t('complete')}</span></div></div>
    </div>
  )
}