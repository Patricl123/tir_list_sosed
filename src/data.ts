export const LEVELS = [
  { id: 'S', name: 'Сосед мечты', color: '#ff999d', hint: 'Ключи от комнаты и сердца' },
  { id: 'A', name: 'Комфортно жить', color: '#ffc68b', hint: 'Сработаемся' },
  { id: 'B', name: 'Терпимо', color: '#f6dd84', hint: 'У всех свои приколы' },
  { id: 'C', name: 'Спасают беруши', color: '#b9db94', hint: 'Глубокий вдох…' },
  { id: 'D', name: 'На переселение', color: '#94c5f3', hint: 'Коменда, у нас вопрос' },
] as const
export type Zone = typeof LEVELS[number]['id'] | 'pool'
export const ZONES: Zone[] = ['S', 'A', 'B', 'C', 'D', 'pool']
export type Card = { id: string; name: string; emoji: string; color: string; caption: string }
export type Ranking = { cards: Card[]; rows: Record<Zone, string[]> }
export const DEFAULT_CARDS: Card[] = [
  { id: 'gamer', name: 'Ночной геймер', emoji: '🎮', color: '#bbb0e6', caption: 'Ещё один каток и спать' },
  { id: 'clean', name: 'Чистюля', emoji: '🧽', color: '#b4dcb4', caption: 'У пыли нет шансов' },
  { id: 'helpless', name: 'Бытовой инвалид', emoji: '🫠', color: '#f0c28e', caption: 'А как включить чайник?' },
  { id: 'party', name: 'Тусовщик', emoji: '🪩', color: '#dfadd5', caption: 'Это все свои!' },
  { id: 'quiet', name: 'Тихоня', emoji: '🤫', color: '#afc8d7', caption: 'Режим без звука' },
  { id: 'cook', name: 'Повар-кормилец', emoji: '🧑‍🍳', color: '#eac58e', caption: 'Тебе тоже положить?' },
  { id: 'thief', name: 'Вор еды', emoji: '🦝', color: '#bab8ca', caption: 'Там же не подписано' },
  { id: 'debtor', name: 'Вечный должник', emoji: '💸', color: '#c3d7a0', caption: 'Стипуха придёт — отдам' },
  { id: 'athlete', name: 'Спортсмен', emoji: '💪', color: '#e0ad92', caption: 'Подъём, у нас пробежка!' },
  { id: 'nerd', name: 'Ботан-спасатель', emoji: '🤓', color: '#c4c0e9', caption: 'Скину тебе конспект' },
  { id: 'guitar', name: 'Гитарист', emoji: '🎸', color: '#eac29a', caption: 'А теперь «Батарейка»' },
  { id: 'smoker', name: 'Курильщик', emoji: '🚬', color: '#b9c3c3', caption: 'Я же в форточку' },
  { id: 'couple', name: 'Живёт со своей парой', emoji: '💑', color: '#e8b5c3', caption: 'Мы только на одну ночь' },
  { id: 'calls', name: 'Созвон без наушников', emoji: '📢', color: '#e1c382', caption: 'АЛЛО, МЕНЯ СЛЫШНО?' },
  { id: 'mom', name: 'Мама всё решит', emoji: '👩‍👦', color: '#c1c9a9', caption: 'Я сейчас маме позвоню' },
  { id: 'ghost', name: 'Сосед-призрак', emoji: '👻', color: '#bfc9e4', caption: 'Он вообще существует?' },
]
export const STORAGE_KEY = 'sosedi-ranking-v1'
export function freshRanking(): Ranking {
  return { cards: DEFAULT_CARDS.map(c => ({ ...c })), rows: { S: [], A: [], B: [], C: [], D: [], pool: DEFAULT_CARDS.map(c => c.id) } }
}
export function readRanking(): Ranking {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!saved || !Array.isArray(saved.cards) || !saved.rows || saved.cards.length > 100) return freshRanking()
    const ids = new Set<string>()
    const cards: Card[] = saved.cards.filter((c: Card) => {
      if (!c || typeof c.id !== 'string' || ids.has(c.id) || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 48 || typeof c.emoji !== 'string' || c.emoji.length > 24) return false
      ids.add(c.id)
      return true
    }).map((c: Card) => ({ ...c, color: /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#c4c0e9', caption: typeof c.caption === 'string' ? c.caption : 'Легенда твоей общаги' }))
    if (!cards.length) return freshRanking()
    const used = new Set<string>()
    const rows = Object.fromEntries(ZONES.map(zone => [zone, (Array.isArray(saved.rows[zone]) ? saved.rows[zone] : []).filter((id: unknown) => {
      if (typeof id !== 'string' || !ids.has(id) || used.has(id)) return false
      used.add(id)
      return true
    })])) as Ranking['rows']
    rows.pool.push(...cards.filter(c => !used.has(c.id)).map(c => c.id))
    return { cards, rows }
  } catch { return freshRanking() }
}
// Remove first so a card always belongs to exactly one place.
export function moveCard(state: Ranking, id: string, zone: Zone, beforeId?: string): Ranking {
  if (!state.cards.some(c => c.id === id) || id === beforeId) return state
  const rows = Object.fromEntries(ZONES.map(z => [z, state.rows[z].filter(i => i !== id)])) as Ranking['rows']
  const index = beforeId ? rows[zone].indexOf(beforeId) : -1
  rows[zone].splice(index < 0 ? rows[zone].length : index, 0, id)
  return { ...state, rows }
}
