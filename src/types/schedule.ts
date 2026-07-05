export type Owner = 'alice' | 'bob'

export type PeopleNames = Record<Owner, string>

export type PeopleIds = Record<Owner, string>

export type WeekPattern = 'all' | 'odd' | 'even'

export type CourseTone = 'alice' | 'bob' | 'shared'

export type AppStyle = 'bauhaus' | 'classic' | 'paper'

export type AppFont = 'style-default' | 'system-sans' | 'serif' | 'rounded' | 'handwritten'

export type ToneColor = {
  background: string
  border: string
  text: string
  headerBackground: string
  headerText: string
}

export type ScheduleTheme = Record<CourseTone, ToneColor>

export type ColorSchemePreset = {
  id: string
  name: string
  description: string
  colors: ToneColor
}

export type Course = {
  id: string
  owner: Owner
  title: string
  classroom: string
  day: number
  startTime: string
  endTime: string
  weekPattern: WeekPattern
  icon: string
}

export type TimeSlot = {
  id: string
  startTime: string
  endTime: string
}

export type TimeRange = {
  startTime: string
  endTime: string
  stepMinutes: number
}

export type ScheduleCell = {
  day: number
  slotId: string
  aliceCourses: Course[]
  bobCourses: Course[]
  tone: CourseTone | 'empty' | 'conflict'
}
