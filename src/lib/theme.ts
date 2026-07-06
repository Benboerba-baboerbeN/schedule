import type { CSSProperties } from 'react'
import type { AppStyle, ColorSchemePreset, CourseTone, ScheduleTheme, ToneColor } from '../types/schedule'

const tones: CourseTone[] = ['alice', 'bob', 'shared', 'activity']

export const defaultScheduleTheme: ScheduleTheme = {
  alice: {
    background: '#fff2b8',
    border: '#f0c020',
    text: '#141414',
    headerBackground: '#f3d765',
    headerText: '#141414',
  },
  bob: {
    background: '#dce6ff',
    border: '#1040c0',
    text: '#0c2f8f',
    headerBackground: '#8fa9df',
    headerText: '#102a70',
  },
  shared: {
    background: '#ffe0dc',
    border: '#d02020',
    text: '#8f1414',
    headerBackground: '#e58f86',
    headerText: '#7a1010',
  },
  activity: {
    background: '#f1f1f1',
    border: '#141414',
    text: '#141414',
    headerBackground: '#d8d8d8',
    headerText: '#141414',
  },
}

export const scheduleThemeByStyle: Record<AppStyle, ScheduleTheme> = {
  bauhaus: defaultScheduleTheme,
  classic: {
    alice: {
      background: '#eef6ff',
      border: '#a9c7ec',
      text: '#24476f',
      headerBackground: '#dbeafe',
      headerText: '#1e3a5f',
    },
    bob: {
      background: '#f0f9f4',
      border: '#a8d8bd',
      text: '#24563c',
      headerBackground: '#dff4e8',
      headerText: '#1f5138',
    },
    shared: {
      background: '#fff7e8',
      border: '#e8c077',
      text: '#6f4a16',
      headerBackground: '#f8e4b8',
      headerText: '#614313',
    },
    activity: {
      background: '#f4f0ff',
      border: '#b9a7e8',
      text: '#4b3a78',
      headerBackground: '#e4dcfb',
      headerText: '#3d3161',
    },
  },
  paper: {
    alice: {
      background: '#f9df91',
      border: '#9a7740',
      text: '#4d371c',
      headerBackground: '#edc966',
      headerText: '#4d371c',
    },
    bob: {
      background: '#cfe0df',
      border: '#6f8d8a',
      text: '#314f4c',
      headerBackground: '#a8c8c5',
      headerText: '#2d4745',
    },
    shared: {
      background: '#f3c0aa',
      border: '#a76450',
      text: '#6a3328',
      headerBackground: '#de8b77',
      headerText: '#5a2a22',
    },
    activity: {
      background: '#efe5c6',
      border: '#7c6745',
      text: '#4f4027',
      headerBackground: '#d9c895',
      headerText: '#463821',
    },
  },
}

export const getDefaultScheduleTheme = (style: AppStyle = 'bauhaus') => scheduleThemeByStyle[style]

export const colorSchemePresets: ColorSchemePreset[] = [
  {
    id: 'bauhaus-ink',
    name: 'Bauhaus Ink',
    description: '几何海报风格的中性墨色，适合活动、组会和实验安排。',
    colors: {
      background: '#f1f1f1',
      border: '#141414',
      text: '#141414',
      headerBackground: '#d8d8d8',
      headerText: '#141414',
    },
  },
  {
    id: 'bauhaus-blue',
    name: 'Bauhaus Blue',
    description: '主页面同款蓝色系，适合第一个角色的课程块。',
    colors: {
      background: '#dce6ff',
      border: '#1040c0',
      text: '#0c2f8f',
      headerBackground: '#8fa9df',
      headerText: '#102a70',
    },
  },
  {
    id: 'bauhaus-red',
    name: 'Bauhaus Red',
    description: '主页面同款红色系，醒目直接，适合第二个角色。',
    colors: {
      background: '#ffe0dc',
      border: '#d02020',
      text: '#8f1414',
      headerBackground: '#e58f86',
      headerText: '#7a1010',
    },
  },
  {
    id: 'bauhaus-yellow',
    name: 'Bauhaus Yellow',
    description: '主页面同款黄色系，适合共同课程和重点时段。',
    colors: {
      background: '#fff2b8',
      border: '#f0c020',
      text: '#141414',
      headerBackground: '#f3d765',
      headerText: '#141414',
    },
  },
  {
    id: 'teal',
    name: 'Teal',
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
    name: 'Plum',
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
    name: 'Terracotta',
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
    name: 'Persimmon',
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
    name: 'Slate',
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
  if (!tones.every((tone) => theme[tone] === undefined || isToneColor(theme[tone]))) {
    return null
  }

  if (!isToneColor(theme.alice) || !isToneColor(theme.bob) || !isToneColor(theme.shared)) {
    return null
  }

  return mergeScheduleTheme(theme as ScheduleTheme)
}

export const mergeScheduleTheme = (theme?: ScheduleTheme | null): ScheduleTheme => ({
  alice: { ...defaultScheduleTheme.alice, ...theme?.alice },
  bob: { ...defaultScheduleTheme.bob, ...theme?.bob },
  shared: { ...defaultScheduleTheme.shared, ...theme?.shared },
  activity: { ...defaultScheduleTheme.activity, ...theme?.activity },
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
  '--activity-bg': theme.activity.background,
  '--activity-border': theme.activity.border,
  '--activity-text': theme.activity.text,
  '--activity-header-bg': theme.activity.headerBackground,
  '--activity-header-text': theme.activity.headerText,
})
