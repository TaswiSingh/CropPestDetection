const STORAGE_KEY = 'evil-lary-settings'

export const defaultPreferences = {
  crop: 'tomato',
  growthStage: 'flowering',
  notifications: {
    highRiskAlerts: true,
    scanReminders: true,
  },
}

export function getPreferences() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    return {
      ...defaultPreferences,
      ...stored,
      notifications: {
        ...defaultPreferences.notifications,
        ...(stored?.notifications || {}),
      },
    }
  } catch {
    return defaultPreferences
  }
}

export function savePreferences(preferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}