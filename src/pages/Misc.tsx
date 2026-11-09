import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.tsx'
import { Empty, Field, Notice, PageHeader, Pills, SearchBox, Tabs, dt } from '../ui.tsx'

export function Notifications() {
  const { notifs, audit, readNotif } = useApp()
  const nav = useNavigate(), [f, setF] = useState('Semua'), [tab, setTab] = useState('Notifikasi')
  const list = notifs.filter((n) => f === 'Semua' || n.type === f)
  return (
    <>
      <PageHeader title="Notifikasi" sub="Pembaruan investigasi, persetujuan, dan aktivitas jaringan."><button className="btn" onClick={() => readNotif()}>Tandai semua dibaca</button></PageHeader>
      <Tabs tabs={['Notifikasi', 'Log Audit']} value={tab} onChange={setTab} />
      {tab === 'Notifikasi' ? <><Pills opts={['Semua', 'Investigasi', 'Persetujuan', 'Jaringan', 'Tim']} value={f} onChange={setF} />
        <div className="card flush" style={{ marginTop: 14 }}>{list.length === 0 ? <Empty title="Tidak ada notifikasi" text="Anda sudah mengikuti semua pembaruan." /> : list.map((n) => (
          <button key={n.id} onClick={() => { readNotif(n.id); nav(n.to) }} className="row" style={{ width: '100%', textAlign: 'left', border: 0, borderBottom: '1px solid var(--line)', background: n.read ? '#fff' : '#F4FBFA', padding: '14px 18px' }}>
            <span className={`badge ${n.read ? '' : 'b-teal'}`}>{n.type}</span><span className="grow">{n.text}</span><span className="sm faint">{dt(n.at)}</span></button>))}</div></>
        : <div className="card flush"><div className="tw"><table><thead><tr>{['Waktu', 'Pengguna', 'Aktivitas', 'Objek'].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{audit.map((a) => <tr key={a.id}><td>{dt(a.at)}</td><td>{a.who}</td><td>{a.action}</td><td>{a.obj}</td></tr>)}</tbody></table></div></div>}
    </>
  )
}

export function SettingsPage() {
  const { toast, lang, setLang, reset } = useApp()
  const [tab, setTab] = useState('Organisasi'), [org, setOrg] = useState('PT Sentra Facility Management'), [prefs, setPrefs] = useState({ inv: true, appr: true, net: false })
  return (
    <>
      <PageHeader title="Pengaturan" sub="Profil organisasi, preferensi, dan keamanan." />
      <Tabs tabs={['Organisasi', 'Profil', 'Notifikasi', 'Laporan', 'Bahasa', 'Keamanan']} value={tab} onChange={setTab} />
      <div className="card col" style={{ maxWidth: 640 }}>
        {tab === 'Organisasi' && <><Field label="Nama organisasi"><input value={org} onChange={(e) => setOrg(e.target.value)} /></Field><Field label="Email organisasi"><input defaultValue="ops@sentra-fm.example" /></Field></>}
        {tab === 'Profil' && <><Field label="Nama"><input defaultValue="Andi Pratama" /></Field><Field label="Email"><input defaultValue="andi.pratama@sentra-fm.example" /></Field></>}
        {tab === 'Notifikasi' && (['inv', 'appr', 'net'] as const).map((k) => <label key={k} className="row"><input type="checkbox" style={{ width: 16, height: 16 }} checked={prefs[k]} onChange={() => setPrefs({ ...prefs, [k]: !prefs[k] })} />{{ inv: 'Pembaruan investigasi', appr: 'Permintaan persetujuan', net: 'Perubahan jaringan' }[k]}</label>)}
        {tab === 'Laporan' && <><Field label="Templat laporan"><select><option>Standar 13 bagian</option></select></Field><Field label="Tampilkan label data demonstrasi"><select><option>Selalu</option></select></Field></>}
        {tab === 'Bahasa' && <><Field label="Bahasa antarmuka"><select value={lang} onChange={(e) => setLang(e.target.value)}><option value="id">Bahasa Indonesia</option><option value="en">English</option></select></Field>{lang === 'en' && <Notice>Terjemahan bahasa Inggris belum tersedia pada prototipe ini; antarmuka tetap Bahasa Indonesia.</Notice>}</>}
        {tab === 'Keamanan' && <><Field label="Autentikasi dua langkah"><select><option>Dinonaktifkan (demo)</option></select></Field><button className="btn dng" style={{ alignSelf: 'flex-start' }} onClick={reset}>Reset data demo</button></>}
        <button className="btn pri" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Pengaturan disimpan.')}>Simpan</button>
      </div>
    </>
  )
}

const TOPICS = [
  ['Memulai', 'Masuk, atur organisasi, tambahkan gedung, dan undang tim. Gunakan Reset data demo untuk memulai ulang skenario AS-0261.'],
  ['Membuat investigasi', 'Klik “Investigasi Baru”, isi lima langkah (informasi, masalah, jaringan, bukti awal, tinjau). Tanpa bukti awal, sistem menampilkan “bukti belum cukup”.'],
  ['Memahami peta jaringan', 'Garis biru solid = diketahui; putus-putus abu = belum terverifikasi; titik-titik abu = tidak diketahui; penanda teal = terverifikasi; sorotan amber = area dicurigai (hipotesis, bukan kebocoran terkonfirmasi).'],
  ['Memahami rekomendasi diagnostik', 'Nilai = perkiraan perolehan informasi − penalti upaya − penalti dampak operasional. Ini model ilustratif yang transparan, bukan rumus rekayasa tervalidasi.'],
  ['Mencatat hasil pemeriksaan', 'Pilih jenis, klasifikasi hasil, hipotesis terkait, dan kualitas data. Pemeriksaan yang memerlukan otorisasi tidak dapat disetujui tanpa prosedur yang disetujui.'],
  ['Membuat laporan', 'Buka Laporan & Analitik → Buat Laporan, pilih kasus, tinjau pratinjau 13 bagian, lalu Unduh PDF (dialog cetak) atau ekspor data.'],
  ['Peran & hak akses', 'Teknisi mencatat hasil; Supervisor menyetujui; Manager melihat analitik; Administrator mengelola pengguna. Ganti peran demo di menu profil.'],
  ['Pengelolaan data', 'Seluruh data demo disimpan lokal di peramban dan bersifat fiktif. Tidak ada sensor atau infrastruktur nyata yang terhubung.'],
]
export function Help() {
  const [q, setQ] = useState('')
  const list = TOPICS.filter(([t, b]) => `${t} ${b}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeader title="Pusat Bantuan" sub="Panduan singkat penggunaan AlurSense." />
      <div style={{ marginBottom: 16 }}><SearchBox value={q} onChange={setQ} ph="Cari topik bantuan…" /></div>
      <div className="grid g2">{list.map(([t, b]) => <div key={t} className="card"><h3>{t}</h3><p className="muted" style={{ marginTop: 6 }}>{b}</p></div>)}</div>
      {!list.length && <Empty title="Topik tidak ditemukan" text="Coba kata kunci lain." />}
      <p className="sm faint" style={{ marginTop: 16 }}>AlurSense adalah prototipe pendukung keputusan; belum memiliki sertifikasi atau persetujuan otoritas rekayasa. Semua pemeriksaan fisik tetap menjadi tanggung jawab personel berkualifikasi.</p>
    </>
  )
}
