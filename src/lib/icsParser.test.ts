import { describe, expect, it } from 'vitest'
import { parseIcsCourses } from './icsParser'

const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YZune//WakeUpSchedule//EN
BEGIN:VEVENT
UID:sample-1
SUMMARY:Advanced Math
DTSTART;TZID=Asia/Shanghai:20260302T080000
DTEND;TZID=Asia/Shanghai:20260302T095000
RRULE:FREQ=WEEKLY;UNTIL=20260719T160000Z;INTERVAL=1
LOCATION:Room 301
DESCRIPTION:Room 301
END:VEVENT
BEGIN:VEVENT
UID:sample-2
SUMMARY:Linear Algebra
DTSTART;TZID=Asia/Shanghai:20260303T101000
DTEND;TZID=Asia/Shanghai:20260303T120000
RRULE:FREQ=WEEKLY;UNTIL=20260720T160000Z;INTERVAL=2
LOCATION:Room 202
DESCRIPTION:Room 202
END:VEVENT
END:VCALENDAR`

describe('parseIcsCourses', () => {
  it('converts VEVENT entries into course records for the selected owner', () => {
    const courses = parseIcsCourses(sampleIcs, 'alice')

    expect(courses).toHaveLength(2)
    expect(courses[0]).toMatchObject({
      owner: 'alice',
      title: 'Advanced Math',
      classroom: 'Room 301',
      day: 1,
      startTime: '08:00',
      endTime: '09:50',
      weekPattern: 'all',
    })
    expect(courses[1]).toMatchObject({
      title: 'Linear Algebra',
      day: 2,
      startTime: '10:10',
      endTime: '12:00',
      weekPattern: 'even',
    })
  })
})
