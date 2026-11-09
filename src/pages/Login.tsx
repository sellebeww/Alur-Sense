import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useApp } from '../store.tsx'
import { Field, Logo } from '../ui.tsx'

const Net = () => (
  <svg viewBox="0 0 600 600" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .22 }} aria-hidden>
    <g fill="none" stroke="#5BB6F5" strokeWidth="2" strokeLinecap="round"><path d="M-20 420h180v-120h120v-140h200M280 300h140v160h200M160 420v140" /><path d="M420 160v-120" strokeDasharray="4 8" /></g>
    <g fill="#0E2A55" stroke="#5BB6F5" strokeWidth="2"><circle cx="160" cy="420" r="9" /><circle cx="280" cy="300" r="9" /><circle cx="420" cy="160" r="9" /><circle cx="420" cy="460" r="9" /></g>
  </svg>
)

function Onboarding({ done }: { done: () => void }) {
  const [s, setS] = useState(1)
  const [org, setOrg] = useState({ name: 'PT Sentra Facility Management', type: 'Perusahaan pengelola gedung', industry: 'Facility management', email: 'ops@sentra-fm.example', contact: 'Andi Pratama' })
  const [bld, setBld] = useState({ name: '', address: '', cat: 'Perkantoran', floors: '', age: '', supply: 'PDAM', docs: 'Sebagian' })
  const [invites, setInvites] = useState('')
  const { addBuilding, toast } = useApp()
  const next = () => {
    if (s === 1 && !org.name.trim()) return toast('Nama organisasi wajib diisi.', 'err')
    if (s === 2 && bld.name.trim()) addBuilding({ id: 'b' + Date.now(), name: bld.name, address: bld.address, category: bld.cat, floors: +bld.floors || 1, age: +bld.age || 0, docs: bld.docs === 'Tidak ada' ? 'Belum ada' : 'Parsial', updated: new Date().toISOString().slice(0, 10), notes: '' })
    setS(s + 1)
  }
  return (
    <div className="card" style={{ width: 'min(520px,100%)' }}>
      <div className="stepper">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= s ? 'on' : ''} />)}</div>
      <p className="xs">Langkah {s} dari 4</p>
      {s === 1 && <div className="col"><h2>Pengaturan organisasi</h2>
        <Field label="Nama organisasi"><input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} /></Field>
        <div className="grid g2 stack"><Field label="Jenis organisasi"><input value={org.type} onChange={(e) => setOrg({ ...org, type: e.target.value })} /></Field><Field label="Industri"><input value={org.industry} onChange={(e) => setOrg({ ...org, industry: e.target.value })} /></Field></div>
        <div className="grid g2 stack"><Field label="Email organisasi"><input type="email" value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} /></Field><Field label="Kontak utama"><input value={org.contact} onChange={(e) => setOrg({ ...org, contact: e.target.value })} /></Field></div></div>}
      {s === 2 && <div className="col"><h2>Tambah gedung pertama <span className="sm faint">(opsional)</span></h2>
        <Field label="Nama gedung"><input value={bld.name} onChange={(e) => setBld({ ...bld, name: e.target.value })} /></Field>
        <Field label="Alamat"><input value={bld.address} onChange={(e) => setBld({ ...bld, address: e.target.value })} /></Field>
        <div className="grid g3 stack"><Field label="Kategori"><input value={bld.cat} onChange={(e) => setBld({ ...bld, cat: e.target.value })} /></Field><Field label="Jumlah lantai"><input type="number" min="1" value={bld.floors} onChange={(e) => setBld({ ...bld, floors: e.target.value })} /></Field><Field label="Perkiraan usia (thn)"><input type="number" min="0" value={bld.age} onChange={(e) => setBld({ ...bld, age: e.target.value })} /></Field></div>
        <div className="grid g2 stack"><Field label="Sumber air utama"><select value={bld.supply} onChange={(e) => setBld({ ...bld, supply: e.target.value })}><option>PDAM</option><option>Sumur</option><option>Campuran</option></select></Field>
          <Field label="Dokumentasi jaringan pipa"><select value={bld.docs} onChange={(e) => setBld({ ...bld, docs: e.target.value })}><option>Lengkap</option><option>Sebagian</option><option>Tidak ada</option></select></Field></div></div>}
      {s === 3 && <div className="col"><h2>Undang tim <span className="sm faint">(opsional)</span></h2><p className="muted">Masukkan email, pisahkan dengan koma. Peran dapat diatur di Manajemen Tim.</p>
        <Field label="Email anggota"><textarea value={invites} onChange={(e) => setInvites(e.target.value)} placeholder="supervisor@contoh.id, teknisi@contoh.id" /></Field></div>}
      {s === 4 && <div className="col" style={{ alignItems: 'center', textAlign: 'center', padding: '12px 0' }}><CheckCircle2 size={44} color="var(--teal)" strokeWidth={1.4} /><h2>Ruang kerja diagnostik Anda siap.</h2>
        <p className="muted">Anda kini dapat mendokumentasikan gedung, mengatur informasi jaringan pipa, dan memulai investigasi terstruktur.</p></div>}
      <div className="row between" style={{ marginTop: 18 }}>
        <button className="btn" disabled={s === 1} onClick={() => setS(s - 1)}>Kembali</button>
        <div className="row">{(s === 2 || s === 3) && <button className="btn" onClick={() => setS(s + 1)}>Lewati</button>}
          {s < 4 ? <button className="btn pri" onClick={next}>Lanjut</button> : <button className="btn pri" onClick={done}>Buka Dasbor</button>}</div>
      </div>
    </div>
  )
}

