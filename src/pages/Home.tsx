import { Link } from 'react-router-dom'
import { chapters } from '../data/courses'
import { useProgressContext } from '../context/ProgressContext'
import ProgressBar from '../components/ProgressBar'

export default function Home() {
  const { progress } = useProgressContext()
  const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)
  const completedCount = progress.completedLessons.length
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      {/* Logo 区 */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-sky-500/15 mb-6">
          <span className="text-4xl font-bold text-sky-400 font-mono">V</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-100 mb-3">
          Verilog 交互学习
        </h1>
        <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
          从零开始学习硬件描述语言（HDL），掌握数字电路设计的基础概念与设计思想
        </p>
      </div>

      {/* 进度概览 */}
      {completedCount > 0 && (
        <div className="w-full max-w-md mb-10 p-5 rounded-xl bg-app-card border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">学习进度</span>
            <span className="text-sm text-sky-400 font-medium">{completedCount}/{totalLessons} ({pct}%)</span>
          </div>
          <ProgressBar pct={pct} />
          <Link
            to="/dashboard"
            className="inline-block mt-3 text-xs text-slate-500 hover:text-sky-400 transition-colors"
          >
            查看学习看板 →
          </Link>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-4 mb-16">
        <Link
          to="/learn"
          className="px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-sky-500/20"
        >
          开始学习
        </Link>
        <Link
          to="/dashboard"
          className="px-8 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-all"
        >
          学习看板
        </Link>
      </div>

      {/* 课程特色 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
        {[
          {
            icon: '📖',
            title: '27 节精选课程',
            desc: '覆盖基础概念与设计思想，从语法到状态机，步步为营',
          },
          {
            icon: '🎬',
            title: '动态原理演示',
            desc: '波形播放器、状态机模拟、门电路传播动画，让抽象概念"动"起来',
          },
          {
            icon: '✏️',
            title: '交互式练习',
            desc: '选择题、填空题、真值表填空，即时反馈，边学边练',
          },
        ].map((feat, i) => (
          <div key={i} className="p-5 rounded-xl bg-app-card border border-slate-700/50 text-center">
            <div className="text-2xl mb-2">{feat.icon}</div>
            <h3 className="font-semibold text-slate-200 mb-1">{feat.title}</h3>
            <p className="text-sm text-slate-400">{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* 来源说明 */}
      <p className="mt-16 text-xs text-slate-600 text-center max-w-md leading-relaxed">
        教材内容整理自{' '}
        <a href="https://www.runoob.com/w3cnote/verilog-tutorial.html" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
          菜鸟教程 Verilog 教程
        </a>
        ，交互形式参考{' '}
        <a href="https://hdlbits.01xz.net/" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">HDLBits</a>
        {' '}和{' '}
        <a href="https://siliconladder.com/" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">Silicon Ladder</a>
      </p>
    </div>
  )
}
