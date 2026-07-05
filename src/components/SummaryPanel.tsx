import type { PeopleNames, ScheduleCell } from '../types/schedule'

type SummaryPanelProps = {
  cells: ScheduleCell[]
  people: PeopleNames
}

const text = {
  legend: '\u56fe\u4f8b',
  notes: '\u4f7f\u7528\u8bf4\u660e',
  aliceCourse: '\u7684\u8bfe\u7a0b',
  bobCourse: '\u7684\u8bfe\u7a0b',
  sharedCourse: '\u4e24\u4eba\u5171\u6709\u7684\u8bfe\u7a0b',
  freeTime: '\u7a7a\u95f2\u65f6\u95f4',
  currentEmpty: '\u5f53\u524d\u7a7a\u95f2\u5355\u5143\u683c',
}

function SummaryPanel({ cells, people }: SummaryPanelProps) {
  const emptyCount = cells.filter((cell) => cell.tone === 'empty').length

  return (
    <section className="summary-panel summary-panel--compact">
      <div className="summary-block">
        <h2>{text.legend}</h2>
        <ul className="legend-list">
          <li><span className="legend-swatch legend-swatch--alice" />{people.alice} {text.aliceCourse}</li>
          <li><span className="legend-swatch legend-swatch--bob" />{people.bob} {text.bobCourse}</li>
          <li><span className="legend-swatch legend-swatch--shared" />{text.sharedCourse}</li>
          <li><span className="legend-swatch legend-swatch--empty" />{text.freeTime}</li>
        </ul>
      </div>
      <div className="summary-block">
        <h2>{text.notes}</h2>
        <ul className="note-list">
          <li>每天左侧是 {people.alice} 的课表，右侧是 {people.bob} 的课表。</li>
          <li>单周、双周课程会显示标签，每周课程不显示额外标签。</li>
          <li>共同课程使用第三种颜色，可在颜色设置中自定义。</li>
          <li>{text.currentEmpty}：{emptyCount} 个。</li>
        </ul>
      </div>
    </section>
  )
}

export default SummaryPanel
