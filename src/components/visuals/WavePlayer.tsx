import { useEffect, useRef, useState } from 'react'

// ============================================================
// WavePlayer — 时序波形播放器
// 输入一组信号（每个信号含变化点 [time, value]），带播放/暂停/
// 步进/速度控制，游标标出当前时刻，时钟上升沿有标记。
// 纯 React + SVG 实现，零额外依赖。
// ============================================================

export interface WaveSignalSpec {
  name: string
  /** [time, value] 变化点序列，value 为 '0'|'1'|'x'|'z' */
  edges: [number, string][]
}

export interface WavePlayerProps {
  title: string
  signals: WaveSignalSpec[]
  /** 波形总时长（逻辑时间单位） */
  duration: number
  /** 时钟信号名，用于高亮其上升沿 */
  clockName?: string
  /** 步进时长 */
  step?: number
  /** 说明文字 */
  caption?: string
  /** 是否在时钟上升沿画标记 */
  posedgeMark?: boolean
  /** 初始是否自动播放 */
  autoPlay?: boolean
}

// ---- 布局常量 ----
const ROW_H = 46
const LABEL_W = 100
const PAD_L = 14
const PAD_R = 30
const PAD_T = 16
const PAD_B = 26

const VAL_COLOR: Record<string, string> = {
  '0': '#64748b',
  '1': '#38bdf8',
  x: '#a78bfa',
  z: '#94a3b8',
}

const VAL_Y_OFF: Record<string, number> = {
  '0': 9,
  '1': -9,
  x: 0,
  z: 0,
}

function valueAt(edges: [number, string][], t: number): string {
  let v = edges[0]?.[1] ?? '0'
  for (const [et, ev] of edges) {
    if (et <= t) v = ev
    else break
  }
  return v
}

function findPosedges(edges: [number, string][]): number[] {
  const out: number[] = []
  let prev = edges[0]?.[1]
  for (let i = 1; i < edges.length; i++) {
    const [t, v] = edges[i]
    if (prev === '0' && v === '1') out.push(t)
    prev = v
  }
  return out
}

