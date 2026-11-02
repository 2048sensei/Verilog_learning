// ============================================================
// engine.ts — 微型 Verilog 解析器 + 离散事件仿真器（教学子集）
// 支持：
//   · reg/wire/input/output 声明（含 [7:0] 向量）
//   · assign 连续赋值（组合）
//   · initial 块（#时延 + 赋值 + forever 时钟/激励展开）
//   · always #N clk = ~clk（时钟）
//   · always @(posedge/negedge clk) 时序块（非阻塞 <=，支持 if/else）
//   · always @(*) 组合块（阻塞 =）
//   · 拼接赋值 {Co,So} = ...
//   · 表达式求值（见 expr.ts）
// ============================================================

import { evalExpr } from './expr'

export interface ParsedProgram {
  signals: { name: string; width: number }[]
  assigns: { target: string; expr: string }[]
  clocks: { delay: number; target: string }[]
  seqBlocks: SeqBlock[]
  combBlocks: CombBlock[]
  inits: InitStmt[]
}

/** 一条赋值语句（无 if 包装） */
export interface BlockStmt {
  lhs: string
  op: '=' | '<='
  expr: string
}

/** if / else-if / else 分支链。第一个 cond 为真的分支执行；无 cond 为默认分支 */
export interface IfBranch {
  cond?: string
  stmts: ProcItem[]
}

/** if 语句（可含 else-if / else 链） */
export interface IfStmt {
  kind: 'if'
  branches: IfBranch[]
}

/** 过程块内的一条语句：赋值 或 if 结构 */
export type ProcItem = BlockStmt | IfStmt

export interface SeqBlock {
  /** 触发敏感列表：如 [{edge:'pos',clk:'clk'},{edge:'neg',clk:'rst_n'}] */
  sensitivity: { edge: 'pos' | 'neg' | 'any'; clk: string }[]
  stmts: ProcItem[]
}

export interface CombBlock {
  stmts: ProcItem[]
}

export interface InitSet {
  target: string
  expr: string
}

export interface InitStmt {
  delay: number
  sets: InitSet[]
}

export interface SimSignal {
  name: string
  width: number
  /** [time, value][]，含 t=0 初值 */
  edges: [number, number][]
}

// ---------------- 预处理 ----------------

function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
}

// 按顶层分号切分（begin/end 深度>0 时不切分）
function splitTopLevel(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let last = 0
  let i = 0
  while (i < body.length) {
    const c = body[i]
    if (/[a-zA-Z_]/.test(c)) {
      const m = /^[a-zA-Z_]\w*/.exec(body.slice(i))
      const kw = m![0]
      if (kw === 'begin') depth++
      else if (kw === 'end') { depth = Math.max(0, depth - 1) }
      i += kw.length
      continue
    }
    if (c === ';' && depth === 0) {
      parts.push(body.slice(last, i))
      last = i + 1
    }
    i++
  }
  parts.push(body.slice(last))
  return parts
}

// 找到顶层赋值操作符位置：`<=`（非阻塞，返回 '<' 位置）或 `=`（阻塞）
// 跳过括号/拼接层级内的比较式（如 if 条件里的 a <= b）
function findAssignOp(s: string): number {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(' || c === '{') depth++
    else if (c === ')' || c === '}') depth--
    else if (depth === 0) {
      if (c === '<' && s[i + 1] === '=') return i
      if (c === '=') {
        if (s[i - 1] === '<' || s[i - 1] === '!' || s[i - 1] === '>' || s[i + 1] === '=') continue
        return i
      }
    }
  }
  return -1
}

// 解析赋值语句 → 目标(可含拼接/位选) + 表达式
function parseAssignStmt(s: string): { target: string; expr: string }[] {
  const eqIdx = findAssignOp(s)
  if (eqIdx === -1) return []
  const isLe = s[eqIdx] === '<'
  const lhs = s.slice(0, eqIdx).trim()
  const rhs = s.slice(eqIdx + (isLe ? 2 : 1)).replace(/;$/, '').trim()
  return [{ target: lhs, expr: rhs }]
}

// ---------------- 声明解析 ----------------

function parseDecls(code: string): { name: string; width: number }[] {
  const sigs: { name: string; width: number }[] = []
  const reserved = new Set(['reg', 'wire', 'logic', 'input', 'output', 'inout', 'module', 'endmodule', 'parameter'])
  const kw = 'output|input|inout|reg|wire|logic'
  // 兼容 `output reg [3:0] count`、`reg [7:0] q`、`wire a, b` 等写法。
  // 名字组用负向前瞻排除方向关键字，避免 `input Ai, Bi, Ci, output So` 把 output 当名字。
  const re = new RegExp(
    `\\b(reg|wire|input|output|logic)\\b\\s*(?:(?:reg|wire|logic)\\s+)?(?:\\[(\\d+)\\s*:\\s*(\\d+)\\])?\\s*` +
    `((?!${kw}\\b)[a-zA-Z_]\\w*(?:\\s*,\\s*(?!${kw}\\b)[a-zA-Z_]\\w*)*)`,
    'g',
  )
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    const width = m[2] !== undefined ? Math.max(1, Math.abs(parseInt(m[2], 10) - parseInt(m[3], 10)) + 1) : 1
    const names = m[4].split(',').map(x => x.trim()).filter(Boolean).filter(n => !reserved.has(n))
    names.forEach(n => sigs.push({ name: n, width }))
  }
  return sigs
}

