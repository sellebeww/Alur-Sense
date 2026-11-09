import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useApp } from '../store.tsx'
import { Empty, PageHeader, SearchBox, Select, dt } from '../ui.tsx'
import { EXAMS, exDef, type Exam } from '../data.ts'
import RecordModal from './Record.tsx'

const rb = (r: Exam['review']) => <span className={`badge ${r === 'Disetujui' ? 'b-ok' : r === 'Ditolak' ? 'b-crit' : r === 'Menunggu Review' ? 'b-warn' : ''}`}>{r}</span>
const sb = (s: Exam['status']) => <span className={`badge ${s === 'Selesai' ? 'b-ok' : s === 'Menunggu Persetujuan' ? 'b-warn' : s === 'Draft' ? '' : 'b-info'}`}>{s}</span>

export function ExamTable({ list, showCase }: { list: Exam[]; showCase?: boolean }) {
  const { canApprove, reviewExam, toast } = useApp()
  if (!list.length) return <Empty title="Belum ada pemeriksaan" text="Terima rekomendasi pada tab Rencana Diagnostik atau catat hasil secara langsung." />
  return (
    <div className="tw"><table><thead><tr>{['ID Pemeriksaan', showCase ? 'ID Kasus' : '', 'Jenis', 'Teknisi', 'Tanggal', 'Elemen terkait', 'Hasil', 'Status hasil', 'Review', ''].filter(Boolean).map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{list.map((e) => <tr key={e.id}><td><b>{e.id}</b></td>{showCase && <td><Link to={`/investigations/${e.inv}`}>{e.inv}</Link></td>}<td>{exDef(e.type).name}</td><td>{e.tech}</td><td>{dt(e.date)}</td><td>{e.element || '—'}</td>
        <td className="muted" style={{ maxWidth: 260 }}>{e.cls ? <>{e.cls}<br /><span className="sm faint">{e.summary}</span></> : '—'}</td><td>{sb(e.status)}</td><td>{rb(e.review)}</td>
        <td>{e.review === 'Menunggu Review' && (canApprove ? <div className="row"><button className="btn sm pri" onClick={() => { reviewExam(e.inv, e.id, true); toast('Hasil disetujui.') }}>Setujui</button><button className="btn sm" onClick={() => { reviewExam(e.inv, e.id, false); toast('Hasil ditolak.', 'info') }}>Tolak</button></div> : <span className="sm faint">Perlu supervisor</span>)}</td></tr>)}</tbody></table></div>
  )
}

export default function Examinations() {
  const { inv } = useApp()
  const [q, setQ] = useState(''), [type, setType] = useState('Semua jenis'), [rev, setRev] = useState('Semua review'), [add, setAdd] = useState(false)
  const all = useMemo(() => inv.flatMap((i) => i.exams).filter((e) => (type === 'Semua jenis' || exDef(e.type).name === type) && (rev === 'Semua review' || e.review === rev) && `${e.id} ${e.inv} ${e.tech}`.toLowerCase().includes(q.toLowerCase())), [inv, q, type, rev])
  return (
    <>
      <PageHeader title="Catatan Pemeriksaan" sub="Pusat catatan hasil pemeriksaan lintas investigasi."><Link className="btn" to="/diagnostic-library">Pustaka diagnostik</Link><button className="btn pri" onClick={() => setAdd(true)}><Plus />Catat Hasil</button></PageHeader>
      <div className="card flush"><div className="row wrap" style={{ padding: 14 }}><SearchBox value={q} onChange={setQ} ph="Cari ID, kasus, teknisi…" /><Select label="Jenis" value={type} onChange={setType} opts={['Semua jenis', ...EXAMS.map((e) => e.name)]} /><Select label="Review" value={rev} onChange={setRev} opts={['Semua review', 'Belum', 'Menunggu Review', 'Disetujui', 'Ditolak']} /></div>
        <ExamTable list={all} showCase /></div>
      {add && <RecordModal onClose={() => setAdd(false)} />}
    </>
  )
}
