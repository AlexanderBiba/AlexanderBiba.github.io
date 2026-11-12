import { Icon } from './icons'
import type { CardData } from './types'
import styles from './cards.module.css'

const symbol = { blog: '●', works: '◆', social: '★' }

export function CardFront({ card, total }: { card: CardData; total: number }) {
  const long = card.name.length > 22
  return (
    <div className={styles.box}><div className={`${styles.card} ${styles.front}`} data-pack={card.pack}>
      <div className={styles.inner}>
        <div className={styles.head}><span className={`${styles.name} ${long ? styles.longName : ''}`}>{card.name}</span><span className={styles.tag}>{card.tag}</span></div>
        <div className={styles.art} data-icon={card.art.kind === 'icon' ? card.art.icon : undefined}>
          {card.art.kind === 'image' ? <img src={card.art.src} alt="" loading="lazy" draggable={false} /> : <Icon name={card.art.icon} />}
          <span className={styles.artFoil} />
        </div>
        <div className={styles.meta}><span>#{String(card.no).padStart(2, '0')}/{String(total).padStart(2, '0')}</span>{card.meta.map(item => <span key={item}>{item}</span>)}</div>
        <p className={styles.text}>{card.text}</p>
        <div className={styles.foot}><span>{card.foot}</span><span className={styles.symbol} aria-hidden="true">{symbol[card.pack]}</span></div>
      </div>
      <span className={styles.foil} /><span className={styles.glare} />
    </div></div>
  )
}

export function CardBack() {
  return (
    <div className={styles.box}><div className={`${styles.card} ${styles.back}`}>
      <div className={styles.backInner}><span className={styles.monogram}>AB</span><span className={styles.backName}>ALEX BIBA</span></div>
      <span className={styles.foil} /><span className={styles.glare} />
    </div></div>
  )
}
