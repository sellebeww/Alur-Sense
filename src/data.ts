// AlurSense — model data & data contoh (FIKTIF, hanya untuk demonstrasi).
export type DocStatus = 'verified' | 'known' | 'unverified' | 'unknown'
export type Priority = 'Rendah' | 'Sedang' | 'Tinggi'
export type Status = 'Draft' | 'Berjalan' | 'Menunggu Review' | 'Ditunda' | 'Selesai'
export type ExamId = 'visual' | 'meter' | 'acoustic' | 'sensor' | 'docs' | 'controlled'
export type Role = 'Administrator' | 'Maintenance Manager' | 'Supervisor' | 'Teknisi' | 'Viewer'
export type Classification = 'Mendukung hipotesis' | 'Melemahkan hipotesis' | 'Tidak meyakinkan' | 'Tidak ada temuan signifikan' | 'Perlu review lanjutan'

export const STATUSES: Status[] = ['Draft', 'Berjalan', 'Menunggu Review', 'Ditunda', 'Selesai']
export const SUPPORT = ['Bukti belum cukup', 'Dukungan terbatas', 'Dukungan sedang', 'Dukungan kuat'] as const

export interface NetEl {
  id: string; kind: 'node' | 'seg'; type: string; name: string; desc: string; location: string
  status: DocStatus; source: string; verified?: string; x?: number; y?: number; from?: string; to?: string; notes: string[]
}
export interface NetChange { id: string; el: string; who: string; what: string; prev: string; next: string; date: string }
export interface Evidence { id: string; type: string; text: string; date: string; source: string; quality: string; for?: string; kind: 'support' | 'against' | 'neutral'; sim?: boolean }
export interface Hyp { id: string; title: string; support: 0 | 1 | 2 | 3; elements: string[]; supporting: string[]; against: string[]; missing: string[] }
export interface Exam {
  id: string; inv: string; type: ExamId; tech: string; date: string; element: string; status: 'Direncanakan' | 'Menunggu Persetujuan' | 'Disetujui' | 'Draft' | 'Selesai'
  review: 'Belum' | 'Menunggu Review' | 'Disetujui' | 'Ditolak'; cls?: Classification; summary?: string; target?: string; quality?: string; procedure?: string; ref?: string; sim?: boolean
}
export interface RecSnap { at: string; trigger: string; top: ExamId | null; ranking: { type: ExamId; value: number }[] }
export interface TLEvent { id: string; at: string; who: string; text: string }
export interface Inv {
  id: string; title: string; building: string; floor: string; zone: string; tech: string; supervisor: string; priority: Priority; status: Status
  category: string; desc: string; created: string; updated: string; recurring: boolean; symptoms: string[]
  evidence: Evidence[]; hyps: Hyp[]; exams: Exam[]; recHistory: RecSnap[]; timeline: TLEvent[]
  tempUnc: number // sisa ketidakpastian pola waktu (0..1)
  decisions: { at: string; who: string; text: string }[]; outcome?: string
}
export interface User { id: string; name: string; email: string; role: Role; buildings: string[]; active: boolean; last: string }
export interface Building { id: string; name: string; address: string; category: string; floors: number; age: number; docs: string; updated: string; notes: string }
export interface Notif { id: string; type: 'Investigasi' | 'Persetujuan' | 'Jaringan' | 'Tim'; text: string; at: string; to: string; read: boolean }
export interface Audit { id: string; who: string; action: string; obj: string; at: string }

export interface ExamDef {
  id: ExamId; name: string; desc: string; purpose: string; requires: string; equipment: string; output: string; limits: string; suitable: string
  effort: 1 | 2 | 3; impact: 0 | 1 | 2 | 3; auth: boolean; sop: string; avail: 'available' | 'confirm' | 'approval' | 'unavailable'; availNote: string
  w: { temporal: number; topology: number; spatial: number }
}
export const EFFORT = ['', 'Rendah', 'Sedang', 'Sedang–Tinggi']
export const IMPACT = ['Minimal', 'Rendah', 'Perlu penilaian', 'Perlu penilaian & otorisasi']

