"use client";

import { useEffect, useState } from "react";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const REQUIRED_HEADERS = ["recommendation_date", "product_id"];

const normalizeBool = (value: unknown) => {
  if (typeof value === "boolean") return value;
  const str = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "ya", "y"].includes(str);
};

const normalizeNumber = (value: unknown) => {
  const raw = String(value ?? "").replace(/[^\d.-]/g, "");
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};

export default function RecommendationBulkUpload({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { token } = theme.useToken();
  const [mode, setMode] = useState<"create" | "update">("create");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  const resetState = () => {
    setMode("create");
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setRows([]);
    setProgress(0);
    setLoading(false);
    setError(null);
  };

  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
    setProgress(0);

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const fields = result.meta.fields || [];
        const missing = REQUIRED_HEADERS.filter((r) => !fields.includes(r));
        if (missing.length > 0) {
          setError(`Kolom wajib tidak ditemukan: ${missing.join(", ")}`);
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

    const total = rows.length;
    if (!total) {
      message.error("CSV kosong");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);

      const failures: Array<{ row: number; reason: string }> = [];
      let existingMap = new Map<string, any>();

      if (mode === "update") {
        existingMap = await fetchAllExistingMap();
      }

      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const productId = normalizeNumber(row.product_id);
        const date = String(row.recommendation_date ?? "").trim();

        if (!productId || !date) {
          failures.push({
            row: i + 2,
            reason: "product_id atau recommendation_date kosong",
          });
          continue;
        }

        const discountEnabled = normalizeBool(row.discount_enabled);
        const discountType =
          String(row.discount_type || "percent").toLowerCase() === "nominal"
            ? "nominal"
            : "percent";
        const discountPercent = normalizeNumber(row.discount_percent);
        const discountMaxPrice = normalizeNumber(row.discount_max_price);
        const discountAmount = normalizeNumber(row.discount_amount);

        const payload: Record<string, any> = {
          product_id: productId,
          recommendation_date: date,
        };

        if (discountEnabled) {
          payload.discount_enabled = 1;
          payload.discount_type = discountType;
          if (discountType === "percent") {
            payload.discount_percent = discountPercent;
            payload.discount_max_price = discountMaxPrice;
          } else {
            payload.discount_amount = discountAmount;
          }
        }

        if (row.banner_image_url) {
          payload.banner_image_url = String(row.banner_image_url).trim();
        }
        if (row.banner_image_mobile_url) {
          payload.banner_image_mobile_url = String(
            row.banner_image_mobile_url,
          ).trim();
        }

        try {
          if (mode === "update") {
            const key = buildKey(date, productId);
            const existing = existingMap.get(key);
            if (!existing?.id) {
              failures.push({
                row: i + 2,
                reason: "Data tidak ditemukan untuk update",
              });
              setProgress(Math.round(((i + 1) / total) * 100));
              continue;
            }
            await http.delete(`/admin/ramadan-recommendations/${existing.id}`);
          }
          await http.post("/admin/ramadan-recommendations", payload);
        } catch (err: any) {
          failures.push({
            row: i + 2,
            reason: err?.response?.data?.message || "Gagal menyimpan data",
          });
        } finally {
          setProgress(Math.round(((i + 1) / total) * 100));
        }
      }

      if (failures.length) {
        message.error(
          `Selesai dengan ${failures.length} error. Cek console untuk detail.`,
        );
        
      } else {
        message.success(
          mode === "update" ? "Bulk update berhasil" : "Bulk upload berhasil",
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

  const downloadTemplate = () => {
    const csvContent =
      "recommendation_date,product_id,discount_enabled,discount_type,discount_percent,discount_max_price,discount_amount,banner_image_url,banner_image_mobile_url\n" +
      "2026-03-01,123,0,,,,,https://example.com/ramadan-banner-desktop.webp,https://example.com/ramadan-banner-mobile.webp\n" +
      "2026-03-02,456,1,percent,20,50000,,https://example.com/ramadan-banner-desktop.webp,https://example.com/ramadan-banner-mobile.webp\n" +
      "2026-03-03,789,1,nominal,,,15000,https://example.com/ramadan-banner-desktop.webp,https://example.com/ramadan-banner-mobile.webp\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ramadan_recommendation_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buildKey = (date: string, productId: number | null) =>
    `${String(date || "").trim()}|${String(productId || "")}`;

  const fetchAllExistingMap = async () => {
    const map = new Map<string, any>();
    const perPage = 200;
    let page = 1;
    for (; ;) {
      const resp: any = await http.get(
        `/admin/ramadan-recommendations?page=${page}&per_page=${perPage}`,
      );
      const serve = resp?.data?.serve ?? resp?.data ?? {};
      const list = serve?.data || [];
      if (!Array.isArray(list) || list.length === 0) break;

      list.forEach((item: any) => {
        const date =
          item?.recommendationDate || item?.recommendation_date || "";
        const productId =
          item?.productId ||
          item?.product_id ||
          item?.product?.id ||
          null;
        if (!date || !productId) return;
        map.set(buildKey(date, Number(productId)), item);
      });

      if (list.length < perPage) break;
      page += 1;
    }
    return map;
  };

  return (
    <Modal
      title="Bulk Upload Rekomendasi"
      open={open}
      onCancel={() => !loading && onOpenChange(false)}
      onOk={handleUpload}
      confirmLoading={loading}
      okText={loading ? "Uploading..." : "Upload"}
      okButtonProps={{ disabled: !file || !!error || loading }}
      width={820}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text type="secondary">
            Upload file CSV untuk menambahkan rekomendasi secara massal.
            <br />
            Kolom wajib: <code>recommendation_date</code>,{" "}
            <code>product_id</code>.
            <br />
            Diskon opsional: <code>discount_enabled</code>,{" "}
            <code>discount_type</code>, <code>discount_percent</code>,{" "}
            <code>discount_max_price</code>, <code>discount_amount</code>.
            <br />
            Link banner (opsional): <code>banner_image_url</code>,{" "}
            <code>banner_image_mobile_url</code>.
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

        <div>
          <Text strong style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
            Mode Bulk
          </Text>
          <Space>
            <Button
              type={mode === "create" ? "primary" : "default"}
              onClick={() => setMode("create")}
            >
              Upload Baru
            </Button>
            <Button
              type={mode === "update" ? "primary" : "default"}
              onClick={() => setMode("update")}
            >
              Update Data
            </Button>
          </Space>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 6 }}>
            {mode === "update"
              ? "Update akan mengganti data dengan tanggal + product_id yang sama."
              : "Upload baru akan menambahkan data baru (duplikasi akan ditolak)."}
          </Text>
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
