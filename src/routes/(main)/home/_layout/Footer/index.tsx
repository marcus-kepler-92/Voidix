'use client';

import { type MenuProps } from '@lobehub/ui';
import { ActionIcon, DropdownMenu, Flexbox, Icon } from '@lobehub/ui';
import { GithubIcon } from '@lobehub/ui/icons';
import { CircleHelp, Feather, FlaskConical, Settings2, SettingsIcon } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { GITHUB } from '@/const/url';
import ThemeButton from '@/features/User/UserPanel/ThemeButton';
import { useFeedbackModal } from '@/hooks/useFeedbackModal';
import { useNavLayout } from '@/hooks/useNavLayout';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/slices/settings/selectors/general';
import { prefetchRoute } from '@/utils/router';

const Footer = memo(() => {
  const { t } = useTranslation('common');
  const { footer } = useNavLayout();
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);

  const { open: openFeedbackModal } = useFeedbackModal();

  const handleOpenFeedbackModal = useCallback(() => {
    openFeedbackModal();
  }, [openFeedbackModal]);

  const helpMenuItems: MenuProps['items'] = useMemo(
    () => [
      ...(footer.showSettingsEntry && !isDevMode
        ? [
            {
              icon: <Icon icon={Settings2} />,
              key: 'setting',
              label: <Link to="/settings">{t('userPanel.setting')}</Link>,
            },
            {
              type: 'divider' as const,
            },
          ]
        : []),
      {
        icon: <Icon icon={Feather} />,
        key: 'feedback',
        label: t('userPanel.feedback'),
        onClick: handleOpenFeedbackModal,
      },
    ],
    [footer.showSettingsEntry, handleOpenFeedbackModal, isDevMode, t],
  );

  return (
    <>
      {footer.layout === 'expanded' ? (
        <Flexbox horizontal align={'center'} gap={2} justify={'space-between'} padding={8}>
          <Flexbox horizontal align={'center'} flex={1} gap={2}>
            <DropdownMenu items={helpMenuItems} placement="topLeft">
              <ActionIcon
                aria-label={t('userPanel.help')}
                data-billboard-anchor=""
                icon={CircleHelp}
                size={16}
              />
            </DropdownMenu>
            {!footer.hideGitHub && (
              <a aria-label={'GitHub'} href={GITHUB} rel="noopener noreferrer" target={'_blank'}>
                <ActionIcon icon={GithubIcon} size={16} title={'GitHub'} />
              </a>
            )}
            <Link to="/eval">
              <ActionIcon icon={FlaskConical} size={16} title="Evaluation Lab" />
            </Link>
          </Flexbox>
          <ThemeButton placement={'topCenter'} size={16} />
        </Flexbox>
      ) : (
        <Flexbox horizontal align={'center'} gap={2} padding={8}>
          <DropdownMenu items={helpMenuItems} placement="topLeft">
            <ActionIcon aria-label={t('userPanel.help')} icon={CircleHelp} size={16} />
          </DropdownMenu>
          {isDevMode && (
            <Link to="/settings" onMouseEnter={() => prefetchRoute('/settings')}>
              <ActionIcon
                aria-label={t('userPanel.setting')}
                icon={SettingsIcon}
                size={16}
                title={t('userPanel.setting')}
              />
            </Link>
          )}
        </Flexbox>
      )}
    </>
  );
});

export default Footer;
