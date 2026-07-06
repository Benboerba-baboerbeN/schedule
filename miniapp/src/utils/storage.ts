import Taro from '@tarojs/taro'
import { createMiniScheduleStorage } from '@shared/lib/miniStorage'

export const miniStorage = createMiniScheduleStorage({
  getStorageSync: (key) => {
    const value = Taro.getStorageSync<string>(key)
    return typeof value === 'string' ? value : ''
  },
  setStorageSync: (key, value) => {
    Taro.setStorageSync(key, value)
  },
})
