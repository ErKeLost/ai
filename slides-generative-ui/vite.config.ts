import { defineConfig } from 'vite'

// 这台机器上 fsevents 的文件监听不生效，改完 slides.md 服务端会一直吐旧稿，
// 必须重启才更新。这里改成轮询监听，改完备注/正文保存就自动热更新。
export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 400,
    },
  },
})
