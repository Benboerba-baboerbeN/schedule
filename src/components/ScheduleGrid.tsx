import type { CSSProperties } from 'react'
import CourseCard from './CourseCard'
import { weekDays } from '../data/mockSchedule'
import {
  buildTimelineMarks,
  getCourseCardScale,
  getCourseTimelinePlacement,
  isCompactCourseCard,
  isCourseInTimeRange,
  timelineRowCount,
} from '../lib/schedule'
import { ownerOrder } from '../lib/people'
import type { Course, CourseTone, PeopleNames, TimeRange } from '../types/schedule'

type ScheduleGridProps = {
  courses: Course[]
  people: PeopleNames
  timeRange: TimeRange
  onCourseClick: (course: Course) => void
}

type TimelineStyle = CSSProperties & {
  '--timeline-rows': number
}

type CoursePositionStyle = CSSProperties & {
  '--course-auto-scale': number
}

const getTone = (course: Course, courses: Course[]): CourseTone => {
  if ((course.entryType ?? 'course') === 'activity') {
    return 'activity'
  }

  const otherOwner = course.owner === 'alice' ? 'bob' : 'alice'
  const hasSharedCourse = courses.some(
    (otherCourse) =>
      otherCourse.owner === otherOwner &&
      otherCourse.day === course.day &&
      otherCourse.title === course.title &&
      otherCourse.startTime === course.startTime &&
      otherCourse.endTime === course.endTime,
  )

  return hasSharedCourse ? 'shared' : course.owner
}

const getTimelineStyle = (timeRange: TimeRange): TimelineStyle => ({
  '--timeline-rows': timelineRowCount(timeRange),
})

function TimelineAxis({ timeRange }: { timeRange: TimeRange }) {
  const timelineMarks = buildTimelineMarks(timeRange)

  return (
    <div className="time-axis" style={getTimelineStyle(timeRange)}>
      {timelineMarks.map((mark) => (
        <div
          className={[
            mark.isHour ? 'time-mark time-mark--hour' : 'time-mark',
            mark.isTerminal ? 'time-mark--terminal' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          key={mark.id}
        >
          {mark.isHour ? <strong>{mark.label}</strong> : null}
        </div>
      ))}
    </div>
  )
}

function DayTimeline({
  day,
  courses,
  timeRange,
  onCourseClick,
}: {
  day: number
  courses: Course[]
  timeRange: TimeRange
  onCourseClick: (course: Course) => void
}) {
  const dayCourses = courses.filter(
    (course) => course.day === day && isCourseInTimeRange(course, timeRange),
  )

  return (
    <div className="day-timeline" style={getTimelineStyle(timeRange)}>
      {ownerOrder.map((owner) => (
        <div className="person-lane" key={owner}>
          {dayCourses
            .filter((course) => course.owner === owner)
            .map((course) => {
              const placement = getCourseTimelinePlacement(course.startTime, course.endTime, timeRange)
              const courseStyle: CoursePositionStyle = {
                gridRow: `${placement.rowStart} / span ${placement.rowSpan}`,
                '--course-auto-scale': getCourseCardScale(placement.rowSpan),
              }
              const compact = isCompactCourseCard(placement.rowSpan)

              return (
                <div
                  className="course-position"
                  key={course.id}
                  style={courseStyle}
                >
                  <CourseCard
                    course={course}
                    tone={getTone(course, courses)}
                    showTime
                    compact={compact}
                    onClick={onCourseClick}
                  />
                </div>
              )
            })}
        </div>
      ))}
    </div>
  )
}

function ScheduleGrid({ courses, people, timeRange, onCourseClick }: ScheduleGridProps) {
  return (
    <section className="schedule-shell" aria-label={`${people.alice} 和 ${people.bob} 的课表`}>
      <div className="schedule-grid timeline-schedule">
        <div className="time-heading">
          <strong>时间</strong>
        </div>

        {weekDays.map((weekDay) => (
          <div className="day-heading" key={weekDay.day}>
            <strong>{weekDay.label}</strong>
            <div className="person-headings">
              {ownerOrder.map((owner) => (
                <span className={`person-heading person-heading--${owner}`} key={owner} title={people[owner]}>
                  <span className="person-heading__name">{people[owner]}</span>
                </span>
              ))}
            </div>
          </div>
        ))}

        <TimelineAxis timeRange={timeRange} />
        {weekDays.map((weekDay) => (
          <DayTimeline
            courses={courses}
            day={weekDay.day}
            key={weekDay.day}
            timeRange={timeRange}
            onCourseClick={onCourseClick}
          />
        ))}
      </div>
    </section>
  )
}

export default ScheduleGrid
