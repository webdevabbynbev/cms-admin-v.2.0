import React from "react";
import {
  Modal,
  Upload,
  Button,
  Space,
  Alert,
  Table,
  Typography,
  message,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import { bulkUploadReferralCodes } from "../../../api/referral";

const { Dragger } = Upload;
const { Text } = Typography;

type BulkUploadResult = {
  id: number;
  row?: number;
  code: string;
  discount_percent: number;
  is_active: number;
  started_at: string | null;
  expired_at: string | null;
};

type BulkUploadError = {
  row: number;
  code?: string;
  reason: string;
};

type BulkUploadResponse = {
  message: string;
  serve: {
    total_rows_in_csv: number;
    success: number;
    failed: number;
    skipped: number;
    results: BulkUploadResult[];
    errors: BulkUploadError[];
    skipped_items: Array<{ row: number; code: string; reason: string }>;
  };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const downloadTemplate = () => {
  const csvContent = [
    "code,discount_percent,is_active,started_at,expired_at",
    "ABBY10,10,1,2026-03-01 00:00,2026-12-31 23:59",
    "BEV20,20,0,,",
    "WELCOME5,5,1,2026-04-01,2026-06-30",
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "referral_codes_template.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const BulkUploadReferralCode: React.FC<Props> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [fileList, setFileList] = React.useState<UploadFile[]>([]);
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<BulkUploadResponse | null>(null);
  const [hasPreview, setHasPreview] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setFileList([]);
      setFile(null);
      setLoading(false);
      setResult(null);
      setHasPreview(false);
    }
  }, [open]);

  const handleUpload = async () => {
    if (!file) {
      message.error("Pilih file CSV terlebih dahulu");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const isPreview = !hasPreview;
      const resp = await bulkUploadReferralCodes(formData, isPreview);
      setResult(resp.data);

      const success = resp.data?.serve?.success ?? 0;
      const failed = resp.data?.serve?.failed ?? 0;
      const skipped = resp.data?.serve?.skipped ?? 0;
      if (isPreview) {
        setHasPreview(true);
        message.info(
          `Pengecekan selesai. Siap disimpan: ${success}, Dilewati: ${skipped}, Gagal: ${failed}`,
        );
      } else {
        setHasPreview(false);
        if (success > 0) {
          message.success(
            `Bulk upload selesai. Berhasil: ${success}, Dilewati: ${skipped}, Gagal: ${failed}`,
          );
          onSuccess?.();
        } else if (skipped > 0 && failed === 0) {
          message.info(
            `Semua data sudah ada, dilewati: ${skipped}. Tidak ada data baru.`,
          );
        } else {
          message.error("Semua data gagal diupload");
        }
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Bulk upload gagal");
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    accept: ".csv",
    multiple: false,
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      if (!isCsv) {
        message.error("Hanya file CSV yang diperbolehkan");
        return Upload.LIST_IGNORE;
      }
      setFile(file);
      setFileList([file as UploadFile]);
      setResult(null);
      setHasPreview(false);
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setFile(null);
      setResult(null);
      setHasPreview(false);
    },
    showUploadList: true,
  };

  const successColumns = [
    { title: "Baris", dataIndex: "row", key: "row", width: 80 },
    { title: "Kode", dataIndex: "code", key: "code" },
    {
      title: "Diskon (%)",
      dataIndex: "discount_percent",
      key: "discount_percent",
    },
    {
      title: "Aktif",
      dataIndex: "is_active",
      key: "is_active",
      render: (val: number) => (Number(val) === 1 ? "Aktif" : "Nonaktif"),
    },
    {
      title: "Mulai",
      dataIndex: "started_at",
      key: "started_at",
      render: (val: string | null) => val ?? "-",
    },
    {
      title: "Berakhir",
      dataIndex: "expired_at",
      key: "expired_at",
      render: (val: string | null) => val ?? "-",
    },
  ];

  const errorColumns = [
    { title: "Baris", dataIndex: "row", key: "row", width: 80 },
    { title: "Kode", dataIndex: "code", key: "code", render: (v: string) => v || "-" },
    { title: "Alasan", dataIndex: "reason", key: "reason" },
  ];

  const skippedColumns = [
    { title: "Baris", dataIndex: "row", key: "row", width: 80 },
    { title: "Kode", dataIndex: "code", key: "code" },
    { title: "Alasan", dataIndex: "reason", key: "reason" },
  ];

  return (
    <Modal
      title="Bulk Upload Referral Codes"
      open={open}
      onCancel={() => !loading && onOpenChange(false)}
      onOk={handleUpload}
      confirmLoading={loading}
      okText={
        loading ? (hasPreview ? "Menyimpan..." : "Mengecek...") : hasPreview ? "Simpan" : "Upload"
      }
      okButtonProps={{ disabled: loading || fileList.length === 0 }}
      width={840}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text type="secondary">
            Upload file CSV untuk menambahkan referral code secara massal.
            <br />
            Kolom wajib: <code>code</code>, <code>discount_percent</code>.
            <br />
            Opsional: <code>is_active</code>, <code>started_at</code>,{" "}
            <code>expired_at</code>.
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

        <Alert
          type="info"
          showIcon
          message="Format tanggal"
          description="Gunakan format YYYY-MM-DD atau YYYY-MM-DD HH:mm (wajib). Format seperti 4/1/2026 tidak diterima. Kode akan otomatis diubah ke uppercase."
        />

        <Dragger {...uploadProps} disabled={loading}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Klik atau drag file CSV ke area ini</p>
          {fileList[0]?.name && (
            <p className="ant-upload-hint" style={{ color: "#1890ff" }}>
              File terpilih: {fileList[0].name}
            </p>
          )}
        </Dragger>

        {result && (
          <>
            <Alert
              type={result.serve.failed === 0 ? "success" : "warning"}
              showIcon
              message={`Total: ${result.serve.total_rows_in_csv} | Berhasil: ${result.serve.success} | Dilewati: ${result.serve.skipped} | Gagal: ${result.serve.failed}`}
            />

            {result.serve.results.length > 0 && (
              <Table
                dataSource={result.serve.results}
                columns={successColumns}
                rowKey={(r) => String(r.id || r.row || r.code)}
                size="small"
                pagination={false}
              />
            )}

            {result.serve.errors.length > 0 && (
              <Table
                dataSource={result.serve.errors}
                columns={errorColumns}
                rowKey={(r) => `${r.row}-${r.code || "no-code"}`}
                size="small"
                pagination={false}
              />
            )}

            {result.serve.skipped_items.length > 0 && (
              <Table
                dataSource={result.serve.skipped_items}
                columns={skippedColumns}
                rowKey={(r) => `${r.row}-${r.code}-skipped`}
                size="small"
                pagination={false}
              />
            )}
          </>
        )}
      </Space>
    </Modal>
  );
};

export default BulkUploadReferralCode;
