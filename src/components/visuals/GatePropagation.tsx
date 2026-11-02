import { useState } from 'react'

// ============================================================
// GatePropagation — 门电路信号传播动画（1位全加器）
// 点击输入开关切换 0/1，信号沿连线逐级流过门电路，
// 每级带传播延迟动画，最终输出 So/Co 点亮。
// 纯 React + SVG，零额外依赖。
// ============================================================

type GateKind = 'and' | 'or' | 'xor'

interface GateSpec {
  id: string
  kind: GateKind
  x: number
  y: number
  /** 计算逻辑 */
  calc: (inputs: (string)[]) => string
}

interface PortSpec {
  id: string
  kind: 'input' | 'output'
  x: number
  y: number
  label: string
}

interface EdgeSpec {
  id: string
  from: string
  to: string
  /** 目标门的输入端口序号（0=上，1=下） */
  toInput: 0 | 1
}

export interface GatePropagationProps {
  title: string
  inputs: string[]
  outputs: { id: string; label: string }[]
  gates: GateSpec[]
  ports: PortSpec[]
  edges: EdgeSpec[]
  /** 每级门传播延迟 ms */
  gateDelay?: number
  caption?: string
}

// ---- 门符号 SVG path（左上角在 0,0，宽 70 高 48）----
function GateShape({ kind, color }: { kind: GateKind; color: string }) {
  if (kind === 'and') {
    return (
      <path
        d="M8,4 H34 A30,20 0 0 1 34,44 H8 Z"
        fill={color}
        fillOpacity={0.12}
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    )
  }
  if (kind === 'or') {
    return (
      <path
        d="M8,4 Q28,24 40,4 A30,20 0 0 1 40,44 Q28,24 8,44 Q20,24 8,4 Z"
        fill={color}
        fillOpacity={0.12}
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    )
  }
  // xor = or + 左侧额外弧线
  return (
    <g>
      <path
        d="M8,4 Q28,24 40,4 A30,20 0 0 1 40,44 Q28,24 8,44 Q20,24 8,4 Z"
        fill={color}
        fillOpacity={0.12}
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path
        d="M0,4 Q20,24 0,44"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
    </g>
  )
}

