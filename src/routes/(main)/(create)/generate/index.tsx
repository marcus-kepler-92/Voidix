'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';
import WideScreenButton from '@/features/WideScreenContainer/WideScreenButton';
import ImagePromptInput from '@/routes/(main)/(create)/image/features/PromptInput';
import VideoPromptInput from '@/routes/(main)/(create)/video/features/PromptInput';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors/systemStatus';

const GenerateHomePage = memo(() => {
  const mode = useGlobalStore(systemStatusSelectors.generationMode);
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
        <Flexbox flex={1} style={{ minHeight: 0 }} />
        <WideScreenContainer style={{ marginTop: -8, paddingBlockEnd: 12 }}>
          <PromptInputComponent disableAnimation showTitle={false} />
        </WideScreenContainer>
      </Flexbox>
    </>
  );
});

GenerateHomePage.displayName = 'GenerateHomePage';
export default GenerateHomePage;
