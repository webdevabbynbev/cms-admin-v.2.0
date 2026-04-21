import { memo, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader, RichTextEditor } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { useContent, useUpdateContent } from '../hooks';
import type { ContentSlug } from '../types';
import { CONTENT_TITLES } from '../types';

interface ContentPageEditorProps {
  slug: ContentSlug;
  description?: string;
}

const ContentPageEditorComponent = ({
  slug,
  description,
}: ContentPageEditorProps) => {
  const title = CONTENT_TITLES[slug];
  const { data, isLoading, isError } = useContent(slug);
  const { mutateAsync: updateContent, isPending: isSaving } = useUpdateContent(slug);

  const [value, setValue] = useState('');

  useEffect(() => {
    if (data) setValue(data.value);
  }, [data]);

  const handleSave = async () => {
    try {
      await updateContent({ value });
      toast.success(`${title} berhasil disimpan`);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan');
      toast.error(msg);
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title={title}
          description={description ?? `Kelola isi halaman ${title}.`}
          actions={
            <Button onClick={handleSave} disabled={isLoading || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          }
        />

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-error">
              Gagal memuat konten. Coba refresh.
            </CardContent>
          </Card>
        ) : (
          <RichTextEditor
            value={value}
            onChange={setValue}
            placeholder={`Tulis isi ${title}...`}
          />
        )}
      </PageContainer>
    </AppShell>
  );
};

export const ContentPageEditor = memo(ContentPageEditorComponent);
