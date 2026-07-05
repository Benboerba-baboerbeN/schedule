import { describe, expect, it } from 'vitest'
import { colorSchemePresets, findMatchingPresetId } from './theme'

describe('schedule theme presets', () => {
  it('detects a selected preset and falls back to custom after manual edits', () => {
    const bauhausBlue = colorSchemePresets.find((preset) => preset.id === 'bauhaus-blue')

    expect(bauhausBlue).toBeDefined()
    expect(findMatchingPresetId(bauhausBlue!.colors)).toBe('bauhaus-blue')
    expect(findMatchingPresetId({ ...bauhausBlue!.colors, background: '#ffffff' })).toBe('custom')
  })
})
