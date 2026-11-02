import { describe, expect, it } from 'vitest'
import { chapters } from '../src/data/courses'

const allLessons = chapters.flatMap(ch => ch.lessons.map(l => ({ ...l, chapterId: ch.id })))

describe('课程数据完整性', () => {
  it('包含 6 章 27 节', () => {
    expect(chapters).toHaveLength(6)
    expect(allLessons).toHaveLength(27)
  })

  it('章节与课程 id 全局唯一', () => {
    const chapterIds = chapters.map(ch => ch.id)
    expect(new Set(chapterIds).size).toBe(chapterIds.length)
    const lessonIds = allLessons.map(l => l.id)
    expect(new Set(lessonIds).size).toBe(lessonIds.length)
  })

  it('每节都有标题、类型和预计时长', () => {
    for (const lesson of allLessons) {
      expect(lesson.title.length).toBeGreaterThan(0)
      expect(['article', 'quiz', 'project']).toContain(lesson.type)
      expect(lesson.estimatedMinutes).toBeGreaterThan(0)
    }
  })

  it('每节至少包含一种可学习内容', () => {
    for (const lesson of allLessons) {
      const hasContent =
        (lesson.content?.length ?? 0) > 0 ||
        (lesson.quiz?.questions.length ?? 0) > 0 ||
        (lesson.fillBlank?.questions.length ?? 0) > 0 ||
        !!lesson.truthTable ||
        (lesson.visuals?.length ?? 0) > 0
      expect(hasContent, `${lesson.id} 没有内容`).toBe(true)
    }
  })

  it('选择题答案必须出现在选项里', () => {
    for (const lesson of allLessons) {
      for (const q of lesson.quiz?.questions ?? []) {
        expect(q.options.length, `${q.id} 选项不足`).toBeGreaterThan(1)
        const answers = Array.isArray(q.answer) ? q.answer : [q.answer]
        expect(answers.length, `${q.id} 没有答案`).toBeGreaterThan(0)
        for (const answer of answers) {
          expect(q.options, `${q.id} 的答案不在选项中`).toContain(answer)
        }
        expect(q.explanation.length, `${q.id} 缺少解析`).toBeGreaterThan(0)
      }
    }
  })

  it('填空题答案非空且包含占位符', () => {
    for (const lesson of allLessons) {
      for (const q of lesson.fillBlank?.questions ?? []) {
        expect(q.answer.trim().length, `${q.id} 答案为空`).toBeGreaterThan(0)
        expect(q.prompt, `${q.id} 缺少 ___ 占位符`).toContain('___')
        expect(q.explanation.length, `${q.id} 缺少解析`).toBeGreaterThan(0)
      }
    }
  })

  it('真值表行数与输入输出一致', () => {
    for (const lesson of allLessons) {
      const table = lesson.truthTable
      if (!table) continue
      expect(table.inputLabels.length).toBeGreaterThan(0)
      for (const row of table.rows) {
        for (const label of table.inputLabels) {
          expect([0, 1], `${lesson.id} 缺少输入 ${label}`).toContain(row.inputs[label])
        }
        expect([0, 1]).toContain(row.output)
      }
      for (const index of table.rowsToGuess) {
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThan(table.rows.length)
      }
    }
  })

  it('可视化类型合法且带有 props', () => {
    const allowed = ['wave', 'fsm', 'gate', 'pipeline', 'sim']
    for (const lesson of allLessons) {
      for (const visual of lesson.visuals ?? []) {
        expect(allowed).toContain(visual.type)
        expect(visual.props).toBeTruthy()
      }
    }
  })
})
