import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FileText, Pencil, Plus, UserCog } from 'lucide-react'
import { useApp } from '../store.tsx'
import { Empty, Field, Meter, Modal, Notice, PriorityBadge, SupportBadge, StatusBadge, Tabs, dt } from '../ui.tsx'
import { completeness, exDef, STATUSES, type Inv, type Priority, type Status } from '../data.ts'
import { recommend } from '../engine.ts'
import NetworkView from './NetworkView.tsx'
import DiagnosticPlan from './DiagnosticPlan.tsx'
import RecordModal from './Record.tsx'
import { ExamTable } from './Examinations.tsx'

const TABS = ['Ringkasan', 'Jaringan Pipa', 'Rencana Diagnostik', 'Catatan Pemeriksaan', 'Riwayat Investigasi']

export default function Workspace() {
  const { id } = useParams()
  const { inv, net, users, updInv, toast, audit } = useApp()
  const nav = useNavigate()
  const it = inv.find((i) => i.id === id)
  const [tab, setTab] = useState(TABS[0]), [edit, setEdit] = useState(false), [assign, setAssign] = useState(false), [rec, setRec] = useState(false)
  const st = useMemo(() => (it ? recommend(it, net) : null), [it, net])
  if (!it || !st) return <Empty title="Investigasi tidak ditemukan" text={`Kasus ${id} tidak ada.`} action={<button className="btn" onClick={() => nav('/investigations')}>Kembali ke daftar</button>} />
  const hasNet = it.building === 'Gedung Sentra Utama'
  const done = it.exams.filter((e) => e.status === 'Selesai').length
  const progress = Math.min(100, Math.round(((it.evidence.length - 1) * 8 + done * 22) / 1))
  const top = st.recs.find((r) => r.rank === 1)
  const lead = [...it.hyps].sort((a, b) => b.support - a.support)[0]
  const last = [...it.exams].filter((e) => e.status === 'Selesai').pop()
  return (
    <>
      <div className="ph">
        <div>
          <div className="row wrap"><h1>{it.id} — {it.title}</h1></div>
          <div className="row wrap sm muted" style={{ marginTop: 6, gap: 14 }}><span>{it.building}</span><span>{it.zone}, {it.floor}</span><span>Ditugaskan ke {it.tech}</span><span>Dibuat {dt(it.created)}</span><StatusBadge s={it.status} /><PriorityBadge p={it.priority} /></div>
        </div>
        <div className="row wrap">
          <button className="btn" onClick={() => setEdit(true)}><Pencil />Ubah Detail</button><button className="btn" onClick={() => setAssign(true)}><UserCog />Tugaskan Teknisi</button>
          <button className="btn" onClick={() => setRec(true)}><Plus />Catat Hasil Pemeriksaan</button><button className="btn pri" onClick={() => nav(`/reports?case=${it.id}`)}><FileText />Buat Laporan</button></div>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'Ringkasan' && <div className="col" style={{ gap: 16 }}>
        <div className="grid g4">
          <div className="card"><p className="sm muted lbl">Kemajuan investigasi</p><b style={{ font: '800 26px Manrope' }}>{Math.min(progress, 100)}%</b><div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${Math.min(progress, 100)}%` }} /></div></div>
          <div className="card"><p className="sm muted lbl">Kelengkapan dokumentasi jaringan</p><b style={{ font: '800 26px Manrope' }}>{completeness(net)}%</b><div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${completeness(net)}%` }} /></div><p className="xs" style={{ marginTop: 4 }}>ilustratif</p></div>
          <div className="card"><p className="sm muted lbl">Hipotesis lokasi aktif</p><b style={{ font: '800 26px Manrope' }}>{it.hyps.length}</b><p className="sm faint">Tidak ada yang terkonfirmasi</p></div>
          <div className="card"><p className="sm muted lbl">Pemeriksaan selesai</p><b style={{ font: '800 26px Manrope' }}>{done}</b><p className="sm faint">{it.exams.length - done} direncanakan/draf</p></div>
        </div>
        <div className="grid g21">
          <div className="card col"><h3>Kondisi yang Dilaporkan</h3><p>{it.desc}</p>
            <div><p className="xs">Gejala dilaporkan</p>{it.symptoms.map((s) => <p key={s} className="sm">• {s}</p>)}</div>
            <div><p className="xs">Informasi gedung</p><p className="sm">{it.building} · {it.floor}, {it.zone} · Kategori: {it.category}{it.recurring ? ' · Berulang' : ''}</p></div>
            <div><p className="xs">Bukti</p><div className="col" style={{ gap: 8, marginTop: 6 }}>{it.evidence.map((e) => <div key={e.id} className={`ev ${e.kind}`}><div className="row between"><b className="sm">{e.type}</b><span className="xs">{dt(e.date)} · kualitas {e.quality}</span></div><p className="sm">{e.text}</p><p className="xs">{e.source}{e.sim ? ' · data fiktif' : ''}</p></div>)}</div></div>
            <div><p className="xs">Foto</p><p className="sm muted">Belum ada foto yang diunggah.</p></div></div>
          <div className="col" style={{ gap: 16 }}>
            <div className="card col"><h3>Ringkasan Diagnostik</h3>
              <dl className="kv"><dt>Status</dt><dd><StatusBadge s={it.status} /></dd><dt>Zona kandidat terdepan</dt><dd>{lead?.title} <SupportBadge n={lead?.support ?? 0} /></dd>
                <dt>Bagian jaringan belum diketahui</dt><dd>{net.filter((e) => e.status === 'unverified' || e.status === 'unknown').map((e) => e.id).join(', ')}</dd>
                <dt>Pemeriksaan terakhir</dt><dd>{last ? `${exDef(last.type).name} (${dt(last.date)})` : 'Belum ada'}</dd>
                <dt>Aksi berikutnya</dt><dd>{st.insufficient ? 'Lengkapi bukti' : top ? top.def.name : '—'}</dd></dl>
              <button className="btn" onClick={() => setTab('Rencana Diagnostik')}>Buka rencana diagnostik</button></div>
            <div className="card"><h3>Pemahaman Diagnostik Saat Ini</h3>
              <p style={{ marginTop: 8 }}>{done === 0 ? 'Investigasi menunjukkan pola penggunaan air yang belum terjelaskan di dalam area investigasi. Dokumentasi yang ada belum sepenuhnya menjelaskan sambungan antara Junction J-02 dan Zona B1. Pemeriksaan tambahan diperlukan untuk membedakan hipotesis lokasi yang bersaing.' : `Setelah ${done} pemeriksaan, hipotesis terdepan adalah “${lead?.title}” (${['bukti belum cukup', 'dukungan terbatas', 'dukungan sedang', 'dukungan kuat'][lead?.support ?? 0]}). Beberapa koneksi jaringan masih belum terverifikasi sehingga lokasi fisik belum dapat dinyatakan terkonfirmasi.`}</p>
              <p className="sm faint" style={{ marginTop: 8 }}>Ini penjelasan informatif, bukan diagnosis kebocoran terkonfirmasi. Ketidakpastian lokasi tersisa: <Meter n={Math.round(st.unc.spatial * 3)} /></p></div>
          </div></div>
      </div>}

      {tab === 'Jaringan Pipa' && (hasNet ? <NetworkView inv={it} /> : <div className="card"><Empty title="Jaringan gedung ini belum didokumentasikan." text="Tambahkan dokumentasi pada modul Jaringan Pipa agar diagram dapat ditampilkan." action={<Link className="btn" to="/networks">Buka Jaringan Pipa</Link>} /></div>)}
      {tab === 'Rencana Diagnostik' && <DiagnosticPlan inv={it} />}
      {tab === 'Catatan Pemeriksaan' && <div className="card flush"><div className="ch" style={{ padding: '16px 18px 0' }}><h3>Catatan Pemeriksaan</h3><button className="btn pri sm" onClick={() => setRec(true)}><Plus />Catat Hasil</button></div><ExamTable list={it.exams} /></div>}
      {tab === 'Riwayat Investigasi' && <div className="grid g2">
        <div className="card"><h3>Linimasa</h3><div className="tl" style={{ marginTop: 10 }}>{[...it.timeline].reverse().map((t) => <div key={t.id}><span className="sm"><b>{t.who}</b> — {t.text}</span><br /><span className="xs">{dt(t.at)}</span></div>)}</div>
          {it.decisions.length > 0 && <><h4 style={{ margin: '16px 0 8px' }}>Keputusan</h4><div className="tl">{[...it.decisions].reverse().map((d, i) => <div key={i}><span className="sm">{d.text}</span><br /><span className="xs">{d.who} · {dt(d.at)}</span></div>)}</div></>}</div>
        <div className="card"><h3>Log Audit Terkait</h3><div className="tl" style={{ marginTop: 10 }}>{audit.filter((a) => a.obj.includes(it.id)).slice(0, 12).map((a) => <div key={a.id}><span className="sm"><b>{a.who}</b> — {a.action}</span><br /><span className="xs">{dt(a.at)}</span></div>)}{!audit.some((a) => a.obj.includes(it.id)) && <p className="sm muted">Belum ada aktivitas tercatat.</p>}</div></div></div>}

      {edit && <EditModal it={it} onClose={() => setEdit(false)} onSave={(p) => { updInv(it.id, p, 'Mengubah detail investigasi'); toast('Detail diperbarui.'); setEdit(false) }} />}
      {assign && <Modal title="Tugaskan teknisi" onClose={() => setAssign(false)}>{users.filter((u) => u.active && (u.role === 'Teknisi' || u.role === 'Supervisor')).map((u) => <button key={u.id} className="btn" style={{ justifyContent: 'space-between' }} onClick={() => { updInv(it.id, { tech: u.name }, `Menugaskan ${u.name}`); toast(`Ditugaskan ke ${u.name}.`); setAssign(false) }}>{u.name}<span className="faint">{u.role}</span></button>)}</Modal>}
      {rec && <RecordModal invId={it.id} onClose={() => setRec(false)} />}
      {it.status === 'Selesai' && <div style={{ marginTop: 16 }}><Notice kind="ok" title="Investigasi selesai">{it.outcome}</Notice></div>}
    </>
  )
}

function EditModal({ it, onClose, onSave }: { it: Inv; onClose: () => void; onSave: (p: Partial<Inv>) => void }) {
  const [f, setF] = useState({ title: it.title, desc: it.desc, priority: it.priority, status: it.status, zone: it.zone })
  return (
    <Modal title="Ubah detail" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Batal</button><button className="btn pri" disabled={!f.title.trim()} onClick={() => onSave(f)}>Simpan</button></>}>
      <Field label="Judul"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
      <Field label="Deskripsi"><textarea value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></Field>
      <div className="grid g3 stack"><Field label="Zona"><input value={f.zone} onChange={(e) => setF({ ...f, zone: e.target.value })} /></Field>
        <Field label="Prioritas"><select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Priority })}><option>Rendah</option><option>Sedang</option><option>Tinggi</option></select></Field>
        <Field label="Status"><select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Status })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field></div>
    </Modal>
  )
}
