# FPGA/Verilog 交互学习网站 — 搭建规划

## 项目信息

- **项目路径**: `F:\aistudy\fpga\测试`
- **主题**: Verilog 硬件描述语言基础入门
- **素材来源**: 菜鸟教程 https://www.runoob.com/w3cnote/verilog-tutorial.html
- **定位**: 夯实基础概念、语法体系、设计框架思路。不涉及深度项目实战。
- **方式**: 纯前端，AI 全栈自助构建

---

## 一、教材范围（精简后）

只做到第6章，聚焦基础概念：

| 章节 | 内容 | 节数 |
|------|------|------|
| 第1章 入门 | 简介、设计方法 | 2 |
| 第2章 基础语法 | 语法、数值、数据类型、表达式、编译指令 | 5 |
| 第3章 连续赋值与时延 | assign、时延 | 2 |
| 第4章 过程结构 | 过程块、赋值、时序、条件、循环等 | 8 |
| 第5章 模块与端口 | 模块定义、例化、参数 | 3 |
| 第6章 进阶知识 | 函数、任务、状态机、竞争冒险、Latch、仿真、流水线 | 7 |

**共 6 章 27 节**

---

## 二、技术选型（极简）

```
Vite + React 18 + TypeScript
  + Tailwind CSS            ← 深色主题 + 样式
  + React Router            ← 路由
  + Prism.js                ← 代码高亮（比 Shiki 轻）
  + localStorage            ← 进度持久化（比 Dexie 轻）

不引入:
  ✗ shadcn/ui (配置重)
  ✗ Zustand     (React Context 够用)
  ✗ MDX         (内容放 TS 对象里，零运行时解析)
  ✗ CodeMirror  (Phase 1 不用在线编辑器)
  ✗ KaTeX       (Verilog 数学公式少)
```

**依赖数量: 4 个**（react, react-dom, react-router-dom, prismjs + @types）

---

## 三、交互形式

参考 HDLBits 和硅梯（Silicon Ladder）的设计思路：

| 交互类型 | 实现方式 | 示例 |
|---------|---------|------|
| **概念阅读** | 深色卡片布局 + 代码高亮 | 正文 + 语法示例 |
| **选择题** | 纯 React 组件，即时反馈 | "wire 和 reg 的区别？" |
| **填空题** | 输入框 + 模糊匹配 | "补全关键词" |
| **代码阅读题** | 代码块 + 单选 "这段代码输出什么？" | 考察对阻塞/非阻塞赋值的理解 |
| **真值表填空** | 表格 + 下拉选择 | 组合逻辑验证 |
| **拖拽排序** | HTML5 Drag API（无额外库） | "按事件队列顺序排列" |

---

## 四、深色主题色板

```
背景色:
  bg-primary:    #0f172a  (slate-900)  主背景
  bg-secondary:  #1e293b  (slate-800)  卡片/侧栏
  bg-tertiary:   #334155  (slate-700)  代码块/hover

文字色:
  text-primary:  #f1f5f9  (slate-100)  正文
  text-secondary:#94a3b8  (slate-400)  辅助说明
  text-muted:    #64748b  (slate-500)  占位符

强调色:
  accent:        #38bdf8  (sky-400)    链接/按钮
  success:       #34d399  (emerald-400) 正确答案
  error:         #f87171  (red-400)     错误答案
  warning:       #fbbf24  (amber-400)   提示

代码块:
  code-bg:       #0c1222  更深的蓝黑
  code-border:   #1e3a5f
```

---

## 五、站点结构

```
F:\aistudy\fpga\测试\
├── PLAN.md                   ← 本文件
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── Layout.tsx        ← 整体布局（侧栏+内容）
│   │   ├── Sidebar.tsx       ← 课程目录导航 + 进度
│   │   ├── LessonView.tsx    ← 课程阅读视图
│   │   ├── CodeBlock.tsx     ← Prism.js 代码高亮
│   │   ├── Quiz.tsx          ← 选择题/多选题
│   │   ├── FillBlank.tsx     ← 填空题
│   │   ├── TruthTable.tsx    ← 真值表交互
│   │   └── ProgressBar.tsx   ← 学习进度条
│   ├── data/
│   │   └── courses.ts        ← ★ 所有课程内容（TS 对象）
│   ├── hooks/
│   │   └── useProgress.ts    ← localStorage 进度管理
│   ├── context/
│   │   └── ProgressContext.tsx
│   └── pages/
│       ├── Home.tsx
│       ├── Course.tsx
│       └── Dashboard.tsx
└── public/
    └── favicon.svg
```

---

## 六、路由设计

```
/                          → 首页（课程介绍）
/learn                     → 课程目录
/learn/:chapterId          → 章节概览页
/learn/:chapterId/:lessonId → 课程学习页
/dashboard                 → 学习进度看板
```

---

## 七、构建流程

### Phase 1 — 素材采集 ✅ 完成
- [x] 抓取目录结构
- [x] 提取核心章节内容（简介、语法、数据类型、表达式、assign、过程结构、条件语句、模块端口、状态机等）
- [x] 整理素材清单

### Phase 2 — 站点搭建 ✅ 完成
- [x] Vite + React + Tailwind 脚手架
- [x] Layout + Sidebar + 路由
- [x] CodeBlock（Prism.js + 行号 + 复制）
- [x] Quiz（单选/多选、即时反馈、得分统计）
- [x] FillBlank（填空验证）
- [x] TruthTable（真值表交互填写）
- [x] 深色主题全局样式

### Phase 3 — 内容填充 ✅ 完成
- [x] 6 章 27 节课程结构
- [x] 每节含 HTML 内容 + 代码示例
- [x] 配套练习题（选择题/填空题/真值表）
- [x] 概念对比表格（wire vs reg, task vs function 等）

### Phase 4 — 交互动画演示 ✅ 完成
- [x] WavePlayer 时序波形播放器（播放/暂停/步进/速度/游标/posedge标记）
- [x] FSMVisualizer 状态机可视化（自动售卖机：状态高亮/转移动画/输出点亮/历史记录）
- [x] GatePropagation 门电路信号传播（1位全加器，逐级传播延迟动画）
- [x] PipelineVisualizer 流水线动画（3级流水线数据包推进，吞吐量 vs 延迟）
- [x] 嵌入 7 课：ch03-l01(门电路)、ch03-l02/ch04-l01/ch04-l02×2/ch04-l07×2(波形)、ch06-l03(状态机)、ch06-l07(流水线)
- [x] 两轮自我迭代：修复面包屑章号、FSM双转移箭头分离、阻塞/非阻塞对比波形、传播延迟调优

### Phase 5 — 打磨 ⬜（可选后续）
- [ ] 响应式适配（移动端）
- [ ] PWA 离线支持
- [ ] 更多交互题型
- [ ] 更多课程内容（第7-8章设计实例）

---

## 八、参考来源

| 来源 | 用途 | URL |
|------|------|-----|
| 菜鸟教程 | 主要教材内容 | https://www.runoob.com/w3cnote/verilog-tutorial.html |
| HDLBits | 交互形式参考 | https://hdlbits.01xz.net/ |
| Silicon Ladder | 交互形式参考 | https://siliconladder.com/ |
| EcrioniX | 交互形式参考 | https://ecrionix.org/tools/ |

---
