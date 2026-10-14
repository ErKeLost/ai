# 生成式 UI · 内部技术分享

用 [Slidev](https://sli.dev) + 社区主题 `slidev-theme-the-unnamed`（已改成青紫配色）做的分享 deck。

## 运行

```bash
npm install
npm run dev            # http://localhost:3030（按 p 打开发言稿窗口）
node scripts/export-speech.mjs   # 从 slides.md 的备注生成 演讲稿.md（只读 slides.md，不会回写）
```

> 改讲稿只有一个入口：改 `slides.md` 里 `<!-- -->` 的演讲者备注，然后跑一次 `export-speech.mjs`。
> 旧的 `write-speech.py` 会把备注**倒灌**回 slides.md，页数一变就整体错位，已移到 `scripts/_deprecated/`。

## 导出

```bash
npm run export         # PDF（已生成 generative-ui.pdf）
npm run export:pptx    # PPTX
npm run build          # 静态站点 → dist/
npx slidev export --format png --range "1,5,11" --output ./out   # 局部截图
```

## 23 页结构（4 章）

| 页 | 章节 | 内容 |
| --- | --- | --- |
| 1–9 | 01 开场 | 封面 · 场景切入 · 人话版定义 · 术语速查 · 四级光谱 L0–L3 · 三家对比 · 案例 ①②③ |
| 10–13 | 02 机制 | 三条路（填表 / 写方言） · 一张图看懂 · 流式 |
| 14–18 | 03 怎么接 | 只改 3 处 · **接入成本 token 实测** · 提示词“替换而非追加”的坑 · 点击要不要回模型 |
| 19–22 | 04 未来方向 | 协议收敛（AG-UI / A2UI / MCP Apps） · 未来 6–12 个月判断（上/下） |
| 23 | Q&A | 数据来源 · 延伸阅读 · 想自己试 |

> 页号以 `slides.md` 解析结果为准；此表只到章级，逐页标题见讲者视图或 `演讲稿.md`。
> 已移除的页面归档在 `_removed/`（含原页正文与备注，可原样粘回）。

## 关键数字（本机实测）

> 目录注入的 token / 成功率见第 16–17 页；口径与复现脚本见 `notes/generative-ui/future/catalog-tokens.md`（另一个仓库 `notes/` 下）。

> 前两行、以及“提示词成本”那一行来自已移除的页（`_removed/第13页-实测三种做法.md`、`_removed/第14页-成本提示词到底多大.md`）；
> deck 上仍在讲的实测数字只保留“原生文本流”那一行（第 13 页「流式」）。

- 自定义语言全量 67 组件 → 提示词 10.4 万字符（≈2.6 万 tokens）→ **0/2 成功**
- 裁剪到 18 组件 + 手写示例 → **2/2 成功**
- 工具通道（结构约束）→ 37 条语句 **首次即通过**
- 原生文本流：`text-delta ×682`、首字 2.0s、4.2s 结束、非原生事件 0
- 提示词成本：32 组件一句话 1,333 tokens / 详描述 5,231 / 67 组件 6,495 / OpenUI 82 组件 8,959
- `data.chart` 单个参数 8,256 字符，占整块 **32%**

## 文件

```
slides.md       # 内容（23 页；演讲者备注在 <!-- --> 里）
                  # 封面署名：俞波
style.css       # 主题配色覆盖 + 工具类（.gu-card / .gu-kpi / .gu-flow / .gu-wire …）
images/cover-mint.jpg   # 卡哇伊封面配图（薄荷色 · AI 生成）
videos/         # 6 段演示素材：
                #   kyoto-demo.mp4      案例① 行程 App 录屏
                #   openui-demo.mp4     案例② OpenUI 录屏
                #   sidebar-entrypoint / file-viewer / image-picker.mp4
                #                       OpenAI 官方：MCP App 的三种宿主入口
                #   excalidraw.gif       官方：同一个 MCP App 跑在 Claude 里
演讲稿.md        # 正文演讲稿，由 scripts/export-speech.mjs 从 slides.md 备注生成（别手改）
```

## 关于两段视频

- 页面里用 `<img>` 打底 + `<video autoplay loop muted playsinline>` 覆盖：现场放映时视频自动循环播放，导出 PDF 时至少有一张静帧，不会出现黑屏。
- PDF 里视频只会是一帧静图；**现场演讲请用 `npm run dev` 放映**，两段录屏会自己循环。
- 换视频：把新文件放到 `videos/`，同时用 ffmpeg 抽一帧当 poster：
  `ffmpeg -ss 30 -i videos/xxx.mp4 -frames:v 1 videos/xxx.jpg`

## 配色

薄荷 × 奶油黄（`style.css` 顶部 12 个变量即可整体换色）：

| 变量 | 用途 |
| --- | --- |
| `--k-mint` / `--k-mint-soft` | 主色：标题贴纸、KPI 数字、表格头、列表符号 |
| `--k-cream` / `--k-cream-soft` | 强调：引用块虚线、重点词高亮 |
| `--k-sky` | 次色：`.gu-card.is-violet`、链接 |
| `--k-ink` / `--k-muted` | 正文与次要文字 |

想换回粉色：把 `--k-mint*` 换成 `#ff6fb0 / #ffd9ec`、`--k-cream*` 换成 `#f7c948 / #fff2d4` 即可。
