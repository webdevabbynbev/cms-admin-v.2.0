import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Select,
  Tag,
  Tooltip,
  Switch,
  message,
  Row,
  Col,
  Space,
  Typography,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import moment from "moment";
import {
  deleteVoucher,
  updateVoucherStatus,
  updateVoucherVisibility,
} from "../../../api/voucher";
import helper from "../../../utils/helper";
import { dateSorter, numberSorter, stringSorter } from "../../../utils/tableSorters";
import {
  useTableVoucherHooks,
  type VoucherRecord,
} from "../../../hooks/voucher";
import { useBulkSelection } from "../../../hooks/useBulkSelection";
import { ConfirmDeleteModal } from "../../ConfirmDeleteModal";

type ColumnsCtx = {
  fetch: () => void;
  navigate: ReturnType<typeof useTableVoucherHooks>["navigate"];
  total: number;
  onDeleteOne: (record: VoucherRecord) => void;
};

type VoucherRow = VoucherRecord & { row_no: number };

const renderScopeLabel = (record: VoucherRecord) => {
  const scopeType = Number(record.scopeType ?? 0);
  const count = Array.isArray(record.scopeIds) ? record.scopeIds.length : 0;
  if (scopeType === 1) return `Brand (${count})`;
  if (scopeType === 2) return `Produk (${count})`;
  if (scopeType === 3) return `Variant (${count})`;
  return "Semua Produk";
};

