import { useEffect, useMemo, useState } from 'react'
import ColorSettings from './components/ColorSettings'
import ConfirmDialog from './components/ConfirmDialog'
import CourseEditor from './components/CourseEditor'
import ExportConfirmDialog from './components/ExportConfirmDialog'
import ImportDialog from './components/ImportDialog'
import ScheduleGrid from './components/ScheduleGrid'
import SummaryPanel from './components/SummaryPanel'
import TimeRangeSettings from './components/TimeRangeSettings'
import Toolbar from './components/Toolbar'
import { courses, timeSlots } from './data/mockSchedule'
import { deleteCourse, upsertCourse } from './lib/courseCrud'
import {
  decodeIcsFile,
  parseIcsCourses,
} from './lib/icsParser'
import { createDefaultPeopleIds, createScheduleTitle, defaultPeopleNames, normalizePeopleNames } from './lib/people'
import { buildScheduleCells, defaultTimeRange, findSharedCourses, mergeTimeSlots } from './lib/schedule'
import {
  createSavedScheduleState,
  createExportFilename,
  downloadScheduleFile,
  loadScheduleState,
  loadPreviousScheduleState,
  parseScheduleState,
  readTextFile,
  saveScheduleState,
} from './lib/storage'
import { createThemeStyle, defaultScheduleTheme, mergeScheduleTheme } from './lib/theme'
import type { Course, Owner, PeopleIds, PeopleNames } from './types/schedule'

const importText = {
  success: '\u5df2\u5bfc\u5165',
  importing: '正在导入',
  empty: '\u6ca1\u6709\u8bc6\u522b\u5230\u8bfe\u7a0b\uff0c\u8bf7\u68c0\u67e5 .ics \u6587\u4ef6',
  failed: '\u5bfc\u5165\u5931\u8d25\uff0c\u8bf7\u786e\u8ba4\u6587\u4ef6\u662f\u6709\u6548\u7684 .ics \u8bfe\u8868',
  cleared: '\u5df2\u6e05\u7a7a\u5f53\u524d\u8bfe\u8868',
  reset: '\u5df2\u6062\u590d\u793a\u4f8b\u8bfe\u8868',
  saved: '\u8bfe\u7a0b\u5df2\u4fdd\u5b58',
  deleted: '\u8bfe\u7a0b\u5df2\u5220\u9664',
  exported: '\u5df2\u5bfc\u51fa\u5f53\u524d\u8bfe\u8868\u6570\u636e',
  importedState: '\u5df2\u5bfc\u5165\u4fdd\u5b58\u7684\u8bfe\u8868\u6570\u636e',
  importStateFailed: '\u5bfc\u5165\u5931\u8d25\uff0c\u8bf7\u9009\u62e9\u6709\u6548\u7684\u8bfe\u8868 JSON \u6587\u4ef6',
}

type ImportStatus = {
  tone: 'info' | 'success' | 'error'
  message: string
}

type EditorState =
  | { mode: 'create'; course?: undefined }
  | { mode: 'edit'; course: Course }
  | null

type ImportDialogState =
  | { type: 'course'; owner: Owner }
  | { type: 'data' }
  | null

type ConfirmState =
  | { type: 'clear' }
  | { type: 'importData'; state: NonNullable<ReturnType<typeof parseScheduleState>>; fileName: string }
  | { type: 'restore'; state: NonNullable<ReturnType<typeof parseScheduleState>> }
  | null

