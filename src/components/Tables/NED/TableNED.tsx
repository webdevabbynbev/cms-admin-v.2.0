import React, { useState } from "react";
import {
  Table,
  Button,
  Card,
  Popconfirm,
  Modal,
  Space,
  Tooltip,
  Tag,
  Input,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import FormNED from "../../Forms/NED/FormNED";
import type { NEDFormRecord } from "../../Forms/NED/FormNED";
import { useTableNED } from "../../../hooks/promotions/useTableNED";
import type { NEDProductRecord } from "../../../hooks/promotions/useTableNED";
import { Form } from "antd";
import { useSearchParams } from "react-router-dom";
import http from "../../../api/http";
import { message } from "antd";


const withTooltip = (title: string, label: string) => (
  <Space size={4}>
    {label}
    <Tooltip title={title}>
      <QuestionCircleOutlined style={{ color: "#aaa", cursor: "help" }} />
    </Tooltip>
  </Space>
);

const TableNED: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, pagination, fetchData, deleteItem } =
    useTableNED("/admin/ned");

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchText = searchParams.get("q") || "";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<NEDFormRecord | null>(
    null,
  );
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = () => {
    setCurrentRecord(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, is_visible_ecommerce: true, is_visible_pos: false });
    setIsModalOpen(true);
  };

  /**
   * PERBAIKAN HISTORY: Fetch detail lengkap dari API saat klik edit
   * agar semua field (termasuk is_visible_ecommerce, is_visible_pos) terpopulate
   * dari nilai yang sudah disimpan sebelumnya.
   */
  const handleEdit = async (record: NEDProductRecord) => {
    setLoadingEdit(true);
    setIsModalOpen(true);
    try {
      const response = await http.get(`/admin/ned/${record.id}`);
      const detail =
        response?.data?.serve?.data ||
        response?.data?.data?.serve ||
        response?.data?.serve ||
        response?.data?.data ||
        response?.data ||
        record;
      setCurrentRecord(detail as NEDFormRecord);
    } catch (error) {
      
      message.warning("Gagal memuat detail, menggunakan data dari list");
      // Fallback: gunakan data dari list
      setCurrentRecord(record as NEDFormRecord);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteItem(id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentRecord(null);
    form.resetFields();
  };

  const handleFormSuccess = () => {
    handleModalClose();
    fetchData();
  };

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchText.toLowerCase())),
  );

  const columns: ColumnsType<NEDProductRecord> = [
    {
      title: "SKU",
      dataIndex: "sku",
      width: 120,
      key: "sku",
    },
    {
      title: "Nama Kampanye",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Deskripsi",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: withTooltip(
        "Harga referensi kampanye NED ini (opsional, dapat diisi sebagai harga bundling).",
        "Price"
      ),
      dataIndex: "price",
      key: "price",
      width: 130,
      align: "right",
      render: (price) => `Rp ${price?.toLocaleString("id-ID") || 0}`,
    },
    {
      title: withTooltip(
        "Kuota maksimum penggunaan kampanye NED ini (opsional).",
        "Quantity"
      ),
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center",
      render: (val) => val ?? "-",
    },
    {
      title: withTooltip(
        "Jika aktif, kampanye ini akan terlihat dan berlaku di website/e-commerce.",
        "E-Commerce"
      ),
      dataIndex: "is_visible_ecommerce",
      key: "is_visible_ecommerce",
      width: 120,
      align: "center",
      render: (val) =>
        val ? (
          <Tooltip title="Tampil di E-Commerce">
            <Tag icon={<GlobalOutlined />} color="blue">
              Ya
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="default">Tidak</Tag>
        ),
    },
    {
      title: withTooltip(
        "Jika aktif, kampanye ini akan berlaku di aplikasi kasir (Point of Sale).",
        "POS"
      ),
      dataIndex: "is_visible_pos",
      key: "is_visible_pos",
      width: 100,
      align: "center",
      render: (val) =>
        val ? (
          <Tooltip title="Tampil di POS">
            <Tag icon={<ShopOutlined />} color="purple">
              Ya
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="default">Tidak</Tag>
        ),
    },
    {
      title: withTooltip(
        "Active: kampanye sedang berjalan. Inactive: kampanye dinonaktifkan.",
        "Status"
      ),
      key: "status",
      width: 110,
      align: "center",
      render: (_, record) =>
        record.is_active ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "#",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={loadingEdit ? "Memuat data..." : "Edit kampanye"}>
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              loading={loadingEdit}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Hapus kampanye">
            <Popconfirm
              title="Hapus Kampanye NED?"
              description="Yakin ingin menghapus kampanye ini? Aksi tidak bisa dibatalkan."
              onConfirm={() => handleDelete(record.id)}
              okText="Ya, Hapus"
              cancelText="Batal"
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

  return (
    <>
      <Card
        title="NED Campaigns (Near Expired Date)"
        extra={!isMobile ? (
          <Tooltip title="Buat kampanye NED baru">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Add New
            </Button>
          </Tooltip>
        ) : undefined}
      >
        {isMobile && (
          <div style={{ marginBottom: 12 }}>
            <Tooltip title="Buat kampanye NED baru">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Add New
              </Button>
            </Tooltip>
          </div>
        )}
        <Input.Search
          placeholder="Cari kampanye berdasarkan nama atau SKU..."
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
          style={{ marginBottom: 16 }}
        />
        <div className="overflow-x-auto md:overflow-visible">
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} kampanye`,
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
      </Card>

      <Modal
        title={currentRecord?.id ? "Edit Kampanye NED" : "Buat Kampanye NED Baru"}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={720}
      >
        <FormNED
          data={currentRecord}
          form={form}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </>
  );
};

export default TableNED;
