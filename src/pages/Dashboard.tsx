import { Link } from 'react-router-dom'
import { chapters } from '../data/courses'
import { useProgressContext } from '../context/ProgressContext'
import ProgressBar from '../components/ProgressBar'

export default function Dashboard() {
  const { progress, isCompleted, resetProgress } = useProgressContext()

  const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)
  const completedCount = progress.completedLessons.length
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  // 最近完成的课程
  const recentCompleted = progress.completedLessons.slice(-5).reverse()

  // lessonId -> chapterId，避免「最近完成」里出现 undefined 链接
  const lessonChapter = new Map<string, string>(
    chapters.flatMap(ch => ch.lessons.map(l => [l.id, ch.id] as const))
  )

  // 平均测验分数
  const scores = Object.values(progress.quizScores)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  const handleReset = () => {
    if (window.confirm('确定要清空全部学习进度和测验分数吗？此操作不可撤销。')) {
      resetProgress()
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-100">📊 学习看板</h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            清空进度
          </button>
          <Link to="/learn" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
            继续学习 →
          </Link>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-app-card border border-slate-700/50 text-center">
          <div className="text-3xl font-bold text-sky-400 mb-1">{completedCount}</div>
          <div className="text-xs text-slate-500">已完成课程</div>
        </div>
        <div className="p-5 rounded-xl bg-app-card border border-slate-700/50 text-center">
          <div className="text-3xl font-bold text-emerald-400 mb-1">{overallPct}%</div>
          <div className="text-xs text-slate-500">总体进度</div>
        </div>
        <div className="p-5 rounded-xl bg-app-card border border-slate-700/50 text-center">
          <div className="text-3xl font-bold text-amber-400 mb-1">{avgScore ?? '--'}{avgScore !== null ? '%' : ''}</div>
          <div className="text-xs text-slate-500">平均测验分</div>
        </div>
      </div>

      {/* 总体进度条 */}
      <div className="p-5 rounded-xl bg-app-card border border-slate-700/50 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-300 font-medium">学习进度</span>
          <span className="text-sm text-sky-400">{completedCount}/{totalLessons} 节</span>
        </div>
        <ProgressBar pct={overallPct} />
      </div>

      {/* 各章节进度 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">各章节进度</h2>
        <div className="space-y-2">
          {chapters.map((ch, ci) => {
            const done = ch.lessons.filter(l => isCompleted(l.id)).length
            const pct = Math.round((done / ch.lessons.length) * 100)

            return (
              <Link
                key={ch.id}
                to={`/learn/${ch.id}`}
                className="flex items-center gap-4 p-3.5 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-sky-500/30 transition-all"
              >
                <span className="text-xs text-sky-400 font-mono w-16 text-right">
                  第{ci + 1}章
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-300 font-medium truncate">{ch.title}</div>
                  <div className="w-full h-1 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-500 w-16 text-right">{done}/{ch.lessons.length}</span>
                <span className="text-xs text-sky-400 w-10 text-right font-medium">{pct}%</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 最近完成 */}
      {recentCompleted.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">最近完成</h2>
          <div className="space-y-1">
            {recentCompleted.map(id => {
              const lesson = chapters.flatMap(ch => ch.lessons).find(l => l.id === id)
              const chapterId = lessonChapter.get(id)
              if (!lesson || !chapterId) return null
              return (
                <Link
                  key={id}
                  to={`/learn/${chapterId}/${id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/50 transition-colors text-sm"
                >
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-300">{lesson.title}</span>
                  <span className="text-xs text-slate-600 ml-auto">
                    {progress.quizScores[id] !== undefined ? `得分 ${progress.quizScores[id]}%` : '已完成'}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