function App() {
  const [savedState] = useState(() => loadScheduleState())
  const [activeCourses, setActiveCourses] = useState<Course[]>(() => savedState?.courses ?? courses)
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null)
  const [editorState, setEditorState] = useState<EditorState>(null)
  const [importDialogState, setImportDialogState] = useState<ImportDialogState>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [isColorSettingsOpen, setIsColorSettingsOpen] = useState(false)
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false)
  const [isTimeRangeSettingsOpen, setIsTimeRangeSettingsOpen] = useState(false)
  const [people, setPeople] = useState<PeopleNames>(() => normalizePeopleNames(savedState?.people ?? defaultPeopleNames))
  const [peopleIds, setPeopleIds] = useState<PeopleIds>(() => savedState?.peopleIds ?? createDefaultPeopleIds())
  const [scheduleTheme, setScheduleTheme] = useState(() =>
    mergeScheduleTheme(savedState?.theme ?? defaultScheduleTheme),
  )
  const [timeRange, setTimeRange] = useState(() => savedState?.timeRange ?? defaultTimeRange)
  const scheduleTitle = useMemo(() => createScheduleTitle(people), [people])
  const themeStyle = useMemo(() => createThemeStyle(scheduleTheme), [scheduleTheme])

  const visibleTimeSlots = useMemo(
    () => mergeTimeSlots(timeSlots, activeCourses),
    [activeCourses],
  )
  const scheduleCells = useMemo(
    () => buildScheduleCells(activeCourses, visibleTimeSlots),
    [activeCourses, visibleTimeSlots],
  )
  const sharedCourses = useMemo(() => findSharedCourses(scheduleCells), [scheduleCells])

  useEffect(() => {
    saveScheduleState(createSavedScheduleState(scheduleTitle, activeCourses, {
      people,
      peopleIds,
      theme: scheduleTheme,
      timeRange,
    }))
  }, [activeCourses, people, peopleIds, scheduleTheme, scheduleTitle, timeRange])

  const handleImport = async (owner: Owner, file: File) => {
    const ownerName = people[owner]
    setImportStatus({
      tone: 'info',
      message: `${importText.importing} ${ownerName} 课表：${file.name}`,
    })

    try {
      const icsText = await decodeIcsFile(file)
      const importedCourses = parseIcsCourses(icsText, owner)
      const replacedCount = activeCourses.filter((course) => course.owner === owner).length

      if (importedCourses.length === 0) {
        setImportStatus({
          tone: 'error',
          message: `${importText.empty}（${file.name}）`,
        })
        return
      }

      setActiveCourses((currentCourses) => [
        ...currentCourses.filter((course) => course.owner !== owner),
        ...importedCourses,
      ])
      setImportStatus(
        {
          tone: 'success',
          message: `${ownerName} 课表导入完成：识别 ${importedCourses.length} 门课程，已替换原有 ${replacedCount} 门。文件：${file.name}`,
        },
      )
    } catch {
      setImportStatus({
        tone: 'error',
        message: `${importText.failed}（${file.name}）`,
      })
    }
  }

  const handleReset = () => {
    setActiveCourses(courses)
    setPeople(defaultPeopleNames)
    setPeopleIds(createDefaultPeopleIds())
    setScheduleTheme(defaultScheduleTheme)
    setTimeRange(defaultTimeRange)
    setEditorState(null)
    setImportStatus({ tone: 'success', message: importText.reset })
  }

  const handleClear = () => {
    setConfirmState({ type: 'clear' })
  }

  const applyClear = () => {
    setActiveCourses([])
    setEditorState(null)
    setConfirmState(null)
    setImportStatus({ tone: 'success', message: importText.cleared })
  }

  const handleSaveCourse = (course: Course) => {
    setActiveCourses((currentCourses) => upsertCourse(currentCourses, course))
    setEditorState(null)
    setImportStatus({ tone: 'success', message: importText.saved })
  }

  const handleDeleteCourse = (courseId: string) => {
    setActiveCourses((currentCourses) => deleteCourse(currentCourses, courseId))
    setEditorState(null)
    setImportStatus({ tone: 'success', message: importText.deleted })
  }

  const handleExportState = (filename?: string) => {
    try {
      downloadScheduleFile(createSavedScheduleState(scheduleTitle, activeCourses, {
        people,
        peopleIds,
        theme: scheduleTheme,
        timeRange,
      }), filename)
      setImportStatus({ tone: 'success', message: importText.exported })
    } catch {
      setImportStatus({ tone: 'error', message: '导出失败，请检查浏览器下载权限后重试。' })
    }
  }

  const handleImportState = async (file: File) => {
    setImportStatus({
      tone: 'info',
      message: `${importText.importing} 保存文件：${file.name}`,
    })

    try {
      const raw = await readTextFile(file)
      const state = parseScheduleState(raw)

      if (!state) {
        setImportStatus({
          tone: 'error',
          message: `${importText.importStateFailed}（${file.name}）`,
        })
        return
      }

      setConfirmState({ type: 'importData', state, fileName: file.name })
      setImportStatus({
        tone: 'info',
        message: `已读取 ${state.title}，共 ${state.courses.length} 门课程。确认后会覆盖当前双人数据。`,
      })
    } catch {
      setImportStatus({
        tone: 'error',
        message: `${importText.importStateFailed}（${file.name}）`,
      })
    }
  }

  const applyImportedState = (state: NonNullable<ReturnType<typeof parseScheduleState>>, fileName: string) => {
    setPeople(normalizePeopleNames(state.people))
    setPeopleIds(state.peopleIds)
    setActiveCourses(state.courses)
    setScheduleTheme(mergeScheduleTheme(state.theme))
    setTimeRange(state.timeRange)
    setEditorState(null)
    setConfirmState(null)
    setImportStatus({
      tone: 'success',
      message: `${importText.importedState}：${state.title}，共 ${state.courses.length} 门课程。文件：${fileName}`,
    })
  }

  const handleRestorePrevious = () => {
    const previousState = loadPreviousScheduleState()

    if (!previousState) {
      setImportStatus({ tone: 'error', message: '没有找到可恢复的上一次自动保存。' })
      return
    }

    setConfirmState({ type: 'restore', state: previousState })
  }

  return (
    <main className="app-shell" style={themeStyle}>
      <Toolbar
        onAddCourse={() => setEditorState({ mode: 'create' })}
        onOpenColors={() => setIsColorSettingsOpen(true)}
        onOpenExportState={() => setIsExportConfirmOpen(true)}
        onOpenImportCourse={(owner) => setImportDialogState({ type: 'course', owner })}
        onOpenImportData={() => setImportDialogState({ type: 'data' })}
        onOpenTimeRange={() => setIsTimeRangeSettingsOpen(true)}
        onPeopleChange={setPeople}
        onRestorePrevious={handleRestorePrevious}
        onReset={handleReset}
        onClear={handleClear}
        people={people}
        title={scheduleTitle}
      />
      {importStatus ? (
        <p className={`import-status import-status--${importStatus.tone}`} aria-live="polite">
          {importStatus.message}
        </p>
      ) : null}
      <ScheduleGrid
        courses={activeCourses}
        people={people}
        timeRange={timeRange}
        onCourseClick={(course) => setEditorState({ mode: 'edit', course })}
      />
      <SummaryPanel
        cells={scheduleCells}
        people={people}
        sharedCourses={sharedCourses}
        timeSlots={visibleTimeSlots}
      />
      {editorState ? (
        <CourseEditor
          course={editorState.course}
          mode={editorState.mode}
          onClose={() => setEditorState(null)}
          onDelete={handleDeleteCourse}
          people={people}
          onSave={handleSaveCourse}
        />
      ) : null}
      {isColorSettingsOpen ? (
        <ColorSettings
          people={people}
          theme={scheduleTheme}
          onChange={setScheduleTheme}
          onClose={() => setIsColorSettingsOpen(false)}
        />
      ) : null}
      {importDialogState?.type === 'course' ? (
        <ImportDialog
          accept=".ics,text/calendar"
          description={`导入 ${people[importDialogState.owner]} 的个人课程表。导入后会替换该角色当前已有课程。`}
          formatHint="支持 .ics 日历文件"
          sourceHint="请从系统日程表、日历应用或 WakeUp 课程表中导出 .ics 文件。WakeUp 文件通常不包含用户 id，因此不会自动改名。"
          title={`导入${people[importDialogState.owner]}的课程表`}
          onClose={() => setImportDialogState(null)}
          onFile={(file) => handleImport(importDialogState.owner, file)}
        />
      ) : null}
      {importDialogState?.type === 'data' ? (
        <ImportDialog
          accept=".json,application/json"
          description="导入之前导出的双人课表数据。导入后会恢复两个人的课程、名称、配色和时间范围。"
          formatHint="支持 .json 双人数据文件"
          sourceHint="请使用本页面“导出双人数据”生成的 JSON 文件。"
          title="导入双人数据"
          onClose={() => setImportDialogState(null)}
          onFile={handleImportState}
        />
      ) : null}
      {isExportConfirmOpen ? (
        <ExportConfirmDialog
          title={createExportFilename(scheduleTitle)}
          onClose={() => setIsExportConfirmOpen(false)}
          onConfirm={handleExportState}
        />
      ) : null}
      {confirmState?.type === 'clear' ? (
        <ConfirmDialog
          title="清空当前课表"
          description="这会清空当前所有课程。清空前的内容会保留在上一次自动保存中，可稍后尝试恢复。"
          confirmText="确认清空"
          tone="danger"
          onCancel={() => setConfirmState(null)}
          onConfirm={applyClear}
        />
      ) : null}
      {confirmState?.type === 'importData' ? (
        <ConfirmDialog
          title="导入双人数据"
          description={`导入 ${confirmState.fileName} 会覆盖当前课程、名称、配色和时间范围。当前内容会保留在上一次自动保存中。`}
          confirmText="确认导入"
          onCancel={() => setConfirmState(null)}
          onConfirm={() => applyImportedState(confirmState.state, confirmState.fileName)}
        />
      ) : null}
      {confirmState?.type === 'restore' ? (
        <ConfirmDialog
          title="恢复上一次自动保存"
          description={`将恢复“${confirmState.state.title}”。当前内容会被新的自动保存记录替换。`}
          confirmText="确认恢复"
          onCancel={() => setConfirmState(null)}
          onConfirm={() => applyImportedState(confirmState.state, '上一次自动保存')}
        />
      ) : null}
      {isTimeRangeSettingsOpen ? (
        <TimeRangeSettings
          timeRange={timeRange}
          onChange={setTimeRange}
          onClose={() => setIsTimeRangeSettingsOpen(false)}
        />
      ) : null}
    </main>
  )
}

export default App