const columns = (props: ColumnsCtx): ColumnsType<VoucherRow> => [
  {
    title: "No",
    dataIndex: "row_no",
    width: 80,
    sorter: numberSorter<VoucherRow>("row_no"),
  },
  {
    title: "Nama Voucher",
    dataIndex: "name",
    sorter: stringSorter<VoucherRecord>("name"),
  },
  {
    title: "Kode",
    dataIndex: "code",
    sorter: stringSorter<VoucherRecord>("code"),
  },
  {
    title: "Harga Diskon",
    dataIndex: "price",
    sorter: (a, b) =>
      numberSorter<VoucherRecord>("price")(a, b) ||
      numberSorter<VoucherRecord>("percentage")(a, b) ||
      numberSorter<VoucherRecord>("maxDiscPrice")(a, b),
    render: (_: unknown, record) =>
      record.isPercentage === 1
        ? `${record.percentage ?? 0}% (max: Rp.${helper.formatRupiah(
            String(record.maxDiscPrice ?? 0),
          )})`
        : `Rp.${helper.formatRupiah(String(record.price ?? 0))}`,
  },
  {
    title: "Min. Pembelian",
    dataIndex: "min_purchase_amount",
    sorter: numberSorter<VoucherRecord>("min_purchase_amount"),
    render: (_: unknown, record) =>
      record.min_purchase_amount == null
        ? "-"
        : `Rp.${helper.formatRupiah(String(record.min_purchase_amount ?? 0))}`,
  },
  {
    title: "Nama Hadiah",
    dataIndex: "gift_product_name",
    sorter: stringSorter<VoucherRecord>("gift_product_name"),
    render: (_: unknown, record) => record.gift_product_name || "-",
  },
  {
    title: "Status",
    dataIndex: "status",
    align: "center",
    width: 100,
    sorter: numberSorter<VoucherRecord>("isActive"),
    render: (_: unknown, record) => (
      <Switch
        checked={record.isActive === 1}
        checkedChildren="Aktif"
        unCheckedChildren="Nonaktif"
        onChange={async (checked) => {
          try {
            await updateVoucherStatus(record.id, checked ? 1 : 2);
            message.success(
              checked ? "Voucher diaktifkan" : "Voucher dinonaktifkan",
            );
            props.fetch();
          } catch (error: any) {
            message.error(
              error?.response?.data?.message ?? "Gagal mengubah status",
            );
          }
        }}
      />
    ),
  },
  {
    title: (
      <Tooltip title="Jika aktif, voucher akan ditampilkan di sisi user (halaman checkout)">
        <span style={{ cursor: "help", borderBottom: "1px dashed #999" }}>
          Tampilkan
        </span>
      </Tooltip>
    ),
    dataIndex: "isVisible",
    align: "center",
    width: 110,
    sorter: (a: VoucherRow, b: VoucherRow) =>
      Number(a.isVisible ?? true) - Number(b.isVisible ?? true),
    render: (_: unknown, record) => (
      <Switch
        checked={record.isVisible !== false}
        checkedChildren="Ya"
        unCheckedChildren="Tidak"
        onChange={async (checked) => {
          try {
            await updateVoucherVisibility(record.id, checked);
            message.success(
              checked
                ? "Voucher ditampilkan di sisi user"
                : "Voucher disembunyikan dari user",
            );
            props.fetch();
          } catch (error: any) {
            message.error(
              error?.response?.data?.message ?? "Gagal mengubah visibilitas",
            );
          }
        }}
      />
    ),
  },
  {
    title: "Kuota Voucher",
    dataIndex: "qty",
    sorter: numberSorter<VoucherRecord>("qty"),
  },
  {
    title: "Kuota Terpakai",
    dataIndex: "usedCount",
    width: 110,
    sorter: numberSorter<VoucherRecord>("usedCount"),
    render: (_: unknown, record) => Number(record.usedCount ?? 0),
  },
  {
    title: "Kuota Tersisa",
    dataIndex: "qty",
    width: 110,
    sorter: (a, b) =>
      (Number(a.qty ?? 0) - Number(a.usedCount ?? 0)) -
      (Number(b.qty ?? 0) - Number(b.usedCount ?? 0)),
    render: (_: unknown, record) =>
      Number(record.qty ?? 0) - Number(record.usedCount ?? 0),
  },
  {
    title: "Type",
    dataIndex: "type",
    sorter: (a, b) =>
      numberSorter<VoucherRecord>("reward_type")(a, b) ||
      numberSorter<VoucherRecord>("type")(a, b),
    render: (_: unknown, record) => {
      if (Number(record.reward_type ?? 1) === 2 || record.type === 3) {
        return <Tag color="orange">Product</Tag>;
      }
      return record.type === 1 ? (
        <Tag color="green">Discount</Tag>
      ) : (
        <Tag color="blue">Shipping</Tag>
      );
    },
  },
  {
    title: "Berlaku Untuk",
    dataIndex: "scopeType",
    sorter: numberSorter<VoucherRecord>("scopeType"),
    render: (_: unknown, record) => (
      <Tag color="purple">{renderScopeLabel(record)}</Tag>
    ),
  },
  {
    title: "Started Date",
    dataIndex: "startedAt",
    sorter: dateSorter<VoucherRecord>("startedAt"),
    render: (_: unknown, record) =>
      record.startedAt ? moment(record.startedAt).format("DD MMM YYYY") : "-",
  },
  {
    title: "Expired Date",
    dataIndex: "expiredAt",
    sorter: dateSorter<VoucherRecord>("expiredAt"),
    render: (_: unknown, record) =>
      record.expiredAt ? moment(record.expiredAt).format("DD MMM YYYY") : "-",
  },
  {
    title: "#",
    width: "7%",
    align: "center",
    dataIndex: "action",
    fixed: "right",
    render: (_: unknown, record) => (
      <Space size={10} align="center">
        <Tooltip title="Edit Voucher">
          <Button
            type="primary"
            key="/edit"
            icon={<EditOutlined />}
            onClick={() => {
              props.navigate(`/voucher/edit/${record.id}`, {
                state: { voucher: record },
              });
            }}
          />
        </Tooltip>

        <Tooltip title="Delete Voucher">
          <Button
            danger
            key="/delete"
            icon={<DeleteOutlined />}
            onClick={() => props.onDeleteOne(record)}
          />
        </Tooltip>
      </Space>
    ),
  },
];

