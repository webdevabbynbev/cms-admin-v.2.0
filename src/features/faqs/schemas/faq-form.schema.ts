import { z } from 'zod';

export const faqFormSchema = z.object({
  question: z
    .string()
    .min(1, { message: 'Pertanyaan wajib diisi' })
    .max(500),
  answer: z.string().min(1, { message: 'Jawaban wajib diisi' }),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;

export const defaultFaqFormValues: FaqFormValues = {
  question: '',
  answer: '',
};
