import { describe, expect, it } from 'vitest'
import { createSavedScheduleState } from './storage'
import { createMiniScheduleStorage } from './miniStorage'
import type { Course } from '../types/schedule'

const course: Course = {
  id: 'mini-course',
  owner: 'alice',
  title: 'Mini Course',
  classroom: 'Room 1',
  day: 1,
  startTime: '08:00',
  endTime: '09:00',
  weekPattern: 'all',
  icon: 'book',
}

const createMemoryStorage = () => {
  const values = new Map<string, string>()

  return {
    getStorageSync: (key: string) => values.get(key) ?? '',
    setStorageSync: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

describe('mini schedule storage adapter', () => {
  it('saves and loads the current schedule state through mini program storage', () => {
    const storage = createMiniScheduleStorage(createMemoryStorage())
    const state = createSavedScheduleState('Mini Schedule', [course], {
      updatedAt: '2026-07-06T00:00:00.000Z',
    })

    storage.save(state)

    expect(storage.load()?.title).toBe('Mini Schedule')
    expect(storage.load()?.courses).toHaveLength(1)
  })

  it('keeps an imported baseline separate from the current schedule state', () => {
    const storage = createMiniScheduleStorage(createMemoryStorage())
    const imported = createSavedScheduleState('Imported Baseline', [course], {
      updatedAt: '2026-07-06T00:00:00.000Z',
    })
    const edited = createSavedScheduleState('Edited Schedule', [], {
      updatedAt: '2026-07-06T00:01:00.000Z',
    })

    storage.saveImportedBaseline(imported)
    storage.save(edited)

    expect(storage.load()?.title).toBe('Edited Schedule')
    expect(storage.loadImportedBaseline()?.title).toBe('Imported Baseline')
  })
})
