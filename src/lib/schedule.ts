import type { Course, ScheduleCell, TimeRange, TimeSlot, WeekPattern } from '../types/schedule'

export const timelineStartMinutes = 8 * 60
export const timelineEndMinutes = 22 * 60
export const timelineStepMinutes = 5

export const defaultTimeRange: TimeRange = {
  startTime: '08:00',
  endTime: '22:00',
  stepMinutes: timelineStepMinutes,
}

export const timelineRowCount = (timeRange: TimeRange = defaultTimeRange) =>
  (timeToMinutes(timeRange.endTime) - timeToMinutes(timeRange.startTime)) / timeRange.stepMinutes

export const getWeekPatternLabel = (pattern: WeekPattern) => {
  if (pattern === 'odd') {
    return '\u5355\u5468'
  }

  if (pattern === 'even') {
    return '\u53cc\u5468'
  }

  return ''
}

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const getCourseTimelinePlacement = (
  startTime: string,
  endTime: string,
  timeRange: TimeRange = defaultTimeRange,
) => {
  const rangeStart = timeToMinutes(timeRange.startTime)
  const rangeEnd = timeToMinutes(timeRange.endTime)
  const startOffset = Math.max(0, timeToMinutes(startTime) - rangeStart)
  const endOffset = Math.min(rangeEnd - rangeStart, timeToMinutes(endTime) - rangeStart)
  const rowStart = Math.floor(startOffset / timeRange.stepMinutes) + 1
  const rowSpan = Math.max(1, Math.ceil((endOffset - startOffset) / timeRange.stepMinutes))

  return { rowStart, rowSpan }
}

export const buildTimelineMarks = (timeRange: TimeRange = defaultTimeRange) =>
  Array.from({ length: timelineRowCount(timeRange) + 1 }, (_, index) => {
    const rowCount = timelineRowCount(timeRange)
    const totalMinutes = timeToMinutes(timeRange.startTime) + index * timeRange.stepMinutes
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return {
      id: `mark-${hours}-${minutes}`,
      label: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      minuteLabel: minutes.toString().padStart(2, '0'),
      isHour: minutes === 0,
      isTerminal: index === rowCount,
    }
  })

export const isCourseInTimeRange = (course: Course, timeRange: TimeRange = defaultTimeRange) => {
  const courseStart = timeToMinutes(course.startTime)
  const courseEnd = timeToMinutes(course.endTime)
  const rangeStart = timeToMinutes(timeRange.startTime)
  const rangeEnd = timeToMinutes(timeRange.endTime)

  return courseEnd > rangeStart && courseStart < rangeEnd
}

const isSameCourse = (aliceCourses: Course[], bobCourses: Course[]) => {
  if (aliceCourses.length === 0 || bobCourses.length === 0) {
    return false
  }

  return aliceCourses.some((aliceCourse) =>
    bobCourses.some((bobCourse) => aliceCourse.title === bobCourse.title),
  )
}

export const buildScheduleCells = (courses: Course[], timeSlots: TimeSlot[]) => {
  const cells: ScheduleCell[] = []

  for (let day = 1; day <= 7; day += 1) {
    for (const slot of timeSlots) {
      const matchingCourses = courses.filter(
        (course) =>
          course.day === day &&
          course.startTime === slot.startTime &&
          course.endTime === slot.endTime,
      )
      const aliceCourses = matchingCourses.filter((course) => course.owner === 'alice')
      const bobCourses = matchingCourses.filter((course) => course.owner === 'bob')

      let tone: ScheduleCell['tone'] = 'empty'

      if (isSameCourse(aliceCourses, bobCourses)) {
        tone = 'shared'
      } else if (aliceCourses.length > 0 && bobCourses.length > 0) {
        tone = 'conflict'
      } else if (aliceCourses.length > 0) {
        tone = 'alice'
      } else if (bobCourses.length > 0) {
        tone = 'bob'
      }

      cells.push({
        day,
        slotId: slot.id,
        aliceCourses,
        bobCourses,
        tone,
      })
    }
  }

  return cells
}

export const findSharedCourses = (cells: ScheduleCell[]) =>
  cells
    .filter((cell) => cell.tone === 'shared')
    .map((cell) => ({
      day: cell.day,
      slotId: cell.slotId,
      course: cell.aliceCourses.find((aliceCourse) =>
        cell.bobCourses.some((bobCourse) => bobCourse.title === aliceCourse.title),
      ),
    }))
    .filter((item): item is { day: number; slotId: string; course: Course } => Boolean(item.course))

const toSlotId = (startTime: string, endTime: string) =>
  `slot-${startTime.replace(':', '-')}-${endTime.replace(':', '-')}`

export const mergeTimeSlots = (baseSlots: TimeSlot[], courses: Course[]) => {
  const slotMap = new Map<string, TimeSlot>()

  for (const slot of baseSlots) {
    slotMap.set(`${slot.startTime}-${slot.endTime}`, slot)
  }

  for (const course of courses) {
    const key = `${course.startTime}-${course.endTime}`

    if (!slotMap.has(key)) {
      slotMap.set(key, {
        id: toSlotId(course.startTime, course.endTime),
        startTime: course.startTime,
        endTime: course.endTime,
      })
    }
  }

  return [...slotMap.values()].sort((first, second) =>
    first.startTime.localeCompare(second.startTime),
  )
}