export default function WavePlayer({
  title,
  signals,
  duration,
  clockName,
  step = 5,
  caption,
  posedgeMark = true,
  autoPlay = true,
}: WavePlayerProps) {
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(autoPlay)
  const [speed, setSpeed] = useState(1)
  const rafRef = useRef<number>(0)
  const lastRef = useRef<number>(0)

  // 动画主循环
  useEffect(() => {
    if (!playing) return
    lastRef.current = performance.now()
    const loop = (now: number) => {
      const dt = now - lastRef.current
      lastRef.current = now
      setT(prev => {
        const next = prev + (dt / 1000) * 6 * speed
        return next >= duration ? 0 : next
      })
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed, duration])

  const W = LABEL_W + PAD_L + PAD_R + duration
  const H = PAD_T + ROW_H * signals.length + PAD_B

  const xOf = (time: number) => LABEL_W + PAD_L + time

  const posedgeTimes = clockName
    ? findPosedges(signals.find(s => s.name === clockName)?.edges ?? [])
    : posedgeMark
      ? signals.flatMap(s => findPosedges(s.edges))
      : []

  const signalRows = signals.map((s, idx) => {
    const cy = PAD_T + idx * ROW_H + ROW_H / 2

    // 生成分段 [start, end, value]
    const sorted = [...s.edges].sort((a, b) => a[0] - b[0])
    const segs: [number, number, string][] = []
    let prevT = 0
    let prevV = sorted[0]?.[1] ?? '0'
    for (const [et, ev] of sorted) {
      if (et <= prevT) {
        prevV = ev
        continue
      }
      if (et > duration) break
      segs.push([prevT, et, prevV])
      prevT = et
      prevV = ev
    }
    if (prevT < duration) segs.push([prevT, duration, prevV])

    // 波形 path（水平 + 垂直跳变）
    let d = ''
    let lastY: number | null = null
    for (const [st, et, v] of segs) {
      const y = cy + (VAL_Y_OFF[v] ?? 0)
      if (lastY !== null && Math.abs(y - lastY) > 0.5) {
        d += ` M${xOf(st).toFixed(1)},${lastY.toFixed(1)} L${xOf(st).toFixed(1)},${y.toFixed(1)}`
      }
      d += ` M${xOf(st).toFixed(1)},${y.toFixed(1)} L${xOf(et).toFixed(1)},${y.toFixed(1)}`
      lastY = y
    }

    const curVal = valueAt(s.edges, t)
    const isClock = s.name === clockName

    return {
      s,
      cy,
      d,
      curVal,
      isClock,
    }
  })

  return (
    <div className="my-6 rounded-lg border border-slate-700/60 bg-slate-800/30 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/60">
        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 ml-auto">时序动画</span>
      </div>

      {/* 波形区域 */}
      <div className="px-4 pt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ maxHeight: '420px' }}>
          {/* 水平网格线 */}
          {signals.map((_, idx) => {
            const cy = PAD_T + idx * ROW_H + ROW_H / 2
            return (
              <line
                key={idx}
                x1={LABEL_W + PAD_L}
                y1={cy}
                x2={xOf(duration)}
                y2={cy}
                stroke="#1e293b"
                strokeWidth={1}
              />
            )
          })}

          {/* posedge 标记 */}
          {posedgeTimes.map((pt, i) => (
            <g key={i}>
              <line x1={xOf(pt)} y1={PAD_T - 4} x2={xOf(pt)} y2={PAD_T + ROW_H * signals.length} stroke="#38bdf8" strokeOpacity={0.15} strokeWidth={1} />
              <path d={`M${xOf(pt) - 4},${PAD_T + 4} L${xOf(pt) + 4},${PAD_T + 4} L${xOf(pt)},${PAD_T + 10} Z`} fill="#38bdf8" fillOpacity={0.5} />
            </g>
          ))}

          {/* 信号波形 */}
          {signalRows.map(({ s, cy, d, curVal, isClock }) => (
            <g key={s.name}>
              {/* 标签 */}
              <text x={PAD_L} y={cy + 4} fill={isClock ? '#fbbf24' : '#94a3b8'} fontSize={12} fontWeight={isClock ? 600 : 400} fontFamily="'JetBrains Mono',monospace">
                {s.name}
              </text>
              {/* 当前值徽标 */}
              <rect x={LABEL_W - 26} y={cy - 8} width={18} height={16} rx={3} fill={VAL_COLOR[curVal]} fillOpacity={0.15} />
              <text x={LABEL_W - 17} y={cy + 4} fill={VAL_COLOR[curVal]} fontSize={11} textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontWeight={600}>
                {curVal}
              </text>
              {/* 波形 */}
              <path d={d} fill="none" stroke={VAL_COLOR[curVal]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {/* x/z 区域用虚线强调 */}
              {segsOf(s).filter(([, , v]) => v === 'z').map(([st, et], i) => (
                <line key={`z${i}`} x1={xOf(st)} y1={cy} x2={xOf(et)} y2={cy} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" opacity={0.6} />
              ))}
            </g>
          ))}

          {/* 游标线 */}
          <line x1={xOf(t)} y1={PAD_T - 4} x2={xOf(t)} y2={PAD_T + ROW_H * signals.length} stroke="#f1f5f9" strokeOpacity={0.7} strokeWidth={1.5} />
        </svg>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
        {/* 播放/暂停 */}
        <button
          onClick={() => setPlaying(p => !p)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-sky-600 hover:bg-sky-500 text-white transition-colors"
          title={playing ? '暂停' : '播放'}
        >
          {playing ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          ) : (
            <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        {/* 重置 */}
        <button
          onClick={() => { setPlaying(false); setT(0) }}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          title="重置"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-4.5m0-1.5h4.5m-4.5 0a6.75 6.75 0 11-5.25-6.586" />
          </svg>
        </button>
        {/* 步进 */}
        <button
          onClick={() => { setPlaying(false); setT(prev => (prev + step >= duration ? 0 : prev + step)) }}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          title="步进"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 5v14l9-7zM16 5h2v14h-2z" /></svg>
        </button>

        {/* 速度选择 */}
        <div className="flex items-center gap-1 ml-2">
          {[0.5, 1, 2, 4].map(sp => (
            <button
              key={sp}
              onClick={() => setSpeed(sp)}
              className={`text-xs px-2 py-1 rounded transition-colors ${speed === sp ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {sp}×
            </button>
          ))}
        </div>

        {/* 时间显示 */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">t = {t.toFixed(1)}</span>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={t}
            onChange={e => { setPlaying(false); setT(Number(e.target.value)) }}
            className="w-32 accent-sky-500 cursor-pointer"
          />
        </div>
      </div>

      {caption && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-700/40">
          <p className="text-xs text-slate-500 leading-relaxed">{caption}</p>
        </div>
      )}
    </div>
  )
}

// 辅助：提取某信号的 segments（供虚线 z 强调用）
function segsOf(s: WaveSignalSpec): [number, number, string][] {
  const sorted = [...s.edges].sort((a, b) => a[0] - b[0])
  const segs: [number, number, string][] = []
  let prevT = 0
  let prevV = sorted[0]?.[1] ?? '0'
  for (const [et, ev] of sorted) {
    if (et <= prevT) { prevV = ev; continue }
    segs.push([prevT, et, prevV])
    prevT = et
    prevV = ev
  }
  return segs
}
