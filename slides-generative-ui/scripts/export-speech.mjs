#!/usr/bin/env node
/**
 * 从 slides.md 抽取「演讲者备注」生成 演讲稿.md。
 *
 * 特点：**只读 slides.md，永不回写**。
 * （旧脚本 scripts/_deprecated/write-speech.py 会反过来重写 slides.md，
 *  靠硬编码的页号字典灌备注，页数一变就整体错位，已废弃。）
 *
 * 用法：
 *   node scripts/export-speech.mjs            # 写 演讲稿.md
 *   node scripts/export-speech.mjs --print    # 只打印到终端，不写文件
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@slidev/parser'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcFile = path.join(root, 'slides.md')
const outFile = path.join(root, '演讲稿.md')
const printOnly = process.argv.includes('--print')

const src = fs.readFileSync(srcFile, 'utf8')
const { slides } = await parse(src, 'slides.md')
const deckDuration = (src.match(/^duration:\s*(.+)$/m)?.[1] || '未声明').trim()

const stripTags = (s = '') => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()
const SPEAK_CHARS_PER_MIN = 240

const lines = []
const missing = []
let chars = 0

lines.push('# 生成式 UI · 演讲稿', '')
const totalPages = slides.length
lines.push(`> 分享人：俞波 ｜ ${totalPages} 页`)
lines.push('')
lines.push('> 本文件由 `node scripts/export-speech.mjs` 从 `slides.md` 的演讲者备注自动生成，**不要手改**；')
lines.push('> 改讲稿请改 `slides.md` 里 `<!-- -->` 的内容，然后重跑脚本。')
lines.push('')
lines.push('> 讲者视图：http://localhost:3030/presenter ｜ 大字号讲稿：http://localhost:3030/notes')
lines.push('', '---', '')

slides.forEach((slide, i) => {
  const no = i + 1
  const title = stripTags(slide.title) || '（封面）'
  const note = (slide.note || '').trim()
  if (!note) missing.push(no)
  chars += note.length
  lines.push(`### ${no}. ${title}`, '')
  lines.push(note || '_（本页暂无备注）_')
  lines.push('')
})

const minutes = chars / SPEAK_CHARS_PER_MIN
const summary = `讲稿 ${chars} 字 · 按 ${SPEAK_CHARS_PER_MIN} 字/分钟 ≈ ${minutes.toFixed(1)} 分钟（deck 目标 ${deckDuration}）`
lines.splice(3, 0, `> ${summary}`)

const out = lines.join('\n')
if (printOnly) {
  console.log(out)
} else {
  fs.writeFileSync(outFile, out)
  console.log(`✅ 已写入 演讲稿.md —— ${summary}`)
}
if (missing.length) console.warn(`⚠️ 以下页面还没有备注（讲稿里标了「暂无备注」）：第 ${missing.join('、')} 页`)
