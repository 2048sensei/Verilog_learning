import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 相对路径：既能部署在 https://user.github.io/repo/，也能直接打开构建产物
  base: './',
  // Live2D 挂件随仓库分发；模型体积大且授权独立，放在 public/live2d-models/ 本地启用
  publicDir: 'public',
})
