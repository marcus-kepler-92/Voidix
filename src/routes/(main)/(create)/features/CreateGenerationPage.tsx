'use client';

import { Flexbox } from '@lobehub/ui';
import type { ComponentType } from 'react';
import { memo } from 'react';

import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';
import WideScreenButton from '@/features/WideScreenContainer/WideScreenButton';

import GalleryGrid from './GalleryGrid';

interface CreateGenerationPageProps {
  PromptInput: ComponentType<{ disableAnimation?: boolean; showTitle?: boolean }>;
}

const CreateGenerationPage = memo<CreateGenerationPageProps>(({ PromptInput }) => (
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
          <Flexbox
            align={'center'}
            direction={'vertical'}
            style={{ minHeight: 'calc(100vh - 180px)', paddingBlockStart: 80 }}
            width={'100%'}
          >
            <PromptInput disableAnimation showTitle />
            <GalleryGrid />
          </Flexbox>
        </WideScreenContainer>
      </Flexbox>
    </Flexbox>
  </>
));

CreateGenerationPage.displayName = 'CreateGenerationPage';
export default CreateGenerationPage;