export const EXAMS: ExamDef[] = [
  { id: 'visual', name: 'Inspeksi Visual', desc: 'Pemeriksaan visual area terdampak dan akses yang tersedia, dengan dokumentasi foto.', purpose: 'Memperjelas gejala permukaan dan menyempitkan area kerja.', requires: 'Akses area, foto kondisi awal', equipment: 'Kamera, lampu senter', output: 'Catatan observasi + foto', limits: 'Hanya menampilkan gejala permukaan, bukan lokasi pipa tersembunyi.', suitable: 'Area dengan akses langsung', effort: 1, impact: 0, auth: false, sop: 'SOP-FM-010', avail: 'available', availNote: 'Tersedia', w: { temporal: 0, topology: 1, spatial: 4 } },
  { id: 'meter', name: 'Analisis Riwayat Meter', desc: 'Tinjau catatan meter yang sudah ada untuk memahami pola penggunaan air.', purpose: 'Menentukan apakah anomali bersifat persisten, intermiten, atau terkait periode tertentu.', requires: 'Catatan meter minimal 30 hari', equipment: 'Tidak ada (analisis data)', output: 'Ringkasan pola + periode anomali', limits: 'Tidak menunjukkan lokasi fisik; kualitas bergantung pada resolusi pembacaan.', suitable: 'Ada riwayat pembacaan meter', effort: 1, impact: 0, auth: false, sop: 'SOP-FM-014', avail: 'available', availNote: 'Data riwayat tersedia', w: { temporal: 9, topology: 0, spatial: 1 } },
  { id: 'acoustic', name: 'Survei Akustik Non-Invasif', desc: 'Pemeriksaan akustik oleh teknisi berkualifikasi untuk menambah bukti lokasi kemungkinan kebocoran.', purpose: 'Membedakan hipotesis lokasi yang saling bersaing.', requires: 'Dokumentasi jaringan memadai, konfirmasi peralatan', equipment: 'Perangkat akustik (perlu konfirmasi ketersediaan)', output: 'Pembacaan per titik + catatan kondisi lokasi', limits: 'Dipengaruhi kebisingan sekitar dan material pipa.', suitable: 'Area dengan akses titik ukur', effort: 2, impact: 1, auth: false, sop: 'SOP-FM-021', avail: 'confirm', availNote: 'Perlu konfirmasi peralatan', w: { temporal: 0, topology: 2, spatial: 10 } },
  { id: 'sensor', name: 'Tinjauan Data Sensor Eksisting', desc: 'Meninjau data dari sensor yang sudah terpasang di bangunan, bila ada.', purpose: 'Melengkapi pola waktu dengan data tambahan.', requires: 'Sensor terpasang & terkonfigurasi', equipment: 'Tidak ada', output: 'Ringkasan data sensor', limits: 'Hanya relevan bila sensor tersedia.', suitable: 'Bangunan dengan sensor', effort: 1, impact: 0, auth: false, sop: 'SOP-FM-015', avail: 'unavailable', availNote: 'Tidak ada sensor terhubung (demo tidak menyimulasikan sensor fisik)', w: { temporal: 5, topology: 0, spatial: 1 } },
  { id: 'docs', name: 'Tinjauan Dokumentasi Jaringan', desc: 'Telaah gambar, catatan renovasi, dan riwayat perawatan untuk memperjelas koneksi yang belum terverifikasi.', purpose: 'Mengurangi ketidakpastian topologi jaringan.', requires: 'Akses arsip gambar & catatan', equipment: 'Tidak ada', output: 'Pembaruan status dokumentasi elemen', limits: 'Dokumen lama bisa tidak mencerminkan kondisi lapangan.', suitable: 'Dokumentasi parsial/usang', effort: 1, impact: 0, auth: false, sop: 'SOP-FM-012', avail: 'available', availNote: 'Arsip tersedia', w: { temporal: 0, topology: 8, spatial: 1 } },
  { id: 'controlled', name: 'Pemeriksaan Terkendali Terotorisasi', desc: 'Pertimbangkan pemeriksaan terkendali pada seksi jaringan yang disetujui, hanya bila otorisasi, tinjauan risiko, dan prosedur lokasi tersedia.', purpose: 'Memverifikasi hipotesis lokasi pada seksi yang disetujui.', requires: 'Otorisasi supervisor, tinjauan risiko, SOP lokasi', equipment: 'Sesuai prosedur resmi organisasi', output: 'Hasil sesuai prosedur resmi', limits: 'Berpotensi mengganggu layanan; hanya oleh personel berkualifikasi.', suitable: 'Setelah bukti non-invasif tidak cukup', effort: 3, impact: 3, auth: true, sop: 'SOP-FM-030 (rujukan internal)', avail: 'approval', availNote: 'Memerlukan persetujuan supervisor', w: { temporal: 0, topology: 1, spatial: 10 } },
]
export const exDef = (t: ExamId) => EXAMS.find((e) => e.id === t)!

