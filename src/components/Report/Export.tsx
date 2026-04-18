import { useState } from "react";
import { Button, Dropdown, Menu, message } from "antd";
import { DownOutlined, ExportOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { createAndWaitReport } from "../../pages/reports/_shared/reportRunner";
import { downloadReport, type ReportFormat } from "../../services/api/report.services";

type ExportFormat = Extract<ReportFormat, "excel" | "csv">;

type ReportRequest = Parameters<typeof createAndWaitReport>[0];

type ExportProps = {
  buildRequest: (format: ExportFormat) => ReportRequest;
  getDownloadFileName?: (format: ExportFormat) => string;
  formats?: ExportFormat[];
  disabled?: boolean;
  buttonText?: string;
};

const DEFAULT_FORMATS: ExportFormat[] = ["excel", "csv"];

const getDefaultExtension = (format: ExportFormat) => {
  if (format === "excel") return "xlsx";
  return format;
};

export default function Export({
  buildRequest,
  getDownloadFileName,
  formats = DEFAULT_FORMATS,
  disabled = false,
  buttonText = "Export",
}: ExportProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setLoading(true);
    const hide = message.loading(
      `Sedang menyiapkan laporan ${format.toUpperCase()}...`,
      0,
    );

    try {
      const payload = buildRequest(format);
      const report = await createAndWaitReport(payload);
      const blob = await downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const extension = getDefaultExtension(format);
      a.download =
        getDownloadFileName?.(format) ||
        `report-${dayjs().format("YYYYMMDD")}.${extension}`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success(`Laporan ${format.toUpperCase()} berhasil diunduh`);
    } catch (e: any) {
      message.error(e?.message || `Gagal mengunduh laporan ${format.toUpperCase()}`);
    } finally {
      hide();
      setLoading(false);
    }
  };

  const exportMenu = (
    <Menu onClick={({ key }) => handleExport(key as ExportFormat)}>
      {formats.includes("excel") && (
        <Menu.Item key="excel" icon={<ExportOutlined />}>
          Export ke Excel (.xlsx)
        </Menu.Item>
      )}
      {formats.includes("csv") && (
        <Menu.Item key="csv" icon={<ExportOutlined />}>
          Export ke CSV (.csv)
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <Dropdown
      overlay={exportMenu}
      placement="bottomRight"
      trigger={["click"]}
      disabled={disabled || loading}
    >
      <Button type="primary" loading={loading} icon={<ExportOutlined />}>
        {buttonText} <DownOutlined style={{ fontSize: 10 }} />
      </Button>
    </Dropdown>
  );
}
