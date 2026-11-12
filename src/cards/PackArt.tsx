import { PackEmblem } from './icons'
import { PACK_META } from './packMeta'
import type { PackId } from './types'
import styles from './cards.module.css'

export default function PackArt({ id, count }: { id: PackId; count: number }) {
  const meta = PACK_META[id]
  return (
    <div className={styles.box}><div className={styles.pack} data-pack={id}>
      <span className={`${styles.crimp} ${styles.crimpTop}`} />
      <span className={styles.tearLine} />
      <div className={styles.packBody}>
        <span className={styles.packBrand}>ALEX BIBA</span>
        <span className={styles.packEmblem}><PackEmblem pack={id} /></span>
        <span className={styles.packTitle}>{meta.title}</span>
        <span className={styles.packSub}>{meta.subtitle}</span>
        <span className={styles.packCount}>{count} CARDS</span>
      </div>
      <span className={`${styles.crimp} ${styles.crimpBottom}`} />
      <span className={styles.foil} /><span className={styles.glare} />
    </div></div>
  )
}
