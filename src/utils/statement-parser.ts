/**
 * Parsers for bank statement files (CSV and OFX/OFC).
 * Produces a normalized list of ParsedEntry that the import UI maps to
 * Kaivo transactions.
 */

export interface ParsedEntry {
  date: string          // yyyy-MM-dd
  description: string
  amount: number        // always positive
  type: 'income' | 'expense'
  raw: string           // original line/memo, for reference
}

export interface ParseResult {
  entries: ParsedEntry[]
  errors: string[]
  format: 'csv' | 'ofx'
}

// ---------- Date helpers ----------

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Accepts dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, yyyymmdd and returns yyyy-MM-dd. */
function normalizeDate(input: string): string | null {
  const s = input.trim()
  if (!s) return null

  // yyyymmdd (OFX) — possibly with time/tz suffix
  const ofx = s.match(/^(\d{4})(\d{2})(\d{2})/)
  if (ofx && s.length >= 8 && !s.includes('/') && !s.includes('-')) {
    const [, y, m, d] = ofx
    return `${y}-${m}-${d}`
  }

  // yyyy-mm-dd
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const [, y, m, d] = iso
    return `${y}-${m}-${d}`
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const br = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
  if (br) {
    let [, d, m, y] = br
    if (y.length === 2) y = `20${y}`
    return `${y}-${pad(Number(m))}-${pad(Number(d))}`
  }

  return null
}

/** Parses a money string like "1.234,56", "-1234.56", "R$ 1.234,56". */
function parseAmount(input: string): number | null {
  let s = input.replace(/[R$\s]/g, '').trim()
  if (!s) return null

  const negative = s.startsWith('-') || /^\(.*\)$/.test(s)
  s = s.replace(/[()]/g, '').replace(/^-/, '')

  // Decide decimal separator: if both "." and "," present, the last one is decimal
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      // pt-BR: 1.234,56
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      // en-US: 1,234.56
      s = s.replace(/,/g, '')
    }
  } else if (lastComma > -1) {
    s = s.replace(',', '.')
  }

  const value = parseFloat(s)
  if (isNaN(value)) return null
  return negative ? -value : value
}

// ---------- CSV ----------

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === delimiter && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result.map(c => c.trim().replace(/^"|"$/g, ''))
}

function detectDelimiter(line: string): string {
  const counts: Record<string, number> = {
    ';': (line.match(/;/g) || []).length,
    ',': (line.match(/,/g) || []).length,
    '\t': (line.match(/\t/g) || []).length,
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.join(' ').toLowerCase()
  return /data|date|descri|hist|valor|amount|montante|lan[çc]/.test(joined)
}

export function parseCSV(content: string): ParseResult {
  const errors: string[] = []
  const entries: ParsedEntry[] = []

  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) {
    return { entries, errors: ['Arquivo vazio'], format: 'csv' }
  }

  const delimiter = detectDelimiter(lines[0])
  const firstCells = splitCsvLine(lines[0], delimiter)

  // Try to map columns from header
  let dateIdx = 0, descIdx = 1, amountIdx = 2
  let startRow = 0

  if (looksLikeHeader(firstCells)) {
    startRow = 1
    firstCells.forEach((cell, i) => {
      const c = cell.toLowerCase()
      if (/data|date/.test(c)) dateIdx = i
      else if (/descri|hist|lan[çc]|memo/.test(c)) descIdx = i
      else if (/valor|amount|montante|cr[ée]dito|d[ée]bito/.test(c)) amountIdx = i
    })
  }

  for (let r = startRow; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r], delimiter)
    if (cells.length < 2) continue

    const date = normalizeDate(cells[dateIdx] || '')
    const amount = parseAmount(cells[amountIdx] || '')
    const description = (cells[descIdx] || '').trim() || 'Sem descrição'

    if (!date) { errors.push(`Linha ${r + 1}: data inválida ("${cells[dateIdx]}")`); continue }
    if (amount === null || amount === 0) { errors.push(`Linha ${r + 1}: valor inválido ("${cells[amountIdx]}")`); continue }

    entries.push({
      date,
      description,
      amount: Math.abs(amount),
      type: amount < 0 ? 'expense' : 'income',
      raw: lines[r],
    })
  }

  return { entries, errors, format: 'csv' }
}

// ---------- OFX ----------

export function parseOFX(content: string): ParseResult {
  const errors: string[] = []
  const entries: ParsedEntry[] = []

  // Each transaction is between <STMTTRN> ... </STMTTRN>
  const txnBlocks = content.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi) || []

  if (txnBlocks.length === 0) {
    // Some OFX files use SGML without closing tags — fall back to splitting on <STMTTRN>
    const loose = content.split(/<STMTTRN>/i).slice(1)
    if (loose.length === 0) {
      return { entries, errors: ['Nenhuma transação encontrada no arquivo OFX'], format: 'ofx' }
    }
    loose.forEach(block => parseOfxBlock(block, entries, errors))
    return { entries, errors, format: 'ofx' }
  }

  txnBlocks.forEach(block => parseOfxBlock(block, entries, errors))
  return { entries, errors, format: 'ofx' }
}

function getTag(block: string, tag: string): string | null {
  // Works for both <TAG>value</TAG> and SGML <TAG>value (newline)
  const re = new RegExp(`<${tag}>([^<\r\n]*)`, 'i')
  const m = block.match(re)
  return m ? m[1].trim() : null
}

function parseOfxBlock(block: string, entries: ParsedEntry[], errors: string[]): void {
  const rawDate = getTag(block, 'DTPOSTED')
  const rawAmount = getTag(block, 'TRNAMT')
  const memo = getTag(block, 'MEMO') || getTag(block, 'NAME') || 'Sem descrição'

  const date = rawDate ? normalizeDate(rawDate) : null
  const amount = rawAmount ? parseAmount(rawAmount) : null

  if (!date) { errors.push(`Transação sem data válida (${rawDate ?? 'vazio'})`); return }
  if (amount === null || amount === 0) { errors.push(`Transação sem valor válido (${rawAmount ?? 'vazio'})`); return }

  entries.push({
    date,
    description: memo,
    amount: Math.abs(amount),
    type: amount < 0 ? 'expense' : 'income',
    raw: block.trim().slice(0, 200),
  })
}

// ---------- Entry point ----------

export function parseStatement(filename: string, content: string): ParseResult {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.ofx') || lower.endsWith('.ofc') || /<OFX>|<STMTTRN>/i.test(content)) {
    return parseOFX(content)
  }
  return parseCSV(content)
}
