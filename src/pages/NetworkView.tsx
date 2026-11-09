import { useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react'
import { useApp } from '../store.tsx'
import { DocBadge, Notice, Skel, docLabel, dt, useLoading } from '../ui.tsx'
import { completeness, type DocStatus, type Hyp, type Inv, type NetEl } from '../data.ts'

const STY: Record<DocStatus, { stroke: string; dash?: string; w: number }> = {
  verified: { stroke: '#5686B4', w: 3.5 }, known: { stroke: '#5686B4', w: 3.5 },
  unverified: { stroke: '#8E9CB1', dash: '9 7', w: 3 }, unknown: { stroke: '#A9B6BC', dash: '1 8', w: 3.5 },
}
const LAYERS = [['zones', 'Zona'], ['suspected', 'Area dicurigai'], ['unverified', 'Belum terverifikasi'], ['unknown', 'Tidak diketahui'], ['labels', 'Label']] as const
const HOME = { x: 20, y: 30, k: 0.7 }

export default function NetworkView({ inv, compact }: { inv?: Inv; compact?: boolean }) {
  const { net, netHist, setNetStatus, toast } = useApp()
  const loading = useLoading(500)
  const [tf, setTf] = useState(HOME), [sel, setSel] = useState<string | null>(inv ? 'P-04' : null), [note, setNote] = useState('')
  const [layers, setLayers] = useState({ zones: true, suspected: !!inv, unverified: true, unknown: true, labels: true })
  const svg = useRef<SVGSVGElement>(null), drag = useRef<{ x: number; y: number } | null>(null)
  const node = (id: string) => net.find((e) => e.id === id)!
  const suspected = useMemo(() => {
    const m = new Map<string, number>()
    inv?.hyps.forEach((h: Hyp) => h.elements.forEach((id) => m.set(id, Math.max(m.get(id) ?? 0, h.support))))
    return m
  }, [inv])
  const fit = () => ({ x: 24, y: 34, k: Math.max(0.6, Math.min(1, ((svg.current?.clientWidth ?? 800) - 48) / 1000)) })
  useEffect(() => { if (!loading) setTf(fit()) }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // zoom roda mouse; listener non-pasif agar halaman tidak ikut scroll
    const s = svg.current; if (!s) return
    const w = (e: WheelEvent) => { e.preventDefault(); setTf((t) => ({ ...t, k: Math.min(2.5, Math.max(0.4, t.k * (e.deltaY < 0 ? 1.1 : 0.9))) })) }
    s.addEventListener('wheel', w, { passive: false }); return () => s.removeEventListener('wheel', w)
  }, [loading])
  const zoom = (f: number) => setTf((t) => ({ ...t, k: Math.min(2.5, Math.max(0.4, t.k * f)) }))
  const shown = (e: NetEl) => (e.status !== 'unverified' || layers.unverified) && (e.status !== 'unknown' || layers.unknown) && (e.type !== 'Zona' || layers.zones)
  const cur = sel ? node(sel) : undefined
  const comp = completeness(net)
  const segs = net.filter((e) => e.kind === 'seg' && shown(e)), nodes = net.filter((e) => e.kind === 'node' && shown(e))
  const related = cur ? (cur.kind === 'node' ? net.filter((e) => e.kind === 'seg' && (e.from === cur.id || e.to === cur.id)) : [node(cur.from!), node(cur.to!)]) : []
  const evidence = cur && inv ? inv.evidence.filter((e) => e.text.includes(cur.id) || inv.hyps.some((h) => h.elements.includes(cur.id) && (h.id === e.for || (e.type === 'Dokumentasi' && cur.status !== 'verified')))) : []
  const mid = (e: NetEl) => { const a = node(e.from!), b = node(e.to!); return { x: (a.x! + b.x!) / 2, y: (a.y! + b.y!) / 2 } }

  if (loading) return <div className="nv"><Skel h={560} /><Skel h={560} /></div>
  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row between wrap">
        <div className="row wrap">{LAYERS.filter(([k]) => inv || k !== 'suspected').map(([k, l]) => <label key={k} className="row sm" style={{ gap: 5 }}><input type="checkbox" style={{ width: 15, height: 15 }} checked={layers[k]} onChange={() => setLayers({ ...layers, [k]: !layers[k] })} />{l}</label>)}</div>
        <div className="sm"><b>Kelengkapan Dokumentasi Jaringan: {comp}%</b> <span className="faint">(data contoh, bukan pengukuran nyata)</span></div>
      </div>
      <div className="nv" style={compact ? { gridTemplateColumns: '1fr' } : undefined}>
        <div className="nvc">
          <svg ref={svg} role="img" aria-label="Diagram skematik jaringan pipa" onPointerDown={(e) => { if ((e.target as Element).closest('[data-el]')) return; drag.current = { x: e.clientX, y: e.clientY }; (e.currentTarget as Element).setPointerCapture(e.pointerId) }}
            onPointerMove={(e) => { if (!drag.current) return; const d = { dx: e.clientX - drag.current.x, dy: e.clientY - drag.current.y }; drag.current = { x: e.clientX, y: e.clientY }; setTf((t) => ({ ...t, x: t.x + d.dx, y: t.y + d.dy })) }}
            onPointerUp={() => (drag.current = null)} onClick={(e) => { if (!(e.target as Element).closest('[data-el]')) setSel(null) }}>
            <g transform={`translate(${tf.x} ${tf.y}) scale(${tf.k})`}>
              {layers.suspected && [...suspected].filter(([id, s]) => s > 0 && shown(node(id))).map(([id, s]) => { const e = node(id); const fo = 0.1 + s * 0.09
                if (e.kind === 'node') return <rect key={id} x={e.x! - 52} y={e.y! - 44} width={104} height={88} rx={22} fill="#D69B38" opacity={fo} />
                const a = node(e.from!), b = node(e.to!); return <line key={id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#D69B38" strokeWidth={26} strokeLinecap="round" opacity={fo} /> })}
              {segs.map((e) => { const a = node(e.from!), b = node(e.to!), st = STY[e.status], m = mid(e), on = sel === e.id
                return (
                  <g key={e.id} data-el tabIndex={0} role="button" aria-label={`Segmen ${e.name}, ${docLabel(e.status)}`} style={{ cursor: 'pointer', outline: 'none' }} onClick={() => setSel(e.id)} onKeyDown={(k) => k.key === 'Enter' && setSel(e.id)}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={22} />
                    {on && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#5BB6F5" strokeWidth={st.w + 8} opacity={0.35} strokeLinecap="round" />}
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={st.stroke} strokeWidth={st.w} strokeDasharray={st.dash} strokeLinecap="round" />
                    {e.status === 'verified' && <g><circle cx={m.x} cy={m.y} r={8} fill="#0A6ED1" stroke="#fff" strokeWidth={2} /><path d={`M${m.x - 3.5} ${m.y}l2.5 2.5 4.5-5`} stroke="#fff" strokeWidth={1.8} fill="none" /></g>}
                    {layers.labels && <text x={m.x} y={m.y - 14} textAnchor="middle" fontSize={12} fontWeight={600} fill="#47606C">{e.name.length > 14 ? e.id : e.name}</text>}
                    {layers.labels && e.id === 'P-04' && <text x={m.x} y={m.y + 22} textAnchor="middle" fontSize={11} fill="#9A6A12" fontWeight={600}>Koneksi belum terverifikasi</text>}
                  </g>) })}
              {nodes.map((e) => { const on = sel === e.id, ring = e.status === 'verified' ? '#0A6ED1' : '#8E9CB1'
                const shape = e.type === 'Zona' ? <rect x={e.x! - 44} y={e.y! - 24} width={88} height={48} rx={10} fill="#fff" stroke={ring} strokeWidth={on ? 3.5 : 2} strokeDasharray={e.status === 'verified' ? undefined : '5 4'} />
                  : e.type === 'Sumber pasokan' ? <rect x={e.x! - 22} y={e.y! - 22} width={44} height={44} rx={6} fill="#0E2A55" stroke={on ? '#5BB6F5' : '#0E2A55'} strokeWidth={3} />
                  : <circle cx={e.x} cy={e.y} r={e.type === 'Meter' ? 22 : 17} fill={e.type === 'Meter' ? '#E6F1FD' : '#fff'} stroke={on ? '#5BB6F5' : ring} strokeWidth={on ? 4 : 3} />
                return (
                  <g key={e.id} data-el tabIndex={0} role="button" aria-label={`${e.type} ${e.name}, ${docLabel(e.status)}`} style={{ cursor: 'pointer', outline: 'none' }} onClick={() => setSel(e.id)} onKeyDown={(k) => k.key === 'Enter' && setSel(e.id)}>
                    {shape}
                    <text x={e.x} y={e.y! + 4} textAnchor="middle" fontSize={e.type === 'Zona' ? 13 : 11} fontWeight={700} fill={e.type === 'Sumber pasokan' ? '#fff' : '#0E2A55'}>{e.type === 'Sumber pasokan' ? 'SUP' : e.type === 'Meter' ? 'M-01' : e.id}</text>
                    {layers.labels && <text x={e.x} y={e.y! + (e.type === 'Zona' ? 42 : 40)} textAnchor="middle" fontSize={11} fill="#5F7089">{e.type === 'Zona' ? (e.location.startsWith('Gedung') ? 'Zona' : e.location) : e.type}</text>}
                    {e.status === 'verified' && e.type !== 'Zona' && <circle cx={e.x! + 15} cy={e.y! - 15} r={5.5} fill="#0A6ED1" stroke="#fff" strokeWidth={1.5} />}
                  </g>) })}
            </g>
          </svg>
          <div className="zc" role="group" aria-label="Kontrol tampilan"><button className="ib" style={{ background: '#fff', border: '1px solid var(--line)' }} aria-label="Perbesar" onClick={() => zoom(1.2)}><Plus /></button><button className="ib" style={{ background: '#fff', border: '1px solid var(--line)' }} aria-label="Perkecil" onClick={() => zoom(0.83)}><Minus /></button><button className="ib" style={{ background: '#fff', border: '1px solid var(--line)' }} aria-label="Reset tampilan" onClick={() => { setTf(fit()); toast('Tampilan jaringan direset.', 'info') }}><RotateCcw /></button></div>
          <div className="sm faint" style={{ position: 'absolute', left: 12, bottom: 10 }}><Maximize2 size={12} style={{ verticalAlign: -2 }} /> Seret untuk menggeser · roda mouse untuk zoom · klik elemen untuk detail</div>
        </div>
        <aside className="card" aria-label="Detail elemen jaringan" style={{ maxHeight: compact ? undefined : 560, overflow: 'auto' }}>
          <h3>Detail Elemen Jaringan</h3>
          {!cur ? <p className="muted" style={{ marginTop: 8 }}>Pilih node atau segmen pipa pada diagram untuk melihat status dokumentasi, bukti terkait, dan riwayat verifikasi.</p> : (
            <div className="col" style={{ marginTop: 10 }}>
              <div className="row between"><b style={{ fontSize: 16 }}>{cur.id}</b><DocBadge s={cur.status} /></div>
              <dl className="kv">
                <dt>{cur.kind === 'node' ? 'ID node' : 'ID segmen'}</dt><dd>{cur.id} — {cur.name}</dd><dt>Tipe</dt><dd>{cur.type}</dd>
                {cur.kind === 'node' ? <><dt>Lokasi</dt><dd>{cur.location}</dd></> : <><dt>Dari → ke</dt><dd>{cur.from} → {cur.to}</dd></>}
                <dt>Sumber informasi</dt><dd>{cur.source}</dd><dt>Terakhir diverifikasi</dt><dd>{cur.verified ? dt(cur.verified) : 'Belum pernah'}</dd></dl>
              {cur.desc && <p className="sm muted">{cur.desc}</p>}
              {cur.status === 'unverified' && <Notice kind="warn" title="Koneksi belum terverifikasi.">Rekomendasi yang melibatkan bagian ini mungkin kurang andal sampai informasi koneksinya ditinjau.</Notice>}
              <div><p className="xs">{cur.kind === 'node' ? 'Segmen terkait' : 'Node ujung'}</p><div className="row wrap" style={{ marginTop: 4 }}>{related.map((r) => <button key={r.id} className="pill" onClick={() => setSel(r.id)}>{r.id}</button>)}</div></div>
              <div><p className="xs">Bukti terkait</p>{evidence.length ? evidence.map((e) => <div key={e.id} className="sm" style={{ marginTop: 4 }}>• {e.text}</div>) : <p className="sm muted">Belum ada bukti tertaut{inv ? '' : ' (buka melalui investigasi untuk melihat bukti)'}.</p>}</div>
              <label className="f">Perbarui status dokumentasi
                <select value={cur.status} onChange={(e) => { setNetStatus(cur.id, e.target.value as DocStatus); toast(`${cur.id}: ${docLabel(e.target.value as DocStatus)}`) }}>{(['verified', 'known', 'unverified', 'unknown'] as DocStatus[]).map((s) => <option key={s} value={s}>{docLabel(s)}</option>)}</select></label>
              <div><p className="xs">Catatan</p>{cur.notes.map((n, i) => <div key={i} className="sm" style={{ marginTop: 3 }}>• {n}</div>)}
                <div className="row" style={{ marginTop: 6 }}><input aria-label="Tambah catatan" placeholder="Tambah catatan…" value={note} onChange={(e) => setNote(e.target.value)} /><button className="btn sm" onClick={() => { if (note.trim()) { setNetStatus(cur.id, cur.status, note.trim()); setNote(''); toast('Catatan ditambahkan.') } }}>Tambah</button></div></div>
              <div><p className="xs">Riwayat verifikasi</p>{netHist.filter((h) => h.el === cur.id).map((h) => <div key={h.id} className="sm" style={{ marginTop: 3 }}>{dt(h.date)} · {h.who}: {h.what} ({h.prev} → {h.next})</div>)}{!netHist.some((h) => h.el === cur.id) && <p className="sm muted">Belum ada perubahan tercatat.</p>}</div>
            </div>)}
        </aside>
      </div>
      <div className="card" style={{ padding: '12px 16px' }}><div className="lg" aria-label="Legenda">
        <span><svg><line x1="0" y1="4" x2="30" y2="4" stroke="#5686B4" strokeWidth="3" /></svg>Segmen diketahui</span>
        <span><svg><line x1="0" y1="4" x2="30" y2="4" stroke="#8E9CB1" strokeWidth="3" strokeDasharray="7 5" /></svg>Koneksi belum terverifikasi</span>
        <span><svg><line x1="0" y1="4" x2="30" y2="4" stroke="#A9B6BC" strokeWidth="3.5" strokeDasharray="1 7" strokeLinecap="round" /></svg>Segmen tidak diketahui</span>
        <span><svg style={{ width: 14 }}><circle cx="7" cy="4" r="4" fill="#0A6ED1" /></svg>Terverifikasi (penanda teal)</span>
        {inv && <span><svg style={{ width: 22, height: 12 }}><rect width="22" height="12" rx="4" fill="#D69B38" opacity=".35" /></svg>Area dicurigai (hipotesis, belum terkonfirmasi)</span>}
        <span className="faint">Garis merah tidak dipakai: tidak ada kebocoran yang terkonfirmasi.</span></div></div>
    </div>
  )
}
