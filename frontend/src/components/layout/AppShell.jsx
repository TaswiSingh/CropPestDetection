import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, Globe2, LayoutDashboard, LineChart, Map, Menu, Settings, Sprout, X } from 'lucide-react'
import { LogoMark } from '../common/LogoMark'
import { getScans, HISTORY_UPDATED_EVENT } from '../../services/history'
import { getRiskMapData } from '../../services/riskMap'

const READ_NOTIFICATIONS_KEY = 'evil-lary-read-notifications'

function readNotificationState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function writeNotificationState(ids) {
  try {
    window.localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(ids))
  } catch {
    // Storage can be unavailable in restricted previews.
  }
}

function formatNotificationTime(timestamp, language) {
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

export function AppShell({ children, t, language, setLanguage, mobileNavOpen, setMobileNavOpen }) {
  const navigate = useNavigate()
  const location = useLocation()
  const headerRef = useRef(null)
  const [openMenu, setOpenMenu] = useState(null)
  const [scans, setScans] = useState(() => getScans())
  const [readNotificationIds, setReadNotificationIds] = useState(() => readNotificationState())
  const navItems = [
    { to: '/monitor', label: t('liveMonitor'), icon: LayoutDashboard },
    { to: '/history', label: t('scanHistory'), icon: Sprout },
    { to: '/analytics', label: t('analytics'), icon: LineChart },
    { to: '/map', label: t('riskMap'), icon: Map },
    { to: '/settings', label: t('settings'), icon: Settings },
  ]

  useEffect(() => {
    const refreshScans = () => setScans(getScans())
    window.addEventListener(HISTORY_UPDATED_EVENT, refreshScans)
    window.addEventListener('storage', refreshScans)
    return () => {
      window.removeEventListener(HISTORY_UPDATED_EVENT, refreshScans)
      window.removeEventListener('storage', refreshScans)
    }
  }, [])

  useEffect(() => {
    setOpenMenu(null)
  }, [location.pathname])

  useEffect(() => {
    const handleOutsidePointer = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handleOutsidePointer)
    return () => document.removeEventListener('mousedown', handleOutsidePointer)
  }, [])

  const notifications = useMemo(() => {
    const farms = getRiskMapData()
    const riskNotifications = farms
      .filter((farm) => farm.risk === 'high' || farm.risk === 'medium')
      .slice(0, 2)
      .map((farm) => ({
        id: `risk-${farm.id}`,
        tone: farm.risk,
        title: t(farm.risk === 'high' ? 'highPestRiskDetected' : 'moderateRiskDetected'),
        detail: `${farm.name} · ${formatNotificationTime(farm.lastScan, language)}`,
        to: '/map',
      }))
    const latestScan = scans[0]
    if (!latestScan) return riskNotifications
    return [...riskNotifications, {
      id: `scan-${latestScan.id}`,
      tone: 'success',
      title: t('scanCompleted'),
      detail: `${latestScan.plot || t('plotA')} · ${formatNotificationTime(latestScan.timestamp, language)}`,
      to: '/history',
    }]
  }, [language, scans, t])

  const unreadCount = notifications.filter((notification) => !readNotificationIds.includes(notification.id)).length
  const toggleMenu = (menu) => setOpenMenu((current) => current === menu ? null : menu)
  const markNotificationRead = (id) => {
    setReadNotificationIds((current) => {
      if (current.includes(id)) return current
      const next = [...current, id]
      writeNotificationState(next)
      return next
    })
  }
  const markAllRead = () => {
    const ids = notifications.map((notification) => notification.id)
    setReadNotificationIds(ids)
    writeNotificationState(ids)
  }
  const goTo = (path) => {
    setOpenMenu(null)
    navigate(path)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-top">
          <LogoMark />
          <span className="brand-tagline">{t('brandTagline')}</span>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label={t('close')}><X size={20} /></button>
        </div>
        <nav className="side-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
              <Icon size={18} strokeWidth={2} /><span>{label}</span>{to === '/monitor' && <ChevronRight className="nav-arrow" size={16} />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-bottom"><span className="tiny-leaf"><Sprout size={14} /></span><span>VOCguard v0.1</span></div>
        </div>
      </aside>
      {mobileNavOpen && <button className="sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-label={t('close')} />}
      <main className="main-area">
        <header className="top-header">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="header-context"><div className="header-kicker"><span className="online-dot" />{t('connected')} <span className="header-divider" /> {t('allSystemsOperational')}</div></div>
          <div className="header-actions" ref={headerRef}>
            <div className="language-switcher" aria-label={t('language')}>
              <button className={language === 'en' ? 'language-active' : ''} onClick={() => setLanguage('en')}>EN</button>
              <span>/</span>
              <button className={language === 'hi' ? 'language-active' : ''} onClick={() => setLanguage('hi')}>हिंदी</button>
            </div>
            <div className="header-control-wrap">
              <button className={`icon-button notification-button ${openMenu === 'notifications' ? 'header-control--active' : ''}`} aria-label={t('notifications')} aria-expanded={openMenu === 'notifications'} aria-controls="notification-popover" onClick={() => toggleMenu('notifications')}>
                <Bell size={19} />
                {unreadCount > 0 && <span className="notification-unread-dot" />}
              </button>
              {openMenu === 'notifications' && <div id="notification-popover" className="header-popover notification-popover">
                <div className="popover-heading">
                  <div><span className="eyebrow">{t('notifications')}</span><strong>{unreadCount > 0 ? `${unreadCount} ${t('unread')}` : t('allCaughtUp')}</strong></div>
                  {unreadCount > 0 && <button type="button" className="popover-action" onClick={markAllRead}>{t('markAllRead')}</button>}
                </div>
                {notifications.length === 0 ? <div className="popover-empty"><CheckCircle2 size={18} /><span>{t('allCaughtUp')}</span></div> : <div className="notification-list">
                  {notifications.map((notification) => {
                    const isRead = readNotificationIds.includes(notification.id)
                    return <button key={notification.id} type="button" className={`notification-item ${isRead ? 'notification-item--read' : ''}`} onClick={() => { markNotificationRead(notification.id); goTo(notification.to) }}>
                      <span className={`notification-icon notification-icon--${notification.tone}`}>{notification.tone === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}</span>
                      <span><strong>{notification.title}</strong><small>{notification.detail}</small></span>
                      {!isRead && <i className="notification-item-dot" />}
                    </button>
                  })}
                </div>}
              </div>}
            </div>
            <div className="header-control-wrap">
              <button type="button" className={`avatar avatar-button ${openMenu === 'profile' ? 'avatar-button--active' : ''}`} aria-label={t('demoWorkspace')} aria-expanded={openMenu === 'profile'} aria-controls="profile-popover" onClick={() => toggleMenu('profile')}>DR</button>
              {openMenu === 'profile' && <div id="profile-popover" className="header-popover profile-popover">
                <div className="profile-summary"><span className="profile-popover-avatar">DR</span><span><strong>DR</strong><small>{t('demoWorkspace')}</small></span></div>
                <div className="profile-menu-list">
                  <button type="button" onClick={() => goTo('/settings')}><Settings size={15} /><span>{t('settings')}</span></button>
                  <button type="button" onClick={() => { setLanguage(language === 'en' ? 'hi' : 'en'); setOpenMenu(null) }}><Globe2 size={15} /><span>{t('language')}: {t(language === 'en' ? 'hindi' : 'english')}</span></button>
                </div>
                <span className="profile-demo-label">{t('demoWorkspace')}</span>
              </div>}
            </div>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  )
}