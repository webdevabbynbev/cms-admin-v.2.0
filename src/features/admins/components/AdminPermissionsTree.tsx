import { memo, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ALL_PERMISSION_KEYS, PERMISSION_SECTIONS } from '../types';

interface AdminPermissionsTreeProps {
  value: string[];
  onChange: (next: string[]) => void;
}

const AdminPermissionsTreeComponent = ({
  value,
  onChange,
}: AdminPermissionsTreeProps) => {
  const valueSet = useMemo(() => new Set(value), [value]);

  const allChecked = valueSet.size === ALL_PERMISSION_KEYS.length;
  const someChecked = valueSet.size > 0 && !allChecked;

  const toggleAll = (next: boolean) => {
    onChange(next ? [...ALL_PERMISSION_KEYS] : []);
  };

  const toggleItem = (key: string, next: boolean) => {
    if (next) onChange(Array.from(new Set([...value, key])));
    else onChange(value.filter((v) => v !== key));
  };

  const toggleSection = (keys: string[], next: boolean) => {
    if (next) onChange(Array.from(new Set([...value, ...keys])));
    else onChange(value.filter((v) => !keys.includes(v)));
  };

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
        <Checkbox
          checked={allChecked ? true : someChecked ? 'indeterminate' : false}
          onCheckedChange={(c) => toggleAll(Boolean(c))}
          aria-label="Pilih semua permission"
        />
        <span className="text-sm font-semibold">Pilih Semua Permission</span>
      </div>

      {PERMISSION_SECTIONS.map((section, idx) => {
        const sectionKeys = section.items.map((i) => i.value);
        const checkedCount = sectionKeys.filter((k) => valueSet.has(k)).length;
        const sectionAll = checkedCount === sectionKeys.length;
        const sectionSome = checkedCount > 0 && !sectionAll;

        return (
          <div
            key={section.key}
            className={cn(
              'px-4 py-3',
              idx < PERMISSION_SECTIONS.length - 1 && 'border-b border-border',
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <Checkbox
                checked={sectionAll ? true : sectionSome ? 'indeterminate' : false}
                onCheckedChange={(c) => toggleSection(sectionKeys, Boolean(c))}
                aria-label={section.label}
              />
              <span className="text-sm font-semibold">{section.label}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 pl-6 sm:grid-cols-2">
              {section.items.map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={valueSet.has(item.value)}
                    onCheckedChange={(c) => toggleItem(item.value, Boolean(c))}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const AdminPermissionsTree = memo(AdminPermissionsTreeComponent);
