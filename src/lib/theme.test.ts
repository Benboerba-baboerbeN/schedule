import { describe, expect, it } from 'vitest'
import { colorSchemePresets, findMatchingPresetId } from './theme'

describe('schedule theme presets', () => {
  it('detects a selected preset and falls back to custom after manual edits', () => {
    const jade = colorSchemePresets.find((preset) => preset.id === 'jade')

    expect(jade).toBeDefined()
    expect(findMatchingPresetId(jade!.colors)).toBe('jade')
    expect(findMatchingPresetId({ ...jade!.colors, background: '#ffffff' })).toBe('custom')
  })
})
