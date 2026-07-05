import { AlertTriangle, X } from 'lucide-react'
import { useEscapeClose } from '../hooks/useEscapeClose'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmText: string
  tone?: 'danger' | 'primary'
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmDialog({
  title,
  description,
  confirmText,
  tone = 'primary',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEscapeClose(onCancel)

  return (
    <div className="editor-backdrop" role="presentation">
      <section className="confirm-panel" aria-label={title} aria-modal="true" role="dialog">
        <div className="editor-header confirm-panel__header">
          <div>
            <p className="eyebrow">确认</p>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="关闭确认菜单" onClick={onCancel}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="confirm-panel__body">
          <AlertTriangle aria-hidden="true" size={24} />
          <p>{description}</p>
        </div>

        <div className="confirm-panel__actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            取消
          </button>
          <button
            className={tone === 'danger' ? 'danger-confirm-button' : 'primary-button'}
            type="button"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmDialog
