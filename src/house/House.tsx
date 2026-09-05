'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { collectibleIds, rooms, stories, type RoomId } from './content'
import { handleDialogKey, createBackdropDismiss } from './dialogControls'
import type { Engine } from './engine'
import styles from './house.module.css'

const contents: Record<RoomId, string[]> = {
  upstairs: ['bed', 'laptop', 'printer', 'guitar', 'bookshelf', 'stairsDown'],
  downstairs: ['wife', 'baby', 'dog', 'fridge', 'photos', 'stairsUp', 'outside'],
  backyard: ['tesla', 'garden', 'picnic', 'inside'],
}
const objectLabels: Record<string, string> = { bed: 'About me', laptop: 'Laptop', printer: '3D printer', guitar: 'Guitar', bookshelf: 'Bookshelf', stairsDown: 'Go downstairs', wife: 'Wife', baby: 'Baby', dog: 'Dog', photos: 'Family photos', fridge: 'Fridge', stairsUp: 'Go upstairs', outside: 'Go outside', tesla: 'Car', garden: 'Flower garden', picnic: 'Picnic table', inside: 'Go inside' }
const roomOrder: RoomId[] = ['upstairs', 'downstairs', 'backyard']
type Panel = { kind: 'story'; id: string } | { kind: 'guide' } | { kind: 'help' } | null

