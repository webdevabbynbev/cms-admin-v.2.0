import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeClassMap: Record<NonNullable<PageContainerProps['size']>, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  full: 'max-w-none',
};

const PageContainerComponent = ({
  children,
  className,
  size = 'full',
}: PageContainerProps) => {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8',
        sizeClassMap[size],
        className,
      )}
    >
      {children}
    </div>
  );
};

export const PageContainer = memo(PageContainerComponent);
