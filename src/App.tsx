import { useEffect, useMemo, useState } from 'react'
import ColorSettings from './components/ColorSettings'
import ConfirmDialog from './components/ConfirmDialog'
import CourseEditor from './components/CourseEditor'
import ExportConfirmDialog from './components/ExportConfirmDialog'
import ExportImageDialog from './components/ExportImageDialog'
import ImportDialog from './components/ImportDialog'
import ScheduleGrid from './components/ScheduleGrid'
import StyleSettings from './components/StyleSettings'
import SummaryPanel from './components/SummaryPanel'
import TimeRangeSettings from './components/TimeRangeSettings'
import Toolbar from './components/Toolbar'
import { courses, timeSlots } from './data/mockSchedule'
import { deleteCourse, upsertCourse } from './lib/courseCrud'
import { defaultAppStyle, defaultFontByStyle, resolveFont } from './lib/appStyle'
import {
  decodeIcsFile,
  parseIcsCourses,
} from './lib/icsParser'
import { createDefaultPeopleIds, createScheduleTitle, defaultPeopleNames, normalizePeopleNames } from './lib/people'
import {
  buildScheduleCells,
  defaultTimeRange,
  findCourseIssues,
  mergeTimeSlots,
} from './lib/schedule'
import {
  createSavedScheduleState,
  createExportFilename,
  downloadScheduleFile,
  loadImportedBaselineState,
  loadScheduleState,
  parseScheduleState,
  readTextFile,
  saveImportedBaselineState,
  saveScheduleState,
} from './lib/storage'
import { createThemeStyle, defaultScheduleTheme, getDefaultScheduleTheme, mergeScheduleTheme } from './lib/theme'
import type { AppStyle, Course, Owner, PeopleIds, PeopleNames } from './types/schedule'

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
  | { type: 'reset' }
  | null

