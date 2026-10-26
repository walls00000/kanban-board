const test = require('node:test')
const assert = require('node:assert')
const { MIN_COLUMN_WIDTH, clampWidth, parseSavedWidths, serializeWidths } = require('../public/column-widths.js')

test('clampWidth returns the width when within bounds', () => {
  assert.strictEqual(clampWidth(400), 400)
})

test('clampWidth raises widths below the minimum', () => {
  assert.strictEqual(clampWidth(10), MIN_COLUMN_WIDTH)
})

test('clampWidth lowers widths above the maximum when one is given', () => {
  assert.strictEqual(clampWidth(900, 200, 600), 600)
})

test('clampWidth falls back to the minimum for non-numeric input', () => {
  assert.strictEqual(clampWidth(NaN), MIN_COLUMN_WIDTH)
})

test('parseSavedWidths returns an empty object for null or invalid JSON', () => {
  assert.deepStrictEqual(parseSavedWidths(null), {})
  assert.deepStrictEqual(parseSavedWidths('not json'), {})
  assert.deepStrictEqual(parseSavedWidths('[1,2]'), {})
})

test('parseSavedWidths keeps valid numeric widths and clamps them', () => {
  const raw = JSON.stringify({ todo: 350, inprogress: 5 })
  assert.deepStrictEqual(parseSavedWidths(raw), { todo: 350, inprogress: MIN_COLUMN_WIDTH })
})

test('parseSavedWidths drops entries whose width is not a number', () => {
  const raw = JSON.stringify({ todo: 'wide', done: 300 })
  assert.deepStrictEqual(parseSavedWidths(raw), { done: 300 })
})

test('serializeWidths round-trips through parseSavedWidths', () => {
  const widths = { todo: 320, done: 280 }
  assert.deepStrictEqual(parseSavedWidths(serializeWidths(widths)), widths)
})