const el = (id: string, kind: 'node' | 'seg', type: string, name: string, status: DocStatus, x: number | undefined, y: number | undefined, from?: string, to?: string, extra: Partial<NetEl> = {}): NetEl => ({
  id, kind, type, name, desc: extra.desc ?? '', location: extra.location ?? 'Gedung Sentra Utama', status, source: extra.source ?? (status === 'verified' ? 'Verifikasi lapangan' : status === 'unknown' ? 'Belum ada sumber' : 'Gambar as-built 2009 (parsial)'),
  verified: extra.verified ?? (status === 'verified' ? '2026-09-14' : undefined), x, y, from, to, notes: extra.notes ?? [],
})
export const SEED_NET: NetEl[] = [
  el('SUP', 'node', 'Sumber pasokan', 'Pasokan utama', 'verified', 80, 270, undefined, undefined, { location: 'Basement' }),
  el('M-01', 'node', 'Meter', 'Meter utama M-01', 'verified', 230, 270, undefined, undefined, { location: 'Basement' }),
  el('J-01', 'node', 'Junction', 'Junction J-01', 'verified', 400, 270, undefined, undefined, { location: 'Lantai 1' }),
  el('ZA1', 'node', 'Zona', 'Zona A1', 'known', 650, 70),
  el('J-02', 'node', 'Junction', 'Junction J-02', 'known', 650, 270, undefined, undefined, { location: 'Blok B, Lantai 1', desc: 'Percabangan menuju Blok B.' }),
  el('ZC1', 'node', 'Zona', 'Zona C1', 'known', 650, 470),
  el('ZB1', 'node', 'Zona', 'Zona B1', 'known', 930, 170, undefined, undefined, { location: 'Blok B, Lantai 2', desc: 'Area koridor tempat observasi lembap dilaporkan.' }),
  el('ZB2', 'node', 'Zona', 'Zona B2', 'known', 930, 370, undefined, undefined, { location: 'Blok B, Lantai 2' }),
  el('P-01', 'seg', 'Segmen pipa', 'P-01', 'verified', undefined, undefined, 'SUP', 'M-01'),
  el('P-02', 'seg', 'Segmen pipa', 'P-02', 'verified', undefined, undefined, 'M-01', 'J-01'),
  el('BR-A', 'seg', 'Cabang', 'Cabang A', 'known', undefined, undefined, 'J-01', 'ZA1'),
  el('BR-B', 'seg', 'Cabang', 'Cabang B', 'known', undefined, undefined, 'J-01', 'J-02'),
  el('BR-C', 'seg', 'Cabang', 'Cabang C', 'known', undefined, undefined, 'J-01', 'ZC1'),
  el('P-04', 'seg', 'Segmen pipa', 'P-04', 'unverified', undefined, undefined, 'J-02', 'ZB1', { desc: 'Sambungan J-02 → P-04 belum terdokumentasi lengkap.', notes: ['Gambar 2009 tidak menunjukkan titik sambung.'] }),
  el('P-05', 'seg', 'Segmen pipa', 'P-05', 'known', undefined, undefined, 'J-02', 'ZB2'),
  el('UNK-01', 'seg', 'Koneksi tidak diketahui', 'Koneksi tak dikenal ZC1–ZB2', 'unknown', undefined, undefined, 'ZC1', 'ZB2', { desc: 'Kemungkinan koneksi lintas cabang; tidak ada dokumen.' }),
]
// bobot kelengkapan dokumentasi (angka ilustratif)
export const completeness = (net: NetEl[]) => Math.round((net.reduce((s, e) => s + ({ verified: 1, known: 0.62, unverified: 0.3, unknown: 0 }[e.status]), 0) / net.length) * 100)

