'use client';

import { Flexbox } from '@lobehub/ui';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import GenerateTopicSidebar from './GenerateTopicSidebar';

const GenerateLayout = () => (
  <Flexbox horizontal flex={1} height={'100%'} style={{ overflow: 'hidden' }}>
    <Suspense>
      <GenerateTopicSidebar />
    </Suspense>
    <Flexbox flex={1} height={'100%'} style={{ overflow: 'hidden', position: 'relative' }}>
      <Outlet />
    </Flexbox>
  </Flexbox>
);

GenerateLayout.displayName = 'GenerateLayout';
export default GenerateLayout;
