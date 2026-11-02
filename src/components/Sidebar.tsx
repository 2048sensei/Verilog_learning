import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { chapters } from '../data/courses'
import { useProgressContext } from '../context/ProgressContext'

export default function Sidebar() {
  const { chapterId, lessonId } = useParams()
  const { isCompleted } = useProgressContext()
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    () => {
      // 自动展开当前所在章节
      const init: Record<string, boolean> = {}
      chapters.forEach(ch => {
        init[ch.id] = chapterId ? ch.id === chapterId : ch.id === chapters[0].id
      })
      return init
    }
  )

  // 通过「上一节/下一节」切换章节时，自动展开新章节
  useEffect(() => {
    if (!chapterId) return
    setExpanded(prev => (prev[chapterId] ? prev : { ...prev, [chapterId]: true }))
  }, [chapterId])

  const toggle = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <ul className="space-y-0.5">
      {chapters.map(ch => (
        <li key={ch.id}>
          {/* 章节标题 */}
          <button
            onClick={() => toggle(ch.id)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-app-hover transition-colors group"
          >
            <svg
              className={`w-3.5 h-3.5 text-slate-500 transition-transform ${expanded[ch.id] ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex-1">
              {ch.title}
            </span>
            <span className="text-[10px] text-slate-600">
              {ch.lessons.filter(l => isCompleted(l.id)).length}/{ch.lessons.length}
            </span>
          </button>

          {/* 课程列表 */}
          {expanded[ch.id] && (
            <ul className="ml-3 mt-0.5 mb-1 space-y-0.5">
              {ch.lessons.map(l => {
                const done = isCompleted(l.id)
                const active = lessonId === l.id
                return (
                  <li key={l.id}>
                    <Link
                      to={`/learn/${ch.id}/${l.id}`}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        active
                          ? 'bg-sky-500/15 text-sky-300 font-medium'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-app-hover'
                      }`}
                    >
                      {/* 状态图标 */}
                      {done ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="w-3.5 h-3.5 flex-shrink-0 rounded-full border border-slate-600" />
                      )}
                      <span className="truncate">{l.title}</span>
                      {l.type === 'quiz' && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 flex-shrink-0">测</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}
