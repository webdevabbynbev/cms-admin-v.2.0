import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
  Button,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useBulkSelection } from "../../../../hooks/useBulkSelection";
import { ConfirmDeleteModal } from "../../../ConfirmDeleteModal";
import {
  getVoucherScopeBrands,
  getVoucherScopeProducts,
  getVoucherScopeVariants,
} from "../../../../api/voucher";
import {
  filterScopeCandidates,
  mapBrandPreviewRows,
  mapBrandScopeOptions,
  mapProductPreviewRows,
  mapProductScopeCandidates,
  mapVariantPreviewRows,
  mapVariantScopeCandidates,
  mergePreviewRows,
  normalizeScopeIds,
  removePreviewRowsByScopeSelection as removePreviewRowsByScopeSelectionService,
  type VoucherPreviewRow,
} from "../../../../services/api/voucher/voucher.scope.service";
import helper from "../../../../utils/helper";
import http from "../../../../api/http";

const SCOPE_ALL = 0;
const SCOPE_BRAND = 1;
const SCOPE_PRODUCT = 2;
const SCOPE_VARIANT = 3;
const UNLIMITED_QTY = 999999;
const FAR_FUTURE_DATE = new Date(2099, 11, 31, 23, 59);
type PreviewRow = VoucherPreviewRow;
type GiftRow = {
  id: number;
  sku?: string;
  name?: string;
  variantName?: string;
  variant_name?: string;
  price?: number;
  stock?: number;
  quantity?: number;
  isActive?: boolean;
  is_active?: boolean;
};

type VoucherProductTabProps = {
  stackWithOtherPromo: boolean;
  setStackWithOtherPromo: (checked: boolean) => void;
  stackWithOtherVoucher: boolean;
  setStackWithOtherVoucher: (checked: boolean) => void;
};

