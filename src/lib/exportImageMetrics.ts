import { timelineRowCount } from './schedule'
import type { TimeRange } from '../types/schedule'

export type ExportRatioId = 'auto' | '1-1' | '4-3' | '16-9' | 'custom'

type CustomRatio = {
  vertical: number
  horizontal: number
}

type ExportMetricsInput = {
  subjectWidth: number
  ratio: number | null
  timeRange: TimeRange
  headerHeight?: number
  timelinePadding?: number
  defaultRowHeight?: number
}

const defaultHeaderHeight = 88
const defaultTimelinePadding = 28
const fallbackRowHeight = 8

export const resolveExportRatio = (id: ExportRatioId, custom?: CustomRatio) => {
  if (id === 'auto') {
    return null
  }

  if (id === '1-1') {
    return 1
  }

  if (id === '4-3') {
    return 4 / 3
  }

  if (id === '16-9') {
    return 16 / 9
  }

  if (
    custom &&
    Number.isFinite(custom.vertical) &&
    Number.isFinite(custom.horizontal) &&
    custom.vertical > 0 &&
    custom.horizontal > 0
  ) {
    return custom.vertical / custom.horizontal
  }

  return null
}

export const createExportImageMetrics = ({
  subjectWidth,
  ratio,
  timeRange,
  headerHeight = defaultHeaderHeight,
  timelinePadding = defaultTimelinePadding,
  defaultRowHeight = fallbackRowHeight,
}: ExportMetricsInput) => {
  const rowCount = timelineRowCount(timeRange)
  const rowHeight = ratio
    ? Math.max(3, (subjectWidth * ratio - headerHeight - timelinePadding) / rowCount)
    : defaultRowHeight
  const subjectHeight = Math.ceil(headerHeight + rowCount * rowHeight + timelinePadding)
  const courseScale = Math.max(0.52, Math.min(1, rowHeight / defaultRowHeight))

  return {
    rowCount,
    rowHeight,
    subjectHeight,
    courseScale,
  }
}