const ev = (id: string, type: string, text: string, date: string, source: string, quality: string, kind: Evidence['kind'] = 'neutral', f?: string): Evidence => ({ id, type, text, date, source, quality, kind, for: f, sim: true })
export const genHyps = (n: string): Hyp[] => [
  { id: n + '-A', title: 'Kemungkinan kebocoran pada zona terdampak', support: 1, elements: ['ZB1'], supporting: ['Observasi lembap dilaporkan'], against: [], missing: ['Konfirmasi pemeriksaan'] },
  { id: n + '-B', title: 'Sambungan segmen belum terdokumentasi', support: 1, elements: ['P-04', 'J-02'], supporting: [], against: [], missing: ['Dokumentasi sambungan'] },
  { id: n + '-C', title: 'Masalah pada cabang terhubung lain', support: 1, elements: ['BR-C', 'UNK-01'], supporting: [], against: [], missing: ['Bukti spesifik'] },
]
export const baseInv = (p: Partial<Inv> & Pick<Inv, 'id' | 'title'>): Inv => ({
  building: 'Gedung Sentra Utama', floor: 'Lantai 2', zone: 'Blok B', tech: 'Andi Pratama', supervisor: 'Rina Putri', priority: 'Sedang', status: 'Berjalan',
  category: 'Penggunaan air tidak terjelaskan', desc: 'Laporan anomali yang sedang diselidiki.', created: '2026-10-20', updated: '2026-11-05T09:00', recurring: false, symptoms: ['Pola penggunaan air tidak biasa'],
  evidence: [ev('E-1', 'Laporan', 'Laporan awal dari penghuni gedung.', '2026-10-20', 'Helpdesk', 'Cukup'), ev('E-2', 'Observasi', 'Observasi lapangan awal.', '2026-10-21', 'Teknisi', 'Cukup')],
  hyps: genHyps(p.id), exams: [], recHistory: [], timeline: [{ id: 'T0', at: p.created ?? '2026-10-20', who: 'Sistem', text: 'Investigasi dibuat.' }], tempUnc: 0.9, decisions: [], ...p,
})

