import { timeToMinutes, timelineEndMinutes, timelineStartMinutes } from './schedule'
import type { Course, Owner, WeekPattern } from '../types/schedule'

export type CourseFormValues = {
  owner: Owner
  title: string
  classroom: string
  day: number
  startTime: string
  endTime: string
  weekPattern: WeekPattern
}

const iconRules = [
  { keyword: '数学', icon: 'book' },
  { keyword: '英语', icon: 'language' },
  { keyword: '物理', icon: 'atom' },
  { keyword: '实验', icon: 'flask' },
  { keyword: '计算机', icon: 'monitor' },
  { keyword: '数据', icon: 'code' },
  { keyword: '网络', icon: 'globe' },
  { keyword: '心理', icon: 'heart' },
  { keyword: '团队', icon: 'users' },
  { keyword: '信号', icon: 'waves' },
]

export const getCourseIcon = (title: string) =>
  iconRules.find((rule) => title.includes(rule.keyword))?.icon ?? 'book'

export const validateCourseForm = (values: CourseFormValues) => {
  const errors: string[] = []
  const start = timeToMinutes(values.startTime)
  const end = timeToMinutes(values.endTime)

  if (!values.title.trim()) {
    errors.push('课程名不能为空')
  }

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    errors.push('结束时间必须晚于开始时间')
  }

  if (start < timelineStartMinutes || end > timelineEndMinutes) {
    errors.push('课程时间必须在 08:00 到 22:00 之间')
  }

  return errors
}

export const createCourse = (
  values: CourseFormValues,
  createId = () => `course-${Date.now()}`,
): Course => ({
  id: createId(),
  owner: values.owner,
  title: values.title.trim(),
  classroom: values.classroom.trim(),
  day: values.day,
  startTime: values.startTime,
  endTime: values.endTime,
  weekPattern: values.weekPattern,
  icon: getCourseIcon(values.title),
})

export const upsertCourse = (courses: Course[], course: Course) => {
  const exists = courses.some((item) => item.id === course.id)

  if (!exists) {
    return [...courses, course]
  }

  return courses.map((item) => (item.id === course.id ? course : item))
}

export const deleteCourse = (courses: Course[], courseId: string) =>
  courses.filter((course) => course.id !== courseId)
