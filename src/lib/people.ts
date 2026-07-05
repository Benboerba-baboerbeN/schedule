import type { Owner, PeopleIds, PeopleNames } from '../types/schedule'

export const defaultPeopleNames: PeopleNames = {
  alice: '\u5495\u5495',
  bob: '\u560e\u560e',
}

export const ownerOrder: Owner[] = ['alice', 'bob']

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `person-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const createDefaultPeopleIds = (): PeopleIds => ({
  alice: createId(),
  bob: createId(),
})

export const createScheduleTitle = (people: PeopleNames) =>
  `\u201c${people.alice}\u201d&\u201c${people.bob}\u201d\u7684\u8bfe\u8868`

export const normalizePeopleNames = (people?: Partial<PeopleNames> | null): PeopleNames => ({
  alice: people?.alice?.trim() || defaultPeopleNames.alice,
  bob: people?.bob?.trim() || defaultPeopleNames.bob,
})

export const isPeopleNames = (value: unknown): value is PeopleNames => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<Owner, unknown>
  return (
    typeof record.alice === 'string' &&
    record.alice.trim().length > 0 &&
    typeof record.bob === 'string' &&
    record.bob.trim().length > 0
  )
}

export const isPeopleIds = (value: unknown): value is PeopleIds => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<Owner, unknown>
  return (
    typeof record.alice === 'string' &&
    record.alice.trim().length > 0 &&
    typeof record.bob === 'string' &&
    record.bob.trim().length > 0
  )
}

export const normalizePeopleIds = (ids?: Partial<PeopleIds> | null): PeopleIds => {
  const fallback = createDefaultPeopleIds()

  return {
    alice: ids?.alice?.trim() || fallback.alice,
    bob: ids?.bob?.trim() || fallback.bob,
  }
}
