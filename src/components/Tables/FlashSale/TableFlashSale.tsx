import React from "react";
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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { updateFlashSale, deleteFlashSale } from "../../../api/flash-sale";
import useTableFlashSale from "../../../hooks/flashsale/useTableFlashSale";
import type { FlashSaleRow } from "../../../services/api/flash-sale/flashsale.types";
import {
  toIdNum,
  isPublished,
  promoStatus,
  formatDateTime,
  countProducts,
} from "../../../utils/flash-sale/table";
import FlashSaleStatsCards from "./FlashSaleStatsCards";
import FlashSaleFiltersCard from "./FlashSaleFiltersCard";
import FlashSaleItemsTable from "./FlashSaleItemsTable";

const TableFlashSale: React.FC = () => {
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
  } = useTableFlashSale();

  const columns: ColumnsType<FlashSaleRow> = [
    {
      title: "Detail Flash Sale",
      key: "promo",
      width: 350,
      render: (_: unknown, r) => {
        const st = promoStatus(r);
        const idNum = toIdNum(r.id);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tag
                color={st.color}
                icon={<ThunderboltOutlined />}
                style={{ margin: 0, fontWeight: 500 }}
              >
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
                  message.error("ID flash sale tidak tersedia.");
                  return;
                }
                try {
                  await updateFlashSale(idNum, { is_publish: checked });
                  message.success(
                    checked
                      ? "Flash sale berhasil diaktifkan"
                      : "Flash sale berhasil dinonaktifkan",
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
      title: "Produk",
      key: "products",
      width: 90,
      align: "center",
      render: (_: unknown, r) => (
        <Badge
          count={countProducts(r)}
          showZero
          color="#fa8c16"
          style={{ fontWeight: 500 }}
        />
      ),
    },
    {
      title: "Periode Flash Sale",
      key: "period",
      width: 240,
      render: (_: unknown, r) => {
        const s = formatDateTime(r.start_time ?? r.startDatetime ?? null);
        const e = formatDateTime(r.end_time ?? r.endDatetime ?? null);
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
      fixed: "right",
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
            <Tooltip title="Edit Flash Sale">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  if (!idNum) {
                    message.error("ID flash sale tidak tersedia.");
                    return;
                  }
                  window.location.href = `/flash-sales/edit/${idNum}`;
                }}
              />
            </Tooltip>

            <Tooltip title="Hapus Flash Sale">
              <Popconfirm
                placement="left"
                title="Hapus flash sale?"
                description="Flash sale yang dihapus tidak dapat dikembalikan."
                onConfirm={async () => {
                  if (!idNum) {
                    message.error("ID flash sale tidak tersedia.");
                    return;
                  }
                  try {
                    await deleteFlashSale(idNum);
                    message.success("Flash sale berhasil dihapus");
                    fetchList();
                  } catch (e: any) {
                    message.error(
                      e?.response?.data?.message ||
                        "Gagal menghapus flash sale",
                    );
                  }
                }}
                okText="Hapus"
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

  const getRowKey = (r: FlashSaleRow, index?: number) => {
    const idNum = toIdNum(r.id);
    if (idNum) return `flash-${idNum}-${index ?? 0}`;
    return `flash-row-${index ?? 0}`;
  };

  return (
    <div style={{ padding: "0" }}>
      <FlashSaleStatsCards stats={stats} />
      <FlashSaleFiltersCard
        params={params}
        setParams={setParams}
        pagination={pagination}
        onCreate={() => (window.location.href = "/flash-sales/new")}
      />

      <Card
        variant="borderless"
        style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table<FlashSaleRow>
          rowKey={getRowKey}
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={tablePagination}
          onChange={handleTableChange}
          expandable={{
            expandedRowRender: (record) => (
              <FlashSaleItemsTable sale={record} onRefresh={fetchList} />
            ),
            rowExpandable: () => true,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default TableFlashSale;
