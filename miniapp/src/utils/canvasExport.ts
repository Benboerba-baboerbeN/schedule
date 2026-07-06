import Taro from '@tarojs/taro'
import { weekDays } from '@shared/data/mockSchedule'
import { createExportImageMetrics } from '@shared/lib/exportImageMetrics'
import { getCourseTimelinePlacement, isCourseInTimeRange } from '@shared/lib/schedule'
import { ownerOrder } from '@shared/lib/people'
import type { Course, CourseTone, PeopleNames, ScheduleTheme, TimeRange } from '@shared/types/schedule'

type ExportCanvasInput = {
  canvasId: string
  courses: Course[]
  people: PeopleNames
  theme: ScheduleTheme
  timeRange: TimeRange
  ratio: number | null
}

const subjectWidth = 1360
const padding = 48
const timeWidth = 92
const dayWidth = 180
const headerHeight = 88
const timelinePadding = 28
const defaultRowHeight = 8

const splitText = (text: string, maxChars: number) => {
  const chunks: string[] = []

  for (let index = 0; index < text.length; index += maxChars) {
    chunks.push(text.slice(index, index + maxChars))
  }

  return chunks.slice(0, 2)
}

const getCourseTone = (course: Course, courses: Course[]): CourseTone => {
  if ((course.entryType ?? 'course') === 'activity') {
    return 'activity'
  }

  const otherOwner = course.owner === 'alice' ? 'bob' : 'alice'
  const isShared = courses.some((otherCourse) =>
    otherCourse.owner === otherOwner &&
    otherCourse.day === course.day &&
    otherCourse.title === course.title &&
    otherCourse.startTime === course.startTime &&
    otherCourse.endTime === course.endTime,
  )

  return isShared ? 'shared' : course.owner
}

export const exportScheduleCanvas = async ({
  canvasId,
  courses,
  people,
  theme,
  timeRange,
  ratio,
}: ExportCanvasInput) => {
  const metrics = createExportImageMetrics({
    subjectWidth,
    ratio,
    timeRange,
    headerHeight,
    timelinePadding,
    defaultRowHeight,
  })
  const width = subjectWidth + padding * 2
  const height = metrics.subjectHeight + padding * 2
  const ctx = Taro.createCanvasContext(canvasId)
  const timelineTop = padding + headerHeight
  const timelineHeight = metrics.rowCount * metrics.rowHeight

  ctx.setFillStyle('#f8f3e4')
  ctx.fillRect(0, 0, width, height)
  ctx.setFillStyle('#fffdf4')
  ctx.fillRect(padding, padding, subjectWidth, metrics.subjectHeight)
  ctx.setStrokeStyle('#141414')
  ctx.setLineWidth(3)
  ctx.strokeRect(padding, padding, subjectWidth, metrics.subjectHeight)

  ctx.setFontSize(22)
  ctx.setFillStyle('#141414')
  ctx.setTextAlign('center')
  ctx.fillText('时间', padding + timeWidth / 2, padding + 50)

  weekDays.forEach((weekDay, index) => {
    const x = padding + timeWidth + index * dayWidth
    ctx.setStrokeStyle('#141414')
    ctx.strokeRect(x, padding, dayWidth, headerHeight)
    ctx.setFontSize(24)
    ctx.setFillStyle('#141414')
    ctx.fillText(weekDay.label, x + dayWidth / 2, padding + 28)

    ownerOrder.forEach((owner, ownerIndex) => {
      const laneX = x + ownerIndex * (dayWidth / 2)
      ctx.setFillStyle(owner === 'alice' ? theme.alice.headerBackground : theme.bob.headerBackground)
      ctx.fillRect(laneX, padding + 42, dayWidth / 2, 42)
      ctx.setFillStyle(owner === 'alice' ? theme.alice.headerText : theme.bob.headerText)
      ctx.setFontSize(18)
      ctx.fillText(people[owner].slice(0, 5), laneX + dayWidth / 4, padding + 68)
    })
  })

  for (let row = 0; row <= metrics.rowCount; row += 1) {
    const y = timelineTop + row * metrics.rowHeight
    const minute = row * timeRange.stepMinutes
    const isHour = minute % 60 === 0
    ctx.setStrokeStyle(isHour ? '#141414' : '#d8d1c5')
    ctx.setLineWidth(isHour ? 1.5 : 0.5)
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(padding + subjectWidth, y)
    ctx.stroke()

    if (isHour) {
      const totalMinutes = Number(timeRange.startTime.slice(0, 2)) * 60 + minute
      const hour = Math.floor(totalMinutes / 60).toString().padStart(2, '0')
      ctx.setFontSize(18)
      ctx.setFillStyle('#141414')
      ctx.fillText(`${hour}:00`, padding + timeWidth / 2, y + 6)
    }
  }

  weekDays.forEach((weekDay, dayIndex) => {
    const dayCourses = courses.filter((course) => course.day === weekDay.day && isCourseInTimeRange(course, timeRange))

    ownerOrder.forEach((owner, ownerIndex) => {
      const laneWidth = dayWidth / 2
      const laneX = padding + timeWidth + dayIndex * dayWidth + ownerIndex * laneWidth

      ctx.setStrokeStyle('#141414')
      ctx.setLineWidth(ownerIndex === 0 ? 2 : 0.8)
      ctx.strokeRect(laneX, timelineTop, laneWidth, timelineHeight)

      dayCourses
        .filter((course) => course.owner === owner)
        .forEach((course) => {
          const placement = getCourseTimelinePlacement(course.startTime, course.endTime, timeRange)
          const top = timelineTop + (placement.rowStart - 1) * metrics.rowHeight + 4
          const cardHeight = Math.max(18, placement.rowSpan * metrics.rowHeight - 8)
          const tone = theme[getCourseTone(course, courses)]
          const fontSize = Math.max(9, 16 * metrics.courseScale)
          const detailSize = Math.max(8, 13 * metrics.courseScale)

          ctx.setFillStyle(tone.background)
          ctx.setStrokeStyle(tone.border)
          ctx.setLineWidth(1)
          ctx.fillRect(laneX + 4, top, laneWidth - 8, cardHeight)
          ctx.strokeRect(laneX + 4, top, laneWidth - 8, cardHeight)
          ctx.setTextAlign('center')
          ctx.setFillStyle(tone.text)
          ctx.setFontSize(fontSize)
          splitText(course.title, 6).forEach((line, lineIndex) => {
            ctx.fillText(line, laneX + laneWidth / 2, top + 18 + lineIndex * (fontSize + 1))
          })
          ctx.setFontSize(detailSize)
          ctx.fillText(`${course.startTime}-${course.endTime}`, laneX + laneWidth / 2, top + cardHeight - detailSize - 8)
          ctx.fillText(course.classroom.slice(0, 8), laneX + laneWidth / 2, top + cardHeight - 6)
        })
    })
  })

  await new Promise<void>((resolve) => ctx.draw(false, () => resolve()))

  return new Promise<string>((resolve, reject) => {
    Taro.canvasToTempFilePath({
      canvasId,
      width,
      height,
      destWidth: width * 2,
      destHeight: height * 2,
      success: (result) => resolve(result.tempFilePath),
      fail: reject,
    })
  })
}
