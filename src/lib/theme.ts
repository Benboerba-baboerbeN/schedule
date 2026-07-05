import type { CSSProperties } from 'react'
import type { ColorSchemePreset, CourseTone, ScheduleTheme, ToneColor } from '../types/schedule'

const tones: CourseTone[] = ['alice', 'bob', 'shared']

export const defaultScheduleTheme: ScheduleTheme = {
  alice: {
    background: '#e8f3ff',
    border: '#9bc9ff',
    text: '#174d95',
    headerBackground: '#c7e2ff',
    headerText: '#123e73',
  },
  bob: {
    background: '#e8f7e8',
    border: '#a9dca7',
    text: '#166534',
    headerBackground: '#c8edc7',
    headerText: '#14532d',
  },
  shared: {
    background: '#fff4d8',
    border: '#f4c96c',
    text: '#9a5a00',
    headerBackground: '#ffe4a3',
    headerText: '#8a4b00',
  },
}

export const colorSchemePresets: ColorSchemePreset[] = [
  {
    id: 'cool-blue',
    name: 'Cool Blue 冷蓝',
    description: '清爽、低干扰，适合默认课表阅读。',
    colors: {
      background: '#e8f3ff',
      border: '#9bc9ff',
      text: '#174d95',
      headerBackground: '#c7e2ff',
      headerText: '#123e73',
    },
  },
  {
    id: 'jade',
    name: 'Jade 玉石绿',
    description: '来自 2026 热门 Jade 趋势，稳定又有生命力。',
    colors: {
      background: '#e6f6ef',
      border: '#8dd3b4',
      text: '#0f5c46',
      headerBackground: '#b8ead5',
      headerText: '#104536',
    },
  },
  {
    id: 'sage',
    name: 'Sage 鼠尾草',
    description: '柔和自然，适合长时间查看。',
    colors: {
      background: '#eef6ea',
      border: '#b7d7a8',
      text: '#315c2c',
      headerBackground: '#d4eac8',
      headerText: '#294c25',
    },
  },
  {
    id: 'teal',
    name: 'Teal 湖水青',
    description: '蓝绿之间的平衡色，清晰但不刺眼。',
    colors: {
      background: '#e5f7f7',
      border: '#89d7d5',
      text: '#0f5f63',
      headerBackground: '#b5ecea',
      headerText: '#164e52',
    },
  },
  {
    id: 'plum',
    name: 'Plum 梅子紫',
    description: '偏沉稳的紫调，适合作为强调色。',
    colors: {
      background: '#f5eaf5',
      border: '#d7a9d6',
      text: '#673064',
      headerBackground: '#ebc8e9',
      headerText: '#542551',
    },
  },
  {
    id: 'terracotta',
    name: 'Terracotta 陶土',
    description: '温暖、活跃，适合共同课程或重点课程。',
    colors: {
      background: '#fff0e7',
      border: '#f0aa86',
      text: '#8a3f20',
      headerBackground: '#ffd2bd',
      headerText: '#743318',
    },
  },
  {
    id: 'persimmon',
    name: 'Persimmon 柿橙',
    description: '明快醒目，适合需要高辨识度的角色。',
    colors: {
      background: '#fff1e6',
      border: '#ffb17d',
      text: '#9a3d13',
      headerBackground: '#ffc89d',
      headerText: '#7c2d12',
    },
  },
  {
    id: 'slate',
    name: 'Slate 石板灰',
    description: '中性克制，适合安静的管理界面。',
    colors: {
      background: '#f1f5f9',
      border: '#cbd5e1',
      text: '#334155',
      headerBackground: '#e2e8f0',
      headerText: '#1e293b',
    },
  },
]

export const findMatchingPresetId = (colors: ToneColor) =>
  colorSchemePresets.find((preset) =>
    Object.entries(preset.colors).every(
      ([key, value]) => colors[key as keyof ToneColor].toLowerCase() === value.toLowerCase(),
    ),
  )?.id ?? 'custom'

const hexColorPattern = /^#[0-9a-f]{6}$/i

const isToneColor = (value: unknown): value is ToneColor => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const toneColor = value as Record<string, unknown>
  return (
    typeof toneColor.background === 'string' &&
    hexColorPattern.test(toneColor.background) &&
    typeof toneColor.border === 'string' &&
    hexColorPattern.test(toneColor.border) &&
    typeof toneColor.text === 'string' &&
    hexColorPattern.test(toneColor.text) &&
    typeof toneColor.headerBackground === 'string' &&
    hexColorPattern.test(toneColor.headerBackground) &&
    typeof toneColor.headerText === 'string' &&
    hexColorPattern.test(toneColor.headerText)
  )
}

export const parseScheduleTheme = (value: unknown): ScheduleTheme | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const theme = value as Partial<Record<CourseTone, unknown>>
  if (!tones.every((tone) => isToneColor(theme[tone]))) {
    return null
  }

  return theme as ScheduleTheme
}

export const mergeScheduleTheme = (theme?: ScheduleTheme | null): ScheduleTheme => ({
  alice: { ...defaultScheduleTheme.alice, ...theme?.alice },
  bob: { ...defaultScheduleTheme.bob, ...theme?.bob },
  shared: { ...defaultScheduleTheme.shared, ...theme?.shared },
})

type ThemeStyle = CSSProperties & Record<`--${CourseTone}-${string}`, string>

export const createThemeStyle = (theme: ScheduleTheme): ThemeStyle => ({
  '--alice-bg': theme.alice.background,
  '--alice-border': theme.alice.border,
  '--alice-text': theme.alice.text,
  '--alice-header-bg': theme.alice.headerBackground,
  '--alice-header-text': theme.alice.headerText,
  '--bob-bg': theme.bob.background,
  '--bob-border': theme.bob.border,
  '--bob-text': theme.bob.text,
  '--bob-header-bg': theme.bob.headerBackground,
  '--bob-header-text': theme.bob.headerText,
  '--shared-bg': theme.shared.background,
  '--shared-border': theme.shared.border,
  '--shared-text': theme.shared.text,
  '--shared-header-bg': theme.shared.headerBackground,
  '--shared-header-text': theme.shared.headerText,
})
