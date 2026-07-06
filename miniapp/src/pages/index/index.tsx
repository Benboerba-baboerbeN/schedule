import { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Button, Canvas, Input, Picker, ScrollView, Text, View } from '@tarojs/components'
import { courses as defaultCourses, weekDays } from '@shared/data/mockSchedule'
import { defaultAppStyle, defaultFontByStyle } from '@shared/lib/appStyle'
import { deleteCourse, getEntryIcon, upsertCourse } from '@shared/lib/courseCrud'
import { parsePlainIcsCourses } from '@shared/lib/plainIcsParser'
import { createDefaultPeopleIds, createScheduleTitle, defaultPeopleNames, normalizePeopleNames, ownerOrder } from '@shared/lib/people'
import {
  defaultTimeRange,
  findCourseIssues,
  getCourseTimelinePlacement,
  getWeekPatternLabel,
  isCourseInTimeRange,
  timelineRowCount,
  timeToMinutes,
} from '@shared/lib/schedule'
import {
  createExportFilename,
  createSavedScheduleState,
  normalizeExportFilename,
  parseScheduleState,
  serializeExportScheduleState,
  type SavedScheduleState,
} from '@shared/lib/storage'
import { defaultScheduleTheme, getDefaultScheduleTheme, mergeScheduleTheme } from '@shared/lib/theme'
import type { AppFont, AppStyle, Course, CourseEntryType, CourseTone, Owner, PeopleIds, PeopleNames, ScheduleTheme, TimeRange, WeekPattern } from '@shared/types/schedule'
import { exportScheduleCanvas } from '../../utils/canvasExport'
import { chooseTextFile, writeAndShareTextFile } from '../../utils/files'
import { miniStorage } from '../../utils/storage'
import './index.css'

type Dialog =
  | 'course'
  | 'colors'
  | 'style'
  | 'time'
  | 'image'
  | 'name'
  | null

type ConfirmAction = 'clear' | 'reset' | 'importData' | null

type CourseDraft = {
  id: string
  owner: Owner
  entryType: CourseEntryType
  title: string
  classroom: string
  day: number
  startTime: string
  endTime: string
  weekPattern: WeekPattern
  icon: string
}

type ImageRatioId = 'auto' | '1-1' | '4-3' | '16-9' | 'custom'

const rowHeight = 8
const headerHeight = 88
const timeAxisWidth = 92
const dayWidth = 210
const imageRatioOptions: Array<{ id: ImageRatioId; label: string; ratio: number | null }> = [
  { id: 'auto', label: '默认', ratio: null },
  { id: '1-1', label: '1:1', ratio: 1 },
  { id: '4-3', label: '4:3', ratio: 4 / 3 },
  { id: '16-9', label: '16:9', ratio: 16 / 9 },
  { id: 'custom', label: '自定义', ratio: null },
]

const createDefaultState = () =>
  createSavedScheduleState(createScheduleTitle(defaultPeopleNames), defaultCourses, {
    people: defaultPeopleNames,
    peopleIds: createDefaultPeopleIds(),
    appStyle: defaultAppStyle,
    appFont: 'style-default',
    theme: defaultScheduleTheme,
    timeRange: defaultTimeRange,
  })

const createCourseDraft = (course?: Course): CourseDraft => ({
  id: course?.id ?? `course-${Date.now()}`,
  owner: course?.owner ?? 'alice',
  entryType: course?.entryType ?? 'course',
  title: course?.title ?? '',
  classroom: course?.classroom ?? '',
  day: course?.day ?? 1,
  startTime: course?.startTime ?? '08:00',
  endTime: course?.endTime ?? '09:00',
  weekPattern: course?.weekPattern ?? 'all',
  icon: course?.icon ?? 'book',
})

const getCourseTone = (course: Course, courses: Course[]): CourseTone => {
  if ((course.entryType ?? 'course') === 'activity') {
    return 'activity'
  }

  const otherOwner = course.owner === 'alice' ? 'bob' : 'alice'
  const isShared = courses.some((otherCourse) =>
    otherCourse.owner === otherOwner &&
    otherCourse.day === course.day &&
    otherCourse.title === course.title &&
    otherCourse.startTime === course.startTime &&
    otherCourse.endTime === course.endTime,
  )

  return isShared ? 'shared' : course.owner
}

