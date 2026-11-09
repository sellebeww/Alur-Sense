import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, RefreshCw, Upload, X, Inbox } from 'lucide-react'
import { SUPPORT, fmt, type DocStatus, type Priority, type Status } from './data.ts'
import { useApp } from './store.tsx'

// Logo resmi (PNG transparan di /public). size = tinggi; text=false → hanya ikon. light → kartu putih agar warna logo tetap terbaca di latar gelap.
export const Logo = ({ size = 38, text = true, light = false }: { size?: number; text?: boolean; light?: boolean }) => {
  const img = <img src={text ? '/logo.png' : '/logo-mark.png'} alt="AlurSense" style={{ display: 'block', height: size, width: 'auto' }} />
  return light ? <span style={{ display: 'inline-flex', alignSelf: 'flex-start', background: '#fff', borderRadius: 14, padding: '10px 18px', boxShadow: '0 6px 20px rgba(0,0,0,.18)' }}>{img}</span> : img
}

const SC: Record<Status, string> = { Draft: '', Berjalan: 'b-info', 'Menunggu Review': 'b-warn', Ditunda: '', Selesai: 'b-ok' }
export const StatusBadge = ({ s }: { s: Status }) => <span className={`badge ${SC[s]}`}>{s}</span>
export const PriorityBadge = ({ p }: { p: Priority }) => <span className={`badge ${p === 'Tinggi' ? 'b-crit' : p === 'Sedang' ? 'b-warn' : ''}`}>{p}</span>
const DS: Record<DocStatus, [string, string]> = { verified: ['Terverifikasi', 'b-teal'], known: ['Terdokumentasi', 'b-info'], unverified: ['Belum terverifikasi', 'b-warn'], unknown: ['Tidak diketahui', ''] }
export const DocBadge = ({ s }: { s: DocStatus }) => <span className={`badge ${DS[s][1]}`}>{DS[s][0]}</span>
export const docLabel = (s: DocStatus) => DS[s][0]
export const SupportBadge = ({ n }: { n: number }) => <span className={`badge ${['', 'b-info', 'b-warn', 'b-ok'][n]}`}>{SUPPORT[n]}</span>
export const dt = fmt

