import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  createCourse,
  validateCourseForm,
  type CourseFormValues,
} from '../lib/courseCrud'
import { useEscapeClose } from '../hooks/useEscapeClose'
import type { Course, PeopleNames } from '../types/schedule'

type CourseEditorMode = 'create' | 'edit'

type CourseEditorProps = {
  course?: Course
  mode: CourseEditorMode
  onClose: () => void
  onDelete: (courseId: string) => void
  people: PeopleNames
  onSave: (course: Course) => void
}

const text = {
  createTitle: '添加课程',
  editTitle: '编辑课程',
  owner: '所属人',
  title: '课程名',
  classroom: '教室',
  day: '星期',
  startTime: '开始时间',
  endTime: '结束时间',
  weekPattern: '周次',
  save: '保存',
  cancel: '取消',
  delete: '删除课程',
  everyWeek: '每周',
  oddWeek: '单周',
  evenWeek: '双周',
}

const defaultValues: CourseFormValues = {
  owner: 'alice',
  title: '',
  classroom: '',
  day: 1,
  startTime: '08:00',
  endTime: '09:50',
  weekPattern: 'all',
}

const toFormValues = (course?: Course): CourseFormValues =>
  course
    ? {
        owner: course.owner,
        title: course.title,
        classroom: course.classroom,
        day: course.day,
        startTime: course.startTime,
        endTime: course.endTime,
        weekPattern: course.weekPattern,
      }
    : defaultValues

function CourseEditor({ course, mode, onClose, onDelete, people, onSave }: CourseEditorProps) {
  useEscapeClose(onClose)

  const [values, setValues] = useState<CourseFormValues>(toFormValues(course))
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    setValues(toFormValues(course))
    setErrors([])
  }, [course])

  const updateValue = <Key extends keyof CourseFormValues>(key: Key, value: CourseFormValues[Key]) => {
    setValues((currentValues) => ({ ...currentValues, [key]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateCourseForm(values)

    if (nextErrors.length > 0) {
      setErrors(nextErrors)
      return
    }

    const nextCourse = createCourse(values)

    onSave({
      ...nextCourse,
      id: course?.id ?? nextCourse.id,
      icon: course?.icon ?? nextCourse.icon,
    })
  }

  const handleDelete = () => {
    if (course) {
      onDelete(course.id)
    }
  }

  return (
    <div className="editor-backdrop" role="presentation">
      <section className="course-editor" aria-modal="true" role="dialog">
        <header className="editor-header">
          <div>
            <p className="eyebrow">{mode === 'create' ? text.createTitle : text.editTitle}</p>
            <h2>{values.title || text.createTitle}</h2>
          </div>
          <button className="icon-button" type="button" aria-label={text.cancel} onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <form className="editor-form" onSubmit={handleSubmit}>
          {errors.length > 0 ? (
            <div className="form-errors" role="alert">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          <label>
            <span>{text.owner}</span>
            <select
              value={values.owner}
              onChange={(event) => updateValue('owner', event.target.value as CourseFormValues['owner'])}
            >
              <option value="alice">{people.alice}</option>
              <option value="bob">{people.bob}</option>
            </select>
          </label>

          <label className="editor-field--wide">
            <span>{text.title}</span>
            <input
              value={values.title}
              onChange={(event) => updateValue('title', event.target.value)}
              placeholder={text.title}
            />
          </label>

          <label className="editor-field--wide">
            <span>{text.classroom}</span>
            <input
              value={values.classroom}
              onChange={(event) => updateValue('classroom', event.target.value)}
              placeholder={text.classroom}
            />
          </label>

          <label>
            <span>{text.day}</span>
            <select
              value={values.day}
              onChange={(event) => updateValue('day', Number(event.target.value))}
            >
              <option value={1}>周一</option>
              <option value={2}>周二</option>
              <option value={3}>周三</option>
              <option value={4}>周四</option>
              <option value={5}>周五</option>
              <option value={6}>周六</option>
              <option value={7}>周日</option>
            </select>
          </label>

          <label>
            <span>{text.startTime}</span>
            <input
              max="22:00"
              min="08:00"
              step="300"
              type="time"
              value={values.startTime}
              onChange={(event) => updateValue('startTime', event.target.value)}
            />
          </label>

          <label>
            <span>{text.endTime}</span>
            <input
              max="22:00"
              min="08:00"
              step="300"
              type="time"
              value={values.endTime}
              onChange={(event) => updateValue('endTime', event.target.value)}
            />
          </label>

          <label>
            <span>{text.weekPattern}</span>
            <select
              value={values.weekPattern}
              onChange={(event) =>
                updateValue('weekPattern', event.target.value as CourseFormValues['weekPattern'])
              }
            >
              <option value="all">{text.everyWeek}</option>
              <option value="odd">{text.oddWeek}</option>
              <option value="even">{text.evenWeek}</option>
            </select>
          </label>

          <footer className="editor-actions">
            {mode === 'edit' && course ? (
              <button className="danger-button" type="button" onClick={handleDelete}>
                {text.delete}
              </button>
            ) : null}
            <button className="secondary-button" type="button" onClick={onClose}>
              {text.cancel}
            </button>
            <button className="primary-button" type="submit">
              {text.save}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default CourseEditor
