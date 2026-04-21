import { memo, type ReactNode } from 'react';
import { MainLayout } from './MainLayout';
import { SidebarNav } from './SidebarNav';
import { HeaderActions } from './HeaderActions';

interface AppShellProps {
  children?: ReactNode;
}

const AppShellComponent = ({ children }: AppShellProps) => (
  <MainLayout sidebar={<SidebarNav />} header={<HeaderActions />}>
    {children}
  </MainLayout>
);

export const AppShell = memo(AppShellComponent);
