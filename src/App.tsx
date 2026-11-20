import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react'
import { ArrowDownToLine, ArrowLeft, ArrowRight, Building2, Check, CheckCheck, Grip, Info, Plus, RotateCcw, Sparkles, X } from 'lucide-react'
import { LEVELS, ZONES, STORAGE_KEY, freshRanking, readRanking, moveCard, type Card, type Zone } from './data'
import { exportRanking } from './export'

const EMOJIS = ['😎', '🧙', '🐈', '🦄', '🥷', '🛌', '🧟', '👽', '🦥', '🤠', '🧋', '🧦']
const zoneName = (zone: Zone) => zone === 'pool' ? 'Общий набор' : `${zone} — ${LEVELS.find(l => l.id === zone)!.name}`

function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!; dialog.showModal()
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous; dialog.close() }
  }, [])
  return <dialog ref={ref} className="modal" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }} aria-label={label}>
    <button className="icon-button modal-close" onClick={onClose} aria-label="Закрыть"><X size={21} /></button>
    {children}
  </dialog>
}

export default function App() {
  const [ranking, setRanking] = useState(readRanking)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modal, setModal] = useState<'create' | 'reset' | 'help' | null>(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('😎')
  const [message, setMessage] = useState('')
  const [storageOk, setStorageOk] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ zone: Zone; before?: string } | null>(null)
  const dragging = useRef(false)
  const selected = ranking.cards.find(c => c.id === selectedId)
  const selectedZone = selected ? ZONES.find(zone => ranking.rows[zone].includes(selected.id))! : 'pool'
  const rankedCount = ranking.cards.length - ranking.rows.pool.length

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ranking)); setStorageOk(true) }
    catch { setStorageOk(false) }
  }, [ranking])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 4200)
    return () => clearTimeout(timer)
  }, [message])

  function move(id: string, zone: Zone, before?: string) {
    setRanking(state => moveCard(state, id, zone, before))
    const card = ranking.cards.find(c => c.id === id)
    setMessage(`${card?.name}: ${zoneName(zone)}`)
  }
  function dragOver(event: DragEvent, zone: Zone, before?: string) {
    if (!draggedId) return
    event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'move'
    setDropTarget({ zone, before })
  }
  function drop(event: DragEvent, zone: Zone, before?: string) {
    event.preventDefault(); event.stopPropagation()
    const id = event.dataTransfer.getData('text/plain') || draggedId
    if (id) move(id, zone, before)
    setDraggedId(null); setDropTarget(null)
  }
  function renderCard(card: Card, zone: Zone) {
    const isBefore = dropTarget?.zone === zone && dropTarget.before === card.id && draggedId !== card.id
    const getBefore = (event: DragEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const index = ranking.rows[zone].indexOf(card.id)
      return event.clientX < rect.left + rect.width / 2 ? card.id : ranking.rows[zone][index + 1]
    }
    return <button key={card.id} type="button" draggable
      className={`person-card ${draggedId === card.id ? 'is-dragging' : ''} ${isBefore ? 'insert-before' : ''}`}
      style={{ '--card-color': card.color } as CSSProperties}
      data-card={card.id} aria-label={`${card.name}. ${zoneName(zone)}. Выбрать уровень`} title={card.caption}
      onClick={() => { if (!dragging.current) setSelectedId(card.id) }}
      onDragStart={event => { dragging.current = true; setDraggedId(card.id); event.dataTransfer.setData('text/plain', card.id); event.dataTransfer.effectAllowed = 'move' }}
      onDragEnd={() => { setDraggedId(null); setDropTarget(null); setTimeout(() => { dragging.current = false }, 0) }}
      onDragOver={event => dragOver(event, zone, getBefore(event))}
      onDrop={event => drop(event, zone, getBefore(event))}>
      <Grip className="card-grip" size={14} aria-hidden="true" />
      <span className="person-emoji" aria-hidden="true">{card.emoji}</span>
      <span className="person-name">{card.name}</span>
    </button>
  }

  async function download() {
    setExporting(true)
    try { await exportRanking(ranking); setMessage('Картинка готова! Ищи её в загрузках') }
    catch { setMessage('Не получилось скачать PNG. Попробуй ещё раз в другом браузере') }
    finally { setExporting(false) }
  }

  return <>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="#"><span className="brand-icon"><Building2 size={23} strokeWidth={2.2} /></span><span>комната <strong>404</strong><span className="brand-sub">соседи найдутся</span></span></a>
      <div className="header-note">Общага одна. Мнений много.</div>
      <button className="help-button" onClick={() => setModal('help')}><Info size={17} /><span>Как играть</span></button>
    </div></header>

    <main className="page">
      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy"><div className="eyebrow"><span /> ТВОЯ КОМНАТА. ТВОИ ПРАВИЛА.</div>
          <h1 id="page-title">Соседи по <span>общаге<span className="title-underline" /></span><span className="title-dot">.</span></h1>
          <p className="subtitle">С кем бы ты жил, а кого отправил на переселение?</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="art-star star-one">✦</span><span className="art-star star-two">✳</span>
          <div className="mini-card mini-card-back"><span>🪩</span><small>сосед?</small></div>
          <div className="mini-card mini-card-front"><span>🦝</span><small>сосед!</small></div>
          <div className="art-sticker">кастинг в комнату</div>
        </div>
      </section>

      <section className="ranking-section" aria-label="Мой рейтинг соседей">
        <div className="board-toolbar"><div className="board-title"><h2>Мой тир-лист</h2><span className="count-pill">{rankedCount} / {ranking.cards.length}</span></div>
          <div className="board-actions"><button className="button button-quiet" onClick={() => setModal('reset')}><RotateCcw size={16} /><span>Начать заново</span></button>
            <button className="button button-primary" onClick={download} disabled={exporting}><ArrowDownToLine size={17} /><span>{exporting ? 'Создаём PNG…' : 'Скачать картинку'}</span></button></div>
        </div>
        <div className="tier-board">
          {LEVELS.map(level => <section key={level.id} className={`tier-row ${dropTarget?.zone === level.id ? 'drop-active' : ''}`} data-zone={level.id} aria-label={zoneName(level.id)}
            style={{ '--tier-color': level.color } as CSSProperties} onDragOver={event => dragOver(event, level.id)} onDrop={event => drop(event, level.id)}>
            <div className="tier-label"><span className="tier-letter">{level.id}</span><span className="tier-name">{level.name}</span></div>
            <div className="tier-cards">{ranking.rows[level.id].map(id => renderCard(ranking.cards.find(c => c.id === id)!, level.id))}
              {!ranking.rows[level.id].length && <div className="tier-placeholder"><Plus size={18} /><span>{level.hint}</span></div>}
              {dropTarget?.zone === level.id && !dropTarget.before && ranking.rows[level.id].length > 0 && <span className="end-marker" />}
            </div>
          </section>)}
        </div>
        <div className="board-footnote"><span><Grip size={15} /><span>Перетаскивай карточки или нажми на типаж, чтобы выбрать уровень</span></span><span className={`save-status ${!storageOk ? 'save-error' : ''}`}><CheckCheck size={15} />{storageOk ? 'Всё сохранено' : 'Сохранение недоступно'}</span></div>
      </section>

      <section className={`pool-section ${dropTarget?.zone === 'pool' ? 'pool-active' : ''}`} aria-label="Нераспределённые карточки" data-zone="pool" onDragOver={event => dragOver(event, 'pool')} onDrop={event => drop(event, 'pool')}>
        <div className="pool-heading"><div className="board-title"><h2>На пороге</h2><span className="pool-count">{ranking.rows.pool.length}</span><span className="pool-description">Ждут твоего решения</span></div>
          <button className="button button-add" onClick={() => { setName(''); setEmoji('😎'); setModal('create') }} disabled={ranking.cards.length >= 100}><Plus size={18} /><span>Свой типаж</span></button>
        </div>
        <div className="pool-cards">{ranking.rows.pool.map(id => renderCard(ranking.cards.find(c => c.id === id)!, 'pool'))}
          {!ranking.rows.pool.length && <div className="pool-empty"><span>🏡</span><h3>Все заселены!</h3><p>Скачай результат или добавь легенду своей общаги.<br />Сюда можно вернуть любую карточку.</p></div>}
        </div>
      </section>
      <aside className="little-note"><span className="note-emoji">💡</span><p>Узнал своего соседа? <span>Скачай тир-лист и отправь в чат общаги. Только без обид.</span></p></aside>
      <footer><span>Сделано между парами <span aria-hidden="true">✳</span></span><span>Без регистрации. Без коменданта.</span></footer>
    </main>

    {selected && <Modal label={`Выбрать уровень: ${selected.name}`} onClose={() => setSelectedId(null)}>
      <div className="selected-preview" style={{ '--card-color': selected.color } as CSSProperties}><span>{selected.emoji}</span></div>
      <h2>{selected.name}</h2><p className="modal-subtitle">{selected.caption}</p><p className="field-label">Куда заселяем?</p>
      <div className="level-options">{ZONES.map(zone => <button key={zone} className={`level-option ${zone === selectedZone ? 'current-level' : ''}`} onClick={() => { move(selected.id, zone); setSelectedId(null) }}>
        <span className="level-option-letter" style={{ background: LEVELS.find(l => l.id === zone)?.color || '#bcb5d7' }}>{zone === 'pool' ? <Grip size={18} /> : zone}</span><span>{zone === 'pool' ? 'Вернуть в общий набор' : LEVELS.find(l => l.id === zone)!.name}</span>{zone === selectedZone && <Check size={18} />}
      </button>)}</div>
      <div className="order-controls"><span>Порядок в {selectedZone === 'pool' ? 'наборе' : `уровне ${selectedZone}`}</span><div>
        <button className="icon-button" aria-label="Переместить раньше" disabled={ranking.rows[selectedZone].indexOf(selected.id) === 0} onClick={() => { const ids = ranking.rows[selectedZone]; move(selected.id, selectedZone, ids[ids.indexOf(selected.id) - 1]) }}><ArrowLeft size={20} /></button>
        <button className="icon-button" aria-label="Переместить позже" disabled={ranking.rows[selectedZone].indexOf(selected.id) === ranking.rows[selectedZone].length - 1} onClick={() => { const ids = ranking.rows[selectedZone]; move(selected.id, selectedZone, ids[ids.indexOf(selected.id) + 2]) }}><ArrowRight size={20} /></button>
      </div></div>
    </Modal>}

    {modal === 'create' && <Modal label="Создать свой типаж" onClose={() => setModal(null)}>
      <span className="modal-top-icon"><Sparkles size={28} /></span><h2>Легенда твоей общаги</h2><p className="modal-subtitle">У нас точно не все типажи. Добавь своего.</p>
      <form onSubmit={event => {
        event.preventDefault()
        if (!name.trim() || !emoji.trim() || ranking.cards.length >= 100) return
        const card: Card = { id: `custom-${crypto.randomUUID()}`, name: name.trim(), emoji: emoji.trim(), color: '#c4c0e9', caption: 'Легенда твоей общаги' }
        setRanking(state => ({ cards: [...state.cards, card], rows: { ...state.rows, pool: [...state.rows.pool, card.id] } }))
        setModal(null); setMessage(`${card.name} уже на пороге!`)
      }}>
        <label className="input-label" htmlFor="custom-name">Название типажа</label><input id="custom-name" autoFocus required maxLength={48} placeholder="Например, Король доширака" value={name} onChange={e => setName(e.target.value)} />
        <label className="input-label" htmlFor="custom-emoji">Эмодзи</label><input id="custom-emoji" className="emoji-input" required maxLength={24} value={emoji} onChange={e => setEmoji(e.target.value)} />
        <div className="emoji-options">{EMOJIS.map(e => <button key={e} type="button" aria-label={`Выбрать ${e}`} aria-pressed={emoji === e} onClick={() => setEmoji(e)}>{e}</button>)}</div>
        <button className="button button-primary full-width" type="submit" disabled={!name.trim() || !emoji.trim()}><Plus size={18} />Добавить в набор</button>
      </form>
    </Modal>}
    {modal === 'reset' && <Modal label="Начать заново?" onClose={() => setModal(null)}><span className="modal-top-emoji">📦</span><h2>Большое переселение?</h2><p className="modal-subtitle">Все 16 типажей вернутся в общий набор. Твой рейтинг и добавленные типажи удалятся.</p><div className="reset-actions"><button className="button button-secondary" autoFocus onClick={() => setModal(null)}>Оставить как есть</button><button className="button button-primary" onClick={() => { setRanking(freshRanking()); setModal(null); setMessage('Чистый лист. Заселяем заново!') }}>Да, начать заново</button></div></Modal>}
    {modal === 'help' && <Modal label="Как играть" onClose={() => setModal(null)}><span className="modal-top-emoji">🏡</span><h2>Решай, кто с тобой живёт</h2><div className="help-content"><p><strong>Перетаскивай</strong> типажи в уровни от S до D. Соседа мечты — наверх, любителя твоей еды — куда решишь.</p><p><strong>Меняй порядок</strong> карточек внутри уровня или возвращай их в набор «На пороге».</p><p><strong>На телефоне и с клавиатуры:</strong> нажми на карточку (Tab и Enter на клавиатуре), выбери уровень или кнопки порядка. Escape закроет окно.</p><p><strong>Добавляй своих</strong> и скачивай рейтинг в PNG. Изображение содержит заголовок и пять уровней.</p><p className="help-save">Рейтинг сохраняется в этом браузере автоматически. Сброс и очистка данных браузера удаляют его.</p></div><button className="button button-primary full-width" onClick={() => setModal(null)}>Всё, заселяемся!</button></Modal>}
    <div className="sr-only" role="status" aria-live="polite">{message}</div>
    {message && <div className="toast" aria-hidden="true"><Check size={18} />{message}</div>}
  </>
}
