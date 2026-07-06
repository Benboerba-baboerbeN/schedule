import {
  Atom,
  BookOpen,
  ChartNoAxesColumn,
  Code2,
  FlaskConical,
  Globe2,
  Heart,
  Languages,
  Monitor,
  Route,
  Users,
  Waves,
  Circle,
  Database,
  FileText,
  Lightbulb,
} from 'lucide-react'
import { getWeekPatternLabel } from '../lib/schedule'
import type { Course, CourseTone } from '../types/schedule'

const icons = {
  atom: Atom,
  book: BookOpen,
  chart: ChartNoAxesColumn,
  circle: Circle,
  code: Code2,
  database: Database,
  'file-text': FileText,
  flask: FlaskConical,
  globe: Globe2,
  heart: Heart,
  language: Languages,
  lightbulb: Lightbulb,
  monitor: Monitor,
  route: Route,
  users: Users,
  waves: Waves,
}

type CourseCardProps = {
  course: Course
  tone: CourseTone
  showTime?: boolean
  compact?: boolean
  onClick?: (course: Course) => void
}

function CourseCard({ course, tone, showTime = false, compact = false, onClick }: CourseCardProps) {
  const Icon = icons[course.icon as keyof typeof icons] ?? BookOpen
  const weekLabel = getWeekPatternLabel(course.weekPattern)

  return (
    <button
      className={[
        'course-card',
        `course-card--${tone}`,
        compact ? 'course-card--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      type="button"
      onClick={() => onClick?.(course)}
    >
      <div className="course-card__title-row">
        <h3>{course.title}</h3>
        {weekLabel ? <span className="week-badge">{weekLabel}</span> : null}
      </div>
      {showTime ? (
        <p className="course-card__time">
          {course.startTime}-{course.endTime}
        </p>
      ) : null}
      <p>{course.classroom}</p>
      {compact ? null : (
        <Icon aria-hidden="true" className="course-card__icon" size={22} strokeWidth={1.8} />
      )}
    </button>
  )
}

export default CourseCard
