"use client";

import { type ReactNode, useState, useMemo, useEffect } from "react";
import {
  Modal,
  Upload,
  Table,
  Alert,
  Progress,
  message,
  notification,
  Typography,
  Tag,
  Button,
  Collapse,
  Tooltip,
} from "antd";
import {
  InboxOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import Papa from "papaparse";
import ProductCsvImportProgress from "./ProductCsvImportProgress";
import {
  importProductCSV,
  type ProductCsvImportJobStatusPayload,
} from "../../services/api/product.services";
import { useCsvImportStore } from "../../stores/csvImportStore";
import {
  type CsvRow,
  isMasterHeaders,
  normalizeHeaders,
  validateHeaders,
  validateRowsMaster,
  validateRowsTemplate,
} from "../../utils/productCsvValidator";

const { Dragger } = Upload;
const { Text } = Typography;

const MASTER_HEADERS = [
  "Brand",
  "Nama Produk",
  "Nama Varian",
  "Master SKU",
  "SKU",
  "Barcode",
  "Parent Kategori",
  "Sub Kategori 1",
  "Sub Kategori 2",
  "Concern",
  "Sub Concern 1",
  "Skintone",
  "Undertone",
  "Finish",
  "Warna",
  "Main Accords",
  "Top Notes",
  "Middle Notes",
  "Base Notes",
  "Perfume For",
  "Tags",
  "Variant Tags",
  "Status Produk",
  "Stock",
  "Base Price",
  "Price",
  "Thumbnail",
  "Photo 2",
  "Photo Variant",
  "Description Final",
  "Bpom",
  "How To Use",
  "Ingredients",
  "Weight G",
  "Weight Kg",
  "Persona",
  "Meta Title",
  "Meta Description",
  "Meta Keywords",
] as const;

// Kolom kunci yang ditampilkan di mini-preview
const PREVIEW_KEY_COLS = [
  "Nama Produk",
  "Sku Master",
  "Master SKU",
  "Nama Varian",
  "Sku Varian 2",
  "Barcode",
  "Stock",
  "Price",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TOAST_KEY = "product-csv-import";

function openToast(options: {
  description: ReactNode;
  duration?: number | null;
  type?: "success" | "warning" | "error" | "info";
}) {
  const payload = {
    key: TOAST_KEY,
    message: "",
    description: options.description,
    placement: "bottomRight" as const,
    duration: options.duration ?? 0,
    closeIcon: null,
    style: { width: 340, padding: "10px 12px" },
  };
  if (options.type === "success") return notification.success(payload);
  if (options.type === "warning") return notification.warning(payload);
  if (options.type === "error") return notification.error(payload);
  return notification.open(payload);
}

function renderProgressToast(options: {
  label: string;
  percent: number;
  valueText?: string;
  currentProduct?: string | null;
}) {
  const isDone = options.percent >= 100;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, lineHeight: 1.35 }}>{options.label}</span>
        <span
          style={{
            fontSize: 12,
            color: isDone ? "#52c41a" : "#595959",
            whiteSpace: "nowrap",
            fontWeight: isDone ? 600 : 400,
          }}
        >
          {isDone ? "Selesai" : `${options.percent}%`}
        </span>
      </div>
      <Progress
        percent={options.percent}
        size="small"
        showInfo={false}
        status={isDone ? "success" : "active"}
        style={{ margin: 0 }}
      />
      {(options.valueText || options.currentProduct) && !isDone ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "#8c8c8c",
            minWidth: 0,
          }}
        >
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {options.currentProduct ?? ""}
          </span>
          {options.valueText && (
            <span style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
              {options.valueText}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

function updateProcessingToast(snap: ProductCsvImportJobStatusPayload) {
  const isDone =
    snap.status === "completed" || snap.status === "completed_with_errors";
  const percent = isDone
    ? 100
    : Math.max(0, Math.min(100, Number(snap.progressPercent || 0)));
  const processed = Number(snap.processedProducts || 0);
  const total = Number(snap.totalProducts || 0);
  openToast({
    description: renderProgressToast({
      label: "Mengupload produk",
      percent,
      valueText: total > 0 ? `${processed}/${total}` : undefined,
      currentProduct: snap.currentProduct,
    }),
  });
}

function stripSepLine(raw: string) {
  const noBom = raw.replace(/^\uFEFF/, "");
  const lines = noBom.split(/\r?\n/);
  const first = (lines[0] || "").trim().toLowerCase();
  if (first.startsWith("sep=")) lines.shift();
  return lines.join("\n");
}

function detectDelimiterFromLine(line: string) {
  if (line.includes("\t")) return "\t";
  if (line.includes(";")) return ";";
  return ",";
}

function looksLikeHeaderLine(line: string) {
  const norm = (line || "")
    .replace(/^\uFEFF/, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const isMaster =
    norm.includes("nama produk") &&
    (norm.includes("master sku") || norm.includes("sku master")) &&
    (norm.includes("barcode") || norm.includes("nama varian"));
  const isTemplate =
    norm.includes("name") && norm.includes("category_type_id");
  return isMaster || isTemplate;
}

function findHeaderStartIndex(text: string) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = (lines[i] || "").trim();
    if (!line) continue;
    if (looksLikeHeaderLine(line)) return i;
  }
  return -1;
}

/** Case-insensitive value lookup dari row CSV */
function getVal(row: CsvRow, key: string): string {
  const lower = key.toLowerCase();
  const found = Object.keys(row).find((k) => k.toLowerCase() === lower);
  return found ? (row[found] || "") : "";
}

export default function ProductCsvUpload({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [csvMode, setCsvMode] = useState<"template" | "master" | null>(null);

  const { job, backendErrors, importResult, startJob, clearResult, setDialogOpen } =
    useCsvImportStore();

  useEffect(() => { setDialogOpen(open); }, [open]);

  const isJobRunning =
    job?.status === "queued" || job?.status === "processing";
  const isImportBusy = loading || isJobRunning;

  // Upload berhasil tanpa error → reset ke tampilan awal (toast sudah menampilkan ringkasan)
  useEffect(() => {
    if (importResult?.type === "success") {
      resetAll();
      onOpenChange(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importResult]);

  // ─── Summary stats dari preview data ─────────────────────────────────────

  const summaryStats = useMemo(() => {
    if (!preview.length) return null;
    const uniqueSkus = new Set(
      preview.map((r) => getVal(r, "sku master") || getVal(r, "master sku")).filter(Boolean)
    ).size;
    const uniqueBarcodes = new Set(
      preview.map((r) => getVal(r, "sku varian 2") || getVal(r, "barcode")).filter(Boolean)
    ).size;
    return {
      totalRows: preview.length,
      uniqueSkus,
      uniqueBarcodes,
    };
  }, [preview]);

  // Kolom mini-preview — semua kolom dari CSV yang punya minimal 1 nilai non-kosong
  const miniPreviewCols = useMemo(() => {
    if (!headers.length || !preview.length) return [];

    const colsWithValues = headers.filter((header) =>
      preview.some((row) => (row[header] ?? "").trim() !== "")
    );

    // Jika Price ada nilai, sisipkan Base Price tepat sebelum Price (walau Base Price kosong)
    const priceHeader = colsWithValues.find((h) => h.toLowerCase() === "price");
    const basePriceHeader = headers.find((h) => h.toLowerCase() === "base price");
    if (priceHeader && basePriceHeader && !colsWithValues.includes(basePriceHeader)) {
      const priceIdx = colsWithValues.indexOf(priceHeader);
      colsWithValues.splice(priceIdx, 0, basePriceHeader);
    }

    const CLAMP_COLS = new Set(["description final", "how to use", "ingredients", "sub concern 1", "sub concern 2"]);

    return colsWithValues.map((header) => {
      const isClamp = CLAMP_COLS.has(header.toLowerCase());
      return {
        title: header,
        dataIndex: header,
        key: header,
        ...(isClamp
          ? {
              width: 200,
              render: (val: string) => (
                <div
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontSize: 12,
                    lineHeight: "1.4",
                    maxWidth: 200,
                  }}
                  title={val}
                >
                  {val}
                </div>
              ),
            }
          : { ellipsis: true, width: 160 }),
      };
    });
  }, [headers, preview]);

  // ─── Template download ────────────────────────────────────────────────────

  const toCsvRow = (values: string[]) =>
    values.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");

  const downloadMasterTemplate = () => {
    const lines = [toCsvRow([...MASTER_HEADERS])];
    const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "product_master_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // ─── State helpers ────────────────────────────────────────────────────────

  function resetFileState() {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setRowErrors([]);
    setHeaderError(null);
    setUploadProgress(0);
    setLoading(false);
    setCsvMode(null);
  }

  function resetAll() {
    resetFileState();
    clearResult();
  }

  // ─── File parsing ─────────────────────────────────────────────────────────

  const handleFile = (f: File) => {
    setFile(f);
    setUploadProgress(0);

    f.text()
      .then((raw) => {
        const text = stripSepLine(raw);

        const runParseAttempts = (textToParse: string) => {
          const firstNonEmptyLine =
            textToParse.split(/\r?\n/).find((l) => l.trim() !== "") || "";
          const detectedDelimiter = detectDelimiterFromLine(firstNonEmptyLine);
          const delimitersToTry = Array.from(
            new Set([detectedDelimiter, "\t", ";", ","])
          );

          const tryParse = (index: number) => {
            const delimiter = delimitersToTry[index];

            if (!delimiter) {
              const headerIdx = findHeaderStartIndex(textToParse);
              if (headerIdx > 0) {
                const sliced = textToParse
                  .split(/\r?\n/)
                  .slice(headerIdx)
                  .join("\n");
                runParseAttempts(sliced);
                return;
              }
              setHeaderError(
                `Header CSV tidak cocok format.\nKolom wajib: Nama Produk, Master SKU, Barcode`
              );
              setPreview([]);
              setRowErrors([]);
              setCsvMode(null);
              return;
            }

            Papa.parse<CsvRow>(textToParse, {
              header: true,
              skipEmptyLines: true,
              delimiter,
              transformHeader: (h) =>
                String(h || "")
                  .replace(/^\uFEFF/, "")
                  .replace(/\u00A0/g, " ")
                  .replace(/\s+/g, " ")
                  .trim(),
              complete: (result) => {
                const fields = result.meta.fields || [];
                const headerErr = validateHeaders(fields);
                const cleanedHeaders = normalizeHeaders(fields);

                if (headerErr) {
                  tryParse(index + 1);
                  return;
                }

                setHeaders(cleanedHeaders);
                const mode: "master" | "template" = isMasterHeaders(fields)
                  ? "master"
                  : "template";
                setCsvMode(mode);
                setHeaderError(null);

                const PRICE_COLS = new Set(["base price", "price"]);
                const cleanedData = (result.data || [])
                  .map((row) => {
                    const out: CsvRow = {};
                    cleanedHeaders.forEach((h) => {
                      let val = String((row as any)?.[h] ?? "").trim();
                      if (PRICE_COLS.has(h.toLowerCase()) && val !== "") {
                        const num = parseFloat(val);
                        if (!isNaN(num)) val = String(Math.round(num));
                      }
                      out[h] = val;
                    });
                    return out;
                  })
                  .filter((row) =>
                    Object.values(row).some((v) => v !== "")
                  )
                  .sort((a, b) => {
                    const aHasData = Object.values(a).some((v) => v !== "");
                    const bHasData = Object.values(b).some((v) => v !== "");
                    if (aHasData && !bHasData) return -1;
                    if (!aHasData && bHasData) return 1;
                    return 0;
                  });

                setPreview(cleanedData);
                setRowErrors(
                  mode === "master"
                    ? validateRowsMaster(cleanedData)
                    : validateRowsTemplate(cleanedData)
                );
              },
              error: (err: unknown) => {
                message.error("Gagal membaca file CSV");
              },
            });
          };

          tryParse(0);
        };

        runParseAttempts(text);
      })
      .catch((err: unknown) => {
        message.error("Gagal membaca file CSV");
      });

    return false;
  };

  // ─── Upload ───────────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!file || headerError || rowErrors.length > 0) {
      message.error("Masih ada error pada data CSV");
      return;
    }

    let keepLoading = false;

    try {
      setLoading(true);
      setUploadProgress(0);
      clearResult();
      // Modal tetap terbuka — progress ditampilkan di dalam dialog

      const result = await importProductCSV(file, (percent) => {
        setUploadProgress(percent);
      });

      const acceptedJob = result?.serve;
      const acceptedJobId = acceptedJob?.id || acceptedJob?.job_id;

      if (acceptedJobId) {
        keepLoading = true;
        setUploadProgress(100);
        const fullJob = { ...acceptedJob, id: acceptedJobId };
        startJob(acceptedJobId, fullJob, {
          onOpenDialog: onOpenChange,
          onSuccess: onSuccess ?? (() => {}),
        });
        // Toast sebagai notifikasi background jika user menutup dialog
        updateProcessingToast(fullJob);
        return;
      }

      // Sync response (no background job)
      const errs = result?.errors;
      if (Array.isArray(errs) && errs.length) {
        openToast({ type: "warning", description: "Selesai • ada data gagal", duration: 6 });
        setLoading(false);
        return;
      }

      openToast({ type: "success", description: "Upload berhasil", duration: 4 });
      onSuccess?.();
      resetAll();
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Upload CSV gagal";
      openToast({ type: "error", description: msg, duration: 6 });
      setLoading(false);
    } finally {
      if (!keepLoading) setLoading(false);
    }
  }

  const canUpload = !!file && !isImportBusy && !headerError && rowErrors.length === 0;

  const uploadDisabledReason = !file
    ? "Pilih file CSV terlebih dahulu"
    : headerError
      ? "Format header tidak valid"
      : rowErrors.length > 0
        ? `Ada ${rowErrors.length} error pada data — perbaiki dulu`
        : isImportBusy
          ? "Sedang memproses upload"
          : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Modal
      title="Upload Produk (CSV)"
      open={open}
      onCancel={() => {
        if (!isImportBusy) onOpenChange(false);
      }}
      width={1000}
      maskClosable={!isImportBusy}
      keyboard={!isImportBusy}
      closable={!isImportBusy}
      centered
      styles={{
        body: {
          maxHeight: "70vh",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: 4,
        },
      }}
      footer={
        importResult ? (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              onClick={() => {
                clearResult();
                onOpenChange(false);
              }}
            >
              Tutup
            </Button>
          </div>
        ) : isImportBusy ? (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => onOpenChange(false)}>
              Tutup (proses tetap berjalan)
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadMasterTemplate}
            >
              Download Template
            </Button>
            <div style={{ display: "flex", gap: 8 }}>
              <Button disabled={!file} onClick={() => resetFileState()}>
                Ganti File
              </Button>
              <Tooltip title={uploadDisabledReason ?? undefined}>
                <Button
                  type="primary"
                  onClick={handleUpload}
                  loading={loading}
                  disabled={!canUpload}
                >
                  Upload
                </Button>
              </Tooltip>
            </div>
          </div>
        )
      }
    >
      {/* ── Result screen — hanya tampil untuk warning/error; success di-handle useEffect (reset+close) ── */}
      {importResult && importResult.type !== "success" ? (
        <div style={{ padding: "24px 0" }}>
          {importResult.type === "error" ? (
            <Alert
              type="error"
              showIcon
              message="Import gagal"
              description={importResult.message}
            />
          ) : (
            <div>
              <Alert
                type="warning"
                showIcon
                message={`Selesai — ${importResult.successCount} produk berhasil diproses, ${importResult.errorCount} gagal`}
                style={{ marginBottom: 16 }}
              />

              {/* Breakdown stats */}
              {(importResult.created > 0 || importResult.updated > 0 || importResult.variantCreated > 0) && (
                <div style={{ display: "flex", gap: 0, marginBottom: 16, border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}>
                  {importResult.created > 0 && (
                    <div style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRight: "1px solid #f0f0f0" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#52c41a" }}>{importResult.created}</div>
                      <div style={{ fontSize: 12, color: "#8c8c8c" }}>Produk baru</div>
                    </div>
                  )}
                  {importResult.updated > 0 && (
                    <div style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRight: importResult.variantCreated > 0 ? "1px solid #f0f0f0" : undefined }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#1677ff" }}>{importResult.updated}</div>
                      <div style={{ fontSize: 12, color: "#8c8c8c" }}>Produk diperbarui</div>
                    </div>
                  )}
                  {importResult.variantCreated > 0 && (
                    <div style={{ flex: 1, padding: "10px 0", textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#595959" }}>{importResult.variantCreated}</div>
                      <div style={{ fontSize: 12, color: "#8c8c8c" }}>Varian baru</div>
                    </div>
                  )}
                </div>
              )}
              {backendErrors.length > 0 && (
                <Alert
                  message={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>
                        Detail Error ({backendErrors.length} item)
                      </span>
                      <Button
                        size="small"
                        type="link"
                        onClick={() => {
                          const headers = ["Baris", "Nama Produk", "Pesan Error"];
                          const rows = backendErrors.map((e: any) => [
                            String(e?.row ?? "-"),
                            String(e?.name ?? "").replace(/"/g, '""'),
                            String(e?.message ?? JSON.stringify(e)).replace(/"/g, '""'),
                          ]);
                          const csv = [
                            headers.join(","),
                            ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
                          ].join("\n");
                          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
                          link.href = url;
                          link.download = `csv_import_errors_${ts}.csv`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }}
                        style={{ padding: 0 }}
                      >
                        Download Error CSV
                      </Button>
                    </div>
                  }
                  description={
                    <div style={{ maxHeight: 360, overflowY: "auto", margin: 0 }}>
                      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                        <thead style={{ position: "sticky", top: 0, background: "#fff5f5", zIndex: 1 }}>
                          <tr>
                            <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ffccc7", width: 60 }}>Baris</th>
                            <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ffccc7", width: 200 }}>Produk</th>
                            <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ffccc7" }}>Pesan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backendErrors.map((e: any, i: number) => (
                            <tr key={i} style={{ borderBottom: "1px solid #fff1f0" }}>
                              <td style={{ padding: "6px 8px", verticalAlign: "top", color: "#8c8c8c", fontFamily: "monospace" }}>
                                {e?.row ?? "-"}
                              </td>
                              <td style={{ padding: "6px 8px", verticalAlign: "top", color: "#262626" }}>
                                {e?.name || "—"}
                              </td>
                              <td style={{ padding: "6px 8px", verticalAlign: "top", color: "#cf1322" }}>
                                {e?.message || JSON.stringify(e)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  }
                  type="error"
                  showIcon
                />
              )}
            </div>
          )}
        </div>

      ) : isImportBusy ? (
        /* ── Progress screen — tampil selama upload berlangsung ── */
        <div style={{ padding: "24px 0" }}>
          {file && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                padding: "10px 14px",
                background: "#f5f5f5",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              <FileTextOutlined style={{ fontSize: 20, color: "#595959" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </div>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                  {Math.round(file.size / 1024)} KB
                  {summaryStats && ` · ${summaryStats.totalRows.toLocaleString()} baris`}
                </div>
              </div>
            </div>
          )}

          <ProductCsvImportProgress
            uploadProgress={uploadProgress}
            isUploading={loading && !job}
            job={job}
          />

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Kamu bisa tutup dialog ini — proses akan tetap berjalan di background.
            </Text>
          </div>
        </div>

      ) : (
        /* ── Upload form ── */
        <>
          <div style={{ marginBottom: 16 }}>
            <Collapse
              defaultActiveKey={[]}
              style={{ marginBottom: 12 }}
              items={[
                {
                  key: "rules",
                  label: <Text strong>Panduan Upload Produk</Text>,
                  children: (
                    <div style={{ fontSize: 13, lineHeight: "1.8" }}>
                      <div style={{ marginBottom: 10 }}>
                        <Text strong>3 Kolom Wajib di Header</Text>
                        <br />
                        <Text>
                          File CSV harus memiliki header{" "}
                          <Tag color="red">Nama Produk</Tag>{" "}
                          <Tag color="red">Master SKU</Tag>{" "}
                          <Tag color="red">Barcode</Tag>. File tanpa salah satu
                          dari 3 header ini akan ditolak.
                        </Text>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <Text strong>Kolom Lain Bersifat Opsional</Text>
                        <br />
                        <Text>
                          Hanya kolom yang ada di header CSV yang diperbarui di
                          database. Kolom yang tidak ada di file tidak akan
                          disentuh. Contoh: jika hanya ada kolom{" "}
                          <code>Base Price</code>, maka hanya harga dasar yang
                          berubah — stok, deskripsi, dan lainnya tetap aman.
                        </Text>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <Text strong>
                          Master SKU &amp; Barcode Tidak Bisa Diubah Lewat Import
                        </Text>
                        <br />
                        <Text>
                          Kedua kolom ini dipakai sebagai <b>identifier</b>{" "}
                          untuk mencocokkan produk dan varian di database. Jika
                          nilainya tidak ditemukan, sistem akan{" "}
                          <b>membuat produk / varian baru</b>. Untuk mengubah
                          nilai kedua kolom ini, gunakan form edit di halaman
                          detail produk.
                        </Text>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <Text strong>Nama Produk Bisa Diubah Lewat Import</Text>
                        <br />
                        <Text>
                          Jika <code>Master SKU</code> cocok dengan yang ada di
                          database, nilai <code>Nama Produk</code> akan
                          diperbarui sesuai isi CSV.
                        </Text>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <Text strong>Duplikat Barcode</Text>
                        <br />
                        <Text>
                          Jika ada lebih dari satu baris dengan{" "}
                          <code>Barcode</code> yang sama dalam satu file,{" "}
                          <b>baris terakhir yang akan dipakai</b>.
                        </Text>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <Text strong>Nilai Status Produk</Text>
                        <br />
                        <Text>
                          Kolom <code>Status Produk</code> menerima nilai:{" "}
                          <Tag color="green">normal</Tag>{" "}
                          <Tag color="green">aktif</Tag>{" "}
                          <Tag color="green">active</Tag>{" "}
                          <Tag color="orange">draft</Tag>{" "}
                          <Tag color="red">war</Tag>. Kosong atau nilai lain
                          akan diabaikan (status di database tidak berubah).
                        </Text>
                      </div>

                      <div>
                        <Text strong>Format File</Text>
                        <br />
                        <Text>
                          Download template di bawah untuk mendapatkan susunan
                          kolom yang benar. File hasil export dari halaman
                          produk juga bisa langsung digunakan untuk upload.
                        </Text>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <Dragger
            accept=".csv"
            beforeUpload={handleFile}
            showUploadList={false}
            disabled={loading}
            style={{ marginBottom: 16 }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {file ? "Klik atau drag untuk ganti file" : "Klik atau drag file CSV ke area ini"}
            </p>
            {file ? (
              <p className="ant-upload-hint" style={{ color: "#1890ff" }}>
                {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            ) : (
              <p className="ant-upload-hint">
                Hanya file .csv yang diterima
              </p>
            )}
          </Dragger>

          {/* ── Error alerts ── */}
          {headerError && (
            <Alert
              message="Format header tidak valid"
              description={
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{headerError}</pre>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {rowErrors.length > 0 && (
            <Alert
              message={`${rowErrors.length} baris memiliki error — perbaiki file sebelum upload`}
              description={
                <ul
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    paddingLeft: 20,
                    margin: 0,
                  }}
                >
                  {rowErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {backendErrors.length > 0 && (
            <Alert
              message="Error dari server sebelumnya"
              description={
                <ul
                  style={{
                    maxHeight: 160,
                    overflowY: "auto",
                    paddingLeft: 20,
                    margin: 0,
                  }}
                >
                  {backendErrors.map((e, i) => (
                    <li key={i}>
                      {e?.row ? `Baris ${e.row}: ` : ""}
                      {e?.message || JSON.stringify(e)}
                    </li>
                  ))}
                </ul>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* ── Summary & mini preview ── */}
          {summaryStats && !headerError && (
            <div style={{ marginBottom: 16 }}>
              {/* Summary stats */}
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  marginBottom: 12,
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {[
                  { label: "Produk unik (Master SKU)", value: summaryStats.uniqueSkus.toLocaleString() },
                  { label: "Varian unik (Barcode)", value: summaryStats.uniqueBarcodes.toLocaleString() },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRight: i < 2 ? "1px solid #f0f0f0" : undefined,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Format badge + mode */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  fontSize: 13,
                  color: "#595959",
                }}
              >
                <Tag color="blue" style={{ margin: 0 }}>
                  Format terdeteksi: {csvMode === "master" ? "Master File" : "Template"}
                </Tag>
                {rowErrors.length === 0 && !headerError && (
                  <Tag color="green" style={{ margin: 0 }}>Data siap diupload</Tag>
                )}
              </div>

              {/* Mini preview — key columns only */}
              {miniPreviewCols.length > 0 && (
                <Table
                  dataSource={preview}
                  columns={miniPreviewCols}
                  scroll={{ x: "max-content" }}
                  pagination={{ pageSize: 10, size: "small", showSizeChanger: false }}
                  size="small"
                  rowKey={(_, i) => i as number}
                  title={() => (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Preview {preview.length.toLocaleString()} baris
                    </Text>
                  )}
                />
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
