// Parses an Evident "Booked Cases" export (Ref, patient, doctor, product,
// Billed/WIP/Total value, first arrival) into rows the backend's
// POST /api/cases/import-evident can consume. Evident's own report bundles
// a totals row at the bottom (no Ref) — filtered out below.

function parseCsvLine(line) {
  const cells = []
  let cur = ''
  let inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = '' }
    else cur += ch
  }
  cells.push(cur.trim())
  return cells
}

function money(raw) {
  const n = Number(String(raw || '').replace(/[$,]/g, ''))
  return isNaN(n) ? 0 : n
}

export function parseEvidentCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(h =>
    h.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  )
  const col = (...keys) => { for (const k of keys) { const i = headers.indexOf(k); if (i >= 0) return i } return -1 }
  const map = {
    ref:            col('ref'),
    patient:        col('case_number', 'patient', 'patient_name'),
    customer_name:  col('customer_name', 'doctor', 'doctor_name', 'customer'),
    product_name:   col('product_name', 'product'),
    billed:         col('sales_value_total_billed', 'billed', 'total_billed'),
    wip:            col('sales_value_total_wip', 'wip', 'total_wip'),
    total:          col('sales_value_total', 'total', 'sales_value'),
    first_arrival:  col('first_arrival', 'arrival', 'date'),
  }

  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line)
    const g = (k) => map[k] >= 0 ? (cells[map[k]] || '').trim() : ''

    const customer_name = g('customer_name')
    const ref = g('ref')
    // Evident's totals row has a blank Ref and no doctor — skip it, along
    // with any other blank/junk row.
    if (!ref || !customer_name) return null

    return {
      ref,
      patient: g('patient'),
      customer_name,
      product_name: g('product_name'),
      billed: money(g('billed')),
      wip: money(g('wip')),
      total: money(g('total')),
      first_arrival: g('first_arrival'),
    }
  }).filter(Boolean)
}
