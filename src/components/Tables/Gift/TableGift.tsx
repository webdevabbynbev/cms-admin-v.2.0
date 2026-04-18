import React, { useState, useEffect } from "react";
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
  message,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import FormGift from "../../Forms/Gift/FormGift";
import type { GiftFormRecord } from "../../Forms/Gift/FormGift";
import { useTableGift } from "../../../hooks/promotions/useTableGift";
import type { GiftProductRecord } from "../../../hooks/promotions/useTableGift";
import { Form } from "antd";
import http from "../../../api/http";
import { useSearchParams } from "react-router-dom";
import useDebounce from "../../../hooks/useDebounce";

const TableGift: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, pagination, fetchData, deleteItem } = useTableGift();

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchText = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(searchText);
  const debouncedSearch = useDebounce(searchInput, 500);
  const isMounted = React.useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    setSearchParams((prev) => {
      if (debouncedSearch.trim()) prev.set("q", debouncedSearch.trim());
      else prev.delete("q");
      prev.set("page", "1");
      return prev;
    });
  }, [debouncedSearch]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<GiftFormRecord | null>(
    null,
  );
  const [form] = Form.useForm();

  const handleCreate = () => {
    setCurrentRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = async (record: GiftProductRecord) => {
    try {
      const response = await http.get(`/admin/gift-products/${record.id}`);
      const detail =
        response?.data?.data || response?.data?.serve || response?.data;

      if (detail) {
        setCurrentRecord(detail as GiftFormRecord);
        setIsModalOpen(true);
      } else {
        message.error("Failed to load gift product detail");
      }
    } catch (error) {
      message.error("Failed to load gift product detail");
      
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

  const columns: ColumnsType<GiftProductRecord> = [
    {
      title: "SKU",
      dataIndex: "sku",
      width: 200,
      key: "sku",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Variant",
      dataIndex: "variantName",
      key: "variantName",
    },
    {
      title: "Harga",
      dataIndex: "price",
      key: "price",
      render: (price: number) =>
        `Rp. ${new Intl.NumberFormat("id-ID").format(price || 0)}`,
    },
    {
      title: "Quantity",
      key: "quantity",
      width: 100,
      align: "center",
      render: (_, record) => record.giftStock ?? 0,
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      align: "center",
      render: (_, record) =>
        (record.isActive ?? record.is_active) ? (
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
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete Gift Product?"
              description="Are you sure you want to delete this product?"
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

  return (
    <>
      <Card
        title="Gift Products Master (untuk B1G1 Promo)"
        extra={!isMobile ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Gift Product
          </Button>
        ) : undefined}
      >
        {isMobile && (
          <div style={{ marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Add Gift Product
            </Button>
          </div>
        )}
        <Input
          placeholder="Search by name or SKU..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ marginBottom: 16 }}
          suffix={<span style={{ color: "#bbb" }}>🔍</span>}
          allowClear
          onClear={() => setSearchInput("")}
        />
        <div className="overflow-x-auto md:overflow-visible">
          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: false,
              onChange: (p) => {
                setSearchParams((prev) => {
                  prev.set("page", String(p));
                  return prev;
                });
              },
            }}
            rowKey="id"
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      <Modal
        title={currentRecord?.id ? "Edit Gift Product" : "Create Gift Product"}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={680}
        centered
        destroyOnClose
        styles={{ body: { maxHeight: "calc(85vh - 120px)", overflowY: "auto", overflowX: "hidden" } }}
      >
        <FormGift
          data={currentRecord}
          form={form}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </>
  );
};

export default TableGift;
