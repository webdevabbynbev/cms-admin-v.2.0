import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingStateComponent = ({
  message = 'Loading...',
  className,
  fullScreen = false,
}: LoadingStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-foreground',
        fullScreen ? 'min-h-screen' : 'py-12',
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">{message}</p>
    </div>
  );
};

export const LoadingState = memo(LoadingStateComponent);

interface TableSkeletonProps {
  rows?: number;
  columns: number;
}

const TableSkeletonComponent = ({ rows = 5, columns }: TableSkeletonProps) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

export const TableSkeleton = memo(TableSkeletonComponent);
