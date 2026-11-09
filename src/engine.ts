// Mesin keputusan AlurSense — model ILUSTRATIF yang transparan, bukan rumus rekayasa tervalidasi.
// Nilai Rekomendasi = Perkiraan Perolehan Informasi − Penalti Upaya − Penalti Dampak Operasional.
import { EXAMS, exDef, type Classification, type ExamDef, type ExamId, type Exam, type Hyp, type Inv, type NetEl, completeness, NOW, SUPPORT } from './data.ts'

export const EFFORT_W = 1.5 // penalti per tingkat upaya (ilustratif)
export const IMPACT_W = 1.5 // penalti per tingkat dampak operasional (ilustratif)
export const REPEAT_DECAY = 0.4 // pengulangan jenis pemeriksaan yang sama bernilai lebih rendah

export interface Rec {
  def: ExamDef; gain: number; effortPen: number; impactPen: number; value: number; rank: number; repeat: number
  reduces: string[]; reason: string; prerequisites: string[]; info: string
}
export interface RecState { recs: Rec[]; insufficient: boolean; contradictory: boolean; incomplete: boolean; diminishing: boolean; strong?: Hyp; unc: { temporal: number; topology: number; spatial: number } }

export const spatialU = (h: Hyp[]) => {
  const s = h.map((x) => x.support).sort((a, b) => b - a)
  return Math.max(0.1, 1 - ((s[0] ?? 0) - (s[1] ?? 0)) / 3)
}
export const uncertainty = (inv: Inv, net: NetEl[]) => ({ temporal: inv.tempUnc, topology: Math.min(1, ((100 - completeness(net)) / 100) * 1.5), spatial: spatialU(inv.hyps) })

const LABEL = { temporal: 'ketidakpastian pola waktu anomali', topology: 'ketidakpastian topologi jaringan', spatial: 'ketidakpastian lokasi (hipotesis bersaing)' } as const
const r1 = (n: number) => Math.round(n * 10) / 10

export function isContradictory(inv: Inv) {
  const sup = new Set<string>(), weak = new Set<string>()
  for (const e of inv.exams) {
    if (e.status !== 'Selesai' || !e.target) continue
    if (e.cls === 'Mendukung hipotesis') sup.add(e.target)
    if (e.cls === 'Melemahkan hipotesis') weak.add(e.target)
  }
  return sup.size > 1 || [...sup].some((t) => weak.has(t))
}

export function recommend(inv: Inv, net: NetEl[]): RecState {
  const unc = uncertainty(inv, net)
  const lead = [...inv.hyps].sort((a, b) => b.support - a.support)[0]
  const recs: Rec[] = EXAMS.map((def) => {
    const repeat = inv.exams.filter((e) => e.type === def.id && e.status === 'Selesai').length
    const parts = (Object.keys(unc) as (keyof typeof unc)[]).map((d) => ({ d, g: def.w[d] * unc[d] }))
    const gain = parts.reduce((s, p) => s + p.g, 0) * Math.pow(REPEAT_DECAY, repeat)
    const effortPen = def.effort * EFFORT_W, impactPen = def.impact * IMPACT_W
    const reduces = parts.filter((p) => p.g >= 0.9).map((p) => LABEL[p.d])
    const prerequisites = [def.requires, `Merujuk ${def.sop}`, ...(def.auth ? ['Otorisasi supervisor, tinjauan risiko, dan prosedur lokasi yang berlaku'] : []), ...(def.avail === 'confirm' ? ['Konfirmasi ketersediaan peralatan'] : [])]
    const reason = reasonFor(def.id, unc, lead, repeat)
    return { def, gain: r1(gain), effortPen: r1(effortPen), impactPen: r1(impactPen), value: r1(gain - effortPen - impactPen), rank: 0, repeat, reduces, reason, prerequisites, info: def.output }
  })
  recs.filter((r) => r.def.avail !== 'unavailable').sort((a, b) => b.value - a.value).forEach((r, i) => (r.rank = i + 1))
  recs.sort((a, b) => (a.rank || 99) - (b.rank || 99))
  const top = recs[0]
  return {
    recs, unc,
    insufficient: inv.evidence.length < 3,
    contradictory: isContradictory(inv),
    incomplete: completeness(net) < 75 || (lead?.elements ?? []).some((id) => net.find((e) => e.id === id)?.status === 'unverified' || net.find((e) => e.id === id)?.status === 'unknown'),
    diminishing: !!top && top.value < 1,
    strong: inv.hyps.find((h) => h.support === 3),
  }
}

