import { defineConfig } from '@tarojs/cli'
import path from 'node:path'

const root = process.cwd()

export default defineConfig({
  projectName: 'dual-schedule-miniapp',
  date: '2026-07-06',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'miniapp/src',
  outputRoot: 'dist-weapp',
  framework: 'react',
  compiler: 'webpack5',
  compile: {
    include: [path.resolve(root, 'src')],
  },
  alias: {
    '@shared': path.resolve(root, 'src'),
    '@mini': path.resolve(root, 'miniapp/src'),
  },
  mini: {
    webpackChain(chain) {
      chain.module
        .rule('shared-scripts')
        .test(/\.[jt]sx?$/)
        .include.add(path.resolve(root, 'src'))
        .end()
        .use('babel-loader')
        .loader('babel-loader')
        .options({
          compact: false,
        })
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
      },
    },
  },
})
