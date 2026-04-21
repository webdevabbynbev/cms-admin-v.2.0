import { memo, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Film, ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadService, UPLOAD_FOLDERS } from '../../services';
import { MediaType } from '../../types';
import type { MediaFormValue } from '../../schemas';

interface MediaUploaderProps {
  value: MediaFormValue[];
  onChange: (next: MediaFormValue[]) => void;
  maxItems?: number;
}

const ACCEPTED = 'image/*,video/mp4,video/x-m4v,video/*';

const MediaUploaderComponent = ({
  value,
  onChange,
  maxItems = 10,
}: MediaUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const remainingSlots = Math.max(0, maxItems - value.length);

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    if (remainingSlots === 0) {
      toast.warning(`Maximum ${maxItems} media files reached`);
      return;
    }

    const toUpload = files.slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const uploaded: MediaFormValue[] = [];
      for (const file of toUpload) {
        const type: MediaType = file.type.startsWith('video/')
          ? MediaType.Video
          : MediaType.Image;
        const url = await uploadService.upload(file, UPLOAD_FOLDERS.products);
        uploaded.push({ url, type });
      }
      onChange([...value, ...uploaded]);
      toast.success(`Uploaded ${uploaded.length} file(s)`);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Upload failed');
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={triggerPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') triggerPicker();
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-interactive bg-interactive-bg'
            : 'border-border hover:border-interactive hover:bg-muted',
          isUploading && 'pointer-events-none opacity-60',
        )}
      >
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-interactive" />
        ) : (
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            {isUploading ? 'Uploading...' : 'Click or drag files here to upload'}
          </p>
          <p className="text-xs text-muted-foreground">
            Images and videos. {value.length} / {maxItems} used.
          </p>
        </div>
      </div>

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {value.map((media, index) => (
            <div
              key={`${media.url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              {media.type === MediaType.Video ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                  <Film className="h-8 w-8" />
                  <span className="text-xs">Video</span>
                </div>
              ) : (
                <img
                  src={media.url}
                  alt={`media-${index}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 rounded-md bg-error p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-0.5 text-[10px] text-white">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          <ImagePlus className="h-4 w-4" />
          No media added yet.
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {value.length === 0
            ? 'Upload at least one image.'
            : `${value.length} media file(s) ready to save.`}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={triggerPicker}
          disabled={isUploading || remainingSlots === 0}
        >
          <UploadCloud className="h-4 w-4" />
          Add more
        </Button>
      </div>
    </div>
  );
};

export const MediaUploader = memo(MediaUploaderComponent);
