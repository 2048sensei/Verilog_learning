// ============================================================
// expr.ts — Verilog 表达式求值器（教学子集）
// 支持：数字字面量(带位宽/基)、标识符、括号、拼接 {}、
//       一元 ~、二元 | ^ & == != < <= > >= << >> + - * /
// 返回 { value, bits }，值用 number 存储（够教学使用）。
// ============================================================

export type VarLookup = (name: string) => number

interface Token {
  kind: 'num' | 'id' | 'op' | 'lp' | 'rp' | 'lbrace' | 'rbrace' | 'comma'
  s: string
  bits?: number
  val?: number
}

function tokenize(src: string): Token[] {
  const toks: Token[] = []
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue }

    // 带位宽的数值： 4'b1010  8'd255  8'hFF
    if (/[0-9]/.test(c)) {
      let m = /^(\d+)'([bodhBODH])([0-9a-fA-FxXzZ_]+)/.exec(src.slice(i))
      if (m) {
        const width = parseInt(m[1], 10)
        const base = m[2].toLowerCase()
        const digits = m[3].replace(/_/g, '')
        const radix = base === 'b' ? 2 : base === 'o' ? 8 : base === 'h' ? 16 : 10
        let val = 0
        for (const d of digits) {
          const dv = d === 'x' || d === 'z' || d === 'X' || d === 'Z' ? 0 : parseInt(d, radix)
          val = val * radix + dv
        }
        toks.push({ kind: 'num', s: m[0], bits: width, val })
        i += m[0].length
        continue
      }
      m = /^\d+/.exec(src.slice(i))
      toks.push({ kind: 'num', s: m![0], val: parseInt(m![0], 10), bits: 32 })
      i += m![0].length
      continue
    }

    // 无位宽带基： 'b1010
    if (c === "'") {
      const m = /^'([bodhBODH])([0-9a-fA-FxXzZ_]+)/.exec(src.slice(i))
      if (m) {
        const base = m[1].toLowerCase()
        const digits = m[2].replace(/_/g, '')
        const radix = base === 'b' ? 2 : base === 'o' ? 8 : base === 'h' ? 16 : 10
        let val = 0
        for (const d of digits) {
          const dv = d === 'x' || d === 'z' || d === 'X' || d === 'Z' ? 0 : parseInt(d, radix)
          val = val * radix + dv
        }
        const width = digits.length * (base === 'b' ? 1 : base === 'o' ? 3 : 4)
        toks.push({ kind: 'num', s: m[0], val, bits: Math.max(1, width) })
        i += m[0].length
        continue
      }
    }

    // 标识符
    if (/[a-zA-Z_]/.test(c)) {
      const m = /^[a-zA-Z_]\w*/.exec(src.slice(i))
      toks.push({ kind: 'id', s: m![0] })
      i += m![0].length
      continue
    }

    // 多字符操作符
    const ops2 = ['<<', '>>', '==', '!=', '<=', '>=']
    let matched = false
    for (const op of ops2) {
      if (src.slice(i, i + 2) === op) {
        toks.push({ kind: 'op', s: op })
        i += 2
        matched = true
        break
      }
    }
    if (matched) continue

    if ('&|^~+-*(){}<>=!,:[]'.includes(c)) {
      if (c === '(') toks.push({ kind: 'lp', s: c })
      else if (c === ')') toks.push({ kind: 'rp', s: c })
      else if (c === '{') toks.push({ kind: 'lbrace', s: c })
      else if (c === '}') toks.push({ kind: 'rbrace', s: c })
      else if (c === ',') toks.push({ kind: 'comma', s: c })
      else toks.push({ kind: 'op', s: c })
      i++
      continue
    }

    i++ // 未知字符跳过
  }
  return toks
}

export interface ExprResult {
  value: number
  bits: number
}

