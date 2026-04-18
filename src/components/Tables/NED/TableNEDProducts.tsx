import React, { useState } from "react";
import {
  Table,
  Button,
  Card,
  Popconfirm,
  Space,
  Tooltip,
  Input,
  Form,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EditOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useTableNED } from "../../../hooks/promotions/useTableNED";
import FormNEDProduct from "../../Forms/NED/FormNEDProduct";
import { useSearchParams } from "react-router-dom";

const ColHeader = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <Space size={4}>
    {label}
    <Tooltip title={tooltip}>
      <QuestionCircleOutlined style={{ color: "#aaa", cursor: "help" }} />
    </Tooltip>
  </Space>
);

export interface NEDProductRecord {
  id: number;
  sku: string;
  name: string; // or product_name
  price: number;
  stock_jual: number;
  stock_free_gift: number;
  discount_percent: number;
}

const TableNEDProducts: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, pagination, fetchData, deleteItem } = useTableNED(
    "/admin/ned-products",
  );

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchText = searchParams.get("q") || "";

  const handleDelete = async (id: number) => {
    await deleteItem(id);
  };

  const filteredData = data.filter((item: any) => {
    const name = item.name || item.product_name || item.nama_produk || "";
    const sku = item.sku || "";
    return (
      name.toLowerCase().includes(searchText.toLowerCase()) ||
      sku.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const columns: ColumnsType<any> = [
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 150,
    },
    {
      title: "Product Name",
      key: "name",
      render: (_, record) =>
        record.namaProduk || record.nama_produk || record.name || "-",
    },
    {
      title: (
        <ColHeader
          label="Price (HET)"
          tooltip="Harga Eceran Tertinggi — harga jual resmi produk ini ke konsumen akhir."
        />
      ),
      dataIndex: "het",
      key: "het",
      width: 130,
      align: "right",
      render: (val, record) =>
        `Rp ${(val || record.price || 0).toLocaleString("id-ID")}`,
    },
    {
      title: (
        <ColHeader
          label="Discount %"
          tooltip="Persentase diskon yang diberikan kepada pelanggan saat membeli produk ini dalam program NED. 0% berarti tidak ada diskon (hanya free gift)."
        />
      ),
      dataIndex: "discountPercent",
      key: "discountPercent",
      width: 110,
      align: "center",
      render: (val, record) =>
        val || record.discount_percent
          ? `${val || record.discount_percent}%`
          : "-",
    },
    {
      title: (
        <ColHeader
          label="Stock Sales"
          tooltip="Jumlah stok produk yang tersedia untuk dijual melalui program NED. Stok berkurang saat transaksi berhasil dibayar."
        />
      ),
      dataIndex: "stockJual",
      key: "stockJual",
      width: 110,
      align: "center",
      render: (val, record) => val ?? record.stock_jual ?? 0,
    },
    {
      title: (
        <ColHeader
          label="Stock Gift"
          tooltip="Kuota total hadiah gratis yang tersedia. Berkurang setiap pelanggan berhasil mendapatkan hadiah NED. Perlu diisi ulang secara manual oleh admin."
        />
      ),
      dataIndex: "stockFreeGift",
      key: "stockFreeGift",
      width: 110,
      align: "center",
      render: (val, record) => {
        const stockVal = val ?? record.stock_free_gift ?? 0;
        return (
          <span style={{ color: stockVal <= 5 ? "#cf1322" : undefined, fontWeight: stockVal <= 5 ? 600 : undefined }}>
            {stockVal}
            {stockVal <= 5 && stockVal > 0 ? " ⚠️" : ""}
          </span>
        );
      },
    },
    {
      title: "#",
      key: "action",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete NED Product?"
              description="This will remove it from the NED Pool."
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const [form] = Form.useForm();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const handleCreate = () => {
    setEditingRecord(null);
    setFormModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormModalOpen(true);
  };

  const handleSuccess = () => {
    setFormModalOpen(false);
    setEditingRecord(null);
    fetchData();
  };

  return (
    <Card
      title="Master NED Products (Pool)"
      extra={!isMobile ? (
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Product
          </Button>
        </Space>
      ) : undefined}
    >
      {isMobile && (
        <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Product
          </Button>
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search items..."
          defaultValue={searchText}
          onSearch={(val) => {
            setSearchParams((prev) => {
              if (val.trim()) prev.set("q", val.trim());
              else prev.delete("q");
              prev.set("page", "1");
              return prev;
            });
          }}
          allowClear
        />
      </div>
      <div className="overflow-x-auto md:overflow-visible">
        <Table
          columns={[
            ...columns.slice(0, columns.length - 1), // All columns except action
            {
              title: "#",
              key: "action",
              width: 100,
              align: "center",
              render: (_, record) => (
                <Space size="small">
                  <Button
                    type="primary"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  />
                  <Tooltip title="Delete">
                    <Popconfirm
                      title="Delete NED Product?"
                      description="This will remove it from the NED Pool."
                      onConfirm={() => handleDelete(record.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="primary"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </Tooltip>
                </Space>
              ),
            },
          ]}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: pagination.total,
            onChange: (p, ps) => {
              setSearchParams((prev) => {
                prev.set("page", String(p));
                prev.set("per_page", String(ps));
                return prev;
              });
            },
          }}
          rowKey="id"
          size="small"
          scroll={{ x: "max-content" }}
        />
      </div>

      <FormNEDProduct
        form={form}
        open={formModalOpen}
        data={editingRecord}
        onSuccess={handleSuccess}
        onCancel={() => setFormModalOpen(false)}
      />
    </Card>
  );
};

export default TableNEDProducts;
