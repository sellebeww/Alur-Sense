import assert from 'node:assert/strict'
import { SEED_INV, SEED_NET, completeness } from './data.ts'
import { recommend, applyResult } from './engine.ts'

const inv = SEED_INV[0]
assert.equal(completeness(SEED_NET), 68)
const s0 = recommend(inv, SEED_NET)
assert.deepEqual(s0.recs.filter((r) => r.rank).slice(0, 3).map((r) => r.def.id), ['meter', 'acoustic', 'docs'], 'urutan awal AS-0261')
assert.equal(s0.recs.find((r) => r.def.id === 'sensor')!.rank, 0, 'sensor tidak tersedia tidak diberi peringkat')

assert.throws(() => applyResult(inv, { type: 'controlled', cls: 'Tidak meyakinkan', quality: 'Baik', summary: 'x', support: '', against: '', element: 'P-04', procedure: 'Requires review', tech: 'A', date: '2026-11-09' }, SEED_NET, 'A'), /Otorisasi/)

const next = applyResult(inv, { type: 'meter', cls: 'Mendukung hipotesis', target: 'H-A', quality: 'Baik', summary: 'Pola intermiten', support: '', against: '', element: 'M-01', procedure: 'Ya', tech: 'Andi', date: '2026-11-09' }, SEED_NET, 'Andi')
assert.equal(next.hyps[0].support, 3)
assert.equal(next.recHistory.length, 1)
const s1 = recommend(next, SEED_NET)
assert.notEqual(s1.recs[0].def.id, 'meter', 'meter tidak lagi diprioritaskan setelah dilakukan')

const low = applyResult(inv, { type: 'meter', cls: 'Mendukung hipotesis', target: 'H-A', quality: 'Rendah', summary: 'x', support: '', against: '', element: 'M-01', procedure: 'Ya', tech: 'A', date: '2026-11-09' }, SEED_NET, 'A')
assert.equal(low.hyps[0].support, 2, 'kualitas rendah tidak mengubah dukungan')
console.log('engine OK — ranking awal:', s0.recs.slice(0, 3).map((r) => `${r.def.id}=${r.value}`).join(', '), '| sesudah:', s1.recs.slice(0, 3).map((r) => `${r.def.id}=${r.value}`).join(', '))