export function evalExpr(src: string, lookup: VarLookup, widthLookup?: (name: string) => number): ExprResult {
  const toks = tokenize(src)
  let pos = 0

  const peek = () => toks[pos]
  const next = () => toks[pos++]
  const isOp = (s: string) => { const t = peek(); return !!t && t.kind === 'op' && t.s === s }
  const isRp = () => { const t = peek(); return !!t && t.kind === 'rp' }
  const isRbrace = () => { const t = peek(); return !!t && t.kind === 'rbrace' }

  const bin = (a: ExprResult, b: ExprResult, fn: (x: number, y: number) => number): ExprResult => ({
    value: fn(a.value, b.value),
    bits: Math.max(1, a.bits, b.bits),
  })

  function parseUnary(): ExprResult {
    if (isOp('~')) {
      next()
      const v = parseUnary()
      return { value: ~v.value, bits: v.bits }
    }
    if (isOp('!')) {
      next()
      const v = parseUnary()
      return { value: v.value === 0 ? 1 : 0, bits: v.bits }
    }
    if (isOp('-')) {
      next()
      const v = parseUnary()
      return { value: -v.value, bits: v.bits }
    }
    if (isOp('+')) {
      next()
      return parseUnary()
    }
    const t = next()
    if (!t) throw new Error('表达式不完整')
    if (t.kind === 'num') return { value: t.val!, bits: t.bits! }
    if (t.kind === 'id') {
      // 位选 name[msb:lsb] / name[idx]，如 q[6:0]、q[0]
      if (peek() && peek().s === '[') {
        next()
        const a = parseOr()
        let b = a
        if (peek() && peek().s === ':') {
          next()
          b = parseOr()
        }
        if (!(peek() && peek().s === ']')) throw new Error(`位选缺 ]: ${src}`)
        next()
        const full = lookup(t.s)
        const lo = Math.min(a.value, b.value)
        const hi = Math.max(a.value, b.value)
        const w = hi - lo + 1
        const part = (full >>> lo) & (w >= 31 ? 0x7fffffff : (1 << w) - 1)
        return { value: part, bits: w }
      }
      return { value: lookup(t.s), bits: widthLookup?.(t.s) ?? 32 }
    }
    if (t.kind === 'lp') {
      const v = parseOr()
      if (!isRp()) throw new Error(`缺右括号: ${src}`)
      next()
      return v
    }
    if (t.kind === 'lbrace') {
      // 拼接 {a, b, c}
      const parts: ExprResult[] = []
      while (peek() && !isRbrace()) {
        if (peek().kind === 'comma') { next(); continue }
        parts.push(parseOr())
      }
      if (!isRbrace()) throw new Error(`缺 } : ${src}`)
      next()
      let value = 0
      let bits = 0
      for (const p of parts) {
        const pw = Math.max(1, Math.min(p.bits, 31))
        const pv = p.value & (pw >= 31 ? 0x7fffffff : (1 << pw) - 1)
        value = (value << pw) | pv
        bits += p.bits
      }
      return { value, bits: Math.max(1, bits) }
    }
    throw new Error(`无法解析的表达式: ${src}`)
  }

  function parseMul(): ExprResult {
    let left = parseUnary()
    while (isOp('*') || isOp('/')) {
      const op = next().s
      const right = parseUnary()
      left = bin(left, right, (a, b) => op === '*' ? a * b : Math.floor(a / b))
    }
    return left
  }

  function parseAdd(): ExprResult {
    let left = parseMul()
    while (isOp('+') || isOp('-')) {
      const op = next().s
      const right = parseMul()
      left = bin(left, right, (a, b) => op === '+' ? a + b : a - b)
    }
    return left
  }

  function parseShift(): ExprResult {
    let left = parseAdd()
    while (isOp('<<') || isOp('>>')) {
      const op = next().s
      const right = parseAdd()
      left = bin(left, right, (a, b) => op === '<<' ? a << (b & 31) : a >> (b & 31))
    }
    return left
  }

  function parseCmp(): ExprResult {
    let left = parseShift()
    while (isOp('<') || isOp('<=') || isOp('>') || isOp('>=')) {
      const op = next().s
      const right = parseShift()
      left = bin(left, right, (a, b) => op === '<' ? (a < b ? 1 : 0)
        : op === '<=' ? (a <= b ? 1 : 0)
        : op === '>' ? (a > b ? 1 : 0)
        : (a >= b ? 1 : 0))
    }
    return left
  }

  function parseEq(): ExprResult {
    let left = parseCmp()
    while (isOp('==') || isOp('!=')) {
      const op = next().s
      const right = parseCmp()
      left = bin(left, right, (a, b) => op === '==' ? (a === b ? 1 : 0) : (a !== b ? 1 : 0))
    }
    return left
  }

  function parseAnd(): ExprResult {
    let left = parseEq()
    while (isOp('&')) {
      next()
      const right = parseEq()
      left = bin(left, right, (a, b) => a & b)
    }
    return left
  }

  function parseXor(): ExprResult {
    let left = parseAnd()
    while (isOp('^')) {
      next()
      const right = parseAnd()
      left = bin(left, right, (a, b) => a ^ b)
    }
    return left
  }

  function parseOr(): ExprResult {
    let left = parseXor()
    while (isOp('|')) {
      next()
      const right = parseXor()
      left = bin(left, right, (a, b) => a | b)
    }
    return left
  }

  const res = parseOr()
  return res
}
