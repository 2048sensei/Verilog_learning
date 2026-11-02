import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'

export interface Progress {
  completedLessons: string[]
  quizScores: Record<string, number>
  lastVisit: string | null
}

interface ProgressContextType {
  progress: Progress
  markComplete: (lessonId: string) => void
  markQuizScore: (lessonId: string, score: number) => void
  isCompleted: (lessonId: string) => boolean
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressContextType | null>(null)

const STORAGE_KEY = 'verilog-learn-progress'

const EMPTY: Progress = { completedLessons: [], quizScores: {}, lastVisit: null }

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<Progress> | null
    if (!parsed || !Array.isArray(parsed.completedLessons)) return { ...EMPTY }
    return {
      completedLessons: parsed.completedLessons.filter((id): id is string => typeof id === 'string'),
      quizScores: parsed.quizScores && typeof parsed.quizScores === 'object' ? parsed.quizScores : {},
      lastVisit: typeof parsed.lastVisit === 'string' ? parsed.lastVisit : null,
    }
  } catch {
    // 隐私模式 / 数据损坏：回到空进度，不影响页面
    return { ...EMPTY }
  }
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // 存储不可用时静默降级：本次会话仍可正常使用
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(loadProgress)

  // 首次加载时记录访问时间
  useEffect(() => {
    setProgress(prev => {
      const next = { ...prev, lastVisit: new Date().toISOString() }
      saveProgress(next)
      return next
    })
  }, [])

  const markComplete = useCallback((lessonId: string) => {
    setProgress(prev => {
      if (prev.completedLessons.includes(lessonId)) return prev
      const next = {
        ...prev,
        completedLessons: [...prev.completedLessons, lessonId],
        lastVisit: new Date().toISOString(),
      }
      saveProgress(next)
      return next
    })
  }, [])

  const markQuizScore = useCallback((lessonId: string, score: number) => {
    setProgress(prev => {
      const next = {
        ...prev,
        quizScores: { ...prev.quizScores, [lessonId]: score },
        lastVisit: new Date().toISOString(),
      }
      saveProgress(next)
      return next
    })
  }, [])

  const isCompleted = useCallback((lessonId: string) => {
    return progress.completedLessons.includes(lessonId)
  }, [progress.completedLessons])

  const resetProgress = useCallback(() => {
    const next = { ...EMPTY, lastVisit: new Date().toISOString() }
    saveProgress(next)
    setProgress(next)
  }, [])

  return (
    <ProgressContext.Provider value={{ progress, markComplete, markQuizScore, isCompleted, resetProgress }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgressContext() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgressContext must be used within ProgressProvider')
  return ctx
}
