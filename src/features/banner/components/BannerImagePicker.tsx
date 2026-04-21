import { memo, useRef, type ChangeEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BannerImagePickerProps {
  label: string;
  file: File | null;
  existingUrl: string;
  onFileChange: (file: File | null) => void;
  onUrlClear?: () => void;
}

const BannerImagePickerComponent = ({
  label,
  file,
  existingUrl,
  onFileChange,
  onUrlClear,
}: BannerImagePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = file ? URL.createObjectURL(file) : existingUrl;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onFileChange(f);
    e.target.value = '';
  };

  const handleRemove = () => {
    onFileChange(null);
    onUrlClear?.();
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/x-m4v,video/*"
        className="hidden"
        onChange={handleChange}
      />

      {previewUrl ? (
        <div className="relative h-40 overflow-hidden rounded-md border border-border bg-muted">
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-md bg-error p-1 text-white"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          className={cn(
            'flex h-40 cursor-pointer flex-col items-center justify-center gap-2',
            'rounded-md border-2 border-dashed border-border bg-muted/30',
            'text-muted-foreground transition-colors hover:border-interactive hover:bg-muted',
          )}
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs">Click to upload</span>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        {previewUrl ? 'Replace file' : 'Choose file'}
      </Button>
    </div>
  );
};

export const BannerImagePicker = memo(BannerImagePickerComponent);
