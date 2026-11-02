import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-16 text-center">
      <p className="text-6xl font-bold text-sky-400 mb-4 font-mono">404</p>
      <h1 className="text-2xl font-bold text-slate-200 mb-3">这个页面不存在</h1>
      <p className="text-sm text-slate-500 mb-8">可能是课程链接拼写有误，或者内容已经调整。</p>
      <div className="flex items-center justify-center gap-3">
        <Link
          to="/learn"
          className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors"
        >
          返回课程目录
        </Link>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
        >
          回到首页
        </Link>
      </div>
    </div>
  )
}
