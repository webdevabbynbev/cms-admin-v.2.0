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
  VoucherFormActions,
  VoucherFormHeader,
  VoucherGiftProductsCard,
  VoucherQuotaCard,
  VoucherRewardCard,
  VoucherScheduleCard,
  VoucherScopeCard,
  VoucherTypeCard,
} from '../components';
import {
  defaultVoucherFormValues,
  voucherFormSchema,
  type VoucherFormValues,
} from '../schemas';
import {
  useCreateVoucher,
  useUpdateVoucher,
  useVouchers,
} from '../hooks';
import { buildVoucherPayload } from '../utils/build-payload';
import { hydrateVoucherForm } from '../utils/hydrate-form';

const VoucherFormPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const idNumber = params.id && params.id !== 'new' ? Number(params.id) : null;
  const isEdit = idNumber !== null && Number.isFinite(idNumber);

  const { data: listData, isLoading: isLoadingDetail } = useVouchers({
    page: 1,
    perPage: 100,
  });
  const existing = useMemo(
    () =>
      isEdit && listData
        ? listData.data.find((v) => v.id === idNumber) ?? null
        : null,
    [isEdit, idNumber, listData],
  );

  const { mutateAsync: createVoucher } = useCreateVoucher();
  const { mutateAsync: updateVoucher } = useUpdateVoucher();

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherFormSchema) as Resolver<VoucherFormValues>,
    defaultValues: defaultVoucherFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset(hydrateVoucherForm(existing));
    }
  }, [existing, isEdit, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = buildVoucherPayload(values);
      if (isEdit && idNumber) {
        await updateVoucher({ ...payload, id: idNumber });
        toast.success('Voucher berhasil diupdate');
      } else {
        const created = await createVoucher(payload);
        toast.success('Voucher berhasil dibuat');
        if (created.id) navigate(`/vouchers-new/${created.id}`, { replace: true });
      }
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan voucher');
      toast.error(msg);
    }
  });

  const handleCancel = () => navigate('/vouchers-new');

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
          title={isEdit ? 'Edit Voucher' : 'Buat Voucher Baru'}
          description={
            isEdit
              ? `Ubah voucher "${existing?.name ?? ''}".`
              : 'Buat voucher promo untuk customer.'
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
            <VoucherFormHeader />
            <VoucherTypeCard />
            <VoucherRewardCard />
            <VoucherGiftProductsCard />
            <VoucherQuotaCard />
            <VoucherScopeCard />
            <VoucherScheduleCard />

            <VoucherFormActions
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

export default VoucherFormPage;
