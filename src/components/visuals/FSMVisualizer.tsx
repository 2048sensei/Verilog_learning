import { useEffect, useState } from 'react'

// ============================================================
// FSMVisualizer — 有限状态机可视化（自动售卖机示例）
// 状态圆 + 转移箭头。点"投币"按钮 → 当前状态高亮移动、
// 转移箭头闪烁、输出信号（出货/找零）点亮。
// 纯 React + SVG，零额外依赖。
// ============================================================

export interface FSMStateSpec {
  id: string
  label: string
  x: number
  y: number
  /** 当前投入金额 */
  amount?: string
}

export interface FSMTransitionSpec {
  from: string
  to: string
  label: string
  /** 转移触发时输出（key→值） */
  outputs?: Record<string, string>
}

export interface FSMVisualizerProps {
  title: string
  states: FSMStateSpec[]
  transitions: FSMTransitionSpec[]
  /** 输入按钮 */
  inputs: { label: string; id: string; hint?: string }[]
  /** 输出信号定义 */
  outputs: { id: string; label: string; desc?: string }[]
  initial: string
  /** 状态转移函数：当前状态 + 输入id → 下一状态 */
  next: (state: string, inputId: string) => { state: string; outputs: Record<string, string> }
  caption?: string
}

export default function FSMVisualizer({
  title,
  states,
  transitions,
  inputs,
  outputs,
  initial,
  next,
  caption,
}: FSMVisualizerProps) {
  const [cur, setCur] = useState(initial)
  const [activeTrans, setActiveTrans] = useState<string | null>(null)
  const [flash, setFlash] = useState<Record<string, string>>({})
  const [history, setHistory] = useState<{ state: string; input: string }[]>([])

  useEffect(() => {
    if (!activeTrans) return
    const id = setTimeout(() => setActiveTrans(null), 700)
    return () => clearTimeout(id)
  }, [activeTrans])

  useEffect(() => {
    if (Object.keys(flash).length === 0) return
    const id = setTimeout(() => setFlash({}), 1000)
    return () => clearTimeout(id)
  }, [flash])

  const handleInput = (inputId: string) => {
    const trans = transitions.find(tr => tr.from === cur && tr.label === inputId)
    const result = next(cur, inputId)
    if (trans) setActiveTrans(`${trans.from}->${trans.to}-${trans.label}`)
    setFlash(result.outputs)
    setHistory(h => [...h.slice(-7), { state: cur, input: inputId }])
    setCur(result.state)
  }

  // 当前投入金额显示（取当前状态对应金额）
  const curState = states.find(s => s.id === cur)

  const findTrans = (from: string, to: string) =>
    transitions.filter(tr => tr.from === from && tr.to === to)

  // 计算箭头路径：两点间带曲率的贝塞尔，避免重合
  const edgePath = (from: FSMStateSpec, to: FSMStateSpec, pairIdx: number) => {
    const dy = to.y - from.y
    const mx = (from.x + to.x) / 2
    const my = (from.y + to.y) / 2
    // 同方向两条转移（如 GET15→IDLE 的出货/找零）用相反曲率分开
    const off = pairIdx === 0 ? 30 : -38
    const bend = from.x === to.x ? (dy > 0 ? off : -off) : off
    return `M ${from.x} ${from.y} Q ${mx + bend} ${my + bend} ${to.x} ${to.y}`
  }

  return (
    <div className="my-6 rounded-lg border border-slate-700/60 bg-slate-800/30 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/60">
        <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l6-6m-6 0h3a2.25 2.25 0 002.25-2.25V10m-5.25 3.5L4.5 9M12 5.25l6 6m-6-6V8a2.25 2.25 0 002.25 2.25H15m-3-5L18.75 3" />
        </svg>
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 ml-auto">状态机演示</span>
      </div>

      <div className="grid md:grid-cols-[1fr_230px]">
        {/* SVG 区域 */}
        <div className="p-4">
          <svg viewBox="0 0 620 340" className="w-full block">
            {/* 连线 */}
            {transitions.map(tr => {
              const f = states.find(s => s.id === tr.from)!
              const t = states.find(s => s.id === tr.to)!
              const samePair = findTrans(tr.from, tr.to)
              const pairIdx = samePair.indexOf(tr)
              const active = activeTrans === `${tr.from}->${tr.to}-${tr.label}`
              return (
                <g key={`${tr.from}->${tr.to}-${tr.label}`}>
                  <path
                    d={edgePath(f, t, pairIdx)}
                    fill="none"
                    stroke={active ? '#fbbf24' : '#475569'}
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeDasharray={active ? undefined : '6 4'}
                    className="transition-all duration-300"
                  />
                  {/* 箭头头 */}
                  {(() => {
                    const d = edgePath(f, t, pairIdx)
                    return (
                      <path
                        d={d}
                        fill="none"
                        stroke="none"
                      >
                        <animate attributeName="stroke-dashoffset" from="0" to="0" dur="0.01s" fill="freeze" />
                      </path>
                    )
                  })()}
                  {/* 转移标签 */}
                  <text
                    x={((f.x + t.x) / 2 + (f.x === t.x ? (t.y > f.y ? 50 : -50) : 0))}
                    y={((f.y + t.y) / 2 + (f.x === t.x ? 0 : -30) + (pairIdx > 0 ? 18 : 0))}
                    textAnchor="middle"
                    fontSize={11}
                    fill={active ? '#fbbf24' : '#64748b'}
                    fontWeight={active ? 600 : 400}
                  >
                    {tr.label}
                  </text>
                </g>
              )
            })}

            {/* 状态圆 */}
            {states.map(s => {
              const isCur = s.id === cur
              return (
                <g key={s.id}>
                  {/* 当前状态光晕 */}
                  {isCur && (
                    <circle cx={s.x} cy={s.y} r={40} fill="none" stroke="#38bdf8" strokeWidth={2} opacity={0.5}>
                      <animate attributeName="r" from="34" to="48" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={32}
                    fill={isCur ? '#0ea5e9' : '#1e293b'}
                    fillOpacity={isCur ? 0.25 : 1}
                    stroke={isCur ? '#38bdf8' : '#475569'}
                    strokeWidth={isCur ? 2.5 : 1.5}
                    className="transition-all duration-300"
                  />
                  <text x={s.x} y={s.y + (s.amount ? 2 : 5)} textAnchor="middle" fill={isCur ? '#7dd3fc' : '#94a3b8'} fontSize={12} fontWeight={isCur ? 700 : 500}>
                    {s.label}
                  </text>
                  {s.amount && (
                    <text x={s.x} y={s.y + 18} textAnchor="middle" fill="#64748b" fontSize={10}>
                      {s.amount}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* 控制面板 */}
        <div className="p-4 border-t md:border-t-0 md:border-l border-slate-700/50 space-y-4">
          {/* 当前状态 */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">当前状态</div>
            <div className="text-sm font-bold text-sky-300">{curState?.label ?? cur}</div>
            {curState?.amount && <div className="text-xs text-slate-500 mt-0.5">已投入 {curState.amount}</div>}
          </div>

          {/* 输入按钮 */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">输入操作</div>
            <div className="flex flex-col gap-2">
              {inputs.map(inp => (
                <button
                  key={inp.id}
                  onClick={() => handleInput(inp.id)}
                  className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-all hover:translate-y-[-1px] active:translate-y-0 text-left"
                >
                  {inp.label}
                  {inp.hint && <span className="block text-[10px] text-slate-500">{inp.hint}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 输出信号 */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">输出信号</div>
            <div className="space-y-1.5">
              {outputs.map(o => {
                const v = flash[o.id]
                const on = v === '1' || v === 'on'
                return (
                  <div key={o.id} className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full transition-all ${on ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`}
                    />
                    <span className="text-xs text-slate-400">{o.label}</span>
                    <span className={`ml-auto text-[10px] font-mono ${on ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {on ? (flash[o.id] === '1' ? '1' : 'on') : '0'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 历史记录 + 说明 */}
      {(history.length > 0 || caption) && (
        <div className="px-4 py-3 border-t border-slate-700/40">
          {history.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-[10px] text-slate-500 mt-0.5">操作记录:</span>
              {history.map((h, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {h.state} ─{h.input}→
                </span>
              ))}
            </div>
          )}
          {caption && <p className="text-xs text-slate-500 leading-relaxed">{caption}</p>}
        </div>
      )}
    </div>
  )
}
