import { describe, expect, it } from 'vitest'
import { createExportImageMetrics, resolveExportRatio } from './exportImageMetrics'
import { defaultTimeRange } from './schedule'

describe('export image metrics', () => {
  it('treats ratios as vertical to horizontal', () => {
    expect(resolveExportRatio('4-3')).toBeCloseTo(4 / 3)
    expect(resolveExportRatio('16-9')).toBeCloseTo(16 / 9)
    expect(resolveExportRatio('custom', { vertical: 5, horizontal: 4 })).toBeCloseTo(5 / 4)
  })

  it('returns null for invalid custom ratios', () => {
    expect(resolveExportRatio('custom', { vertical: 0, horizontal: 4 })).toBeNull()
    expect(resolveExportRatio('custom', { vertical: 4, horizontal: -1 })).toBeNull()
  })

  it('scales course text down when the export row height gets smaller', () => {
    const metrics = createExportImageMetrics({
      subjectWidth: 1360,
      ratio: 1,
      timeRange: defaultTimeRange,
    })

    expect(metrics.rowHeight).toBeLessThan(8)
    expect(metrics.courseScale).toBeLessThan(1)
    expect(metrics.subjectHeight).toBeGreaterThan(0)
  })
})