export default function Login() {
  const { login, toast } = useApp()
  const nav = useNavigate()
  const [email, setEmail] = useState('andi.pratama@sentra-fm.example'), [pw, setPw] = useState('demo1234'), [show, setShow] = useState(false), [onb, setOnb] = useState(false)
  const enter = () => { login(); nav('/dashboard') }
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Masukkan email kerja yang valid.', 'err'); if (pw.length < 6) return toast('Kata sandi minimal 6 karakter.', 'err'); enter() }
  return (
    <div className="auth">
      <div className="l"><Net /><Logo light size={44} /><div style={{ position: 'relative' }}><h1>Setiap inspeksi jadi lebih bermakna.</h1>
        <p>AlurSense membantu tim pemeliharaan menyelidiki kebocoran pipa secara sistematis, memahami ketidakpastian jaringan, dan memilih pemeriksaan diagnostik berikutnya yang paling berguna.</p></div>
        <p className="sm" style={{ position: 'relative' }}>Ketahui langkah berikutnya. Tentukan lokasi dengan yakin.</p></div>
      <div className="r">
        {onb ? <Onboarding done={enter} /> : (
          <form className="col" style={{ width: 'min(380px,100%)', gap: 16 }} onSubmit={submit}>
            <div><h2 style={{ fontSize: 24 }}>Masuk ke AlurSense</h2><p className="muted">Mode demo: kredensial sudah terisi, data fiktif.</p></div>
            <Field label="Email kerja"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
            <Field label="Kata sandi"><div style={{ position: 'relative' }}><input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /><button type="button" className="ib" aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} style={{ position: 'absolute', right: 2, top: 2 }} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div></Field>
            <div className="row between sm"><label className="row" style={{ gap: 6 }}><input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />Ingat saya</label><a href="#/login" onClick={(e) => { e.preventDefault(); toast('Tautan reset dikirim (simulasi demo).', 'info') }}>Lupa kata sandi?</a></div>
            <button className="btn pri" style={{ height: 42, justifyContent: 'center' }}>Masuk</button>
            <button type="button" className="btn" style={{ justifyContent: 'center' }} onClick={() => { toast('Google Workspace SSO disimulasikan pada demo ini.', 'info'); enter() }}>Lanjut dengan Google Workspace</button>
            <button type="button" className="btn" style={{ justifyContent: 'center', border: 0 }} onClick={() => setOnb(true)}>Pertama kali? Mulai pengaturan</button>
            <p className="sm faint">Dengan masuk Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi.</p>
          </form>)}
      </div>
    </div>
  )
}
