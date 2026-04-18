import React from "react";
import { Button, Card, Input, Select, Grid } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Search } = Input;

type Props = {
  params: { status?: string; q?: string };
  setParams: (fn: (prev: URLSearchParams) => URLSearchParams) => void;
  pagination: { pageSize?: number };
  onCreate: () => void;
};

const SaleFiltersCard: React.FC<Props> = ({
  params,
  setParams,
  pagination,
  onCreate,
}) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  return (
    <Card
      variant="borderless"
      style={{
        marginBottom: 20,
        borderRadius: 12,
        border: "1px solid #f0d7e5",
        boxShadow: "0 10px 24px rgba(155, 60, 108, 0.08)",
      }}
      bodyStyle={{ padding: 16 }}
    >
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 12 }}>Show</span>
            <Select<number>
              style={{ width: 90, marginLeft: 10, marginRight: 10 }}
              size="large"
              value={pagination.pageSize as number}
              onChange={(pageSize) => {
                setParams((prev) => {
                  prev.set("per_page", String(pageSize));
                  prev.set("page", "1");
                  return prev;
                });
              }}
              options={[
                { value: 10, label: "10" },
                { value: 25, label: "25" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
            />
            <span style={{ fontSize: 12 }}>entries</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Select
              style={{ width: 140 }}
              size="large"
              value={params.status}
              onChange={(v) => {
                setParams((p) => {
                  p.set("status", String(v));
                  p.set("page", "1");
                  return p;
                });
              }}
              options={[
                { value: "all", label: "Semua Status" },
                { value: "running", label: "Sedang Berjalan" },
                { value: "upcoming", label: "Akan Datang" },
                { value: "ended", label: "Berakhir" },
                { value: "inactive", label: "Nonaktif" },
              ]}
            />
            <Search
              style={{ flex: 1 }}
              placeholder="Cari judul atau deskripsi promosi..."
              allowClear
              size="large"
              defaultValue={params.q}
              onSearch={(val) => {
                setParams((p) => {
                  if (val.trim()) p.set("q", val.trim());
                  else p.delete("q");
                  p.set("page", "1");
                  return p;
                });
              }}
            />
          </div>

          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={onCreate}
            style={{
              borderRadius: 10,
              height: 40,
              fontWeight: 600,
              background: "linear-gradient(135deg, #9b3c6c 0%, #c53d7f 100%)",
              borderColor: "#9b3c6c",
              boxShadow: "0 8px 18px rgba(155, 60, 108, 0.2)",
            }}
            block
          >
            Buat Promo Sale
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: "100%",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 12 }}>Show</span>
            <Select<number>
              style={{ width: 90, marginLeft: 10, marginRight: 10 }}
              size="large"
              value={pagination.pageSize as number}
              onChange={(pageSize) => {
                setParams((prev) => {
                  prev.set("per_page", String(pageSize));
                  prev.set("page", "1");
                  return prev;
                });
              }}
              options={[
                { value: 10, label: "10" },
                { value: 25, label: "25" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
            />
            <span style={{ fontSize: 12 }}>entries</span>
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Select
              style={{ width: 220 }}
              size="large"
              value={params.status}
              onChange={(v) => {
                setParams((p) => {
                  p.set("status", String(v));
                  p.set("page", "1");
                  return p;
                });
              }}
              options={[
                { value: "all", label: "Semua Status" },
                { value: "running", label: "Sedang Berjalan" },
                { value: "upcoming", label: "Akan Datang" },
                { value: "ended", label: "Berakhir" },
                { value: "inactive", label: "Nonaktif" },
              ]}
            />

            <Search
              placeholder="Cari judul atau deskripsi promosi..."
              allowClear
              size="large"
              enterButton={
                <Button
                  style={{
                    background:
                      "linear-gradient(135deg, #9b3c6c 0%, #c53d7f 100%)",
                    borderColor: "#9b3c6c",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  Cari
                </Button>
              }
              defaultValue={params.q}
              onSearch={(val) => {
                setParams((p) => {
                  if (val.trim()) p.set("q", val.trim());
                  else p.delete("q");
                  p.set("page", "1");
                  return p;
                });
              }}
            />
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={onCreate}
              style={{
                borderRadius: 10,
                height: 40,
                fontWeight: 600,
                background: "linear-gradient(135deg, #9b3c6c 0%, #c53d7f 100%)",
                borderColor: "#9b3c6c",
                boxShadow: "0 8px 18px rgba(155, 60, 108, 0.2)",
              }}
            >
              Buat Promo Sale
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SaleFiltersCard;
