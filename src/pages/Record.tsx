import { useState } from 'react'

import { useApp, ME } from '../store.tsx'
import { Field, FileUpload, Modal, Notice } from '../ui.tsx'
import { EXAMS, exDef, SUPPORT, type Classification, type ExamId } from '../data.ts'
import type { ResultInput } from '../engine.ts'

export const CLS: Classification[] = ['Mendukung hipotesis', 'Melemahkan hipotesis', 'Tidak meyakinkan', 'Tidak ada temuan signifikan', 'Perlu review lanjutan']
// Contoh pengisian untuk demonstrasi (fiktif). Bukan pengukuran nyata.
const SAMPLE: Partial<Record<ExamId, { summary: string; support: string; against: string; el: string }>> = {
  meter: { summary: 'Pola konsumsi menunjukkan lonjakan intermiten pada malam hari yang selaras dengan periode observasi kelembapan (data demonstrasi fiktif).', support: 'Lonjakan terjadi berulang pada jam non-operasional', against: 'Resolusi pembacaan harian terbatas', el: 'M-01' },
  acoustic: { summary: 'Pembacaan di titik akses koridor Blok B menunjukkan anomali ringan di dekat Zona B1 (data demonstrasi fiktif).', support: 'Anomali terlokalisasi di sekitar koridor B1', against: 'Kebisingan lingkungan cukup tinggi', el: 'P-04' },
  docs: { summary: 'Catatan renovasi 2016 menyebut penambahan sambungan ke Blok B yang tidak tergambar pada as-built 2009 (data demonstrasi fiktif).', support: 'Catatan renovasi 2016', against: '', el: 'P-04' },
  visual: { summary: 'Bercak lembap terlihat di sudut plafon koridor B1; belum ada indikasi sumber (data demonstrasi fiktif).', support: 'Bercak lembap terdokumentasi foto', against: '', el: 'ZB1' },
}

