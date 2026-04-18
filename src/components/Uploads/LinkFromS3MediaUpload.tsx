import React, { useState } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  Table,
  Typography,
  Alert,
  Spin,
  theme,
  Tooltip,
  Modal,
  Tag,
} from "antd";
import { QuestionCircleOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import http from "../../api/http";
import { useThemeStore } from "../../hooks/useThemeStore";

const { Text } = Typography;

type ErrRow = { file: string; reason: string };

type ResultData = {
  total: number;
  processed: number;
  success: number;
  failed: number;
  errors: ErrRow[];
};

function getOrigin(): string {
  const base = String((http as any)?.defaults?.baseURL ?? "");
  const m = base.match(/^https?:\/\/[^/]+/);
  return m?.[0] ?? "http://localhost:3333";
}

const REASON_LABELS: Record<string, string> = {
  invalid_filename_format: "Nama file tidak sesuai format (barcode/slot)",
  code_not_found: "Barcode/SKU tidak ditemukan di database",
  slot_already_exists_skip: "Slot sudah ada (mode skip)",
  duplicate_code_slot: "Duplikat barcode+slot dalam satu run",
  db_error: "Gagal simpan ke database",
};

export default function LinkFromS3MediaUpload() {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();

  const [prefix, setPrefix] = useState("");
  const [mode, setMode] = useState<"skip" | "replace">("skip");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorFilter, setErrorFilter] = useState<string>("all");
  const [errorSearch, setErrorSearch] = useState("");

  const run = async () => {
    setResult(null);
    setErrorMsg("");
    setRunning(true);

    try {
      const origin = getOrigin();
      const res = await http.post(`${origin}/product-medias/link-from-s3`, {
        prefix: prefix.trim(),
        mode,
        type: 1,
      }, { timeout: 600000 });

      const serve = res.data?.serve as ResultData | undefined;
      if (serve) setResult(serve);
      else setErrorMsg(res.data?.message ?? "Respons tidak valid dari server");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "Gagal menghubungi server";
      setErrorMsg(String(msg));
    } finally {
      setRunning(false);
    }
  };

  const errorsWithLabel = (result?.errors ?? []).map((e) => ({
    ...e,
    reasonLabel: REASON_LABELS[e.reason] ?? e.reason,
  }));

  return (
    <Card
      title={<span style={{ fontWeight: 600 }}>🔗 Link Gambar dari S3</span>}
      style={{
        borderRadius: 16,
        boxShadow: isDarkMode ? "none" : "0 4px 15px rgba(0,0,0,0.03)",
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        <div style={{ color: token.colorTextDescription, fontSize: 13 }}>
          Scan folder di S3, cocokkan nama file (barcode/SKU) ke varian produk, lalu buat
          record media tanpa upload ulang.
          <br />
          Format nama file yang diterima:{" "}
          <Text code>8993137695169.jpg</Text>{" "}
          <Text code>8993137695169-2.jpg</Text>{" "}
          <Text code>ABCSKU_3.png</Text>
        </div>

        <Space
          wrap
          size={[16, 12]}
          style={{
            background: isDarkMode ? token.colorFillAlter : "#f9f9f9",
            padding: "12px 16px",
            borderRadius: 8,
            width: "100%",
          }}
        >
          <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 200 }}>
            <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
              S3 Prefix (kosongkan untuk scan semua){" "}
              <Tooltip title="Contoh: Products/ atau raw-uploads/2025/ — hanya file di dalam prefix ini yang akan di-scan">
                <QuestionCircleOutlined style={{ color: "#bfbfbf" }} />
              </Tooltip>
            </Text>
            <Input
              placeholder="Contoh: Products/ atau raw-uploads/"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              disabled={running}
              style={{ width: "100%" }}
            />
          </Space>

          <Space direction="vertical" size={4}>
            <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
              Mode{" "}
              <Tooltip title="Skip: lewati jika slot sudah ada. Replace: timpa media yang sudah ada di slot tersebut.">
                <QuestionCircleOutlined style={{ color: "#bfbfbf" }} />
              </Tooltip>
            </Text>
            <Select
              value={mode}
              onChange={(v) => setMode(v)}
              disabled={running}
              style={{ width: 120 }}
              options={[
                { value: "skip", label: "Skip (aman)" },
                { value: "replace", label: "Replace" },
              ]}
            />
          </Space>

          <div style={{ paddingTop: 20 }}>
            <Button type="primary" onClick={run} disabled={running} loading={running}>
              {running ? "Memproses..." : "Jalankan"}
            </Button>
          </div>
        </Space>

        {running && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <Spin tip="Scan S3 dan link media..." />
          </div>
        )}

        {errorMsg && <Alert type="error" message={errorMsg} showIcon />}

        {result && !running && (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Alert
              type={result.success > 0 && result.failed === 0 ? "success" : result.success > 0 ? "warning" : "error"}
              showIcon
              message={
                <Space size={24}>
                  <span>Total S3: <strong>{result.total}</strong></span>
                  <span>Diproses: <strong>{result.processed}</strong></span>
                  <span style={{ color: "#52c41a" }}>Berhasil: <strong>{result.success}</strong></span>
                  <span style={{ color: result.failed > 0 ? "#ff4d4f" : undefined }}>
                    Gagal/Skip: <strong>{result.failed}</strong>
                  </span>
                </Space>
              }
            />

            {errorsWithLabel.length > 0 && (
              <div>
                <Space wrap size={[8, 8]}>
                  {(() => {
                    const counts = errorsWithLabel.reduce<Record<string, number>>((acc, e) => {
                      acc[e.reasonLabel] = (acc[e.reasonLabel] || 0) + 1;
                      return acc;
                    }, {});
                    return Object.entries(counts).map(([label, count]) => (
                      <Tag key={label} color="red" style={{ margin: 0 }}>
                        {label}: {count}
                      </Tag>
                    ));
                  })()}
                </Space>
                <div style={{ marginTop: 12 }}>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => setErrorDialogOpen(true)}
                  >
                    Lihat Detail Error ({errorsWithLabel.length})
                  </Button>
                </div>
              </div>
            )}
          </Space>
        )}
      </Space>

      <Modal
        title={`Detail Gagal / Skip — ${errorsWithLabel.length} item`}
        open={errorDialogOpen}
        onCancel={() => setErrorDialogOpen(false)}
        width={920}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => {
              const headers = ["File", "Alasan"];
              const rows = errorsWithLabel.map((e) => [
                String(e.file).replace(/"/g, '""'),
                String(e.reasonLabel).replace(/"/g, '""'),
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
              link.download = `s3_link_errors_${ts}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
          >
            Download CSV
          </Button>,
          <Button key="close" type="primary" onClick={() => setErrorDialogOpen(false)}>
            Tutup
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Space wrap size={[8, 8]}>
            <Select
              value={errorFilter}
              onChange={setErrorFilter}
              style={{ minWidth: 280 }}
              options={[
                { value: "all", label: `Semua (${errorsWithLabel.length})` },
                ...Array.from(new Set(errorsWithLabel.map((e) => e.reasonLabel))).map((label) => ({
                  value: label,
                  label: `${label} (${errorsWithLabel.filter((e) => e.reasonLabel === label).length})`,
                })),
              ]}
            />
            <Input.Search
              placeholder="Cari nama file…"
              value={errorSearch}
              onChange={(e) => setErrorSearch(e.target.value)}
              allowClear
              style={{ width: 260 }}
            />
          </Space>
          <Table
            size="small"
            rowKey={(r) => `${r.file}-${r.reason}`}
            dataSource={errorsWithLabel.filter((e) => {
              const matchFilter = errorFilter === "all" || e.reasonLabel === errorFilter;
              const matchSearch = !errorSearch.trim() || e.file.toLowerCase().includes(errorSearch.toLowerCase());
              return matchFilter && matchSearch;
            })}
            pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
            scroll={{ y: 420 }}
            columns={[
              {
                title: "File (S3 Key)",
                dataIndex: "file",
                ellipsis: true,
                render: (v: string) => (
                  <Text style={{ fontSize: 12 }} copyable>
                    {v}
                  </Text>
                ),
              },
              {
                title: "Alasan",
                dataIndex: "reasonLabel",
                width: 280,
                render: (v: string) => <Tag color="red">{v}</Tag>,
              },
            ]}
          />
        </Space>
      </Modal>
    </Card>
  );
}
