import { useMemo, useState } from 'react';
import { ArrowUpDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  FlashSaleListTable,
  FlashSaleReorderDialog,
  FlashSaleStatsCards,
} from '../components';
import { useFlashSales } from '../hooks';
import { toFlashSaleListItem } from '../utils/normalize';
import {
  FLASH_SALE_STATUS_LABELS,
  FlashSaleStatus,
} from '../types';
import type { FlashSaleListItem } from '../types';

const FlashSaleListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FlashSaleStatus | 'all'>('all');
  const [reorderOpen, setReorderOpen] = useState(false);

  const { data, isLoading, isError } = useFlashSales();

  const listItems = useMemo<FlashSaleListItem[]>(() => {
    const raw = data ?? [];
    return raw
      .map(toFlashSaleListItem)
      .filter((item) => {
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          if (!item.title.toLowerCase().includes(q)) return false;
        }
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        return true;
      });
  }, [data, search, statusFilter]);

  const handleAdd = () => navigate('/flash-sales-new/new');
  const handleEdit = (sale: FlashSaleListItem) =>
    navigate(`/flash-sales-new/${sale.id}`);

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Flash Sale"
          description={`Kelola flash sale. ${data?.length ?? 0} total.`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setReorderOpen(true)}>
                <ArrowUpDown className="h-4 w-4" />
                Atur Urutan
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                Tambah Flash Sale
              </Button>
            </div>
          }
        />

        <FlashSaleStatsCards items={listItems} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul flash sale..."
            className="sm:max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as FlashSaleStatus | 'all')}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(FLASH_SALE_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FlashSaleListTable
          data={listItems}
          isLoading={isLoading}
          isError={isError}
          onEdit={handleEdit}
        />

        <FlashSaleReorderDialog open={reorderOpen} onOpenChange={setReorderOpen} />
      </PageContainer>
    </AppShell>
  );
};

export default FlashSaleListPage;
