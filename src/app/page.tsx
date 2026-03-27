import { artworks } from '@/data/artworks';
import Card from '@/components/Card';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.tagline}>Expressive Computing Lab, UNIST</div>
        <h1 className={styles.title}>Group-centered AI &<br />Social Influence</h1>
        <div className={styles.bio}>
          <p>
            I am a Ph.D. candidate specializing in Human–Computer Interaction (HCI) and Human-centered AI. 
            My research investigates how AI systems reshape group dynamics—such as group decision-making, 
            social influence, and power dynamics—drawing on theories from social psychology.
          </p>
          <p>
            Rather than focusing on isolated interactions between a single user and an AI system, 
            my work advances a group-level perspective, examining how people experience, interpret, 
            and negotiate influence when AI agents participate in collective settings.
          </p>
          <p className={styles.mission}>
            Below is a collection of interactive web artworks visualising my research themes: 
            from multi-agent conformity to dissenting minority support systems.
          </p>
        </div>
      </header>

      <div className={styles.grid}>
        {artworks.map((artwork) => (
          <Card key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </main>
  );
}
