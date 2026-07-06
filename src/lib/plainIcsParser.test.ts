import { describe, expect, it } from 'vitest'
import { parsePlainIcsCourses } from './plainIcsParser'

const sampleIcs = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'UID:course-1',
  'SUMMARY:组会',
  'LOCATION:会议室 408',
  'DTSTART;TZID=Asia/Shanghai:20260706T080000',
  'DTEND;TZID=Asia/Shanghai:20260706T085000',
  'RRULE:FREQ=WEEKLY;INTERVAL=2',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\n')

describe('plain ICS parser', () => {
  it('parses event blocks without loading the full ical library', () => {
    const courses = parsePlainIcsCourses(sampleIcs, 'alice')

    expect(courses).toHaveLength(1)
    expect(courses[0]).toMatchObject({
      id: 'alice-course-1',
      owner: 'alice',
      entryType: 'course',
      title: '组会',
      classroom: '会议室 408',
      day: 1,
      startTime: '08:00',
      endTime: '08:50',
      weekPattern: 'even',
    })
  })
})