const AS261: Inv = baseInv({
  id: 'AS-0261', title: 'Anomali Penggunaan Air — Blok B', floor: 'Lantai 2', zone: 'Blok B', priority: 'Sedang', status: 'Berjalan', created: '2026-11-07', updated: '2026-11-08T16:20',
  desc: 'Teknisi menerima laporan penggunaan air yang tidak biasa dan observasi kelembapan di dekat koridor lantai 2. Gambar pipa yang tersedia tidak lengkap. Lokasi kebocoran yang sebenarnya belum terkonfirmasi.',
  symptoms: ['Pola konsumsi air meter utama perlu diselidiki', 'Observasi lembap di koridor Blok B, lantai 2', 'Rute menuju Zona B1 tidak terdokumentasi penuh'],
  evidence: [
    ev('E-1', 'Riwayat meter', 'Catatan meter menunjukkan pola konsumsi yang perlu diselidiki.', '2026-11-06', 'Meter M-01 (data contoh)', 'Cukup'),
    ev('E-2', 'Observasi', 'Observasi lembap dilaporkan di dekat koridor Blok B.', '2026-11-07', 'Laporan penghuni', 'Cukup', 'support', 'H-A'),
    ev('E-3', 'Dokumentasi', 'Dokumentasi tidak sepenuhnya menjelaskan koneksi J-02 ke Zona B1.', '2026-11-07', 'Gambar as-built 2009', 'Rendah', 'neutral'),
    ev('E-4', 'Status', 'Belum ada hasil pemeriksaan terkonfirmasi yang menunjukkan lokasi kebocoran fisik.', '2026-11-07', 'Sistem', 'Cukup'),
  ],
  hyps: [
    { id: 'H-A', title: 'Kemungkinan kebocoran di Zona B1', support: 2, elements: ['ZB1', 'P-04'], supporting: ['Observasi lembap dekat koridor Blok B'], against: [], missing: ['Pola waktu anomali', 'Bukti akustik'] },
    { id: 'H-B', title: 'Sambungan tak terdokumentasi antara J-02 dan P-04', support: 1, elements: ['J-02', 'P-04'], supporting: ['Dokumentasi tidak menjelaskan koneksi'], against: [], missing: ['Verifikasi sambungan fisik'] },
    { id: 'H-C', title: 'Masalah pada cabang terhubung lain', support: 1, elements: ['BR-C', 'ZC1', 'UNK-01'], supporting: ['Koneksi tak dikenal ZC1–ZB2'], against: [], missing: ['Bukti spesifik cabang'] },
  ],
  timeline: [{ id: 'T1', at: '2026-11-07T09:10', who: 'Rina Putri', text: 'Investigasi AS-0261 dibuat dan ditugaskan ke Andi Pratama.' }, { id: 'T2', at: '2026-11-08T16:20', who: 'Andi Pratama', text: 'Menambahkan observasi awal dan dokumentasi jaringan parsial.' }],
})