export default function GatePropagation({
  title,
  outputs,
  gates,
  ports,
  edges,
  gateDelay = 350,
  caption,
}: GatePropagationProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    ports.filter(p => p.kind === 'input').forEach(p => (init[p.id] = '0'))
    outputs.forEach(o => (init[o.id] = '0'))
    gates.forEach(g => (init[g.id] = '0'))
    return init
  })

  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [flashOut, setFlashOut] = useState<Record<string, boolean>>({})

  // 计算输出端口值
  const outputValue = (outId: string): string => {
    const es = edges.filter(e => e.to === outId)
    if (es.length === 0) return '0'
    const v = values[es[0].from] ?? '0'
    return v
  }

  const toggleInput = (inputId: string) => {
    if (busy) return
    const newVal = values[inputId] === '1' ? '0' : '1'
    setBusy(true)
    setActiveEdges(new Set())

    // 传播阶段：
    // 0ms  输入更新
    // +delay  一级门更新
    // +2delay 二级门更新
    // +3delay 输出更新
    const timing = setTimeout(() => {
      setValues(prev => ({ ...prev, [inputId]: newVal }))
    }, 10)

    // 按层级传播
    const levelGates = levelOrder(gates, edges)
    levelGates.forEach((g, i) => {
      setTimeout(() => {
        setValues(prev => {
          const ins = gateInputsOf(prev, edges, g.id)
          const out = g.calc(ins)
          return { ...prev, [g.id]: out }
        })
        // 点亮该门输入边
        setActiveEdges(prevEdges => {
          const next = new Set(prevEdges)
          edges.filter(e => e.to === g.id).forEach(e => next.add(e.id))
          return next
        })
      }, 10 + (i + 1) * gateDelay)
    })

    // 输出端口（output 是最后一个层级之后）
    const outLevels = outputOrder(outputs)
    outLevels.forEach((o, i) => {
      setTimeout(() => {
        setValues(prev => {
          const es = edges.filter(e => e.to === o.id)
          const v = es.length ? prev[es[0].from] ?? '0' : '0'
          return { ...prev, [o.id]: v }
        })
        setFlashOut(prev => ({ ...prev, [o.id]: true }))
        edges.filter(e => e.to === o.id).forEach(e => {
          setActiveEdges(prevEdges => new Set(prevEdges).add(e.id))
        })
      }, 10 + (levelGates.length + i + 1) * gateDelay)
    })

    // 完成
    const totalLevels = levelGates.length + outLevels.length
    setTimeout(() => {
      setActiveEdges(new Set())
      setBusy(false)
      setTimeout(() => setFlashOut({}), 500)
    }, 10 + (totalLevels + 1) * gateDelay)

    return () => clearTimeout(timing)
  }

  // 辅助：按依赖深度排序门（拓扑层级）
  const levelOrder = (gates: GateSpec[], edges: EdgeSpec[]): GateSpec[] => {
    const depth = new Map<string, number>()
    const computeDepth = (id: string): number => {
      if (depth.has(id)) return depth.get(id)!
      let d = 0
      edges.filter(e => e.to === id).forEach(e => {
        d = Math.max(d, computeDepth(e.from) + 1)
      })
      depth.set(id, d)
      return d
    }
    gates.forEach(g => computeDepth(g.id))
    return [...gates].sort((a, b) => (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0))
  }

  const gateInputsOf = (vals: Record<string, string>, edges: EdgeSpec[], gateId: string): string[] => {
    const es = edges.filter(e => e.to === gateId).sort((a, b) => a.toInput - b.toInput)
    return es.map(e => vals[e.from] ?? '0')
  }

  const outputOrder = (outputs: { id: string }[]) => [...outputs]

  // 颜色
  const colorOf = (v: string | undefined) => (v === '1' ? '#34d399' : '#475569')

  // 边端点：from 为节点输出口，to 为门输入口 / 输出端口
  const edgeEndpoints = (e: EdgeSpec) => {
    const fromNode = gates.find(g => g.id === e.from)
    const toGate = gates.find(g => g.id === e.to)
    const toPort = ports.find(p => p.id === e.to)

    let sx: number, sy: number
    if (fromNode) { sx = fromNode.x + 70; sy = fromNode.y + 24 }
    else {
      const p = ports.find(p => p.id === e.from)!
      sx = p.x + 8; sy = p.y
    }

    let tx: number, ty: number
    if (toGate) { tx = toGate.x; ty = toGate.y + (e.toInput === 0 ? 14 : 34) }
    else { tx = toPort!.x - 8; ty = toPort!.y }

    return { sx, sy, tx, ty }
  }

  const edgePath = (e: EdgeSpec) => {
    const { sx, sy, tx, ty } = edgeEndpoints(e)
    const mid = Math.max(sx + 30, (sx + tx) / 2)
    return `M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ty}, ${tx} ${ty}`
  }

  const W = 760
  const H = 400

  return (
    <div className="my-6 rounded-lg border border-slate-700/60 bg-slate-800/30 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/60">
        <svg className="w-4 h-4 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 ml-auto">信号传播</span>
      </div>

      {/* SVG 电路 */}
      <div className="p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
          {/* 连线（先画，在门下面） */}
          {edges.map(e => {
            const active = activeEdges.has(e.id)
            // 判断该线当前逻辑值
            const srcVal = values[e.from] ?? '0'
            return (
              <path
                key={e.id}
                d={edgePath(e)}
                fill="none"
                stroke={active ? '#fbbf24' : srcVal === '1' ? '#34d399' : '#334155'}
                strokeWidth={active ? 2.8 : 1.8}
                className="transition-all duration-300"
              >
                {active && <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.5s" repeatCount="indefinite" />}
              </path>
            )
          })}

          {/* 输入端口（可点击开关） */}
          {ports.filter(p => p.kind === 'input').map(p => {
            const v = values[p.id] ?? '0'
            return (
              <g key={p.id} className="cursor-pointer" onClick={() => toggleInput(p.id)}>
                <circle cx={p.x} cy={p.y} r={14} fill={v === '1' ? '#34d399' : '#1e293b'} fillOpacity={v === '1' ? 0.25 : 1} stroke={v === '1' ? '#34d399' : '#475569'} strokeWidth={2} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fill={v === '1' ? '#6ee7b7' : '#94a3b8'} fontSize={12} fontWeight={700} fontFamily="'JetBrains Mono',monospace">
                  {v}
                </text>
                <text x={p.x} y={p.y + 32} textAnchor="middle" fill="#64748b" fontSize={11}>
                  {p.label}
                </text>
              </g>
            )
          })}

          {/* 门电路 */}
          {gates.map(g => {
            const v = values[g.id] ?? '0'
            return (
              <g key={g.id} transform={`translate(${g.x}, ${g.y})`}>
                <GateShape kind={g.kind} color={colorOf(v)} />
                <text x={35} y={52} textAnchor="middle" fill={v === '1' ? '#34d399' : '#475569'} fontSize={9} fontWeight={600}>
                  {v === '1' ? '1' : '0'}
                </text>
              </g>
            )
          })}

          {/* 输出端口 */}
          {ports.filter(p => p.kind === 'output').map(p => {
            const v = outputValue(p.id)
            const on = v === '1' && (flashOut[p.id] ?? false)
            return (
              <g key={p.id}>
                <rect x={p.x - 34} y={p.y - 12} width={34} height={24} rx={4} fill="#0c1222" stroke={on ? '#34d399' : v === '1' ? '#34d399' : '#475569'} strokeWidth={1.8} />
                <text x={p.x - 17} y={p.y + 4} textAnchor="middle" fill={v === '1' ? '#6ee7b7' : '#94a3b8'} fontSize={12} fontWeight={700} fontFamily="'JetBrains Mono',monospace">
                  {v}
                </text>
                <text x={p.x + 12} y={p.y + 4} fill="#64748b" fontSize={11}>
                  {p.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* 操作提示 */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">💡 点击输入开关，观察信号如何逐级流过电路</span>
          {busy && <span className="text-xs text-amber-400 animate-pulse">信号传播中...</span>}
        </div>
        {caption && <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{caption}</p>}
      </div>
    </div>
  )
}
