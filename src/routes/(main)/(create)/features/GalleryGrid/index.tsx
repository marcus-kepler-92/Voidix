'use client';

import { Skeleton } from 'antd';
import { createStyles } from 'antd-style';
import { memo, useEffect, useState } from 'react';

import type { GalleryItemRecord } from '@/database/schemas/galleryItem';
import { lambdaClient } from '@/libs/trpc/client';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: 100%;
    padding-block: 24px 40px;
    padding-inline: 0;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
    width: 100%;
  `,
  item: css`
    cursor: pointer;

    position: relative;

    overflow: hidden;

    aspect-ratio: 1;
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorFillTertiary};

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s ease;
    }

    &:hover img {
      transform: scale(1.04);
    }
  `,
  title: css`
    position: absolute;
    inset-block-end: 0;
    inset-inline: 0;

    padding: 8px;

    font-size: 12px;
    line-height: 1.4;
    color: #fff;

    background: linear-gradient(transparent, rgb(0 0 0 / 50%));
  `,
  videoItem: css`
    & video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
}));

const GalleryGrid = memo(() => {
  const { styles, cx } = useStyles();
  const [items, setItems] = useState<GalleryItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lambdaClient.galleryItem.list
      .query()
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton.Image
              active
              key={i}
              style={{ aspectRatio: '1', height: '100%', width: '100%' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {items.map((item) => (
          <div className={cx(styles.item, item.type === 'video' && styles.videoItem)} key={item.id}>
            {item.type === 'video' ? (
              <video autoPlay loop muted playsInline src={item.url} />
            ) : (
              <img alt={item.title ?? ''} src={item.url} />
            )}
            {item.title && <div className={styles.title}>{item.title}</div>}
          </div>
        ))}
      </div>
    </div>
  );
});

GalleryGrid.displayName = 'GalleryGrid';
export default GalleryGrid;