export const PageHeader = ({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) => (
  <div className="ph"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div><div className="row wrap">{children}</div></div>
)
export const DemoBanner = ({ text = 'Semua data di aplikasi ini adalah data fiktif untuk demonstrasi. Tidak ada sensor atau infrastruktur nyata yang terhubung.' }) => (
  <div className="demo"><Info size={15} />{text}</div>
)
export const Notice = ({ kind = 'info', title, children }: { kind?: 'info' | 'warn' | 'crit' | 'ok'; title?: string; children?: ReactNode }) => {
  const I = { info: Info, warn: AlertTriangle, crit: OctagonAlert, ok: CheckCircle2 }[kind]
  return <div className={`notice n-${kind}`} role={kind === 'crit' ? 'alert' : 'status'}><I /><div>{title && <b style={{ display: 'block' }}>{title}</b>}{children}</div></div>
}
export const Tabs = ({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (t: string) => void }) => (
  <div className="tabs" role="tablist">{tabs.map((t) => <button key={t} role="tab" aria-selected={t === value} className={`tab ${t === value ? 'on' : ''}`} onClick={() => onChange(t)}>{t}</button>)}</div>
)
export const Pills = ({ opts, value, onChange }: { opts: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="pills">{opts.map((o) => <button key={o} className={`pill ${o === value ? 'on' : ''}`} aria-pressed={o === value} onClick={() => onChange(o)}>{o}</button>)}</div>
)
export const Field = ({ label, children, error }: { label: string; children: ReactNode; error?: string }) => <label className="f">{label}{children}{error && <span className="err">{error}</span>}</label>
export const SearchBox = ({ value, onChange, ph = 'Cari…' }: { value: string; onChange: (v: string) => void; ph?: string }) => (
  <div className="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg><input aria-label={ph} placeholder={ph} value={value} onChange={(e) => onChange(e.target.value)} /></div>
)
export const Select = ({ value, onChange, opts, label }: { value: string; onChange: (v: string) => void; opts: string[]; label: string }) => (
  <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
)
export const Meter = ({ n, max = 3 }: { n: number; max?: number }) => <span className="meter" aria-hidden>{Array.from({ length: max }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}</span>

export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  return (
    <div className="ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={wide ? { width: 'min(960px,100%)' } : undefined}>
        <header><h3>{title}</h3><button className="ib" aria-label="Tutup" onClick={onClose}><X /></button></header>
        <div className="body">{children}</div>{footer && <footer>{footer}</footer>}
      </div>
    </div>
  )
}
export const Confirm = ({ title, text, onYes, onNo, yes = 'Ya, lanjutkan', danger }: { title: string; text: string; onYes: () => void; onNo: () => void; yes?: string; danger?: boolean }) => (
  <Modal title={title} onClose={onNo} footer={<><button className="btn" onClick={onNo}>Batal</button><button className={`btn ${danger ? 'dng' : 'pri'}`} onClick={onYes}>{yes}</button></>}><p>{text}</p></Modal>
)
export function Toasts() {
  const { toasts, dismiss } = useApp()
  return <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.type === 'ok' ? '' : t.type}`} onClick={() => dismiss(t.id)}>{t.msg}</div>)}</div>
}
export const Empty = ({ title, text, action }: { title: string; text: string; action?: ReactNode }) => <div className="empty"><Inbox size={34} strokeWidth={1.3} /><h3>{title}</h3><p>{text}</p><div style={{ marginTop: 14 }}>{action}</div></div>
export const ErrorState = ({ title, text, retry }: { title: string; text: string; retry: () => void }) => (
  <div className="empty"><OctagonAlert size={34} strokeWidth={1.3} color="var(--crit)" /><h3>{title}</h3><p>{text}</p><div style={{ marginTop: 14 }}><button className="btn" onClick={retry}><RefreshCw />Coba lagi</button></div></div>
)
export const Skel = ({ h = 16, w = '100%' }: { h?: number; w?: string | number }) => <div className="sk" style={{ height: h, width: w }} />
/** Simulasi pemuatan singkat agar skeleton terlihat; data sebenarnya sudah lokal. */
export function useLoading(ms = 450, dep?: unknown) {
  const [l, setL] = useState(true)
  useEffect(() => { setL(true); const t = setTimeout(() => setL(false), ms); return () => clearTimeout(t) }, [ms, dep])
  return l
}
export function FileUpload({ label, accept, onFiles, hint }: { label: string; accept?: string; hint?: string; onFiles: (names: string[]) => void }) {
  const { toast } = useApp()
  const ref = useRef<HTMLInputElement>(null)
  const [names, setNames] = useState<string[]>([])
  const pick = (fl: FileList | null) => {
    if (!fl?.length) return
    const bad = [...fl].find((f) => f.size > 8 * 1024 * 1024)
    if (bad) return toast(`Unggahan gagal: "${bad.name}" melebihi 8 MB.`, 'err')
    const n = [...fl].map((f) => f.name); setNames(n); onFiles(n); toast(`${n.length} berkas dilampirkan (disimpan sebagai referensi, bukan dianalisis otomatis).`)
  }
  return (
    <div>
      <label className="up"><Upload size={22} strokeWidth={1.5} /><div style={{ fontWeight: 600, color: 'var(--navy)' }}>{label}</div><div className="sm">{hint ?? 'Klik untuk memilih berkas (maks. 8 MB)'}</div>
        <input ref={ref} type="file" multiple accept={accept} className="sr" onChange={(e) => pick(e.target.files)} /></label>
      {names.length > 0 && <div className="sm muted" style={{ marginTop: 6 }}>Terlampir: {names.join(', ')}</div>}
    </div>
  )
}
export const Pager = ({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) => (
  <div className="row between" style={{ padding: '12px 16px' }}><span className="sm muted">Halaman {page} dari {pages}</span>
    <div className="row"><button className="btn sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Sebelumnya</button><button className="btn sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Berikutnya</button></div></div>
)
