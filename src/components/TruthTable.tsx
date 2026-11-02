import { useState } from 'react'

interface TruthTableRow {
  inputs: Record<string, 0 | 1>
  output: 0 | 1
}

interface TruthTableProps {
  title: string
  inputLabels: string[]     // e.g. ['A', 'B']
  outputLabel: string        // e.g. 'Y'
  rows: TruthTableRow[]      // 完整真值表
  rowsToGuess: number[]      // 需要学生填写的行索引（从0开始）
  description?: string
  onComplete?: (score: number) => void
}

export default function TruthTable({
  title, inputLabels, outputLabel, rows, rowsToGuess, description, onComplete,
}: TruthTableProps) {
  const [guesses, setGuesses] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const isCorrect = (idx: number): boolean => {
    if (!submitted) return false
    const guess = Number(guesses[idx])
    return guess === rows[idx].output
  }

  const correctCount = rowsToGuess.filter(idx => isCorrect(idx)).length

  const handleSubmit = () => {
    if (rowsToGuess.some(idx => guesses[idx] === undefined)) return
    setSubmitted(true)
    const score = rowsToGuess.length > 0
      ? Math.round((correctCount / rowsToGuess.length) * 100)
      : 100
    onComplete?.(score)
  }

  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-200">🔲 {title}</h3>
        {submitted && (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            {correctCount}/{rowsToGuess.length} 正确
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-slate-400 mb-3">{description}</p>
      )}

      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              {inputLabels.map(l => (
                <th key={l} className="bg-slate-800 text-slate-300 px-5 py-2.5 text-center font-mono font-semibold border border-slate-600">
                  {l}
                </th>
              ))}
              <th className="bg-slate-800 text-sky-300 px-5 py-2.5 text-center font-mono font-semibold border border-slate-600">
                {outputLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const needGuess = rowsToGuess.includes(idx)
              const guess = guesses[idx]
              const correct = isCorrect(idx)

              return (
                <tr key={idx} className="transition-colors hover:bg-slate-800/30">
                  {inputLabels.map(l => (
                    <td key={l} className="px-5 py-2 text-center font-mono text-slate-300 border border-slate-700/50">
                      {row.inputs[l]}
                    </td>
                  ))}
                  <td className={`px-5 py-2 text-center font-mono border border-slate-700/50 ${
                    needGuess && !submitted ? 'bg-slate-800/50' : ''
                  }`}>
                    {needGuess ? (
                      submitted ? (
                        <span className={correct ? 'text-emerald-400' : 'text-red-400'}>
                          {guess === undefined ? '?' : guess}
                          {!correct && (
                            <span className="text-slate-500 ml-1.5">→ {row.output}</span>
                          )}
                        </span>
                      ) : (
                        <select
                          value={guess || ''}
                          onChange={e => setGuesses(prev => ({ ...prev, [idx]: e.target.value }))}
                          className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sky-300 text-center font-mono focus:border-sky-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">?</option>
                          <option value="0">0</option>
                          <option value="1">1</option>
                        </select>
                      )
                    ) : (
                      <span className="text-slate-400">{row.output}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!submitted && rowsToGuess.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={rowsToGuess.some(idx => guesses[idx] === undefined)}
          className="mt-3 text-xs px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
        >
          提交验证
        </button>
      )}
    </div>
  )
}