const getToneColors = (theme: ScheduleTheme, tone: CourseTone) => theme[tone]

const getRatioValue = (ratioId: ImageRatioId, customVertical: string, customHorizontal: string) => {
  if (ratioId === 'custom') {
    const vertical = Number(customVertical)
    const horizontal = Number(customHorizontal)
    return Number.isFinite(vertical) && Number.isFinite(horizontal) && vertical > 0 && horizontal > 0
      ? vertical / horizontal
      : null
  }

  return imageRatioOptions.find((option) => option.id === ratioId)?.ratio ?? null
}

function IndexPage() {
  const savedState = useMemo(() => {
    try {
      return miniStorage.load()
    } catch {
      return null
    }
  }, [])
  const [activeCourses, setActiveCourses] = useState<Course[]>(() => savedState?.courses ?? defaultCourses)
  const [people, setPeople] = useState<PeopleNames>(() => normalizePeopleNames(savedState?.people ?? defaultPeopleNames))
  const [peopleIds, setPeopleIds] = useState<PeopleIds>(() => savedState?.peopleIds ?? createDefaultPeopleIds())
  const [theme, setTheme] = useState<ScheduleTheme>(() => mergeScheduleTheme(savedState?.theme ?? defaultScheduleTheme))
  const [appStyle, setAppStyle] = useState<AppStyle>(() => savedState?.appStyle ?? defaultAppStyle)
  const [appFont, setAppFont] = useState<AppFont>(() => savedState?.appFont ?? 'style-default')
  const [timeRange, setTimeRange] = useState<TimeRange>(() => savedState?.timeRange ?? defaultTimeRange)
  const [importedBaseline, setImportedBaseline] = useState<SavedScheduleState | null>(() => {
    try {
      return miniStorage.loadImportedBaseline()
    } catch {
      return null
    }
  })
  const [dialog, setDialog] = useState<Dialog>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [pendingImportState, setPendingImportState] = useState<SavedScheduleState | null>(null)
  const [status, setStatus] = useState('')
  const [courseDraft, setCourseDraft] = useState<CourseDraft>(() => createCourseDraft())
  const [nameOwner, setNameOwner] = useState<Owner>('alice')
  const [nameDraft, setNameDraft] = useState('')
  const [imageRatioId, setImageRatioId] = useState<ImageRatioId>('auto')
  const [customVertical, setCustomVertical] = useState('4')
  const [customHorizontal, setCustomHorizontal] = useState('3')

  const scheduleTitle = useMemo(() => createScheduleTitle(people), [people])
  const rowCount = timelineRowCount(timeRange)
  const timelineHeight = rowCount * rowHeight
  const scheduleWidth = timeAxisWidth + dayWidth * 7
  const issues = useMemo(() => findCourseIssues(activeCourses), [activeCourses])

  useEffect(() => {
    miniStorage.save(createSavedScheduleState(scheduleTitle, activeCourses, {
      people,
      peopleIds,
      appStyle,
      appFont,
      theme,
      timeRange,
    }))
  }, [activeCourses, appFont, appStyle, people, peopleIds, scheduleTitle, theme, timeRange])

  const rememberImportedBaseline = (state: SavedScheduleState) => {
    setImportedBaseline(state)
    miniStorage.saveImportedBaseline(state)
  }

  const restoreState = (state: SavedScheduleState, message: string) => {
    setActiveCourses(state.courses)
    setPeople(normalizePeopleNames(state.people))
    setPeopleIds(state.peopleIds)
    setTheme(mergeScheduleTheme(state.theme))
    setAppStyle(state.appStyle)
    setAppFont(state.appFont)
    setTimeRange(state.timeRange)
    setDialog(null)
    setConfirmAction(null)
    setStatus(message)
  }

  const importCourse = async (owner: Owner) => {
    try {
      const file = await chooseTextFile(['ics'])
      const importedCourses = parsePlainIcsCourses(file.text, owner)

      if (importedCourses.length === 0) {
        setStatus('没有识别到课程，请检查 .ics 文件。')
        return
      }

      const nextCourses = [
        ...activeCourses.filter((course) => course.owner !== owner),
        ...importedCourses,
      ]
      const baseline = createSavedScheduleState(scheduleTitle, nextCourses, {
        people,
        peopleIds,
        appStyle,
        appFont,
        theme,
        timeRange,
      })

      setActiveCourses(nextCourses)
      rememberImportedBaseline(baseline)
      setStatus(`${people[owner]} 课表导入完成：${importedCourses.length} 门。`)
    } catch {
      setStatus('导入失败，请选择有效的 .ics 文件。')
    }
  }

  const importData = async () => {
    try {
      const file = await chooseTextFile(['json'])
      const state = parseScheduleState(file.text)

      if (!state) {
        setStatus('导入失败，请选择有效的双人课表 JSON。')
        return
      }

      setPendingImportState(state)
      setConfirmAction('importData')
    } catch {
      setStatus('导入失败，请选择有效的双人课表 JSON。')
    }
  }

  const exportData = async () => {
    try {
      const state = createSavedScheduleState(scheduleTitle, activeCourses, {
        people,
        peopleIds,
        appStyle,
        appFont,
        theme,
        timeRange,
      })
      await writeAndShareTextFile(normalizeExportFilename(createExportFilename(scheduleTitle)), serializeExportScheduleState(state))
      setStatus('已生成双人课表数据文件。')
    } catch {
      setStatus('导出失败，请检查微信文件权限后重试。')
    }
  }

  const exportImage = async () => {
    const ratio = getRatioValue(imageRatioId, customVertical, customHorizontal)

    if (imageRatioId === 'custom' && ratio === null) {
      setStatus('自定义比例需要填写大于 0 的竖向和横向数值。')
      return
    }

    try {
      const path = await exportScheduleCanvas({
        canvasId: 'scheduleExportCanvas',
        courses: activeCourses,
        people,
        theme,
        timeRange,
        ratio,
      })
      await Taro.previewImage({ urls: [path] })
      setStatus('已生成课表图片，可长按保存。')
      setDialog(null)
    } catch {
      setStatus('导出图片失败，请稍后重试。')
    }
  }

  const saveCourse = () => {
    if (!courseDraft.title.trim()) {
      setStatus(courseDraft.entryType === 'activity' ? '活动名称不能为空。' : '课程名称不能为空。')
      return
    }

    setActiveCourses((currentCourses) => upsertCourse(currentCourses, {
      ...courseDraft,
      title: courseDraft.title.trim(),
      classroom: courseDraft.classroom.trim(),
      icon: getEntryIcon(courseDraft.title, courseDraft.entryType),
    }))
    setDialog(null)
    setStatus(courseDraft.entryType === 'activity' ? '活动已保存。' : '课程已保存。')
  }

  const deleteDraftCourse = () => {
    setActiveCourses((currentCourses) => deleteCourse(currentCourses, courseDraft.id))
    setDialog(null)
    setStatus(courseDraft.entryType === 'activity' ? '活动已删除。' : '课程已删除。')
  }

  const applyConfirm = () => {
    if (confirmAction === 'clear') {
      setActiveCourses([])
      setConfirmAction(null)
      setStatus('已清空当前课表。')
      return
    }

    if (confirmAction === 'reset') {
      restoreState(importedBaseline ?? createDefaultState(), importedBaseline ? '已恢复到导入课表后的初始状态。' : '已恢复到初始默认网页。')
      return
    }

    if (confirmAction === 'importData' && pendingImportState) {
      restoreState(pendingImportState, `已导入 ${pendingImportState.title}。`)
      rememberImportedBaseline(pendingImportState)
      setPendingImportState(null)
    }
  }

  const changeStyle = (style: AppStyle) => {
    setAppStyle(style)
    setAppFont(defaultFontByStyle[style])
    setTheme(getDefaultScheduleTheme(style))
  }

  const openNameEditor = (owner: Owner) => {
    setNameOwner(owner)
    setNameDraft(people[owner])
    setDialog('name')
  }

  return (
    <View className={`mini-page mini-page--${appStyle} mini-page--font-${appFont}`}>
      <View className="mini-toolbar">
        <View className="mini-title">
          <Text>"</Text>
          <Text className="mini-title__name" onClick={() => openNameEditor('alice')}>{people.alice}</Text>
          <Text>" & "</Text>
          <Text className="mini-title__name" onClick={() => openNameEditor('bob')}>{people.bob}</Text>
          <Text>" 的课表</Text>
        </View>
        <View className="mini-actions">
          <Button onClick={() => importCourse('alice')}>导入{people.alice}</Button>
          <Button onClick={() => importCourse('bob')}>导入{people.bob}</Button>
          <Button onClick={importData}>导入双人</Button>
          <Button onClick={exportData}>导出数据</Button>
          <Button onClick={() => setConfirmAction('reset')}>恢复默认</Button>
          <Button onClick={() => { setCourseDraft(createCourseDraft()); setDialog('course') }}>添加课程活动</Button>
          <Button onClick={() => setDialog('colors')}>颜色设置</Button>
          <Button onClick={() => setDialog('style')}>风格选项</Button>
          <Button onClick={() => setDialog('time')}>时间范围</Button>
          <Button className="mini-actions__image" onClick={() => setDialog('image')}>导出图片</Button>
        </View>
      </View>

      {status ? <View className="mini-status">{status}</View> : null}
      {issues.length > 0 ? <View className="mini-status mini-status--error">发现 {issues.length} 处同一人的重复或重叠课程，请检查课程文件或手动更改。</View> : null}

      <ScrollView scrollX className="schedule-scroll">
        <View className="mini-schedule" style={{ width: `${scheduleWidth}px` }}>
          <View className="mini-schedule__header" style={{ height: `${headerHeight}px` }}>
            <View className="mini-time-head" style={{ width: `${timeAxisWidth}px` }}>时间</View>
            {weekDays.map((weekDay) => (
              <View className="mini-day-head" key={weekDay.day} style={{ width: `${dayWidth}px` }}>
                <Text>{weekDay.label}</Text>
                <View className="mini-person-heads">
                  {ownerOrder.map((owner) => (
                    <View
                      className={`mini-person-head mini-person-head--${owner}`}
                      key={owner}
                      style={{
                        backgroundColor: owner === 'alice' ? theme.alice.headerBackground : theme.bob.headerBackground,
                        color: owner === 'alice' ? theme.alice.headerText : theme.bob.headerText,
                      }}
                    >
                      {people[owner].slice(0, 5)}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
          <View className="mini-schedule__body" style={{ height: `${timelineHeight}px` }}>
            <View className="mini-time-axis" style={{ width: `${timeAxisWidth}px`, height: `${timelineHeight}px` }}>
              {Array.from({ length: rowCount + 1 }, (_, index) => {
                const minutes = timeToMinutes(timeRange.startTime) + index * timeRange.stepMinutes
                const isHour = minutes % 60 === 0
                return isHour ? (
                  <Text className="mini-hour" key={minutes} style={{ top: `${index * rowHeight - 10}px` }}>
                    {`${Math.floor(minutes / 60).toString().padStart(2, '0')}:00`}
                  </Text>
                ) : null
              })}
            </View>
            {weekDays.map((weekDay) => (
              <View className="mini-day-column" key={weekDay.day} style={{ width: `${dayWidth}px`, height: `${timelineHeight}px` }}>
                {ownerOrder.map((owner) => (
                  <View className="mini-lane" key={owner} style={{ width: `${dayWidth / 2}px`, height: `${timelineHeight}px` }}>
                    {activeCourses
                      .filter((course) => course.day === weekDay.day && course.owner === owner && isCourseInTimeRange(course, timeRange))
                      .map((course) => {
                        const placement = getCourseTimelinePlacement(course.startTime, course.endTime, timeRange)
                        const tone = getCourseTone(course, activeCourses)
                        const colors = getToneColors(theme, tone)
                        return (
                          <View
                            className="mini-course"
                            key={course.id}
                            style={{
                              top: `${(placement.rowStart - 1) * rowHeight + 4}px`,
                              height: `${Math.max(24, placement.rowSpan * rowHeight - 8)}px`,
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                              color: colors.text,
                            }}
                            onClick={() => { setCourseDraft(createCourseDraft(course)); setDialog('course') }}
                          >
                            <Text className="mini-course__title">{course.title}</Text>
                            <Text>{course.startTime}-{course.endTime}</Text>
                            <Text>{course.classroom}</Text>
                            {getWeekPatternLabel(course.weekPattern) ? <Text className="mini-course__week">{getWeekPatternLabel(course.weekPattern)}</Text> : null}
                          </View>
                        )
                      })}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="mini-summary">
        <Text>图例</Text>
        <Text style={{ color: theme.alice.text }}> {people.alice} </Text>
        <Text style={{ color: theme.bob.text }}> {people.bob} </Text>
        <Text style={{ color: theme.shared.text }}> 共同课程 </Text>
        <Text style={{ color: theme.activity.text }}> 活动 </Text>
      </View>

      {dialog ? (
        <View className="mini-modal">
          <View className="mini-modal__panel">
            <View className="mini-modal__header">
              <Text>{dialog === 'course' ? '添加课程活动' : dialog === 'colors' ? '颜色设置' : dialog === 'style' ? '风格选项' : dialog === 'time' ? '时间范围' : dialog === 'image' ? '导出图片' : '修改名称'}</Text>
              <Button onClick={() => setDialog(null)}>关闭</Button>
            </View>

            {dialog === 'course' ? (
              <View className="mini-form">
                <Picker mode="selector" range={['添加课程', '添加活动']} value={courseDraft.entryType === 'activity' ? 1 : 0} onChange={(event) => setCourseDraft({ ...courseDraft, entryType: Number(event.detail.value) === 1 ? 'activity' : 'course' })}>
                  <View className="mini-field">类型：{courseDraft.entryType === 'activity' ? '添加活动' : '添加课程'}</View>
                </Picker>
                <Picker mode="selector" range={[people.alice, people.bob]} value={courseDraft.owner === 'alice' ? 0 : 1} onChange={(event) => setCourseDraft({ ...courseDraft, owner: Number(event.detail.value) === 0 ? 'alice' : 'bob' })}>
                  <View className="mini-field">归属：{courseDraft.owner === 'alice' ? people.alice : people.bob}</View>
                </Picker>
                <Input value={courseDraft.title} placeholder={courseDraft.entryType === 'activity' ? '活动名称，例如组会、实验' : '课程名称'} onInput={(event) => setCourseDraft({ ...courseDraft, title: String(event.detail.value) })} />
                <Input value={courseDraft.classroom} placeholder={courseDraft.entryType === 'activity' ? '地点，例如会议室、实验室' : '教室'} onInput={(event) => setCourseDraft({ ...courseDraft, classroom: String(event.detail.value) })} />
                <Picker mode="selector" range={weekDays.map((day) => day.label)} value={courseDraft.day - 1} onChange={(event) => setCourseDraft({ ...courseDraft, day: Number(event.detail.value) + 1 })}>
                  <View className="mini-field">星期：{weekDays[courseDraft.day - 1]?.label}</View>
                </Picker>
                <Input value={courseDraft.startTime} placeholder="开始时间 08:00" onInput={(event) => setCourseDraft({ ...courseDraft, startTime: String(event.detail.value) })} />
                <Input value={courseDraft.endTime} placeholder="结束时间 09:00" onInput={(event) => setCourseDraft({ ...courseDraft, endTime: String(event.detail.value) })} />
                <Picker mode="selector" range={['每周', '单周', '双周']} value={courseDraft.weekPattern === 'all' ? 0 : courseDraft.weekPattern === 'odd' ? 1 : 2} onChange={(event) => {
                  const patterns: WeekPattern[] = ['all', 'odd', 'even']
                  setCourseDraft({ ...courseDraft, weekPattern: patterns[Number(event.detail.value)] })
                }}>
                  <View className="mini-field">周次：{getWeekPatternLabel(courseDraft.weekPattern) || '每周'}</View>
                </Picker>
                <View className="mini-modal__actions">
                  <Button onClick={deleteDraftCourse}>{courseDraft.entryType === 'activity' ? '删除活动' : '删除课程'}</Button>
                  <Button onClick={saveCourse}>保存</Button>
                </View>
              </View>
            ) : null}

            {dialog === 'name' ? (
              <View className="mini-form">
                <Input value={nameDraft} placeholder="姓名" onInput={(event) => setNameDraft(String(event.detail.value))} />
                <Button onClick={() => { setPeople({ ...people, [nameOwner]: nameDraft.trim() || people[nameOwner] }); setDialog(null) }}>保存名称</Button>
              </View>
            ) : null}

            {dialog === 'colors' ? (
              <View className="mini-form">
                {([
                  ['alice', people.alice],
                  ['bob', people.bob],
                  ['shared', '共同课程'],
                  ['activity', '活动'],
                ] as Array<[CourseTone, string]>).map(([tone, label]) => (
                  <View className="mini-color-row" key={tone}>
                    <Text>{label}</Text>
                    {['#fff2b8', '#dce6ff', '#ffe0dc', '#f0f9f4'].map((color) => (
                      <Button
                        key={color}
                        style={{ backgroundColor: color }}
                        onClick={() => setTheme({
                          ...theme,
                          [tone]: {
                            ...theme[tone],
                            background: color,
                          },
                        })}
                      />
                    ))}
                  </View>
                ))}
              </View>
            ) : null}

            {dialog === 'style' ? (
              <View className="mini-form">
                {(['bauhaus', 'classic', 'paper'] as AppStyle[]).map((style) => (
                  <Button key={style} onClick={() => changeStyle(style)}>
                    {style === 'bauhaus' ? '几何海报' : style === 'classic' ? '清爽简约' : '手作纸张'}
                  </Button>
                ))}
                <View className="mini-section-title">全局字体</View>
                {([
                  ['style-default', '跟随风格'],
                  ['system-sans', '系统黑体'],
                  ['serif', '宋体风格'],
                  ['rounded', '圆润字体'],
                  ['handwritten', '手写感'],
                ] as Array<[AppFont, string]>).map(([font, label]) => (
                  <Button key={font} onClick={() => setAppFont(font)}>
                    {label}
                  </Button>
                ))}
              </View>
            ) : null}

            {dialog === 'time' ? (
              <View className="mini-form">
                <Input value={timeRange.startTime} placeholder="开始时间" onInput={(event) => setTimeRange({ ...timeRange, startTime: String(event.detail.value) })} />
                <Input value={timeRange.endTime} placeholder="结束时间" onInput={(event) => setTimeRange({ ...timeRange, endTime: String(event.detail.value) })} />
              </View>
            ) : null}

            {dialog === 'image' ? (
              <View className="mini-form">
                <Picker mode="selector" range={imageRatioOptions.map((option) => option.label)} value={imageRatioOptions.findIndex((option) => option.id === imageRatioId)} onChange={(event) => setImageRatioId(imageRatioOptions[Number(event.detail.value)].id)}>
                  <View className="mini-field">比例：{imageRatioOptions.find((option) => option.id === imageRatioId)?.label}</View>
                </Picker>
                {imageRatioId === 'custom' ? (
                  <View className="mini-ratio-inputs">
                    <Input value={customVertical} type="number" onInput={(event) => setCustomVertical(String(event.detail.value))} />
                    <Text>:</Text>
                    <Input value={customHorizontal} type="number" onInput={(event) => setCustomHorizontal(String(event.detail.value))} />
                  </View>
                ) : null}
                <Button onClick={exportImage}>生成图片</Button>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {confirmAction ? (
        <View className="mini-modal">
          <View className="mini-modal__panel">
            <View className="mini-modal__header">
              <Text>确认</Text>
              <Button onClick={() => setConfirmAction(null)}>关闭</Button>
            </View>
            <Text>{confirmAction === 'clear' ? '将清空当前所有课程。' : confirmAction === 'reset' ? '将恢复到导入初始状态或默认网页。' : '将导入双人数据并覆盖当前内容。'}</Text>
            <View className="mini-modal__actions">
              <Button onClick={() => setConfirmAction(null)}>取消</Button>
              <Button onClick={applyConfirm}>确认</Button>
            </View>
          </View>
        </View>
      ) : null}

      <Canvas canvasId="scheduleExportCanvas" className="mini-export-canvas" />
    </View>
  )
}

export default IndexPage
