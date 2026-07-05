import { describe, expect, it } from 'vitest'
import {
  buildTimelineMarks,
  buildScheduleCells,
  getCourseTimelinePlacement,
  getWeekPatternLabel,
  mergeTimeSlots,
} from './schedule'
import type { Course, TimeSlot } from '../types/schedule'

const slots: TimeSlot[] = [{ id: 'morning-1', startTime: '08:00', endTime: '09:50' }]

describe('schedule rules', () => {
  it('marks same-time same-title courses as shared', () => {
    const courses: Course[] = [
      {
        id: 'a-math',
        owner: 'alice',
        title: 'Advanced Math',
        classroom: '301',
        day: 1,
        startTime: '08:00',
        endTime: '09:50',
        weekPattern: 'all',
        icon: 'book-open',
      },
      {
        id: 'b-math',
        owner: 'bob',
        title: 'Advanced Math',
        classroom: '301',
        day: 1,
        startTime: '08:00',
        endTime: '09:50',
        weekPattern: 'all',
        icon: 'book-open',
      },
    ]

    expect(buildScheduleCells(courses, slots)[0].tone).toBe('shared')
  })

  it('hides weekly labels and keeps odd-even labels visible', () => {
    expect(getWeekPatternLabel('all')).toBe('')
    expect(getWeekPatternLabel('odd')).toBe('\u5355\u5468')
    expect(getWeekPatternLabel('even')).toBe('\u53cc\u5468')
  })

  it('adds imported non-standard course times to the visible slots', () => {
    const imported: Course[] = [
      {
        id: 'imported',
        owner: 'bob',
        title: 'Project Practice',
        classroom: 'Lab',
        day: 3,
        startTime: '09:00',
        endTime: '12:00',
        weekPattern: 'all',
        icon: 'book-open',
      },
    ]

    expect(mergeTimeSlots(slots, imported)).toContainEqual({
      id: 'slot-09-00-12-00',
      startTime: '09:00',
      endTime: '12:00',
    })
  })

  it('maps course times onto five-minute timeline rows', () => {
    expect(getCourseTimelinePlacement('08:10', '09:40')).toEqual({
      rowStart: 3,
      rowSpan: 18,
    })
  })

  it('includes the 22:00 terminal label on the timeline axis', () => {
    const marks = buildTimelineMarks()

    expect(marks.at(-1)).toMatchObject({
      label: '22:00',
      isHour: true,
      isTerminal: true,
    })
  })

  it('uses custom time ranges for timeline marks and course placement', () => {
    const timeRange = { startTime: '07:30', endTime: '21:30', stepMinutes: 5 }

    expect(buildTimelineMarks(timeRange).at(0)).toMatchObject({ label: '07:30' })
    expect(buildTimelineMarks(timeRange).at(-1)).toMatchObject({
      label: '21:30',
      isTerminal: true,
    })
    expect(getCourseTimelinePlacement('08:00', '09:00', timeRange)).toEqual({
      rowStart: 7,
      rowSpan: 12,
    })
  })
})
