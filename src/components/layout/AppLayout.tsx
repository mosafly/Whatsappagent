'use client';

import { useState, useCallback, ReactNode } from 'react';
import { Frame, Navigation, TopBar, Loading } from '@shopify/polaris';
import {
  HomeIcon,
  ChatIcon,
  PersonIcon,
  SendIcon,
  AutomationIcon,
  ThemeTemplateIcon,
  ChartVerticalFilledIcon,
  SettingsIcon,
} from '@shopify/polaris-icons';
import { useRouter, usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const [isLoading] = useState(false);

  const toggleMobileNavigationActive = useCallback(
    () => setMobileNavigationActive((prev) => !prev),
    [],
  );

  const isSelected = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navigationMarkup = (
    <Navigation location={pathname}>
      <Navigation.Section
        title="Bobotcho WhatsApp"
        items={[
          {
            url: '/',
            label: 'Dashboard',
            icon: HomeIcon,
            selected: isSelected('/'),
            onClick: () => { router.push('/'); setMobileNavigationActive(false); },
          },
          {
            url: '/conversations',
            label: 'Conversations',
            icon: ChatIcon,
            selected: isSelected('/conversations'),
            onClick: () => { router.push('/conversations'); setMobileNavigationActive(false); },
          },
          {
            url: '/contacts',
            label: 'Contacts',
            icon: PersonIcon,
            selected: isSelected('/contacts'),
            onClick: () => { router.push('/contacts'); setMobileNavigationActive(false); },
          },
        ]}
      />
      <Navigation.Section
        title="Marketing"
        items={[
          {
            url: '/campaigns',
            label: 'Campagnes',
            icon: SendIcon,
            selected: isSelected('/campaigns'),
            onClick: () => { router.push('/campaigns'); setMobileNavigationActive(false); },
          },
          {
            url: '/automations',
            label: 'Automations',
            icon: AutomationIcon,
            selected: isSelected('/automations'),
            onClick: () => { router.push('/automations'); setMobileNavigationActive(false); },
          },
          {
            url: '/templates',
            label: 'Templates',
            icon: ThemeTemplateIcon,
            selected: isSelected('/templates'),
            onClick: () => { router.push('/templates'); setMobileNavigationActive(false); },
          },
        ]}
      />
      <Navigation.Section
        title="Insights"
        items={[
          {
            url: '/analytics',
            label: 'Analytics',
            icon: ChartVerticalFilledIcon,
            selected: isSelected('/analytics'),
            onClick: () => { router.push('/analytics'); setMobileNavigationActive(false); },
          },
        ]}
        separator
      />
      <Navigation.Section
        items={[
          {
            url: '/configuration',
            label: 'Configuration',
            icon: SettingsIcon,
            selected: isSelected('/configuration'),
            onClick: () => { router.push('/configuration'); setMobileNavigationActive(false); },
          },
        ]}
      />
    </Navigation>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigationActive}
    />
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigationActive}
    >
      {isLoading && <Loading />}
      {children}
    </Frame>
  );
}
