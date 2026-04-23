import { memo, useCallback, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortableItem {
  id: number | string;
}

interface SortableListProps<T extends SortableItem> {
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  disabled?: boolean;
  className?: string;
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function SortableListInner<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  disabled,
  className,
}: SortableListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>, index: number) => {
      dragIndexRef.current = index;
      setDragIndex(index);
      event.dataTransfer.effectAllowed = 'move';
      // Firefox requires data to be set for drag to start
      try {
        event.dataTransfer.setData('text/plain', String(index));
      } catch {
        // ignore
      }
    },
    [],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, index: number) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setOverIndex(index);
    },
    [],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, dropIndex: number) => {
      event.preventDefault();
      const from = dragIndexRef.current;
      dragIndexRef.current = null;
      setDragIndex(null);
      setOverIndex(null);
      if (from == null || from === dropIndex) return;
      onReorder(moveItem(items, from, dropIndex));
    },
    [items, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {items.map((item, index) => {
        const isDragging = dragIndex === index;
        const isOver = overIndex === index && dragIndex !== index;
        return (
          <div
            key={item.id}
            draggable={!disabled}
            onDragStart={(event) => handleDragStart(event, index)}
            onDragOver={(event) => handleDragOver(event, index)}
            onDrop={(event) => handleDrop(event, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'flex items-center gap-2 rounded-md border bg-card p-2 transition-all',
              isDragging && 'opacity-40',
              isOver && 'border-primary ring-2 ring-primary/30',
              disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          </div>
        );
      })}
    </div>
  );
}

export const SortableList = memo(SortableListInner) as typeof SortableListInner;
