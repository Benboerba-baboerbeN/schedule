import { getCourseIcon } from './courseCrud'
import type { Course, Owner, WeekPattern } from '../types/schedule'

type ParsedIcsTime = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

const pad = (value: number) => value.toString().padStart(2, '0')

const unfoldIcsLines = (icsText: string) =>
  icsText.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)

const unescapeIcsText = (value: string) =>
  value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()

const readProperty = (lines: string[], name: string) => {
  const prefix = name.toUpperCase()
  const line = lines.find((item) => {
    const upper = item.toUpperCase()
    return upper.startsWith(`${prefix}:`) || upper.startsWith(`${prefix};`)
  })

  if (!line) {
    return ''
  }

  const valueIndex = line.indexOf(':')
  return valueIndex >= 0 ? unescapeIcsText(line.slice(valueIndex + 1)) : ''
}

const parseIcsTime = (value: string): ParsedIcsTime | null => {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/)

  if (!match) {
    return null
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] ?? '0'),
    minute: Number(match[5] ?? '0'),
  }
}

const formatTime = (time: ParsedIcsTime) => `${pad(time.hour)}:${pad(time.minute)}`

const getDayOfWeek = (time: ParsedIcsTime) => {
  const day = new Date(time.year, time.month - 1, time.day).getDay()
  return day === 0 ? 7 : day
}

const getIsoWeek = (time: ParsedIcsTime) => {
  const date = new Date(Date.UTC(time.year, time.month - 1, time.day))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

const getWeekPattern = (rrule: string, startTime: ParsedIcsTime): WeekPattern => {
  const intervalMatch = rrule.match(/(?:^|;)INTERVAL=(\d+)/i)
  const interval = intervalMatch ? Number(intervalMatch[1]) : 1

  if (!Number.isFinite(interval) || interval <= 1) {
    return 'all'
  }

  return getIsoWeek(startTime) % 2 === 0 ? 'even' : 'odd'
}

const getEventBlocks = (icsText: string) => {
  const lines = unfoldIcsLines(icsText)
  const blocks: string[][] = []
  let current: string[] | null = null

  for (const line of lines) {
    if (line.toUpperCase() === 'BEGIN:VEVENT') {
      current = []
      continue
    }

    if (line.toUpperCase() === 'END:VEVENT') {
      if (current) {
        blocks.push(current)
      }
      current = null
      continue
    }

    if (current) {
      current.push(line)
    }
  }

  return blocks
}

export const parsePlainIcsCourses = (icsText: string, owner: Owner): Course[] =>
  getEventBlocks(icsText)
    .map((lines, index): Course | null => {
      const startTime = parseIcsTime(readProperty(lines, 'DTSTART'))
      const endTime = parseIcsTime(readProperty(lines, 'DTEND'))

      if (!startTime || !endTime) {
        return null
      }

      const title = readProperty(lines, 'SUMMARY') || '未命名课程'
      const classroom = readProperty(lines, 'LOCATION')
      const uid = readProperty(lines, 'UID') || `${owner}-${index}`

      return {
        id: `${owner}-${uid}`,
        owner,
        entryType: 'course',
        title,
        classroom,
        day: getDayOfWeek(startTime),
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        weekPattern: getWeekPattern(readProperty(lines, 'RRULE'), startTime),
        icon: getCourseIcon(title),
      }
    })
    .filter((course): course is Course => Boolean(course))
