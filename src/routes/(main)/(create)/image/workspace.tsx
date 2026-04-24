'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';
import WideScreenButton from '@/features/WideScreenContainer/WideScreenButton';
import { useImageStore } from '@/store/image';

import ImageWorkspace from './features/ImageWorkspace';
import PromptInput from './features/PromptInput';

const ImageWorkspacePage = memo(() => {
  const { topicId } = useParams<{ topicId: string }>();

  useEffect(() => {
    if (topicId) useImageStore.setState({ activeGenerationTopicId: topicId });
    return () => {
      useImageStore.setState({ activeGenerationTopicId: null });
    };
  }, [topicId]);

  return (
    <>
      <NavHeader
        right={<WideScreenButton />}
        styles={{
          center: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            minWidth: 0,
          },
          left: { flex: 1, minWidth: 0 },
          right: { flex: 1, minWidth: 0 },
        }}
      />
      <Flexbox
        height={'100%'}
        style={{ flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
        width={'100%'}
      >
        <Flexbox flex={1} style={{ minHeight: 0, overflowY: 'auto' }} width={'100%'}>
          <WideScreenContainer wrapperStyle={{ minHeight: '100%' }}>
            <ImageWorkspace embedInput={false} />
          </WideScreenContainer>
        </Flexbox>
        <WideScreenContainer style={{ marginTop: -8, paddingBlockEnd: 12 }}>
          <PromptInput disableAnimation showTitle={false} />
        </WideScreenContainer>
      </Flexbox>
    </>
  );
});

ImageWorkspacePage.displayName = 'ImageWorkspacePage';
export default ImageWorkspacePage;
