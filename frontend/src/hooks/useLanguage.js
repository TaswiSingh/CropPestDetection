import { useCallback, useEffect, useState } from 'react'
import { t } from '../utils/translations'

export function useLanguage() {
  const [language, setLanguage] = useState(() => localStorage.getItem('evil-lary-language') || 'en')

  useEffect(() => {
    localStorage.setItem('evil-lary-language', language)
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en'
  }, [language])

  const translate = useCallback((key) => t(language, key), [language])
  return { language, setLanguage, t: translate }
}