import { useState } from 'react'
import { useApp } from '../store.tsx'
import { DocBadge, ErrorState, FileUpload, Notice, PageHeader, Tabs, dt } from '../ui.tsx'
import { completeness } from '../data.ts'
import NetworkView from './NetworkView.tsx'

export default function Networks() {
  const { net, netHist, canApprove, toast, logAudit } = useApp()
  const [tab, setTab] = useState('Ikhtisar'), [imports, setImports] = useState<{ n: string; s: 'Menunggu' | 'Disetujui' | 'Ditolak' }[]>([]), [fail, setFail] = useState(false)
  const nodes = net.filter((e) => e.kind === 'node'), segs = net.filter((e) => e.kind === 'seg')
  return (
    <>
      <PageHeader title="Jaringan Pipa" sub="Kelola skema jaringan, status verifikasi, dan dokumentasi per gedung." />
      <Tabs tabs={['Ikhtisar', 'Editor & Elemen', 'Impor Dokumentasi', 'Riwayat Perubahan']} value={tab} onChange={setTab} />
      {tab === 'Ikhtisar' && <div className="col" style={{ gap: 16 }}>
        <div className="grid g6">
          {[['Gedung', 'Gedung Sentra Utama'], ['Node terdokumentasi', nodes.filter((e) => e.status !== 'unknown').length], ['Koneksi terdokumentasi', segs.filter((e) => e.status === 'known' || e.status === 'verified').length], ['Koneksi belum terverifikasi', segs.filter((e) => e.status === 'unverified').length], ['Segmen tidak diketahui', segs.filter((e) => e.status === 'unknown').length], ['Pembaruan terakhir', dt(netHist[0]?.date ?? '2026-11-08')]].map(([l, v]) => <div className="card" key={String(l)}><p className="sm muted">{l}</p><b style={{ font: '700 18px Manrope' }}>{v}</b></div>)}</div>
        <NetworkView />
        <p className="sm faint">Kelengkapan {completeness(net)}% (ilustratif). Gedung Arunika dan Kompleks Perkantoran Merdeka belum memiliki jaringan terdokumentasi.</p></div>}
      {tab === 'Editor & Elemen' && <div className="card flush"><div className="tw"><table><thead><tr>{['ID', 'Jenis', 'Nama', 'Lokasi', 'Status', 'Sumber', 'Verifikasi', 'Deskripsi'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{net.map((e) => <tr key={e.id}><td><b>{e.id}</b></td><td>{e.type}</td><td>{e.name}</td><td>{e.location}</td><td><DocBadge s={e.status} /></td><td>{e.source}</td><td>{e.verified ? dt(e.verified) : '—'}</td><td className="muted">{e.desc || '—'}</td></tr>)}</tbody></table></div>
        <div style={{ padding: 14 }}><Notice kind="info">Ubah status dan tambahkan catatan dari panel &ldquo;Detail Elemen Jaringan&rdquo; pada tab Ikhtisar. Penambahan elemen baru belum tersedia pada prototipe ini.</Notice></div></div>}
      {tab === 'Impor Dokumentasi' && <div className="card col">
        <Notice kind="warn">Dokumentasi yang diimpor harus ditinjau sebelum diperlakukan sebagai informasi jaringan terverifikasi. Prototipe ini tidak mengekstrak jaringan secara otomatis — berkas disimpan sebagai <b>berkas referensi</b>.</Notice>
        <FileUpload label="Unggah gambar PDF, diagram JPG/PNG, atau CSV" accept=".pdf,image/*,.csv" onFiles={(n) => setImports((p) => [...p, ...n.map((x) => ({ n: x, s: 'Menunggu' as const }))])} />
        <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setFail(true); toast('Gagal memuat dokumentasi jaringan (simulasi).', 'err') }}>Simulasikan kegagalan muat</button>
        {fail && <ErrorState title="Tidak dapat memuat dokumentasi jaringan" text="Periksa koneksi lalu coba lagi." retry={() => { setFail(false); toast('Dimuat ulang.', 'info') }} />}
        {imports.map((i, k) => <div key={k} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}><span className="grow">{i.n}</span><span className={`badge ${i.s === 'Disetujui' ? 'b-ok' : i.s === 'Ditolak' ? 'b-crit' : 'b-warn'}`}>{i.s}</span>
          {i.s === 'Menunggu' && (canApprove ? <><button className="btn sm pri" onClick={() => { setImports(imports.map((x, j) => (j === k ? { ...x, s: 'Disetujui' } : x))); logAudit('Menyetujui berkas referensi', i.n); toast('Berkas disetujui sebagai referensi.') }}>Setujui</button><button className="btn sm" onClick={() => setImports(imports.map((x, j) => (j === k ? { ...x, s: 'Ditolak' } : x)))}>Tolak</button></> : <span className="sm faint">Perlu supervisor/admin</span>)}</div>)}</div>}
      {tab === 'Riwayat Perubahan' && <div className="card flush"><div className="tw"><table><thead><tr>{['Tanggal', 'Elemen', 'Diubah oleh', 'Perubahan', 'Nilai sebelumnya', 'Nilai baru'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{netHist.map((h) => <tr key={h.id}><td>{dt(h.date)}</td><td><b>{h.el}</b></td><td>{h.who}</td><td>{h.what}</td><td>{h.prev}</td><td>{h.next}</td></tr>)}</tbody></table></div></div>}
    </>
  )
}