// ---------------- initial 块解析 ----------------

function parseInitBody(body: string): InitStmt[] {
  const stmts: InitStmt[] = []
  for (const raw of splitTopLevel(body)) {
    const p = raw.trim()
    if (!p) continue
    // forever begin ... end → 展开 60 次（足够覆盖仿真时长）
    const fm = /^forever\s+begin\b([\s\S]*?)\bend\s*$/.exec(p)
    if (fm) {
      const inner = parseInitBody(fm[1])
      if (inner.length === 0) continue
      for (let k = 0; k < 60; k++) stmts.push(...inner)
      continue
    }
    let delay = 0
    let rest = p
    const dm = /^#\s*(\d+(?:\.\d+)?)\s*(.*)$/.exec(p)
    if (dm) {
      delay = Math.round(parseFloat(dm[1]))
      rest = dm[2].trim()
    }
    if (!rest) { stmts.push({ delay, sets: [] }); continue }
    const sets = parseAssignStmt(rest)
    stmts.push({ delay, sets })
  }
  return stmts
}

// ---------------- 过程块（always/comb 内容）解析 ----------------
// 用文本游标递归解析，天然支持 if/else-if/else 链、嵌套 begin/end、
// 跨行语句、块内语句，而不依赖预切分单元。

// 匹配以 '(' 开头的括号组，返回 {inner, rest}
function matchParen(s: string): { inner: string; rest: string } {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') { depth--; if (depth === 0) return { inner: s.slice(1, i), rest: s.slice(i + 1) } }
  }
  throw new Error('括号不匹配: ' + s.slice(0, 40))
}

// 匹配以 'begin' 开头的块直到配对的 'end'，返回 {inner, rest}
function matchBlock(s: string): { inner: string; rest: string } {
  let depth = 0
  const re = /\bbegin\b|\bend\b/g
  let m: RegExpExecArray | null
  let endIdx = -1
  while ((m = re.exec(s)) !== null) {
    if (m[0] === 'begin') depth++
    else { depth--; if (depth === 0) { endIdx = m.index; break } }
  }
  if (endIdx === -1) throw new Error('begin/end 不匹配: ' + s.slice(0, 40))
  return { inner: s.slice('begin'.length, endIdx), rest: s.slice(endIdx + 'end'.length) }
}

