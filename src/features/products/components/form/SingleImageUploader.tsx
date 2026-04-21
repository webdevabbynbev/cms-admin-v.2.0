import { useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadService, UPLOAD_FOLDERS, type UploadFolder } from '../../services';

interface SingleImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: UploadFolder;
  label?: string;
  className?: string;
}

const ACCEPTED = 'image/*';

export const SingleImageUploader = ({
  value,
  onChange,
  folder = UPLOAD_FOLDERS.products,
  label = 'Upload foto',
  className,
}: SingleImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadService.upload(file, folder);
      onChange(url);
      toast.success('Foto berhasil diupload');
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Upload gagal');
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleChange}
      />

      {value ? (
        <div className="group relative aspect-square w-32 overflow-hidden rounded-md border border-border bg-muted">
          <img src={value} alt="preview" className="h-full w-full object-cover" loading="lazy" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1 top-1 rounded-md bg-error p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            title="Hapus"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            'flex aspect-square w-32 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-interactive hover:bg-muted',
            isUploading && 'pointer-events-none opacity-60',
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          <span className="text-xs">{isUploading ? 'Uploading...' : label}</span>
        </button>
      )}

      {value ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="self-start"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Ganti foto
        </Button>
      ) : null}
    </div>
  );
};
