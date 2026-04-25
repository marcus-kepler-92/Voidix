'use client';

import { ActionIcon, Avatar, Flexbox, Icon, Text } from '@lobehub/ui';
import { App } from 'antd';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import { Film, ImageIcon, Plus, Trash } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { useGlobalStore } from '@/store/global';
import { useImageStore } from '@/store/image';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';
import { useVideoStore } from '@/store/video';
import { type ImageGenerationTopic } from '@/types/generation';

const SIDEBAR_WIDTH = 220;

const styles = createStaticStyles(({ css, cssVar }) => ({
  active: css`
    background: ${cssVar.colorFillTertiary};
  `,
  container: css`
    overflow: hidden;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;

    width: ${SIDEBAR_WIDTH}px;
    height: 100%;
    border-inline-end: 1px solid ${cssVar.colorBorderSecondary};

    background: ${cssVar.colorBgLayout};
  `,
  divider: css`
    flex-shrink: 0;

    height: 1px;
    margin-block: 4px;
    margin-inline: 8px;

    background: ${cssVar.colorBorderSecondary};
  `,
  header: css`
    flex-shrink: 0;
    padding-block: 12px 4px;
    padding-inline: 8px;
  `,
  item: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    min-height: 44px;
    padding-block: 4px;
    padding-inline: 8px;
    border-radius: 8px;

    .topic-delete-btn {
      opacity: 0;
      transition: opacity 0.15s;
    }

    &:hover {
      background: ${cssVar.colorFillSecondary};

      .topic-delete-btn {
        opacity: 1;
      }
    }
  `,
  list: css`
    overflow: hidden auto;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;

    padding-block: 4px 8px;
    padding-inline: 8px;
  `,
  newButton: css`
    cursor: pointer;

    display: flex;
    gap: 6px;
    align-items: center;

    width: 100%;
    height: 36px;
    padding-block: 0;
    padding-inline: 8px;
    border: none;
    border-radius: 8px;

    font-size: 13px;
    color: ${cssVar.colorText};

    background: ${cssVar.colorFillSecondary};

    transition: background 0.15s;

    &:hover {
      background: ${cssVar.colorFill};
    }
  `,
}));

type MixedTopic = ImageGenerationTopic & { topicType: 'image' | 'video' };

const GenerateTopicSidebar = memo(() => {
  const { t } = useTranslation('common');
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const { topicId } = useParams<{ topicId: string }>();
  const updateSystemStatus = useGlobalStore((s) => s.updateSystemStatus);
  const isLogin = useUserStore(authSelectors.isLogin);

  const imageTopics = useImageStore((s) => s.generationTopics);
  const videoTopics = useVideoStore((s) => s.generationTopics);
  const useFetchImageTopics = useImageStore((s) => s.useFetchGenerationTopics);
  const useFetchVideoTopics = useVideoStore((s) => s.useFetchGenerationTopics);
  const removeImageTopic = useImageStore((s) => s.removeGenerationTopic);
  const removeVideoTopic = useVideoStore((s) => s.removeGenerationTopic);

  useFetchImageTopics(!!isLogin);
  useFetchVideoTopics(!!isLogin);

  const topics = useMemo<MixedTopic[]>(() => {
    const image: MixedTopic[] = imageTopics.map((item) => ({
      ...item,
      topicType: 'image' as const,
    }));
    const video: MixedTopic[] = videoTopics.map((item) => ({
      ...item,
      topicType: 'video' as const,
    }));
    return [...image, ...video].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [imageTopics, videoTopics]);

  const handleNewTopic = () => {
    navigate('/generate');
  };

  const handleTopicClick = (topic: MixedTopic) => {
    updateSystemStatus({ generationMode: topic.topicType });
    navigate(`/generate/${topic.id}`);
  };

  const handleDelete = (e: React.MouseEvent, topic: MixedTopic) => {
    e.stopPropagation();
    e.preventDefault();
    modal.confirm({
      cancelText: t('cancel'),
      content: t('generate.deleteTopicDesc'),
      okButtonProps: { danger: true },
      okText: t('delete'),
      onOk: async () => {
        if (topic.topicType === 'image') {
          await removeImageTopic(topic.id);
        } else {
          await removeVideoTopic(topic.id);
        }
        if (topicId === topic.id) navigate('/generate');
      },
      title: t('generate.deleteTopicTitle'),
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.newButton} type="button" onClick={handleNewTopic}>
          <Icon color={cssVar.colorTextSecondary} icon={Plus} size={14} />
          {t('generate.newTopic')}
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.list}>
        {topics.map((topic) => {
          const isActive = topic.id === topicId;
          return (
            <div
              className={cx(styles.item, isActive && styles.active)}
              key={`${topic.topicType}-${topic.id}`}
              onClick={() => handleTopicClick(topic)}
            >
              <Avatar
                avatar={topic.coverUrl ?? ''}
                background={cssVar.colorFillSecondary}
                shape="square"
                size={32}
                style={{ flexShrink: 0 }}
              />
              <Flexbox flex={1} gap={2} style={{ minWidth: 0 }}>
                <Text ellipsis style={{ fontSize: 13 }}>
                  {topic.title || t('generate.untitledTopic')}
                </Text>
                <Flexbox horizontal align="center" gap={4}>
                  <Icon
                    color={cssVar.colorTextDescription}
                    icon={topic.topicType === 'video' ? Film : ImageIcon}
                    size={11}
                  />
                </Flexbox>
              </Flexbox>
              <ActionIcon
                className="topic-delete-btn"
                icon={Trash}
                size="small"
                onClick={(e) => handleDelete(e, topic)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

GenerateTopicSidebar.displayName = 'GenerateTopicSidebar';
export default GenerateTopicSidebar;
