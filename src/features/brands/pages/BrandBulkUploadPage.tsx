import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { axiosClient } from '@/config/axios';
import type { ServeWrapper } from '@/lib/api-types';

const ACCEPTED = '.jpg,.jpeg,.png,.webp';
const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

interface UploadResult {
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
}
interface UploadError {
  file: string;
  reason: string;
}
interface UploadResponse {
  total: number;
  success: number;
  failed: number;
  results: UploadResult[];
  errors: UploadError[];
}
type UploadType = 'logo' | 'banner';

interface BrandBulkUploadPageProps {
  uploadType: UploadType;
}

const ENDPOINT: Record<UploadType, string> = {
  logo: '/brands/bulk/logos',
  banner: '/brands/bulk/banners',
};

const ACCEPTED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

const BrandBulkUploadPage = ({ uploadType }: BrandBulkUploadPageProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const previewMapRef = useRef(new Map<string, string>());
  const previews = useMemo(() => {
    const map = previewMapRef.current;
    const nextKeys = new Set(files.map(fileKey));

    for (const [key, url] of map) {
      if (!nextKeys.has(key)) {
        URL.revokeObjectURL(url);
        map.delete(key);
      }
    }
    for (const file of files) {
      const key = fileKey(file);
      if (!map.has(key)) {
        map.set(key, URL.createObjectURL(file));
      }
    }
    return Object.fromEntries(map);
  }, [files]);

  useEffect(() => {
    const map = previewMapRef.current;
    return () => {
      for (const url of map.values()) URL.revokeObjectURL(url);
      map.clear();
    };
  }, []);

  const addFiles = (incoming: File[]) => {
    const valid: File[] = [];
    let tooLarge = 0;
    let wrongType = 0;
    incoming.forEach((f) => {
      const typeOk =
        ACCEPTED_MIME.includes(f.type) ||
        /\.(jpe?g|png|webp)$/i.test(f.name);
      if (!typeOk) {
        wrongType += 1;
        return;
      }
      if (f.size > MAX_BYTES) {
        tooLarge += 1;
        return;
      }
      valid.push(f);
    });

    const warnings: string[] = [];
    if (tooLarge > 0) warnings.push(`${tooLarge} file > ${MAX_MB}MB diabaikan.`);
    if (wrongType > 0) warnings.push(`${wrongType} file bukan gambar diabaikan.`);
    setUploadError(warnings.length > 0 ? warnings.join(' ') : null);
    setFiles(valid);
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    addFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setProgress(10);
    setUploadError(null);
    setResult(null);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    const interval = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 5 : p));
    }, 600);

    try {
      const res = await axiosClient.post<ServeWrapper<UploadResponse>>(
        ENDPOINT[uploadType],
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 600_000,
        },
      );
      clearInterval(interval);
      setProgress(100);
      setResult(res.data.serve);
      setFiles([]);
    } catch (error) {
      clearInterval(interval);
      setProgress(0);
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Upload gagal');
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const title = uploadType === 'logo' ? 'Bulk Upload Logo Brand' : 'Bulk Upload Banner Brand';
  const urlKey: keyof UploadResult = uploadType === 'logo' ? 'logoUrl' : 'bannerUrl';

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title={title}
          description="Nama file harus sama dengan slug brand. Contoh: brand-name.jpg"
          actions={
            <Button variant="ghost" onClick={() => navigate('/brands-new')}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          }
        />

        <div className="flex flex-col gap-5 rounded-lg border border-border p-5">
          <div
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 transition-colors',
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/40',
            )}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
          >
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isDragOver ? 'Lepaskan file di sini' : 'Klik atau drop file di sini'}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, JPEG, PNG, WEBP — maks. {MAX_MB}MB per file
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{files.length} file dipilih</p>
              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border p-2 sm:grid-cols-3 md:grid-cols-4">
                {files.map((f, i) => {
                  const key = `${f.name}-${f.size}-${f.lastModified}`;
                  const previewUrl = previews[key];
                  return (
                    <div
                      key={i}
                      className="group relative flex flex-col gap-1 rounded-md border p-1.5"
                    >
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={f.name}
                          className="h-20 w-full rounded object-cover"
                        />
                      ) : (
                        <div className="h-20 w-full rounded bg-muted" />
                      )}
                      <p
                        className="truncate text-xs"
                        title={f.name}
                      >
                        {f.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {(f.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-sm"
                        className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                        onClick={() => removeFile(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {uploadError ? (
            <p className="text-sm text-destructive">{uploadError}</p>
          ) : null}

          {isUploading ? (
            <div className="flex flex-col gap-1">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">Mengupload... {progress}%</p>
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
            >
              <Upload className="h-4 w-4" />
              Upload {files.length > 0 ? `(${files.length})` : ''}
            </Button>
            {files.length > 0 ? (
              <Button
                variant="outline"
                onClick={() => {
                  setFiles([]);
                  setResult(null);
                  setUploadError(null);
                }}
              >
                Hapus Semua
              </Button>
            ) : null}
          </div>
        </div>

        {result ? (
          <div className="flex flex-col gap-4 rounded-lg border border-border p-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold">Hasil Upload</p>
              <Badge variant="outline">Total: {result.total}</Badge>
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                Berhasil: {result.success}
              </Badge>
              {result.failed > 0 ? (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Gagal: {result.failed}
                </Badge>
              ) : null}
            </div>

            {result.results.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Berhasil
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {result.results.map((r) => (
                    <div key={r.slug} className="flex items-center gap-2 rounded-md border border-border p-2">
                      {r[urlKey] ? (
                        <img
                          src={r[urlKey] as string}
                          alt={r.slug}
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded bg-muted" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{r.slug}</p>
                        {r[urlKey] ? (
                          <a
                            href={r[urlKey] as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-xs text-primary hover:underline"
                          >
                            Lihat
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {result.errors.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-destructive">
                  Gagal ({result.errors.length})
                </p>
                <div className="flex flex-col gap-1">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                      <span className="font-mono text-xs">{e.file}</span>
                      <span className="text-xs text-muted-foreground">— {e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </PageContainer>
    </AppShell>
  );
};

export default BrandBulkUploadPage;
