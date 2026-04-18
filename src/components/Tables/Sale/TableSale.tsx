import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Card,
  Popconfirm,
  Tag,
  message,
  Badge,
  Switch,
  Tooltip,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import type { SaleRecord } from "../../Forms/Sale/saleTypes";
import useTableSale, {
  BASE_URL,
  toIdNum,
  isPublished,
  promoStatus,
  formatDateTime,
  countProducts,
} from "../../../hooks/useTableSale";
import SaleStatsCards from "./SaleStatsCards";
import SaleFiltersCard from "./SaleFiltersCard";
import SaleItemsTable from "./SaleItemsTable";

const TableSale: React.FC = () => {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const {
    params,
    setParams,
    pagination,
    loading,
    fetchList,
    filteredData,
    stats,
    tablePagination,
    handleTableChange,
  } = useTableSale();

  const columns: ColumnsType<SaleRecord> = [
    {
      title: "Detail Sale",
      key: "promo",
      width: 350,
      render: (_: unknown, r) => {
        const st = promoStatus(r);
        const idNum = toIdNum(r.id);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tag color={st.color} style={{ margin: 0, fontWeight: 500 }}>
                {st.label}
              </Tag>
              {idNum && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#8c8c8c",
                    fontFamily: "monospace",
                  }}
                >
                  ID: {String(idNum)}
                </span>
              )}
            </div>

            <div style={{ fontWeight: 600, fontSize: 14, color: "#262626" }}>
              {r.title ?? "-"}
            </div>

            {r.description && (
              <div
                style={{
                  fontSize: 12,
                  color: "#595959",
                  lineHeight: 1.5,
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {String(r.description)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      align: "center",
      render: (_: unknown, r) => {
        const idNum = toIdNum(r.id);
        const published = isPublished(r);

        return (
          <Tooltip
            title={published ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
          >
            <Switch
              checked={published}
              checkedChildren="Aktif"
              unCheckedChildren="Nonaktif"
              onChange={async (checked) => {
                if (!idNum) {
                  message.error("ID promo tidak tersedia.");
                  return;
                }
                try {
                  await http.put(`${BASE_URL}/${idNum}`, {
                    is_publish: checked,
                  });
                  message.success(
                    checked
                      ? "Promosi berhasil diaktifkan"
                      : "Promosi berhasil dinonaktifkan",
                  );
                  fetchList();
                } catch (e: any) {
                  message.error(
                    e?.response?.data?.message || "Gagal update status.",
                  );
                }
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Produk Sale",
      key: "products",
      width: 90,
      align: "center",
      render: (_: unknown, r) => (
        <Badge
          count={countProducts(r)}
          showZero
          color="#722ed1"
          style={{ fontWeight: 500 }}
        />
      ),
    },
    {
      title: "Periode Promosi Sale",
      key: "period",
      width: 240,
      render: (_: unknown, r) => {
        const s = formatDateTime(r.startDatetime);
        const e = formatDateTime(r.endDatetime);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 12, color: "#595959" }}>
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              Mulai: <span style={{ fontWeight: 500 }}>{s}</span>
            </div>
            <div style={{ fontSize: 12, color: "#595959" }}>
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              Selesai: <span style={{ fontWeight: 500 }}>{e}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      width: "10%",
      align: "center",
      fixed: isMobile ? undefined : "right",
      render: (_: unknown, r) => {
        const idNum = toIdNum(r.id);

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Tooltip title="Edit Sale">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  if (!idNum) {
                    message.error("ID promo tidak tersedia.");
                    return;
                  }
                  navigate(`/sales/${idNum}`);
                }}
              />
            </Tooltip>

            <Tooltip title="Hapus Sale">
              <Popconfirm
                placement="left"
                title="Hapus promosi?"
                description="Promosi yang dihapus tidak dapat dikembalikan."
                onConfirm={async () => {
                  if (!idNum) {
                    message.error("ID promo tidak tersedia.");
                    return;
                  }
                  try {
                    await http.delete(`${BASE_URL}/${idNum}`);
                    message.success("Promosi berhasil dihapus");
                    fetchList();
                  } catch (e: any) {
                    message.error(
                      e?.response?.data?.message || "Gagal menghapus promosi",
                    );
                  }
                }}
                okText="Ya"
                cancelText="Batal"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "0" }}>
      <SaleStatsCards stats={stats} />
      <SaleFiltersCard
        params={params}
        setParams={setParams}
        pagination={pagination}
        onCreate={() => navigate("/sales/new")}
      />

      <Card
        variant="borderless"
        style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
        bodyStyle={{ padding: 0 }}
      >
        <div className="overflow-x-auto md:overflow-visible">
          <Table<SaleRecord>
            rowKey={(r) => r.id}
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pagination={tablePagination}
            onChange={handleTableChange}
            expandable={{
              expandedRowRender: (record) => <SaleItemsTable sale={record} />,
              rowExpandable: () => true,
            }}
            scroll={{ x: "max-content" }}
            style={{ borderRadius: 6 }}
          />
        </div>
      </Card>
    </div>
  );
};

export default TableSale;
