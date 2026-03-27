import Link from 'next/link';
import styles from './Card.module.css';
import { Artwork } from '@/data/artworks';

export default function Card({ artwork }: { artwork: Artwork }) {
  return (
    <Link href={`/artwork/${artwork.id}`} className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.number}>{artwork.number}</div>
        <div className={styles.avatar}>
           <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#555' }} />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.theoryName}>{artwork.theoryName}</div>
        <div className={styles.description}>{artwork.description}</div>
      </div>
    </Link>
  );
}
