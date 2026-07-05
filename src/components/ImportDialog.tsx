import { FileJson, FileUp, UploadCloud, X } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { useEscapeClose } from '../hooks/useEscapeClose'

type ImportDialogProps = {
  accept: string
  description: string
  formatHint: string
  sourceHint: string
  title: string
  onClose: () => void
  onFile: (file: File) => Promise<void> | void
}

const isAllowedFile = (file: File, accept: string) => {
  const filename = file.name.toLowerCase()

  if (accept.includes('.ics') && filename.endsWith('.ics')) {
    return true
  }

  if (accept.includes('.json') && filename.endsWith('.json')) {
    return true
  }

  return false
}

function ImportDialog({
  accept,
  description,
  formatHint,
  sourceHint,
  title,
  onClose,
  onFile,
}: ImportDialogProps) {
  useEscapeClose(onClose)

  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const Icon = accept.includes('.json') ? FileJson : FileUp

  const importFile = async (file?: File) => {
    if (!file || isImporting) {
      return
    }

    if (!isAllowedFile(file, accept)) {
      setError(`文件格式不正确，请上传 ${formatHint} 文件。`)
      return
    }

    setError('')
    setIsImporting(true)

    try {
      await onFile(file)
      onClose()
    } catch {
      setError('导入失败，请检查文件内容后重试。')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setIsDragging(false)
    void importFile(event.dataTransfer.files[0])
  }

  return (
    <div className="editor-backdrop" role="presentation">
      <section className="import-panel" aria-label={title} aria-modal="true" role="dialog">
        <div className="editor-header import-panel__header">
          <div>
            <p className="eyebrow">导入</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button className="icon-button" type="button" aria-label="关闭导入菜单" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="import-panel__body">
          <button
            className={[
              'drop-zone',
              isDragging ? 'drop-zone--active' : '',
            ].filter(Boolean).join(' ')}
            type="button"
            disabled={isImporting}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <UploadCloud aria-hidden="true" size={32} />
            <strong>{isImporting ? '正在导入...' : '拖拽文件到这里，或点击选择文件'}</strong>
            <span>{formatHint}</span>
          </button>
          <input
            ref={inputRef}
            accept={accept}
            className="sr-only-file"
            type="file"
            onChange={(event) => void importFile(event.target.files?.[0])}
          />

          {error ? <p className="import-panel__error">{error}</p> : null}

          <div className="import-tips">
            <div>
              <Icon aria-hidden="true" size={18} />
              <span>{formatHint}</span>
            </div>
            <p>{sourceHint}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ImportDialog
