import { useEffect, useMemo, useState } from 'react';
import { useForm, FormProvider, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';

import {
  FlashSaleAddItemsCard,
  FlashSaleBulkActionsCard,
  FlashSaleFormActions,
  FlashSaleInfoCard,
  FlashSaleScheduleCard,
  FlashSaleVariantsTable,
} from '../components/form';
import {
  defaultFlashSaleFormValues,
  flashSaleFormSchema,
  type FlashSaleFormValues,
} from '../schemas';
import {
  useCreateFlashSale,
  useFlashSale,
  useUpdateFlashSale,
} from '../hooks';
import { buildFlashSalePayload } from '../utils/build-payload';
import { hydrateFlashSaleForm } from '../utils/hydrate-form';
import { parseFlashSaleConflict } from '../utils/conflict';

const FlashSaleFormPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const identifier = params.id && params.id !== 'new' ? params.id : null;
  const isEdit = identifier !== null;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: existing, isLoading: isLoadingDetail } = useFlashSale(identifier);
  const { mutateAsync: createFlashSale } = useCreateFlashSale();
  const { mutateAsync: updateFlashSale } = useUpdateFlashSale();

  const form = useForm<FlashSaleFormValues>({
    resolver: zodResolver(flashSaleFormSchema) as Resolver<FlashSaleFormValues>,
    defaultValues: defaultFlashSaleFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset(hydrateFlashSaleForm(existing));
    }
  }, [existing, isEdit, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = buildFlashSalePayload(values);
      if (isEdit && identifier) {
        await updateFlashSale({ id: identifier, payload });
        toast.success('Flash Sale berhasil diupdate');
      } else {
        const created = await createFlashSale(payload);
        toast.success('Flash Sale berhasil dibuat');
        if (created.id) navigate(`/flash-sales-new/${created.id}`, { replace: true });
      }
    } catch (error) {
      const conflict = parseFlashSaleConflict(error);
      if (conflict) {
        const conflictIds = new Set(conflict.conflicts.map((c) => c.variantId));
        if (conflictIds.size > 0) {
          const current = form.getValues('variants') ?? [];
          const next = current.filter((v) => !conflictIds.has(v.variantId));
          form.setValue('variants', next, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
        const preview = conflict.conflicts
          .slice(0, 3)
          .map((c) => c.productName ?? `#${c.variantId}`)
          .join(', ');
        const extraCount = Math.max(0, conflict.conflicts.length - 3);
        toast.warning('Konflik dengan promo lain', {
          description:
            conflict.conflicts.length === 0
              ? conflict.message ??
                'Beberapa varian tumpang tindih dengan promo aktif lain.'
              : `Dihapus dari daftar: ${preview}${extraCount > 0 ? ` +${extraCount} lagi` : ''}. Silakan cek dan simpan ulang.`,
          duration: 10_000,
        });
        return;
      }
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan flash sale');
      toast.error(msg);
    }
  });

  const handleCancel = () => navigate('/flash-sales-new');

  const title = useMemo(
    () => (isEdit ? 'Edit Flash Sale' : 'Buat Flash Sale Baru'),
    [isEdit],
  );

  if (isEdit && isLoadingDetail) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title={title}
          description={
            isEdit
              ? `Ubah konfigurasi flash sale "${existing?.title ?? ''}".`
              : 'Atur periode, produk, dan harga flash sale.'
          }
          actions={
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          }
        />

        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-20">
            <FlashSaleInfoCard />
            <FlashSaleScheduleCard />
            <FlashSaleAddItemsCard />
            <FlashSaleBulkActionsCard
              selectedIds={selectedIds}
              onClearSelection={() => setSelectedIds([])}
            />
            <FlashSaleVariantsTable
              selectedIds={selectedIds}
              onSelectedChange={setSelectedIds}
            />

            <FlashSaleFormActions
              isEdit={isEdit}
              isSubmitting={form.formState.isSubmitting}
              onCancel={handleCancel}
            />
          </form>
        </FormProvider>
      </PageContainer>
    </AppShell>
  );
};

export default FlashSaleFormPage;
