import React from "react";
import { Table, Button, Input, Card, Select, Modal, Switch, Popconfirm, Tooltip, Grid } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import FormReferralCode from "../../Forms/ReferralCode/FormReferralCode";
import BulkUploadReferralCode from "../../Forms/ReferralCode/BulkUploadReferralCode";
import type { ReferralCodeRecord } from "../../../services/api/referral/referral.types";
import { useReferralCodeTable } from "../../../hooks/referral/useReferralCodeTable";
import {
  formatDate,
  getActive,
  getPercent,
  getRemainingQty,
  getUsage,
} from "../../../utils/referral/format";

const TableReferralCode: React.FC = () => {
  const { Search } = Input;
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const {
    data,
    loading,
    total,
    page,
    pageSize,
    searchText,
    status,
    fetchList,
    handleTableChange,
    handleSearch,
    handlePageSizeChange,
    handleStatusChange,
    toggleStatus,
    removeOne,
    bulkUpdateStatus,
    bulkDelete,
  } = useReferralCodeTable();
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<ReferralCodeRecord | null>(null);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);

  const columns: ColumnsType<ReferralCodeRecord> = [
    {
      title: "Kode",
      dataIndex: "code",
      render: (value: unknown) => String(value ?? "-"),
    },
    {
      title: "Diskon",
      dataIndex: "discount_percent",
      render: (_: unknown, record) => `${getPercent(record)}%`,
    },
    {
      title: "Pemakaian",
      dataIndex: "usage_count",
      align: "center",
      width: 110,
      render: (_: unknown, record) => getUsage(record),
    },
    {
      title: "Sisa Qty",
      dataIndex: "remaining_uses_total",
      align: "center",
      width: 110,
      render: (_: unknown, record) => {
        const remaining = getRemainingQty(record);
        return remaining === null ? "-" : remaining;
      },
    },
    {
      title: "Status",
      dataIndex: "is_active",
      align: "center",
      width: 100,
      render: (_: unknown, record) => {
        const active = getActive(record);
        return (
          <Switch
            checked={active}
            checkedChildren="Aktif"
            unCheckedChildren="Nonaktif"
            onChange={async (checked) => {
              await toggleStatus(record.id, checked);
            }}
          />
        );
      },
    },
    {
      title: "Periode",
      dataIndex: "period",
      render: (_: unknown, record) => {
        const start = formatDate(record.startedAt ?? record.started_at);
        const end = formatDate(record.expiredAt ?? record.expired_at);
        return `${start} - ${end}`;
      },
    },
    {
      title: "#",
      width: "10%",
      align: "center",
      dataIndex: "action",
      render: (_: unknown, record) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Tooltip title="Edit Referral Code">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrent(record);
                setOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Delete Referral Code">
            <Popconfirm
              placement="left"
              title="Yakin ingin menghapus referral code?"
              onConfirm={async () => {
                await removeOne(record.id);
              }}
              okText="Ya"
              cancelText="Batal"
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ];

  const selectedIds = selectedRowKeys
    .map((key) => Number(key))
    .filter((v) => Number.isFinite(v));
  const hasSelection = selectedIds.length > 0;

  return (
    <>
      <Card style={{ marginTop: 10 }}>
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="flex align-center">
              <span style={{ fontSize: 12 }}>Show</span>
              <Select<number>
                style={{ width: 80, marginLeft: 10, marginRight: 10 }}
                value={pageSize}
                onChange={handlePageSizeChange}
                options={[
                  { value: 10, label: "10" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                  { value: 500, label: "500" },
                ]}
              />
              <span style={{ fontSize: 12 }}>entries</span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button
                disabled={!hasSelection}
                onClick={async () => {
                  const ok = await bulkUpdateStatus(selectedIds, 1);
                  if (ok) setSelectedRowKeys([]);
                }}
              >
                Aktifkan
              </Button>
              <Button
                disabled={!hasSelection}
                onClick={async () => {
                  const ok = await bulkUpdateStatus(selectedIds, 0);
                  if (ok) setSelectedRowKeys([]);
                }}
              >
                Nonaktifkan
              </Button>
              <Popconfirm
                placement="left"
                title={`Hapus ${selectedIds.length} referral code terpilih?`}
                onConfirm={async () => {
                  const ok = await bulkDelete(selectedIds);
                  if (ok) setSelectedRowKeys([]);
                }}
                okText="Ya"
                cancelText="Batal"
                disabled={!hasSelection}
              >
                <Button danger disabled={!hasSelection}>
                  Hapus
                </Button>
              </Popconfirm>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Select
                style={{ width: 120 }}
                value={status}
                onChange={handleStatusChange}
                options={[
                  { value: "all", label: "Semua" },
                  { value: "active", label: "Aktif" },
                  { value: "inactive", label: "Nonaktif" },
                ]}
              />

              <Search
                style={{ flex: 1 }}
                placeholder="Cari kode referral"
                defaultValue={searchText}
                onSearch={handleSearch}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => {
                  setCurrent(null);
                  setOpen(true);
                }}
                style={{ flex: 1 }}
              >
                Tambah
              </Button>
              <Button
                onClick={() => setBulkOpen(true)}
                style={{ flex: 1 }}
              >
                Bulk Upload
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-wrap"
            style={{ width: "100%", alignItems: "flex-end" }}
          >
            <div className="flex align-center">
              <span style={{ fontSize: 12 }}>Show</span>
              <Select<number>
                style={{ width: 80, marginLeft: 10, marginRight: 10 }}
                value={pageSize}
                onChange={handlePageSizeChange}
                options={[
                  { value: 10, label: "10" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                  { value: 500, label: "500" },
                ]}
              />
              <span style={{ fontSize: 12 }}>entries</span>
            </div>

            <div style={{ marginLeft: "auto" }} className="flex align-center">
              <Button
                disabled={!hasSelection}
                onClick={async () => {
                  const ok = await bulkUpdateStatus(selectedIds, 1);
                  if (ok) setSelectedRowKeys([]);
                }}
              >
                Aktifkan
              </Button>
              <Button
                disabled={!hasSelection}
                onClick={async () => {
                  const ok = await bulkUpdateStatus(selectedIds, 0);
                  if (ok) setSelectedRowKeys([]);
                }}
                style={{ marginLeft: 8 }}
              >
                Nonaktifkan
              </Button>
              <Popconfirm
                placement="left"
                title={`Hapus ${selectedIds.length} referral code terpilih?`}
                onConfirm={async () => {
                  const ok = await bulkDelete(selectedIds);
                  if (ok) setSelectedRowKeys([]);
                }}
                okText="Ya"
                cancelText="Batal"
                disabled={!hasSelection}
              >
                <Button danger disabled={!hasSelection} style={{ marginLeft: 8 }}>
                  Hapus
                </Button>
              </Popconfirm>

              <Select
                style={{ width: 140, marginRight: 10, marginLeft: 10 }}
                value={status}
                onChange={handleStatusChange}
                options={[
                  { value: "all", label: "Semua" },
                  { value: "active", label: "Aktif" },
                  { value: "inactive", label: "Nonaktif" },
                ]}
              />

              <Search
                placeholder="Cari kode referral"
                defaultValue={searchText}
                onSearch={handleSearch}
              />
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => {
                  setCurrent(null);
                  setOpen(true);
                }}
                style={{ marginLeft: 10 }}
              >
                Tambah
              </Button>
              <Button
                style={{ marginLeft: 10 }}
                onClick={() => setBulkOpen(true)}
              >
                Bulk Upload
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="overflow-x-auto md:overflow-visible">
        <Table<ReferralCodeRecord>
          style={{ marginTop: 10 }}
          columns={columns}
          rowKey={(record) => String(record.id)}
          dataSource={data}
          pagination={{
            current: page,
            pageSize: pageSize,
            total,
          }}
          loading={loading}
          onChange={handleTableChange}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        centered
        open={open}
        title={current ? "Edit Referral Code" : "Tambah Referral Code"}
        onCancel={() => {
          setOpen(false);
          setCurrent(null);
        }}
        footer={null}
        destroyOnClose
      >
        <FormReferralCode
          data={current ?? undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(null);
            fetchList();
          }}
        />
      </Modal>

      <BulkUploadReferralCode
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSuccess={() => fetchList()}
      />
    </>
  );
};

export default TableReferralCode;
