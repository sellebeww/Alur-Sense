import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, FileText, Printer, Share2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../store.tsx'
import { DemoBanner, Logo, Modal, Notice, PageHeader, StatusBadge, Tabs, dt } from '../ui.tsx'
import { completeness, exDef, SUPPORT, type Inv } from '../data.ts'
import { recommend } from '../engine.ts'

const SIM = [{ n: 'Pemeriksaan / kasus', sebelum: 6.1, sesudah: 4.2 }, { n: 'Jam / kasus', sebelum: 14, sesudah: 11 }, { n: 'Pemeriksaan berulang', sebelum: 2.3, sesudah: 1.1 }]

export default function Reports() {
  const { inv } = useApp()
  const [sp] = useSearchParams()
  const [tab, setTab] = useState(sp.get('case') ? 'Buat Laporan' : 'Analitik'), [sel, setSel] = useState(sp.get('case') ?? 'AS-0261')
  const nav = useNavigate()
  const done = inv.filter((i) => i.status === 'Selesai')
  const kpi = [['Total investigasi', inv.length], ['Rata-rata durasi (hari, contoh)', '6,4'], ['Rata-rata pemeriksaan / investigasi', '4,2'], ['Selesai', done.length], ['Menunggu review', inv.filter((i) => i.status === 'Menunggu Review').length], ['Pemeriksaan berulang (contoh)', 7], ['Dengan dokumentasi tidak lengkap', inv.filter((i) => i.building !== 'Gedung Sentra Utama' || i.status !== 'Selesai').length]]
  return (
    <>
      <PageHeader title="Laporan & Analitik" sub="Pantau kinerja operasional dan susun laporan investigasi." />
      <Tabs tabs={['Analitik', 'Laporan Investigasi', 'Buat Laporan']} value={tab} onChange={setTab} />
      {tab === 'Analitik' && <div className="col" style={{ gap: 16 }}>
        <DemoBanner text="Grafik efisiensi di bawah memakai data simulasi untuk demonstrasi. Belum ada bukti terukur bahwa AlurSense telah meningkatkan efisiensi; angka tidak boleh dikutip sebagai hasil nyata." />
        <div className="grid g4">{kpi.map(([l, v]) => <div className="card" key={String(l)}><p className="sm muted">{l}</p><b style={{ font: '800 26px Manrope' }}>{v}</b></div>)}</div>
        <div className="card"><h3>Efisiensi Diagnostik — alur terstruktur vs. sebelumnya <span className="badge b-warn">Data simulasi</span></h3>
          <div style={{ height: 280, marginTop: 10 }}><ResponsiveContainer><BarChart data={SIM}><CartesianGrid stroke="#E0E8F2" vertical={false} /><XAxis dataKey="n" fontSize={12} tickLine={false} /><YAxis fontSize={11} axisLine={false} tickLine={false} /><Tooltip /><Legend /><Bar name="Sebelum (simulasi)" dataKey="sebelum" fill="#8E9CB1" radius={[4, 4, 0, 0]} /><Bar name="Dengan alur terstruktur (simulasi)" dataKey="sesudah" fill="#0A6ED1" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          <p className="sm faint">&ldquo;Pemeriksaan yang tidak perlu dihindari&rdquo; tidak ditampilkan karena memerlukan data evaluasi tervalidasi.</p></div></div>}
      {tab === 'Laporan Investigasi' && <div className="grid g3">{inv.slice(0, 9).map((i) => <div key={i.id} className="card col" style={{ gap: 6 }}><div className="row between"><b>{i.id}</b><StatusBadge s={i.status} /></div><h4>{i.title}</h4><p className="sm muted">{i.building} · {dt(i.created)} · {i.tech}</p>
        <p className="sm"><span className="xs">Hasil diagnostik </span>{i.outcome ?? 'Belum ada kesimpulan terkonfirmasi'}</p><button className="btn sm" style={{ marginTop: 'auto' }} onClick={() => { setSel(i.id); setTab('Buat Laporan') }}><FileText />Buat laporan</button></div>)}</div>}
      {tab === 'Buat Laporan' && <Generator id={sel} setId={setSel} onOpen={() => nav(`/investigations/${sel}`)} />}
    </>
  )
}

function Generator({ id, setId }: { id: string; setId: (s: string) => void; onOpen: () => void }) {
  const { inv, net, users, toast } = useApp()
  const [share, setShare] = useState(false), [prev, setPrev] = useState(true)
  const it = inv.find((i) => i.id === id)!
  const st = useMemo(() => recommend(it, net), [it, net])
  const exp = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ catatan: 'Data demonstrasi fiktif', investigasi: it, jaringan: net }, null, 2)], { type: 'application/json' })); a.download = `${it.id}.json`; a.click(); toast('Data diekspor.') }
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row wrap noprint"><select aria-label="Pilih kasus" value={id} onChange={(e) => setId(e.target.value)} style={{ width: 'auto', maxWidth: 360 }}>{inv.map((i) => <option key={i.id} value={i.id}>{i.id} — {i.title}</option>)}</select>
        <button className="btn" onClick={() => setPrev(!prev)}>{prev ? 'Sembunyikan' : 'Tampilkan'} pratinjau</button><button className="btn pri" onClick={() => { toast('Membuka dialog cetak — pilih “Simpan sebagai PDF”.', 'info'); setTimeout(() => window.print(), 300) }}><Printer />Unduh PDF</button>
        <button className="btn" onClick={exp}><Download />Ekspor data</button><button className="btn" onClick={() => setShare(true)}><Share2 />Bagikan</button></div>
      {prev && <Report it={it} st={st} />}
      {share && <Modal title="Bagikan laporan" onClose={() => setShare(false)}>{users.filter((u) => u.active).map((u) => <button key={u.id} className="btn" style={{ justifyContent: 'space-between' }} onClick={() => { toast(`Laporan ${it.id} dibagikan ke ${u.name} (simulasi).`); setShare(false) }}>{u.name}<span className="faint">{u.role}</span></button>)}</Modal>}
    </div>
  )
}

function Report({ it, st }: { it: Inv; st: ReturnType<typeof recommend> }) {
  const { net } = useApp()
  const H = ({ n, t }: { n: number; t: string }) => <h2>{n}. {t}</h2>
  const unknown = net.filter((e) => e.status === 'unverified' || e.status === 'unknown')
  const top = st.recs.find((r) => r.rank === 1)
  return (
    <div className="rpt">
      <div className="cover"><Logo light size={60} /><h1 style={{ marginTop: 40 }}>Laporan Investigasi</h1><p style={{ fontSize: 18 }}>{it.id} — {it.title}</p><p style={{ color: '#BFD0EA', marginTop: 24 }}>{it.building} · {it.zone}, {it.floor}<br />Teknisi: {it.tech} · Supervisor: {it.supervisor}<br />Dibuat: {dt(new Date().toISOString().slice(0, 16))}</p></div>
      <Notice kind="warn" title="Data demonstrasi">Dokumen ini dihasilkan dari data fiktif. Label dukungan hipotesis bersifat kualitatif dan bukan probabilitas kebocoran.</Notice>
      <H n={1} t="Ringkasan Eksekutif" /><p>Investigasi {it.id} berstatus <b>{it.status}</b> dengan prioritas {it.priority}. {it.exams.filter((e) => e.status === 'Selesai').length} pemeriksaan telah dicatat. Lokasi kebocoran fisik {it.status === 'Selesai' ? 'dilaporkan sesuai kesimpulan di bagian 10' : 'belum terkonfirmasi'}.</p>
      <H n={2} t="Informasi Gedung dan Aset" /><p>{it.building}; {it.floor}, {it.zone}. Kelengkapan dokumentasi jaringan: {completeness(net)}% (ilustratif).</p>
      <H n={3} t="Masalah yang Dilaporkan" /><p>{it.desc}</p><ul>{it.symptoms.map((s) => <li key={s}>{s}</li>)}</ul>
      <H n={4} t="Informasi Jaringan Pipa yang Diketahui" /><table><thead><tr><th>ID</th><th>Nama</th><th>Status</th><th>Sumber</th></tr></thead><tbody>{net.filter((e) => e.status === 'verified' || e.status === 'known').map((e) => <tr key={e.id}><td>{e.id}</td><td>{e.name}</td><td>{e.status === 'verified' ? 'Terverifikasi' : 'Terdokumentasi'}</td><td>{e.source}</td></tr>)}</tbody></table>
      <H n={5} t="Segmen Jaringan yang Tidak Diketahui" /><ul>{unknown.map((e) => <li key={e.id}><b>{e.id}</b> — {e.name} ({e.status === 'unverified' ? 'belum terverifikasi' : 'tidak diketahui'})</li>)}</ul>
      <H n={6} t="Riwayat Pemeriksaan" />{it.exams.length ? <table><thead><tr><th>ID</th><th>Jenis</th><th>Tanggal</th><th>Hasil</th><th>Review</th></tr></thead><tbody>{it.exams.map((e) => <tr key={e.id}><td>{e.id}</td><td>{exDef(e.type).name}</td><td>{dt(e.date)}</td><td>{e.cls ?? e.status}</td><td>{e.review}</td></tr>)}</tbody></table> : <p>Belum ada pemeriksaan.</p>}
      <H n={7} t="Ringkasan Bukti" /><ol>{it.evidence.map((e) => <li key={e.id}>[{e.id}] {e.text} <i>({e.source}, {dt(e.date)}, kualitas {e.quality})</i></li>)}</ol>
      <H n={8} t="Hipotesis Lokasi" /><table><thead><tr><th>ID</th><th>Hipotesis</th><th>Dukungan</th><th>Elemen</th></tr></thead><tbody>{it.hyps.map((h) => <tr key={h.id}><td>{h.id}</td><td>{h.title}</td><td>{SUPPORT[h.support]}</td><td>{h.elements.join(', ')}</td></tr>)}</tbody></table>
      <H n={9} t="Rekomendasi Diagnostik" /><p>{st.insufficient ? 'Bukti belum cukup untuk merekomendasikan pemeriksaan.' : top ? <><b>{top.def.name}</b>. {top.reason}</> : '—'}</p>
      {it.recHistory.length > 0 && <p className="sm">Rekomendasi sebelumnya dipertahankan pada riwayat ({it.recHistory.length} pembaruan).</p>}
      <H n={10} t="Kesimpulan Diagnostik Akhir" /><p>{it.outcome ?? 'Belum ada kesimpulan akhir. Investigasi masih berjalan; tidak ada lokasi yang dinyatakan sebagai kebocoran terkonfirmasi.'}</p>
      <H n={11} t="Ketidakpastian yang Tersisa" /><ul>{it.hyps.flatMap((h) => h.missing.map((m) => <li key={h.id + m}>{h.id}: {m}</li>))}</ul>
      <H n={12} t="Catatan Teknisi" /><p>{it.timeline.slice(-3).map((t) => `${t.who}: ${t.text}`).join(' · ')}</p>
      <H n={13} t="Review Supervisor" /><p>{it.exams.some((e) => e.review === 'Disetujui') ? 'Sebagian hasil telah disetujui supervisor.' : 'Belum ada review supervisor.'} Tanda tangan: ____________________ ({it.supervisor})</p>
    </div>
  )
}
