import { Check, X } from 'lucide-react'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { appStyleOptions } from '../lib/appStyle'
import type { AppStyle } from '../types/schedule'

type StyleSettingsProps = {
  value: AppStyle
  onChange: (style: AppStyle) => void
  onClose: () => void
}

function StyleSettings({ value, onChange, onClose }: StyleSettingsProps) {
  useEscapeClose(onClose)

  return (
    <div className="editor-backdrop" role="presentation">
      <section className="style-panel" aria-label="风格选项" aria-modal="true" role="dialog">
        <div className="editor-header style-panel__header">
          <div>
            <p className="eyebrow">风格</p>
            <h2>风格选项</h2>
            <p>选择课表界面的整体视觉风格，不会改变课程数据。</p>
          </div>
          <button className="icon-button" type="button" aria-label="关闭风格选项" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="style-panel__body">
          {appStyleOptions.map((option) => (
            <button
              className={`style-option ${value === option.id ? 'style-option--active' : ''}`}
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
            >
              <span className={`style-option__preview style-option__preview--${option.id}`} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>
                <strong>{option.name}</strong>
                <small>{option.description}</small>
              </span>
              {value === option.id ? <Check aria-hidden="true" size={18} /> : null}
            </button>
          ))}
        </div>

        <div className="style-panel__actions">
          <button className="primary-button" type="button" onClick={onClose}>
            完成
          </button>
        </div>
      </section>
    </div>
  )
}

export default StyleSettings
