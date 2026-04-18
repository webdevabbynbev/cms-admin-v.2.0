import React from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ControlOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useBulkSelection } from "../../../../hooks/useBulkSelection";
import { ConfirmDeleteModal } from "../../../ConfirmDeleteModal";

type PreviewRow = {
  key: string;
  price: number;
  name: string;
  stock?: number;
};

type VoucherDiscountTabProps = {
  typeDisc: number;
  setTypeDisc: (value: number) => void;
  onMaxDiscChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  qtyMode: "unlimited" | "limited";
  onQtyModeChange: (value: "unlimited" | "limited") => void;
  unlimitedQty: number;
  sectionTextStyle: React.CSSProperties;
  limitPerCustomer: boolean;
  perUserLimitValue: number | string | null | undefined;
  onLimitPerCustomerToggle: (checked: boolean) => void;
  timeLimitEnabled: boolean;
  onTimeLimitToggle: (checked: boolean) => void;
  palette: {
    primary700: string;
    success600: string;
  };
  sectionCardStyle: React.CSSProperties;
  sectionTitleStyle: React.CSSProperties;
  scopeType: number;
  scopeAll: number;
  scopeBrand: number;
  scopeProduct: number;
  scopeVariant: number;
  onScopeTypeChange: (value: number) => void;
  onScopeIdsChange: (values: unknown) => void;
  onScopeSearch: (keyword: string) => void;
  onScopeFocus: () => void;
  onScopeOpenChange: (open: boolean) => void;
  scopeLoading: boolean;
  scopeNotFoundContent: React.ReactNode;
  scopePlaceholder: string;
  scopeOptions: Array<{ value: number; label: string }>;
  normalizeScopeIds: (raw: unknown) => number[];
  isScopeInvalid: boolean;
  previewLoading: boolean;
  onAddSelected: () => void;
  previewRows: PreviewRow[];
  pagedPreviewRows: PreviewRow[];
  previewPage: number;
  previewPageSize: number;
  setPreviewPage: (value: number) => void;
  setPreviewPageSize: (value: number) => void;
  formatMoney: (value: number) => string;
  resolveDiscount: (basePrice: number) => { after: number; label: string };
  onRemovePreview: (key: string) => void;
  stackWithOtherPromo: boolean;
  setStackWithOtherPromo: (checked: boolean) => void;
  stackWithOtherVoucher: boolean;
  setStackWithOtherVoucher: (checked: boolean) => void;
};

