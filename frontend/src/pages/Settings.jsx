import { useEffect, useState } from 'react'
import { BellRing, Check, Info, Languages, Radio, Sprout } from 'lucide-react'
import { getPreferences, savePreferences } from '../services/preferences'

const stages = ['seedling', 'vegetative', 'flowering', 'fruiting']

function SettingCard({ icon: Icon, eyebrow, title, children, className = '' }) {
  return (
    <section className={`settings-card ${className}`}>
      <div className="settings-card-heading">
        <span className="settings-card-icon"><Icon size={17} /></span>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

function Toggle({ checked, onChange, label, onText, offText }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`settings-toggle ${checked ? 'settings-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span>{checked ? onText : offText}</span>
      <i />
    </button>
  )
}

export default function Settings({ t, language, setLanguage }) {
  const [preferences, setPreferences] = useState(() => getPreferences())

  useEffect(() => {
    savePreferences(preferences)
  }, [preferences])

  const updatePreference = (key, value) => setPreferences((current) => ({ ...current, [key]: value }))
  const updateNotification = (key, value) => setPreferences((current) => ({
    ...current,
    notifications: { ...current.notifications, [key]: value },
  }))

  return (
    <div className="settings-page">
      <div className="settings-page-heading">
        <div>
          <div className="breadcrumb"><span className="breadcrumb-icon"><Info size={13} /></span> {t('settings')}</div>
          <h1>{t('settings')}</h1>
          <p>{t('settingsSubtitle')}</p>
        </div>
      </div>

      <div className="settings-grid">
        <SettingCard icon={Languages} eyebrow={t('settings')} title={t('language')}>
          <p className="settings-description">{t('languageDescription')}</p>
          <div className="settings-choice-grid settings-choice-grid--language" role="radiogroup" aria-label={t('language')}>
            {[
              { value: 'en', label: t('english') },
              { value: 'hi', label: t('hindi') },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={language === option.value}
                className={`settings-choice ${language === option.value ? 'settings-choice--active' : ''}`}
                onClick={() => setLanguage(option.value)}
              >
                <span>{option.label}</span>
                {language === option.value && <Check size={15} />}
              </button>
            ))}
          </div>
        </SettingCard>

        <SettingCard icon={Sprout} eyebrow={t('settings')} title={t('cropPreferences')}>
          <div className="settings-field">
            <span className="settings-field-label">{t('primaryCrop')}</span>
            <button type="button" className="settings-select settings-select--disabled" disabled>{t(preferences.crop)}</button>
          </div>
          <div className="settings-field settings-field--stage">
            <span className="settings-field-label">{t('growthStage')}</span>
            <div className="settings-stage-list">
              {stages.map((stage) => (
                <button key={stage} type="button" className={`settings-stage ${preferences.growthStage === stage ? 'settings-stage--active' : ''}`} onClick={() => updatePreference('growthStage', stage)}>
                  {t(stage)}
                </button>
              ))}
            </div>
          </div>
        </SettingCard>

        <SettingCard icon={BellRing} eyebrow={t('settings')} title={t('notifications')}>
          <div className="settings-toggle-list">
            <div className="settings-toggle-row">
              <span><strong>{t('highRiskAlerts')}</strong><small>{t('highRiskAlertsDescription')}</small></span>
              <Toggle checked={preferences.notifications.highRiskAlerts} onChange={(value) => updateNotification('highRiskAlerts', value)} label={t('highRiskAlerts')} onText={t('on')} offText={t('off')} />
            </div>
            <div className="settings-toggle-row">
              <span><strong>{t('scanReminders')}</strong><small>{t('scanRemindersDescription')}</small></span>
              <Toggle checked={preferences.notifications.scanReminders} onChange={(value) => updateNotification('scanReminders', value)} label={t('scanReminders')} onText={t('on')} offText={t('off')} />
            </div>
          </div>
        </SettingCard>

        <SettingCard icon={Radio} eyebrow={t('settings')} title={t('monitoring')}>
          <div className="settings-status-list">
            <div><span>{t('sensorSource')}</span><strong>{t('demoSimulator')}</strong></div>
            <div><span>{t('status')}</span><strong className="settings-ready"><i />{t('readyForSimulation')}</strong></div>
          </div>
          <p className="settings-note">{t('settingsSimulatorDescription')}</p>
        </SettingCard>

        <SettingCard icon={Info} eyebrow={t('settings')} title={t('aboutEvilLary')} className="settings-card--about">
          <p className="settings-about-tagline">{t('brandTagline')}</p>
          <p className="settings-about-description">{t('aboutDescription')}</p>
          <span className="settings-version">{t('version')} <strong>{t('versionValue')}</strong></span>
        </SettingCard>
      </div>
    </div>
  )
}