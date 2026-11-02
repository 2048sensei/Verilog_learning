import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ProgressBar from './ProgressBar'
import Live2DWidget from './Live2DWidget'
import { chapters } from '../data/courses'
import { useProgressContext } from '../context/ProgressContext'

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  // 课程内容页（/learn/:chapterId/:lessonId）：隐藏侧栏，整个屏幕给学习内容
  const pathSegs = location.pathname.split('/').filter(Boolean)
  const isLesson = pathSegs.length === 3 && pathSegs[0] === 'learn'

  const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)
  const { progress } = useProgressContext()
  const completedCount = progress.completedLessons.length
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  // 路由切换时回到内容顶部（滚动容器是 <main>）
  useEffect(() => {
    const scroller = document.querySelector('main')
    if (scroller) scroller.scrollTop = 0
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg">
      {/* 桌面端左侧边栏；小屏改用顶部的移动导航 */}
      {!isHome && !isLesson && (
        <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-slate-700/50 bg-app-card overflow-hidden flex-col">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-sm">
              V
            </span>
            <span className="font-semibold text-slate-200 text-sm">Verilog 学习</span>
          </Link>

          <div className="px-5 py-3 border-b border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>学习进度</span>
              <span>{completedCount}/{totalLessons} ({overallPct}%)</span>
            </div>
            <ProgressBar pct={overallPct} />
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <Sidebar />
          </nav>

          <div className="px-5 py-3 border-t border-slate-700/50">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-sky-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              学习看板
            </Link>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav completed={completedCount} total={totalLessons} pct={overallPct} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 全站看板娘（Live2D，模型缺失时自动跳过） */}
      <Live2DWidget />
    </div>
  )
}

function MobileNav({ completed, total, pct }: { completed: number; total: number; pct: number }) {
  const item = 'px-3 py-1.5 rounded-md text-xs font-medium transition-colors'
  const active = 'bg-sky-500/15 text-sky-300'
  const idle = 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'

  return (
    <nav className="lg:hidden flex items-center gap-1 px-3 py-2 border-b border-slate-700/50 bg-app-card flex-shrink-0 overflow-x-auto">
      <Link to="/" className="flex items-center gap-2 mr-2 flex-shrink-0">
        <span className="w-6 h-6 rounded-md bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xs">V</span>
        <span className="font-semibold text-slate-200 text-sm whitespace-nowrap">Verilog 学习</span>
      </Link>
      <NavLink to="/learn" className={({ isActive }) => `${item} ${isActive ? active : idle}`}>课程</NavLink>
      <NavLink to="/dashboard" className={({ isActive }) => `${item} ${isActive ? active : idle}`}>看板</NavLink>
      <span className="ml-auto text-[11px] text-slate-500 whitespace-nowrap pl-2">
        {completed}/{total} · {pct}%
      </span>
    </nav>
  )
}
