import {
  createDefaultPeopleIds,
  defaultPeopleNames,
  isPeopleIds,
  isPeopleNames,
  normalizePeopleIds,
  normalizePeopleNames,
} from './people'
import { defaultAppStyle, isAppFont, isAppStyle } from './appStyle'
import { defaultTimeRange, timeToMinutes } from './schedule'
import { defaultScheduleTheme, mergeScheduleTheme, parseScheduleTheme } from './theme'
import type {
  AppStyle,
  AppFont,
  Course,
  Owner,
  PeopleIds,
  PeopleNames,
  ScheduleTheme,
  TimeRange,
  WeekPattern,
} from '../types/schedule'

export const storageKey = 'dual-schedule-state'
export const previousStorageKey = 'dual-schedule-previous-state'
export const importedBaselineStorageKey = 'dual-schedule-imported-baseline'

const encryptionPrefix = 'ds1:'
const encryptionKey = 'dual-schedule-local-export'

export type SavedScheduleState = {
  version: 1
  title: string
  people: PeopleNames
  peopleIds: PeopleIds
  courses: Course[]
  theme: ScheduleTheme
  appStyle: AppStyle
  appFont: AppFont
  timeRange: TimeRange
  updatedAt: string
}

type SavedScheduleOptions = {
  theme?: ScheduleTheme
  appStyle?: AppStyle
  appFont?: AppFont
  timeRange?: TimeRange
  people?: PeopleNames
  peopleIds?: PeopleIds
  updatedAt?: string
}

const owners: Owner[] = ['alice', 'bob']
const weekPatterns: WeekPattern[] = ['all', 'odd', 'even']
const allowedSteps = [5]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const encodeBase64 = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text)))

const decodeBase64 = (encoded: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0)))

const xorText = (text: string) =>
  [...text]
    .map((char, index) =>
      String.fromCharCode(char.charCodeAt(0) ^ encryptionKey.charCodeAt(index % encryptionKey.length)),
    )
    .join('')

export const encryptPeopleIds = (ids: PeopleIds) =>
  `${encryptionPrefix}${encodeBase64(xorText(JSON.stringify(ids)))}`

export const decryptPeopleIds = (encrypted: string): PeopleIds | null => {
  try {
    if (!encrypted.startsWith(encryptionPrefix)) {
      return null
    }

    const decoded = xorText(decodeBase64(encrypted.slice(encryptionPrefix.length)))
    const parsed: unknown = JSON.parse(decoded)
    return isPeopleIds(parsed) ? normalizePeopleIds(parsed) : null
  } catch {
    return null
  }
}

const isCourse = (value: unknown): value is Course => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    owners.includes(value.owner as Owner) &&
    typeof value.title === 'string' &&
    typeof value.classroom === 'string' &&
    typeof value.day === 'number' &&
    value.day >= 1 &&
    value.day <= 7 &&
    typeof value.startTime === 'string' &&
    typeof value.endTime === 'string' &&
    weekPatterns.includes(value.weekPattern as WeekPattern) &&
    typeof value.icon === 'string'
  )
}

const isTimeRange = (value: unknown): value is TimeRange => {
  if (!isRecord(value)) {
    return false
  }

  if (
    typeof value.startTime !== 'string' ||
    typeof value.endTime !== 'string' ||
    typeof value.stepMinutes !== 'number' ||
    !allowedSteps.includes(value.stepMinutes)
  ) {
    return false
  }

  const start = timeToMinutes(value.startTime)
  const end = timeToMinutes(value.endTime)
  return Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end <= 24 * 60 && end > start
}

export const createSavedScheduleState = (
  title: string,
  courses: Course[],
  options: SavedScheduleOptions | string = {},
): SavedScheduleState => ({
  version: 1,
  title,
  people: typeof options === 'string' ? defaultPeopleNames : normalizePeopleNames(options.people),
  peopleIds: typeof options === 'string' ? createDefaultPeopleIds() : normalizePeopleIds(options.peopleIds),
  courses,
  theme: typeof options === 'string' ? defaultScheduleTheme : options.theme ?? defaultScheduleTheme,
  appStyle: typeof options === 'string' ? defaultAppStyle : options.appStyle ?? defaultAppStyle,
  appFont: typeof options === 'string' ? 'style-default' : options.appFont ?? 'style-default',
  timeRange: typeof options === 'string' ? defaultTimeRange : options.timeRange ?? defaultTimeRange,
  updatedAt: typeof options === 'string' ? options : options.updatedAt ?? new Date().toISOString(),
})

