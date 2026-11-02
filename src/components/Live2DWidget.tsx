import { useEffect } from 'react'

// ============================================================
// Live2DWidget — 全站看板娘（live2d-widget 本地化集成）
// · 挂件代码随仓库分发（GPL-3.0），模型不随仓库分发（体积/授权原因）
// · 启动时先探测 live2d-models/model_list.json：没有模型就静默跳过，不影响学习功能
// · 想启用：把模型放进 public/live2d-models/（需包含 model_list.json），详见 README
// · 视线跟随鼠标、可拖动、点击模型平滑回顶（widget 自带互动动画同时保留）
// ============================================================

const BASE = import.meta.env.BASE_URL

export default function Live2DWidget() {
  useEffect(() => {
    // 需要彻底关闭时：在 .env 里设置 VITE_DISABLE_LIVE2D=1
    if (import.meta.env.VITE_DISABLE_LIVE2D === '1') return

    let cancelled = false
    let script: HTMLScriptElement | null = null
    let link: HTMLLinkElement | null = null
    let rafId = 0
    let down: { x: number; y: number } | null = null

    // 回顶：滚动容器是 <main>（Layout 里 overflow-y-auto）
    // 用 rAF 缓动而不是原生 smooth：任何环境（含后台/无头）都稳定 ~450ms 完成
    const scrollToTop = () => {
      const scroller = document.querySelector('main') || document.documentElement
      const start = scroller.scrollTop
      if (start <= 0) return
      cancelAnimationFrame(rafId)
      const t0 = performance.now()
      const dur = 450
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        scroller.scrollTop = Math.round(start * (1 - easeOut(p)))
        if (p < 1) rafId = requestAnimationFrame(step)
      }
      rafId = requestAnimationFrame(step)
    }

    const init = () => {
      if (cancelled) return
      const w = window as unknown as { initWidget?: (cfg: Record<string, unknown>) => void }
      if (typeof w.initWidget !== 'function') return

      w.initWidget({
        waifuPath: `${BASE}live2d-widget/waifu-tips.json`,
        cdnPath: `${BASE}live2d-models/`,
        cubism2Path: `${BASE}live2d-widget/live2d.min.js`,
        // 裁掉 hitokoto/asteroids/info（依赖外网或对学习站无意义），保留换模型/换装/拍照/隐藏
        tools: ['switch-model', 'switch-texture', 'photo', 'quit'],
        drag: true,
        logLevel: 'error',
      })

      const waifu = document.getElementById('waifu')
      waifu?.style.setProperty('z-index', '9999')

      const canvas = document.getElementById('live2d')
      if (canvas) {
        canvas.addEventListener('pointerdown', e => {
          down = { x: e.clientX, y: e.clientY }
        })
        canvas.addEventListener('click', e => {
          const wasDrag = down != null && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10
          down = null
          if (!wasDrag) scrollToTop()
        })
      }
    }

    const boot = async () => {
      // 没有模型资源（公开仓库默认状态）就直接跳过，避免无意义的 404/报错
      try {
        const res = await fetch(`${BASE}live2d-models/model_list.json`, { cache: 'no-cache' })
        if (!res.ok) return
        const data = (await res.json()) as { models?: unknown[] }
        if (!Array.isArray(data.models) || data.models.length === 0) return
      } catch {
        return
      }
      if (cancelled) return

      link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `${BASE}live2d-widget/waifu.css`
      document.head.appendChild(link)

      script = document.createElement('script')
      script.type = 'module'
      script.src = `${BASE}live2d-widget/waifu-tips.js`
      script.onload = init
      document.head.appendChild(script)
    }

    void boot()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      document.getElementById('waifu')?.remove()
      document.getElementById('waifu-toggle')?.remove()
      script?.remove()
      link?.remove()
    }
  }, [])

  return null
}
