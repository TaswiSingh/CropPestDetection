import { Sprout } from 'lucide-react'

export function LogoMark({ compact = false }) {
  return (
    <div className={`logo-lockup ${compact ? 'logo-lockup--compact' : ''}`}>
      <span className="logo-mark"><Sprout size={compact ? 17 : 21} strokeWidth={2.4} /></span>
      <span className="logo-word">VOCguard</span>
    </div>
  )
}