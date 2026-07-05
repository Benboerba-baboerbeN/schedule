import { ImageDown, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { toPng } from 'html-to-image'
import ScheduleGrid from './ScheduleGrid'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { timelineRowCount } from '../lib/schedule'
import type { AppStyle, Course, PeopleNames, TimeRange } from '../types/schedule'

type ExportRatio = 'auto' | '1-1' | '4-3' | '16-9'

type ExportImageDialogProps = {
  appStyle: AppStyle
  courses: Course[]
  people: PeopleNames
  timeRange: TimeRange
  title: string
  onClose: () => void
  onStatus: (message: string, tone: 'success' | 'error') => void
}

type ExportCaptureStyle = CSSProperties & {
  '--export-row-height': string
}

const text = {
  eyebrow: '\u56fe\u7247',
  title: '\u5bfc\u51fa\u8bfe\u8868\u56fe\u7247',
  description: '\u53ea\u5bfc\u51fa\u8bfe\u8868\u4e3b\u4f53\uff0c\u9884\u89c8\u4f1a\u968f\u6bd4\u4f8b\u5b9e\u65f6\u66f4\u65b0\u3002',
  close: '\u5173\u95ed\u5bfc\u51fa\u56fe\u7247\u83dc\u5355',
  ratio: '\u5bfc\u51fa\u6bd4\u4f8b',
  defaultRatio: '\u9ed8\u8ba4',
  exportFailedSoon: '\u5bfc\u51fa\u56fe\u7247\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002',
  exportFailedPermission: '\u5bfc\u51fa\u56fe\u7247\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u6d4f\u89c8\u5668\u4e0b\u8f7d\u6743\u9650\u540e\u91cd\u8bd5\u3002',
  exported: '\u5df2\u5bfc\u51fa\u8bfe\u8868\u56fe\u7247\u3002',
  cancel: '\u53d6\u6d88',
  exportImage: '\u5bfc\u51fa\u56fe\u7247',
  filenameSuffix: '\u8bfe\u8868',
}

const ratioOptions: Array<{ id: ExportRatio; label: string; ratio: number | null }> = [
  { id: 'auto', label: text.defaultRatio, ratio: null },
  { id: '1-1', label: '1:1', ratio: 1 },
  { id: '4-3', label: '4:3', ratio: 4 / 3 },
  { id: '16-9', label: '16:9', ratio: 16 / 9 },
]

const headerHeight = 88
const timelinePadding = 28
const defaultRowHeight = 8

const safeImageName = (title: string) => {
  const safeTitle = title.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-')
  return `${safeTitle || 'dual-schedule'}-${text.filenameSuffix}.png`
}

const downloadDataUrl = (dataUrl: string, filename: string) => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function ExportImageDialog({
  appStyle,
  courses,
  people,
  timeRange,
  title,
  onClose,
  onStatus,
}: ExportImageDialogProps) {
  useEscapeClose(onClose)

  const captureRef = useRef<HTMLDivElement | null>(null)
  const subjectRef = useRef<HTMLDivElement | null>(null)
  const [ratioId, setRatioId] = useState<ExportRatio>('auto')
  const [subjectWidth, setSubjectWidth] = useState(1360)
  const padding = 40

  const ratio = ratioOptions.find((option) => option.id === ratioId)?.ratio ?? null
  const rowCount = timelineRowCount(timeRange)
  const rowHeight = useMemo(() => {
    if (!ratio) {
      return defaultRowHeight
    }

    const targetSubjectHeight = subjectWidth * ratio
    return Math.max(3, (targetSubjectHeight - headerHeight - timelinePadding) / rowCount)
  }, [ratio, rowCount, subjectWidth])
  const subjectSize = useMemo(() => ({
    width: subjectWidth,
    height: Math.ceil(headerHeight + rowCount * rowHeight + timelinePadding),
  }), [rowCount, rowHeight, subjectWidth])
  const exportSize = useMemo(() => ({
    width: Math.ceil(subjectSize.width + padding * 2),
    height: Math.ceil(subjectSize.height + padding * 2),
  }), [padding, subjectSize.height, subjectSize.width])
  const subjectOffset = {
    x: (exportSize.width - subjectSize.width) / 2,
    y: (exportSize.height - subjectSize.height) / 2,
  }
  const previewScale = Math.min(1, 820 / exportSize.width, 420 / exportSize.height)
  const captureStyle: ExportCaptureStyle = {
    width: exportSize.width,
    height: exportSize.height,
    '--export-row-height': `${rowHeight}px`,
  }

  useEffect(() => {
    const subject = subjectRef.current?.querySelector('.schedule-shell') as HTMLElement | null
    const grid = subjectRef.current?.querySelector('.schedule-grid') as HTMLElement | null

    if (!subject || !grid) {
      return
    }

    const width = Math.max(subject.scrollWidth, grid.scrollWidth, 1360)

    if (width > 0) {
      setSubjectWidth(width)
    }
  }, [courses, people, timeRange, appStyle])

  const handleExport = async () => {
    const node = captureRef.current

    if (!node) {
      onStatus(text.exportFailedSoon, 'error')
      return
    }

    try {
      await document.fonts.ready
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f8f3e4',
        skipFonts: true,
        width: exportSize.width,
        height: exportSize.height,
      })
      downloadDataUrl(dataUrl, safeImageName(title))
      onStatus(text.exported, 'success')
      onClose()
    } catch (error) {
      const detail = error instanceof Error ? `：${error.message}` : ''
      onStatus(`${text.exportFailedPermission}${detail}`, 'error')
    }
  }

  return (
    <div className="editor-backdrop" role="presentation">
      <section className="export-panel export-image-panel" aria-label={text.title} aria-modal="true" role="dialog">
        <div className="editor-header export-panel__header">
          <div>
            <p className="eyebrow">{text.eyebrow}</p>
            <h2>{text.title}</h2>
            <p>{text.description}</p>
          </div>
          <button className="icon-button" type="button" aria-label={text.close} onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="export-image-panel__body">
          <div className="ratio-picker" aria-label={text.ratio}>
            {ratioOptions.map((option) => (
              <button
                className={`ratio-button ${ratioId === option.id ? 'ratio-button--active' : ''}`}
                key={option.id}
                type="button"
                onClick={() => setRatioId(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="export-image-preview">
            <div
              className="export-preview-frame"
              style={{ width: exportSize.width * previewScale, height: exportSize.height * previewScale }}
            >
              <div className="export-preview-scale" style={{ transform: `scale(${previewScale})` }}>
                <div
                  className={`export-capture app-shell app-shell--${appStyle}`}
                  ref={captureRef}
                  style={captureStyle}
                >
                  <div
                    className="export-capture__subject"
                    ref={subjectRef}
                    style={{
                      left: subjectOffset.x,
                      top: subjectOffset.y,
                      width: subjectSize.width,
                      height: subjectSize.height,
                    }}
                  >
                    <ScheduleGrid
                      courses={courses}
                      people={people}
                      timeRange={timeRange}
                      onCourseClick={() => undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="export-panel__actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            {text.cancel}
          </button>
          <button className="primary-button" type="button" onClick={handleExport}>
            <ImageDown aria-hidden="true" size={17} />
            {text.exportImage}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ExportImageDialog
