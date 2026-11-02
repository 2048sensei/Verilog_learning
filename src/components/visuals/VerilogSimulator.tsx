import { useEffect, useRef, useState } from 'react'
import { parseProgram, simulate, type SimSignal } from './sim/engine'

// ============================================================
// VerilogSimulator — 页内微型 Verilog 仿真器
// 学生可以直接编辑真实 Verilog 代码 → 点"运行" →
// 看到仿真波形 + 游标读数值。这是"上手"的核心交互：
// 改一行代码，看它如何影响波形，在运行中理解语法语义。
// 零额外依赖（纯前端解释器，见 sim/engine.ts）。
// ============================================================

export interface VerilogSimulatorProps {
  title: string
  /** 初始代码（编辑区内容） */
  initialCode: string
  /** 仿真时长（ns） */
  duration?: number
  /** 预设代码按钮：一键换代码 */
  presets?: { label: string; code: string }[]
  /** 只显示这些信号（按此顺序），默认全部 */
  signals?: string[]
  caption?: string
}

export default function VerilogSimulator({
  title,
  initialCode,
  duration = 120,
  presets,
  signals,
  caption,
}: VerilogSimulatorProps) {
  const [code, setCode] = useState(initialCode)
  const [result, setResult] = useState<SimSignal[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState(0.35) // 0..1
  const [hover, setHover] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const run = (src: string) => {
    try {
      const prog = parseProgram(src)
      const sigs = simulate(prog, duration)
      setResult(sigs)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setResult(null)
    }
  }

  useEffect(() => {
    try {
      const prog = parseProgram(initialCode)
      setResult(simulate(prog, duration))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setResult(null)
    }
    // 仅首次挂载运行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible: SimSignal[] = result
    ? signals
      ? signals.map(n => result.find(s => s.name === n)).filter((s): s is SimSignal => !!s)
      : result
    : []

  const VIEW_W = 940
  const LABEL_W = 150
  const PAD_R = 26
  const ROW_H = 46
  const AXIS_H = 26
  const END_X = VIEW_W - PAD_R
  const H = Math.max(90, visible.length * ROW_H + AXIS_H + 12)

  const toX = (t: number) => Math.min(END_X, LABEL_W + (t / Math.max(1, duration)) * (END_X - LABEL_W))
  const cursorX = LABEL_W + cursor * (END_X - LABEL_W)
  const cursorTime = Math.round(cursor * duration)

  const valueAt = (edges: [number, number][], t: number): number => {
    let v = edges[0][1]
    for (const [et, ev] of edges) {
      if (et <= t) v = ev
      else break
    }
    return v
  }

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0) return
    // 鼠标位置换算成 SVG 视口坐标
    const vx = ((e.clientX - rect.left) / rect.width) * VIEW_W
    // 归一化到绘图区 LABEL_W..END_X，保证基准线与鼠标严格对齐
    setCursor(Math.max(0, Math.min(1, (vx - LABEL_W) / (END_X - LABEL_W))))
  }

  return (
    <div className="my-6 rounded-lg border border-slate-700/60 bg-slate-800/30 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/60">
        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 ml-auto">在线仿真</span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
        {/* 左：编辑器 + 控制 */}
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Verilog 源码</span>
            <button
              onClick={() => run(code)}
              className="simulator-run px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              运行仿真
            </button>
          </div>

          {presets && presets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => { setCode(p.code); run(p.code) }}
                  className="text-[11px] px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-44 bg-slate-950 text-[11.5px] font-mono text-sky-200 leading-relaxed p-3 rounded-md border border-slate-700/60 focus:border-emerald-500 focus:outline-none resize-y"
          />

          {error && (
            <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md p-2">
              ⚠ {error}
            </div>
          )}

          <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">
            支持 assign / always / initial / #时延 / 非阻塞 ≤ / 拼接赋值。改代码 → 点"运行"，看波形如何变化。
          </p>
        </div>

        {/* 右：波形 */}
        <div className="p-4 overflow-x-auto">
          {!result ? (
            <div className="text-sm text-slate-500 text-center py-12">运行代码后显示波形…</div>
          ) : visible.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-12">无信号</div>
          ) : (
            <>
              {/* 游标读数条 */}
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 items-center">
                <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                  t = {cursorTime} ns
                </span>
                {visible.map(s => {
                  const v = valueAt(s.edges, cursorTime)
                  return (
                    <span key={s.name} className="text-[11px] font-mono">
                      <span className="text-slate-400">{s.name}</span>
                      <span className={`ml-1 ${v === 0 ? 'text-slate-500' : 'text-sky-300'}`}>{v}</span>
                    </span>
                  )
                })}
              </div>

              <svg
                ref={svgRef}
                viewBox={`0 0 ${VIEW_W} ${H}`}
                onMouseMove={onMove}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                className="w-full block select-none cursor-crosshair"
              >
                {/* 网格 + 时间轴 */}
                {Array.from({ length: 11 }).map((_, i) => {
                  const t = Math.round(duration * i / 10)
                  const x = toX(t)
                  return (
                    <g key={i}>
                      <line x1={x} y1={0} x2={x} y2={H - AXIS_H} stroke="#1e293b" strokeWidth={1} />
                      <text x={x} y={H - 8} textAnchor="middle" fontSize={9} fill="#475569" fontFamily="monospace">{t}</text>
                    </g>
                  )
                })}

                {/* 每行信号 */}
                {visible.map((sig, i) => {
                  const y0 = 6 + i * ROW_H
                  const mid = y0 + ROW_H / 2
                  const hi = y0 + ROW_H * 0.28
                  const lo = y0 + ROW_H * 0.72

                  // 波形路径（阶梯式）
                  let d = ''
                  sig.edges.forEach(([t, v], idx) => {
                    const x = toX(t)
                    const y = sig.width === 1 ? (v === 0 ? lo : hi) : mid
                    if (idx === 0) d += `M ${x} ${y}`
                    else {
                      const py = sig.width === 1 ? (sig.edges[idx - 1][1] === 0 ? lo : hi) : mid
                      if (py !== y) d += ` L ${x} ${py}`
                      d += ` L ${x} ${y}`
                    }
                  })
                  const lastEdge = sig.edges[sig.edges.length - 1]
                  const lastY = sig.width === 1 ? (lastEdge[1] === 0 ? lo : hi) : mid
                  if (toX(lastEdge[0]) < END_X) d += ` L ${END_X} ${lastY}`

                  return (
                    <g key={sig.name}>
                      {/* 行分隔线 */}
                      <line x1={LABEL_W} y1={mid} x2={END_X} y2={mid} stroke="#0f172a" strokeWidth={1} />
                      {/* 标签 */}
                      <text x={LABEL_W - 12} y={mid + 4} textAnchor="end" fontSize={12} fill="#94a3b8" fontFamily="monospace">
                        {sig.name}
                      </text>
                      {/* 波形 */}
                      <path d={d} fill="none" stroke={sig.width === 1 ? '#38bdf8' : '#a78bfa'} strokeWidth={sig.width === 1 ? 1.8 : 1.6} />
                      {/* 多 bit 值文本 */}
                      {sig.width > 1 && sig.edges.map(([t, v], idx) => {
                        const nextT = sig.edges[idx + 1]?.[0] ?? duration
                        const midX = (toX(t) + toX(nextT)) / 2
                        return (
                          <text key={idx} x={midX} y={mid - 8} textAnchor="middle" fontSize={10} fill="#c4b5fd" fontFamily="monospace">
                            {v}
                          </text>
                        )
                      })}
                    </g>
                  )
                })}

                {/* 游标竖线 */}
                {hover && (
                  <g>
                    <line x1={cursorX} y1={0} x2={cursorX} y2={H - AXIS_H} stroke="#fbbf24" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
                    <circle cx={cursorX} cy={4} r={3} fill="#fbbf24" />
                  </g>
                )}
              </svg>
            </>
          )}
        </div>
      </div>

      {caption && <p className="px-4 py-3 border-t border-slate-700/40 text-xs text-slate-500 leading-relaxed">{caption}</p>}
    </div>
  )
}
