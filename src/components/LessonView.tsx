import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Lesson } from '../data/courses'
import { useProgressContext } from '../context/ProgressContext'
import CodeBlock from './CodeBlock'
import Quiz from './Quiz'
import FillBlank from './FillBlank'
import TruthTable from './TruthTable'
import { WavePlayer, FSMVisualizer, GatePropagation, PipelineVisualizer, VerilogSimulator } from './visuals'

interface LessonViewProps {
  lesson: Lesson
  chapterId: string
  prevLesson?: { id: string; title: string; chapterId: string }
  nextLesson?: { id: string; title: string; chapterId: string }
}

export default function LessonView({ lesson, chapterId, prevLesson, nextLesson }: LessonViewProps) {
  const { markComplete, isCompleted, markQuizScore } = useProgressContext()
  const completed = isCompleted(lesson.id)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [lesson.id])

  const handleComplete = () => {
    markComplete(lesson.id)
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-8 py-8 animate-fade-in">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:text-sky-400 transition-colors">首页</Link>
        <span>/</span>
        <Link to="/learn" className="hover:text-sky-400 transition-colors">课程目录</Link>
        <span>/</span>
        <Link to={`/learn/${chapterId}`} className="hover:text-sky-400 transition-colors">
          第{parseInt(chapterId.replace(/\D/g, ''), 10)}章
        </Link>
        <span>/</span>
        <span className="text-slate-400">{lesson.title}</span>
      </nav>

      {/* 标题区 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            lesson.type === 'article' ? 'bg-sky-500/20 text-sky-400' :
            lesson.type === 'quiz' ? 'bg-amber-500/20 text-amber-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {lesson.type === 'article' ? '📖 教程' : lesson.type === 'quiz' ? '📝 练习' : '🔬 实验'}
          </span>
          {completed && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              ✅ 已完成
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-slate-100">{lesson.title}</h1>
        {lesson.estimatedMinutes && (
          <p className="text-sm text-slate-500 mt-1">预计学习时间: {lesson.estimatedMinutes} 分钟</p>
        )}
      </div>

      {/* 双栏布局：左列读文字，右列随读仿真/代码（桌面端 sticky 常驻） */}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] xl:gap-8 xl:items-start">
        {/* 正文内容 */}
        <div className="lesson-content min-w-0 xl:col-start-1">
          {lesson.content && (
            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
          )}
        </div>

        {/* 右侧随读栏：代码示例 + 可视化仿真 */}
        {((lesson.codeExamples?.length ?? 0) > 0 || (lesson.visuals?.length ?? 0) > 0) && (
          <div className="min-w-0 xl:col-start-2 xl:row-start-1 xl:row-span-full xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1 space-y-4 mt-2 xl:mt-0">
            {lesson.visuals && lesson.visuals.length > 0 && (
              <div className="space-y-4">
                {lesson.visuals.map((v, i) => {
                  if (v.type === 'wave') return <WavePlayer key={i} {...v.props} />
                  if (v.type === 'fsm') return <FSMVisualizer key={i} {...v.props} />
                  if (v.type === 'gate') return <GatePropagation key={i} {...v.props} />
                  if (v.type === 'pipeline') return <PipelineVisualizer key={i} {...v.props} />
                  if (v.type === 'sim') return <VerilogSimulator key={i} {...v.props} />
                  return null
                })}
              </div>
            )}

            {lesson.codeExamples?.map((ex, i) => (
              <div key={`code-${i}`}>
                {ex.caption && (
                  <p className="text-sm text-slate-400 mb-1">{ex.caption}</p>
                )}
                <CodeBlock
                  code={ex.code}
                  language="verilog"
                  filename={ex.filename}
                  highlightLines={ex.highlightLines}
                />
              </div>
            ))}
          </div>
        )}

        {/* 提示信息 */}
        {lesson.infoBoxes?.map((box, i) => (
          <div key={i} className={`info-box min-w-0 xl:col-start-1 ${box.type}`}>
            <p className="font-medium mb-1">
              {box.type === 'tip' ? '💡 提示' : box.type === 'warning' ? '⚠️ 注意' : '🚫 警告'}
            </p>
            <div dangerouslySetInnerHTML={{ __html: box.content }} />
          </div>
        ))}

        {/* 概念对比表格 */}
        {lesson.compareTable && (
          <div className="lesson-content min-w-0 xl:col-start-1 my-6">
            <h4 className="text-lg font-medium text-slate-200 mb-3">{lesson.compareTable.title}</h4>
            <table>
              <thead>
                <tr>
                  {lesson.compareTable.headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lesson.compareTable.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 练习题 */}
        {lesson.quiz?.questions && lesson.quiz.questions.length > 0 && (
          <div className="min-w-0 xl:col-start-1">
            <Quiz
              questions={lesson.quiz.questions}
              onComplete={(score) => {
                markQuizScore(lesson.id, score)
                if (score >= 60) markComplete(lesson.id)
              }}
            />
          </div>
        )}

        {/* 填空题 */}
        {lesson.fillBlank?.questions && lesson.fillBlank.questions.length > 0 && (
          <div className="min-w-0 xl:col-start-1">
            <FillBlank
              questions={lesson.fillBlank.questions}
              onComplete={(score) => {
                markQuizScore(lesson.id, score)
                if (score >= 60) markComplete(lesson.id)
              }}
            />
          </div>
        )}

        {/* 真值表 */}
        {lesson.truthTable && (
          <div className="min-w-0 xl:col-start-1">
            <TruthTable {...lesson.truthTable} />
          </div>
        )}

        {/* 完成标记按钮 */}
        <div className="min-w-0 xl:col-start-1 mt-10 pt-6 border-t border-slate-700/50">
          {!completed ? (
            <button
              onClick={handleComplete}
              className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              标记为已完成
            </button>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">本节已完成</span>
            </div>
          )}
        </div>

        {/* 上下页导航 */}
        <div className="min-w-0 xl:col-start-1 mt-8 flex items-center justify-between">
          {prevLesson ? (
            <Link
              to={`/learn/${prevLesson.chapterId}/${prevLesson.id}`}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <div>
                <div className="text-xs text-slate-600">上一节</div>
                <div className="font-medium">{prevLesson.title}</div>
              </div>
            </Link>
          ) : <div />}

          {nextLesson ? (
            <Link
              to={`/learn/${nextLesson.chapterId}/${nextLesson.id}`}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors text-right group"
            >
              <div>
                <div className="text-xs text-slate-600">下一节</div>
                <div className="font-medium">{nextLesson.title}</div>
              </div>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  )
}