// 解析一条 if 语句（含 else-if / else 链），返回 IfStmt 与剩余文本
function parseIfStmt(s: string): { item: IfStmt; rest: string } {
  // s 以 "if (" 开头
  let rest = s.slice(2).trim()
  const condP = matchParen(rest)
  const cond = condP.inner.trim()
  rest = condP.rest.trim()
  const branches: IfBranch[] = []

  // then 分支
  let thenText = ''
  if (/^begin\b/.test(rest)) {
    const b = matchBlock(rest)
    thenText = b.inner
    rest = b.rest.trim()
  } else {
    const semi = rest.indexOf(';')
    thenText = semi === -1 ? rest : rest.slice(0, semi)
    rest = semi === -1 ? '' : rest.slice(semi + 1).trim()
  }
  branches.push({ cond, stmts: parseProcedural(thenText) })

  // else 链（可多个 else-if，最终一个默认 else）
  while (/^else\b/.test(rest)) {
    rest = rest.replace(/^else\s*/, '')
    if (/^if\s*\(/.test(rest)) {
      // else if → 展开其分支并入本链
      const nx = parseIfStmt(rest)
      branches.push(...nx.item.branches)
      rest = nx.rest.trim()
    } else {
      // 默认分支
      if (/^begin\b/.test(rest)) {
        const b = matchBlock(rest)
        branches.push({ stmts: parseProcedural(b.inner) })
        rest = b.rest.trim()
      } else {
        const semi = rest.indexOf(';')
        const body = semi === -1 ? rest : rest.slice(0, semi)
        branches.push({ stmts: parseProcedural(body) })
        rest = semi === -1 ? '' : rest.slice(semi + 1).trim()
      }
      break
    }
  }
  return { item: { kind: 'if', branches }, rest }
}

// 解析一个过程块文本 → 语句列表（赋值 + if 结构）
function parseProcedural(text: string): ProcItem[] {
  const out: ProcItem[] = []
  let s = text
  while (true) {
    s = s.trim()
    if (!s) break
    if (/^if\s*\(/.test(s)) {
      const { item, rest } = parseIfStmt(s)
      out.push(item)
      s = rest
      continue
    }
    if (/^begin\b/.test(s)) {
      // 裸 begin 块：递归展开
      const b = matchBlock(s)
      out.push(...parseProcedural(b.inner))
      s = b.rest
      continue
    }
    if (/^else\b/.test(s)) {
      // 游离 else（防御性跳过，正常由 parseIfStmt 消费）
      s = s.replace(/^else\b/, '')
      continue
    }
    // 单条赋值语句
    const semi = s.indexOf(';')
    const stmtText = (semi === -1 ? s : s.slice(0, semi)).trim()
    s = semi === -1 ? '' : s.slice(semi + 1)
    const eqIdx = findAssignOp(stmtText)
    if (eqIdx !== -1) {
      const isLe = stmtText[eqIdx] === '<'
      out.push({
        lhs: stmtText.slice(0, eqIdx).trim(),
        op: isLe ? '<=' : '=',
        expr: stmtText.slice(eqIdx + (isLe ? 2 : 1)).trim(),
      })
    }
  }
  return out
}

// ---------------- 顶层块提取 ----------------

interface RawBlock {
  kind: 'initial' | 'always' | 'assign'
  head: string
  body: string
}

function extractBlocks(code: string): RawBlock[] {
  const blocks: RawBlock[] = []
  const re = /\b(initial|always|assign)\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    const kind = m[1] as RawBlock['kind']
    const kwEnd = m.index + m[0].length
    const beginIdx = code.indexOf('begin', kwEnd)
    const semiIdx = code.indexOf(';', kwEnd)
    let i = 0
    if (beginIdx !== -1 && (semiIdx === -1 || beginIdx < semiIdx)) {
      // begin/end 平衡
      let depth = 0
      i = beginIdx
      const bre = /\bbegin\b|\bend\b/g
      bre.lastIndex = beginIdx
      let bm: RegExpExecArray | null
      let endIdx = -1
      while ((bm = bre.exec(code)) !== null) {
        if (bm[0] === 'begin') depth++
        else depth--
        if (depth === 0) { endIdx = bm.index; break }
      }
      if (endIdx === -1) throw new Error('begin/end 不匹配')
      blocks.push({
        kind,
        head: code.slice(kwEnd, beginIdx),
        body: code.slice(beginIdx + 'begin'.length, endIdx),
      })
      i = endIdx
    } else if (semiIdx !== -1) {
      blocks.push({ kind, head: code.slice(kwEnd, semiIdx), body: '' })
      i = semiIdx
    } else {
      i = kwEnd
    }
    re.lastIndex = i
  }
  return blocks
}

// ---------------- 主解析 ----------------

export function parseProgram(code: string): ParsedProgram {
  const clean = stripComments(code)
  const decls = parseDecls(clean)

  const assigns: ParsedProgram['assigns'] = []
  const clocks: ParsedProgram['clocks'] = []
  const seqBlocks: SeqBlock[] = []
  const combBlocks: CombBlock[] = []
  const inits: InitStmt[] = []

  for (const blk of extractBlocks(clean)) {
    if (blk.kind === 'assign') {
      const s = (blk.head + ' ' + blk.body).trim()
      const eqIdx = findAssignOp(s)
      if (eqIdx !== -1) {
        const isLe = s[eqIdx] === '<'
        assigns.push({
          target: s.slice(0, eqIdx).trim(),
          expr: s.slice(eqIdx + (isLe ? 2 : 1)).replace(/;$/, '').trim(),
        })
      }
    } else if (blk.kind === 'initial') {
      // initial 直接跟语句（无 begin）
      if (blk.head.trim() || !blk.body) {
        const head = (blk.head + ' ' + blk.body).trim()
        if (head) inits.push(...parseInitBody(head + ';'))
      } else {
        inits.push(...parseInitBody(blk.body))
      }
    } else {
      // always
      const head = blk.head
      const cm = /#\s*(\d+(?:\.\d+)?)\s*([a-zA-Z_]\w*)\s*=\s*~\s*([a-zA-Z_]\w*)/.exec(head + ' ' + blk.body)
      if (cm && cm[2] === cm[3]) {
        clocks.push({ delay: Math.max(1, Math.round(parseFloat(cm[1]))), target: cm[2] })
        continue
      }
      const em = /@\s*\(\s*([^)]*)\s*\)/.exec(head)
      if (em) {
        const inner = em[1].trim()
        // 单行 always（无 begin/end）：语句跟在 @(...) 之后，位于 head 里
        const stmtSrc = blk.body.trim() ? blk.body : head.slice(em.index + em[0].length).trim()
        if (inner === '*') {
          combBlocks.push({ stmts: parseProcedural(stmtSrc) })
          continue
        }
        const sens: SeqBlock['sensitivity'] = inner
          .split(/,\s*|\s+or\s+/)
          .map(p => p.trim())
          .filter(Boolean)
          .map(p => {
            const m = /^(posedge|negedge)\s+([a-zA-Z_]\w*)$/.exec(p)
            if (m) return { edge: m[1] === 'posedge' ? 'pos' : 'neg', clk: m[2] }
            if (/^[a-zA-Z_]\w*$/.test(p)) return { edge: 'any', clk: p }
            return null
          })
          .filter((x): x is { edge: 'pos' | 'neg' | 'any'; clk: string } => !!x)
        if (sens.some(s => s.edge === 'any')) {
          // 无沿敏感 → 组合块（阻塞赋值）
          combBlocks.push({ stmts: parseProcedural(stmtSrc) })
        } else {
          seqBlocks.push({ sensitivity: sens, stmts: parseProcedural(stmtSrc) })
        }
        continue
      }
      throw new Error('无法识别的 always 块: ' + (head + ' ' + blk.body).slice(0, 60))
    }
  }

  // 收集所有出现过的标识符（容错：未声明的信号自动按 1bit 补）
  const nameSet = new Set<string>()
  decls.forEach(d => nameSet.add(d.name))
  // 先剔除数字字面量（如 4'b0、8'hFF），避免把基数 b/d/h/o 当作标识符
  const consider = (s: string) => {
    (s.replace(/(?:\d+)?'[bodhBODH][0-9a-fA-FxXzZ_]+/g, ' ').match(/[a-zA-Z_]\w*/g) ?? []).forEach(t => nameSet.add(t))
  }
  const allExpr = [
    ...assigns.map(a => a.expr), ...assigns.map(a => a.target),
    ...clocks.map(c => c.target),
    ...inits.flatMap(i => i.sets.flatMap(s => [s.target, s.expr])),
  ]
  const considerItem = (it: ProcItem) => {
    if ('kind' in it) {
      for (const br of it.branches) { if (br.cond) consider(br.cond); br.stmts.forEach(considerItem) }
    } else {
      consider(it.lhs)
      consider(it.expr)
    }
  }
  seqBlocks.forEach(b => { b.sensitivity.forEach(x => consider(x.clk)); b.stmts.forEach(considerItem) })
  combBlocks.forEach(b => b.stmts.forEach(considerItem))
  allExpr.forEach(consider)

  const signals = decls.map(d => ({ ...d }))
  // 补齐未声明信号（按声明优先顺序）
  const declared = new Set(decls.map(d => d.name))
  const keywords = new Set(['begin', 'end', 'if', 'else', 'forever', 'assign', 'always', 'initial', 'posedge', 'negedge', 'reg', 'wire', 'input', 'output', 'module', 'endmodule', 'parameter', 'case', 'endcase', 'default', 'for', 'while'])
  nameSet.forEach(n => {
    if (!declared.has(n) && !keywords.has(n)) signals.push({ name: n, width: 1 })
  })

  return { signals, assigns, clocks, seqBlocks, combBlocks, inits }
}

// ---------------- 仿真引擎 ----------------

function maskOf(width: number): number {
  return width >= 31 ? 0x7fffffff : (1 << width) - 1
}

export function simulate(prog: ParsedProgram, maxTime: number): SimSignal[] {
  const vals = new Map<string, number>()
  const widths = new Map<string, number>()
  prog.signals.forEach(s => { vals.set(s.name, 0); widths.set(s.name, s.width) })

  const edges = new Map<string, [number, number][]>()
  const record = (name: string, t: number) => {
    const v = vals.get(name) ?? 0
    let list = edges.get(name)
    if (!list) { list = []; edges.set(name, list) }
    const last = list[list.length - 1]
    if (last && last[0] === t) {
      if (last[1] === v) return
      list.pop()
    }
    list.push([t, v])
  }

  prog.signals.forEach(s => record(s.name, 0))

  interface Ev { t: number; kind: 'tick' | 'set'; name: string; expr?: string }
  const events: Ev[] = []

  for (const c of prog.clocks) {
    for (let t = c.delay; t <= maxTime; t += c.delay) {
      events.push({ t, kind: 'tick', name: c.target })
    }
  }

  {
    let t = 0
    for (const st of prog.inits) {
      t += st.delay
      for (const set of st.sets) events.push({ t, kind: 'set', name: set.target, expr: set.expr })
    }
  }

  events.sort((a, b) => a.t - b.t)

  const lookup = (n: string) => vals.get(n) ?? 0
  const widthOf = (n: string) => widths.get(n) ?? 32

  // 解析赋值目标项：`name` / `name[a:b]` / `name[idx]`
  const parseLhsItem = (s: string): { name: string; lo: number; width: number } | null => {
    const m = /^([a-zA-Z_]\w*)(?:\[(\d+)(?::(\d+))?\])?$/.exec(s.trim())
    if (!m) return null
    if (m[2] !== undefined) {
      const a = parseInt(m[2], 10)
      const b = m[3] !== undefined ? parseInt(m[3], 10) : a
      return { name: m[1], lo: Math.min(a, b), width: Math.abs(a - b) + 1 }
    }
    return { name: m[1], lo: 0, width: widths.get(m[1]) ?? 1 }
  }

  // 写位域：把 part 写入 name 的 [lo : lo+width-1]
  const applyField = (name: string, lo: number, width: number, part: number, t: number): boolean => {
    const fmask = maskOf(width)
    const val = (part & fmask) << lo
    const old = vals.get(name) ?? 0
    const nv = (old & ~(fmask << lo)) | val
    if (old !== nv) { vals.set(name, nv); record(name, t); return true }
    return false
  }

  // 直接把数值写入赋值目标（拼接拆位/位选写域）
  const applyLhs = (lhs: string, value: number, t: number): boolean => {
    const m = /^\{([^}]*)\}$/.exec(lhs.trim())
    let changed = false
    if (m) {
      const items = m[1].split(',').map(parseLhsItem).filter((x): x is { name: string; lo: number; width: number } => !!x)
      let v = value
      // {Co, So} = ... ：最左项为最高位，从右往左拆
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i]
        const part = v & maskOf(it.width)
        v = v >> it.width
        if (applyField(it.name, it.lo, it.width, part, t)) changed = true
      }
    } else {
      const it = parseLhsItem(lhs)
      if (it) {
        const nv = value & maskOf(it.width)
        if (applyField(it.name, it.lo, it.width, nv, t)) changed = true
      }
    }
    return changed
  }

  // 递归执行过程语句（组合：阻塞语义）。返回是否发生赋值变化
  const execComb = (items: ProcItem[], t: number): boolean => {
    let changed = false
    for (const it of items) {
      if ('kind' in it) {
        // if 结构：执行第一个条件为真的分支
        for (const br of it.branches) {
          if (br.cond !== undefined && evalExpr(br.cond, lookup, widthOf).value === 0) continue
          if (execComb(br.stmts, t)) changed = true
          break
        }
      } else if (it.op === '=') {
        if (applyLhs(it.lhs, evalExpr(it.expr, lookup, widthOf).value, t)) changed = true
      }
    }
    return changed
  }

  const recomputeComb = (t: number) => {
    for (let iter = 0; iter < 40; iter++) {
      let changed = false
      for (const a of prog.assigns) if (applyLhs(a.target, evalExpr(a.expr, lookup, widthOf).value, t)) changed = true
      for (const cb of prog.combBlocks) if (execComb(cb.stmts, t)) changed = true
      if (!changed) break
    }
  }

  // 触发所有对该边沿敏感的顺序块（按 sensitivity 精确匹配）
  const fireSeq = (edge: 'pos' | 'neg', name: string, t: number) => {
    for (const b of prog.seqBlocks) {
      if (!b.sensitivity.some(x => x.edge === edge && x.clk === name)) continue
      // 采样阶段：递归遍历。
      //  <= 非阻塞：先采样、块末尾统一更新（先读旧值）。
      //  = 阻塞：立即生效（顺序执行，后续语句读到新值）。
      //  （这正对应真实 Verilog：时序块里混用阻塞赋值会把串联写成并联）
      const pending: { lhs: string; value: number }[] = []
      const sample = (items: ProcItem[]) => {
        for (const it of items) {
          if ('kind' in it) {
            for (const br of it.branches) {
              if (br.cond !== undefined && evalExpr(br.cond, lookup, widthOf).value === 0) continue
              sample(br.stmts)
              break
            }
          } else if (it.op === '<=') {
            pending.push({ lhs: it.lhs, value: evalExpr(it.expr, lookup, widthOf).value })
          } else {
            // 阻塞赋值：立即写回，下一条语句读到新值
            applyLhs(it.lhs, evalExpr(it.expr, lookup, widthOf).value, t)
          }
        }
      }
      sample(b.stmts)
      for (const p of pending) applyLhs(p.lhs, p.value, t)
    }
  }

  // set 事件的目标信号名（拼接/位选时拆开，用于沿检测）
  const targetNames = (lhs: string): string[] => {
    const m = /^\{([^}]*)\}$/.exec(lhs.trim())
    const src = m ? m[1] : lhs
    return src.split(',').map(parseLhsItem).filter((x): x is { name: string; lo: number; width: number } => !!x).map(i => i.name)
  }

  // 先跑一次组合，得到 t=0 的稳态
  recomputeComb(0)

  for (const ev of events) {
    if (ev.t > maxTime) break
    if (ev.kind === 'tick') {
      const old = vals.get(ev.name) ?? 0
      const nv = old === 0 ? 1 : 0
      vals.set(ev.name, nv)
      record(ev.name, ev.t)
      if (old === 0 && nv === 1) fireSeq('pos', ev.name, ev.t)
      if (old === 1 && nv === 0) fireSeq('neg', ev.name, ev.t)
    } else {
      const targets = targetNames(ev.name)
      const before = new Map(targets.map(n => [n, vals.get(n) ?? 0]))
      applyLhs(ev.name, evalExpr(ev.expr!, lookup, widthOf).value, ev.t)
      // initial 赋值也可能产生边沿（如 rst_n 下降沿触发异步复位）
      for (const n of targets) {
        const old = before.get(n)!
        const nv = vals.get(n) ?? 0
        if (old === 0 && nv === 1) fireSeq('pos', n, ev.t)
        if (old === 1 && nv === 0) fireSeq('neg', n, ev.t)
      }
    }
    recomputeComb(ev.t)
  }

  return prog.signals.map(s => ({
    name: s.name,
    width: s.width,
    edges: edges.get(s.name) ?? [[0, 0]],
  }))
}