function reasonFor(t: ExamId, u: { temporal: number; topology: number; spatial: number }, lead: Hyp | undefined, repeat: number): string {
  const rep = repeat ? ` Pemeriksaan jenis ini sudah dilakukan ${repeat}×, sehingga nilai tambahannya diturunkan.` : ''
  switch (t) {
    case 'meter': return (u.temporal > 0.5 ? 'Bukti saat ini menunjukkan variasi penggunaan air yang belum terjelaskan, sementara dokumentasi jaringan belum lengkap. Meninjau riwayat meter yang sudah ada dapat membantu menentukan apakah anomali bersifat terus-menerus, intermiten, atau terkait periode pengamatan tertentu — dengan upaya rendah dan tanpa gangguan layanan.' : 'Pola waktu anomali sudah cukup dipahami; tinjauan tambahan atas riwayat meter hanya memberi sedikit informasi baru.') + rep
    case 'acoustic': return `Survei non-invasif dapat menambah bukti spasial untuk membedakan hipotesis lokasi${lead ? ` (saat ini unggul: ${lead.title})` : ''}. Nilainya naik saat hipotesis masih bersaing dan dokumentasi jaringan cukup untuk menentukan titik ukur. Perlu konfirmasi peralatan.` + rep
    case 'docs': return (u.topology > 0.3 ? 'Beberapa koneksi (mis. J-02 → P-04) belum terverifikasi. Menelaah gambar dan catatan renovasi dapat menurunkan ketidakpastian topologi dan membuat rekomendasi lain lebih andal — upaya rendah.' : 'Dokumentasi relatif lengkap; telaah tambahan memberi sedikit informasi baru.') + rep
    case 'visual': return 'Inspeksi visual memperjelas gejala permukaan tetapi tidak menunjukkan lokasi pipa tersembunyi; informasi spasialnya terbatas.' + rep
    case 'sensor': return 'Tidak tersedia: tidak ada sensor yang terhubung pada bangunan ini. Demo ini tidak menyimulasikan sensor fisik.'
    case 'controlled': return 'Hanya dipertimbangkan bila bukti non-invasif tidak cukup dan otorisasi, tinjauan risiko, serta prosedur lokasi tersedia. Berpotensi mengganggu layanan, sehingga peringkatnya diturunkan oleh penalti dampak operasional.' + rep
  }
}

export interface ResultInput {
  type: ExamId; cls: Classification; target?: string; quality: string; summary: string; support: string; against: string
  element: string; procedure: string; ref?: string; tech: string; date: string; planId?: string
}
const FACTOR: Record<Classification, number> = { 'Mendukung hipotesis': 0.3, 'Melemahkan hipotesis': 0.3, 'Tidak ada temuan signifikan': 0.5, 'Tidak meyakinkan': 0.8, 'Perlu review lanjutan': 0.9 }

/** Menerapkan hasil pemeriksaan: simpan hasil, bukti, perbarui hipotesis & riwayat rekomendasi. */
export function applyResult(inv: Inv, r: ResultInput, netBefore: NetEl[], who: string): Inv {
  const def = exDef(r.type)
  if (def.auth && r.procedure !== 'Ya') throw new Error('Otorisasi diperlukan: hasil tidak dapat dicatat sebagai disetujui sebelum supervisor meninjau prasyarat dan prosedur lokasi.')
  const before = recommend(inv, netBefore)
  const lowQ = r.quality === 'Rendah'
  const at = NOW()
  const hyps = inv.hyps.map((h) => {
    if (h.id !== r.target || lowQ) return h
    if (r.cls === 'Mendukung hipotesis') return { ...h, support: Math.min(3, h.support + 1) as Hyp['support'], supporting: [...h.supporting, r.summary], missing: h.missing.filter((m) => !m.toLowerCase().includes(def.name.split(' ')[0].toLowerCase())) }
    if (r.cls === 'Melemahkan hipotesis') return { ...h, support: Math.max(0, h.support - 1) as Hyp['support'], against: [...h.against, r.summary] }
    return h
  })
  const tempUnc = def.w.temporal > 0 ? inv.tempUnc * Math.max(lowQ ? 0.8 : 0, FACTOR[r.cls]) : inv.tempUnc
  const exam: Exam = { id: r.planId ?? `EX-${String(inv.exams.length + 1).padStart(3, '0')}-${inv.id.slice(-4)}`, inv: inv.id, type: r.type, tech: r.tech, date: r.date, element: r.element, status: 'Selesai', review: 'Menunggu Review', cls: r.cls, summary: r.summary, target: r.target, quality: r.quality, procedure: r.procedure, ref: r.ref, sim: true }
  const exams = inv.exams.some((e) => e.id === exam.id) ? inv.exams.map((e) => (e.id === exam.id ? exam : e)) : [...inv.exams, exam]
  const kind = r.cls === 'Mendukung hipotesis' ? 'support' : r.cls === 'Melemahkan hipotesis' ? 'against' : 'neutral'
  const evId = `E-${inv.evidence.length + 1}`
  const next: Inv = {
    ...inv, hyps, tempUnc, exams, updated: at,
    evidence: [...inv.evidence, { id: evId, type: def.name, text: r.summary + (r.support ? ` Pendukung: ${r.support}.` : '') + (r.against ? ` Bertentangan: ${r.against}.` : '') + (lowQ ? ' (Kualitas data rendah — tidak mengubah dukungan hipotesis.)' : ''), date: r.date, source: `${r.tech} (data demonstrasi)`, quality: r.quality, kind, for: r.target, sim: true }],
    recHistory: [...inv.recHistory, { at, trigger: `Sebelum hasil: ${def.name}`, top: before.recs[0]?.def.avail !== 'unavailable' ? before.recs[0]?.def.id ?? null : null, ranking: before.recs.filter((x) => x.rank).map((x) => ({ type: x.def.id, value: x.value })) }],
    timeline: [...inv.timeline, { id: 'T' + (inv.timeline.length + 1), at, who, text: `Mencatat hasil ${def.name}: ${r.cls}.` }],
  }
  return next
}
export const supportLabel = (n: number) => SUPPORT[n]
