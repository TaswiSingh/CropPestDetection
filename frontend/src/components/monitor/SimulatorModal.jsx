import { FlaskConical, X } from 'lucide-react'
import { sensorDefinitions } from '../../data/mockSensors'

const formatReading = (value, step) => {
  const precision = step < 1 ? String(step).split('.')[1]?.length || 0 : 0
  return Number(value).toFixed(precision)
}

export function SimulatorModal({ t, sensorInput, onSensorInputChange, onPreset, onClose, onStart }) {
  const updateEnvironmental = (field, value) => onSensorInputChange({ ...sensorInput, [field]: Number(value) })
  const updateSensor = (key, value) => onSensorInputChange({ ...sensorInput, sensors: { ...sensorInput.sensors, [key]: Number(value) } })

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="simulator-title">
      <div className="simulator-modal">
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon"><FlaskConical size={20} /></span>
            <div><span className="eyebrow">{t('demoMode')}</span><h2 id="simulator-title">{t('sensorSimulatorTitle')}</h2></div>
          </div>
          <button type="button" onClick={onClose} className="modal-close" aria-label={t('close')}><X size={19} /></button>
        </div>
        <p className="modal-description">{t('simulatorDescription')}</p>
        <div className="simulation-note"><span>i</span>{t('simulationNote')}</div>
        <section className="simulator-section">
          <div className="simulator-section-heading"><span className="scenario-label">{t('environmentalConditions')}</span><small>{t('rawSensorInputs')}</small></div>
          <div className="environmental-controls">
            <label className="sensor-control">
              <span><strong>{t('temperature')}</strong><output>{formatReading(sensorInput.temperature, 0.1)} °C</output></span>
              <input type="range" min="10" max="45" step="0.1" value={sensorInput.temperature} onChange={(event) => updateEnvironmental('temperature', event.target.value)} aria-label={t('temperature')} />
              <small>10–45 °C</small>
            </label>
            <label className="sensor-control">
              <span><strong>{t('humidity')}</strong><output>{formatReading(sensorInput.humidity, 1)} %</output></span>
              <input type="range" min="0" max="100" step="1" value={sensorInput.humidity} onChange={(event) => updateEnvironmental('humidity', event.target.value)} aria-label={t('humidity')} />
              <small>0–100 %</small>
            </label>
          </div>
        </section>
        <section className="simulator-section">
          <div className="simulator-section-heading"><span className="scenario-label">{t('eNoseReadings')}</span><small>{t('rawReadingsOnly')}</small></div>
          <div className="enose-controls">
            {sensorDefinitions.map((sensor) => (
              <label className="sensor-control sensor-control--enose" key={sensor.key}>
                <span><strong>{t(sensor.labelKey)}</strong><output>{formatReading(sensorInput.sensors?.[sensor.key] ?? 0, sensor.step)}</output></span>
                <input type="range" min={sensor.min} max={sensor.max} step={sensor.step} value={sensorInput.sensors?.[sensor.key] ?? sensor.min} onChange={(event) => updateSensor(sensor.key, event.target.value)} aria-label={t(sensor.labelKey)} />
                <small>{sensor.min.toFixed(0)}–{sensor.max.toFixed(0)}</small>
              </label>
            ))}
          </div>
        </section>
        <section className="simulator-section simulator-section--presets">
          <div className="simulator-section-heading"><span className="scenario-label">{t('quickScenarios')}</span><small>{t('presetHelper')}</small></div>
          <div className="preset-list">
            <button type="button" className="preset-button" onClick={() => onPreset('healthy')}>{t('healthyScenario')}</button>
            <button type="button" className="preset-button" onClick={() => onPreset('earlyPest')}>{t('earlyPestScenario')}</button>
            <button type="button" className="preset-button" onClick={() => onPreset('highPest')}>{t('highPestScenario')}</button>
            <button type="button" className="preset-button" onClick={() => onPreset('mechanical')}>{t('mechanicalScenario')}</button>
          </div>
          <p className="preset-footnote">{t('presetInputOnly')}</p>
        </section>
        <div className="modal-footer">
          <button type="button" className="button button--secondary" onClick={onClose}>{t('close')}</button>
          <button type="button" className="button button--primary" onClick={onStart}>{t('runAiAssessment')} <span>→</span></button>
        </div>
      </div>
    </div>
  )
}