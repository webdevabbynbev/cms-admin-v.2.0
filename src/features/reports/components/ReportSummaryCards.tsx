import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReportSummaryCard } from '../types';

interface ReportSummaryCardsProps {
  cards: ReportSummaryCard[];
  columns?: 2 | 3 | 4;
}

const COLUMN_CLASS: Record<NonNullable<ReportSummaryCardsProps['columns']>, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

const ReportSummaryCardsComponent = ({
  cards,
  columns = 4,
}: ReportSummaryCardsProps) => (
  <div className={cn('grid grid-cols-1 gap-4', COLUMN_CLASS[columns])}>
    {cards.map((card) => (
      <Card key={card.label}>
        <CardContent className="flex items-center gap-4 p-5">
          {card.icon ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <card.icon className="h-6 w-6" />
            </div>
          ) : null}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium text-muted-foreground">
              {card.label}
            </span>
            <span className="truncate text-xl font-semibold text-foreground">
              {card.value}
            </span>
            {card.helper ? (
              <span className="truncate text-xs text-muted-foreground">
                {card.helper}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ReportSummaryCards = memo(ReportSummaryCardsComponent);