const TableVoucher: React.FC = () => {
  const {
    data,
    loading,
    total,
    page,
    pageSize,
    searchText,
    voucherTypeFilter,
    navigate,
    fetchList,
    handleTableChange,
    handleSearch,
    handlePageSizeChange,
    handleVoucherTypeFilter,
  } = useTableVoucherHooks();

  const { Search } = Input;
  const { rowSelection, selectedRowKeys, hasSelection, resetSelection } =
    useBulkSelection<VoucherRow>();
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<React.Key[]>([]);

  const handleDeleteSelected = async () => {
    if (!pendingDeleteIds.length) return;

    try {
      setBulkDeleting(true);
      const results = await Promise.allSettled(
        pendingDeleteIds.map(async (id) => deleteVoucher(String(id))),
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        message.success(`${successCount} voucher berhasil dihapus.`);
      }
      if (failedCount > 0) {
        message.error(`${failedCount} voucher gagal dihapus.`);
      }

      setDeleteModalOpen(false);
      setPendingDeleteIds([]);
      resetSelection();
      fetchList();
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteOne = (record: VoucherRecord) => {
    setPendingDeleteIds([String(record.id)]);
    setDeleteModalOpen(true);
  };
  const dataWithRowNo: VoucherRow[] = React.useMemo(
    () =>
      data.map((item, index) => ({
        ...item,
        row_no: Math.max(total - index, 0),
      })),
    [data, total],
  );

  return (
    <>
      <Card style={{ marginTop: 10 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col>
            <Space align="center">
              <Typography.Text type="secondary">Show</Typography.Text>
              <Select<number>
                style={{ width: 80 }}
                value={pageSize}
                onChange={handlePageSizeChange}
                options={[
                  { value: 10, label: "10" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                  { value: 500, label: "500" },
                ]}
              />
              <Typography.Text type="secondary">entries</Typography.Text>
            </Space>
          </Col>

          <Col flex="auto">
            <Row gutter={[8, 8]} justify="end">
              <Col xs={24} md={14} lg={10}>
                <Search
                  placeholder="Search Voucher"
                  allowClear
                  defaultValue={searchText}
                  onSearch={handleSearch}
                />
              </Col>
              <Col xs={24} md={8} lg={6}>
                <Select<string>
                  style={{ width: "100%" }}
                  value={voucherTypeFilter}
                  onChange={handleVoucherTypeFilter}
                  options={[
                    { value: "all", label: "All" },
                    { value: "discount", label: "Discount" },
                    { value: "shipping", label: "Shipping" },
                    { value: "product", label: "Product" },
                  ]}
                />
              </Col>
              <Col>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={!hasSelection}
                  onClick={() => {
                    setPendingDeleteIds([...selectedRowKeys]);
                    setDeleteModalOpen(true);
                  }}
                >
                  Delete selected
                </Button>
              </Col>
              <Col>
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={() => navigate("/voucher/new")}
                >
                  Create new
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <div className="overflow-x-auto md:overflow-visible">
        <Table<VoucherRow>
          style={{ marginTop: 10 }}
          columns={columns({
            fetch: () => fetchList(),
            navigate,
            total,
            onDeleteOne: handleDeleteOne,
          })}
          sortDirections={["ascend", "descend", "ascend"]}
          rowKey={(record) => String(record.id)}
          dataSource={dataWithRowNo}
          rowSelection={rowSelection}
          pagination={{
            current: page,
            pageSize: pageSize,
            total,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Belum ada voucher"
              />
            ),
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: "max-content" }}
        />
      </div>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        loading={bulkDeleting}
        count={pendingDeleteIds.length}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPendingDeleteIds([]);
        }}
        onConfirm={handleDeleteSelected}
      />
    </>
  );
};

export default TableVoucher;
