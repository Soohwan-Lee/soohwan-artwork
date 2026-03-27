import { artworks } from '@/data/artworks';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './Detail.module.css';

export async function generateStaticParams() {
  return artworks.map((artwork) => ({ id: artwork.id }));
}

export default async function ArtworkDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artwork = artworks.find((a) => a.id === id);
  if (!artwork) notFound();

  const sections = artwork.detailedExplanation.split('\n\n').filter(Boolean);

  return (
    <div className={styles.container}>
      {/* Live artwork embedded at top */}
      <div className={styles.artworkFrame}>
        <iframe
          src={artwork.liveUrl}
          title={artwork.theoryName}
          allowFullScreen
        />
      </div>

      {/* Text content below */}
      <main className={styles.content}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            ← Archive
          </Link>
          <span className={styles.number}>{artwork.number}</span>
        </nav>

        <h1 className={styles.title}>{artwork.theoryName}</h1>

        <div className={styles.explanation}>
          {sections.map((block, i) => {
            const isHeading = block.includes(':') && block.split(':')[0].length < 40 && !block.startsWith(' ');
            if (isHeading) {
              const [head, ...rest] = block.split(':');
              return (
                <div key={i} className={styles.explanationBlock}>
                  <p className={styles['section-heading']}>{head}</p>
                  <p className={styles['section-body']}>{rest.join(':').trim()}</p>
                </div>
              );
            }
            return (
              <div key={i} className={styles.explanationBlock}>
                <p className={styles['section-body']}>{block}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
