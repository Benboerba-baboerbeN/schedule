import ICAL from 'ical.js'
import type { Course, Owner, WeekPattern } from '../types/schedule'

type IcalTime = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

const iconByTitle = [
  { keyword: '\u6570\u5b66', icon: 'book' },
  { keyword: '\u82f1\u8bed', icon: 'language' },
  { keyword: '\u8ba1\u7b97\u673a', icon: 'monitor' },
  { keyword: '\u7269\u7406', icon: 'atom' },
  { keyword: '\u5b9e\u9a8c', icon: 'flask' },
  { keyword: '\u7f51\u7edc', icon: 'globe' },
  { keyword: '\u4fe1\u53f7', icon: 'waves' },
  { keyword: '\u5fc3\u7406', icon: 'heart' },
  { keyword: '\u56e2\u961f', icon: 'users' },
  { keyword: '\u6570\u636e', icon: 'code' },
  { keyword: '\u7bee\u7403', icon: 'circle' },
]

const pad = (value: number) => value.toString().padStart(2, '0')

const formatTime = (time: IcalTime) => `${pad(time.hour)}:${pad(time.minute)}`

const getDayOfWeek = (time: IcalTime) => {
  const day = new Date(time.year, time.month - 1, time.day).getDay()
  return day === 0 ? 7 : day
}

const getIsoWeek = (time: IcalTime) => {
  const date = new Date(Date.UTC(time.year, time.month - 1, time.day))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

const getWeekPattern = (event: ICAL.Event, startTime: IcalTime): WeekPattern => {
  const rrule = event.component.getFirstPropertyValue('rrule') as { interval?: number } | null

  if (!rrule || !rrule.interval || rrule.interval === 1) {
    return 'all'
  }

  return getIsoWeek(startTime) % 2 === 0 ? 'even' : 'odd'
}

const getIcon = (title: string) =>
  iconByTitle.find((item) => title.includes(item.keyword))?.icon ?? 'book'

export const parseIcsCourses = (icsText: string, owner: Owner): Course[] => {
  const calendar = new ICAL.Component(ICAL.parse(icsText))
  const events = calendar.getAllSubcomponents('vevent')

  return events.map((component, index) => {
    const event = new ICAL.Event(component)
    const startTime = event.startDate as unknown as IcalTime
    const endTime = event.endDate as unknown as IcalTime
    const title = event.summary?.trim() || '\u672a\u547d\u540d\u8bfe\u7a0b'
    const classroom = event.location?.trim() || ''
    const uid = event.uid || `${owner}-${index}`

    return {
      id: `${owner}-${uid}`,
      owner,
      title,
      classroom,
      day: getDayOfWeek(startTime),
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      weekPattern: getWeekPattern(event, startTime),
      icon: getIcon(title),
    }
  })
}

const scoreDecodedText = (text: string) => {
  const suspiciousMatches = text.match(/\uFFFD|閿焲脙|鐠噟閺亅閼粅缁梶璇剧▼/g)
  return suspiciousMatches?.length ?? 0
}

export const decodeIcsFile = async (file: File) => {
  const buffer = await file.arrayBuffer()
  const utf8 = new TextDecoder('utf-8').decode(buffer)

  try {
    const gb18030 = new TextDecoder('gb18030').decode(buffer)
    return scoreDecodedText(gb18030) < scoreDecodedText(utf8) ? gb18030 : utf8
  } catch {
    return utf8
  }
}
