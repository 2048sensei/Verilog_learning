import { useState } from 'react'

interface FillBlankQuestion {
  id: string
  prompt: string       // 包含 ___ 占位符的提示文本
  answer: string       // 正确答案
  accept?: string[]    // 可接受的其他答案
  explanation: string
}

interface FillBlankProps {
  questions: FillBlankQuestion[]
  onComplete?: (score: number) => void
}

export default function FillBlank({ questions, onComplete }: FillBlankProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})

  const handleSubmit = (qid: string) => {
    setSubmitted(prev => ({ ...prev, [qid]: true }))
    const allSub = { ...submitted, [qid]: true }
    const score = questions.length > 0
      ? Math.round((questions.filter(q => checkAnswer(q, answers[q.id], allSub[q.id])).length / questions.length) * 100)
      : 0
    onComplete?.(score)
  }

  const checkAnswer = (q: FillBlankQuestion, userAnswer: string | undefined, isSub: boolean): boolean => {
    if (!isSub || !userAnswer) return false
    const trimmed = userAnswer.trim().toLowerCase()
    if (trimmed === q.answer.toLowerCase()) return true
    if (q.accept?.some(a => trimmed === a.toLowerCase())) return true
    return false
  }

  const isCorrect = (q: FillBlankQuestion): boolean => checkAnswer(q, answers[q.id], submitted[q.id])

  const allSubmitted = Object.keys(submitted).length === questions.length

  return (
    <div className="my-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-200">✏️ 填空题</h3>
        {allSubmitted && (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            得分: {Math.round((questions.filter(q => isCorrect(q)).length / questions.length) * 100)}%
          </span>
        )}
      </div>

      {questions.map((q, qi) => (
        <div
          key={q.id}
          className={`border rounded-lg p-4 transition-colors ${
            submitted[q.id]
              ? isCorrect(q) ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'
              : 'border-slate-700 bg-slate-800/30'
          }`}
        >
          <p className="text-sm text-slate-200 mb-3 leading-relaxed">
            <span className="text-slate-500 mr-2">Q{qi + 1}.</span>
            {q.prompt.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={e => {
                      if (submitted[q.id]) return
                      setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))
                    }}
                    disabled={submitted[q.id]}
                    className={`inline-block mx-1 px-2 py-0.5 rounded border text-sm font-mono w-32 text-center ${
                      submitted[q.id]
                        ? isCorrect(q)
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-red-500 bg-red-500/10 text-red-300'
                        : 'border-slate-500 bg-slate-800 text-sky-300 focus:border-sky-500 focus:outline-none'
                    }`}
                    placeholder="输入答案"
                  />
                )}
              </span>
            ))}
          </p>

          {!submitted[q.id] && (
            <button
              onClick={() => handleSubmit(q.id)}
              disabled={!answers[q.id]}
              className="text-xs px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
            >
              提交
            </button>
          )}
          {submitted[q.id] && (
            <p className={`text-sm mt-2 p-2 rounded ${
              isCorrect(q) ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {isCorrect(q) ? '✅' : '❌'} 答案: <code className="text-sky-300">{q.answer}</code> — {q.explanation}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
