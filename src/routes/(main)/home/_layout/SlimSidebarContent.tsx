'use client';

import { Center, Icon } from '@lobehub/ui';
import { createStaticStyles, cx } from 'antd-style';
import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import UserAvatar from '@/features/User/UserAvatar';
import UserPanel from '@/features/User/UserPanel';
import { useActiveTabKey } from '@/hooks/useActiveTabKey';
import { useNavLayout } from '@/hooks/useNavLayout';
import { isModifierClick } from '@/utils/navigation';
import { prefetchRoute } from '@/utils/router';

const styles = createStaticStyles(({ css, cssVar }) => ({
  active: css`
    background: ${cssVar.colorFillTertiary};

    .slim-icon {
      color: ${cssVar.colorText};
    }

    .slim-label {
      color: ${cssVar.colorText};
    }
  `,
  icon: css`
    color: ${cssVar.colorTextDescription};
  `,
  item: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    justify-content: center;

    width: 56px;
    padding-block: 6px;
    padding-inline: 4px;
    border-radius: 8px;

    text-decoration: none;

    transition: background 0.15s;

    &:hover {
      background: ${cssVar.colorFillSecondary};
    }
  `,
  label: css`
    overflow: hidden;

    max-width: 52px;

    font-size: 10px;
    line-height: 1.2;
    color: ${cssVar.colorTextSecondary};
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  list: css`
    overflow: hidden auto;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    align-items: center;

    width: 100%;
    padding-block: 4px;
  `,
  root: css`
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;

    width: 72px;
    height: 100%;
    padding-block: 8px 0;
  `,
  userAvatar: css`
    cursor: pointer;
    margin-block-end: 8px;
    border-radius: 8px;

    &:hover {
      background: ${cssVar.colorFillSecondary};
    }
  `,
}));

const SlimSidebarContent = memo(() => {
  const tab = useActiveTabKey();
  const navigate = useNavigate();
  const { topNavItems, bottomMenuItems } = useNavLayout();

  const items = [...topNavItems, ...bottomMenuItems.filter((item) => !item.hidden)];

  return (
    <div className={styles.root}>
      <UserPanel>
        <Center className={styles.userAvatar} height={44} width={56}>
          <UserAvatar shape="square" size={28} />
        </Center>
      </UserPanel>

      <div className={styles.list}>
        {items.map((item) => {
          if (!item.url) return null;
          const isActive = tab === item.key;
          return (
            <Link
              className={cx(styles.item, isActive && styles.active)}
              key={item.key}
              to={item.url}
              onMouseEnter={() => prefetchRoute(item.url!)}
              onClick={(e) => {
                if (isModifierClick(e)) return;
                e.preventDefault();
                navigate(item.url!);
              }}
            >
              <Icon className={cx(styles.icon, 'slim-icon')} icon={item.icon} size={20} />
              <span className={cx(styles.label, 'slim-label')}>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
});

SlimSidebarContent.displayName = 'SlimSidebarContent';
export default SlimSidebarContent;
