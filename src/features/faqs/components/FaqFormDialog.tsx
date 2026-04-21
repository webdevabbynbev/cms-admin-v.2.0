import { memo, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import {
  defaultFaqFormValues,
  faqFormSchema,
  type FaqFormValues,
} from '../schemas';
import { useCreateFaq, useUpdateFaq } from '../hooks';
import type { Faq } from '../types';

interface FaqFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq: Faq | null;
}

const FaqFormDialogComponent = ({ open, onOpenChange, faq }: FaqFormDialogProps) => {
  const isEdit = Boolean(faq);
  const { mutateAsync: createFaq } = useCreateFaq();
  const { mutateAsync: updateFaq } = useUpdateFaq();

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema) as Resolver<FaqFormValues>,
    defaultValues: defaultFaqFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      faq
        ? { question: faq.question, answer: faq.answer }
        : defaultFaqFormValues,
    );
  }, [open, faq, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && faq) {
        await updateFaq({ id: faq.id, payload: values });
        toast.success('FAQ berhasil diupdate');
      } else {
        await createFaq(values);
        toast.success('FAQ berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan FAQ');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit FAQ' : 'Tambah FAQ'}</DialogTitle>
          <DialogDescription>
            Pasangan pertanyaan dan jawaban untuk halaman bantuan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faq-question">Pertanyaan</Label>
            <Input
              id="faq-question"
              {...form.register('question')}
              placeholder="Contoh: Berapa lama pengiriman?"
            />
            {form.formState.errors.question ? (
              <span className="text-xs text-error">
                {form.formState.errors.question.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faq-answer">Jawaban</Label>
            <Textarea
              id="faq-answer"
              {...form.register('answer')}
              placeholder="Jawaban singkat untuk pertanyaan"
              rows={4}
            />
            {form.formState.errors.answer ? (
              <span className="text-xs text-error">
                {form.formState.errors.answer.message}
              </span>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isEdit ? 'Simpan' : 'Buat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const FaqFormDialog = memo(FaqFormDialogComponent);
