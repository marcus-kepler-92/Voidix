import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getRouteById } from '@/config/routes';
import { SidebarTabKey } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

export interface NavItem {
  hidden?: boolean;
  icon: any;
  isNew?: boolean;
  key: string;
  onClick?: () => void;
  title: string;
  url?: string;
}

export interface NavLayout {
  bottomMenuItems: NavItem[];
  footer: {
    hideGitHub: boolean;
    layout: 'expanded' | 'compact';
    showEvalEntry: boolean;
    showSettingsEntry: boolean;
  };
  topNavItems: NavItem[];
  userPanel: {
    showDataImporter: boolean;
    showMemory: boolean;
  };
}

export const useNavLayout = (): NavLayout => {
  const { t } = useTranslation('common');
  const { showMarket, hideGitHub } = useServerConfigStore(featureFlagsSelectors);

  const topNavItems = useMemo(
    () =>
      [
        {
          icon: getRouteById('image')!.icon,
          key: SidebarTabKey.Image,
          title: t('tab.image'),
          url: '/image',
        },
        {
          icon: getRouteById('video')!.icon,
          key: SidebarTabKey.Video,
          title: t('tab.video'),
          url: '/video',
        },
      ] as NavItem[],
    [t],
  );

  const bottomMenuItems = useMemo(
    () =>
      [
        {
          hidden: !showMarket,
          icon: getRouteById('community')!.icon,
          key: SidebarTabKey.Community,
          title: t('tab.community'),
          url: '/community',
        },
        {
          hidden: true,
          icon: getRouteById('resource')!.icon,
          key: SidebarTabKey.Resource,
          title: t('tab.resource'),
          url: '/resource',
        },
        {
          hidden: true,
          icon: getRouteById('memory')!.icon,
          key: SidebarTabKey.Memory,
          title: t('tab.memory'),
          url: '/memory',
        },
      ] as NavItem[],
    [t, showMarket],
  );

  const footer = useMemo(
    () => ({
      hideGitHub: !!hideGitHub,
      layout: 'compact' as const,
      showEvalEntry: false,
      showSettingsEntry: true,
    }),
    [hideGitHub],
  );

  const userPanel = useMemo(
    () => ({
      showDataImporter: false,
      showMemory: false,
    }),
    [],
  );

  return { bottomMenuItems, footer, topNavItems, userPanel };
};
