import { memo, type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type KpiVariant = 'interactive' | 'accent' | 'success' | 'error' | 'award' | 'disabled';

interface KpiCardProps {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  variant?: KpiVariant;
  deltaValue?: number | string;
  deltaLabel?: string;
  isLoading?: boolean;
}

const variantClassMap: Record<KpiVariant, { bg: string; text: string }> = {
  interactive: { bg: 'bg-interactive-bg', text: 'text-interactive' },
  accent: { bg: 'bg-accent-bg', text: 'text-accent' },
  success: { bg: 'bg-success-bg', text: 'text-success' },
  error: { bg: 'bg-error-bg', text: 'text-error' },
  award: { bg: 'bg-award-bg', text: 'text-award' },
  disabled: { bg: 'bg-disabled-bg', text: 'text-disabled' },
};

const KpiCardComponent = ({
  title,
  value,
  icon: Icon,
  variant = 'interactive',
  deltaValue,
  deltaLabel,
  isLoading = false,
}: KpiCardProps) => {
  const colorClasses = variantClassMap[variant];

  return (
    <Card className="h-full">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
            colorClasses.bg,
          )}
        >
          <Icon className={cn('h-7 w-7', colorClasses.text)} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {isLoading ? '—' : value}
            </span>
            {!isLoading && deltaValue !== undefined ? (
              <span className="rounded-md bg-success-bg px-2 py-0.5 text-xs text-success">
                +{deltaValue}
                {deltaLabel ? ` ${deltaLabel}` : ''}
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const KpiCard = memo(KpiCardComponent);
