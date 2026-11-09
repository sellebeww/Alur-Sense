import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useApp } from '../store.tsx'
import { Field, Meter, Modal, Notice, PageHeader, SearchBox, Pills } from '../ui.tsx'
import { EFFORT, EXAMS, type ExamDef } from '../data.ts'

export default function Library() {
  const { role, toast } = useApp()
  const [q, setQ] = useState(''), [f, setF] = useState('Semua'), [sel, setSel] = useState<ExamDef | null>(null), [tpl, setTpl] = useState(false), [extra, setExtra] = useState<string[]>([])
  const list = EXAMS.filter((e) => (f === 'Semua' || (f === 'Perlu otorisasi' ? e.auth : f === 'Non-invasif' ? !e.auth : e.avail === 'unavailable')) && `${e.name} ${e.desc} ${e.purpose}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeader title="Pustaka Diagnostik" sub="Katalog opsi pemeriksaan dan informasi yang dibutuhkan untuk pengambilan keputusan. Bukan manual instruksi teknik.">
        <Link className="btn" to="/examinations">Catatan pemeriksaan</Link>
        <button className="btn pri" onClick={() => (role === 'Administrator' || role === 'Supervisor' ? setTpl(true) : toast('Hanya Administrator/Supervisor yang dapat membuat templat.', 'err'))}><Plus />Templat Pemeriksaan</button></PageHeader>
      <div className="row wrap" style={{ marginBottom: 16 }}><SearchBox value={q} onChange={setQ} ph="Cari pemeriksaan…" /><Pills opts={['Semua', 'Non-invasif', 'Perlu otorisasi', 'Tidak tersedia']} value={f} onChange={setF} /></div>
      <div className="grid g3">{list.map((e) => <button key={e.id} className="card col" style={{ textAlign: 'left', gap: 8 }} onClick={() => setSel(e)}>
        <div className="row between"><h3>{e.name}</h3>{e.auth && <span className="badge b-warn">Otorisasi</span>}</div><p className="sm muted">{e.desc}</p>
        <dl className="kv"><dt>Upaya</dt><dd><span className="row">{EFFORT[e.effort]} <Meter n={e.effort} /></span></dd><dt>Ketersediaan</dt><dd>{e.availNote}</dd><dt>SOP</dt><dd>{e.sop}</dd></dl></button>)}
        {extra.map((n) => <div key={n} className="card"><h3>{n}</h3><p className="sm muted">Templat kustom organisasi (contoh).</p></div>)}</div>
      {sel && <Modal title={sel.name} onClose={() => setSel(null)}><p>{sel.desc}</p>
        <dl className="kv"><dt>Tujuan diagnostik</dt><dd>{sel.purpose}</dd><dt>Kondisi yang sesuai</dt><dd>{sel.suitable}</dd><dt>Keterbatasan</dt><dd>{sel.limits}</dd><dt>Informasi yang dibutuhkan</dt><dd>{sel.requires}</dd><dt>Hasil yang diharapkan</dt><dd>{sel.output}</dd><dt>Peralatan</dt><dd>{sel.equipment}</dd><dt>Kategori upaya</dt><dd>{EFFORT[sel.effort]}</dd><dt>Otorisasi</dt><dd>{sel.auth ? 'Wajib: persetujuan supervisor, tinjauan risiko, SOP lokasi' : 'Tidak wajib'}</dd><dt>SOP internal</dt><dd>{sel.sop}</dd></dl>
        {sel.auth && <Notice kind="warn" title="Otorisasi diperlukan.">AlurSense hanya mengatur informasi pengambilan keputusan dan tidak menyediakan instruksi operasi fisik.</Notice>}</Modal>}
      {tpl && <TplModal onClose={() => setTpl(false)} onSave={(n) => { setExtra([...extra, n]); toast('Templat dibuat.'); setTpl(false) }} />}
    </>
  )
}
function TplModal({ onClose, onSave }: { onClose: () => void; onSave: (n: string) => void }) {
  const [n, setN] = useState('')
  return <Modal title="Templat Pemeriksaan" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Batal</button><button className="btn pri" disabled={!n.trim()} onClick={() => onSave(n.trim())}>Simpan</button></>}>
    <Field label="Nama templat"><input value={n} onChange={(e) => setN(e.target.value)} placeholder="mis. Pemeriksaan gedung perkantoran tua" /></Field>
    <Field label="Jenis gedung"><select><option>Perkantoran</option><option>Komersial</option><option>Hunian</option></select></Field></Modal>
}
