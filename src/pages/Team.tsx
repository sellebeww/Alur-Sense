import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../store.tsx'
import { Confirm, Field, Modal, Notice, PageHeader, dt } from '../ui.tsx'
import type { Role, User } from '../data.ts'

const ROLES: Role[] = ['Administrator', 'Maintenance Manager', 'Supervisor', 'Teknisi', 'Viewer']
const PERM: Record<Role, string> = { Administrator: 'Kelola pengguna & pengaturan sistem', 'Maintenance Manager': 'Analitik seluruh organisasi', Supervisor: 'Setujui rencana & tinjau hasil', Teknisi: 'Catat hasil & perbarui investigasi yang ditugaskan', Viewer: 'Hanya lihat' }

export default function Team() {
  const { users, inv, role, addUser, updUser, buildings, audit, toast } = useApp()
  const [invite, setInvite] = useState(false), [edit, setEdit] = useState<User | null>(null), [deact, setDeact] = useState<User | null>(null), [act, setAct] = useState<User | null>(null)
  const admin = role === 'Administrator'
  const guard = (fn: () => void) => (admin ? fn() : toast('Hanya Administrator yang dapat mengelola pengguna (ganti peran demo di menu profil).', 'err'))
  return (
    <>
      <PageHeader title="Manajemen Tim" sub="Kelola pengguna, peran, dan akses gedung."><button className="btn pri" onClick={() => guard(() => setInvite(true))}><Plus />Undang Pengguna</button></PageHeader>
      <div className="card flush"><div className="tw"><table><thead><tr>{['Nama', 'Email', 'Peran', 'Gedung', 'Investigasi aktif', 'Status', 'Terakhir aktif', ''].map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{users.map((u) => <tr key={u.id}><td><b>{u.name}</b></td><td className="muted w" style={{ minWidth: 100 }}>{u.email}</td><td>{u.role}</td><td className="muted w" style={{ minWidth: 110 }}>{u.buildings.join(', ')}</td><td>{inv.filter((i) => i.tech === u.name && i.status === 'Berjalan').length}</td><td><span className={`badge ${u.active ? 'b-ok' : ''}`}>{u.active ? 'Aktif' : 'Nonaktif'}</span></td><td className="muted">{dt(u.last).split(', ').map((p, k) => <span key={k} className="nw">{p} </span>)}</td>
          <td><div className="row wrap" style={{ minWidth: 100 }}><button className="btn sm" onClick={() => setAct(u)}>Aktivitas</button><button className="btn sm" onClick={() => guard(() => setEdit(u))}>Ubah</button>{u.active && <button className="btn sm dng" onClick={() => guard(() => setDeact(u))}>Nonaktifkan</button>}</div></td></tr>)}</tbody></table></div></div>
      <div className="card" style={{ marginTop: 16 }}><h3>Hak Akses per Peran</h3><dl className="kv" style={{ marginTop: 8 }}>{ROLES.map((r) => <div key={r} style={{ display: 'contents' }}><dt>{r}</dt><dd>{PERM[r]}</dd></div>)}</dl></div>
      {invite && <Inv onClose={() => setInvite(false)} onSave={(u) => { addUser(u); toast('Undangan dikirim (simulasi).'); setInvite(false) }} />}
      {edit && <Modal title={`Ubah ${edit.name}`} onClose={() => setEdit(null)} footer={<button className="btn pri" onClick={() => { updUser(edit.id, { role: edit.role, buildings: edit.buildings }); toast('Pengguna diperbarui.'); setEdit(null) }}>Simpan</button>}>
        <Field label="Peran"><select value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as Role })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Gedung ditugaskan"><select multiple value={edit.buildings} onChange={(e) => setEdit({ ...edit, buildings: [...e.target.selectedOptions].map((o) => o.value) })} style={{ height: 96 }}>{buildings.map((b) => <option key={b.id}>{b.name}</option>)}</select></Field></Modal>}
      {deact && <Confirm danger title={`Nonaktifkan ${deact.name}?`} text="Pengguna tidak akan dapat masuk. Investigasi yang ditugaskan perlu dialihkan." yes="Nonaktifkan" onNo={() => setDeact(null)} onYes={() => { updUser(deact.id, { active: false }); toast('Akun dinonaktifkan.', 'info'); setDeact(null) }} />}
      {act && <Modal title={`Aktivitas ${act.name}`} onClose={() => setAct(null)}>{audit.filter((a) => a.who === act.name).slice(0, 10).map((a) => <p key={a.id} className="sm">• {a.action} — {a.obj} <span className="faint">({dt(a.at)})</span></p>)}{!audit.some((a) => a.who === act.name) && <Notice>Belum ada aktivitas tercatat.</Notice>}</Modal>}
    </>
  )
}
function Inv({ onClose, onSave }: { onClose: () => void; onSave: (u: User) => void }) {
  const [f, setF] = useState({ name: '', email: '', role: 'Teknisi' as Role }), ok = /^\S+@\S+\.\S+$/.test(f.email) && f.name.trim()
  return <Modal title="Undang pengguna" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Batal</button><button className="btn pri" disabled={!ok} onClick={() => onSave({ id: 'u' + Date.now(), name: f.name, email: f.email, role: f.role, buildings: [], active: true, last: '—' })}>Kirim undangan</button></>}>
    <Field label="Nama"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Email"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
    <Field label="Peran"><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field></Modal>
}
