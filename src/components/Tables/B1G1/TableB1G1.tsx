import React, { useEffect, useState } from "react";
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
import FormB1G1 from "../../Forms/B1G1/FormB1G1";
import type { B1G1FormRecord } from "../../Forms/B1G1/FormB1G1";
import { useTableB1G1 } from "../../../hooks/promotions/useTableB1G1";
import type { B1G1PromoRecord } from "../../../hooks/promotions/useTableB1G1";
import { Form } from "antd";
import http from "../../../api/http";
import { useSearchParams } from "react-router-dom";

const TableB1G1: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, total, fetchData, deleteItem } = useTableB1G1();

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchText = searchParams.get("q") || "";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<B1G1FormRecord | null>(
    null,
  );
  const [form] = Form.useForm();
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setCurrentRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = async (record: B1G1PromoRecord) => {
    try {
      setLoadingDetail(true);
      // Fetch detail supaya items ter-load
      const res = await http.get(`/admin/buy-one-get-one/${record.id}`);
      const detail = res?.data?.serve || res?.data;
      setCurrentRecord(detail as B1G1FormRecord);
      setIsModalOpen(true);
    } catch (error) {
      
      message.error("Gagal memuat detail promo");
    } finally {
      setLoadingDetail(false);
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

  const filteredData = data.filter((item) => {
    const name = (item.name || "").toLowerCase();
    const code = (item.code || "").toLowerCase();
    const s = searchText.toLowerCase();
    return name.includes(s) || code.includes(s);
  });

  const columns: ColumnsType<B1G1PromoRecord> = [
    {
      title: "Kode",
      dataIndex: "code",
      width: 140,
      key: "code",
    },
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Apply To",
      key: "applyTo",
      width: 100,
      render: (_, record) => {
        const val = record.applyTo || "all";
        const colorMap: Record<string, string> = {
          all: "purple",
          brand: "cyan",
          variant: "geekblue",
        };
        return (
          <Tag color={colorMap[val] || "default"}>{val.toUpperCase()}</Tag>
        );
      },
    },
    {
      title: "Mulai",
      key: "startedAt",
      width: 110,
      render: (_, record) => {
        const d = record.startedAt;
        return d ? new Date(d).toLocaleDateString("id-ID") : "-";
      },
    },
    {
      title: "Berakhir",
      key: "expiredAt",
      width: 110,
      render: (_, record) => {
        const d = record.expiredAt;
        return d ? new Date(d).toLocaleDateString("id-ID") : "-";
      },
    },
    {
      title: "Kuota",
      key: "usage",
      width: 100,
      render: (_, record) =>
        `${record.usageCount || 0}/${record.usageLimit || "∞"}`,
    },
    {
      title: "Status",
      key: "status",
      width: 180,
      render: (_, record) => (
        <Space>
          {record.isActive && <Tag color="green">Active</Tag>}
          {!record.isActive && <Tag color="red">Inactive</Tag>}
          {record.isEcommerce && <Tag color="blue">E-Com</Tag>}
          {record.isPos && <Tag color="orange">POS</Tag>}
        </Space>
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
              loading={loadingDetail}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Hapus Promo B1G1?"
              description="Yakin ingin menghapus promo ini?"
              onConfirm={() => handleDelete(record.id)}
              okText="Ya"
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
        title="B1G1 Promotions"
        extra={!isMobile ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tambah Baru
          </Button>
        ) : undefined}
      >
        {isMobile && (
          <div style={{ marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tambah Baru
            </Button>
          </div>
        )}
        <Input.Search
          placeholder="Cari berdasarkan kode atau nama..."
          defaultValue={searchText}
          onSearch={(val) => {
            setSearchParams((prev) => {
              if (val.trim()) prev.set("q", val.trim());
              else prev.delete("q");
              prev.set("page", "1");
              return prev;
            });
          }}
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
              total: total,
              onChange: (p, ps) => {
                setSearchParams((prev) => {
                  prev.set("page", String(p));
                  prev.set("per_page", String(ps));
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
        title={currentRecord?.id ? "Edit Promo B1G1" : "Buat Promo B1G1"}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={800}
        destroyOnClose
      >
        <FormB1G1
          data={currentRecord}
          form={form}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </>
  );
};

export default TableB1G1;
