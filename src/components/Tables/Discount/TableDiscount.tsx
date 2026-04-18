import React from "react";
import {
  Table,
  Button,
  Card,
  Popconfirm,
  Tag,
  message,
  Switch,
  Tooltip,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTableDiscount } from "../../../hooks/discount/useTableDiscount";
import type { DiscountRecord } from "../../../services/api/discount/discount.types";
import {
  resolveIdentifier,
  promoStatus,
  formatDateTime,
  toNumSafe,
  isAllProductsPromo,
  parseAllProductsInfo,
  formatRp,
} from "../../../utils/discount/table";
import DiscountFiltersCard from "./DiscountFiltersCard";
import DiscountStatsCards from "./DiscountStatsCards";
import DiscountVariantItemsTable from "./DiscountVariantItemsTable";
import DiscountTableStyles from "./DiscountTableStyles";

const TableDiscount: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const {
    params,
    setParams,
    pagination,
    loading,
    fetchList,
    handleTableChange,
    filteredData,
    toggleStatus,
    deleteDiscount,
  } = useTableDiscount();

  const getProductCount = (r: DiscountRecord) => {
    if (isAllProductsPromo(r)) return null;
    const items = r.variantItems ?? [];
    if (!items.length) return 0;
    const uniqProductIds = new Set<number>();
    for (const it of items) {
      const pid = toNumSafe(it.productId ?? it.product_id, 0);
      if (pid > 0) uniqProductIds.add(pid);
      const vpid = toNumSafe((it.variant as any)?.product_id, 0);
      if (vpid > 0) uniqProductIds.add(vpid);
    }
    return uniqProductIds.size;
  };

  const hideDetailForRecord = (r: DiscountRecord) => {
    if (isAllProductsPromo(r)) return true;
    const count = getProductCount(r);
    return typeof count === "number" && count >= 50;
  };

  const columns: ColumnsType<DiscountRecord> = [
    {
      title: "Informasi Promosi",
      key: "promo",
      width: 280,
      render: (_: unknown, r) => {
        const st = promoStatus(r);
        const isAllProducts = isAllProductsPromo(r);
        const allInfo = isAllProducts ? parseAllProductsInfo(r) : null;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tag
                color={st.color as any}
                style={{ margin: 0, fontWeight: 600, fontSize: 12 }}
              >
                {st.label}
              </Tag>
              {isAllProducts ? (
                <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>
                  Semua produk
                </Tag>
              ) : null}
              {toNumSafe(r.id, 0) > 0 && (
                <span style={{ fontSize: 11, color: token.colorTextDescription }}>
                  ID: {String(r.id)}
                </span>
              )}
            </div>

            <div>
              <span style={{ fontWeight: 600, fontSize: 15, display: "block" }}>
                {r.name ?? "-"}
              </span>
              <span
                style={{
                  fontSize: 12,
                  display: "block",
                  marginTop: 4,
                  color: token.colorTextDescription,
                }}
              >
                Kode: <code>{r.code ?? "-"}</code>
              </span>
              {isAllProducts ? (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: token.colorPrimary,
                    fontWeight: 600,
                  }}
                >
                  Diskon semua produk
                  {allInfo?.percent
                    ? ` ${allInfo.percent}%`
                    : ""}
                  {allInfo?.maxDiscount
                    ? ` · Maks ${formatRp(allInfo.maxDiscount)}`
                    : ""}
                </div>
              ) : null}
            </div>
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
        const isActive = Number(r.isActive) === 1;
        return (
          <Tooltip
            title={isActive ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
          >
            <Switch
              checked={isActive}
              checkedChildren="Aktif"
              unCheckedChildren="Nonaktif"
              onChange={() => toggleStatus(r)}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Tipe",
      key: "type",
      width: 100,
      align: "center",
      render: () => (
        <Tag color="blue" style={{ fontWeight: 600 }}>
          Diskon
        </Tag>
      ),
    },
    {
      title: "Jumlah Produk",
      key: "products",
      width: 120,
      align: "center",
        render: (_: unknown, r) => {
          if (isAllProductsPromo(r)) {
            return (
              <Tag color="purple" style={{ fontWeight: 600 }}>
                Semua produk
              </Tag>
            );
          }
          const count = getProductCount(r) ?? 0;
          if (!count)
            return (
              <span style={{ color: token.colorTextDescription, fontSize: 12 }}>0 produk</span>
            );
          return (
            <span
              style={{
                display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 22,
              height: 22,
              padding: "0 6px",
              borderRadius: 11,
              backgroundColor: count > 0 ? token.colorPrimary : token.colorFillAlter,
              color: token.colorTextLightSolid,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {count}
          </span>
        );
      },
    },
    {
      title: "Periode Promo",
      key: "period",
      width: 240,
      render: (_: unknown, r) => {
        const s = formatDateTime(r.startedAt);
        const e = r.expiredAt ? formatDateTime(r.expiredAt) : "Tanpa Batas";
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: token.colorTextDescription, fontSize: 11 }}>Mulai:</span>
              <span style={{ fontSize: 13 }}>{s}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: token.colorTextDescription, fontSize: 11 }}>Berakhir:</span>
              <span
                style={{
                  fontSize: 13,
                  color: r.expiredAt ? undefined : token.colorSuccess,
                }}
              >
                {e}
              </span>
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
        const identifier = resolveIdentifier(r);

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Tooltip title="Edit Promo">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  if (!identifier) {
                    message.error(
                      "Identifier diskon tidak tersedia (id/code kosong).",
                    );
                    return;
                  }
                  navigate(`/discounts/${encodeURIComponent(identifier)}`, {
                    state: r,
                  });
                }}
              />
            </Tooltip>

            <Tooltip title="Hapus Promo">
              <Popconfirm
                placement="left"
                title="Hapus promo ini?"
                description="Data yang dihapus tidak dapat dikembalikan"
                onConfirm={() => deleteDiscount(r)}
                okText="Ya, Hapus"
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
    <div style={{ padding: "0 0 24px" }}>
      <DiscountStatsCards
        total={pagination.total ?? 0}
        filteredData={filteredData}
      />
      <DiscountFiltersCard
        params={params}
        setParams={setParams}
        pagination={pagination}
        handleTableChange={handleTableChange}
        fetchList={fetchList}
        onCreate={() => navigate("/discounts/new")}
      />
      <Card
        style={{
          borderRadius: 12,
          boxShadow: token.boxShadowTertiary,
          border: `1px solid ${token.colorBorderSecondary}`,
          overflow: "hidden",
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table<DiscountRecord>
          columns={columns}
          rowKey="__key"
          dataSource={filteredData}
          pagination={{
            ...pagination,
            showSizeChanger: false,
            showTotal: (total, range) => (
              <span style={{ color: token.colorTextDescription, fontSize: 13 }}>
                Menampilkan {range[0]}-{range[1]} dari {total} promo
              </span>
            ),
            style: { marginTop: 16 },
          }}
          loading={loading}
          onChange={handleTableChange}
          expandable={{
            expandedRowRender: (record) => (
              <DiscountVariantItemsTable record={record} />
            ),
            rowExpandable: (record) => !hideDetailForRecord(record),
            expandIcon: ({ expanded, onExpand, record }) => (
              hideDetailForRecord(record) ? null : (
                <Tooltip title={expanded ? "Tutup Detail" : "Lihat Detail"}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(e) => onExpand(record, e)}
                    style={{
                      color: expanded ? token.colorPrimary : token.colorTextDescription,
                    }}
                  />
                </Tooltip>
              )
            ),
          }}
          scroll={{ x: 1200 }}
          bordered={false}
          locale={{
            emptyText: (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <div style={{ color: token.colorTextDescription }}>Belum ada data promo</div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/discounts/new")}
                  style={{ marginTop: 16, borderRadius: 6 }}
                >
                  Buat Promo Pertama
                </Button>
              </div>
            ),
          }}
          rowClassName={(_record, index) =>
            index % 2 === 0 ? "table-row-light" : "table-row-dark"
          }
        />
      </Card>

      <DiscountTableStyles />
    </div>
  );
};

export default TableDiscount;
