import Taro from '@tarojs/taro'

type ShareFileApi = {
  showShareFileMessage?: (options: {
    filePath: string
    fileName?: string
    success?: () => void
    fail?: (error: unknown) => void
  }) => void
}

export const chooseTextFile = async (extensions: string[]) => {
  const result = await Taro.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: extensions,
  })
  const file = result.tempFiles[0]

  if (!file) {
    throw new Error('没有选择文件')
  }

  return new Promise<{ name: string; text: string }>((resolve, reject) => {
    Taro.getFileSystemManager().readFile({
      filePath: file.path,
      encoding: 'utf8',
      success: (readResult) => {
        resolve({
          name: file.name,
          text: String(readResult.data),
        })
      },
      fail: reject,
    })
  })
}

export const writeAndShareTextFile = async (filename: string, content: string) => {
  const safeName = filename.trim() || 'dual-schedule.json'
  const filePath = `${Taro.env.USER_DATA_PATH}/${safeName}`

  await new Promise<void>((resolve, reject) => {
    Taro.getFileSystemManager().writeFile({
      filePath,
      data: content,
      encoding: 'utf8',
      success: () => resolve(),
      fail: reject,
    })
  })

  const shareApi = Taro as typeof Taro & ShareFileApi

  if (shareApi.showShareFileMessage) {
    await new Promise<void>((resolve, reject) => {
      shareApi.showShareFileMessage?.({
        filePath,
        fileName: safeName,
        success: () => resolve(),
        fail: reject,
      })
    })
    return
  }

  await Taro.showModal({
    title: '文件已生成',
    content: `文件路径：${filePath}`,
    showCancel: false,
  })
}
