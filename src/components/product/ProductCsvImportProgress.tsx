"use client";

import { Alert, Progress, Space, Tag, Typography } from "antd";
import type { ProductCsvImportJobStatusPayload } from "../../services/api/product.services";

const { Text } = Typography;

type Props = {
  uploadProgress: number;
  isUploading: boolean;
  job: ProductCsvImportJobStatusPayload | null;
};

const statusMeta: Record<
  ProductCsvImportJobStatusPayload["status"],
  {
    color: string;
    alertType: "info" | "success" | "warning" | "error";
    label: string;
  }
> = {
  queued: { color: "blue", alertType: "info", label: "Menunggu" },
  processing: { color: "processing", alertType: "info", label: "Mengupload" },
  completed: { color: "success", alertType: "success", label: "Selesai" },
  completed_with_errors: {
    color: "warning",
    alertType: "warning",
    label: "Selesai dengan kendala",
  },
  failed: { color: "error", alertType: "error", label: "Gagal" },
};

export default function ProductCsvImportProgress({
  uploadProgress,
  isUploading,
  job,
}: Props) {
  if (!isUploading && !job) return null;

  if (!job) {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Mengupload file CSV ke server"
        description={
          <div style={{ marginTop: 8 }}>
            <Progress percent={uploadProgress} status="active" />
            <Text type="secondary">
              File sedang dikirim. Setelah selesai, sistem akan lanjut
              mengupload produk di background.
            </Text>
          </div>
        }
      />
    );
  }

  const meta = statusMeta[job.status];
  const totalProducts = Number(job.totalProducts || 0);
  const processedProducts = Number(job.processedProducts || 0);
  const successfulProducts = Number(job.successfulProducts || 0);
  const errorCount = Number(job.errorCount || 0);
  const progress =
    job.status === "completed" || job.status === "completed_with_errors"
      ? 100
      : Math.max(0, Math.min(100, Number(job.progressPercent || 0)));

  return (
    <Alert
      type={meta.alertType}
      showIcon
      style={{ marginBottom: 16 }}
      message={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>{job.message || "Upload produk sedang berjalan."}</span>
          <Tag color={meta.color}>{meta.label}</Tag>
        </div>
      }
      description={
        <div style={{ marginTop: 8 }}>
          <Progress
            percent={progress}
            status={job.status === "failed" ? "exception" : "active"}
            strokeColor={
              job.status === "completed"
                ? "#52c41a"
                : job.status === "completed_with_errors"
                  ? "#faad14"
                  : undefined
            }
          />

          <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
            {job.mode && <Tag>{job.mode.toUpperCase()}</Tag>}
            {totalProducts > 0 && (
              <Text>
                <b>{processedProducts}</b> / {totalProducts} produk
              </Text>
            )}
            <Text>
              Berhasil: <b>{successfulProducts}</b>
            </Text>
            {errorCount > 0 && (
              <Text type="warning">
                Gagal: <b>{errorCount}</b>
              </Text>
            )}
          </Space>
          {job.currentProduct && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#595959",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                width: "100%",
              }}
            >
              Memproses: <b>{job.currentProduct}</b>
            </div>
          )}
        </div>
      }
    />
  );
}