export const serializeScheduleState = (state: SavedScheduleState) =>
  JSON.stringify(state, null, 2)

export const serializeExportScheduleState = (state: SavedScheduleState) => {
  const { peopleIds: _peopleIds, ...publicState } = state

  return JSON.stringify({
    ...publicState,
    encryptedPeopleIds: encryptPeopleIds(state.peopleIds),
  }, null, 2)
}

export const parseScheduleState = (raw: string): SavedScheduleState | null => {
  try {
    const parsed: unknown = JSON.parse(raw)

    if (!isRecord(parsed)) {
      return null
    }

    const theme = parsed.theme === undefined
      ? defaultScheduleTheme
      : parseScheduleTheme(parsed.theme)
    const timeRange = parsed.timeRange === undefined
      ? defaultTimeRange
      : isTimeRange(parsed.timeRange)
        ? parsed.timeRange
        : null
    const appStyle = parsed.appStyle === undefined
      ? defaultAppStyle
      : isAppStyle(parsed.appStyle)
        ? parsed.appStyle
        : null
    const appFont = parsed.appFont === undefined
      ? 'style-default'
      : isAppFont(parsed.appFont)
        ? parsed.appFont
        : null
    const people = parsed.people === undefined
      ? defaultPeopleNames
      : isPeopleNames(parsed.people)
        ? normalizePeopleNames(parsed.people)
        : null
    const peopleIds = isPeopleIds(parsed.peopleIds)
      ? normalizePeopleIds(parsed.peopleIds)
      : typeof parsed.encryptedPeopleIds === 'string'
        ? decryptPeopleIds(parsed.encryptedPeopleIds)
        : createDefaultPeopleIds()

    if (
      parsed.version !== 1 ||
      typeof parsed.title !== 'string' ||
      typeof parsed.updatedAt !== 'string' ||
      !Array.isArray(parsed.courses) ||
      !parsed.courses.every(isCourse) ||
      !theme ||
      !appStyle ||
      !appFont ||
      !timeRange ||
      !people ||
      !peopleIds
    ) {
      return null
    }

    return {
      version: 1,
      title: parsed.title,
      people,
      peopleIds,
      courses: parsed.courses,
      theme: mergeScheduleTheme(theme),
      appStyle,
      appFont,
      timeRange,
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}

export const loadScheduleState = (storage: Storage = window.localStorage) => {
  const raw = storage.getItem(storageKey)
  return raw ? parseScheduleState(raw) : null
}

export const loadPreviousScheduleState = (storage: Storage = window.localStorage) => {
  const raw = storage.getItem(previousStorageKey)
  return raw ? parseScheduleState(raw) : null
}

export const loadImportedBaselineState = (storage: Storage = window.localStorage) => {
  const raw = storage.getItem(importedBaselineStorageKey)
  return raw ? parseScheduleState(raw) : null
}

export const saveImportedBaselineState = (
  state: SavedScheduleState,
  storage: Storage = window.localStorage,
) => {
  storage.setItem(importedBaselineStorageKey, serializeScheduleState(state))
}

export const saveScheduleState = (
  state: SavedScheduleState,
  storage: Storage = window.localStorage,
) => {
  const previousRaw = storage.getItem(storageKey)
  const nextRaw = serializeScheduleState(state)

  if (previousRaw && previousRaw !== nextRaw) {
    storage.setItem(previousStorageKey, previousRaw)
  }

  storage.setItem(storageKey, nextRaw)
}

export const createExportFilename = (title: string) => {
  const safeTitle = title.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-')
  return `${safeTitle || 'dual-schedule'}-schedule.json`
}

export const normalizeExportFilename = (filename: string) => {
  const safeName = filename.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-')
  const normalized = safeName || 'dual-schedule-schedule.json'
  return normalized.toLowerCase().endsWith('.json') ? normalized : `${normalized}.json`
}

export const downloadScheduleFile = (state: SavedScheduleState, filename = createExportFilename(state.title)) => {
  const blob = new Blob([serializeExportScheduleState(state)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = normalizeExportFilename(filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const readTextFile = (file: File) => file.text()
