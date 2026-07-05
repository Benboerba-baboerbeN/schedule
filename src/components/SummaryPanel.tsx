import { weekDays } from '../data/mockSchedule'
import type { Course, PeopleNames, ScheduleCell, TimeSlot } from '../types/schedule'

type SharedCourse = {
  day: number
  slotId: string
  course: Course
}

type SummaryPanelProps = {
  cells: ScheduleCell[]
  people: PeopleNames
  sharedCourses: SharedCourse[]
  timeSlots: TimeSlot[]
}

const dayLabel = (day: number) => weekDays.find((item) => item.day === day)?.label ?? ''

const slotLabel = (slotId: string, timeSlots: TimeSlot[]) => {
  const slot = timeSlots.find((item) => item.id === slotId)
  return slot ? `${slot.startTime}-${slot.endTime}` : ''
}

function SummaryPanel({ cells, people, sharedCourses, timeSlots }: SummaryPanelProps) {
  const emptyCount = cells.filter((cell) => cell.tone === 'empty').length

  return (
    <section className="summary-panel">
      <div className="summary-block">
        <h2>图例</h2>
        <ul className="legend-list">
          <li><span className="legend-swatch legend-swatch--alice" />{people.alice} 的课程</li>
          <li><span className="legend-swatch legend-swatch--bob" />{people.bob} 的课程</li>
          <li><span className="legend-swatch legend-swatch--shared" />两人共有的课程</li>
          <li><span className="legend-swatch legend-swatch--empty" />空闲时间</li>
        </ul>
      </div>
      <div className="summary-block summary-block--wide">
        <h2>本周课程相交时间</h2>
        <ul className="shared-list">
          {sharedCourses.map((item) => (
            <li key={`${item.day}-${item.slotId}-${item.course.id}`}>
              <span>{dayLabel(item.day)} {slotLabel(item.slotId, timeSlots)}</span>
              <strong>{item.course.title}</strong>
              <span>{item.course.classroom}</span>
            </li>
          ))}
        </ul>
        <p className="together-count">可一起上课：<strong>{sharedCourses.length}</strong> 段</p>
      </div>
      <div className="summary-block">
        <h2>使用说明</h2>
        <ul className="note-list">
          <li>每天左侧是 {people.alice} 的课表，右侧是 {people.bob} 的课表。</li>
          <li>单周、双周课程会显示标签，每周课程不显示额外标签。</li>
          <li>共同课程使用第三种颜色，可在颜色设置中自定义。</li>
          <li>当前空闲单元格：{emptyCount} 个。</li>
        </ul>
      </div>
    </section>
  )
}

export default SummaryPanel
