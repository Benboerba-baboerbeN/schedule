import { RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { defaultTimeRange, timeToMinutes } from '../lib/schedule'
import type { TimeRange } from '../types/schedule'

type TimeRangeSettingsProps = {
  timeRange: TimeRange
  onChange: (timeRange: TimeRange) => void
  onClose: () => void
}

const text = {
  title: '时间范围设置',
  description: '设置课表纵向时间轴的开始和结束时间，课程会自动映射到 5 分钟网格中。',
  start: '开始时间',
  end: '结束时间',
  reset: '恢复默认范围',
  done: '完成',
  invalid: '结束时间必须晚于开始时间。',
}

function TimeRangeSettings({ timeRange, onChange, onClose }: TimeRangeSettingsProps) {
  useEscapeClose(onClose)

  const [draft, setDraft] = useState(timeRange)
  const isValid = timeToMinutes(draft.endTime) > timeToMinutes(draft.startTime)

  const commit = () => {
    if (!isValid) {
      return
    }

    onChange(draft)
    onClose()
  }

  const reset = () => {
    setDraft(defaultTimeRange)
    onChange(defaultTimeRange)
  }

  return (
    <div className="editor-backdrop" role="presentation">
      <section className="time-range-panel" aria-label={text.title} aria-modal="true" role="dialog">
        <div className="editor-header time-range-panel__header">
          <div>
            <h2>{text.title}</h2>
            <p>{text.description}</p>
          </div>
          <button className="icon-button" type="button" aria-label="关闭时间范围设置" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="time-range-panel__body">
          <label>
            <span>{text.start}</span>
            <input
              type="time"
              step={300}
              value={draft.startTime}
              onChange={(event) => setDraft((current) => ({ ...current, startTime: event.target.value }))}
            />
          </label>
          <label>
            <span>{text.end}</span>
            <input
              type="time"
              step={300}
              value={draft.endTime}
              onChange={(event) => setDraft((current) => ({ ...current, endTime: event.target.value }))}
            />
          </label>
          <div className="time-range-preview">
            <strong>{draft.startTime}</strong>
            <span />
            <strong>{draft.endTime}</strong>
          </div>
          {!isValid ? <p className="time-range-error">{text.invalid}</p> : null}
        </div>

        <div className="time-range-panel__actions">
          <button className="secondary-button" type="button" onClick={reset}>
            <RotateCcw aria-hidden="true" size={17} />
            <span>{text.reset}</span>
          </button>
          <button className="primary-button" type="button" disabled={!isValid} onClick={commit}>
            {text.done}
          </button>
        </div>
      </section>
    </div>
  )
}

export default TimeRangeSettings
