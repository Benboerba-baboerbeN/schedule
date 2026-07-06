import { RotateCcw, X } from 'lucide-react'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { fontOptions } from '../lib/appStyle'
import { colorSchemePresets, findMatchingPresetId, getDefaultScheduleTheme } from '../lib/theme'
import type { AppFont, AppStyle, CourseTone, PeopleNames, ScheduleTheme, ToneColor } from '../types/schedule'

type ColorSettingsProps = {
  appStyle: AppStyle
  font: AppFont
  theme: ScheduleTheme
  people: PeopleNames
  onFontChange: (font: AppFont) => void
  onChange: (theme: ScheduleTheme) => void
  onClose: () => void
}

type ColorField = {
  key: keyof ToneColor
  label: string
}

const fields: ColorField[] = [
  { key: 'background', label: '课程底色' },
  { key: 'border', label: '边框颜色' },
  { key: 'text', label: '文字颜色' },
  { key: 'headerBackground', label: '表头底色' },
  { key: 'headerText', label: '表头文字' },
]

const tones: CourseTone[] = ['alice', 'bob', 'shared', 'activity']

function ColorSettings({ appStyle, font, theme, people, onFontChange, onChange, onClose }: ColorSettingsProps) {
  useEscapeClose(onClose)

  const updateTone = (tone: CourseTone, colors: ToneColor) => {
    onChange({
      ...theme,
      [tone]: colors,
    })
  }

  const updateColor = (tone: CourseTone, key: keyof ToneColor, value: string) => {
    updateTone(tone, {
      ...theme[tone],
      [key]: value,
    })
  }

  const applyPreset = (tone: CourseTone, presetId: string) => {
    const preset = colorSchemePresets.find((item) => item.id === presetId)

    if (preset) {
      updateTone(tone, preset.colors)
    }
  }
  const toneLabels: Record<CourseTone, string> = {
    alice: people.alice,
    bob: people.bob,
    shared: '共同课程',
    activity: '活动',
  }

  return (
    <div className="editor-backdrop" role="presentation">
      <section className="color-panel" aria-label="颜色设置" aria-modal="true" role="dialog">
        <div className="editor-header color-panel__header">
          <div>
            <h2>颜色设置</h2>
            <p>每个角色可选择一个热门色系，也可以在这里统一更改全局字体。</p>
          </div>
          <button className="icon-button" type="button" aria-label="关闭颜色设置" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="color-panel__body">
          {tones.map((tone) => {
            const selectedPreset = findMatchingPresetId(theme[tone])

            return (
              <div className={`color-group color-group--${tone}`} key={tone}>
                <div className="color-group__title">
                  <span className={`legend-swatch legend-swatch--${tone}`} />
                  <strong>{toneLabels[tone]}</strong>
                </div>

                <label className="scheme-picker">
                  <span>色系</span>
                  <select value={selectedPreset} onChange={(event) => applyPreset(tone, event.target.value)}>
                    <option value="custom">自定义</option>
                    {colorSchemePresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.name}</option>
                    ))}
                  </select>
                </label>

                <p className="scheme-description">
                  {selectedPreset === 'custom'
                    ? '当前为手动微调色。'
                    : colorSchemePresets.find((preset) => preset.id === selectedPreset)?.description}
                </p>

                <div className="color-fields">
                  {fields.map((field) => (
                    <label className="color-field" key={field.key}>
                      <span>{field.label}</span>
                      <input
                        type="color"
                        value={theme[tone][field.key]}
                        onChange={(event) => updateColor(tone, field.key, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="font-settings-card">
            <div className="color-group color-group--font">
              <div className="color-group__title">
                <strong>字体设置</strong>
              </div>
              <label className="scheme-picker">
                <span>全局字体</span>
                <select value={font} onChange={(event) => onFontChange(event.target.value as AppFont)}>
                  {fontOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </label>
              <p className="scheme-description">
                统一更改页面、课表和二级菜单字体；“跟随风格”会使用当前风格默认字体。
              </p>
            </div>
          </div>
        </div>

        <div className="color-panel__actions">
          <button className="secondary-button" type="button" onClick={() => onChange(getDefaultScheduleTheme(appStyle))}>
            <RotateCcw aria-hidden="true" size={17} />
            <span>恢复默认颜色</span>
          </button>
          <button className="primary-button" type="button" onClick={onClose}>
            完成
          </button>
        </div>
      </section>
    </div>
  )
}

export default ColorSettings
