// RamadanFilterCard.tsx
import React from "react";
import { Card, Row, Col, Select, Input, Button, Space, Tooltip, theme, Grid } from "antd";
import {
  FilterOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";

interface RamadanFilterCardProps {
  pageSize: number;
  pageSizeValue?: number | string;
  searchParams: URLSearchParams;
  setSearchParams: (
    p: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
  ) => void;
  onExportCsv: () => void;
  onImportCsv: () => void;
  exportLoading?: boolean;
  importLoading?: boolean;
  importDisabled?: boolean;
  importDisabledReason?: string;
}

const RamadanFilterCard: React.FC<RamadanFilterCardProps> = ({
  pageSize,
  pageSizeValue,
  searchParams,
  setSearchParams,
  onExportCsv,
  onImportCsv,
  exportLoading = false,
  importLoading = false,
  importDisabled = false,
  importDisabledReason = "Fitur import belum tersedia",
}) => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { Search } = Input;
  const [searchInput, setSearchInput] = React.useState(
    searchParams.get("q") || "",
  );

  React.useEffect(() => {
    setSearchInput(searchParams.get("q") || "");
  }, [searchParams]);
  const importBtn = (
    <Button
      icon={<UploadOutlined />}
      onClick={onImportCsv}
      loading={importLoading}
      disabled={importDisabled || importLoading}
    >
      {importLoading ? "Importing..." : "Import CSV"}
    </Button>
  );
  const importNode = importDisabled ? (
    <Tooltip title={importDisabledReason}>
      <span>{importBtn}</span>
    </Tooltip>
  ) : (
    importBtn
  );

  return (
    <Card
      className="shadow"
      style={{
        marginBottom: "20px",
        borderRadius: "8px",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      extra={!isMobile ? (
        <Space>
          {importNode}
          <Button
            icon={<DownloadOutlined />}
            onClick={onExportCsv}
            loading={exportLoading}
            disabled={exportLoading}
          >
            {exportLoading ? "Exporting..." : "Export CSV"}
          </Button>
        </Space>
      ) : undefined}
      title={
        <span
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: token.colorText,
          }}
        >
          <FilterOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
          Filter & Pencarian
        </span>
      }
    >
      {isMobile && (
        <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {importNode}
          <Button
            icon={<DownloadOutlined />}
            onClick={onExportCsv}
            loading={exportLoading}
            disabled={exportLoading}
          >
            {exportLoading ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      )}

      <Row gutter={[16, 16]} align="bottom">
        <Col xs={24} sm={12} md={4}>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{ fontSize: "12px", fontWeight: 600, color: token.colorTextDescription }}
            >
              Tampilkan
            </span>
          </div>
          <Select
            style={{ width: "100%" }}
            value={pageSizeValue ?? pageSize}
            onChange={(ps) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("per_page", String(ps));
                next.set("page", "1");
                return next;
              });
            }}
            options={[
              { value: 10, label: "10 baris" },
              { value: 50, label: "50 baris" },
              { value: 100, label: "100 baris" },
              { value: 500, label: "500 baris" },
              { value: "all", label: "Semua peserta" },
            ]}
          />
          {/* total peserta disembunyikan sesuai request */}
        </Col>

        <Col xs={24} sm={12} md={5}>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{ fontSize: "12px", fontWeight: 600, color: token.colorTextDescription }}
            >
              Filter Check-in
            </span>
          </div>
          <Select
            style={{ width: "100%" }}
            placeholder="Semua peserta"
            allowClear
            value={
              searchParams.get("min_checkin")
                ? Number(searchParams.get("min_checkin"))
                : undefined
            }
            onChange={(val) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (val) next.set("min_checkin", String(val));
                else next.delete("min_checkin");
                next.set("page", "1");
                return next;
              });
            }}
            options={[
              { value: 7, label: "Minimal 7 hari" },
              { value: 15, label: "Minimal 15 hari" },
              { value: 30, label: "Minimal 30 hari" },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={5}>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{ fontSize: "12px", fontWeight: 600, color: token.colorTextDescription }}
            >
              Status Hadiah
            </span>
          </div>
          <Select
            style={{ width: "100%" }}
            placeholder="Semua status"
            allowClear
            value={
              searchParams.get("has_prize") !== null
                ? Number(searchParams.get("has_prize"))
                : undefined
            }
            onChange={(val) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (val !== undefined && val !== null)
                  next.set("has_prize", String(val));
                else next.delete("has_prize");
                next.set("page", "1");
                return next;
              });
            }}
            options={[
              { value: 1, label: "✅ Sudah dapat hadiah" },
              { value: 0, label: "⏳ Belum dapat hadiah" },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={10}>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{ fontSize: "12px", fontWeight: 600, color: token.colorTextDescription }}
            >
              Cari Peserta
            </span>
          </div>
          <Search
            placeholder="Cari berdasarkan nama..."
            prefix={<SearchOutlined />}
            value={searchInput}
            onSearch={(val) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (val.trim()) next.set("q", val.trim());
                else next.delete("q");
                next.set("page", "1");
                return next;
              });
            }}
            onChange={(e) => {
              const val = e.target.value;
              setSearchInput(val);
              if (val !== "") return;
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("q");
                next.set("page", "1");
                return next;
              });
            }}
            allowClear
            enterButton="Cari"
          />
        </Col>
      </Row>
    </Card>
  );
};

export default RamadanFilterCard;
