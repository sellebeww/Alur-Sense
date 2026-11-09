import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SEED_AUDIT, SEED_BUILDINGS, SEED_INV, SEED_NET, SEED_NETHIST, SEED_NOTIFS, SEED_USERS, NOW, exDef, type Audit, type Building, type DocStatus, type Exam, type ExamId, type Inv, type NetChange, type NetEl, type Notif, type Role, type User } from './data.ts'
import { applyResult, type ResultInput } from './engine.ts'

interface S { inv: Inv[]; net: NetEl[]; netHist: NetChange[]; users: User[]; buildings: Building[]; notifs: Notif[]; audit: Audit[] }
const seed = (): S => structuredClone({ inv: SEED_INV, net: SEED_NET, netHist: SEED_NETHIST, users: SEED_USERS, buildings: SEED_BUILDINGS, notifs: SEED_NOTIFS, audit: SEED_AUDIT })
const KEY = 'alursense-demo-v1'
const load = (): S => { try { const v = localStorage.getItem(KEY); if (v) return JSON.parse(v) } catch { /* penyimpanan tidak tersedia */ } return seed() }
const ls = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d } catch { return d } }

export interface Toast { id: number; msg: string; type: 'ok' | 'err' | 'info' }
export const ME = 'Andi Pratama'
export const APPROVERS: Role[] = ['Supervisor', 'Administrator', 'Maintenance Manager']

