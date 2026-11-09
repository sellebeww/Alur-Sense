import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react'
import { useApp } from '../store.tsx'
import { Confirm, Field, Meter, Modal, Notice, SupportBadge, dt } from '../ui.tsx'
import { EFFORT, IMPACT, SUPPORT, completeness, type ExamId, type Inv } from '../data.ts'
import { recommend, type Rec } from '../engine.ts'
import RecordModal from './Record.tsx'

const infoLabel = (r: Rec) => (r.def.auth ? 'Berpotensi Tinggi' : r.gain >= 6 ? 'Tinggi' : r.gain >= 4 ? 'Sedang–Tinggi' : r.gain >= 2 ? 'Sedang' : 'Rendah')
const infoN = (r: Rec) => (r.def.auth ? 3 : r.gain >= 6 ? 3 : r.gain >= 4 ? 2 : r.gain >= 2 ? 1 : 0)
const prio = (r: Rec) => (r.rank === 1 && r.value >= 4 ? 'Tinggi' : r.value >= 2 ? 'Sedang' : 'Rendah')

export default function DiagnosticPlan({ inv }: { inv: Inv }) {
  const { net, users, canApprove, planExam, approveExam, decide, toast } = useApp()
  const st = useMemo(() => recommend(inv, net), [inv, net])
  const [detail, setDetail] = useState<Rec | null>(null), [plan, setPlan] = useState<Rec | null>(null), [pick, setPick] = useState(false), [defer, setDefer] = useState(false), [rec, setRec] = useState<{ type?: ExamId; planId?: string } | null>(null)
  const ranked = st.recs.filter((r) => r.rank)
  const top = ranked[0]
  const planned = inv.exams.filter((e) => e.status !== 'Selesai')
  const comp = completeness(net)
  const hasPending = planned.some((e) => e.status !== 'Draft')
  const blockedAll = st.insufficient

  return (
    <div className="col" style={{ gap: 16 }}>
      <div><h2>Rekomendasi Pemeriksaan Berikutnya</h2><p className="muted">Tinjau bukti yang tersedia dan tentukan pemeriksaan mana yang dapat memberi informasi tambahan paling berguna.</p></div>

      {st.insufficient && <Notice kind="warn" title="Belum cukup bukti untuk merekomendasikan pemeriksaan berikutnya.">Tinjau observasi yang ada, perbaiki dokumentasi jaringan, atau catat informasi terverifikasi tambahan. Sistem tidak akan membuat rekomendasi hanya untuk mengisi layar.</Notice>}
      {st.contradictory && <Notice kind="crit" title="Sebagian hasil pemeriksaan tidak mendukung hipotesis yang sama.">Tinjau bukti sebelum melanjutkan ke pemeriksaan lain. Pertimbangkan meminta review supervisor.</Notice>}
      {st.incomplete && <Notice kind="info" title="Informasi jaringan belum lengkap.">Rekomendasi yang melibatkan bagian ini (mis. koneksi J-02 → P-04) mungkin kurang andal sampai informasi koneksinya ditinjau. Kelengkapan saat ini {comp}% (angka ilustratif).</Notice>}
      {st.strong && <Notice kind="ok" title={`${st.strong.id} memiliki dukungan kuat — namun belum terkonfirmasi sebagai lokasi kebocoran.`}>Dukungan kuat berarti bukti saat ini konsisten, bukan bukti pasti. Verifikasi tetap perlu dilakukan oleh personel berkualifikasi sesuai prosedur resmi, dengan review supervisor.</Notice>}
      {st.diminishing && !st.insufficient && <Notice kind="info" title="Nilai informasi tambahan kecil.">Pemeriksaan tambahan diperkirakan hanya menambah sedikit informasi. Pertimbangkan review supervisor dan penyusunan laporan.</Notice>}

      {!blockedAll && top && (
        <div className="grid g21">
          <div className="rec lead">
            <div className="row between wrap"><span className="xs" style={{ color: 'var(--teal)' }}>Langkah berikutnya yang direkomendasikan</span><span className={`badge ${prio(top) === 'Tinggi' ? 'b-crit' : 'b-warn'}`}>Prioritas: {prio(top)}</span></div>
            <h2 style={{ fontSize: 24 }}>{top.def.name}</h2>
            <div><p className="xs">Alasan</p><p>{top.reason}</p></div>
            <div className="grid g2 stack"><div><p className="xs">Informasi yang diharapkan</p><p className="sm">{top.info}</p></div><div><p className="xs">Mengapa di atas alternatif</p><p className="sm">Nilai bersih tertinggi ({top.value}){ranked[1] ? ` dibanding ${ranked[1].def.name} (${ranked[1].value})` : ''}, karena perolehan informasinya besar sementara upaya dan dampaknya kecil.</p></div></div>
            <div className="row wrap"><button className="btn pri" disabled={hasPending} onClick={() => setPlan(top)}><CheckCircle2 />Terima Rekomendasi</button>
              <button className="btn" onClick={() => { decide(inv.id, 'Meminta review supervisor atas rekomendasi.'); toast('Permintaan review dikirim ke ' + inv.supervisor + '.') }}>Minta Review Supervisor</button>
              <button className="btn" onClick={() => setPick(true)}>Pilih Alternatif</button><button className="btn" onClick={() => setDefer(true)}>Tunda Pemeriksaan</button></div>
            {hasPending && <p className="sm muted">Sudah ada rencana pemeriksaan aktif di bawah. Catat hasilnya terlebih dahulu.</p>}
            <p className="sm faint"><ShieldCheck size={13} style={{ verticalAlign: -2 }} /> Sistem tidak pernah memulai pengujian fisik secara otomatis; keputusan ada pada manusia.</p>
          </div>
          <div className="card"><h3>Penjelasan</h3>
            <dl className="kv" style={{ marginTop: 8 }}>
              <dt>Nilai informasi</dt><dd><span className="row">{infoLabel(top)} <Meter n={infoN(top)} /></span></dd>
              <dt>Perkiraan upaya</dt><dd>{EFFORT[top.def.effort]}</dd>
              <dt>Ketersediaan data</dt><dd>{top.def.availNote}</dd>
              <dt>Potensi dampak layanan</dt><dd>{IMPACT[top.def.impact]}</dd>
              <dt>Mengurangi</dt><dd>{top.reduces.join('; ') || '—'}</dd>
              <dt>Prasyarat</dt><dd>{top.prerequisites.join('; ')}</dd></dl>
            <p className="xs" style={{ marginTop: 12 }}>Bukti pendukung</p>
            {inv.evidence.slice(0, 3).map((e) => <p key={e.id} className="sm" style={{ marginTop: 3 }}>• {e.text}</p>)}
            <p className="sm faint" style={{ marginTop: 10 }}>Skor bersifat ilustratif pada demo: {top.gain} − {top.effortPen} − {top.impactPen} = <b>{top.value}</b></p></div>
        </div>)}

      {!blockedAll && <>
        <h3>Alternatif Pemeriksaan</h3>
        <div className="grid g3">{ranked.slice(0, 3).map((r, i) => (
          <div key={r.def.id} className="rec"><span className="xs">Opsi {i + 1}</span><h3>{r.def.name}</h3><p className="sm muted">{r.def.desc}</p>
            <dl className="kv"><dt>Nilai informasi</dt><dd>{infoLabel(r)}</dd><dt>Upaya</dt><dd>{EFFORT[r.def.effort]}</dd><dt>Dampak operasional</dt><dd>{IMPACT[r.def.impact]}</dd><dt>Ketersediaan</dt><dd>{r.def.availNote}</dd></dl>
            <button className="btn" style={{ marginTop: 'auto' }} onClick={() => setDetail(r)}>Lihat Rekomendasi <ArrowRight /></button></div>))}</div>

        <div className="card flush"><div className="ch" style={{ padding: '16px 18px 0' }}><h3>Perbandingan Rekomendasi</h3></div>
          <div className="tw"><table><thead><tr>{['Pemeriksaan', 'Nilai informasi', 'Perkiraan upaya', 'Potensi gangguan', 'Kesiapan data', 'Peringkat'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{st.recs.map((r) => <tr key={r.def.id} className="click" onClick={() => setDetail(r)} style={r.rank === 1 ? { background: '#F4FBFA' } : undefined}>
              <td><b>{r.def.name}</b>{r.repeat > 0 && <span className="sm faint"> · sudah dilakukan {r.repeat}×</span>}</td><td>{infoLabel(r)}</td><td>{EFFORT[r.def.effort]}</td><td>{IMPACT[r.def.impact]}</td><td className="w">{r.def.availNote}</td>
              <td>{r.rank ? <span className="badge b-teal">#{r.rank} · skor {r.value}</span> : <span className="badge">Tidak tersedia</span>}</td></tr>)}</tbody></table></div></div>

        <div className="card"><h3>Mengapa rekomendasi ini?</h3>
          <p className="muted" style={{ margin: '6px 0 8px' }}>Sistem mempertimbangkan enam hal. Ini model ilustratif yang transparan: <i>Nilai = Perkiraan perolehan informasi − penalti upaya − penalti dampak operasional</i>; bukan rumus rekayasa tervalidasi.</p>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Ketidakpastian diagnostik saat ini — waktu {Math.round(st.unc.temporal * 100)}%, topologi {Math.round(st.unc.topology * 100)}%, lokasi {Math.round(st.unc.spatial * 100)}%.</li><li>Bukti yang tersedia ({inv.evidence.length} entri, {inv.exams.filter((e) => e.status === 'Selesai').length} pemeriksaan selesai).</li>
            <li>Apakah pemeriksaan dapat membedakan hipotesis yang bersaing.</li><li>Perkiraan upaya.</li><li>Potensi gangguan layanan.</li><li>Ketersediaan peralatan dan otorisasi.</li></ol></div>
      </>}

      {planned.length > 0 && <div className="card"><h3>Rencana Pemeriksaan</h3><div className="col" style={{ marginTop: 8 }}>
        {planned.map((e) => <div key={e.id} className="row wrap" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
          <ClipboardCheck size={18} color="var(--teal)" /><div className="grow"><b>{e.id} · {st.recs.find((r) => r.def.id === e.type)?.def.name}</b><p className="sm muted">Teknisi: {e.tech} · {e.status}</p></div>
          {e.status === 'Menunggu Persetujuan' && (canApprove ? <button className="btn sm pri" onClick={() => { approveExam(inv.id, e.id); toast('Rencana disetujui.') }}>Setujui</button> : <span className="sm faint">Menunggu supervisor (ganti peran demo untuk menyetujui)</span>)}
          {(e.status === 'Direncanakan' || e.status === 'Disetujui' || e.status === 'Draft') && <button className="btn sm pri" onClick={() => setRec({ type: e.type, planId: e.id })}>Catat Hasil</button>}</div>)}</div></div>}

      <h3>Hipotesis Lokasi</h3>
      <div className="grid g3">{inv.hyps.map((h) => (
        <div key={h.id} className="card col" style={{ gap: 8 }}><div className="row between"><b>{h.id}</b><SupportBadge n={h.support} /></div><h4>{h.title}</h4>
          <div><p className="xs">Bukti pendukung</p>{h.supporting.length ? h.supporting.map((s, i) => <p key={i} className="sm">• {s}</p>) : <p className="sm faint">Belum ada</p>}</div>
          <div><p className="xs">Bukti yang bertentangan</p>{h.against.length ? h.against.map((s, i) => <p key={i} className="sm">• {s}</p>) : <p className="sm faint">Belum ada</p>}</div>
          <div><p className="xs">Informasi yang masih kurang</p>{h.missing.map((s, i) => <p key={i} className="sm">• {s}</p>)}</div>
          <p className="sm"><span className="xs">Elemen terkait </span>{h.elements.join(', ')}</p>
          <p className="sm"><span className="xs">Pemeriksaan berguna </span>{top?.def.name ?? '—'}</p></div>))}</div>
      <p className="sm faint">Label dukungan bersifat kualitatif dan tidak diterjemahkan menjadi probabilitas kebocoran. Tidak satu pun lokasi dinyatakan sebagai kebocoran terkonfirmasi.</p>

      {inv.recHistory.length > 0 && <div className="card"><h3>Riwayat Rekomendasi</h3><div className="tl" style={{ marginTop: 10 }}>{[...inv.recHistory].reverse().map((r, i) => <div key={i}><span className="sm"><b>{dt(r.at)}</b> · {r.trigger}</span><p className="sm muted">Rekomendasi sebelumnya: {st.recs.find((x) => x.def.id === r.top)?.def.name ?? '—'} — {r.ranking.slice(0, 3).map((x) => `${st.recs.find((y) => y.def.id === x.type)?.def.name} (${x.value})`).join(' › ')}</p></div>)}</div></div>}

      {detail && <Modal title={detail.def.name} onClose={() => setDetail(null)} footer={<><button className="btn" onClick={() => setDetail(null)}>Tutup</button><button className="btn pri" disabled={detail.def.avail === 'unavailable' || hasPending} onClick={() => { setPlan(detail); setDetail(null) }}>Rencanakan pemeriksaan ini</button></>}>
        <p>{detail.def.desc}</p>
        <dl className="kv"><dt>Tujuan diagnostik</dt><dd>{detail.def.purpose}</dd><dt>Alasan saat ini</dt><dd>{detail.reason}</dd><dt>Mengurangi</dt><dd>{detail.reduces.join('; ') || 'Tidak ada ketidakpastian signifikan yang dikurangi'}</dd>
          <dt>Informasi yang diharapkan</dt><dd>{detail.info}</dd><dt>Peringkat</dt><dd>{detail.rank ? `#${detail.rank} — ${detail.rank === 1 ? 'tertinggi karena perolehan informasi bersih terbesar setelah dikurangi upaya dan dampak' : `di bawah #${detail.rank - 1} karena nilai bersihnya lebih rendah (${detail.value})`}` : 'Tidak diperingkat (tidak tersedia)'}</dd>
          <dt>Prasyarat</dt><dd>{detail.prerequisites.join('; ')}</dd><dt>Keterbatasan</dt><dd>{detail.def.limits}</dd><dt>Perhitungan ilustratif</dt><dd>{detail.gain} − {detail.effortPen} − {detail.impactPen} = {detail.value}</dd></dl>
        {detail.def.auth && <Notice kind="warn" title="Otorisasi diperlukan.">Pemeriksaan ini tidak dapat ditandai disetujui sampai supervisor yang ditunjuk meninjau prasyarat dan prosedur lokasi yang berlaku. Lihat {detail.def.sop} — AlurSense tidak memberikan instruksi operasi fisik.</Notice>}</Modal>}
      {plan && <PlanModal rec={plan} inv={inv} users={users.filter((u) => u.role === 'Teknisi' || u.role === 'Supervisor').map((u) => u.name)} onClose={() => setPlan(null)} onConfirm={(tech, appr) => { planExam(inv.id, plan.def.id, tech, appr); toast(plan.def.auth || appr ? 'Rencana dikirim untuk persetujuan supervisor.' : 'Rencana pemeriksaan dibuat. Catat hasilnya setelah dilakukan oleh personel berkualifikasi.'); setPlan(null) }} />}
      {pick && <Modal title="Pilih alternatif" onClose={() => setPick(false)}>{ranked.filter((r) => r !== top).map((r) => <button key={r.def.id} className="btn" style={{ justifyContent: 'space-between' }} onClick={() => { setPick(false); setPlan(r) }}>{r.def.name}<span className="faint">skor {r.value}</span></button>)}</Modal>}
      {defer && <Confirm title="Tunda pemeriksaan?" text="Keputusan menunda akan dicatat pada riwayat investigasi. Rekomendasi tetap dapat ditinjau kembali kapan saja." yes="Tunda" onNo={() => setDefer(false)} onYes={() => { decide(inv.id, `Menunda pemeriksaan yang direkomendasikan (${top?.def.name}).`); toast('Penundaan dicatat.', 'info'); setDefer(false) }} />}
      {rec && <RecordModal invId={inv.id} planId={rec.planId} type={rec.type} onClose={() => setRec(null)} />}
    </div>
  )
}

function PlanModal({ rec, inv, users, onClose, onConfirm }: { rec: Rec; inv: Inv; users: string[]; onClose: () => void; onConfirm: (tech: string, appr: boolean) => void }) {
  const [tech, setTech] = useState(inv.tech), [appr, setAppr] = useState(rec.def.auth), [ok, setOk] = useState(false), [ack, setAck] = useState(false)
  return (
    <Modal title="Rencanakan Pemeriksaan" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Batal</button><button className="btn pri" disabled={!ok || !ack} onClick={() => onConfirm(tech, appr)}>Konfirmasi rencana</button></>}>
      <h3>{rec.def.name}</h3>
      <Field label="Teknisi penanggung jawab"><select value={tech} onChange={(e) => setTech(e.target.value)}>{users.map((u) => <option key={u}>{u}</option>)}</select></Field>
      <label className="row sm"><input type="checkbox" style={{ width: 16, height: 16 }} checked={appr} disabled={rec.def.auth} onChange={(e) => setAppr(e.target.checked)} />Memerlukan persetujuan supervisor ({inv.supervisor}){rec.def.auth && ' — wajib untuk pemeriksaan ini'}</label>
      <div><p className="xs">Prasyarat</p>{rec.prerequisites.map((p) => <p key={p} className="sm">• {p}</p>)}</div>
      {rec.def.auth && <Notice kind="warn" title="Otorisasi diperlukan.">Pemeriksaan tidak dapat ditandai disetujui sampai supervisor meninjau prasyarat dan prosedur lokasi.</Notice>}
      <label className="row sm"><input type="checkbox" style={{ width: 16, height: 16 }} checked={ok} onChange={(e) => setOk(e.target.checked)} />Prasyarat telah dipahami dan akan dipenuhi sebelum pemeriksaan.</label>
      <label className="row sm"><input type="checkbox" style={{ width: 16, height: 16 }} checked={ack} onChange={(e) => setAck(e.target.checked)} /><span><AlertTriangle size={13} style={{ verticalAlign: -2 }} /> Saya memahami AlurSense tidak memulai pengujian fisik; pelaksanaan oleh personel berkualifikasi sesuai prosedur resmi.</span></label>
      <p className="sm faint">Status SUPPORT hipotesis tidak berubah sampai hasil dicatat. Skala dukungan: {SUPPORT.join(' › ')}.</p>
    </Modal>
  )
}
