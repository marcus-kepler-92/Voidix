'use client';

import { memo } from 'react';

import CreateGenerationPage from '@/routes/(main)/(create)/features/CreateGenerationPage';

import PromptInput from './features/PromptInput';

const VideoHomePage = memo(() => <CreateGenerationPage PromptInput={PromptInput} />);

VideoHomePage.displayName = 'VideoHomePage';
export default VideoHomePage;
