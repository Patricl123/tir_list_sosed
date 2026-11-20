import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => { await page.goto('/') })

test('назначение уровня, возврат и сохранение после перезагрузки', async ({ page }) => {
  await expect(page.locator('[data-zone="pool"] [data-card]')).toHaveCount(16)
  await page.locator('[data-card="cook"]').click()
  await page.getByRole('button', { name: 'S Сосед мечты', exact: true }).click()
  await expect(page.locator('[data-zone="S"] [data-card="cook"]')).toBeVisible()
  await page.reload()
  await expect(page.locator('[data-zone="S"] [data-card="cook"]')).toBeVisible()
  await page.locator('[data-card="cook"]').click()
  await page.getByRole('button', { name: 'Вернуть в общий набор', exact: true }).click()
  await expect(page.locator('[data-zone="pool"] [data-card]')).toHaveCount(16)
})

test('перетаскивание между уровнями, порядок и возврат в набор', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'На телефоне проверяется назначение нажатием')
  // Native dragging needs both endpoints visible; dragTo cannot scroll during an HTML drag.
  await page.setViewportSize({ width: 1440, height: 1600 })
  const card = (id: string) => page.locator(`[data-card="${id}"]`)
  await card('gamer').dragTo(page.locator('[data-zone="S"] .tier-cards'))
  await card('cook').dragTo(page.locator('[data-zone="S"] .tier-cards'))
  await expect(page.locator('[data-zone="S"] [data-card]')).toHaveCount(2)
  await card('cook').dragTo(card('gamer'), { targetPosition: { x: 5, y: 30 } })
  await expect(page.locator('[data-zone="S"] [data-card]').first()).toHaveAttribute('data-card', 'cook')
  await card('gamer').dragTo(page.locator('[data-zone="D"] .tier-cards'))
  await expect(page.locator('[data-zone="D"] [data-card="gamer"]')).toBeVisible()
  await card('gamer').dragTo(page.locator('[data-zone="pool"] .pool-heading'))
  await expect(page.locator('[data-zone="pool"] [data-card="gamer"]')).toBeVisible()
})

test('управление клавиатурой и изменение порядка кнопками', async ({ page }) => {
  for (const id of ['gamer', 'cook']) {
    await page.locator(`[data-card="${id}"]`).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'A Комфортно жить', exact: true }).focus()
    await page.keyboard.press('Enter')
  }
  await page.locator('[data-card="cook"]').click()
  await page.getByRole('button', { name: 'Переместить раньше', exact: true }).click()
  await expect(page.locator('[data-zone="A"] [data-card]').first()).toHaveAttribute('data-card', 'cook')
  await page.getByRole('button', { name: 'Переместить позже', exact: true }).click()
  await expect(page.locator('[data-zone="A"] [data-card]').last()).toHaveAttribute('data-card', 'cook')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('свой типаж, подтверждение и отмена сброса', async ({ page }) => {
  await page.getByRole('button', { name: 'Свой типаж', exact: true }).click()
  await page.getByLabel('Название типажа').fill('Король доширака')
  await page.getByLabel('Эмодзи', { exact: true }).fill('🍜')
  await page.getByRole('button', { name: 'Добавить в набор' }).click()
  await expect(page.locator('[data-zone="pool"] [data-card]')).toHaveCount(17)
  await page.reload()
  await expect(page.getByRole('button', { name: /Король доширака/ })).toBeVisible()
  await page.getByRole('button', { name: 'Начать заново', exact: true }).click()
  await page.getByRole('button', { name: 'Оставить как есть' }).click()
  await expect(page.locator('[data-zone="pool"] [data-card]')).toHaveCount(17)
  await page.getByRole('button', { name: 'Начать заново', exact: true }).click()
  await page.getByRole('button', { name: 'Да, начать заново', exact: true }).click()
  await expect(page.locator('[data-zone="pool"] [data-card]')).toHaveCount(16)
  await page.reload()
  await expect(page.locator('[data-zone="pool"] [data-card]')).toHaveCount(16)
})

test('экспорт настоящего PNG с текущими карточками', async ({ page }) => {
  await page.locator('[data-card="cook"]').click()
  await page.getByRole('button', { name: 'S Сосед мечты', exact: true }).click()
  const drawing: string[] = []
  await page.exposeFunction('captureExportText', (value: string) => drawing.push(value))
  await page.evaluate(() => {
    const original = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText = function (...args: Parameters<typeof original>) {
      (window as unknown as { captureExportText: (s: string) => void }).captureExportText(args[0])
      return original.apply(this, args)
    }
  })
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Скачать картинку' }).click()])
  expect(download.suggestedFilename()).toBe('sosedi-po-obshage.png')
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const png = Buffer.concat(chunks)
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(png.readUInt32BE(16)).toBe(2880)
  expect(png.length).toBeGreaterThan(20_000)
  expect(drawing).toContain('Соседи по общаге')
  expect(drawing.join('').replaceAll(' ', '')).toContain('Повар-кормилец')
  expect(drawing.join(' ')).not.toContain('Скачать картинку')
})

test('адаптивность, справка и восстановление повреждённых данных', async ({ page }) => {
  for (const width of [320, 375, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.getByRole('button', { name: 'Как играть' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Всё, заселяемся!' }).click()
  await page.evaluate(() => localStorage.setItem('sosedi-ranking-v1', '{broken'))
  await page.reload()
  await expect(page.locator('[data-zone="pool"] [data-card]')).toHaveCount(16)
})
