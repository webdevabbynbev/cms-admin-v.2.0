import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';

import { AppShell } from '@/layouts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PageContainer, PageHeader } from '@/components/common';

import { useAuth } from '@/features/auth';
import { uploadService, UPLOAD_FOLDERS } from '@/features/products/services/upload.service';
import {
  profileFormSchema,
  type ProfileFormValues,
} from '../schemas/profile-form.schema';
import { useUpdateProfile } from '../hooks';

const DEFAULT: ProfileFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  photoProfile: null,
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { mutateAsync, isPending } = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: DEFAULT,
  });

  useEffect(() => {
    if (!user) return;
    form.reset({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      photoProfile: user.photo_profile_url ?? user.photoProfile ?? null,
    });
  }, [user, form]);

  const photo = form.watch('photoProfile');
  const firstName = form.watch('firstName');
  const lastName = form.watch('lastName');
  const initials =
    (firstName || lastName || user?.email || '?')
      .split(' ')
      .map((s) => s.charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diizinkan');
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const url = await uploadService.upload(file, UPLOAD_FOLDERS.avatars);
      form.setValue('photoProfile', url, { shouldDirty: true });
      toast.success('Foto berhasil diunggah');
    } catch (err) {
      toast.error('Upload foto gagal', {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        photoProfile: values.photoProfile,
      });
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error('Gagal memperbarui profil', {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Profil Saya"
          description="Perbarui informasi akun dan foto profil."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={onSubmit} className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      {photo ? <AvatarImage src={photo} alt="Profile" /> : null}
                      <AvatarFallback className="text-lg">
                        {initials || 'AD'}
                      </AvatarFallback>
                    </Avatar>
                    {uploading ? (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePickPhoto}
                      disabled={uploading || isPending}
                    >
                      <Camera className="h-4 w-4" />
                      Ganti Foto
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG, maksimum sesuai konfigurasi server.
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama depan</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama belakang</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telepon</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="08xxxxxxxxxx"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3 text-sm">
                  <span className="text-muted-foreground">Peran</span>
                  <span className="font-medium">{user?.role_name ?? '-'}</span>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isPending || uploading}>
                    {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
};

export default ProfilePage;