function App() {
  const [savedState] = useState(() => loadScheduleState())
  const [importedBaseline, setImportedBaseline] = useState(() => loadImportedBaselineState())
  const [activeCourses, setActiveCourses] = useState<Course[]>(() => savedState?.courses ?? courses)
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null)
  const [editorState, setEditorState] = useState<EditorState>(null)
  const [importDialogState, setImportDialogState] = useState<ImportDialogState>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [isColorSettingsOpen, setIsColorSettingsOpen] = useState(false)
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false)
  const [isExportImageOpen, setIsExportImageOpen] = useState(false)
  const [isStyleSettingsOpen, setIsStyleSettingsOpen] = useState(false)
  const [isTimeRangeSettingsOpen, setIsTimeRangeSettingsOpen] = useState(false)
  const [people, setPeople] = useState<PeopleNames>(() => normalizePeopleNames(savedState?.people ?? defaultPeopleNames))
  const [peopleIds, setPeopleIds] = useState<PeopleIds>(() => savedState?.peopleIds ?? createDefaultPeopleIds())
  const [scheduleTheme, setScheduleTheme] = useState(() =>
    mergeScheduleTheme(savedState?.theme ?? defaultScheduleTheme),
  )
  const [appStyle, setAppStyle] = useState(() => savedState?.appStyle ?? defaultAppStyle)
  const [appFont, setAppFont] = useState(() => savedState?.appFont ?? 'style-default')
  const [timeRange, setTimeRange] = useState(() => savedState?.timeRange ?? defaultTimeRange)
  const scheduleTitle = useMemo(() => createScheduleTitle(people), [people])
  const themeStyle = useMemo(
    () => ({
      ...createThemeStyle(scheduleTheme),
      '--app-font-family': resolveFont(appFont, appStyle),
    }),
    [appFont, appStyle, scheduleTheme],
  )

  const visibleTimeSlots = useMemo(
    () => mergeTimeSlots(timeSlots, activeCourses),
    [activeCourses],
  )
  const scheduleCells = useMemo(
    () => buildScheduleCells(activeCourses, visibleTimeSlots),
    [activeCourses, visibleTimeSlots],
  )
  const courseIssues = useMemo(() => findCourseIssues(activeCourses), [activeCourses])
  const courseIssueMessage =
    courseIssues.length > 0
      ? `发现 ${courseIssues.length} 处同一人的重复或重叠课程，请检查课程文件或手动更改。`
      : null

  useEffect(() => {
    saveScheduleState(createSavedScheduleState(scheduleTitle, activeCourses, {
      people,
      peopleIds,
      appStyle,
      appFont,
      theme: scheduleTheme,
      timeRange,
    }))
  }, [activeCourses, appFont, appStyle, people, peopleIds, scheduleTheme, scheduleTitle, timeRange])

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

      const nextCourses = [
        ...activeCourses.filter((course) => course.owner !== owner),
        ...importedCourses,
      ]
      const baseline = createSavedScheduleState(createScheduleTitle(people), nextCourses, {
        people,
        peopleIds,
        appStyle,
        appFont,
        theme: scheduleTheme,
        timeRange,
      })

      setActiveCourses(nextCourses)
      rememberImportedBaseline(baseline)
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

  const defaultBaselineState = () =>
    createSavedScheduleState(createScheduleTitle(defaultPeopleNames), courses, {
      people: defaultPeopleNames,
      peopleIds: createDefaultPeopleIds(),
      appStyle: defaultAppStyle,
      appFont: 'style-default',
      theme: defaultScheduleTheme,
      timeRange: defaultTimeRange,
    })

  const rememberImportedBaseline = (state: NonNullable<ReturnType<typeof parseScheduleState>>) => {
    setImportedBaseline(state)
    saveImportedBaselineState(state)
  }

  const restoreScheduleState = (
    state: NonNullable<ReturnType<typeof parseScheduleState>>,
    message: string,
  ) => {
    setPeople(normalizePeopleNames(state.people))
    setPeopleIds(state.peopleIds)
    setActiveCourses(state.courses)
    setAppStyle(state.appStyle)
    setAppFont(state.appFont)
    setScheduleTheme(mergeScheduleTheme(state.theme))
    setTimeRange(state.timeRange)
    setEditorState(null)
    setConfirmState(null)
    setImportStatus({ tone: 'success', message })
  }

  const handleReset = () => {
    setConfirmState({ type: 'reset' })
  }

  const applyReset = () => {
    const state = importedBaseline ?? defaultBaselineState()
    restoreScheduleState(
      state,
      importedBaseline
        ? `已恢复到最近一次导入课表后的初始状态：${state.title}`
        : '已恢复到初始默认网页',
    )
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
        appStyle,
        appFont,
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
    setAppStyle(state.appStyle)
    setAppFont(state.appFont)
    setScheduleTheme(mergeScheduleTheme(state.theme))
    setTimeRange(state.timeRange)
    setEditorState(null)
    setConfirmState(null)
    rememberImportedBaseline(state)
    setImportStatus({
      tone: 'success',
      message: `${importText.importedState}：${state.title}，共 ${state.courses.length} 门课程。文件：${fileName}`,
    })
  }

  const handleStyleChange = (style: AppStyle) => {
    setAppStyle(style)
    setAppFont(defaultFontByStyle[style])
    setScheduleTheme(getDefaultScheduleTheme(style))
  }

  return (
    <main className={`app-shell app-shell--${appStyle}`} style={themeStyle}>
      <Toolbar
        onAddCourse={() => setEditorState({ mode: 'create' })}
        onOpenColors={() => setIsColorSettingsOpen(true)}
        onOpenExportImage={() => setIsExportImageOpen(true)}
        onOpenExportState={() => setIsExportConfirmOpen(true)}
        onOpenImportCourse={(owner) => setImportDialogState({ type: 'course', owner })}
        onOpenImportData={() => setImportDialogState({ type: 'data' })}
        onOpenStyles={() => setIsStyleSettingsOpen(true)}
        onOpenTimeRange={() => setIsTimeRangeSettingsOpen(true)}
        onPeopleChange={setPeople}
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
      {courseIssueMessage ? (
        <p className="import-status import-status--error" aria-live="polite">
          {courseIssueMessage}
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
          appStyle={appStyle}
          font={appFont}
          theme={scheduleTheme}
          onFontChange={setAppFont}
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
      {isExportImageOpen ? (
        <ExportImageDialog
          appStyle={appStyle}
          courses={activeCourses}
          people={people}
          timeRange={timeRange}
          title={scheduleTitle}
          onClose={() => setIsExportImageOpen(false)}
          onStatus={(message, tone) => setImportStatus({ message, tone })}
        />
      ) : null}
      {isStyleSettingsOpen ? (
        <StyleSettings
          value={appStyle}
          onChange={handleStyleChange}
          onClose={() => setIsStyleSettingsOpen(false)}
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
      {confirmState?.type === 'reset' ? (
        <ConfirmDialog
          title="恢复初始状态"
          description={importedBaseline
            ? `将恢复到最近一次导入课表后的初始状态：“${importedBaseline.title}”。当前手动修改会被覆盖。`
            : '将恢复到初始默认网页。当前课程、名称、颜色、风格和时间范围会被默认内容覆盖。'}
          confirmText="确认恢复"
          onCancel={() => setConfirmState(null)}
          onConfirm={applyReset}
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