const VoucherProductTab: React.FC<VoucherProductTabProps> = ({
  stackWithOtherPromo,
  setStackWithOtherPromo,
  stackWithOtherVoucher,
  setStackWithOtherVoucher,
}) => {
  const [qtyMode, setQtyMode] = useState<"unlimited" | "limited">("limited");
  const [prevLimitedQty, setPrevLimitedQty] = useState<number | string>(0);
  const [limitPerCustomer, setLimitPerCustomer] = useState<boolean>(false);
  const [timeLimitEnabled, setTimeLimitEnabled] = useState<boolean>(true);
  const [prevTimeRange, setPrevTimeRange] = useState<{
    product_started_at?: any;
    product_expired_at?: any;
  }>({});
  const [scopeType, setScopeType] = useState<number>(SCOPE_PRODUCT);
  const [scopeLoading, setScopeLoading] = useState<boolean>(false);
  const [scopeOptions, setScopeOptions] = useState<
    Array<{ value: number; label: string }>
  >([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(10);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftData, setGiftData] = useState<GiftRow[]>([]);
  const [giftSearch, setGiftSearch] = useState("");
  const [giftPage, setGiftPage] = useState(1);
  const [giftPageSize, setGiftPageSize] = useState(10);
  const [giftTotal, setGiftTotal] = useState(0);
  const [selectedGift, setSelectedGift] = useState<GiftRow | null>(null);
  const [showGiftRequirement, setShowGiftRequirement] = useState(false);
  const [deletePreviewModalOpen, setDeletePreviewModalOpen] = useState(false);
  const [pendingDeletePreviewKeys, setPendingDeletePreviewKeys] = useState<React.Key[]>(
    [],
  );
  const [deletePreviewWarningText, setDeletePreviewWarningText] = useState("");
  const scopeSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hasHydratedInitialPreviewRef = useRef(false);
  const selectedScopeIdsRef = useRef<number[]>([]);
  const {
    rowSelection: previewRowSelection,
    selectedRowKeys: selectedPreviewKeys,
    hasSelection: hasPreviewSelection,
    resetSelection: resetPreviewSelection,
  } = useBulkSelection<PreviewRow>();

  const form = Form.useFormInstance();
  const perUserLimitValue = Form.useWatch("product_per_user_limit", form);
  const watchedScopeTypeRaw = Form.useWatch("product_scope_type", form);
  const watchedScopeType = Number(watchedScopeTypeRaw ?? SCOPE_PRODUCT);
  const watchedScopeIds = normalizeScopeIds(Form.useWatch("product_scope_ids", form));
  const watchedProductQty = Form.useWatch("product_qty", form);
  const watchedProductPerUserLimit = Form.useWatch("product_per_user_limit", form);
  const watchedGiftProductId = Form.useWatch("product_gift_product_id", form);
  const watchedGiftProductName = Form.useWatch("product_gift_product_name", form);
  const watchedFormId = Form.useWatch("id", form);
  const isEditMode =
    watchedFormId !== null &&
    watchedFormId !== undefined &&
    String(watchedFormId).trim() !== "";

  const handleQtyModeChange = (nextMode: "unlimited" | "limited") => {
    if (nextMode === "unlimited") {
      const currentQty = form.getFieldValue("product_qty");
      setPrevLimitedQty(currentQty ?? 0);
      form.setFieldValue("product_qty", UNLIMITED_QTY);
    } else {
      form.setFieldValue("product_qty", prevLimitedQty ?? 0);
    }
    setQtyMode(nextMode);
  };

  const handleLimitPerCustomerToggle = (checked: boolean) => {
    if (!checked) {
      form.setFieldValue("product_per_user_limit", null);
    } else {
      form.setFieldValue("product_per_user_limit", 1);
    }
    setLimitPerCustomer(checked);
  };

  const handleTimeLimitToggle = (checked: boolean) => {
    if (!checked) {
      setPrevTimeRange({
        product_started_at: form.getFieldValue("product_started_at"),
        product_expired_at: form.getFieldValue("product_expired_at"),
      });
      form.setFieldsValue({
        product_started_at: dayjs(),
        product_expired_at: dayjs(FAR_FUTURE_DATE),
      });
    } else {
      form.setFieldsValue({
        product_started_at: prevTimeRange.product_started_at ?? null,
        product_expired_at: prevTimeRange.product_expired_at ?? null,
      });
    }
    setTimeLimitEnabled(checked);
  };

  const searchScopeOptions = async (keyword: string, nextScopeType: number) => {
    if (nextScopeType === SCOPE_ALL) {
      setScopeOptions([]);
      return;
    }

    try {
      setScopeLoading(true);
      const q = String(keyword ?? "").trim();

      if (nextScopeType === SCOPE_BRAND) {
        const resp: any = await getVoucherScopeBrands({
          q,
          page: 1,
          per_page: 20,
        });
        const list = resp?.data?.serve?.data ?? [];
        setScopeOptions(mapBrandScopeOptions(Array.isArray(list) ? list : []));
        return;
      }

      if (nextScopeType === SCOPE_PRODUCT) {
        const resp: any = await getVoucherScopeProducts({
          q,
          page: 1,
          per_page: 100,
        });
        const list = resp?.data?.serve?.data ?? [];
        const mapped = mapProductScopeCandidates(Array.isArray(list) ? list : []);
        setScopeOptions(filterScopeCandidates(mapped, q));
        return;
      }

      if (nextScopeType === SCOPE_VARIANT) {
        const resp: any = await getVoucherScopeVariants({
          q,
          page: 1,
          per_page: 100,
        });
        const list = resp?.data?.serve?.data ?? [];
        const mapped = mapVariantScopeCandidates(Array.isArray(list) ? list : []);
        setScopeOptions(filterScopeCandidates(mapped, q));
      }
    } catch (error) {
      
      message.error("Gagal memuat data scope voucher product.");
    } finally {
      setScopeLoading(false);
    }
  };

  const runDebouncedScopeSearch = (keyword: string) => {
    if (scopeSearchDebounceRef.current) {
      clearTimeout(scopeSearchDebounceRef.current);
    }
    scopeSearchDebounceRef.current = setTimeout(() => {
      void searchScopeOptions(keyword, scopeType);
    }, 280);
  };

  const handleScopeTypeChange = (nextScopeType: number) => {
    setScopeType(nextScopeType);
    form.setFieldValue("product_scope_type", nextScopeType);
    form.setFieldValue("product_scope_ids", []);
    selectedScopeIdsRef.current = [];
    setScopeOptions([]);
    if (nextScopeType !== SCOPE_ALL) {
      void searchScopeOptions("", nextScopeType);
    }
  };

  const handleScopeIdsChange = (values: unknown) => {
    const nextIds = normalizeScopeIds(values);
    const prevIds = selectedScopeIdsRef.current;
    const removedIds = prevIds.filter((id) => !nextIds.includes(id));
    if (removedIds.length > 0) {
      setPreviewRows((prev) =>
        removePreviewRowsByScopeSelectionService(prev, scopeType, removedIds),
      );
    }
    selectedScopeIdsRef.current = nextIds;
  };

  useEffect(() => {
    setScopeType(watchedScopeType);
    if (watchedScopeType === SCOPE_ALL) {
      setScopeOptions([]);
      return;
    }
    void searchScopeOptions("", watchedScopeType);
  }, [watchedScopeType]);

  useEffect(() => {
    selectedScopeIdsRef.current = watchedScopeIds;
  }, [watchedScopeIds]);

  useEffect(() => {
    const qty = Number(watchedProductQty ?? 0);
    const isUnlimited = qty >= UNLIMITED_QTY;
    setQtyMode(isUnlimited ? "unlimited" : "limited");
    if (!isUnlimited) {
      setPrevLimitedQty(qty);
    }
  }, [watchedProductQty]);

  useEffect(() => {
    const hasLimit =
      watchedProductPerUserLimit !== null &&
      watchedProductPerUserLimit !== undefined &&
      String(watchedProductPerUserLimit).trim() !== "";
    setLimitPerCustomer(hasLimit);
  }, [watchedProductPerUserLimit]);

  useEffect(() => {
    if (
      watchedGiftProductId === null ||
      watchedGiftProductId === undefined ||
      String(watchedGiftProductId).trim() === ""
    ) {
      setSelectedGift(null);
      return;
    }
    setSelectedGift((prev) => ({
      id: Number(watchedGiftProductId),
      name:
        (watchedGiftProductName == null || watchedGiftProductName === "")
          ? prev?.name ?? "-"
          : String(watchedGiftProductName),
      sku: prev?.sku,
      price: prev?.price,
      stock: prev?.stock,
      quantity: prev?.quantity,
      isActive: prev?.isActive,
      is_active: prev?.is_active,
      variantName: prev?.variantName,
      variant_name: prev?.variant_name,
    }));
  }, [watchedGiftProductId, watchedGiftProductName]);

  useEffect(() => {
    if (!isEditMode || hasHydratedInitialPreviewRef.current) return;
    if (watchedScopeType === SCOPE_ALL || watchedScopeIds.length === 0) return;

    const hydratePreviewRows = async () => {
      try {
        setPreviewLoading(true);
        const rows =
          watchedScopeType === SCOPE_PRODUCT
            ? await fetchProductPreviews(watchedScopeIds)
            : watchedScopeType === SCOPE_BRAND
              ? await fetchBrandPreviews(watchedScopeIds)
              : await fetchVariantPreviews(watchedScopeIds);
        setPreviewRows(rows);
        setPreviewPage(1);
      } catch (error) {
        
      } finally {
        setPreviewLoading(false);
        hasHydratedInitialPreviewRef.current = true;
      }
    };

    void hydratePreviewRows();
  }, [isEditMode, watchedScopeType, watchedScopeIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      if (scopeSearchDebounceRef.current) {
        clearTimeout(scopeSearchDebounceRef.current);
      }
    },
    [],
  );

  const scopePlaceholder =
    scopeType === SCOPE_BRAND
      ? "Pilih brand..."
      : scopeType === SCOPE_PRODUCT
        ? "Cari brand atau produk..."
        : "Cari brand, produk, atau varian...";

  const scopeNotFoundContent = scopeLoading ? (
    <Space size={8} style={{ padding: "8px 0" }}>
      <Spin size="small" />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Memuat data...
      </Typography.Text>
    </Space>
  ) : (
    "Tidak ada data"
  );

  const sectionTextStyle: React.CSSProperties = {
    display: "block",
  };

  const sectionCardStyle: React.CSSProperties = {
    border: "1px solid #f6d4e8",
    background: "#fcf3f8",
    borderRadius: 12,
    marginBottom: 16,
  };
  const selectedScopeIds = normalizeScopeIds(
    Form.useWatch("product_scope_ids", form),
  );
  const isScopeInvalid =
    scopeType !== SCOPE_ALL && selectedScopeIds.length === 0;
  const isApplyToReady = previewRows.length > 0;
  const pagedPreviewRows = useMemo(() => {
    const start = (previewPage - 1) * previewPageSize;
    return previewRows.slice(start, start + previewPageSize);
  }, [previewRows, previewPage, previewPageSize]);

  const fetchProductPreviews = async (ids: number[]) => {
    const resp: any = await getVoucherScopeProducts({
      with_variants: 1,
      ids: ids.join(","),
    });
    const list = resp?.data?.serve?.data ?? [];
    return mapProductPreviewRows(Array.isArray(list) ? list : [], SCOPE_PRODUCT);
  };

  const fetchBrandPreviews = async (brandIds: number[]) => {
    const rows: PreviewRow[] = [];
    for (const brandId of brandIds) {
      const resp: any = await getVoucherScopeProducts({
        with_variants: 1,
        load_all: 1,
        brand_id: String(brandId),
      });
      const list = resp?.data?.serve?.data ?? [];
      if (!Array.isArray(list) || list.length === 0) continue;
      rows.push(
        ...mapBrandPreviewRows(
          Number(brandId),
          Array.isArray(list) ? list : [],
          SCOPE_BRAND,
        ),
      );
    }
    return rows;
  };

  const fetchVariantPreviews = async (ids: number[]) => {
    const resp: any = await getVoucherScopeVariants({ ids: ids.join(",") });
    const list = resp?.data?.serve?.data ?? [];
    return mapVariantPreviewRows(Array.isArray(list) ? list : [], SCOPE_VARIANT);
  };

  const handleAddSelected = async () => {
    const ids = normalizeScopeIds(form.getFieldValue("product_scope_ids"));
    if (!ids.length) {
      message.warning("Pilih minimal 1 target scope untuk ditambahkan.");
      return;
    }
    if (scopeType === SCOPE_ALL) {
      message.info("Preview harga tersedia untuk Brand, Produk, dan Variant.");
      return;
    }
    try {
      setPreviewLoading(true);
      const rows =
        scopeType === SCOPE_PRODUCT
          ? await fetchProductPreviews(ids)
          : scopeType === SCOPE_BRAND
            ? await fetchBrandPreviews(ids)
            : await fetchVariantPreviews(ids);
      setPreviewRows((prev) => mergePreviewRows(prev, rows));
      setPreviewPage(1);
      message.success("Item ditambahkan ke preview harga.");
    } catch (error) {
      
      message.error("Gagal memuat preview harga.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRemovePreview = (key: string) => {
    const willBeEmptyAfterDelete =
      Boolean(selectedGift) &&
      previewRows.length <= 1 &&
      previewRows.some((row) => String(row.key) === String(key));

    setPendingDeletePreviewKeys([key]);
    setDeletePreviewWarningText(
      willBeEmptyAfterDelete
        ? "minimal pilih satu item untuk memilih hadiah"
        : "",
    );
    setDeletePreviewModalOpen(true);
  };

  const openDeletePreviewModal = () => {
    if (!previewRows.length || !hasPreviewSelection) return;
    const keysToDelete = [...selectedPreviewKeys];
    const keySet = new Set(keysToDelete.map((key) => String(key)));
    const remainingRows = previewRows.filter((row) => !keySet.has(String(row.key)));
    const shouldWarnLastDelete = Boolean(selectedGift) && remainingRows.length === 0;

    setPendingDeletePreviewKeys(keysToDelete);
    setDeletePreviewWarningText(
      shouldWarnLastDelete
        ? "minimal pilih satu item untuk memilih hadiah"
        : "",
    );
    setDeletePreviewModalOpen(true);
  };

  const handleConfirmDeletePreview = () => {
    if (!pendingDeletePreviewKeys.length) {
      setDeletePreviewModalOpen(false);
      setDeletePreviewWarningText("");
      return;
    }

    const keySet = new Set(pendingDeletePreviewKeys.map((key) => String(key)));
    const nextRows = previewRows.filter((row) => !keySet.has(String(row.key)));
    setPreviewRows(nextRows);
    setPreviewPage(1);
    resetPreviewSelection();
    if (nextRows.length === 0 && selectedGift) {
      clearSelectedGift();
    }
    setDeletePreviewModalOpen(false);
    setPendingDeletePreviewKeys([]);
    setDeletePreviewWarningText("");
    message.success("Preview berhasil dihapus.");
  };

  const formatMoney = (value: number) => {
    if (!Number.isFinite(value)) return "-";
    return helper.formatRupiah(String(Math.round(value)));
  };

  const handleMinPurchaseChange = (value: string) => {
    form.setFieldValue(
      "product_min_purchase_amount",
      value ? helper.formatRupiah(value) : "",
    );
  };

  const fetchGiftProducts = async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    const nextPage = params?.page ?? giftPage;
    const nextPageSize = params?.pageSize ?? giftPageSize;
    const nextSearch = params?.search ?? giftSearch;

    try {
      setGiftLoading(true);
      const response = await http.get(
        `/admin/gift-products?page=${nextPage}&limit=${nextPageSize}&search=${encodeURIComponent(nextSearch)}`,
      );
      const list =
        response?.data?.data || response?.data?.serve?.data || response?.data?.serve || [];
      const meta = response?.data?.meta || {};

      setGiftData(Array.isArray(list) ? list : []);
      setGiftTotal(Number(meta?.total ?? (Array.isArray(list) ? list.length : 0)));
      setGiftPage(Number(meta?.currentPage ?? meta?.page ?? nextPage));
      setGiftPageSize(Number(meta?.perPage ?? nextPageSize));
    } catch (error) {
      
      message.error("Gagal memuat daftar hadiah.");
    } finally {
      setGiftLoading(false);
    }
  };

  const openGiftModal = async () => {
    if (!isApplyToReady) {
      setShowGiftRequirement(true);
      return;
    }
    setShowGiftRequirement(false);
    setGiftModalOpen(true);
    await fetchGiftProducts({ page: 1 });
  };

  const handleSelectGift = (gift: GiftRow) => {
    setSelectedGift(gift);
    form.setFieldValue("product_gift_product_id", gift.id);
    form.setFieldValue("product_gift_product_name", gift.name ?? "-");
    setGiftModalOpen(false);
    message.success("Hadiah berhasil dipilih.");
  };

  const clearSelectedGift = () => {
    setSelectedGift(null);
    form.setFieldValue("product_gift_product_id", null);
    form.setFieldValue("product_gift_product_name", null);
  };

  return (
    <>
      <Form.Item
        label="Minimal Pembelian"
        name="product_min_purchase_amount"
        rules={[{ required: true, message: "Minimal purchase wajib diisi" }]}
      >
        <Input
          prefix="Rp"
          inputMode="numeric"
          onChange={(e) => handleMinPurchaseChange(e.target.value)}
        />
      </Form.Item>

      <Card
        size="small"
        style={sectionCardStyle}
        title={
          <Space size={8}>
            <SafetyCertificateOutlined />
            <Typography.Text strong style={{ color: "#ae2d68" }}>
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
            onChange={(e) => handleQtyModeChange(e.target.value)}
          >
            <Radio.Button value="unlimited">Tidak terbatas</Radio.Button>
            <Radio.Button value="limited">Tentukan Batas</Radio.Button>
          </Radio.Group>

          <Form.Item
            name="product_qty"
            rules={[{ required: true, message: "Kuota wajib diisi" }]}
            hidden={qtyMode === "unlimited"}
            style={{ marginTop: 12, marginBottom: 0 }}
          >
            <Input type="number" min={0} />
          </Form.Item>

          {qtyMode === "unlimited" ? (
            <Typography.Text type="secondary" style={sectionTextStyle}>
              Disimpan sebagai qty {UNLIMITED_QTY}.
            </Typography.Text>
          ) : null}
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Row gutter={[12, 12]} align="top" justify="space-between">
              <Col flex="auto">
                <Space direction="vertical" size={0}>
                  <Typography.Text strong style={sectionTextStyle}>
                    <Space size={6}>
                      <UserOutlined style={{ color: "#ae2d68" }} />
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
                  onChange={handleLimitPerCustomerToggle}
                />
              </Col>
            </Row>
            {limitPerCustomer ? (
              <Form.Item
                label="Total batas per pelanggan"
                name="product_per_user_limit"
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
                <Space direction="vertical" size={0}>
                  <Typography.Text strong style={sectionTextStyle}>
                    <Space size={6}>
                      <ClockCircleOutlined style={{ color: "#ae2d68" }} />
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
                  onChange={handleTimeLimitToggle}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Form.Item
        label="Tanggal Mulai"
        name="product_started_at"
        rules={[{ required: true, message: "Tanggal mulai wajib diisi" }]}
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
        label="Tanggal Berakhir"
        name="product_expired_at"
        rules={[{ required: true, message: "Tanggal berakhir wajib diisi" }]}
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
            <Typography.Text strong style={{ color: "#ae2d68" }}>
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
                      <LinkOutlined style={{ color: "#ae2d68" }} />
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

      <Card
        size="small"
        style={sectionCardStyle}
        title={
          <Space size={8}>
            <InfoCircleOutlined />
            <Typography.Text strong style={{ color: "#ae2d68" }}>
              Input Voucher Berlaku Untuk
            </Typography.Text>
          </Space>
        }
      >
        <Form.Item name="product_scope_type" label="Voucher berlaku untuk">
          <Radio.Group
            buttonStyle="solid"
            onChange={(e) =>
              handleScopeTypeChange(Number(e?.target?.value ?? SCOPE_ALL))
            }
            value={scopeType}
          >
            <Radio.Button value={SCOPE_BRAND}>Brand</Radio.Button>
            <Radio.Button value={SCOPE_PRODUCT}>Produk</Radio.Button>
            <Radio.Button value={SCOPE_VARIANT}>Variant</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {scopeType !== SCOPE_ALL ? (
          <Form.Item
            label="Target Brand / Produk / Variant"
            name="product_scope_ids"
            rules={[
              {
                validator: async (_, value) => {
                  const ids = normalizeScopeIds(value);
                  if (scopeType === SCOPE_ALL || ids.length > 0) return;
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
              onChange={handleScopeIdsChange}
              onSearch={runDebouncedScopeSearch}
              onFocus={() => {
                if (scopeSearchDebounceRef.current) {
                  clearTimeout(scopeSearchDebounceRef.current);
                }
                void searchScopeOptions("", scopeType);
              }}
              onOpenChange={(open) => {
                if (!open) return;
                if (scopeSearchDebounceRef.current) {
                  clearTimeout(scopeSearchDebounceRef.current);
                }
                void searchScopeOptions("", scopeType);
              }}
              allowClear
            />
          </Form.Item>
        ) : null}

        {scopeType !== SCOPE_ALL ? (
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
                disabled={isScopeInvalid}
                onClick={handleAddSelected}
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
                title: "Harga",
                dataIndex: "price",
                key: "price",
                align: "right",
                render: (val: number) => `Rp ${formatMoney(val)}`,
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
                    onClick={() => handleRemovePreview(row.key)}
                  >
                    Hapus
                  </Button>
                ),
              },
            ]}
          />
        ) : scopeType !== SCOPE_ALL ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada data preview"
          />
        ) : null}
      </Card>

      <Card
        size="small"
        style={sectionCardStyle}
        title={<Typography.Text strong>Hadiah</Typography.Text>}
      >
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Pembeli hanya bisa klaim masing-masing 1 hadiah per pesanan.
        </Typography.Text>

        <Form.Item name="product_gift_product_id" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="product_gift_product_name" hidden>
          <Input />
        </Form.Item>

        <Space size={8} style={{ marginBottom: selectedGift ? 12 : 0 }}>
          <Button onClick={() => void openGiftModal()}>
            + Tambahkan Hadiah
          </Button>
          {selectedGift ? (
            <Button danger onClick={clearSelectedGift}>
              Hapus Hadiah
            </Button>
          ) : null}
        </Space>
        {showGiftRequirement ? (
          <Typography.Text
            type="danger"
            style={{ display: "block", marginBottom: selectedGift ? 12 : 0 }}
          >
            Tambahkan dulu item ke list preview sebelum memilih hadiah.
          </Typography.Text>
        ) : null}

        {selectedGift ? (
          <Card size="small" style={{ marginTop: 8 }}>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Typography.Text type="secondary">Nama</Typography.Text>
                <Typography.Text strong style={{ display: "block" }}>
                  {selectedGift.name || "-"}
                </Typography.Text>
              </Col>
              <Col xs={24} md={6}>
                <Typography.Text type="secondary">SKU</Typography.Text>
                <Typography.Text strong style={{ display: "block" }}>
                  {selectedGift.sku || "-"}
                </Typography.Text>
              </Col>
              <Col xs={24} md={5}>
                <Typography.Text type="secondary">Stok</Typography.Text>
                <Typography.Text strong style={{ display: "block" }}>
                  {selectedGift.stock ?? selectedGift.quantity ?? 0}
                </Typography.Text>
              </Col>
              <Col xs={24} md={5}>
                <Typography.Text type="secondary">Status</Typography.Text>
                <Typography.Text strong style={{ display: "block" }}>
                  {(selectedGift.isActive ?? selectedGift.is_active) ? "Active" : "Inactive"}
                </Typography.Text>
              </Col>
            </Row>
          </Card>
        ) : null}
      </Card>

      <Modal
        title="Pilih Hadiah"
        open={giftModalOpen}
        onCancel={() => setGiftModalOpen(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Input.Search
          placeholder="Cari gift product (nama / SKU)"
          allowClear
          enterButton="Cari"
          defaultValue={giftSearch}
          onSearch={(value) => {
            setGiftSearch(value);
            void fetchGiftProducts({ page: 1, search: value });
          }}
          style={{ marginBottom: 12 }}
        />

        <Table<GiftRow>
          rowKey="id"
          loading={giftLoading}
          dataSource={giftData}
          pagination={{
            current: giftPage,
            pageSize: giftPageSize,
            total: giftTotal,
            onChange: (page, pageSize) => {
              void fetchGiftProducts({ page, pageSize });
            },
            showSizeChanger: false,
          }}
          columns={[
            {
              title: "SKU",
              dataIndex: "sku",
              key: "sku",
              width: 170,
            },
            {
              title: "Name",
              dataIndex: "name",
              key: "name",
            },
            {
              title: "Variant",
              key: "variant",
              render: (_: unknown, row: GiftRow) =>
                row.variantName || row.variant_name || "-",
            },
            {
              title: "Harga",
              dataIndex: "price",
              key: "price",
              align: "right",
              render: (price: number) => `Rp. ${formatMoney(Number(price || 0))}`,
            },
            {
              title: "Quantity",
              key: "quantity",
              width: 100,
              align: "center",
              render: (_: unknown, row: GiftRow) => row.stock ?? row.quantity ?? 0,
            },
            {
              title: "Status",
              key: "status",
              width: 100,
              align: "center",
              render: (_: unknown, row: GiftRow) =>
                (row.isActive ?? row.is_active) ? (
                  <Tag color="green">Active</Tag>
                ) : (
                  <Tag color="red">Inactive</Tag>
                ),
            },
            {
              title: "Aksi",
              key: "action",
              width: 120,
              align: "center",
              render: (_: unknown, row: GiftRow) => (
                <Button type="primary" size="small" onClick={() => handleSelectGift(row)}>
                  Pilih
                </Button>
              ),
            },
          ]}
        />
      </Modal>

      <ConfirmDeleteModal
        open={deletePreviewModalOpen}
        count={pendingDeletePreviewKeys.length}
        warningText={deletePreviewWarningText}
        onCancel={() => {
          setDeletePreviewModalOpen(false);
          setPendingDeletePreviewKeys([]);
          setDeletePreviewWarningText("");
        }}
        onConfirm={handleConfirmDeletePreview}
      />
    </>
  );
};

export default VoucherProductTab;
