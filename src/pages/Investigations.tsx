import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { useApp, ME } from '../store.tsx'
import { Confirm, Empty, Field, FileUpload, Modal, PageHeader, Pager, PriorityBadge, SearchBox, Select, Skel, StatusBadge, Tabs, dt, useLoading } from '../ui.tsx'
import { STATUSES, baseInv, genHyps, type Inv, type Priority, type Status } from '../data.ts'

const PER = 10
const CATS = ['Konsumsi air tidak terjelaskan', 'Permukaan lembap atau basah', 'Perilaku aliran tidak terduga', 'Dugaan kebocoran pipa', 'Kondisi jaringan tidak diketahui', 'Lainnya']
const PRI: Record<string, number> = { Tinggi: 3, Sedang: 2, Rendah: 1 }

export default function Investigations() {
  const { inv, updInv, toast } = useApp()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [tab, setTab] = useState(sp.get('status') ?? 'Semua'), [q, setQ] = useState(sp.get('q') ?? ''), [pr, setPr] = useState('Semua prioritas'), [sort, setSort] = useState('Terbaru'), [page, setPage] = useState(1)
  const [wiz, setWiz] = useState(false), [conf, setConf] = useState<{ id: string; s: Status } | null>(null)
  const loading = useLoading()
  const list = useMemo(() => inv.filter((i) => (tab === 'Semua' || i.status === tab) && (pr === 'Semua prioritas' || i.priority === pr) && `${i.id} ${i.title} ${i.building} ${i.tech} ${i.zone} ${i.category}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === 'Terbaru' ? b.updated.localeCompare(a.updated) : sort === 'Prioritas' ? PRI[b.priority] - PRI[a.priority] : a.id.localeCompare(b.id))), [inv, tab, q, pr, sort])
  const pages = Math.max(1, Math.ceil(list.length / PER)), cur = Math.min(page, pages)
  const exportCsv = () => {
    const csv = ['ID,Judul,Gedung,Lokasi,Teknisi,Prioritas,Status', ...list.map((i) => [i.id, i.title, i.building, `${i.floor} ${i.zone}`, i.tech, i.priority, i.status].map((x) => `"${x}"`).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'investigasi.csv'; a.click(); toast(`${list.length} catatan diekspor.`)
  }
  const change = (id: string, s: Status) => (s === 'Selesai' || s === 'Ditunda') ? setConf({ id, s }) : (updInv(id, { status: s }, `Mengubah status → ${s}`), toast(`Status ${id}: ${s}`))
  return (
    <>
      <PageHeader title="Investigasi" sub="Kelola dugaan kebocoran, tinjau hasil pemeriksaan, dan pantau kemajuan diagnostik.">
        <button className="btn" onClick={exportCsv}><Download />Ekspor catatan</button><button className="btn pri" onClick={() => setWiz(true)}><Plus />Investigasi Baru</button>
      </PageHeader>
      <Tabs tabs={['Semua', ...STATUSES]} value={tab} onChange={(t) => { setTab(t); setPage(1) }} />
      <div className="card flush">
        <div className="row wrap" style={{ padding: 14 }}><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1) }} ph="Cari ID, judul, gedung, teknisi…" />
          <Select label="Prioritas" value={pr} onChange={setPr} opts={['Semua prioritas', 'Rendah', 'Sedang', 'Tinggi']} /><Select label="Urutkan" value={sort} onChange={setSort} opts={['Terbaru', 'Prioritas', 'ID kasus']} /><span className="sm muted right">{list.length} investigasi</span></div>
        {loading ? <div style={{ padding: 16 }}><Skel h={300} /></div> : list.length === 0 ? <Empty title="Belum ada investigasi aktif." text="Buat investigasi pertama Anda untuk mulai mengatur alur kerja diagnostik." action={<button className="btn pri" onClick={() => setWiz(true)}><Plus />Buat Investigasi</button>} /> :
          <div className="tw"><table><thead><tr>{['ID Kasus', 'Investigasi', 'Gedung · Lokasi', 'Ditugaskan', 'Prioritas', 'Status', 'Aktivitas terakhir', 'Aksi'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{list.slice((cur - 1) * PER, cur * PER).map((i) => (
              <tr key={i.id} className="click" onClick={() => nav(`/investigations/${i.id}`)}>
                <td><b>{i.id}</b></td><td className="w">{i.title}<span className="sub">{i.category}</span></td><td>{i.building}<span className="sub">{i.floor}, {i.zone}</span></td><td>{i.tech}</td><td><PriorityBadge p={i.priority} /></td><td><StatusBadge s={i.status} /></td><td className="muted">{dt(i.updated).split(', ').map((p, k) => <span key={k} className="nw">{p} </span>)}</td>
                <td onClick={(e) => e.stopPropagation()}><select aria-label={`Ubah status ${i.id}`} value={i.status} onChange={(e) => change(i.id, e.target.value as Status)} style={{ height: 30, fontSize: 12, width: 118 }}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td></tr>))}</tbody></table></div>}
        <Pager page={cur} pages={pages} onPage={setPage} />
      </div>
      {conf && <Confirm title={`Ubah status ${conf.id}?`} text={conf.s === 'Selesai' ? 'Menandai investigasi selesai akan menutup alur diagnostik. Pastikan supervisor telah meninjau hasil.' : 'Investigasi akan ditunda dan tidak muncul sebagai aktif.'} onNo={() => setConf(null)} onYes={() => { updInv(conf.id, { status: conf.s }, `Mengubah status → ${conf.s}`); toast(`Status ${conf.id}: ${conf.s}`); setConf(null) }} />}
      {wiz && <Wizard onClose={() => setWiz(false)} />}
    </>
  )
}

const STEPS = ['Informasi', 'Masalah', 'Jaringan', 'Bukti awal', 'Tinjau']
function Wizard({ onClose }: { onClose: () => void }) {
  const { inv, net, buildings, users, addInv, toast } = useApp()
  const nav = useNavigate()
  const [s, setS] = useState(0), [errs, setErrs] = useState<Record<string, string>>({})
  const [f, setF] = useState({ title: '', building: 'Gedung Sentra Utama', floor: 'Lantai 2', zone: '', date: '2026-11-09', by: ME, tech: ME, sup: 'Rina Putri', cat: CATS[0], desc: '', first: '', recurring: 'Tidak', history: '', docs: 'Sebagian', layout: '', known: [] as string[], unknown: [] as string[], refs: '', obs: '', records: '', meter: 'Ada', photos: '', priority: 'Sedang' as Priority })
  const set = (k: keyof typeof f, v: unknown) => setF({ ...f, [k]: v })
  const techs = users.filter((u) => u.role === 'Teknisi' || u.role === 'Supervisor').map((u) => u.name), sups = users.filter((u) => u.role === 'Supervisor' || u.role === 'Administrator').map((u) => u.name)
  const toggle = (k: 'known' | 'unknown', id: string) => set(k, f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id])
  const validate = () => {
    const e: Record<string, string> = {}
    if (s === 0) { if (!f.title.trim()) e.title = 'Judul wajib diisi.'; if (!f.zone.trim()) e.zone = 'Zona/area wajib diisi.' }
    if (s === 1 && f.desc.trim().length < 10) e.desc = 'Jelaskan masalah minimal 10 karakter.'
    setErrs(e); return !Object.keys(e).length
  }
  const create = (draft: boolean) => {
    if (!draft && !validate()) return
    const id = `AS-${String(Math.max(...inv.map((i) => +i.id.slice(3))) + 1).padStart(4, '0')}`
    const now = new Date().toISOString().slice(0, 16)
    const ev = (t: string, text: string) => ({ id: 'E-' + t, type: t, text, date: f.date, source: f.by, quality: 'Cukup', kind: 'neutral' as const, sim: true })
    const evidence = [f.desc && ev('Laporan', f.desc), f.obs && ev('Observasi', f.obs), f.records && ev('Catatan inspeksi', f.records)].filter(Boolean) as Inv['evidence']
    const hyps = genHyps(id).map((h) => ({ ...h, support: 0 as const, supporting: [] }))
    const i = baseInv({ id, title: f.title || 'Draf tanpa judul', building: f.building, floor: f.floor, zone: f.zone, tech: f.tech, supervisor: f.sup, priority: f.priority, status: draft ? 'Draft' : 'Berjalan', category: f.cat, desc: f.desc, created: f.date, updated: now, recurring: f.recurring === 'Ya', symptoms: [f.cat], evidence: evidence.map((x, n) => ({ ...x, id: `E-${n + 1}` })), hyps, tempUnc: 0.9, timeline: [{ id: 'T1', at: now, who: ME, text: draft ? 'Draf investigasi disimpan.' : 'Investigasi dibuat.' }] })
    addInv(i); toast(draft ? 'Draf disimpan.' : `Investigasi ${id} dibuat.`); onClose(); if (!draft) nav(`/investigations/${id}`)
  }
  const nodes = net.filter((e) => e.kind === 'seg')
  return (
    <Modal wide title="Investigasi Baru" onClose={onClose} footer={<>
      <button className="btn" onClick={() => create(true)}>Simpan sebagai draf</button><span className="grow" />
      <button className="btn" disabled={s === 0} onClick={() => setS(s - 1)}>Kembali</button>
      {s < 4 ? <button className="btn pri" onClick={() => validate() && setS(s + 1)}>Lanjut</button> : <button className="btn pri" onClick={() => create(false)}>Buat Investigasi</button>}</>}>
      <div><div className="stepper">{STEPS.map((_, i) => <i key={i} className={i <= s ? 'on' : ''} />)}</div><p className="xs">Langkah {s + 1}/5 — {STEPS[s]}</p></div>
      {s === 0 && <div className="grid g2 stack">
        <Field label="Judul investigasi" error={errs.title}><input value={f.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Gedung"><select value={f.building} onChange={(e) => set('building', e.target.value)}>{buildings.map((b) => <option key={b.id}>{b.name}</option>)}</select></Field>
        <Field label="Lantai"><input value={f.floor} onChange={(e) => set('floor', e.target.value)} /></Field>
        <Field label="Area / zona spesifik" error={errs.zone}><input value={f.zone} onChange={(e) => set('zone', e.target.value)} placeholder="mis. Blok B" /></Field>
        <Field label="Tanggal dilaporkan"><input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
        <Field label="Dilaporkan oleh"><input value={f.by} onChange={(e) => set('by', e.target.value)} /></Field>
        <Field label="Teknisi ditugaskan"><select value={f.tech} onChange={(e) => set('tech', e.target.value)}>{techs.map((n) => <option key={n}>{n}</option>)}</select></Field>
        <Field label="Supervisor"><select value={f.sup} onChange={(e) => set('sup', e.target.value)}>{sups.map((n) => <option key={n}>{n}</option>)}</select></Field>
        <Field label="Prioritas"><select value={f.priority} onChange={(e) => set('priority', e.target.value)}><option>Rendah</option><option>Sedang</option><option>Tinggi</option></select></Field></div>}
      {s === 1 && <div className="col">
        <Field label="Kategori masalah"><select value={f.cat} onChange={(e) => set('cat', e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Deskripsi dugaan masalah" error={errs.desc}><textarea value={f.desc} onChange={(e) => set('desc', e.target.value)} /></Field>
        <div className="grid g2 stack"><Field label="Pertama kali diamati"><input type="date" value={f.first} onChange={(e) => set('first', e.target.value)} /></Field><Field label="Berulang?"><select value={f.recurring} onChange={(e) => set('recurring', e.target.value)}><option>Tidak</option><option>Ya</option></select></Field></div>
        <Field label="Riwayat pemeliharaan terkait"><textarea value={f.history} onChange={(e) => set('history', e.target.value)} /></Field>
        <FileUpload label="Unggah foto" accept="image/*" onFiles={(n) => set('photos', n.join(', '))} /></div>}
      {s === 2 && <div className="col">
        <Field label="Dokumentasi jaringan tersedia?"><select value={f.docs} onChange={(e) => set('docs', e.target.value)}><option>Ya</option><option>Tidak</option><option>Sebagian</option></select></Field>
        <FileUpload label="Unggah denah/pipa yang ada" accept=".pdf,image/*,.csv" hint="PDF, JPG/PNG, CSV — disimpan sebagai berkas referensi, tidak dianalisis otomatis" onFiles={(n) => set('layout', n.join(', '))} />
        <div className="grid g2 stack"><div><p className="xs" style={{ marginBottom: 6 }}>Segmen pipa yang diketahui</p><div className="col" style={{ gap: 4 }}>{nodes.filter((e) => e.status !== 'unknown').map((e) => <label key={e.id} className="row sm"><input type="checkbox" style={{ width: 16, height: 16 }} checked={f.known.includes(e.id)} onChange={() => toggle('known', e.id)} />{e.id} — {e.name}</label>)}</div></div>
          <div><p className="xs" style={{ marginBottom: 6 }}>Segmen tidak diketahui / belum terverifikasi</p><div className="col" style={{ gap: 4 }}>{nodes.filter((e) => e.status === 'unknown' || e.status === 'unverified').map((e) => <label key={e.id} className="row sm"><input type="checkbox" style={{ width: 16, height: 16 }} checked={f.unknown.includes(e.id)} onChange={() => toggle('unknown', e.id)} />{e.id} — {e.name}</label>)}</div></div></div>
        <Field label="Referensi meter/sensor"><input value={f.refs} onChange={(e) => set('refs', e.target.value)} placeholder="mis. M-01" /></Field></div>}
      {s === 3 && <div className="col">
        <Field label="Observasi awal"><textarea value={f.obs} onChange={(e) => set('obs', e.target.value)} /></Field>
        <Field label="Catatan inspeksi yang ada"><textarea value={f.records} onChange={(e) => set('records', e.target.value)} /></Field>
        <Field label="Ketersediaan riwayat meter"><select value={f.meter} onChange={(e) => set('meter', e.target.value)}><option>Ada</option><option>Sebagian</option><option>Tidak ada</option></select></Field></div>}
      {s === 4 && <div className="col"><dl className="kv">
        {([['Judul', f.title], ['Lokasi', `${f.building} · ${f.floor} · ${f.zone}`], ['Ditugaskan', `${f.tech} (supervisor ${f.sup})`], ['Kategori', f.cat], ['Deskripsi', f.desc], ['Dokumentasi jaringan', f.docs], ['Segmen diketahui', f.known.join(', ') || '—'], ['Segmen tidak diketahui', f.unknown.join(', ') || '—'], ['Observasi awal', f.obs || '—']] as [string, string][]).map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        {!f.obs && !f.desc && <p className="sm muted">Tanpa bukti awal, sistem akan menampilkan status &ldquo;bukti belum cukup&rdquo; dan tidak merekomendasikan pemeriksaan.</p>}</div>}
    </Modal>
  )
}
