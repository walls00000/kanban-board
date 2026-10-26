// Pure helpers for user-adjustable column widths. Loaded as a plain <script> in the browser
// (functions become globals) and via require() in the node:test suite.

const MIN_COLUMN_WIDTH = 200
const COLUMN_WIDTHS_STORAGE_KEY = 'kanban.columnWidths'

/** @returns {number} width limited to [min, max]; non-numeric input yields min */
function clampWidth(width, min = MIN_COLUMN_WIDTH, max = Infinity) {
  if (typeof width !== 'number' || Number.isNaN(width)) return min
  return Math.min(Math.max(width, min), max)
}

/** @returns {Object<string, number>} saved column id -> px width; empty if raw is missing or invalid */
function parseSavedWidths(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return {}
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

  const widths = {}
  Object.entries(parsed).forEach(([columnId, width]) => {
    if (typeof width === 'number' && !Number.isNaN(width)) {
      widths[columnId] = clampWidth(width)
    }
  })
  return widths
}

/** @returns {string} JSON string suitable for localStorage */
function serializeWidths(widths) {
  return JSON.stringify(widths)
}

if (typeof module !== 'undefined') {
  module.exports = { MIN_COLUMN_WIDTH, COLUMN_WIDTHS_STORAGE_KEY, clampWidth, parseSavedWidths, serializeWidths }
}
