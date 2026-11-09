import { useState } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Building2, ChevronDown, ClipboardList, FlaskConical, HelpCircle, LayoutDashboard, LifeBuoy, LogOut, Menu, Network, RotateCcw, Search, Settings as Cog, BarChart3, Users } from 'lucide-react'
import { useApp, ME } from './store.tsx'
import { Logo, Toasts } from './ui.tsx'
import type { Role } from './data.ts'
import Login from './pages/Login.tsx'
import Company from './pages/Company.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Investigations from './pages/Investigations.tsx'
import Workspace from './pages/Workspace.tsx'
import Examinations from './pages/Examinations.tsx'
import Networks from './pages/Networks.tsx'
import Library from './pages/Library.tsx'
import { Buildings, BuildingDetail } from './pages/Buildings.tsx'
import Reports from './pages/Reports.tsx'
import Team from './pages/Team.tsx'
import { Notifications, SettingsPage, Help } from './pages/Misc.tsx'

const NAV: { h?: string; to: string; label: string; icon: typeof Bell }[] = [
  { h: 'Menu utama', to: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard },
  { to: '/investigations', label: 'Investigasi', icon: ClipboardList },
  { to: '/networks', label: 'Jaringan Pipa', icon: Network },
  { to: '/diagnostic-library', label: 'Pustaka Diagnostik', icon: FlaskConical },
  { to: '/reports', label: 'Laporan & Analitik', icon: BarChart3 },
  { h: 'Manajemen', to: '/buildings', label: 'Gedung & Lokasi', icon: Building2 },
  { to: '/team', label: 'Manajemen Tim', icon: Users },
  { h: 'Sistem', to: '/notifications', label: 'Notifikasi', icon: Bell },
  { to: '/settings', label: 'Pengaturan', icon: Cog },
  { to: '/help', label: 'Pusat Bantuan', icon: HelpCircle },
]
const TITLES: Record<string, string> = { dashboard: 'Ringkasan', investigations: 'Investigasi', networks: 'Jaringan Pipa', 'diagnostic-library': 'Pustaka Diagnostik', examinations: 'Catatan Pemeriksaan', reports: 'Laporan & Analitik', buildings: 'Gedung & Lokasi', team: 'Manajemen Tim', notifications: 'Notifikasi', settings: 'Pengaturan', help: 'Pusat Bantuan' }
const ROLES: Role[] = ['Teknisi', 'Supervisor', 'Maintenance Manager', 'Administrator', 'Viewer']

function Layout() {
  const { authed, notifs, building, setBuilding, buildings, role, setRole, logout, reset, inv } = useApp()
  const nav = useNavigate(), loc = useLocation()
  const [open, setOpen] = useState(false), [menu, setMenu] = useState(false), [q, setQ] = useState('')
  if (!authed) return <Navigate to="/login" replace />
  const unread = notifs.filter((n) => !n.read).length
  const awaiting = inv.filter((i) => i.status === 'Menunggu Review').length
  const parts = loc.pathname.split('/').filter(Boolean)
  const go = (e: React.FormEvent) => { e.preventDefault(); nav(`/investigations?q=${encodeURIComponent(q)}`); setQ('') }
  return (
    <div className="app">
      <aside className={`side ${open ? 'open' : ''}`} aria-label="Navigasi utama" onClick={() => setOpen(false)}>
        <div className="brand"><Logo /></div>
        {NAV.map((n) => (
          <div key={n.to}>
            {n.h && <div className="navh">{n.h}</div>}
            <NavLink to={n.to} className={({ isActive }) => `nav ${isActive || (n.to === '/diagnostic-library' && loc.pathname === '/examinations') ? 'on' : ''}`}>
              <n.icon />{n.label}
              {n.to === '/notifications' && unread > 0 && <span className="cnt">{unread}</span>}
              {n.to === '/investigations' && awaiting > 0 && <span className="cnt" style={{ background: 'var(--warn)' }}>{awaiting}</span>}
            </NavLink>
          </div>
        ))}
        <div className="prof">
          <button className="nav" onClick={(e) => { e.stopPropagation(); setMenu(!menu) }} aria-haspopup="menu" aria-expanded={menu}>
            <span className="avatar">AP</span>
            <span style={{ lineHeight: 1.2 }}><b style={{ display: 'block', color: 'var(--navy)', fontSize: 13 }}>{ME}</b><span className="sm faint">{role}</span></span>
            <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
          </button>
          {menu && (
            <div className="menu" style={{ right: 'auto', left: 0, top: 'auto', bottom: 56 }} role="menu" onClick={(e) => e.stopPropagation()}>
              <div className="xs" style={{ padding: '6px 10px' }}>Peran (simulasi demo)</div>
              {ROLES.map((r) => <button key={r} role="menuitem" onClick={() => { setRole(r); setMenu(false) }} style={r === role ? { fontWeight: 700, color: 'var(--teal)' } : {}}>{r}</button>)}
              <hr />
              <button onClick={() => { reset(); setMenu(false) }}><RotateCcw size={15} />Reset data demo</button>
              <button onClick={() => { logout(); nav('/login') }}><LogOut size={15} />Keluar</button>
            </div>
          )}
        </div>
      </aside>
      <div className="main">
        <header className="top">
          <button className="ib menubtn" aria-label="Buka menu" onClick={() => setOpen(true)}><Menu /></button>
          <div className="crumb hide-m">{parts.length > 1 ? <>{TITLES[parts[0]]} / <b>{parts[1]}</b></> : <b>{TITLES[parts[0]] ?? ''}</b>}</div>
          <form onSubmit={go} className="search right" role="search" style={{ flex: '0 1 300px' }}><Search /><input aria-label="Cari investigasi" placeholder="Cari kasus, gedung, teknisi…" value={q} onChange={(e) => setQ(e.target.value)} /></form>
          <select aria-label="Gedung aktif" className="hide-m" value={building} onChange={(e) => setBuilding(e.target.value)} style={{ width: 'auto', maxWidth: 220 }}>{buildings.map((b) => <option key={b.id}>{b.name}</option>)}</select>
          <button className="ib" aria-label="Notifikasi" onClick={() => nav('/notifications')}><Bell />{unread > 0 && <span className="dot" />}</button>
          <button className="ib hide-m" aria-label="Bantuan" onClick={() => nav('/help')}><LifeBuoy /></button>
        </header>
        <main className="page" key={loc.pathname}><Outlet /></main>
      </div>
      <nav className="bnav" aria-label="Navigasi bawah">
        {[['/dashboard', 'Ringkasan', LayoutDashboard], ['/investigations', 'Kasus', ClipboardList], ['/networks', 'Jaringan', Network], ['/notifications', 'Notifikasi', Bell]].map(([to, l, I]) => {
          const Ic = I as typeof Bell
          return <button key={to as string} className={loc.pathname.startsWith(to as string) ? 'on' : ''} onClick={() => nav(to as string)}><Ic />{l as string}</button>
        })}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Company />} />
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/investigations" element={<Investigations />} />
        <Route path="/investigations/:id" element={<Workspace />} />
        <Route path="/examinations" element={<Examinations />} />
        <Route path="/networks" element={<Networks />} />
        <Route path="/diagnostic-library" element={<Library />} />
        <Route path="/buildings" element={<Buildings />} />
        <Route path="/buildings/:id" element={<BuildingDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/team" element={<Team />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
    <Toasts />
    </>
  )
}
