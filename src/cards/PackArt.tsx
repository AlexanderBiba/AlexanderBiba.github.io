import { PackEmblem } from './icons'
import { PACK_META } from './packMeta'
import type { PackId } from './types'
import styles from './cards.module.css'

const TEETH = 16, DEPTH = 1.6
// Serrated foil edges along the top and bottom, as a clip-path polygon in percent.
function edge(y: number, down: boolean) {
  const points: string[] = []
  for (let i = 0; i <= TEETH * 2; i++) points.push(`${(i / (TEETH * 2)) * 100}% ${y + (i % 2 ? (down ? DEPTH : -DEPTH) : 0)}%`)
  return points
}
// A jagged rip just under the tear line, fixed so it looks the same every time.
export const RIP_Y = 13
export const rip = Array.from({ length: 25 }, (_, i) => [(i / 24) * 100, RIP_Y + [0.6, -0.8, 1.1, -0.3, 0.9, -1, 0.2, 1.2, -0.6, 0.5, -1.1, 0.8, 0, -0.7, 1, -0.4, 0.7, -0.9, 0.3, 1.1, -0.5, 0.6, -1, 0.4, 0][i]])
const whole = `polygon(${[...edge(0, true), ...edge(100, false).reverse()].join(', ')})`
const torn = `polygon(${[...rip.map(([x, y]) => `${x}% ${y}%`), ...edge(100, false).reverse()].join(', ')})`
export const flapClip = `polygon(0% 0%, 100% 0%, ${[...rip].reverse().map(([x, y]) => `${x}% ${y}%`).join(', ')})`

const sparkles = [[14, 33, 0], [84, 28, 1.1], [22, 70, 2.3], [78, 63, 0.6], [50, 88, 1.7], [10, 52, 2.9]]

export default function PackArt({ id, count, cover, opened = false }: { id: PackId; count: number; cover?: string; opened?: boolean }) {
  const meta = PACK_META[id]
  return (
    <div className={styles.box}>
      <div className={styles.pack} data-pack={id} style={{ clipPath: opened ? torn : whole }}>
        <span className={styles.crinkle} />
        <span className={`${styles.crimp} ${styles.crimpTop}`} />
        <span className={styles.tearLine}><svg className={styles.scissors} viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="6.5" r="3" /><circle cx="5" cy="17.5" r="3" /><path d="M7.6 8 22 15.5M7.6 16 22 8.5" /></g></svg><em>TEAR HERE</em></span>
        <span className={styles.ribbon}>ALEX BIBA <b>✦</b> SERIES 01</span>
        <span className={styles.window}>
          {cover ? <img src={cover} alt="" draggable={false} /> : <span className={styles.windowEmblem}><PackEmblem pack={id} /></span>}
          <span className={styles.windowGloss} />
        </span>
        <span className={styles.packTitle}>{meta.title}</span>
        <span className={styles.packSub}>{meta.subtitle}</span>
        <span className={styles.burstSticker}><b>{count}</b>CARDS</span>
        <span className={styles.strap}>★ HOLO FOIL INSIDE ★</span>
        <span className={`${styles.crimp} ${styles.crimpBottom}`} />
        {sparkles.map(([x, y, delay], i) => <span key={i} className={styles.sparkle} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }} />)}
        <span className={styles.foil} /><span className={styles.sheen} /><span className={styles.glare} />
      </div>
    </div>
  )
}

const bars = [3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2, 2, 1, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1]

export function PackBack({ id, names }: { id: PackId; names: string[] }) {
  const meta = PACK_META[id]
  return (
    <div className={styles.box}>
      <div className={`${styles.pack} ${styles.packBack}`} data-pack={id} style={{ clipPath: whole }}>
        <span className={styles.crinkle} />
        <span className={`${styles.crimp} ${styles.crimpTop}`} />
        <span className={styles.backBrand}>ALEX BIBA <b>✦</b> SERIES 01</span>
        <span className={styles.backTitle}>{meta.title} PACK</span>
        <span className={styles.inside}>
          <em>WHAT’S INSIDE</em>
          {names.map((name, i) => <span key={name}><b>{String(i + 1).padStart(2, '0')}</b>{name}</span>)}
        </span>
        <span className={styles.barcode}>
          <span className={styles.bars}>{bars.map((w, i) => <i key={i} style={{ width: `${w * 0.55}cqw` }} />)}</span>
          alexbiba.com/play
        </span>
        <span className={`${styles.crimp} ${styles.crimpBottom}`} />
        <span className={styles.foil} /><span className={styles.glare} />
      </div>
    </div>
  )
}
