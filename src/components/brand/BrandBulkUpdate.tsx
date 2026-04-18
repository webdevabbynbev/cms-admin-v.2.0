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
} from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import http from "../../api/http";

const { Dragger } = Upload;
const { Text } = Typography;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function BrandBulkUpdate({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  function resetState() {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setProgress(0);
    setLoading(false);
    setError(null);
  }

  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
    setProgress(0);

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const fields = result.meta.fields || [];
        const required = ["id"];
        const missing = required.filter((r) => !fields.includes(r));

        if (missing.length > 0) {
          setError(`Kolom wajib tidak ditemukan: ${missing.join(", ")}`);
          setPreview([]);
          return;
        }

        setHeaders(fields);
        setPreview(result.data.slice(0, 10)); // Preview first 10 rows
      },
      error: (err) => {
        
        message.error("Gagal membaca file CSV");
      },
    });

    return false; // Prevent auto upload
  };

  async function handleUpload() {
    if (!file || error) {
      message.error("Masih ada error pada data CSV");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      await http.post("/admin/brands/bulk/data", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );
          setProgress(percentCompleted);
        },
      });

      message.success("Bulk update brands berhasil");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      
      message.error(err?.response?.data?.message || "Bulk update gagal");
    } finally {
      setLoading(false);
    }
  }

  const columns = headers.map((h) => ({
    title: h,
    dataIndex: h,
    key: h,
    ellipsis: true,
  }));

  const downloadTemplate = () => {
    const csvContent =
      "id,name,slug,description,is_active,banner_url,logo_url\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "brand_bulk_update_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      title="Bulk Update Brands"
      open={open}
      onCancel={() => !loading && onOpenChange(false)}
      onOk={handleUpload}
      confirmLoading={loading}
      okText={loading ? "Updating..." : "Update"}
      okButtonProps={{ disabled: !file || !!error || loading }}
      width={800}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Upload file CSV untuk update data brands secara massal.
          <br />
          Kolom: <code>id</code> (wajib), <code>name</code>, <code>slug</code>,{" "}
          <code>description</code>, <code>is_active</code> (1=Aktif,
          0=Non-aktif), <code>logo_url</code>, <code>banner_url</code>
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
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Klik atau drag file CSV ke area ini</p>
        {file && (
          <p className="ant-upload-hint" style={{ color: "#1890ff" }}>
            File terpilih: {file.name}
          </p>
        )}
      </Dragger>

      {loading && (
        <Progress
          percent={progress}
          status="active"
          style={{ marginBottom: 16 }}
        />
      )}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
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
    </Modal>
  );
}
