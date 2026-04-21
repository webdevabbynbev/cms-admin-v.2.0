import { memo, useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import {
  useDownloadDiscountTemplate,
  useExportDiscountItems,
  useImportDiscountItems,
} from '../../hooks';
import {
  DiscountImportFormat,
  DiscountScope,
} from '../../types';
import {
  buildDiscountItemFilename,
  downloadBlob,
} from '../../utils/download';

interface DiscountImportExportCardProps {
  discountId: number | string | null;
  discountCode: string;
}

const DiscountImportExportCardComponent = ({
  discountId,
  discountCode,
}: DiscountImportExportCardProps) => {
  const [format, setFormat] = useState<DiscountImportFormat>(
    DiscountImportFormat.Csv,
  );
  const [scope, setScope] = useState<DiscountScope>(DiscountScope.Variant);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: exportItems, isPending: isExporting } =
    useExportDiscountItems();
  const { mutateAsync: downloadTemplate, isPending: isDownloadingTemplate } =
    useDownloadDiscountTemplate();
  const { mutateAsync: importItems, isPending: isImporting } =
    useImportDiscountItems();

  const handleFail = (fallback: string) => (error: unknown) => {
    const msg =
      (axios.isAxiosError(error) && error.response?.data?.message) ||
      (error instanceof Error ? error.message : fallback);
    toast.error(msg);
  };

  const handleExport = async () => {
    if (!discountId) {
      toast.error('Simpan diskon terlebih dahulu sebelum export');
      return;
    }
    try {
      const blob = await exportItems({
        identifier: discountId,
        params: { format, scope: scope === DiscountScope.AllProducts ? DiscountScope.Variant : scope },
      });
      downloadBlob(
        blob,
        buildDiscountItemFilename(discountCode, scope, format === DiscountImportFormat.Excel ? 'excel' : 'csv', 'export'),
      );
      toast.success('Export berhasil');
    } catch (err) {
      handleFail('Gagal export')(err);
    }
  };

  const handleTemplate = async () => {
    if (!discountId) {
      toast.error('Simpan diskon terlebih dahulu sebelum download template');
      return;
    }
    try {
      const blob = await downloadTemplate({
        identifier: discountId,
        params: { format, scope: scope === DiscountScope.AllProducts ? DiscountScope.Variant : scope },
      });
      downloadBlob(
        blob,
        buildDiscountItemFilename(discountCode, scope, format === DiscountImportFormat.Excel ? 'excel' : 'csv', 'template'),
      );
      toast.success('Template diunduh');
    } catch (err) {
      handleFail('Gagal download template')(err);
    }
  };

  const handleImport = async (file: File) => {
    if (!discountId) {
      toast.error('Simpan diskon terlebih dahulu sebelum import');
      return;
    }
    try {
      await importItems({
        identifier: discountId,
        file,
        scope: scope === DiscountScope.AllProducts ? DiscountScope.Variant : scope,
      });
      toast.success('Import berhasil');
    } catch (err) {
      handleFail('Gagal import')(err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isDisabled = !discountId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Import / Export Varian
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isDisabled ? (
          <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Fitur import/export aktif setelah diskon disimpan.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Format</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as DiscountImportFormat)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DiscountImportFormat.Csv}>CSV</SelectItem>
                <SelectItem value={DiscountImportFormat.Excel}>Excel (xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cakupan</Label>
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as DiscountScope)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DiscountScope.Variant}>Per Varian</SelectItem>
                <SelectItem value={DiscountScope.Product}>Per Produk</SelectItem>
                <SelectItem value={DiscountScope.Brand}>Per Brand</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTemplate}
            disabled={isDisabled || isDownloadingTemplate}
          >
            {isDownloadingTemplate ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Template
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isDisabled || isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Data
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || isImporting}
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const DiscountImportExportCard = memo(DiscountImportExportCardComponent);
