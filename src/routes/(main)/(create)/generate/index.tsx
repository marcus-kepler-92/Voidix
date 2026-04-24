'use client';

import { memo } from 'react';

import CreateGenerationPage from '@/routes/(main)/(create)/features/CreateGenerationPage';
import ImagePromptInput from '@/routes/(main)/(create)/image/features/PromptInput';
import VideoPromptInput from '@/routes/(main)/(create)/video/features/PromptInput';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors/systemStatus';

const GenerateHomePage = memo(() => {
  const mode = useGlobalStore(systemStatusSelectors.generationMode);
  const PromptInput = mode === 'video' ? VideoPromptInput : ImagePromptInput;
  return <CreateGenerationPage PromptInput={PromptInput} />;
});

GenerateHomePage.displayName = 'GenerateHomePage';
export default GenerateHomePage;
