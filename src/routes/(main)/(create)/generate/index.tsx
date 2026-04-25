'use client';

import { Center, Flexbox } from '@lobehub/ui';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ImagePromptInput from '@/routes/(main)/(create)/image/features/PromptInput';
import VideoPromptInput from '@/routes/(main)/(create)/video/features/PromptInput';
import WelcomeText from '@/routes/(main)/home/features/WelcomeText';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors/systemStatus';

const GenerateHomePage = memo(() => {
  const { i18n } = useTranslation();
  const mode = useGlobalStore(systemStatusSelectors.generationMode);
  const PromptInputComponent = mode === 'video' ? VideoPromptInput : ImagePromptInput;

  // eslint-disable-next-line @eslint-react/no-nested-component-definitions
  const Welcome = useCallback(() => <WelcomeText />, [i18n.language]);

  return (
    <Center height={'100%'} style={{ flexDirection: 'column', overflow: 'hidden' }} width={'100%'}>
      <Flexbox style={{ maxWidth: 680, padding: '0 16px', width: '100%' }}>
        <Welcome />
        <PromptInputComponent disableAnimation showTitle={false} />
      </Flexbox>
    </Center>
  );
});

GenerateHomePage.displayName = 'GenerateHomePage';
export default GenerateHomePage;
