'use client';

import { type PropsWithChildren, type ReactNode } from 'react';
import { memo, useLayoutEffect, useSyncExternalStore } from 'react';

import Sidebar from '@/routes/(main)/home/_layout/Sidebar';

import { NavPanelDraggable } from './components/NavPanelDraggable';

export const NAV_PANEL_RIGHT_DRAWER_ID = 'nav-panel-drawer';

type NavPanelSnapshot = {
  key: string;
  node: ReactNode;
  slimMode?: boolean;
} | null;

let currentSnapshot: NavPanelSnapshot = null;
const listeners = new Set<() => void>();

const subscribeNavPanel = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getNavPanelSnapshot = () => currentSnapshot;
const setNavPanelSnapshot = (snapshot: NavPanelSnapshot) => {
  currentSnapshot = snapshot;
  listeners.forEach((listener) => listener());
};

const NavPanel = memo(() => {
  const panelContent = useSyncExternalStore(
    subscribeNavPanel,
    getNavPanelSnapshot,
    getNavPanelSnapshot,
  );

  // Use home Content as fallback when no portal content is provided
  const activeContent = panelContent || { key: 'home', node: <Sidebar />, slimMode: true };

  return (
    <>
      <NavPanelDraggable activeContent={activeContent} />
      <div
        id={NAV_PANEL_RIGHT_DRAWER_ID}
        style={{
          height: '100%',
          position: 'relative',
          width: 0,
          zIndex: 10,
        }}
      />
    </>
  );
});

export default NavPanel;

interface NavPanelPortalProps extends PropsWithChildren {
  navKey?: string;
  slimMode?: boolean;
}

export const NavPanelPortal = memo<NavPanelPortalProps>(
  ({ children, navKey = 'default', slimMode }) => {
    useLayoutEffect(() => {
      if (!children) return;

      setNavPanelSnapshot({
        key: navKey,
        node: children,
        slimMode,
      });
      // Intentionally keep previous content until new one mounts.
    }, [children, navKey, slimMode]);

    return null;
  },
);
