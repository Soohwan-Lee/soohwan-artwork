import { artworks } from '@/data/artworks';
import Card from '@/components/Card';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Personal Archive · Social Psychology × HCI</p>
        <h1 className={styles.title}>Group<br />Dynamics</h1>
        <div className={styles.bio}>
          <p>
            I study how AI systems reshape human group dynamics—
            social influence, power asymmetries, and collective decision-making. 
            My work draws on social psychology to design interactive systems grounded 
            in empirical evidence.
          </p>
          <div className={styles.divider} />
          <p className={styles.mission}>
            This archive is a collection of interactive experiments that make
            those invisible forces visible.
          </p>
        </div>
      </section>

      <p className={styles.gridLabel}>Experiments — {artworks.length} works</p>
      <div className={styles.grid}>
        {artworks.map((artwork) => (
          <Card key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </main>
  );
}
