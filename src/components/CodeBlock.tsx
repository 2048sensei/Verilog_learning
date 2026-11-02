import { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-verilog'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  highlightLines?: number[]
}

export default function CodeBlock({ code, language = 'verilog', filename, highlightLines = [] }: CodeBlockProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (ref.current) {
      Prism.highlightElement(ref.current)
    }
  }, [code, language])

  const lines = code.trim().split('\n')

  return (
    <div className="my-4 rounded-lg border border-app-border overflow-hidden">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-app-border">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-amber-500/60" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
        </div>
        {filename && (
          <span className="text-xs text-slate-500 font-mono">{filename}</span>
        )}
        <button
          onClick={() => navigator.clipboard.writeText(code.trim())}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
          title="复制代码"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制
        </button>
      </div>

      {/* 代码区域（带行号） */}
      <pre className="!rounded-none !border-0 !m-0 flex">
        {/* 行号 */}
        <div className="select-none pr-4 pl-4 py-[1.25rem] text-right text-xs text-slate-600 bg-slate-900/30 border-r border-app-border font-mono leading-[1.6]">
          {lines.map((_, i) => (
            <div
              key={i}
              className={highlightLines.includes(i + 1) ? 'text-sky-400 bg-sky-500/10 -mx-2 px-2' : ''}
            >
              {i + 1}
            </div>
          ))}
        </div>
        {/* 代码 */}
        <code ref={ref} className={`language-${language} flex-1`}>
          {code.trim()}
        </code>
      </pre>
    </div>
  )
}
