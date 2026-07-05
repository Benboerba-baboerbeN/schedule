import {
  CalendarPlus,
  Download,
  FileJson,
  FileUp,
  Palette,
  RotateCcw,
  Settings2,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useEffect, useState, type KeyboardEvent } from 'react'
import type { Owner, PeopleNames } from '../types/schedule'

type ToolbarProps = {
  onAddCourse: () => void
  onOpenColors: () => void
  onOpenExportState: () => void
  onOpenImportCourse: (owner: Owner) => void
  onOpenImportData: () => void
  onOpenTimeRange: () => void
  onRestorePrevious: () => void
  onReset: () => void
  onClear: () => void
  onPeopleChange: (people: PeopleNames) => void
  people: PeopleNames
  title: string
}

const text = {
  addCourse: '添加课程',
  colors: '颜色设置',
  timeSlots: '时间段',
  clear: '清空',
  reset: '重置示例课表',
  restore: '恢复上次保存',
  titleHint: '双击名字修改',
}

function EditablePersonName({
  owner,
  people,
  onPeopleChange,
}: {
  owner: Owner
  people: PeopleNames
  onPeopleChange: (people: PeopleNames) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(people[owner])

  useEffect(() => {
    setDraft(people[owner])
  }, [owner, people])

  const commit = () => {
    const nextName = draft.trim() || people[owner]
    onPeopleChange({ ...people, [owner]: nextName })
    setDraft(nextName)
    setIsEditing(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commit()
    }

    if (event.key === 'Escape') {
      setDraft(people[owner])
      setIsEditing(false)
    }
  }

  return isEditing ? (
    <input
      className="person-title-input"
      autoFocus
      value={draft}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKeyDown}
    />
  ) : (
    <button
      className={`person-title person-title--${owner}`}
      type="button"
      title={text.titleHint}
      onDoubleClick={() => setIsEditing(true)}
    >
      {people[owner]}
    </button>
  )
}

function Toolbar({
  onAddCourse,
  onOpenColors,
  onOpenExportState,
  onOpenImportCourse,
  onOpenImportData,
  onOpenTimeRange,
  onRestorePrevious,
  onReset,
  onClear,
  onPeopleChange,
  people,
  title,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div>
        <h1 className="schedule-title" aria-label={title}>
          <span className="title-quote">“</span>
          <EditablePersonName owner="alice" people={people} onPeopleChange={onPeopleChange} />
          <span className="title-quote">”</span>
          <span className="title-separator">&amp;</span>
          <span className="title-quote">“</span>
          <EditablePersonName owner="bob" people={people} onPeopleChange={onPeopleChange} />
          <span className="title-quote">”</span>
          <span className="title-suffix">的课表</span>
        </h1>
      </div>
      <div className="toolbar-actions">
        <button className="tool-button" type="button" onClick={() => onOpenImportCourse('alice')}>
          <FileUp aria-hidden="true" size={17} />
          <span>{`导入${people.alice}的课程表`}</span>
        </button>
        <button className="tool-button" type="button" onClick={() => onOpenImportCourse('bob')}>
          <FileUp aria-hidden="true" size={17} />
          <span>{`导入${people.bob}的课程表`}</span>
        </button>
        <button className="tool-button" type="button" onClick={onOpenImportData}>
          <FileJson aria-hidden="true" size={17} />
          <span>导入双人数据</span>
        </button>
        <button className="tool-button" type="button" onClick={onOpenExportState}>
          <Download aria-hidden="true" size={17} />
          <span>导出双人数据</span>
        </button>
        <button className="tool-button" type="button" onClick={onAddCourse}>
          <CalendarPlus aria-hidden="true" size={17} />
          <span>{text.addCourse}</span>
        </button>
        <button className="tool-button" type="button" onClick={onOpenColors}>
          <Palette aria-hidden="true" size={17} />
          <span>{text.colors}</span>
        </button>
        <button className="tool-button" type="button" onClick={onOpenTimeRange}>
          <Settings2 aria-hidden="true" size={17} />
          <span>{text.timeSlots}</span>
        </button>
        <button className="tool-button" type="button" onClick={onClear}>
          <Trash2 aria-hidden="true" size={17} />
          <span>{text.clear}</span>
        </button>
        <button className="tool-button" type="button" onClick={onRestorePrevious}>
          <Undo2 aria-hidden="true" size={17} />
          <span>{text.restore}</span>
        </button>
        <button className="icon-button" type="button" aria-label={text.reset} onClick={onReset}>
          <RotateCcw aria-hidden="true" size={18} />
        </button>
      </div>
    </header>
  )
}

export default Toolbar
