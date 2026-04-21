import { z } from 'zod';

export const personaFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  description: z.string().optional().nullable(),
});

export type PersonaFormValues = z.infer<typeof personaFormSchema>;

export const defaultPersonaFormValues: PersonaFormValues = {
  name: '',
  description: '',
};