const ROWS: [string, string, string, string, string, string, Priority, Status, string, string][] = [
  ['AS-0260', 'Observasi Kelembapan Plafon', 'Gedung Sentra Utama', 'Lantai 2', 'Blok A', 'Rina Putri', 'Tinggi', 'Menunggu Review', 'Permukaan lembap atau basah', '2026-11-08T11:00'],
  ['AS-0259', 'Variasi Aliran Tidak Terjelaskan', 'Gedung Arunika', 'Lantai 1', 'Blok A', 'Budi Santoso', 'Sedang', 'Selesai', 'Perilaku aliran tidak terduga', '2026-11-06T15:30'],
  ['AS-0258', 'Dokumentasi Jaringan Tidak Lengkap', 'Kompleks Perkantoran Merdeka', 'Lantai 3', 'Sayap Timur', 'Andi Pratama', 'Sedang', 'Berjalan', 'Kondisi jaringan tidak diketahui', '2026-11-05T10:00'],
  ['AS-0257', 'Lonjakan Konsumsi Malam Hari', 'Gedung Sentra Utama', 'Basement', 'Pompa', 'Rina Putri', 'Tinggi', 'Berjalan', 'Konsumsi air tidak terjelaskan', '2026-11-04T08:40'],
  ['AS-0256', 'Dinding Lembap Toilet Lantai 4', 'Gedung Arunika', 'Lantai 4', 'Blok B', 'Budi Santoso', 'Rendah', 'Ditunda', 'Permukaan lembap atau basah', '2026-11-03T14:10'],
  ['AS-0255', 'Tekanan Fluktuatif Blok C', 'Gedung Sentra Utama', 'Lantai 1', 'Blok C', 'Andi Pratama', 'Sedang', 'Berjalan', 'Perilaku aliran tidak terduga', '2026-11-02T09:00'],
  ['AS-0254', 'Dugaan Kebocoran Pantry', 'Kompleks Perkantoran Merdeka', 'Lantai 2', 'Pantry', 'Rina Putri', 'Rendah', 'Selesai', 'Dugaan kebocoran pipa', '2026-10-30T13:00'],
  ['AS-0253', 'Meter Anak Tidak Sinkron', 'Gedung Arunika', 'Lantai 2', 'Blok A', 'Budi Santoso', 'Sedang', 'Menunggu Review', 'Konsumsi air tidak terjelaskan', '2026-10-29T10:30'],
  ['AS-0252', 'Rembesan Dinding Basement', 'Gedung Sentra Utama', 'Basement', 'Parkir', 'Andi Pratama', 'Tinggi', 'Berjalan', 'Permukaan lembap atau basah', '2026-10-28T16:00'],
  ['AS-0251', 'Konsumsi Air Akhir Pekan', 'Kompleks Perkantoran Merdeka', 'Lantai 1', 'Lobi', 'Rina Putri', 'Sedang', 'Draft', 'Konsumsi air tidak terjelaskan', '2026-10-27T09:00'],
  ['AS-0250', 'Suara Aliran di Shaft', 'Gedung Sentra Utama', 'Lantai 3', 'Blok B', 'Andi Pratama', 'Sedang', 'Berjalan', 'Perilaku aliran tidak terduga', '2026-10-26T11:00'],
]
const names = ['Andi Pratama', 'Rina Putri', 'Budi Santoso']
const filler: Inv[] = Array.from({ length: 22 }, (_, i) => {
  const id = `AS-${String(249 - i).padStart(4, '0')}`
  return baseInv({ id, title: ['Verifikasi Pembacaan Meter', 'Tinjauan Rembesan Dinding', 'Anomali Aliran Malam', 'Cek Sambungan Cabang', 'Pemeriksaan Koridor'][i % 5], status: 'Selesai', priority: (['Rendah', 'Sedang', 'Tinggi'] as Priority[])[i % 3], building: ['Gedung Sentra Utama', 'Gedung Arunika', 'Kompleks Perkantoran Merdeka'][i % 3], tech: names[i % 3], created: '2026-10-0' + ((i % 9) + 1), updated: `2026-10-${String(28 - (i % 20)).padStart(2, '0')}T10:00`, outcome: 'Selesai (data contoh).' })
})
const others: Inv[] = ROWS.map(([id, title, building, floor, zone, tech, priority, status, category, updated]) =>
  baseInv({ id, title, building, floor, zone, tech, priority, status, category, updated, created: updated.slice(0, 10), supervisor: tech === 'Rina Putri' ? 'Budi Santoso' : 'Rina Putri', outcome: status === 'Selesai' ? 'Zona terdampak teridentifikasi setelah verifikasi sesuai prosedur resmi (data contoh).' : undefined,
    exams: status === 'Selesai' ? [{ id: 'X-' + id, inv: id, type: 'meter', tech, date: updated.slice(0, 10), element: 'M-01', status: 'Selesai', review: 'Disetujui', cls: 'Mendukung hipotesis', summary: 'Pola anomali terkonfirmasi (data contoh).', sim: true }] : [] }))

export const SEED_INV: Inv[] = [AS261, ...others, ...filler]

