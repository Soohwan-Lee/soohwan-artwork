import { artworks } from '@/data/artworks';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './Detail.module.css';

export async function generateStaticParams() {
  return artworks.map((artwork) => ({
    id: artwork.id,
  }));
}

export default async function ArtworkDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const artwork = artworks.find((a) => a.id === resolvedParams.id);

  if (!artwork) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <div className={styles.iframeWrapper}>
        <iframe
          src={artwork.liveUrl}
          title={artwork.theoryName}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      
      <main className={styles.content}>
        <div className={styles.topRow}>
          <Link href="/" className={styles.backLink}>
            <span>←</span> Back to Archive
          </Link>
          <div className={styles.number}>{artwork.number}</div>
        </div>
        
        <h1 className={styles.title}>{artwork.theoryName}</h1>
        <div className={styles.detailedExplanation}>
          {artwork.detailedExplanation}
        </div>
      </main>
    </div>
  );
}