export function useStore() {
  const [s, setS] = useState<S>(load)
  const [authed, setAuthed] = useState(ls('alursense-auth', '') === '1')
  const [role, setRoleS] = useState<Role>(ls('alursense-role', 'Teknisi') as Role)
  const [building, setBuilding] = useState('Gedung Sentra Utama')
  const [lang, setLang] = useState(ls('alursense-lang', 'id'))
  const [toasts, setToasts] = useState<Toast[]>([])
  const tid = useRef(0)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* abaikan */ } }, [s])

  const toast = useCallback((msg: string, type: Toast['type'] = 'ok') => {
    const id = ++tid.current
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])
  const log = (a: S, action: string, obj: string, notif?: Omit<Notif, 'id' | 'at' | 'read'>): S => ({
    ...a, audit: [{ id: 'a' + (a.audit.length + 1) + Date.now(), who: ME, action, obj, at: NOW() }, ...a.audit],
    notifs: notif ? [{ ...notif, id: 'n' + Date.now(), at: NOW(), read: false }, ...a.notifs] : a.notifs,
  })
  const canApprove = APPROVERS.includes(role)

  const api = useMemo(() => ({
    toast,
    login: () => { setAuthed(true); try { localStorage.setItem('alursense-auth', '1') } catch { /* */ } },
    logout: () => { setAuthed(false); try { localStorage.removeItem('alursense-auth') } catch { /* */ } },
    setRole: (r: Role) => { setRoleS(r); try { localStorage.setItem('alursense-role', r) } catch { /* */ }; toast(`Peran demo: ${r}`, 'info') },
    setLang: (l: string) => { setLang(l); try { localStorage.setItem('alursense-lang', l) } catch { /* */ } },
    reset: () => { setS(seed()); toast('Data demo dikembalikan ke kondisi awal.', 'info') },
    updInv: (id: string, patch: Partial<Inv>, action = 'Memperbarui investigasi') => setS((a) => log({ ...a, inv: a.inv.map((i) => (i.id === id ? { ...i, ...patch, updated: NOW() } : i)) }, action, id)),
    addInv: (i: Inv) => setS((a) => log({ ...a, inv: [i, ...a.inv] }, i.status === 'Draft' ? 'Menyimpan draf investigasi' : 'Membuat investigasi', i.id, { type: 'Investigasi', text: `Investigasi ${i.id} ${i.status === 'Draft' ? 'disimpan sebagai draf' : 'dibuat'}.`, to: `/investigations/${i.id}` })),
    setNetStatus: (id: string, status: DocStatus, note?: string) => setS((a) => {
      const cur = a.net.find((e) => e.id === id)!
      if (cur.status === status && !note) return a
      const net = a.net.map((e) => (e.id === id ? { ...e, status, verified: status === 'verified' ? NOW().slice(0, 10) : e.verified, notes: note ? [...e.notes, note] : e.notes } : e))
      const ch: NetChange = { id: 'c' + Date.now(), el: id, who: ME, what: note && cur.status === status ? 'Catatan ditambahkan' : 'Status dokumentasi', prev: cur.status, next: status, date: NOW().slice(0, 10) }
      return log({ ...a, net, netHist: [ch, ...a.netHist] }, 'Memperbarui dokumentasi jaringan', id, { type: 'Jaringan', text: `Dokumentasi ${id} diperbarui.`, to: '/networks' })
    }),
    planExam: (invId: string, type: ExamId, tech: string, needsApproval: boolean): Exam => {
      const def = exDef(type)
      const waits = def.auth || needsApproval
      const ex: Exam = { id: `EX-P${Date.now().toString().slice(-5)}`, inv: invId, type, tech, date: NOW().slice(0, 10), element: '', status: waits ? 'Menunggu Persetujuan' : 'Direncanakan', review: 'Belum', sim: true }
      setS((a) => log({ ...a, inv: a.inv.map((i) => (i.id === invId ? { ...i, exams: [...i.exams, ex], updated: NOW(), decisions: [...i.decisions, { at: NOW(), who: ME, text: `Menerima rekomendasi: ${def.name}${waits ? ' (menunggu persetujuan supervisor)' : ''}.` }] } : i)) }, 'Merencanakan pemeriksaan', `${invId} · ${def.name}`, waits ? { type: 'Persetujuan', text: `Persetujuan supervisor diperlukan untuk ${invId} (${def.name}).`, to: `/investigations/${invId}` } : undefined))
      return ex
    },
    approveExam: (invId: string, exId: string) => setS((a) => log({ ...a, inv: a.inv.map((i) => (i.id === invId ? { ...i, exams: i.exams.map((e) => (e.id === exId ? { ...e, status: 'Disetujui' as const } : e)), updated: NOW() } : i)) }, 'Menyetujui rencana pemeriksaan', `${invId} · ${exId}`)),
    decide: (invId: string, text: string) => setS((a) => log({ ...a, inv: a.inv.map((i) => (i.id === invId ? { ...i, decisions: [...i.decisions, { at: NOW(), who: ME, text }], updated: NOW() } : i)) }, text, invId)),
    reviewExam: (invId: string, exId: string, ok: boolean) => setS((a) => log({ ...a, inv: a.inv.map((i) => (i.id === invId ? { ...i, exams: i.exams.map((e) => (e.id === exId ? { ...e, review: ok ? ('Disetujui' as const) : ('Ditolak' as const) } : e)) } : i)) }, ok ? 'Menyetujui hasil pemeriksaan' : 'Menolak hasil pemeriksaan', `${invId} · ${exId}`)),
    saveDraftExam: (invId: string, r: ResultInput) => setS((a) => ({ ...a, inv: a.inv.map((i) => (i.id === invId ? { ...i, exams: [...i.exams.filter((e) => e.id !== r.planId), { id: r.planId ?? `EX-D${Date.now().toString().slice(-5)}`, inv: invId, type: r.type, tech: r.tech, date: r.date, element: r.element, status: 'Draft' as const, review: 'Belum' as const, summary: r.summary, cls: r.cls, target: r.target, sim: true }] } : i)) })),
    // Mengembalikan Error bila otorisasi kurang; pemanggil menampilkan pesan.
    recordResult: (invId: string, r: ResultInput, verifyDoc: boolean) => {
      const inv = s.inv.find((i) => i.id === invId)!
      const next = applyResult(inv, r, s.net, ME) // dapat melempar
      setS((a) => {
        let net = a.net, netHist = a.netHist
        const target = verifyDoc ? net.find((e) => e.id === r.element) : undefined
        if (target && target.status !== 'verified') {
          net = net.map((e) => (e.id === target.id ? { ...e, status: 'verified' as const, verified: r.date, source: 'Tinjauan dokumentasi ' + r.date } : e))
          netHist = [{ id: 'c' + Date.now(), el: target.id, who: ME, what: 'Diverifikasi lewat hasil pemeriksaan', prev: target.status, next: 'verified', date: r.date }, ...netHist]
        }
        return log({ ...a, net, netHist, inv: a.inv.map((i) => (i.id === invId ? next : i)) }, 'Mencatat hasil pemeriksaan', `${invId} · ${exDef(r.type).name}`, { type: 'Investigasi', text: `Hasil pemeriksaan baru dikirim untuk ${invId}. Rekomendasi diperbarui.`, to: `/investigations/${invId}` })
      })
    },
    addUser: (u: User) => setS((a) => log({ ...a, users: [...a.users, u] }, 'Mengundang pengguna', u.email)),
    updUser: (id: string, p: Partial<User>) => setS((a) => log({ ...a, users: a.users.map((u) => (u.id === id ? { ...u, ...p } : u)) }, 'Memperbarui pengguna', id)),
    addBuilding: (b: Building) => setS((a) => log({ ...a, buildings: [...a.buildings, b] }, 'Menambah gedung', b.name)),
    readNotif: (id?: string) => setS((a) => ({ ...a, notifs: a.notifs.map((n) => (!id || n.id === id ? { ...n, read: true } : n)) })),
    logAudit: (action: string, obj: string) => setS((a) => log(a, action, obj)),
  }), [s, toast])

  return { ...s, authed, role, building, setBuilding, lang, toasts, canApprove, dismiss: (id: number) => setToasts((t) => t.filter((x) => x.id !== id)), ...api }
}
type Store = ReturnType<typeof useStore>
const Ctx = createContext<Store>(null!)
export const Provider = ({ children }: { children: ReactNode }) => <Ctx.Provider value={useStore()}>{children}</Ctx.Provider>
export const useApp = () => useContext(Ctx)
