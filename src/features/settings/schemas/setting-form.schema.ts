import { z } from 'zod';

export const settingFormSchema = z.object({
  key: z.string().min(1, { message: 'Key wajib diisi' }).max(191),
  group: z.string().min(1, { message: 'Group wajib diisi' }).max(100),
  value: z.string().min(1, { message: 'Value wajib diisi' }),
});

export type SettingFormValues = z.infer<typeof settingFormSchema>;

export const defaultSettingFormValues: SettingFormValues = {
  key: '',
  group: '',
  value: '',
};
