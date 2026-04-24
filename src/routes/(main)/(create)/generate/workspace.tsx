'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';
import WideScreenButton from '@/features/WideScreenContainer/WideScreenButton';
import ImageWorkspace from '@/routes/(main)/(create)/image/features/ImageWorkspace';
import ImagePromptInput from '@/routes/(main)/(create)/image/features/PromptInput';
import VideoPromptInput from '@/routes/(main)/(create)/video/features/PromptInput';
import VideoWorkspace from '@/routes/(main)/(create)/video/features/VideoWorkspace';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors/systemStatus';
import { useImageStore } from '@/store/image';
import { useVideoStore } from '@/store/video';

const GenerateWorkspacePage = memo(() => {
  const { topicId } = useParams<{ topicId: string }>();
  const mode = useGlobalStore(systemStatusSelectors.generationMode);

  useEffect(() => {
    if (!topicId) return;
    if (mode === 'image') {
      useImageStore.setState({ activeGenerationTopicId: topicId });
    } else {
      useVideoStore.setState({ activeGenerationTopicId: topicId });
    }
    return () => {
      useImageStore.setState({ activeGenerationTopicId: null });
      useVideoStore.setState({ activeGenerationTopicId: null });
    };
  }, [topicId, mode]);

  const WorkspaceComponent = mode === 'video' ? VideoWorkspace : ImageWorkspace;
  const PromptInputComponent = mode === 'video' ? VideoPromptInput : ImagePromptInput;

  return (
    <>
      <NavHeader
        right={<WideScreenButton />}
        styles={{
          center: { alignItems: 'center', display: 'flex', justifyContent: 'center', minWidth: 0 },
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
            <WorkspaceComponent embedInput={false} />
          </WideScreenContainer>
        </Flexbox>
        <WideScreenContainer style={{ marginTop: -8, paddingBlockEnd: 12 }}>
          <PromptInputComponent disableAnimation showTitle={false} />
        </WideScreenContainer>
      </Flexbox>
    </>
  );
});

GenerateWorkspacePage.displayName = 'GenerateWorkspacePage';
export default GenerateWorkspacePage;
