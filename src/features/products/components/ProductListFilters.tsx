import { memo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBrands } from '../hooks';
import { ProductStatusFilter, SeoStatusFilter } from '../types';

export interface ProductFilterState {
  name: string;
  status: ProductStatusFilter;
  brandId: number | null;
  seoStatus: SeoStatusFilter;
}

interface ProductListFiltersProps {
  value: ProductFilterState;
  onChange: (next: ProductFilterState) => void;
  onReset: () => void;
}

const BRAND_ALL = '__all__';

const ProductListFiltersComponent = ({ value, onChange, onReset }: ProductListFiltersProps) => {
  const { data: brands = [] } = useBrands();

  const setField = <K extends keyof ProductFilterState>(key: K, v: ProductFilterState[K]) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-1 min-w-[200px] flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Search</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search product name..."
            value={value.name}
            onChange={(e) => setField('name', e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex min-w-[160px] flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <Select
          value={value.status}
          onValueChange={(v) => setField('status', v as ProductStatusFilter)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ProductStatusFilter.All}>All status</SelectItem>
            <SelectItem value={ProductStatusFilter.Normal}>Normal</SelectItem>
            <SelectItem value={ProductStatusFilter.Draft}>Draft</SelectItem>
            <SelectItem value={ProductStatusFilter.War}>Flash Sale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-[180px] flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Brand</label>
        <Select
          value={value.brandId == null ? BRAND_ALL : String(value.brandId)}
          onValueChange={(v) =>
            setField('brandId', v === BRAND_ALL ? null : Number(v))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={BRAND_ALL}>All brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-[160px] flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">SEO</label>
        <Select
          value={value.seoStatus}
          onValueChange={(v) => setField('seoStatus', v as SeoStatusFilter)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SeoStatusFilter.All}>All SEO</SelectItem>
            <SelectItem value={SeoStatusFilter.Filled}>SEO filled</SelectItem>
            <SelectItem value={SeoStatusFilter.Empty}>SEO empty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={onReset} type="button">
        <X className="h-4 w-4" />
        Reset
      </Button>
    </div>
  );
};

export const ProductListFilters = memo(ProductListFiltersComponent);