export default function House() {
  const container = useRef<HTMLDivElement>(null), engine = useRef<Engine | null>(null), dialog = useRef<HTMLDialogElement>(null)
  const [room, setRoom] = useState<RoomId>('upstairs'), [panel, setPanel] = useState<Panel>(null)
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [welcome, setWelcome] = useState(true)
  const [letters, setLetters] = useState(0)
  const [sound, setSound] = useState(false), [nearby, setNearby] = useState<string | null>(null)
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null)
  const [discovered, setDiscovered] = useState<string[]>([]), [transition, setTransition] = useState(false)
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roomRef = useRef<RoomId>('upstairs')
  const backdropDismiss = useRef(createBackdropDismiss())
  const closePanel = useCallback(() => {
    backdropDismiss.current.cancel()
    dialog.current?.close()
    setPanel(null)
    container.current?.querySelector('canvas')?.focus({ preventScroll: true })
  }, [])
  const changeRoom = useCallback((next: RoomId) => {
    setPanel(null); setWelcome(false)
    if (next === roomRef.current) return
    roomRef.current = next
    engine.current?.setPaused(true)
    setTransition(true); setRoom(next); setNearby(null); setHover(null)
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    transitionTimer.current = setTimeout(() => { engine.current?.setRoom(next); setTransition(false) }, 180)
  }, [])
  const openStory = useCallback((id: string) => {
    if (stories[id].destination) { changeRoom(stories[id].destination!); return }
    engine.current?.setPaused(true)
    setWelcome(false); setPanel({ kind: 'story', id })
    if (collectibleIds.includes(id)) setDiscovered(previous => previous.includes(id) ? previous : [...previous, id])
  }, [changeRoom])
  useEffect(() => {
    let cancelled = false
    import('./engine').then(({ createEngine }) => {
      if (cancelled || !container.current) return
      try {
        engine.current = createEngine(container.current, { interact: openStory, nearby: setNearby, hover: (id, x, y) => setHover(id ? { id, x, y } : null), error: () => setFailed(true) })
        setReady(true)
      } catch { setFailed(true) }
    }).catch(() => setFailed(true))
    return () => { cancelled = true; engine.current?.dispose(); engine.current = null; if (transitionTimer.current) clearTimeout(transitionTimer.current) }
  }, [openStory])
  useEffect(() => {
    engine.current?.setPaused(Boolean(panel) || failed || transition)
    if (panel) {
      if (!dialog.current?.open) dialog.current?.showModal()
      if (panel.kind === 'story') dialog.current?.querySelector<HTMLElement>('a[href], [data-advance]')?.focus()
    } else dialog.current?.close()
  }, [panel, failed, transition, ready])
  useEffect(() => { engine.current?.setSound(sound) }, [sound, ready])
  const current = rooms[room], activeStory = panel?.kind === 'story' ? stories[panel.id] : null
  useEffect(() => {
    const text = panel?.kind === 'story' ? stories[panel.id].text : ''
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setLetters(text.length); return }
    setLetters(0)
    const timer = setInterval(() => setLetters(count => {
      if (count >= text.length) { clearInterval(timer); return count }
      return count + 1
    }), 22)
    return () => clearInterval(timer)
  }, [panel])
  function advance() {
    if (!activeStory) return
    if (letters < activeStory.text.length) setLetters(activeStory.text.length)
    else closePanel()
  }
  return (
    <main className={styles.house}>
      <header className={styles.header}>
        <a href="/" className={styles.brand} aria-label="Alex Biba — classic website"><span>ALEX’S HOUSE</span></a>
        <div className={styles.headerActions}>
          <button className={styles.soundButton} onClick={() => setSound(!sound)} aria-pressed={sound} aria-label={sound ? 'Mute game sounds' : 'Enable game sounds'}><span aria-hidden="true">{sound ? '♫' : '♪'}</span><span>SOUND {sound ? 'ON' : 'OFF'}</span></button>
          <a href="/" className={styles.classicLink}>EXIT <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section className={styles.chapter} aria-label="Current location">
        <h1>{current.title}<span>{current.number}</span></h1>
      </section>

      <div className={`${styles.world} ${transition ? styles.transition : ''}`} ref={container} aria-busy={!ready && !failed}>
        {!ready && !failed && <div className={styles.loading}><span className={styles.loadingHouse}>⌂</span>LOADING…</div>}
        {hover && !panel && <div className={styles.tooltip} style={{ left: Math.min(Math.max(hover.x, 90), (container.current?.clientWidth || 900) - 90), top: hover.y - 48 }}><span>◆</span> {objectLabels[hover.id]}</div>}
      </div>

      {failed && <section className={styles.fallback}><span aria-hidden="true">⌂</span><h2>3D VIEW UNAVAILABLE</h2><p>Use the menu to read about my work and explore the house.</p><button className={styles.primary} onClick={() => setPanel({ kind: 'guide' })}>OPEN MENU</button></section>}

      <nav className={styles.floors} aria-label="House floors">{roomOrder.map(id => <button key={id} aria-label={rooms[id].label} onClick={() => changeRoom(id)} className={room === id ? styles.activeFloor : ''} aria-current={room === id ? 'location' : undefined}><span className={styles.menuArrow} aria-hidden="true">▶</span><span className={styles.floorLabel}>{rooms[id].label}</span><span className={styles.floorNumber}>{rooms[id].number}</span></button>)}</nav>
      <div className={styles.zoom}><button onClick={() => engine.current?.zoom(.1)} aria-label="Zoom in">+</button><button onClick={() => engine.current?.zoom(-.1)} aria-label="Zoom out">−</button></div>

      {ready && !failed && nearby && !panel && !welcome && <button className={styles.interact} onClick={() => engine.current?.interact()}><kbd>E</kbd>{objectLabels[nearby]}</button>}

      {welcome && !failed && <aside className={styles.welcome}>
        <span className={styles.speaker}>ALEX</span>
        <p>Hey, I’m Alex. Take a look around.</p>
        <p>Tap to walk, tap on an object to discover.</p>
        <button className={styles.continueButton} onClick={() => { setWelcome(false); container.current?.querySelector('canvas')?.focus() }}>LET’S GO <span aria-hidden="true">▼</span></button>
      </aside>}

      <footer className={styles.footer}>
        <div className={styles.keyboardHints}><span><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> <span>move</span></span><span><kbd>E</kbd> <span>interact</span></span><span className={styles.clickHint}>or click to explore</span></div>
        <div className={styles.mobileHint}>Tap to walk · tap an object to discover</div>
        <div className={styles.footerActions}><button onClick={() => setPanel({ kind: 'guide' })}><span aria-hidden="true">▤</span> MENU</button><button className={styles.help} onClick={() => setPanel({ kind: 'help' })} aria-label="How to play">?</button></div>
      </footer>

      <dialog ref={dialog} className={`${styles.dialog} ${activeStory ? styles.storyDialog : styles.menuDialog}`} onKeyDown={event => handleDialogKey(event, event.currentTarget, advance)} onCancel={event => { event.preventDefault(); closePanel() }} onPointerDown={event => backdropDismiss.current.pointerDown(event)} onPointerCancel={() => backdropDismiss.current.cancel()} onClick={event => backdropDismiss.current.click(event, closePanel)} aria-labelledby="house-dialog-title">
        <div className={styles.dialogContent}>
          <button className={styles.dialogClose} onClick={closePanel} aria-label="Close dialog">×</button>
          {activeStory && <>
            <h2 id="house-dialog-title" className={styles.speaker}>{activeStory.title}</h2>
            <div className={styles.storyBody}>
              <p><span aria-hidden="true">{activeStory.text.slice(0, letters)}<span className={styles.cursor}>{letters < activeStory.text.length ? '▌' : ''}</span></span><span className={styles.srOnly}>{activeStory.text}</span></p>
              {activeStory.links && <div className={styles.storyLinks} aria-label="Links">{activeStory.links.map(link => <a key={link.href} href={link.href} target={link.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer"><span className={styles.menuArrow} aria-hidden="true">▶</span><span className={styles.choiceText}>{link.label}</span><span className={styles.srOnly}>{link.href.startsWith('mailto:') ? '' : ' (opens in a new tab)'}</span></a>)}</div>}
            </div>
            <div className={styles.dialogFooter}><button className={styles.continueButton} data-advance onClick={advance}>{letters < activeStory.text.length ? 'SKIP' : 'CONTINUE'} <span aria-hidden="true">▼</span></button></div>
          </>}
          {panel?.kind === 'guide' && <>
            <h2 id="house-dialog-title">HOUSE MENU</h2>
            <div className={styles.guideRooms}>{roomOrder.map(id => <section key={id}><button className={styles.guideRoomTitle} onClick={() => changeRoom(id)}><span>{rooms[id].number}</span>{rooms[id].label}<span>↗</span></button><div className={styles.guideObjects}>{contents[id].filter(object => !stories[object].destination).map(object => <button key={object} onClick={() => openStory(object)}><span className={discovered.includes(object) ? styles.found : ''}>{discovered.includes(object) ? '✓' : '◇'}</span>{objectLabels[object]}</button>)}</div></section>)}</div>
            <div className={styles.guideProgress}>{discovered.length} of {collectibleIds.length} seen <progress max={collectibleIds.length} value={discovered.length} /></div>
          </>}
          {panel?.kind === 'help' && <>
            <h2 id="house-dialog-title">CONTROLS</h2>
            <div className={styles.helpRows}><p><strong>MOVE</strong>Arrow keys, or click the floor.</p><p><strong>INTERACT</strong>Click an object, door, or staircase to walk over and interact. Or walk up and press E.</p><p><strong>DIALOGUE</strong>↑ / ↓ to choose. E, Enter, or Space to select. Escape to close.</p><p><strong>MENU</strong>Jump to a room or read about an object.</p></div>
            <button className={styles.primary} onClick={closePanel}>BACK</button>
          </>}
        </div>
      </dialog>
      <noscript><div className={styles.fallback}>This house needs JavaScript to explore. <a href="/">Visit Alex’s classic website</a> for projects, writing, and contact details.</div></noscript>
    </main>
  )
}
