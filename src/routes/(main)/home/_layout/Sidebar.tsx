import { memo } from 'react';

import { NavPanelPortal } from '@/features/NavPanel';

import SlimSidebarContent from './SlimSidebarContent';

const Sidebar = memo(() => {
  return (
    <NavPanelPortal slimMode navKey="home">
      <SlimSidebarContent />
    </NavPanelPortal>
  );
});

export default Sidebar;