const VoucherDiscountTab: React.FC<VoucherDiscountTabProps> = ({
  typeDisc,
  setTypeDisc,
  onMaxDiscChange,
  onPriceChange,
  qtyMode,
  onQtyModeChange,
  unlimitedQty,
  sectionTextStyle,
  limitPerCustomer,
  perUserLimitValue,
  onLimitPerCustomerToggle,
  timeLimitEnabled,
  onTimeLimitToggle,
  palette,
  sectionCardStyle,
  sectionTitleStyle,
  scopeType,
  scopeAll,
  scopeBrand,
  scopeProduct,
  scopeVariant,
  onScopeTypeChange,
  onScopeIdsChange,
  onScopeSearch,
  onScopeFocus,
  onScopeOpenChange,
  scopeLoading,
  scopeNotFoundContent,
  scopePlaceholder,
  scopeOptions,
  normalizeScopeIds,
  isScopeInvalid,
  previewLoading,
  onAddSelected,
  previewRows,
  pagedPreviewRows,
  previewPage,
  previewPageSize,
  setPreviewPage,
  setPreviewPageSize,
  formatMoney,
  resolveDiscount,
  onRemovePreview,
  stackWithOtherPromo,
  setStackWithOtherPromo,
  stackWithOtherVoucher,
  setStackWithOtherVoucher,
}) => {
  const {
    rowSelection: previewRowSelection,
    selectedRowKeys: selectedPreviewKeys,
    hasSelection: hasPreviewSelection,
    resetSelection: resetPreviewSelection,
  } = useBulkSelection<PreviewRow>();
  const [deletePreviewModalOpen, setDeletePreviewModalOpen] = React.useState(false);
  const [pendingDeletePreviewKeys, setPendingDeletePreviewKeys] = React.useState<React.Key[]>(
    [],
  );

  const openDeletePreviewModal = () => {
    if (!previewRows.length || !hasPreviewSelection) return;
    const keysToDelete = [...selectedPreviewKeys];
    setPendingDeletePreviewKeys(keysToDelete);
    setDeletePreviewModalOpen(true);
  };

  const handleDeleteOnePreview = (key: string) => {
    setPendingDeletePreviewKeys([key]);
    setDeletePreviewModalOpen(true);
  };

  const handleConfirmDeletePreview = () => {
    if (!pendingDeletePreviewKeys.length) {
      setDeletePreviewModalOpen(false);
      return;
    }

    const keySet = new Set(pendingDeletePreviewKeys.map((key) => String(key)));
    previewRows
      .filter((row) => keySet.has(String(row.key)))
      .forEach((row) => onRemovePreview(row.key));

    resetPreviewSelection();
    setDeletePreviewModalOpen(false);
    setPendingDeletePreviewKeys([]);
  };

  return (
    <>
      <Form.Item label="Is the discount a percentage?" name="is_percentage">
        <Radio.Group
          buttonStyle="solid"
          onChange={(e) => setTypeDisc(e.target.value)}
        >
          <Radio.Button value={1}>Yes</Radio.Button>
          <Radio.Button value={2}>No</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Card
        size="small"
        style={sectionCardStyle}
        title={
          <Space size={8}>
            <ControlOutlined />
            <Typography.Text strong style={{ color: sectionTitleStyle.color }}>
              Atur Diskon
            </Typography.Text>
          </Space>
        }
      >
        {typeDisc === 1 ? (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Diskon (%)"
                name="percentage"
                rules={[{ required: true, message: "Percentage required" }]}
              >
                <Input type="number" suffix="%" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Maksimum Potongan"
                name="max_disc_price"
                rules={[{ required: true, message: "Max disc price required" }]}
              >
                <Input
                  prefix="Rp"
                  onChange={(e) => onMaxDiscChange(e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>
        ) : (
          <Form.Item
            label="Harga Potongan"
            name="price"
            rules={[{ required: true, message: "Price required" }]}
          >
            <Input prefix="Rp" onChange={(e) => onPriceChange(e.target.value)} />
          </Form.Item>
        )}
        <Alert
          type="info"
          showIcon
          message="Isi sesuai tipe diskon. Untuk diskon persentase, maksimum potongan wajib diisi."
          style={{ marginTop: 8 }}
        />
      </Card>

      <Card
        size="small"
        style={sectionCardStyle}
        title={
          <Space size={8}>
            <SafetyCertificateOutlined />
            <Typography.Text strong style={{ color: sectionTitleStyle.color }}>
              Batas Penggunaan Voucher
            </Typography.Text>
          </Space>
        }
      >
        <Form.Item label="Total voucher yang yang tersedia" required>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={qtyMode}
            onChange={(e) => onQtyModeChange(e.target.value)}
          >
            <Radio.Button value="unlimited">Tidak terbatas</Radio.Button>
            <Radio.Button value="limited">Tentukan Batas</Radio.Button>
          </Radio.Group>

          <Form.Item
            name="qty"
            rules={[{ required: true, message: "Qty required" }]}
            hidden={qtyMode === "unlimited"}
            style={{ marginTop: 12, marginBottom: 0 }}
          >
            <Input type="number" min={0} />
          </Form.Item>

          {qtyMode === "unlimited" ? (
            <Typography.Text type="secondary" style={sectionTextStyle}>
              Disimpan sebagai qty {unlimitedQty}
            </Typography.Text>
          ) : null}
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Row gutter={[12, 12]} align="top" justify="space-between">
              <Col flex="auto">
                <Space direction="vertical" size={2}>
                  <Typography.Text strong style={sectionTextStyle}>
                    <Space size={6}>
                      <UserOutlined style={{ color: palette.primary700 }} />
                      <Typography.Text>Batas Penggunaan Voucher per Pelanggan</Typography.Text>
                    </Space>
                  </Typography.Text>
                  <Typography.Text type="secondary" style={sectionTextStyle}>
                    {limitPerCustomer
                      ? `maksimum ${Number(perUserLimitValue || 1)} kali per pelanggan`
                      : "tidak dibatasi per pelanggan"}
                  </Typography.Text>
                </Space>
              </Col>
              <Col flex="none">
                <Switch
                  checked={limitPerCustomer}
                  onChange={onLimitPerCustomerToggle}
                />
              </Col>
            </Row>
            {limitPerCustomer ? (
              <Form.Item
                label="Total batas per pelanggan"
                name="per_user_limit"
                rules={[
                  {
                    required: limitPerCustomer,
                    message: "Batas per pelanggan wajib diisi",
                  },
                ]}
                style={{ marginTop: 12, marginBottom: 0 }}
              >
                <Input type="number" min={1} placeholder="Contoh: 1" />
              </Form.Item>
            ) : null}
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={[12, 12]} align="top" justify="space-between">
              <Col flex="auto">
                <Space direction="vertical" size={2}>
                  <Typography.Text strong style={sectionTextStyle}>
                    <Space size={6}>
                      <ClockCircleOutlined
                        style={{ color: palette.primary700 }}
                      />
                      <Typography.Text>Pengaturan Batas Waktu</Typography.Text>
                    </Space>
                  </Typography.Text>
                  <Typography.Text type="secondary" style={sectionTextStyle}>
                    Terapkan batas waktu untuk menggunakan promosi ini
                  </Typography.Text>
                </Space>
              </Col>
              <Col flex="none">
                <Switch
                  checked={timeLimitEnabled}
                  onChange={onTimeLimitToggle}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: "Type required" }]}
          >
            <Select
              options={[
                { value: 1, label: "AMOUNT" },
                { value: 2, label: "SHIPPING" },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Status" name="is_active">
            <Radio.Group buttonStyle="solid">
              <Radio.Button value={1}>
                <Space size={6}>
                  <CheckCircleOutlined style={{ color: palette.success600 }} />
                  Active
                </Space>
              </Radio.Button>
              <Radio.Button value={2}>Inactive</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>

      <Card
        size="small"
        style={sectionCardStyle}
        title={
          <Space size={8}>
            <InfoCircleOutlined />
            <Typography.Text strong style={{ color: sectionTitleStyle.color }}>
              Input Voucher Berlaku Untuk
            </Typography.Text>
          </Space>
        }
      >
        <Form.Item name="scope_type" label="Voucher berlaku untuk">
          <Radio.Group
            buttonStyle="solid"
            onChange={(e) =>
              onScopeTypeChange(Number(e?.target?.value ?? scopeAll))
            }
            value={scopeType}
          >
            <Radio.Button value={scopeBrand}>Brand</Radio.Button>
            <Radio.Button value={scopeVariant}>Variant</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {scopeType !== scopeAll ? (
          <Form.Item
            label="Target Brand / Produk / Variant"
            name="scope_ids"
            rules={[
              {
                validator: async (_, value) => {
                  const ids = normalizeScopeIds(value);
                  if (scopeType === scopeAll || ids.length > 0) return;
                  throw new Error("Pilih minimal 1 target scope");
                },
              },
            ]}
          >
            <Select
              mode="multiple"
              showSearch
              filterOption={false}
              loading={scopeLoading}
              notFoundContent={scopeNotFoundContent}
              placeholder={scopePlaceholder}
              options={scopeOptions}
              onChange={onScopeIdsChange}
              onSearch={onScopeSearch}
              onFocus={onScopeFocus}
              onOpenChange={onScopeOpenChange}
              allowClear
            />
          </Form.Item>
        ) : null}

        {scopeType !== scopeAll ? (
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Space>
              <Button
                type="primary"
                onClick={onAddSelected}
                disabled={isScopeInvalid}
                loading={previewLoading}
              >
                Tambahkan yang dipilih
              </Button>
              <Typography.Text type="secondary">
                Preview harga tersedia untuk Brand, Produk, dan Variant.
              </Typography.Text>
            </Space>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={openDeletePreviewModal}
              disabled={!hasPreviewSelection}
            >
              Hapus
            </Button>
          </div>
        ) : null}

        {previewRows.length > 0 ? (
          <Table<PreviewRow>
            dataSource={pagedPreviewRows}
            size="small"
            pagination={{
              current: previewPage,
              pageSize: previewPageSize,
              total: previewRows.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              onChange: (page, size) => {
                setPreviewPage(page);
                if (size !== previewPageSize) setPreviewPageSize(size);
              },
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} dari ${total} item`,
            }}
            rowKey="key"
            rowSelection={previewRowSelection}
            scroll={{ x: true }}
            columns={[
              {
                title: "Nama",
                dataIndex: "name",
                key: "name",
                render: (val: string) => (
                  <Typography.Text strong>{val}</Typography.Text>
                ),
              },
              {
                title: "Harga Awal",
                dataIndex: "price",
                key: "price",
                align: "right",
                render: (val: number) => `Rp ${formatMoney(val)}`,
              },
              {
                title: "Harga Setelah Diskon",
                key: "discounted",
                align: "right",
                render: (_: unknown, row: PreviewRow) => {
                  const { after } = resolveDiscount(row.price);
                  return `Rp ${formatMoney(after)}`;
                },
              },
              {
                title: "Stock",
                dataIndex: "stock",
                key: "stock",
                align: "right",
                render: (val: number | undefined) => Number(val ?? 0),
              },
              {
                title: "Aksi",
                key: "action",
                align: "center",
                width: 90,
                render: (_: unknown, row: PreviewRow) => (
                  <Button
                    size="small"
                    danger
                    onClick={() => handleDeleteOnePreview(row.key)}
                  >
                    Hapus
                  </Button>
                ),
              },
            ]}
          />
        ) : scopeType !== scopeAll ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada data preview"
          />
        ) : null}
      </Card>

      <ConfirmDeleteModal
        open={deletePreviewModalOpen}
        count={pendingDeletePreviewKeys.length}
        onCancel={() => {
          setDeletePreviewModalOpen(false);
          setPendingDeletePreviewKeys([]);
        }}
        onConfirm={handleConfirmDeletePreview}
      />

      <Form.Item
        label="Start Date"
        name="started_at"
        rules={[{ required: true, message: "Start Date required" }]}
      >
        <DatePicker
          showTime
          needConfirm
          format="YYYY-MM-DD HH:mm"
          style={{ width: "100%" }}
          disabled={!timeLimitEnabled}
          placeholder="Pilih tanggal & waktu"
        />
      </Form.Item>

      <Form.Item
        label="Expired Date"
        name="expired_at"
        rules={[{ required: true, message: "Expired Date required" }]}
      >
        <DatePicker
          showTime
          needConfirm
          format="YYYY-MM-DD HH:mm"
          style={{ width: "100%" }}
          disabled={!timeLimitEnabled}
          placeholder="Pilih tanggal & waktu"
        />
      </Form.Item>

      <Card
        size="small"
        style={sectionCardStyle}
        title={
          <Space size={8}>
            <SafetyCertificateOutlined />
            <Typography.Text strong style={{ color: sectionTitleStyle.color }}>
              Kebijakan
            </Typography.Text>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Row gutter={[12, 12]} align="top" justify="space-between">
              <Col flex="auto">
                <Space direction="vertical" size={2}>
                  <Typography.Text strong style={sectionTextStyle}>
                    <Space size={6}>
                      <LinkOutlined style={{ color: palette.primary700 }} />
                      <Typography.Text>
                        Dapat digunakan dengan promosi lainnya.
                      </Typography.Text>
                    </Space>
                  </Typography.Text>
                  <Typography.Text type="secondary" style={sectionTextStyle}>
                    {stackWithOtherPromo
                      ? "Voucher tetap berlaku walau produk sedang diskon/flash sale."
                      : "Voucher tidak berlaku jika ada promo lain (sale/flash sale/diskon)."}
                  </Typography.Text>
                </Space>
              </Col>
              <Col flex="none">
                <Switch
                  checked={stackWithOtherPromo}
                  onChange={(checked) => setStackWithOtherPromo(checked)}
                />
              </Col>
            </Row>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={[12, 12]} align="top" justify="space-between">
              <Col flex="auto">
                <Space direction="vertical" size={2}>
                  <Typography.Text strong style={sectionTextStyle}>
                    Dapat digunakan dengan voucher lainnya.
                  </Typography.Text>
                  <Typography.Text type="secondary" style={sectionTextStyle}>
                    Bisa ditumpuk dengan voucher lain (contoh: shipping +
                    amount). Tidak bisa shipping + shipping.
                  </Typography.Text>
                </Space>
              </Col>
              <Col flex="none">
                <Switch
                  checked={stackWithOtherVoucher}
                  onChange={(checked) => setStackWithOtherVoucher(checked)}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default VoucherDiscountTab;
