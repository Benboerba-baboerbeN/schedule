import { Download, X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { normalizeExportFilename } from '../lib/storage'

type ExportConfirmDialogProps = {
  title: string
  onClose: () => void
  onConfirm: (filename: string) => void
}

function ExportConfirmDialog({ title, onClose, onConfirm }: ExportConfirmDialogProps) {
  useEscapeClose(onClose)

  const [isEditing, setIsEditing] = useState(false)
  const [draftFilename, setDraftFilename] = useState(title)

  const commitFilename = () => {
    setDraftFilename(normalizeExportFilename(draftFilename))
    setIsEditing(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commitFilename()
    }

    if (event.key === 'Escape') {
      setDraftFilename(title)
      setIsEditing(false)
    }
  }

  const handleConfirm = () => {
    onConfirm(normalizeExportFilename(draftFilename))
    onClose()
  }

  return (
    <div className="editor-backdrop" role="presentation">
      <section className="export-panel" aria-label="导出双人数据" aria-modal="true" role="dialog">
        <div className="editor-header export-panel__header">
          <div>
            <p className="eyebrow">导出</p>
            <h2>导出双人数据</h2>
            <p>将当前课表、人员名称、配色和时间范围保存为一个 JSON 文件；内部人员 ID 会加密保存。</p>
          </div>
          <button className="icon-button" type="button" aria-label="关闭导出菜单" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="export-panel__body">
          <div className="export-file-preview">
            <Download aria-hidden="true" size={24} />
            {isEditing ? (
              <input
                className="export-filename-input"
                autoFocus
                value={draftFilename}
                onBlur={commitFilename}
                onChange={(event) => setDraftFilename(event.target.value)}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <button className="export-filename" type="button" onDoubleClick={() => setIsEditing(true)}>
                {normalizeExportFilename(draftFilename)}
              </button>
            )}
            <span>双击文件名可以修改。之后可通过“导入双人数据”恢复两个人的课表、名称、配色和时间范围。</span>
          </div>
        </div>

        <div className="export-panel__actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary-button" type="button" onClick={handleConfirm}>
            确认导出
          </button>
        </div>
      </section>
    </div>
  )
}

export default ExportConfirmDialog
