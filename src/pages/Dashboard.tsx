import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, CheckCircle2, ClipboardList, Clock, Download, Network, TrendingUp } from 'lucide-react'
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../store.tsx'
import { DemoBanner, Empty, PageHeader, Pills, PriorityBadge, SearchBox, Select, Skel, StatusBadge, useLoading } from '../ui.tsx'
import { STATUSES } from '../data.ts'

const series = (n: number) => Array.from({ length: n }, (_, i) => ({ d: n === 7 ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i] : `H-${n - i}`, baru: 2 + ((i * 3) % 5), selesai: 1 + ((i * 2) % 4), review: (i * 5) % 3 }))
const COL = { Berjalan: '#5686B4', 'Menunggu Review': '#D69B38', Selesai: '#23866B', Ditunda: '#8E9CB1' } as Record<string, string>

export default function Dashboard() {
  const { inv, net, buildings, toast } = useApp()
  const nav = useNavigate()
  const loading = useLoading()
  const [q, setQ] = useState(''), [st, setSt] = useState('Semua status'), [bd, setBd] = useState('Semua gedung'), [pr, setPr] = useState('Semua prioritas'), [range, setRange] = useState('30 hari'), [chart, setChart] = useState('30 hari')
  const cnt = (s: string) => inv.filter((i) => i.status === s).length
  const rows = useMemo(() => inv.filter((i) => (st === 'Semua status' || i.status === st) && (bd === 'Semua gedung' || i.building === bd) && (pr === 'Semua prioritas' || i.priority === pr) && `${i.id} ${i.title} ${i.tech} ${i.zone}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 8), [inv, q, st, bd, pr])
  const pie = ['Berjalan', 'Menunggu Review', 'Selesai', 'Ditunda'].map((n) => ({ name: n, value: cnt(n) }))
  const unmapped = net.filter((e) => e.status === 'unverified' || e.status === 'unknown').length
  const kpis = [
    { l: 'Investigasi Aktif', v: cnt('Berjalan'), s: 'Sedang diselidiki', i: ClipboardList, to: 'Berjalan' },
    { l: 'Menunggu Review', v: cnt('Menunggu Review'), s: 'Perlu perhatian supervisor', i: Clock, to: 'Menunggu Review' },
    { l: 'Investigasi Selesai', v: cnt('Selesai'), s: 'Selesai (data contoh)', i: CheckCircle2, to: 'Selesai' },
    { l: 'Segmen Belum Terpetakan', v: unmapped, s: 'Segmen perlu verifikasi', i: Network, to: '/networks' },
    { l: 'Rata-rata Jumlah Pemeriksaan', v: '4,2', s: 'Per investigasi selesai (contoh)', i: Activity, to: '/reports' },
    { l: 'Efisiensi Diagnostik', v: '18%', s: 'Ilustrasi peningkatan vs baseline — bukan hasil terverifikasi', i: TrendingUp, to: '/reports' },
  ]
  return (
    <>
      <PageHeader title="Selamat pagi, Andi." sub="Berikut ringkasan investigasi pemeliharaan Anda.">
        <Select label="Rentang tanggal" value={range} onChange={setRange} opts={['7 hari', '30 hari', '90 hari']} />
        <button className="btn" onClick={() => { const b = new Blob([JSON.stringify({ dibuat: new Date().toISOString(), catatan: 'Data demonstrasi fiktif', ringkasan: kpis.map((k) => ({ [k.l]: k.v })) }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'alursense-ringkasan.json'; a.click(); toast('Ringkasan diekspor.') }}><Download />Ekspor ringkasan</button>
      </PageHeader>
      <div style={{ marginBottom: 16 }}><DemoBanner text="Seluruh statistik di bawah adalah data contoh untuk demonstrasi, bukan kinerja produk yang terverifikasi." /></div>
      <div className="grid g6" style={{ marginBottom: 16 }}>
        {kpis.map((k) => (loading ? <div className="card" key={k.l}><Skel h={90} /></div> :
          <button key={k.l} className="card kpi" onClick={() => nav(k.to.startsWith('/') ? k.to : `/investigations?status=${encodeURIComponent(k.to)}`)}>
            <span className="ic"><k.i /></span><span className="sm muted">{k.l}</span><b>{String(k.v).padStart(2, '0').replace(/^0(\D)/, '0$1')}</b><span className="sm faint">{k.s}</span></button>))}
      </div>
      <div className="col" style={{ marginBottom: 16, gap: 16 }}>
        <div className="card flush">
          <div className="ch" style={{ padding: '16px 18px 0' }}><h3>Investigasi Terbaru</h3><button className="btn sm" onClick={() => nav('/investigations')}>Lihat semua</button></div>
          <div className="row wrap" style={{ padding: '0 18px 12px' }}><SearchBox value={q} onChange={setQ} ph="Cari kasus…" />
            <Select label="Filter status" value={st} onChange={setSt} opts={['Semua status', ...STATUSES]} /><Select label="Filter gedung" value={bd} onChange={setBd} opts={['Semua gedung', ...buildings.map((b) => b.name)]} /><Select label="Filter prioritas" value={pr} onChange={setPr} opts={['Semua prioritas', 'Rendah', 'Sedang', 'Tinggi']} /></div>
          {loading ? <div style={{ padding: 18 }}><Skel h={220} /></div> : rows.length === 0 ? <Empty title="Tidak ada investigasi yang cocok" text="Ubah filter atau buat investigasi baru." /> :
            <div className="tw"><table><thead><tr>{['ID Kasus', 'Investigasi', 'Gedung · Zona', 'Teknisi', 'Prioritas', 'Status'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{rows.map((i) => <tr key={i.id} className="click" tabIndex={0} onClick={() => nav(`/investigations/${i.id}`)} onKeyDown={(e) => e.key === 'Enter' && nav(`/investigations/${i.id}`)}>
                <td><b>{i.id}</b></td><td className="w">{i.title}</td><td className="w" style={{ minWidth: 150 }}>{i.building}<span className="sub">{i.zone}</span></td><td>{i.tech}</td><td><PriorityBadge p={i.priority} /></td><td><StatusBadge s={i.status} /></td></tr>)}</tbody></table></div>}
        </div>
      </div>
      <div className="grid g2 stack" style={{ marginBottom: 16 }}>
        <div className="card"><h3>Perlu Perhatian Anda</h3>
          <div className="col" style={{ gap: 12 }}>
            {[['AS-0261', 'Hasil pemeriksaan baru siap ditinjau; rekomendasi dapat diperbarui.', 'Buka kasus'], ['AS-0260', 'Persetujuan supervisor diperlukan.', 'Tinjau'], ['AS-0258', 'Dokumentasi jaringan belum lengkap.', 'Lengkapi']].map(([id, t, a]) => (
              <div key={id} className="row" style={{ alignItems: 'flex-start' }}><div className="grow"><b>{id}</b><p className="sm muted">{t}</p></div><button className="btn sm" onClick={() => nav(`/investigations/${id}`)}>{a}</button></div>))}
          </div></div>
        <div className="card"><h3>Aktivitas Terkini</h3>
          <div className="tl" style={{ marginTop: 12 }}>{[['Andi Pratama', 'menambahkan hasil pemeriksaan', '09:10'], ['Rina Putri', 'memperbarui dokumentasi jaringan', '08:12'], ['Supervisor', 'menyetujui rencana pemeriksaan AS-0259', 'Kemarin'], ['Sistem', 'Investigasi AS-0259 selesai', 'Kemarin']].map(([w, t, a]) => <div key={t}><span className="sm"><b>{w}</b> {t}</span><br /><span className="xs">{a}</span></div>)}</div>
        </div>
      </div>
      <div className="grid g21">
        <div className="card"><div className="ch"><h3>Aktivitas Investigasi <span className="sm faint">(data contoh)</span></h3><Pills opts={['7 hari', '30 hari', '90 hari']} value={chart} onChange={setChart} /></div>
          {loading ? <Skel h={240} /> : <div style={{ height: 250 }}><ResponsiveContainer><LineChart data={series(chart === '7 hari' ? 7 : chart === '30 hari' ? 15 : 24)}><CartesianGrid stroke="#E0E8F2" vertical={false} /><XAxis dataKey="d" fontSize={11} tickLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} /><Tooltip /><Legend />
            <Line name="Baru" dataKey="baru" stroke="#5686B4" strokeWidth={2} dot={false} /><Line name="Selesai" dataKey="selesai" stroke="#0A6ED1" strokeWidth={2} dot={false} /><Line name="Menunggu review" dataKey="review" stroke="#D69B38" strokeWidth={2} dot={false} strokeDasharray="5 4" /></LineChart></ResponsiveContainer></div>}</div>
        <div className="card"><h3>Distribusi Status</h3>
          {loading ? <Skel h={240} /> : <div style={{ height: 250 }}><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>{pie.map((p) => <Cell key={p.name} fill={COL[p.name]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>}</div>
      </div>
    </>
  )
}
