import { Link, useParams } from 'react-router-dom'
import { chapters } from '../data/courses'
import { useProgressContext } from '../context/ProgressContext'
import LessonView from '../components/LessonView'
import ProgressBar from '../components/ProgressBar'
import NotFound from './NotFound'

export default function Course() {
  const { chapterId, lessonId } = useParams()
  // 如果没有指定课程，显示课程目录
  if (!chapterId && !lessonId) {
    return <CourseIndex />
  }

  // 查找当前章节
  const chapter = chapters.find(ch => ch.id === chapterId)

  // 如果没有指定具体课程，显示章节概览
  if (chapterId && !lessonId) {
    if (!chapter) return <NotFound />
    return <ChapterOverview chapter={chapter} />
  }

  // 查找具体课程
  if (!chapter) return <NotFound />
  const lesson = chapter.lessons.find(l => l.id === lessonId)
  if (!lesson) return <NotFound />

  // 找到上一节和下一节
  const allLessons = chapters.flatMap(ch =>
    ch.lessons.map(l => ({ ...l, chapterId: ch.id }))
  )
  const currentIndex = allLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : undefined
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : undefined

  return (
    <LessonView
      lesson={lesson}
      chapterId={chapterId!}
      prevLesson={prevLesson ? { id: prevLesson.id, title: prevLesson.title, chapterId: prevLesson.chapterId } : undefined}
      nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title, chapterId: nextLesson.chapterId } : undefined}
    />
  )
}

// ===== 课程目录页 =====
function CourseIndex() {
  const { isCompleted } = useProgressContext()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-100 mb-2">课程目录</h1>
      <p className="text-slate-400 mb-8">共 {chapters.length} 章，涵盖 Verilog 基础概念与设计思想</p>

      <div className="space-y-3">
        {chapters.map((ch, ci) => {
          const done = ch.lessons.filter(l => isCompleted(l.id)).length
          const pct = Math.round((done / ch.lessons.length) * 100)

          return (
            <Link
              key={ch.id}
              to={`/learn/${ch.id}`}
              className="block p-5 rounded-xl border border-slate-700/50 bg-app-card hover:border-sky-500/30 hover:bg-slate-800/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-sky-400 font-mono font-medium bg-sky-500/15 px-2 py-0.5 rounded">
                      第{ci + 1}章
                    </span>
                    <h2 className="text-lg font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
                      {ch.title}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">{ch.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-slate-500">{ch.lessons.length} 节课</span>
                    {done > 0 && (
                      <>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-emerald-500">{done} 已完成</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-slate-500 mb-1">{pct}%</div>
                  <ProgressBar pct={pct} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ===== 章节概览页 =====
function ChapterOverview({ chapter }: { chapter: typeof chapters[0] }) {
  const { isCompleted } = useProgressContext()
  const ci = chapters.findIndex(ch => ch.id === chapter.id)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 animate-fade-in">
      <Link to="/learn" className="text-xs text-slate-500 hover:text-sky-400 transition-colors mb-4 inline-block">
        ← 返回目录
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">第{ci + 1}章 {chapter.title}</h1>
      <p className="text-slate-400 mb-8">{chapter.description}</p>

      <div className="space-y-2">
        {chapter.lessons.map((l, li) => {
          const done = isCompleted(l.id)
          return (
            <Link
              key={l.id}
              to={`/learn/${chapter.id}/${l.id}`}
              className={`flex items-center gap-3 p-3.5 rounded-lg border transition-all ${
                done
                  ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                  : 'border-slate-700/50 bg-slate-800/30 hover:border-sky-500/30 hover:bg-slate-800/50'
              }`}
            >
              <span className="text-xs text-slate-500 font-mono w-8 text-right">{li + 1}</span>
              <div className="flex-1">
                <span className="text-sm text-slate-300">{l.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {l.type === 'quiz' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">练习</span>
                )}
                <span className="text-xs text-slate-600">{l.estimatedMinutes} 分钟</span>
                {done && (
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
