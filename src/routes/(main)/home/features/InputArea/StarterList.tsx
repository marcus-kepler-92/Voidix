import { BUILTIN_AGENT_SLUGS } from '@lobechat/builtin-agents';
import { Jimeng } from '@lobehub/icons';
import { type ButtonProps } from '@lobehub/ui';
import { Button, Center } from '@lobehub/ui';
import { createStaticStyles, cssVar } from 'antd-style';
import { ImageIcon } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useInitBuiltinAgent } from '@/hooks/useInitBuiltinAgent';
import { useStableNavigate } from '@/hooks/useStableNavigate';
import { type StarterMode } from '@/store/home';

const styles = createStaticStyles(({ css, cssVar }) => ({
  button: css`
    height: 40px;
    border-color: ${cssVar.colorFillSecondary};
    background: transparent;
    box-shadow: none !important;

    &:hover {
      border-color: ${cssVar.colorFillSecondary} !important;
      background: ${cssVar.colorBgElevated} !important;
    }
  `,
}));

type StarterTitleKey = 'starter.imageGeneration' | 'starter.videoGeneration';

interface StarterItem {
  hot?: boolean;
  icon?: ButtonProps['icon'];
  key: StarterMode;
  titleKey: StarterTitleKey;
}

const StarterList = memo(() => {
  const { t } = useTranslation('home');

  useInitBuiltinAgent(BUILTIN_AGENT_SLUGS.agentBuilder);
  useInitBuiltinAgent(BUILTIN_AGENT_SLUGS.groupAgentBuilder);
  useInitBuiltinAgent(BUILTIN_AGENT_SLUGS.pageAgent);

  const navigate = useStableNavigate();

  const items: StarterItem[] = useMemo(
    () => [
      {
        hot: true,
        icon: ImageIcon,
        key: 'image',
        titleKey: 'starter.imageGeneration',
      },
      {
        hot: true,
        icon: Jimeng.Color,
        key: 'video',
        titleKey: 'starter.videoGeneration',
      },
    ],
    [],
  );

  const handleClick = useCallback(
    (key: StarterMode) => {
      if (key === 'video') {
        navigate('/video?model=doubao-seedance-2-0-260128');
        return;
      }

      if (key === 'image') {
        navigate('/image?model=gpt-image-2');
      }
    },
    [navigate],
  );

  return (
    <Center horizontal gap={8}>
      {items.map((item) => {
        const button = (
          <Button
            className={styles.button}
            icon={item.icon}
            key={item.key}
            shape={'round'}
            variant={'outlined'}
            iconProps={{
              color: cssVar.colorTextSecondary,
              size: 18,
            }}
            onClick={() => handleClick(item.key)}
          >
            {t(item.titleKey)}
            {item.hot && ' 🔥'}
          </Button>
        );

        return button;
      })}
    </Center>
  );
});

export default StarterList;
