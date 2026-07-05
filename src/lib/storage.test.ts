import { describe, expect, it } from 'vitest'
import {
  createSavedScheduleState,
  encryptPeopleIds,
  loadImportedBaselineState,
  loadPreviousScheduleState,
  parseScheduleState,
  saveImportedBaselineState,
  saveScheduleState,
  serializeScheduleState,
  serializeExportScheduleState,
  storageKey,
} from './storage'
import { defaultScheduleTheme } from './theme'
import { defaultPeopleNames } from './people'
import type { Course } from '../types/schedule'

const aliceCourse: Course = {
  id: 'alice-course',
  owner: 'alice',
  title: 'Advanced Math',
  classroom: 'Room 301',
  day: 1,
  startTime: '08:00',
  endTime: '09:50',
  weekPattern: 'all',
  icon: 'book',
}

const bobCourse: Course = {
  id: 'bob-course',
  owner: 'bob',
  title: 'Physics',
  classroom: 'Lab 2',
  day: 2,
  startTime: '10:10',
  endTime: '12:00',
  weekPattern: 'odd',
  icon: 'atom',
}

describe('schedule storage', () => {
  it('serializes both people into one file while preserving owner fields', () => {
    const state = createSavedScheduleState(
      'Shared Schedule',
      [aliceCourse, bobCourse],
      {
        theme: defaultScheduleTheme,
        updatedAt: '2026-07-04T00:00:00.000Z',
      },
    )
    const parsed = parseScheduleState(serializeScheduleState(state))

    expect(parsed).toMatchObject({
      version: 1,
      title: 'Shared Schedule',
      updatedAt: '2026-07-04T00:00:00.000Z',
    })
    expect(parsed?.courses).toHaveLength(2)
    expect(parsed?.people).toEqual(defaultPeopleNames)
    expect(parsed?.courses.map((course) => course.owner)).toEqual(['alice', 'bob'])
    expect(parsed?.theme.alice.background).toBe(defaultScheduleTheme.alice.background)
    expect(parsed?.theme.bob.headerBackground).toBe(defaultScheduleTheme.bob.headerBackground)
    expect(parsed?.timeRange).toEqual({ startTime: '08:00', endTime: '22:00', stepMinutes: 5 })
  })

  it('keeps custom colors in the exported schedule file', () => {
    const theme = {
      ...defaultScheduleTheme,
      alice: {
        ...defaultScheduleTheme.alice,
        background: '#dbeafe',
        headerBackground: '#bfdbfe',
      },
    }
    const state = createSavedScheduleState('Color Schedule', [aliceCourse], {
      theme,
      updatedAt: '2026-07-04T00:00:00.000Z',
    })
    const parsed = parseScheduleState(serializeScheduleState(state))

    expect(parsed?.theme.alice.background).toBe('#dbeafe')
    expect(parsed?.theme.alice.headerBackground).toBe('#bfdbfe')
  })

  it('keeps custom people names in the exported schedule file', () => {
    const state = createSavedScheduleState('Custom People', [aliceCourse, bobCourse], {
      people: { alice: '\u5495\u5495', bob: '\u560e\u560e' },
      updatedAt: '2026-07-04T00:00:00.000Z',
    })
    const parsed = parseScheduleState(serializeScheduleState(state))

    expect(parsed?.people).toEqual({ alice: '\u5495\u5495', bob: '\u560e\u560e' })
  })

  it('keeps the selected visual style in saved schedule data', () => {
    const state = createSavedScheduleState('Paper Schedule', [aliceCourse], {
      appStyle: 'paper',
      updatedAt: '2026-07-04T00:00:00.000Z',
    })
    const parsed = parseScheduleState(serializeScheduleState(state))

    expect(parsed?.appStyle).toBe('paper')
  })

  it('encrypts people ids in exported files and decrypts them when imported', () => {
    const peopleIds = { alice: 'alice-secret-id', bob: 'bob-secret-id' }
    const state = createSavedScheduleState('Encrypted People', [aliceCourse], {
      peopleIds,
      updatedAt: '2026-07-04T00:00:00.000Z',
    })
    const exported = serializeExportScheduleState(state)
    const parsed = parseScheduleState(exported)

    expect(exported).not.toContain('alice-secret-id')
    expect(exported).not.toContain('bob-secret-id')
    expect(exported).toContain('encryptedPeopleIds')
    expect(parsed?.peopleIds).toEqual(peopleIds)
  })

  it('rejects tampered encrypted people ids', () => {
    const exported = JSON.stringify({
      ...createSavedScheduleState('Bad Encrypted People', [aliceCourse]),
      peopleIds: undefined,
      encryptedPeopleIds: `${encryptPeopleIds({ alice: 'a', bob: 'b' })}x`,
    })

    expect(parseScheduleState(exported)).toBeNull()
  })

  it('keeps the previous autosave before writing a new local state', () => {
    const storage = new Map<string, string>()
    const localStorageMock: Storage = {
      length: 0,
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      key: (index: number) => [...storage.keys()][index] ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
    }
    const first = createSavedScheduleState('First', [aliceCourse], {
      updatedAt: '2026-07-04T00:00:00.000Z',
    })
    const second = createSavedScheduleState('Second', [bobCourse], {
      updatedAt: '2026-07-04T00:01:00.000Z',
    })

    localStorageMock.setItem(storageKey, serializeScheduleState(first))
    saveScheduleState(second, localStorageMock)

    expect(loadPreviousScheduleState(localStorageMock)?.title).toBe('First')
  })

  it('keeps the imported baseline separately from the latest local state', () => {
    const storage = new Map<string, string>()
    const localStorageMock: Storage = {
      length: 0,
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      key: (index: number) => [...storage.keys()][index] ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
    }
    const imported = createSavedScheduleState('Imported Start', [aliceCourse], {
      updatedAt: '2026-07-04T00:00:00.000Z',
    })
    const edited = createSavedScheduleState('Edited Later', [bobCourse], {
      updatedAt: '2026-07-04T00:01:00.000Z',
    })

    saveImportedBaselineState(imported, localStorageMock)
    saveScheduleState(edited, localStorageMock)

    expect(loadImportedBaselineState(localStorageMock)?.title).toBe('Imported Start')
  })

  it('keeps custom time ranges in the exported schedule file', () => {
    const state = createSavedScheduleState(
      'Evening Schedule',
      [bobCourse],
      {
        theme: defaultScheduleTheme,
        timeRange: { startTime: '09:00', endTime: '21:00', stepMinutes: 5 },
        updatedAt: '2026-07-04T00:00:00.000Z',
      },
    )
    const parsed = parseScheduleState(serializeScheduleState(state))

    expect(parsed?.timeRange).toEqual({ startTime: '09:00', endTime: '21:00', stepMinutes: 5 })
  })

  it('rejects invalid imported JSON instead of silently corrupting the schedule', () => {
    expect(parseScheduleState('not-json')).toBeNull()
    expect(parseScheduleState(JSON.stringify({ version: 1, title: 'Bad', courses: [{ owner: 'nobody' }] }))).toBeNull()
  })
})
