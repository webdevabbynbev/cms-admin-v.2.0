import { useEffect, useMemo } from 'react';
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
  DiscountAddItemsCard,
  DiscountAllProductsCard,
  DiscountBulkActionsCard,
  DiscountFormActions,
  DiscountFormHeader,
  DiscountImportExportCard,
  DiscountScheduleCard,
  DiscountScopeCard,
  DiscountSummaryBar,
  DiscountVariantsTable,
} from '../components';
import {
  defaultDiscountFormValues,
  discountFormSchema,
  type DiscountFormValues,
} from '../schemas';
import {
  useCreateDiscount,
  useDiscount,
  useUpdateDiscount,
} from '../hooks';
import { DiscountScope } from '../types';
import { buildDiscountPayload } from '../utils/build-payload';
import { hydrateDiscountForm } from '../utils/hydrate-form';

const DiscountFormPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const identifier = params.id && params.id !== 'new' ? params.id : null;
  const isEdit = identifier !== null;

  const { data: existing, isLoading: isLoadingDetail } = useDiscount(identifier);
  const { mutateAsync: createDiscount } = useCreateDiscount();
  const { mutateAsync: updateDiscount } = useUpdateDiscount();

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema) as Resolver<DiscountFormValues>,
    defaultValues: defaultDiscountFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset(hydrateDiscountForm(existing));
    }
  }, [existing, isEdit, form]);

  const scope = form.watch('scope');
  const isAllProducts = scope === DiscountScope.AllProducts;

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = buildDiscountPayload(values);
      if (isEdit && identifier) {
        await updateDiscount({ identifier, payload });
        toast.success('Diskon berhasil diupdate');
      } else {
        const created = await createDiscount(payload);
        toast.success('Diskon berhasil dibuat');
        const newId = created.id || created.code;
        if (newId) navigate(`/discounts-new/${newId}`, { replace: true });
      }
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan diskon');
      toast.error(msg);
    }
  });

  const handleCancel = () => navigate('/discounts-new');

  const title = useMemo(
    () => (isEdit ? 'Edit Diskon' : 'Buat Diskon Baru'),
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
              ? `Ubah konfigurasi diskon "${existing?.name ?? ''}".`
              : 'Buat promo baru untuk produk, varian, atau brand.'
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
            <DiscountFormHeader />
            <DiscountScopeCard />

            {isAllProducts ? (
              <DiscountAllProductsCard />
            ) : (
              <>
                <DiscountAddItemsCard />
                <DiscountBulkActionsCard />
                <DiscountVariantsTable />
                <DiscountSummaryBar />
                {isEdit ? (
                  <DiscountImportExportCard
                    discountId={existing?.id ?? identifier}
                    discountCode={existing?.code ?? ''}
                  />
                ) : null}
              </>
            )}

            <DiscountScheduleCard />

            <DiscountFormActions
              isSubmitting={form.formState.isSubmitting}
              isEdit={isEdit}
              onCancel={handleCancel}
            />
          </form>
        </FormProvider>
      </PageContainer>
    </AppShell>
  );
};

export default DiscountFormPage;
