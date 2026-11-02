import { useEffect, useRef, useState } from 'react'

// ============================================================
// PipelineVisualizer — 流水线数据包动画（3级流水线）
// 数据包（彩色球）每周期向前推进一级，展示：
//   - 吞吐量：每个时钟周期都能进入新数据
//   - 延迟：数据从输入到输出需要 N 个周期
// 纯 React + SVG，零额外依赖。
// ============================================================

export interface PipelineVisualizerProps {
  title: string
  /** 流水线级名称 */
  stages: string[]
  /** 输入数据序列 */
  sequence: string[]
  caption?: string
  autoPlay?: boolean
}

const STAGE_COLORS = ['#38bdf8', '#a78bfa', '#f472b6']
const STAGE_W = 120
const GAP = 90
const CY = 200

export default function PipelineVisualizer({
  title,
  stages,
  sequence,
  caption,
  autoPlay = true,
}: PipelineVisualizerProps) {
  const [cycle, setCycle] = useState(0)
  const [playing, setPlaying] = useState(autoPlay)
  const intervalRef = useRef<number>(0)

  // 总周期 = 输入序列长度 + 级数（最后一批数据流出）
  const totalCycles = sequence.length + stages.length + 1

  // 预计算每个周期各级的 snapshot
  // pipeline[pos][stageIdx] = 数据值或 null
  const snapshots: (string | null)[][] = Array.from({ length: totalCycles }, () =>
    Array(stages.length).fill(null)
  )
  // 模拟：每周期数据推进
  const queue: (string | null)[] = [null, ...sequence, null, null]
  for (let c = 0; c < totalCycles; c++) {
    const inData = queue[c] ?? null
    // 该周期进入 Stage1 的数据
    snapshots[c][0] = inData
    // 逐级传递（从上一周期）
    if (c > 0) {
      for (let s = 1; s < stages.length; s++) {
        snapshots[c][s] = snapshots[c - 1][s - 1]
      }
    }
    // 若已到最后，清空
  }

  const cur = snapshots[cycle]
  const curInput = cycle < queue.length ? queue[cycle] : null

  useEffect(() => {
    if (!playing) return
    intervalRef.current = window.setInterval(() => {
      setCycle(prev => (prev + 1) % totalCycles)
    }, 1100)
    return () => clearInterval(intervalRef.current)
  }, [playing, totalCycles])

  const W = (STAGE_W + GAP) * stages.length + GAP + 160
  const H = 400

  const dataColor = (d: string) => {
    // 根据数据值生成稳定颜色
    let h = 0
    for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) % 360
    return `hsl(${h}, 80%, 65%)`
  }

  return (
    <div className="my-6 rounded-lg border border-slate-700/60 bg-slate-800/30 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/60">
        <svg className="w-4 h-4 text-pink-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-400 ml-auto">流水线</span>
      </div>

      <div className="p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ maxHeight: '400px' }}>
          {/* 数据流方向箭头 */}
          <path d={`M ${GAP + 20} ${CY - 30} H 20`} stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={30} y={CY - 40} fill="#64748b" fontSize={11}>in</text>

          {stages.map((s, i) => {
            const x = GAP + i * (STAGE_W + GAP)
            const data = cur[i]
            const color = STAGE_COLORS[i]
            return (
              <g key={i}>
                {/* 级间寄存器 */}
                {i > 0 && (
                  <rect x={x - GAP / 2 - 7} y={CY - 55} width={14} height={110} rx={3} fill="#0c1222" stroke="#334155" strokeWidth={1.5} />
                )}
                {/* 级盒子 */}
                <rect x={x} y={CY - 45} width={STAGE_W} height={90} rx={8} fill="#0c1222" stroke={color} strokeOpacity={0.5} strokeWidth={1.5} />
                <text x={x + STAGE_W / 2} y={CY + 30} textAnchor="middle" fill="#64748b" fontSize={11}>
                  {s}
                </text>
                {/* 数据包 */}
                {data !== null && (
                  <g>
                    <circle cx={x + STAGE_W / 2} cy={CY - 5} r={16} fill={dataColor(data)} className="animate-pulse">
                      <animate attributeName="cy" from={CY - 5} to={CY - 5} dur="0.01s" />
                    </circle>
                    <text x={x + STAGE_W / 2} y={CY} textAnchor="middle" fill="#0f172a" fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono',monospace">
                      {data}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* 输出 */}
          <path d={`M ${GAP + (stages.length - 1) * (STAGE_W + GAP) + STAGE_W + 10} ${CY - 30} H ${GAP + stages.length * (STAGE_W + GAP)}`} stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={GAP + stages.length * (STAGE_W + GAP) - 8} y={CY - 40} fill="#64748b" fontSize={11} textAnchor="end">out</text>

          {/* 周期数 */}
          <text x={W / 2} y={40} textAnchor="middle" fill="#94a3b8" fontSize={14} fontWeight={600}>
            周期 #{cycle}
          </text>
          {curInput !== null && curInput !== undefined && (
            <text x={W / 2} y={60} textAnchor="middle" fill="#64748b" fontSize={11}>
              当前输入: {curInput}
            </text>
          )}
        </svg>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
        <button
          onClick={() => setPlaying(p => !p)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-sky-600 hover:bg-sky-500 text-white transition-colors"
        >
          {playing ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          ) : (
            <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <button
          onClick={() => { setPlaying(false); setCycle(0) }}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-4.5m0-1.5h4.5m-4.5 0a6.75 6.75 0 11-5.25-6.586" />
          </svg>
        </button>
        <button
          onClick={() => { setPlaying(false); setCycle(prev => (prev + 1) % totalCycles) }}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 5v14l9-7zM16 5h2v14h-2z" /></svg>
        </button>
        <span className="text-xs text-slate-500 ml-2">周期 {cycle} / {totalCycles - 1}</span>
        <input
          type="range" min={0} max={totalCycles - 1} value={cycle}
          onChange={e => { setPlaying(false); setCycle(Number(e.target.value)) }}
          className="ml-auto w-40 accent-sky-500 cursor-pointer"
        />
      </div>

      {/* 说明 */}
      {caption && (
        <div className="px-4 py-3 border-t border-slate-700/40">
          <p className="text-xs text-slate-500 leading-relaxed">{caption}</p>
        </div>
      )}
    </div>
  )
}
