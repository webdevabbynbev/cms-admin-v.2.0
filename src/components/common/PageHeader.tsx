import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

const PageHeaderComponent = ({ title, description, actions, className }: PageHeaderProps) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 pb-4 border-b border-border',
        'sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
};

export const PageHeader = memo(PageHeaderComponent);
