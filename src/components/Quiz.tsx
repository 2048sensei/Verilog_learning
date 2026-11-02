import { useState } from 'react'

export interface QuizQuestion {
  id: string
  type: 'single' | 'multiple'
  stem: string
  options: string[]
  answer: string | string[]
  explanation: string
}

interface QuizProps {
  questions: QuizQuestion[]
  onComplete?: (score: number) => void
}

export default function Quiz({ questions, onComplete }: QuizProps) {
  const [selected, setSelected] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})

  const handleSelect = (qid: string, opt: string, type: 'single' | 'multiple') => {
    if (submitted[qid]) return
    setSelected(prev => {
      if (type === 'single') {
        return { ...prev, [qid]: opt }
      }
      const cur = (prev[qid] as string[]) || []
      const next = cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt]
      return { ...prev, [qid]: next }
    })
  }

  const handleSubmit = (qid: string) => {
    setSubmitted(prev => ({ ...prev, [qid]: true }))
    // 计算当前得分
    const allSubmitted = { ...submitted, [qid]: true }
    const score = calcScore(questions, selected, allSubmitted)
    onComplete?.(score)
  }

  const calcScore = (
    qs: QuizQuestion[],
    sel: Record<string, string | string[]>,
    sub: Record<string, boolean>
  ) => {
    let correct = 0
    qs.forEach(q => {
      if (!sub[q.id]) return
      const a = sel[q.id]
      if (!a) return
      const isCorrect = Array.isArray(q.answer)
        ? Array.isArray(a) && [...q.answer].sort().join(',') === [...a].sort().join(',')
        : a === q.answer
      if (isCorrect) correct++
    })
    return qs.length > 0 ? Math.round((correct / qs.length) * 100) : 0
  }

  const isCorrect = (q: QuizQuestion): boolean => {
    const a = selected[q.id]
    if (!a) return false
    return Array.isArray(q.answer)
      ? Array.isArray(a) && [...q.answer].sort().join(',') === [...a].sort().join(',')
      : a === q.answer
  }

  const allSubmitted = Object.keys(submitted).length === questions.length

  return (
    <div className="my-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-200">📝 练习题</h3>
        {allSubmitted && (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            得分: {calcScore(questions, selected, submitted)}%
          </span>
        )}
      </div>

      {questions.map((q, qi) => (
        <div
          key={q.id}
          className={`border rounded-lg p-4 transition-colors ${
            submitted[q.id]
              ? isCorrect(q)
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-red-500/40 bg-red-500/5'
              : 'border-slate-700 bg-slate-800/30'
          }`}
        >
          <p className="text-sm text-slate-200 font-medium mb-3">
            <span className="text-slate-500 mr-2">Q{qi + 1}.</span>
            {q.stem}
            {q.type === 'multiple' && (
              <span className="text-xs text-amber-400 ml-1">（多选）</span>
            )}
          </p>

          <div className="space-y-1.5">
            {q.options.map((opt, oi) => {
              const isSelected = Array.isArray(selected[q.id])
                ? (selected[q.id] as string[]).includes(opt)
                : selected[q.id] === opt

              const isAnswer = Array.isArray(q.answer)
                ? q.answer.includes(opt)
                : q.answer === opt

              let optClass = 'border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-200'
              if (submitted[q.id]) {
                if (isAnswer) {
                  optClass = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                } else if (isSelected && !isAnswer) {
                  optClass = 'border-red-500/60 bg-red-500/10 text-red-300'
                } else {
                  optClass = 'border-slate-700 text-slate-600'
                }
              } else if (isSelected) {
                optClass = 'border-sky-500/60 bg-sky-500/10 text-sky-300'
              }

              return (
                <button
                  key={oi}
                  onClick={() => handleSelect(q.id, opt, q.type)}
                  disabled={submitted[q.id]}
                  className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-all ${optClass} ${
                    submitted[q.id] ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span className="text-xs text-slate-600 mr-2 font-mono">
                    {String.fromCharCode(65 + oi)}.
                  </span>
                  {opt}
                  {submitted[q.id] && isAnswer && (
                    <svg className="w-4 h-4 text-emerald-400 inline ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {submitted[q.id] && isSelected && !isAnswer && (
                    <svg className="w-4 h-4 text-red-400 inline ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

          {/* 提交按钮 / 解释 */}
          {!submitted[q.id] && (
            <button
              onClick={() => handleSubmit(q.id)}
              disabled={!selected[q.id]}
              className="mt-3 text-xs px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
            >
              提交答案
            </button>
          )}
          {submitted[q.id] && (
            <div className={`mt-3 text-sm p-3 rounded-md ${
              isCorrect(q)
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-red-500/10 text-red-300'
            }`}>
              <p className="font-medium mb-1">{isCorrect(q) ? '✅ 正确！' : '❌ 不正确'}</p>
              <p>{q.explanation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
