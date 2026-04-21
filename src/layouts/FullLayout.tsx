import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface FullLayoutProps {
  children?: ReactNode;
}

export const FullLayout = ({ children }: FullLayoutProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-subtle px-4 py-8">
      <div className="w-full max-w-md">{children ?? <Outlet />}</div>
    </div>
  );
};
