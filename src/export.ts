import { LEVELS, type Ranking } from './data'

// Native Canvas avoids screenshots of controls and needs no remote images or API.
export async function exportRanking(ranking: Ranking): Promise<void> {
  await document.fonts.ready
  const width = 1440, scale = 2, gap = 12, cardWidth = 138, columns = 7
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Браузер не поддерживает экспорт изображения')
  const box = (x: number, y: number, w: number, h: number, fill: string, radius = 12) => {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill()
  }
  const text = (value: string, x: number, y: number, size: number, color: string, weight = 500) => {
    ctx.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`; ctx.fillStyle = color; ctx.fillText(value, x, y)
  }
  const wrap = (value: string, max: number): string[] => {
    const result: string[] = []; let line = ''
    for (const word of value.replaceAll('-', '- ').split(' ')) {
      if (line && ctx.measureText(`${line} ${word}`).width > max) { result.push(line); line = '' }
      // A custom name can contain one long word.
      for (const char of (line ? ` ${word}` : word)) {
        if (line && ctx.measureText(line + char).width > max) { result.push(line); line = '' }
        line += char
      }
    }
    if (line) result.push(line)
    return result
  }
  ctx.font = '700 17px "Segoe UI", Arial, sans-serif'
  const cardHeight = Math.max(138, ...ranking.cards.map(card => 85 + wrap(card.name, cardWidth - 14).length * 19))
  const rowHeights = LEVELS.map(l => Math.max(166, Math.ceil(ranking.rows[l.id].length / columns) * (cardHeight + gap) + gap))
  const height = 270 + rowHeights.reduce((a, b) => a + b, 0) + 100
  canvas.width = width * scale; canvas.height = height * scale
  ctx.scale(scale, scale)
  box(0, 0, width, height, '#141516', 0)
  text('КОМНАТА 404  /  МОЙ ТИР-ЛИСТ', 52, 58, 20, '#f89760', 700)
  text('Соседи по общаге', 52, 144, 66, '#f5f3ee', 800)
  text('С кем бы ты жил, а кого отправил на переселение?', 55, 195, 27, '#a6a6aa')
  let y = 250
  LEVELS.forEach((level, index) => {
    const h = rowHeights[index]
    box(48, y, width - 96, h - 4, '#202123')
    box(48, y, 224, h - 4, level.color)
    text(level.id, 72, y + 70, 52, '#252222', 800)
    ctx.font = '700 21px "Segoe UI", Arial, sans-serif'
    wrap(level.name, 180).forEach((line, i) => text(line, 72, y + 109 + i * 26, 21, '#252222', 700))
    ranking.rows[level.id].forEach((id, cardIndex) => {
      const card = ranking.cards.find(c => c.id === id)!
      const x = 288 + (cardIndex % columns) * (cardWidth + gap)
      const cy = y + gap + Math.floor(cardIndex / columns) * (cardHeight + gap)
      box(x, cy, cardWidth, cardHeight, card.color)
      ctx.textAlign = 'center'; ctx.font = '46px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'; ctx.fillText(card.emoji, x + cardWidth / 2, cy + 57)
      ctx.font = '700 17px "Segoe UI", Arial, sans-serif'
      const lines = wrap(card.name, cardWidth - 14)
      lines.forEach((line, i) => text(line, x + cardWidth / 2, cy + 84 + i * 19, 17, '#28252c', 700))
      ctx.textAlign = 'left'
    })
    if (!ranking.rows[level.id].length) text('Пока никого', 304, y + h / 2 + 8, 23, '#707176')
    y += h
  })
  const count = ranking.cards.length - ranking.rows.pool.length
  text(`Заселено ${count} из ${ranking.cards.length}  ·  У каждого свой идеальный сосед.`, 54, y + 46, 22, '#99999e')
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Не удалось создать PNG')), 'image/png'))
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a'); link.href = url; link.download = 'sosedi-po-obshage.png'
  document.body.append(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
