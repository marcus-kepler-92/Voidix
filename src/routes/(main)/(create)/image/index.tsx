'use client';

import { memo } from 'react';

import CreateGenerationPage from '@/routes/(main)/(create)/features/CreateGenerationPage';

import PromptInput from './features/PromptInput';

const ImageHomePage = memo(() => <CreateGenerationPage PromptInput={PromptInput} />);

ImageHomePage.displayName = 'ImageHomePage';
export default ImageHomePage;
