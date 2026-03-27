import Link from 'next/link';
import styles from './Card.module.css';
import { Artwork } from '@/data/artworks';

export default function Card({ artwork }: { artwork: Artwork }) {
  return (
    <Link href={`/artwork/${artwork.id}`} className={styles.card}>
      <div className={styles.topRow}>
        <span className={styles.number}>{artwork.number}</span>
        <span className={styles.arrow}>↗</span>
      </div>
      <div className={styles.content}>
        <div className={styles.theoryName}>{artwork.theoryName}</div>
        <div className={styles.description}>{artwork.description}</div>
      </div>
    </Link>
  );
}