export const SEED_USERS: User[] = [
  { id: 'u1', name: 'Andi Pratama', email: 'andi.pratama@sentra-fm.example', role: 'Teknisi', buildings: ['Gedung Sentra Utama', 'Kompleks Perkantoran Merdeka'], active: true, last: '2026-11-09T08:55' },
  { id: 'u2', name: 'Rina Putri', email: 'rina.putri@sentra-fm.example', role: 'Supervisor', buildings: ['Gedung Sentra Utama', 'Gedung Arunika'], active: true, last: '2026-11-09T08:30' },
  { id: 'u3', name: 'Budi Santoso', email: 'budi.santoso@sentra-fm.example', role: 'Teknisi', buildings: ['Gedung Arunika'], active: true, last: '2026-11-08T17:20' },
  { id: 'u4', name: 'Maya Wulandari', email: 'maya.w@sentra-fm.example', role: 'Maintenance Manager', buildings: ['Semua gedung'], active: true, last: '2026-11-09T07:45' },
  { id: 'u5', name: 'Dewi Anggraini', email: 'dewi.a@sentra-fm.example', role: 'Administrator', buildings: ['Semua gedung'], active: true, last: '2026-11-07T10:00' },
  { id: 'u6', name: 'Tomi Hartono', email: 'tomi.h@sentra-fm.example', role: 'Viewer', buildings: ['Gedung Arunika'], active: false, last: '2026-09-30T09:00' },
]
export const SEED_BUILDINGS: Building[] = [
  { id: 'b1', name: 'Gedung Sentra Utama', address: 'Jl. Jenderal Sudirman No. 45, Jakarta', category: 'Perkantoran', floors: 8, age: 17, docs: 'Parsial', updated: '2026-11-08', notes: 'Pipa as-built 2009; renovasi Blok B tahun 2016 tidak terdokumentasi.' },
  { id: 'b2', name: 'Gedung Arunika', address: 'Jl. Asia Afrika No. 12, Bandung', category: 'Komersial', floors: 5, age: 22, docs: 'Belum ada', updated: '2026-10-30', notes: 'Belum ada diagram jaringan; hanya catatan meter.' },
  { id: 'b3', name: 'Kompleks Perkantoran Merdeka', address: 'Jl. Merdeka Raya No. 8, Surabaya', category: 'Kompleks perkantoran', floors: 4, age: 12, docs: 'Belum ada', updated: '2026-10-28', notes: 'Tiga sayap bangunan; dokumentasi sedang dikumpulkan.' },
]
export const SEED_NOTIFS: Notif[] = [
  { id: 'n1', type: 'Investigasi', text: 'Hasil pemeriksaan baru dikirim untuk AS-0261.', at: '2026-11-09T08:40', to: '/investigations/AS-0261', read: false },
  { id: 'n2', type: 'Persetujuan', text: 'Persetujuan supervisor diperlukan untuk AS-0260.', at: '2026-11-08T11:05', to: '/investigations/AS-0260', read: false },
  { id: 'n3', type: 'Jaringan', text: 'Dokumentasi jaringan Gedung Sentra Utama diperbarui.', at: '2026-11-08T10:12', to: '/networks', read: false },
  { id: 'n4', type: 'Investigasi', text: 'Investigasi AS-0259 telah selesai.', at: '2026-11-06T15:30', to: '/investigations/AS-0259', read: true },
  { id: 'n5', type: 'Tim', text: 'Rekomendasi diagnostik AS-0258 diperbarui.', at: '2026-11-05T10:05', to: '/investigations/AS-0258', read: true },
]
export const SEED_AUDIT: Audit[] = [
  { id: 'a1', who: 'Rina Putri', action: 'Menyetujui rencana pemeriksaan', obj: 'AS-0259', at: '2026-11-06T14:50' },
  { id: 'a2', who: 'Dewi Anggraini', action: 'Mengubah peran pengguna', obj: 'Tomi Hartono → Viewer', at: '2026-11-04T09:12' },
  { id: 'a3', who: 'Rina Putri', action: 'Memperbarui dokumentasi jaringan', obj: 'Gedung Sentra Utama', at: '2026-11-08T10:12' },
]
export const SEED_NETHIST: NetChange[] = [
  { id: 'c1', el: 'P-04', who: 'Rina Putri', what: 'Status dokumentasi', prev: 'Dikenal', next: 'Belum terverifikasi', date: '2026-11-08' },
  { id: 'c2', el: 'UNK-01', who: 'Andi Pratama', what: 'Elemen ditambahkan', prev: '—', next: 'Tidak diketahui', date: '2026-11-07' },
]
export const fmt = (s: string) => { const d = new Date(s); return isNaN(+d) ? s : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', ...(s.length > 10 ? { hour: '2-digit', minute: '2-digit' } : {}) }) }
export const NOW = () => new Date().toISOString().slice(0, 16)