export default function RecordModal({ invId, planId, type, onClose }: { invId?: string; planId?: string; type?: ExamId; onClose: () => void }) {
  const { inv, net, users, recordResult, saveDraftExam, toast } = useApp()
  const [id, setId] = useState(invId ?? inv.find((i) => i.status === 'Berjalan')?.id ?? inv[0].id)
  const it = inv.find((i) => i.id === id)!
  const plan = it.exams.find((e) => e.id === planId)
  const [f, setF] = useState({ type: (plan?.type ?? type ?? 'meter') as ExamId, tech: plan?.tech ?? ME, date: '2026-11-09', element: plan?.element ?? 'M-01', ref: '', summary: '', cls: CLS[0] as Classification, target: it.hyps[0].id, quality: 'Baik', support: '', against: '', equip: '', procedure: 'Ya', notes: '', verifyDoc: false, files: '' })
  const [err, setErr] = useState<string>('')
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))
  const def = exDef(f.type)
  const needsTarget = f.cls === CLS[0] || f.cls === CLS[1]
  const blocked = def.auth && f.procedure !== 'Ya'
  const input = (): ResultInput => ({ type: f.type, cls: f.cls, target: needsTarget ? f.target : undefined, quality: f.quality, summary: f.summary, support: f.support, against: f.against, element: f.element, procedure: f.procedure, ref: f.ref, tech: f.tech, date: f.date, planId })
  const fill = () => { const s = SAMPLE[f.type]; if (s) setF({ ...f, summary: s.summary, support: s.support, against: s.against, element: s.el, cls: CLS[0], target: it.hyps[0].id, quality: 'Baik' }); else toast('Tidak ada contoh untuk jenis ini.', 'info') }
  const submit = () => {
    setErr('')
    if (f.summary.trim().length < 5) return setErr('Ringkasan hasil wajib diisi (minimal 5 karakter).')
    if (blocked) return setErr('Otorisasi diperlukan: hasil tidak dapat disubmit/disetujui sampai supervisor meninjau prasyarat dan prosedur lokasi. Simpan sebagai draf.')
    try { recordResult(id, input(), f.verifyDoc && f.type === 'docs'); toast('Hasil pemeriksaan tersimpan. Bukti, hipotesis, dan rekomendasi telah diperbarui.'); onClose() }
    catch (e) { setErr((e as Error).message); toast('Gagal menyimpan hasil pemeriksaan.', 'err') }
  }
  return (
    <Modal wide title="Catat Hasil Pemeriksaan" onClose={onClose} footer={<>
      <button className="btn" onClick={onClose}>Batal</button>
      <button className="btn" onClick={() => { saveDraftExam(id, input()); toast('Draf tersimpan.'); onClose() }}>Simpan draf</button>
      <button className="btn pri" onClick={submit}>Kirim untuk review</button></>}>
      <Notice kind="info">Hasil yang Anda catat akan memperbarui bukti, hipotesis, dan rekomendasi. Ini model pendukung keputusan ilustratif; data pada demo bersifat fiktif.</Notice>
      <div className="row between"><h4>Detail umum</h4><button className="btn sm" onClick={fill}>Isi contoh demo</button></div>
      <div className="grid g3 stack">
        <Field label="ID investigasi"><select value={id} disabled={!!invId} onChange={(e) => { setId(e.target.value); const n = inv.find((i) => i.id === e.target.value)!; set('target', n.hyps[0].id) }}>{inv.filter((i) => i.status !== 'Selesai').map((i) => <option key={i.id} value={i.id}>{i.id} — {i.title}</option>)}</select></Field>
        <Field label="Jenis pemeriksaan"><select value={f.type} disabled={!!plan} onChange={(e) => set('type', e.target.value as ExamId)}>{EXAMS.map((e) => <option key={e.id} value={e.id} disabled={e.avail === 'unavailable'}>{e.name}{e.avail === 'unavailable' ? ' (tidak tersedia)' : ''}</option>)}</select></Field>
        <Field label="Teknisi"><select value={f.tech} onChange={(e) => set('tech', e.target.value)}>{users.filter((u) => u.role === 'Teknisi' || u.role === 'Supervisor').map((u) => <option key={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Tanggal pemeriksaan"><input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
        <Field label="Bagian jaringan terkait"><select value={f.element} onChange={(e) => set('element', e.target.value)}>{net.map((e) => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}</select></Field>
        <Field label="Referensi pemeriksaan"><input value={f.ref} onChange={(e) => set('ref', e.target.value)} placeholder={def.sop} /></Field></div>
      <h4>Hasil</h4>
      <Field label="Ringkasan hasil"><textarea value={f.summary} onChange={(e) => set('summary', e.target.value)} /></Field>
      <div className="grid g3 stack">
        <Field label="Klasifikasi hasil"><select value={f.cls} onChange={(e) => set('cls', e.target.value as Classification)}>{CLS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        {needsTarget && <Field label="Hipotesis terkait"><select value={f.target} onChange={(e) => set('target', e.target.value)}>{it.hyps.map((h) => <option key={h.id} value={h.id}>{h.id} — {h.title} ({SUPPORT[h.support]})</option>)}</select></Field>}
        <Field label="Kualitas data"><select value={f.quality} onChange={(e) => set('quality', e.target.value)}><option>Baik</option><option>Cukup</option><option>Rendah</option></select></Field></div>
      {f.quality === 'Rendah' && <Notice kind="warn">Kualitas data rendah: hasil dicatat sebagai bukti tetapi tidak akan mengubah tingkat dukungan hipotesis.</Notice>}
      <div className="grid g2 stack"><Field label="Bukti pendukung"><textarea style={{ minHeight: 56 }} value={f.support} onChange={(e) => set('support', e.target.value)} /></Field><Field label="Bukti yang bertentangan"><textarea style={{ minHeight: 56 }} value={f.against} onChange={(e) => set('against', e.target.value)} /></Field></div>
      <div className="grid g2 stack"><Field label="Informasi peralatan"><input value={f.equip} onChange={(e) => set('equip', e.target.value)} /></Field><Field label="Catatan teknisi"><input value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field></div>
      {f.type === 'docs' && <label className="row sm"><input type="checkbox" style={{ width: 16, height: 16 }} checked={f.verifyDoc} onChange={(e) => set('verifyDoc', e.target.checked)} />Tandai {f.element} sebagai terverifikasi pada dokumentasi jaringan (hanya bila telaah dokumen benar-benar mengonfirmasinya)</label>}
      <FileUpload label="Lampiran" onFiles={(n) => set('files', n.join(', '))} />
      <Field label="Apakah pemeriksaan dilakukan dengan prosedur yang disetujui?"><select value={f.procedure} onChange={(e) => set('procedure', e.target.value)}><option>Ya</option><option>Tidak berlaku</option><option>Perlu review</option></select></Field>
      {def.auth && <Notice kind="warn" title="Otorisasi diperlukan.">Pemeriksaan ini tidak dapat ditandai disetujui sampai supervisor yang ditunjuk meninjau prasyarat dan prosedur lokasi yang berlaku. AlurSense tidak memberikan instruksi operasi fisik.</Notice>}
      {err && <Notice kind="crit" title="Tidak dapat menyimpan">{err}</Notice>}
    </Modal>
  )
}
