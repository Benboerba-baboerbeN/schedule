import { describe, expect, it } from 'vitest'
import {
  createCourse,
  deleteCourse,
  upsertCourse,
  validateCourseForm,
  type CourseFormValues,
} from './courseCrud'
import type { Course } from '../types/schedule'

const baseCourse: Course = {
  id: 'course-1',
  owner: 'alice',
  title: 'Advanced Math',
  classroom: 'Room 301',
  day: 1,
  startTime: '08:00',
  endTime: '09:50',
  weekPattern: 'all',
  icon: 'book',
}

const validForm: CourseFormValues = {
  owner: 'bob',
  title: 'Physics',
  classroom: 'Lab 2',
  day: 3,
  startTime: '10:10',
  endTime: '12:00',
  weekPattern: 'odd',
}

describe('course CRUD helpers', () => {
  it('creates a course from form values with a generated id and icon', () => {
    const course = createCourse(validForm, () => 'new-id')

    expect(course).toMatchObject({
      id: 'new-id',
      owner: 'bob',
      title: 'Physics',
      classroom: 'Lab 2',
      day: 3,
      startTime: '10:10',
      endTime: '12:00',
      weekPattern: 'odd',
      icon: 'book',
    })
  })

  it('updates an existing course without changing other courses', () => {
    const updated = upsertCourse([baseCourse], {
      ...baseCourse,
      title: 'Linear Algebra',
      classroom: 'Room 202',
    })

    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({
      id: 'course-1',
      title: 'Linear Algebra',
      classroom: 'Room 202',
    })
  })

  it('deletes a course by id', () => {
    expect(deleteCourse([baseCourse], 'course-1')).toEqual([])
  })

  it('rejects empty title, invalid time order, and times outside visible range', () => {
    expect(validateCourseForm({ ...validForm, title: '' })).toContain('课程名不能为空')
    expect(validateCourseForm({ ...validForm, startTime: '12:00', endTime: '10:10' })).toContain(
      '结束时间必须晚于开始时间',
    )
    expect(validateCourseForm({ ...validForm, startTime: '07:55' })).toContain(
      '课程时间必须在 08:00 到 22:00 之间',
    )
    expect(validateCourseForm({ ...validForm, endTime: '22:05' })).toContain(
      '课程时间必须在 08:00 到 22:00 之间',
    )
  })
})
