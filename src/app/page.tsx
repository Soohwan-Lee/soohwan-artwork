import { artworks } from '@/data/artworks';
import Card from '@/components/Card';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Social Psychology & HCI Artworks</h1>
        <p className={styles.subtitle}>
          Visualizing human behavior through interactive digital experiences. A personal archive of web experiments.
        </p>
      </header>

      <div className={styles.grid}>
        {artworks.map((artwork) => (
          <Card key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </main>
  );
}
