/**
 * Lesson Database Queries
 * Handles all lesson-related operations
 */

import { query, queryOne } from "../db"
import type { Lesson } from "../types/lms"

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  return queryOne<Lesson>(
    `SELECT * FROM lessons WHERE id = $1`,
    [lessonId]
  )
}

export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  return query<Lesson>(
    `SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index ASC`,
    [courseId]
  )
}

export async function createLesson(
  courseId: string,
  title: string,
  content: string,
  orderIndex: number,
  duration?: number
): Promise<Lesson | null> {
  return queryOne<Lesson>(
    `INSERT INTO lessons (course_id, title, content, order_index, duration)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [courseId, title, content, orderIndex, duration]
  )
}

export async function updateLesson(
  lessonId: string,
  updates: Partial<Lesson>
): Promise<Lesson | null> {
  const setClauses: string[] = []
  const values: any[] = []
  let paramIndex = 1

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'createdAt') {
      setClauses.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    }
  })

  if (setClauses.length === 0) return getLessonById(lessonId)

  values.push(lessonId)
  const query_str = `UPDATE lessons SET ${setClauses.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`

  return queryOne<Lesson>(query_str, values)
}

export async function deleteLesson(lessonId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM lessons WHERE id = $1`,
    [lessonId]
  )
  return result.length > 0
}

export async function getLessonProgress(lessonId: string): Promise<any[]> {
  return query(
    `SELECT 
      sp.student_id,
      sp.is_completed,
      sp.completedAt,
      sp.lastAccessedAt,
      u.name as student_name,
      u.email
     FROM student_progress sp
     JOIN users u ON sp.student_id = u.id
     WHERE sp.lesson_id = $1
     ORDER BY sp.completedAt DESC`,
    [lessonId]
  )
}

export async function getLessonCompletionRate(lessonId: string): Promise<number> {
  const result = await queryOne<{ percentage: number }>(
    `SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE sp.is_completed) / 
     NULLIF(COUNT(*), 0), 2) as percentage
     FROM student_progress sp
     WHERE sp.lesson_id = $1`,
    [lessonId]
  )
  return result?.percentage || 0
}

export async function reorderLessons(lessons: { id: string; order_index: number }[]): Promise<boolean> {
  try {
    for (const lesson of lessons) {
      await query(
        `UPDATE lessons SET order_index = $1 WHERE id = $2`,
        [lesson.order_index, lesson.id]
      )
    }
    return true
  } catch {
    return false
  }
}
