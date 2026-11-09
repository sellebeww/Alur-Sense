import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useApp } from '../store.tsx'
import { Empty, Field, Modal, PageHeader, PriorityBadge, StatusBadge, dt } from '../ui.tsx'
import { completeness } from '../data.ts'

export function Buildings() {
  const { buildings, inv, net, addBuilding, toast } = useApp()
  const nav = useNavigate(), [add, setAdd] = useState(false), [f, setF] = useState({ name: '', address: '', cat: 'Perkantoran', floors: '', age: '' })
  return (
    <>
      <PageHeader title="Gedung & Lokasi" sub="Kelola gedung, dokumentasi jaringan, dan investigasi terkait."><button className="btn pri" onClick={() => setAdd(true)}><Plus />Tambah Gedung</button></PageHeader>
      <div className="grid g3">{buildings.map((b) => (
        <button key={b.id} className="card col" style={{ textAlign: 'left', gap: 8 }} onClick={() => nav(`/buildings/${b.id}`)}><h3>{b.name}</h3><p className="sm muted">{b.address}</p>
          <dl className="kv"><dt>Kategori</dt><dd>{b.category}</dd><dt>Lantai / usia</dt><dd>{b.floors} lantai · ±{b.age} thn</dd><dt>Investigasi</dt><dd>{inv.filter((i) => i.building === b.name && i.status !== 'Selesai').length} aktif · {inv.filter((i) => i.building === b.name).length} total</dd>
            <dt>Dokumentasi jaringan</dt><dd>{b.name === 'Gedung Sentra Utama' ? `Parsial (${completeness(net)}%, ilustratif)` : b.docs}</dd><dt>Pembaruan</dt><dd>{dt(b.updated)}</dd></dl></button>))}</div>
      {add && <Modal title="Tambah Gedung" onClose={() => setAdd(false)} footer={<><button className="btn" onClick={() => setAdd(false)}>Batal</button><button className="btn pri" disabled={!f.name.trim()} onClick={() => { addBuilding({ id: 'b' + Date.now(), name: f.name, address: f.address, category: f.cat, floors: +f.floors || 1, age: +f.age || 0, docs: 'Belum ada', updated: '2026-11-09', notes: '' }); toast('Gedung ditambahkan.'); setAdd(false) }}>Simpan</button></>}>
        <Field label="Nama gedung"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Alamat"><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <div className="grid g3 stack"><Field label="Kategori"><input value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })} /></Field><Field label="Lantai"><input type="number" value={f.floors} onChange={(e) => setF({ ...f, floors: e.target.value })} /></Field><Field label="Usia (thn)"><input type="number" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></Field></div></Modal>}
    </>
  )
}

export function BuildingDetail() {
  const { id } = useParams()
  const { buildings, inv, users, net } = useApp()
  const nav = useNavigate()
  const b = buildings.find((x) => x.id === id)
  const [floor, setFloor] = useState('Semua')
  if (!b) return <Empty title="Gedung tidak ditemukan" text="" action={<Link className="btn" to="/buildings">Kembali</Link>} />
  const all = inv.filter((i) => i.building === b.name), list = all.filter((i) => floor === 'Semua' || i.floor === floor)
  const floors = ['Semua', ...new Set(all.map((i) => i.floor))]
  const Tbl = ({ rows }: { rows: typeof all }) => rows.length ? <div className="tw"><table><tbody>{rows.slice(0, 8).map((i) => <tr key={i.id} className="click" onClick={() => nav(`/investigations/${i.id}`)}><td><b>{i.id}</b></td><td>{i.title}</td><td>{i.floor}, {i.zone}</td><td><PriorityBadge p={i.priority} /></td><td><StatusBadge s={i.status} /></td></tr>)}</tbody></table></div> : <p className="muted sm">Tidak ada.</p>
  return (
    <>
      <PageHeader title={b.name} sub={`${b.address} · ${b.category}`}><select aria-label="Pilih lantai" value={floor} onChange={(e) => setFloor(e.target.value)} style={{ width: 'auto' }}>{floors.map((x) => <option key={x}>{x}</option>)}</select></PageHeader>
      <div className="grid g21">
        <div className="col" style={{ gap: 16 }}>
          <div className="card"><h3>Investigasi Aktif</h3><Tbl rows={list.filter((i) => i.status !== 'Selesai')} /></div>
          <div className="card"><h3>Investigasi Terdahulu</h3><Tbl rows={list.filter((i) => i.status === 'Selesai')} /></div>
          <div className="card"><h3>Riwayat Pemeliharaan & Catatan</h3><p className="sm muted" style={{ marginTop: 6 }}>{b.notes || 'Belum ada catatan.'}</p></div></div>
        <div className="col" style={{ gap: 16 }}>
          <div className="card"><h3>Informasi Umum</h3><dl className="kv" style={{ marginTop: 8 }}><dt>Lantai</dt><dd>{b.floors}</dd><dt>Perkiraan usia</dt><dd>{b.age} tahun</dd><dt>Pembaruan</dt><dd>{dt(b.updated)}</dd></dl></div>
          <div className="card"><h3>Dokumentasi Jaringan</h3><p className="sm muted" style={{ margin: '6px 0 10px' }}>{b.name === 'Gedung Sentra Utama' ? `Diagram parsial: ${net.length} elemen, kelengkapan ${completeness(net)}% (ilustratif).` : 'Belum ada diagram terdokumentasi.'}</p><Link className="btn sm" to="/networks">Buka Jaringan Pipa</Link></div>
          <div className="card"><h3>Tim Terkait</h3>{users.filter((u) => u.buildings.includes(b.name) || u.buildings.includes('Semua gedung')).map((u) => <p key={u.id} className="sm" style={{ marginTop: 6 }}><b>{u.name}</b> <span className="faint">· {u.role}</span></p>)}</div></div></div>
    </>
  )
}
