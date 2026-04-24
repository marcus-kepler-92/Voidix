'use client';

import { useCallback } from 'react';

import { isDesktop } from '@/const/version';
import { type UserInitializationState } from '@/types/user';

export const useDesktopUserStateRedirect = () => {
  // Desktop onboarding redirect is now handled by main process (BrowserManager)
  // No need to check localStorage here
  return useCallback(() => {}, []);
};

export const useWebUserStateRedirect = () => useCallback(() => {}, []);

export const useUserStateRedirect = () => {
  const desktopRedirect = useDesktopUserStateRedirect();
  const webRedirect = useWebUserStateRedirect();

  return useCallback(
    (_state: UserInitializationState) => {
      const redirect = isDesktop ? desktopRedirect : webRedirect;
      redirect();
    },
    [desktopRedirect, webRedirect],
  );
};
