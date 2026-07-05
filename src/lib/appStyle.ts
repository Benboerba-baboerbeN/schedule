import type { AppFont, AppStyle } from '../types/schedule'

export const defaultAppStyle: AppStyle = 'bauhaus'

export const defaultFontByStyle: Record<AppStyle, AppFont> = {
  bauhaus: 'system-sans',
  classic: 'system-sans',
  paper: 'handwritten',
}

export const fontOptions: Array<{
  id: AppFont
  name: string
  cssValue: string
}> = [
  {
    id: 'style-default',
    name: '\u8ddf\u968f\u98ce\u683c',
    cssValue: '',
  },
  {
    id: 'system-sans',
    name: '\u73b0\u4ee3\u9ed1\u4f53',
    cssValue: 'Inter, "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
  },
  {
    id: 'serif',
    name: '\u6587\u827a\u5b8b\u4f53',
    cssValue: '"Noto Serif SC", "Songti SC", SimSun, serif',
  },
  {
    id: 'rounded',
    name: '\u5706\u6da6\u53ef\u8bfb',
    cssValue: '"Microsoft YaHei UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
  },
  {
    id: 'handwritten',
    name: '\u624b\u5199\u7eb8\u611f',
    cssValue: '"LXGW WenKai", "KaiTi", "STKaiti", "Microsoft YaHei", "PingFang SC", cursive, sans-serif',
  },
]

export const appStyleOptions: Array<{
  id: AppStyle
  name: string
  description: string
}> = [
  {
    id: 'bauhaus',
    name: '\u51e0\u4f55\u6d77\u62a5',
    description: '\u5f53\u524d\u7684\u7ea2\u9ec4\u84dd\u51e0\u4f55\u98ce\u683c\uff0c\u8fb9\u754c\u6e05\u6670\uff0c\u9002\u5408\u5c4f\u5e55\u67e5\u770b\u3002',
  },
  {
    id: 'classic',
    name: '\u6e05\u723d\u7b80\u7ea6',
    description: '\u56de\u5230\u65e9\u671f\u7684\u8f7b\u91cf\u6e05\u723d\u8bfe\u8868\uff0c\u989c\u8272\u66f4\u67d4\u548c\u3002',
  },
  {
    id: 'paper',
    name: '\u624b\u4f5c\u7eb8\u5f20',
    description: '\u53c2\u8003 handcraft paper UI \u7684\u7eb8\u7eb9\u3001\u58a8\u7ebf\u548c\u624b\u5de5\u8d34\u7eb8\u611f\u3002',
  },
]

export const isAppStyle = (value: unknown): value is AppStyle =>
  value === 'bauhaus' || value === 'classic' || value === 'paper'

export const isAppFont = (value: unknown): value is AppFont =>
  value === 'style-default' ||
  value === 'system-sans' ||
  value === 'serif' ||
  value === 'rounded' ||
  value === 'handwritten'

export const resolveFont = (font: AppFont, style: AppStyle) => {
  const resolvedFont = font === 'style-default' ? defaultFontByStyle[style] : font
  return fontOptions.find((option) => option.id === resolvedFont)?.cssValue ?? fontOptions[1].cssValue
}
