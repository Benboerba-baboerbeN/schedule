import {
  importedBaselineStorageKey,
  parseScheduleState,
  serializeScheduleState,
  storageKey,
  type SavedScheduleState,
} from './storage'

type MiniStorageDriver = {
  getStorageSync: (key: string) => string
  setStorageSync: (key: string, value: string) => void
}

export const createMiniScheduleStorage = (driver: MiniStorageDriver) => ({
  load: () => {
    const raw = driver.getStorageSync(storageKey)
    return raw ? parseScheduleState(raw) : null
  },
  save: (state: SavedScheduleState) => {
    driver.setStorageSync(storageKey, serializeScheduleState(state))
  },
  loadImportedBaseline: () => {
    const raw = driver.getStorageSync(importedBaselineStorageKey)
    return raw ? parseScheduleState(raw) : null
  },
  saveImportedBaseline: (state: SavedScheduleState) => {
    driver.setStorageSync(importedBaselineStorageKey, serializeScheduleState(state))
  },
})
