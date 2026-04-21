import { z } from 'zod';

export const concernFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  description: z.string().optional().nullable(),
  position: z.number().int().min(0).optional(),
});

export type ConcernFormValues = z.infer<typeof concernFormSchema>;

export const defaultConcernFormValues: ConcernFormValues = {
  name: '',
  description: '',
  position: 0,
};

export const concernOptionFormSchema = z.object({
  concernId: z.number().int().positive({ message: 'Pilih concern parent' }),
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  description: z.string().optional().nullable(),
  position: z.number().int().min(0).optional(),
});

export type ConcernOptionFormValues = z.infer<typeof concernOptionFormSchema>;

export const defaultConcernOptionFormValues: ConcernOptionFormValues = {
  concernId: 0,
  name: '',
  description: '',
  position: 0,
};
