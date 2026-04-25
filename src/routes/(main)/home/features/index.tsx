'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import DailyBrief from '@/features/DailyBrief';
import GalleryGrid from '@/routes/(main)/(create)/features/GalleryGrid';
import ImagePromptInput from '@/routes/(main)/(create)/image/features/PromptInput';
import VideoPromptInput from '@/routes/(main)/(create)/video/features/PromptInput';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors/systemStatus';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';
import { userGeneralSettingsSelectors } from '@/store/user/slices/settings/selectors';

import CommunityAgents from './CommunityAgents';
import WelcomeText from './WelcomeText';

const Home = memo(() => {
  const { i18n } = useTranslation();
  const isLogin = useUserStore(authSelectors.isLogin);
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);
  const mode = useGlobalStore(systemStatusSelectors.generationMode);

  const PromptInputComponent = mode === 'video' ? VideoPromptInput : ImagePromptInput;

  // eslint-disable-next-line @eslint-react/no-nested-component-definitions
  const Welcome = useCallback(() => <WelcomeText />, [i18n.language]);

  return (
    <Flexbox gap={40}>
      <Welcome />
      <PromptInputComponent disableAnimation showTitle={false} />
      <GalleryGrid />
      {isLogin && (
        <Flexbox>
          <DailyBrief />
        </Flexbox>
      )}
      <Flexbox gap={40}>{isDevMode && <CommunityAgents />}</Flexbox>
    </Flexbox>
  );
});

export default Home;
