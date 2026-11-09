import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, ChevronDown, ClipboardCheck, Droplets, FileSearch, Layers, Menu, ShieldCheck, Sparkles, Target, Users, X } from 'lucide-react'
import { EXAMS, IMPACT, EFFORT, SEED_NET, type DocStatus } from '../data.ts'
import { EFFORT_W, IMPACT_W } from '../engine.ts'
import { DocBadge, Logo } from '../ui.tsx'
import './company.css'

/* ---------- hooks kecil ---------- */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null), [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setSeen(true)
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, seen] as const
}
const Reveal = ({ children, d = 0, className = '' }: { children: ReactNode; d?: number; className?: string }) => {
  const [ref, seen] = useInView<HTMLDivElement>()
  return <div ref={ref} className={`cp-rv ${seen ? 'in' : ''} ${className}`} style={{ transitionDelay: `${d}ms` }}>{children}</div>
}
function Count({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>(), [n, setN] = useState(0)
  useEffect(() => {
    if (!seen) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(to)
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => { const p = Math.min((t - t0) / 1100, 1); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to])
  return <span ref={ref}>{n}{suffix}</span>
}

/* ---------- konten (satu sumber, mudah diubah) ---------- */
const NAV = [['tentang', 'Tentang'], ['cara-kerja', 'Cara Kerja'], ['simulasi', 'Simulasi'], ['pemeriksaan', 'Pemeriksaan'], ['prinsip', 'Prinsip'], ['faq', 'FAQ']] as const
const STEPS = [
  { icon: BookOpenCheck, t: 'Petakan jaringan', d: 'Catat elemen pipa beserta status dokumentasinya: terverifikasi, terdokumentasi, belum terverifikasi, atau tidak diketahui. Ketidakpastian ditampilkan, bukan disembunyikan.' },
  { icon: ClipboardCheck, t: 'Buka investigasi', d: 'Catat gejala, lokasi, dan bukti awal. Sistem menyusun hipotesis bersaing beserta tingkat dukungan buktinya.' },
  { icon: Target, t: 'Pilih pemeriksaan berikutnya', d: 'Rekomendasi diurutkan menurut seberapa besar pemeriksaan itu mengurangi ketidakpastian, dibandingkan upaya dan dampaknya.' },
  { icon: ShieldCheck, t: 'Review & dokumentasikan', d: 'Hasil ditinjau supervisor, hipotesis diperbarui, dan seluruh keputusan tercatat di linimasa serta log audit.' },
]
const ROLES = [['Teknisi', 'Mencatat temuan dan menjalankan pemeriksaan.'], ['Supervisor', 'Meninjau hasil dan menyetujui pemeriksaan berisiko.'], ['Maintenance Manager', 'Memantau kasus, prioritas, dan tren antar gedung.'], ['Administrator', 'Mengelola tim, gedung, dan pengaturan organisasi.'], ['Viewer', 'Akses baca untuk pemangku kepentingan.']]
const PRINCIPLES = [
  { icon: Layers, t: 'Jujur soal ketidakpastian', d: 'Setiap elemen jaringan membawa status dokumentasi. Rekomendasi tidak berpura-pura tahu lebih dari datanya.' },
  { icon: FileSearch, t: 'Berbasis bukti', d: 'Hipotesis dinilai dari bukti yang mendukung, melemahkan, atau belum ada, dan bisa ditelusuri ke sumbernya.' },
  { icon: ShieldCheck, t: 'Manusia tetap memutuskan', d: 'Pemeriksaan berdampak layanan wajib melalui otorisasi supervisor. Sistem menyarankan, tim yang menentukan.' },
  { icon: Users, t: 'Dibuat untuk tim lapangan', d: 'Bahasa Indonesia, alur ringkas, dan tampilan yang tetap nyaman dipakai di ponsel.' },
]
const FAQ = [
  ['Apakah AlurSense memerlukan sensor khusus?', 'Tidak. AlurSense bekerja dari catatan, dokumentasi, dan hasil pemeriksaan yang sudah dilakukan tim Anda. Data sensor eksisting dapat ditinjau bila tersedia.'],
  ['Apakah data pada demo itu nyata?', 'Bukan. Seluruh data di demo adalah fiktif dan tidak ada infrastruktur nyata yang terhubung. Demo hanya memperlihatkan alur kerja dan tampilannya.'],
  ['Apakah AlurSense memutuskan lokasi kebocoran?', 'Tidak. AlurSense membantu memilih pemeriksaan berikutnya yang paling informatif. Keputusan akhir dan otorisasi tetap di tangan personel berkualifikasi.'],
  ['Siapa yang cocok memakainya?', 'Tim pemeliharaan dan facility management yang mengelola gedung dengan dokumentasi jaringan pipa yang sebagian atau belum lengkap.'],
  ['Bagaimana cara mencobanya?', 'Tekan "Coba Demo". Kredensial sudah terisi dan Anda bisa berganti peran untuk melihat tampilan tiap pengguna.'],
]

/* ---------- jaringan interaktif (hero) ---------- */
const NODES: { id: string; x: number; y: number; s: DocStatus; n: string }[] = [
  { id: 'a', x: 40, y: 250, s: 'verified', n: 'Meter induk' },
  { id: 'b', x: 150, y: 250, s: 'verified', n: 'Katup utama' },
  { id: 'c', x: 150, y: 150, s: 'known', n: 'Riser A' },
  { id: 'd', x: 290, y: 150, s: 'unverified', n: 'Percabangan Lt.2' },
  { id: 'e', x: 290, y: 60, s: 'known', n: 'Toilet Lt.3' },
  { id: 'f', x: 400, y: 150, s: 'unknown', n: 'Koneksi tidak diketahui' },
  { id: 'g', x: 290, y: 250, s: 'unverified', n: 'Pantry Lt.1' },
  { id: 'h', x: 420, y: 250, s: 'known', n: 'Pompa' },
]
const SEGS = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['d', 'f'], ['b', 'g'], ['g', 'h']]
const COL: Record<DocStatus, string> = { verified: '#0A6ED1', known: '#5686B4', unverified: '#D69B38', unknown: '#8E9CB1' }
const LABEL: Record<DocStatus, string> = { verified: 'Terverifikasi', known: 'Terdokumentasi', unverified: 'Belum terverifikasi', unknown: 'Tidak diketahui' }

function HeroNet() {
  const [f, setF] = useState<DocStatus | null>(null), [hov, setHov] = useState<string | null>(null)
  const by = Object.fromEntries(NODES.map((n) => [n.id, n]))
  const on = (s: DocStatus) => !f || f === s
  const h = hov ? by[hov] : null
  return (
    <div className="cp-net card">
      <div className="cp-net-h"><span className="xs">Jaringan contoh · data fiktif</span><span className="badge b-info">Hipotesis A · dukungan sedang</span></div>
      <svg viewBox="0 0 460 300" role="img" aria-label="Diagram contoh jaringan pipa dengan status dokumentasi tiap elemen">
        <defs><radialGradient id="cp-g"><stop offset="0" stopColor="#5BB6F5" stopOpacity=".5" /><stop offset="1" stopColor="#5BB6F5" stopOpacity="0" /></radialGradient></defs>
        <circle className="cp-pulse" cx="220" cy="150" r="46" fill="url(#cp-g)" />
        {SEGS.map(([a, b]) => {
          const p = by[a], q = by[b], dim = !(on(p.s) || on(q.s))
          return <g key={a + b} opacity={dim ? 0.15 : 1}>
            <path d={`M${p.x} ${p.y}L${q.x} ${q.y}`} stroke="#CFE0E3" strokeWidth="7" strokeLinecap="round" />
            <path className="cp-flow" d={`M${p.x} ${p.y}L${q.x} ${q.y}`} stroke="#5BB6F5" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 11" />
          </g>
        })}
        {NODES.map((n) => (
          <g key={n.id} opacity={on(n.s) ? 1 : 0.2} tabIndex={0} onMouseEnter={() => setHov(n.id)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(n.id)} onBlur={() => setHov(null)} style={{ cursor: 'pointer', outline: 'none' }}>
            <circle cx={n.x} cy={n.y} r={hov === n.id ? 13 : 10} fill="#fff" stroke={COL[n.s]} strokeWidth="3.5" style={{ transition: 'r .15s' }} />
            <circle cx={n.x} cy={n.y} r="3.5" fill={COL[n.s]} />
          </g>
        ))}
        {h && <g pointerEvents="none"><rect x={Math.min(Math.max(h.x - 80, 4), 296)} y={h.y - 52} width="160" height="34" rx="8" fill="#0E2A55" />
          <text x={Math.min(Math.max(h.x - 80, 4), 296) + 80} y={h.y - 38} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">{h.n}</text>
          <text x={Math.min(Math.max(h.x - 80, 4), 296) + 80} y={h.y - 25} textAnchor="middle" fill="#5BB6F5" fontSize="10">{LABEL[h.s]}</text></g>}
      </svg>
      <div className="pills" role="group" aria-label="Saring menurut status dokumentasi">
        {(Object.keys(LABEL) as DocStatus[]).map((s) => (
          <button key={s} className={`pill ${f === s ? 'on' : ''}`} aria-pressed={f === s} onClick={() => setF(f === s ? null : s)}>
            <i className="cp-dot" style={{ background: COL[s] }} />{LABEL[s]}
          </button>))}
      </div>
    </div>
  )
}

/* ---------- simulator mesin rekomendasi (rumus sama dengan engine.ts, model ilustratif) ---------- */
type U = { temporal: number; topology: number; spatial: number }
const SLIDERS: [keyof U, string, string][] = [['temporal', 'Pola waktu anomali', 'Kapan anomali terjadi belum jelas'], ['topology', 'Topologi jaringan', 'Gambar pipa belum lengkap / usang'], ['spatial', 'Lokasi kebocoran', 'Beberapa dugaan lokasi saling bersaing']]
const PRESETS: [string, U][] = [['Gambar pipa usang', { temporal: 25, topology: 90, spatial: 45 }], ['Pola waktu misterius', { temporal: 90, topology: 20, spatial: 40 }], ['Banyak dugaan lokasi', { temporal: 20, topology: 25, spatial: 95 }], ['Hampir pasti', { temporal: 5, topology: 5, spatial: 10 }]]
const ROW = 64
function Simulator() {
  const [u, setU] = useState<U>(PRESETS[2][1])
  const rows = EXAMS.filter((e) => e.avail !== 'unavailable').map((e) => {
    const gain = (Object.keys(u) as (keyof U)[]).reduce((t, k) => t + e.w[k] * (u[k] / 100), 0)
    return { e, gain, value: Math.round((gain - e.effort * EFFORT_W - e.impact * IMPACT_W) * 10) / 10 }
  })
  const order = [...rows].sort((a, b) => b.value - a.value).map((r) => r.e.id)
  const top = rows.find((r) => r.e.id === order[0])!
  const maxV = Math.max(...rows.map((r) => r.value), 1)
  const flat = top.value < 1
  return (
    <div className="cp-sim">
      <div className="card cp-sim-ctl">
        <div className="row between wrap"><h3>Seberapa yakin tim Anda?</h3><span className="xs">Geser untuk mengubah</span></div>
        <div className="pills" role="group" aria-label="Contoh skenario">
          {PRESETS.map(([l, v]) => <button key={l} className={`pill ${JSON.stringify(v) === JSON.stringify(u) ? 'on' : ''}`} onClick={() => setU(v)}>{l}</button>)}
        </div>
        {SLIDERS.map(([k, l, d]) => (
          <label key={k} className="cp-sl"><span className="row between"><b>{l}</b><em>{u[k]}%</em></span>
            <input type="range" min={0} max={100} value={u[k]} onChange={(e) => setU({ ...u, [k]: +e.target.value })} style={{ ['--v' as string]: `${u[k]}%` }} />
            <span className="sm faint">{d}</span></label>))}
        <p className="sm faint">Model ilustratif seperti di aplikasi: nilai = perolehan informasi − penalti upaya − penalti dampak. Pemeriksaan tanpa peralatan terhubung tidak ikut dihitung.</p>
      </div>
      <div className="card cp-sim-out" aria-live="polite">
        <div className="row between wrap"><h3>Pemeriksaan yang disarankan</h3><span className={`badge ${flat ? 'b-warn' : 'b-teal'}`}>{flat ? 'Informasi tambahan rendah' : `Teratas: ${top.e.name}`}</span></div>
        <div className="cp-bars" style={{ height: rows.length * ROW }}>
          {rows.map((r) => {
            const i = order.indexOf(r.e.id)
            return (
              <div key={r.e.id} className={`cp-bar ${i === 0 && !flat ? 'lead' : ''}`} style={{ transform: `translateY(${i * ROW}px)` }}>
                <span className="cp-rank">{i + 1}</span>
                <div className="grow"><div className="row between"><b>{r.e.name}</b><em>{r.value}</em></div>
                  <div className="cp-track"><i style={{ width: `${Math.max(r.value, 0) / maxV * 100}%` }} /></div></div>
              </div>)
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------- halaman ---------- */
export default function Company() {
  const [step, setStep] = useState(0), [auto, setAuto] = useState(true), [menu, setMenu] = useState(false), [solid, setSolid] = useState(false)
  const [exam, setExam] = useState(EXAMS[0].id), [faq, setFaq] = useState<number | null>(0)
  const [active, setActive] = useState('')
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => { document.title = 'AlurSense — Diagnostik Jaringan Pipa Gedung' }, [])
  useEffect(() => { const f = () => { setSolid(scrollY > 12); const h = document.documentElement.scrollHeight - innerHeight; if (bar.current) bar.current.style.transform = `scaleX(${h > 0 ? Math.min(scrollY / h, 1) : 0})` }; f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  useEffect(() => {
    const els = NAV.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!auto || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 5000)
    return () => clearInterval(t)
  }, [auto])

  const ex = EXAMS.find((e) => e.id === exam)!
  const S = STEPS[step]
  const go = (id: string) => { setMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const glow = (e: React.MouseEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`) }

  return (
    <div className="cp">
      <header className={`cp-nav ${solid ? 'solid' : ''}`}>
        <div className="cp-progress" ref={bar} aria-hidden="true" />
        <div className="cp-wrap cp-nav-in">
          <a href="#/" aria-label="AlurSense, ke atas" onClick={(e) => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }) }}><Logo /></a>
          <nav className={`cp-links ${menu ? 'open' : ''}`} aria-label="Navigasi halaman">
            {NAV.map(([id, l]) => <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined} onClick={(e) => { e.preventDefault(); go(id) }}>{l}</a>)}
          </nav>
          <div className="row">
            <Link to="/login" className="btn pri">Coba Demo <ArrowRight /></Link>
            <button className="ib cp-burger" aria-label={menu ? 'Tutup menu' : 'Buka menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>

      <section className="cp-hero" onMouseMove={glow}>
        <div className="cp-wrap cp-hero-in">
          <div>
            <span className="badge b-teal cp-rise">Diagnostik jaringan pipa gedung</span>
            <h1 className="cp-h1 cp-rise" style={{ animationDelay: '.07s' }}>Ketahui langkah berikutnya. <em>Tentukan lokasi dengan yakin.</em></h1>
            <p className="cp-lead cp-rise" style={{ animationDelay: '.14s' }}>AlurSense membantu tim pemeliharaan menyelidiki kebocoran pipa secara sistematis, memahami ketidakpastian jaringan, dan memilih pemeriksaan diagnostik yang paling berguna.</p>
            <div className="row wrap cp-rise" style={{ animationDelay: '.21s', marginTop: 24 }}>
              <Link to="/login" className="btn pri cp-big">Coba Demo <ArrowRight /></Link>
              <a href="#cara-kerja" className="btn cp-big" onClick={(e) => { e.preventDefault(); go('cara-kerja') }}>Lihat cara kerja</a>
            </div>
            <p className="sm faint cp-rise" style={{ animationDelay: '.28s', marginTop: 14 }}>Demo memakai data fiktif. Tidak ada sensor atau infrastruktur nyata yang terhubung.</p>
          </div>
          <div className="cp-rise cp-hero-r" style={{ animationDelay: '.2s' }}>
            <HeroNet />
            <div className="cp-float f1"><Sparkles size={15} /><span><b>Rekomendasi #1</b>Survei akustik non-invasif</span></div>
            <div className="cp-float f2"><Droplets size={15} /><span><b>Dukungan sedang</b>Hipotesis A · 3 bukti</span></div>
          </div>
        </div>
        <div className="cp-wrap cp-stats">
          {[[EXAMS.length, '', 'jenis pemeriksaan terstruktur'], [4, '', 'status dokumentasi per elemen'], [5, '', 'peran pengguna'], [SEED_NET.length, '', 'elemen jaringan di demo']].map(([n, s, l]) => (
            <div key={l as string}><b><Count to={n as number} suffix={s as string} /></b><span>{l}</span></div>))}
        </div>
      </section>

      <section id="tentang" className="cp-sec">
        <div className="cp-wrap cp-two">
          <Reveal><span className="xs">Tentang kami</span><h2 className="cp-h2">Kebocoran sulit dicari karena petanya tidak pernah lengkap.</h2></Reveal>
          <Reveal d={90}>
            <p className="cp-p">Di banyak gedung, gambar pipa sudah usang, renovasi tidak tercatat, dan pencarian bergantung pada ingatan teknisi senior. Akibatnya inspeksi diulang, area dibongkar tanpa kepastian, dan pengetahuan hilang saat orang berganti.</p>
            <p className="cp-p">AlurSense menjadikan proses itu terstruktur: tiap dugaan punya bukti, tiap pemeriksaan punya alasan, dan tiap keputusan tercatat. Hasilnya, tim tahu apa yang sudah pasti, apa yang belum, dan apa yang paling layak diperiksa berikutnya.</p>
          </Reveal>
        </div>
      </section>

      <section id="cara-kerja" className="cp-sec cp-alt">
        <div className="cp-wrap">
          <Reveal><span className="xs">Cara kerja</span><h2 className="cp-h2">Dari gejala ke keputusan, empat langkah.</h2></Reveal>
          <div className="cp-steps">
            <div className="cp-step-list" role="tablist" aria-label="Langkah kerja">
              {STEPS.map((s, i) => (
                <button key={s.t} role="tab" aria-selected={i === step} className={`cp-step ${i === step ? 'on' : ''}`} onClick={() => { setStep(i); setAuto(false) }}>
                  <span className="cp-num">{i + 1}</span><b>{s.t}</b>
                  {i === step && auto && <i className="cp-prog" key={step} />}
                </button>))}
            </div>
            <div className="card cp-step-body" role="tabpanel" key={step}>
              <div className="cp-ic"><S.icon /></div>
              <h3>{S.t}</h3><p className="muted">{S.d}</p>
              <div className="row between" style={{ marginTop: 'auto' }}>
                <span className="xs">Langkah {step + 1} dari {STEPS.length}</span>
                <button className="btn sm" onClick={() => setAuto(!auto)}>{auto ? 'Jeda' : 'Putar otomatis'}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="simulasi" className="cp-sec">
        <div className="cp-wrap">
          <Reveal><span className="xs">Coba langsung</span><h2 className="cp-h2">Ubah tingkat keyakinan, lihat saran berikutnya berubah.</h2>
            <p className="cp-p" style={{ maxWidth: 640 }}>Inilah inti AlurSense: pemeriksaan disarankan bukan karena kebiasaan, tetapi karena paling mengurangi ketidakpastian yang tersisa.</p></Reveal>
          <Reveal d={80}><Simulator /></Reveal>
        </div>
      </section>

      <section id="pemeriksaan" className="cp-sec cp-alt">
        <div className="cp-wrap">
          <Reveal><span className="xs">Pustaka diagnostik</span><h2 className="cp-h2">Enam jenis pemeriksaan, masing-masing dengan batasannya.</h2>
            <p className="cp-p" style={{ maxWidth: 640 }}>Dari tinjauan dokumen sampai pemeriksaan terkendali yang butuh otorisasi. Setiap pemeriksaan menyebutkan tujuan, kebutuhan, dan keterbatasannya secara terbuka.</p></Reveal>
          <div className="cp-exam">
            <div className="cp-exam-list" role="tablist" aria-label="Jenis pemeriksaan">
              {EXAMS.map((e) => <button key={e.id} role="tab" aria-selected={e.id === exam} className={`cp-ex ${e.id === exam ? 'on' : ''}`} onClick={() => setExam(e.id)}>{e.name}</button>)}
            </div>
            <div className="card cp-exam-body" role="tabpanel" key={exam}>
              <h3>{ex.name}</h3><p className="muted">{ex.desc}</p>
              <dl className="kv" style={{ marginTop: 14 }}>
                <dt>Tujuan</dt><dd>{ex.purpose}</dd><dt>Kebutuhan</dt><dd>{ex.requires}</dd><dt>Keluaran</dt><dd>{ex.output}</dd><dt>Batasan</dt><dd>{ex.limits}</dd>
              </dl>
              <div className="row wrap" style={{ marginTop: 14 }}>
                <span className="badge">Upaya: {EFFORT[ex.effort]}</span><span className="badge">Dampak: {IMPACT[ex.impact]}</span>
                {ex.auth && <span className="badge b-warn">Perlu otorisasi</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="prinsip" className="cp-sec cp-dark">
        <div className="cp-wrap">
          <Reveal><span className="xs" style={{ color: '#5BB6F5' }}>Prinsip kami</span><h2 className="cp-h2" style={{ color: '#fff' }}>Alat yang tahu batas pengetahuannya.</h2></Reveal>
          <div className="cp-grid4">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.t} d={i * 80}><div className="cp-pr" onMouseMove={glow}><div className="cp-ic dark"><p.icon /></div><h3>{p.t}</h3><p>{p.d}</p></div></Reveal>))}
          </div>
          <Reveal><div className="cp-doc"><span className="sm" style={{ color: '#BFD0EA' }}>Status dokumentasi yang dipakai di seluruh aplikasi:</span>
            {(['verified', 'known', 'unverified', 'unknown'] as DocStatus[]).map((s) => <DocBadge key={s} s={s} />)}</div></Reveal>
        </div>
      </section>

      <section className="cp-sec">
        <div className="cp-wrap">
          <Reveal><span className="xs">Untuk seluruh tim</span><h2 className="cp-h2">Setiap peran melihat yang ia perlukan.</h2></Reveal>
          <div className="cp-roles">
            {ROLES.map(([r, d], i) => <Reveal key={r} d={i * 60}><div className="card cp-role"><b>{r}</b><p className="sm muted">{d}</p></div></Reveal>)}
          </div>
        </div>
      </section>

      <section id="faq" className="cp-sec cp-alt">
        <div className="cp-wrap cp-two">
          <Reveal><span className="xs">FAQ</span><h2 className="cp-h2">Pertanyaan yang sering muncul.</h2></Reveal>
          <div>
            {FAQ.map(([q, a], i) => (
              <div key={q} className={`cp-q ${faq === i ? 'on' : ''}`}>
                <button aria-expanded={faq === i} aria-controls={`faq-${i}`} onClick={() => setFaq(faq === i ? null : i)}>{q}<ChevronDown /></button>
                <div id={`faq-${i}`} className="cp-a"><div><p>{a}</p></div></div>
              </div>))}
          </div>
        </div>
      </section>

      <section className="cp-cta">
        <i className="cp-rip" /><i className="cp-rip r2" /><i className="cp-rip r3" />
        <div className="cp-wrap" style={{ position: 'relative' }}><Reveal><h2 className="cp-h2" style={{ color: '#fff' }}>Lihat sendiri bagaimana investigasi berjalan.</h2>
          <p style={{ color: '#BFD0EA', margin: '8px 0 22px' }}>Masuk ke dasbor demo dengan data fiktif. Kredensial sudah terisi.</p>
          <Link to="/login" className="btn cp-big" style={{ background: '#fff' }}>Coba Demo <ArrowRight /></Link></Reveal></div>
      </section>

      <footer className="cp-foot"><div className="cp-wrap row between wrap"><Logo size={32} /><span className="sm faint">© {new Date().getFullYear()} AlurSense. Semua data pada demo adalah fiktif.</span></div></footer>
    </div>
  )
}
