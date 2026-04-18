"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Upload,
  Table,
  Alert,
  Progress,
  message,
  Typography,
  Button,
  Space,
  theme,
} from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import http from "../../../../api/http";

const { Dragger } = Upload;
const { Text } = Typography;

type CsvRow = Record<string, any>;
type ImportFailure = {
  row: number;
  userId: string;
  reason: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const normalizeKey = (key: string) =>
  String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const USER_ID_KEYS = ["user_id", "userid", "id"];
const PRIZE7_KEYS = ["prize_7", "prize7", "hadiah_7", "hadiah7"];
const PRIZE15_KEYS = ["prize_15", "prize15", "hadiah_15", "hadiah15"];
const PRIZE30_KEYS = ["prize_30", "prize30", "hadiah_30", "hadiah30"];

const normalizePrizeValue = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  const lowered = raw.toLowerCase();
  if (["null", "-", "hapus", "clear"].includes(lowered)) return null;
  return raw;
};

const pickField = (row: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
  }
  return undefined;
};

export default function RamadhanImportCsv({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { token } = theme.useToken();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<ImportFailure[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    updated: number;
    skipped: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  const resetState = () => {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setRows([]);
    setProgress(0);
    setLoading(false);
    setError(null);
    setFailures([]);
    setSummary(null);
  };

  const normalizedRows = useMemo(
    () =>
      rows.map((row) => {
        const out: Record<string, any> = {};
        Object.keys(row || {}).forEach((key) => {
          out[normalizeKey(key)] = row[key];
        });
        return out;
      }),
    [rows],
  );

  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
    setProgress(0);
    setFailures([]);
    setSummary(null);

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const fields = result.meta.fields || [];
        const normalized = fields.map((h) => normalizeKey(h));
        const hasUserId = normalized.some((h) => USER_ID_KEYS.includes(h));
        const hasPrizeColumn = normalized.some(
          (h) =>
            PRIZE7_KEYS.includes(h) ||
            PRIZE15_KEYS.includes(h) ||
            PRIZE30_KEYS.includes(h),
        );

        if (!hasUserId) {
          setError(
            "Kolom User ID tidak ditemukan. Pastikan header berisi User ID atau user_id.",
          );
          setPreview([]);
          setRows([]);
          return;
        }
        if (!hasPrizeColumn) {
          setError(
            "Kolom hadiah tidak ditemukan. Gunakan header Prize 7 / Prize 15 / Prize 30.",
          );
          setPreview([]);
          setRows([]);
          return;
        }

        setHeaders(fields);
        setRows(result.data as CsvRow[]);
        setPreview((result.data as CsvRow[]).slice(0, 10));
      },
      error: (err) => {
        
        message.error("Gagal membaca file CSV");
      },
    });

    return false;
  };

  const handleUpload = async () => {
    if (!file || error) {
      message.error("Masih ada error pada data CSV");
      return;
    }

    const total = normalizedRows.length;
    if (!total) {
      message.error("CSV kosong");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);

      const failures: ImportFailure[] = [];
      let updated = 0;
      let skipped = 0;

      for (let i = 0; i < normalizedRows.length; i += 1) {
        const row = normalizedRows[i];
        const userIdRaw = pickField(row, USER_ID_KEYS);
        const userId = String(userIdRaw ?? "").trim();

        if (!userId) {
          failures.push({
            row: i + 2,
            userId: "-",
            reason: "User ID kosong",
          });
          setProgress(Math.round(((i + 1) / total) * 100));
          continue;
        }

        const prize7 = normalizePrizeValue(pickField(row, PRIZE7_KEYS));
        const prize15 = normalizePrizeValue(pickField(row, PRIZE15_KEYS));
        const prize30 = normalizePrizeValue(pickField(row, PRIZE30_KEYS));

        const payload: Record<string, any> = {};
        if (prize7 !== undefined) payload.prize_7 = prize7;
        if (prize15 !== undefined) payload.prize_15 = prize15;
        if (prize30 !== undefined) payload.prize_30 = prize30;

        if (!Object.keys(payload).length) {
          skipped += 1;
          setProgress(Math.round(((i + 1) / total) * 100));
          continue;
        }

        try {
          await http.post(`/admin/ramadan-participants/${userId}/assign-prize`, payload);
          updated += 1;
        } catch (err: any) {
          failures.push({
            row: i + 2,
            userId,
            reason: err?.response?.data?.message || "Gagal menyimpan data",
          });
        } finally {
          setProgress(Math.round(((i + 1) / total) * 100));
        }
      }

      setFailures(failures);
      setSummary({
        total,
        updated,
        skipped,
        failed: failures.length,
      });

      if (failures.length) {
        message.error(
          `Selesai dengan ${failures.length} error. Lihat tabel detail error.`,
        );
        
      } else {
        message.success(
          `Import selesai. Berhasil update ${updated} data, ${skipped} baris dilewati.`,
        );
        onSuccess?.();
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = headers.map((h) => ({
    title: h,
    dataIndex: h,
    key: h,
    ellipsis: true,
  }));
  const failureColumns = [
    { title: "Row", dataIndex: "row", key: "row", width: 80 },
    { title: "User ID", dataIndex: "userId", key: "userId", width: 120 },
    { title: "Reason", dataIndex: "reason", key: "reason" },
  ];

  const downloadTemplate = () => {
    const csvContent =
      "User ID,Nama Peserta,Email,No HP,Total Check-in,Hari Puasa,Tidak Puasa,Prize 7,Prize 15,Prize 30\n" +
      "123,Jane Doe,jane@example.com,08123456789,30,23,7,Hadiah 7 Hari,,Grand Prize\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ramadan_participants_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      title="Import CSV Peserta"
      open={open}
      onCancel={() => !loading && onOpenChange(false)}
      onOk={handleUpload}
      confirmLoading={loading}
      okText={loading ? "Importing..." : "Import"}
      okButtonProps={{ disabled: !file || !!error || loading }}
      width={820}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text type="secondary">
            Upload CSV untuk update hadiah peserta (hanya kolom hadiah yang diproses).
            <br />
            Kolom wajib: <code>User ID</code> / <code>user_id</code>.
            <br />
            Kolom hadiah (opsional): <code>Prize 7</code>,{" "}
            <code>Prize 15</code>, <code>Prize 30</code>.
            <br />
            Boleh pakai file hasil export. Kolom lain akan diabaikan.
            <br />
            Isi kosong akan di-skip, isi <code>null</code> atau <code>-</code> untuk menghapus hadiah.
          </Text>
          <div style={{ marginTop: 8 }}>
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={downloadTemplate}
              style={{ padding: 0 }}
            >
              Download Template CSV
            </Button>
          </div>
        </div>

        <Dragger
          accept=".csv"
          beforeUpload={handleFile}
          showUploadList={false}
          disabled={loading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Klik atau drag file CSV ke area ini</p>
          {file && (
            <p className="ant-upload-hint" style={{ color: token.colorPrimary }}>
              File terpilih: {file.name}
            </p>
          )}
        </Dragger>

        {loading && <Progress percent={progress} status="active" />}

        {error && (
          <Alert message="Error" description={error} type="error" showIcon />
        )}

        {summary && !loading && (
          <Alert
            type={summary.failed ? "warning" : "success"}
            showIcon
            message="Ringkasan Import"
            description={
              <div>
                Total: <b>{summary.total}</b> | Updated:{" "}
                <b>{summary.updated}</b> | Skipped:{" "}
                <b>{summary.skipped}</b> | Failed:{" "}
                <b>{summary.failed}</b>
              </div>
            }
          />
        )}

        {failures.length > 0 && (
          <Table
            dataSource={failures}
            columns={failureColumns}
            pagination={false}
            size="small"
            rowKey={(_, i) => i as number}
            title={() => <b>Detail Error</b>}
          />
        )}

        {preview.length > 0 && (
          <Table
            dataSource={preview}
            columns={columns}
            pagination={false}
            size="small"
            rowKey={(_, i) => i as number}
            title={() => <b>Preview (10 baris pertama)</b>}
          />
        )}
      </Space>
    </Modal>
  );
}
