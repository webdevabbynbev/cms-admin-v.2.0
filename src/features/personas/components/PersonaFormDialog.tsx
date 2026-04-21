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
  defaultPersonaFormValues,
  personaFormSchema,
  type PersonaFormValues,
} from '../schemas';
import { useCreatePersona, useUpdatePersona } from '../hooks';
import type { Persona } from '../types';

interface PersonaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: Persona | null;
}

const PersonaFormDialogComponent = ({
  open,
  onOpenChange,
  persona,
}: PersonaFormDialogProps) => {
  const isEdit = Boolean(persona);
  const { mutateAsync: createPersona } = useCreatePersona();
  const { mutateAsync: updatePersona } = useUpdatePersona();

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaFormSchema) as Resolver<PersonaFormValues>,
    defaultValues: defaultPersonaFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      persona
        ? { name: persona.name, description: persona.description ?? '' }
        : defaultPersonaFormValues,
    );
  }, [open, persona, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
      };
      if (isEdit && persona) {
        await updatePersona({ slug: persona.slug, payload });
        toast.success('Persona berhasil diupdate');
      } else {
        await createPersona(payload);
        toast.success('Persona berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan persona');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Persona' : 'Tambah Persona'}</DialogTitle>
          <DialogDescription>Persona target produk.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="persona-name">Nama</Label>
            <Input
              id="persona-name"
              {...form.register('name')}
              placeholder="Nama persona"
            />
            {form.formState.errors.name ? (
              <span className="text-xs text-error">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="persona-desc">Deskripsi</Label>
            <Textarea
              id="persona-desc"
              {...form.register('description')}
              placeholder="Deskripsi (opsional)"
              rows={3}
            />
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

export const PersonaFormDialog = memo(PersonaFormDialogComponent);
