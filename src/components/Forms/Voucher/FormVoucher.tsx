import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  Space,
  Spin,
  Row,
  Tabs,
  Typography,
  message,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { InfoCircleOutlined } from "@ant-design/icons";
import {
  createVoucher,
  getVoucherScopeBrands,
  getVoucherScopeProducts,
  getVoucherScopeVariants,
  updateVoucher,
} from "../../../api/voucher";
import helper from "../../../utils/helper";
import {
  digitsOnly,
  parseBooleanInput,
  toServerDateTime,
  toDatePickerValue,
} from "../../../utils/voucher/formValue";
import { buildVoucherSubmitPayload } from "../../../services/api/voucher/voucher.payload.service";
import { resolveVoucherDiscount } from "../../../services/api/voucher/voucher.pricing.service";
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
  normalizeSearchText,
  removePreviewRowsByScopeSelection as removePreviewRowsByScopeSelectionService,
  splitSearchTokens,
  type VoucherPreviewRow,
  type VoucherScopeOption,
} from "../../../services/api/voucher/voucher.scope.service";
import {
  useFormVoucherHooks,
  useFormVoucherInitEffect,
  useFormVoucherVariantScopeEffect,
  useFormVoucherDebounceCleanup,
  useFormVoucherSyncSelectedScopeIds,
  useFormVoucherResetPreviewPage,
} from "../../../hooks/voucher";
import VoucherDiscountTab from "./tabs/VoucherDiscountTab";
import VoucherProductTab from "./tabs/VoucherProductTab";

type VoucherFormValues = {
  id?: number | string;
  name: string;
  code: string;
  min_purchase_amount?: number | string | null;
  type: number | null;

  // NOTE: form pake string biar gampang display
  price?: string;
  max_disc_price?: string;
  percentage?: string;

  started_at: Dayjs | null;
  expired_at: Dayjs | null;

  is_percentage: number; // 1=percentage, 2=amount
  is_active: number; // 1=active, 2=inactive
  qty: number | string;
  per_user_limit?: number | string | null;
  scope_type: number;
  scope_ids: number[];

  product_started_at?: Dayjs | null;
  product_expired_at?: Dayjs | null;
  product_min_purchase_amount?: number | string | null;
  product_qty?: number | string;
  product_per_user_limit?: number | string | null;
  product_scope_type?: number;
  product_scope_ids?: number[];
  product_gift_product_id?: number | string | null;
  product_gift_product_name?: string | null;
};

type ScopeOption = VoucherScopeOption;
type PreviewRow = VoucherPreviewRow;

type FormVoucherProps = {
  data?: {
    id?: number | string;
    name?: string;
    code?: string;
    reward_type?: number | null;
    gift_product_id?: number | null;
    gift_product_ids?: number[];
    gift_product_name?: string | null;
    min_purchase_amount?: number | null;
    type?: number;
    price?: number | null;
    expiredAt?: string;
    startedAt?: string;
    maxDiscPrice?: number | null;
    percentage?: number | null;
    isPercentage?: number;
    isActive?: number;
    qty?: number;
    perUserLimit?: number | null;
    isStackable?: number | boolean;
    isVoucherStackable?: number | boolean;
    scopeType?: number;
    scopeIds?: number[];
  };
  handleClose: () => void;
};

const UNLIMITED_QTY = 999999;
const FAR_FUTURE_DATE = new Date(2099, 11, 31, 23, 59);

const SCOPE_ALL = 0;
const SCOPE_BRAND = 1;
const SCOPE_PRODUCT = 2;
const SCOPE_VARIANT = 3;

const FormVoucher: React.FC<FormVoucherProps> = ({ data, handleClose }) => {
  const {
    isDarkMode,
    typeDisc,
    setTypeDisc,
    qtyMode,
    setQtyMode,
    prevLimitedQty,
    setPrevLimitedQty,
    timeLimitEnabled,
    setTimeLimitEnabled,
    limitPerCustomer,
    setLimitPerCustomer,
    stackWithOtherPromo,
    setStackWithOtherPromo,
    stackWithOtherVoucher,
    setStackWithOtherVoucher,
    scopeType,
    setScopeType,
    scopeOptions,
    setScopeOptions,
    scopeLoading,
    setScopeLoading,
    previewRows,
    setPreviewRows,
    previewLoading,
    setPreviewLoading,
    previewPage,
    setPreviewPage,
    previewPageSize,
    setPreviewPageSize,
    selectedScopeIdsRef,
    scopeSearchSeqRef,
    scopeOptionsCacheRef,
    scopeSearchDebounceRef,
    prevPerUserLimit,
    setPrevPerUserLimit,
    prevTimeRange,
    setPrevTimeRange,
    form,
    perUserLimitValue,
    scopeIdsValue,
    watchPercentage,
    watchAmount,
    watchMaxDisc,
    watchVoucherType,
    watchIsPercentage,
    pagedPreviewRows,
    init,
    resolvePromoStackable,
    resolveVoucherStackable,
  } = useFormVoucherHooks({
    data,
    scopeAll: SCOPE_ALL,
    unlimitedQty: UNLIMITED_QTY,
    formatRupiah: helper.formatRupiah,
    toDatePickerValue,
    parseBooleanInput,
  });
  const [activeTab, setActiveTab] = useState<"discount" | "product">(
    "discount",
  );
  const isEditMode = Boolean(data?.id);
  const isProductVoucher = useMemo(() => {
    const rewardType = Number((data as any)?.reward_type ?? (data as any)?.rewardType ?? 1);
    const legacyType = Number((data as any)?.type ?? 1);
    return rewardType === 2 || legacyType === 3;
  }, [data]);

  useEffect(() => {
    if (!isEditMode) return;
    setActiveTab(isProductVoucher ? "product" : "discount");
  }, [isEditMode, isProductVoucher]);

  const handleQtyModeChange = (nextMode: "unlimited" | "limited") => {
    if (nextMode === "unlimited") {
      const currentQty = form.getFieldValue("qty");
      setPrevLimitedQty(currentQty ?? 0);
      form.setFieldValue("qty", UNLIMITED_QTY);
    } else {
      form.setFieldValue("qty", prevLimitedQty ?? 0);
    }
    setQtyMode(nextMode);
  };

  const handleTimeLimitToggle = (checked: boolean) => {
    if (!checked) {
      setPrevTimeRange({
        started_at: form.getFieldValue("started_at"),
        expired_at: form.getFieldValue("expired_at"),
      });
      const nowLocal = dayjs();
      form.setFieldsValue({
        started_at: nowLocal,
        expired_at: dayjs(FAR_FUTURE_DATE),
      });
    } else {
      form.setFieldsValue({
        started_at: prevTimeRange.started_at ?? null,
        expired_at: prevTimeRange.expired_at ?? null,
      });
    }
    setTimeLimitEnabled(checked);
  };

  const handleLimitPerCustomerToggle = (checked: boolean) => {
    if (!checked) {
      setPrevPerUserLimit(form.getFieldValue("per_user_limit") ?? 1);
      form.setFieldValue("per_user_limit", null);
    } else {
      form.setFieldValue("per_user_limit", prevPerUserLimit ?? 1);
    }
    setLimitPerCustomer(checked);
  };

  const formatMoney = (value: number) => {
    if (!Number.isFinite(value)) return "-";
    return helper.formatRupiah(String(Math.round(value)));
  };

  const resolveDiscount = (basePrice: number) => {
    return resolveVoucherDiscount({
      basePrice,
      isShipping: Number(watchVoucherType ?? 0) === 2,
      isPercent: Number(watchIsPercentage ?? typeDisc ?? 1) === 1,
      percent: Number(watchPercentage ?? 0) || 0,
      maxDisc: Number(digitsOnly(watchMaxDisc)) || 0,
      amount: Number(digitsOnly(watchAmount)) || 0,
      formatMoney,
    });
  };

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
    const maxItems = 1000;

    for (const brandId of brandIds) {
      const resp: any = await getVoucherScopeProducts({
        with_variants: 1,
        load_all: 1,
        brand_id: String(brandId),
      });
      const list = resp?.data?.serve?.data ?? [];
      if (!Array.isArray(list) || list.length === 0) continue;
      if (list.length >= maxItems) {
        message.warning(
          "Preview brand dibatasi 1000 item. Gunakan filter yang lebih sempit bila perlu.",
        );
      }
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
    const ids = normalizeScopeIds(form.getFieldValue("scope_ids"));
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
    setPreviewRows((prev) => prev.filter((row) => row.key !== key));
  };

  const hydrateScopeOptionsByIds = async (
    nextScopeType: number,
    ids: number[],
  ) => {
    const normalizedIds = normalizeScopeIds(ids);
    if (!normalizedIds.length || nextScopeType === SCOPE_ALL) {
      setScopeOptions([]);
      return;
    }

    try {
      setScopeLoading(true);
      if (nextScopeType === SCOPE_BRAND) {
        const resp: any = await getVoucherScopeBrands({
          q: "",
          page: 1,
          per_page: 300,
        });
        const list = resp?.data?.serve?.data ?? [];
        const opts = mapBrandScopeOptions(
          (Array.isArray(list) ? list : []).filter((brand: any) =>
            normalizedIds.includes(Number(brand?.id)),
          ),
        );
        setScopeOptions(opts);
      } else if (nextScopeType === SCOPE_PRODUCT) {
        const resp: any = await getVoucherScopeProducts({
          ids: normalizedIds.join(","),
        });
        const list = resp?.data?.serve?.data ?? [];
        const options = mapProductScopeCandidates(Array.isArray(list) ? list : []).map(
          (candidate) => ({
            value: candidate.value,
            label: candidate.label,
          }),
        );
        setScopeOptions(options);
      } else if (nextScopeType === SCOPE_VARIANT) {
        const resp: any = await getVoucherScopeVariants({
          ids: normalizedIds.join(","),
        });
        const list = resp?.data?.serve?.data ?? [];
        const options = mapVariantScopeCandidates(Array.isArray(list) ? list : []).map(
          (candidate) => ({
            value: candidate.value,
            label: candidate.label,
          }),
        );
        setScopeOptions(options);
      }
    } catch (error) {
      
    } finally {
      setScopeLoading(false);
    }
  };

  const putScopeCache = (key: string, options: ScopeOption[]) => {
    scopeOptionsCacheRef.current.set(
      key,
      options.map((opt) => ({ ...opt })),
    );
    if (scopeOptionsCacheRef.current.size > 100) {
      const oldestKey = scopeOptionsCacheRef.current.keys().next().value;
      if (oldestKey) scopeOptionsCacheRef.current.delete(oldestKey);
    }
  };

  const runDebouncedScopeSearch = (keyword: string) => {
    if (scopeSearchDebounceRef.current) {
      clearTimeout(scopeSearchDebounceRef.current);
    }
    scopeSearchDebounceRef.current = setTimeout(() => {
      void searchScopeOptions(keyword);
    }, 280);
  };

  const searchScopeOptions = async (keyword: string) => {
    const q = String(keyword ?? "").trim();
    const current = ++scopeSearchSeqRef.current;
    const qTokens = splitSearchTokens(q);
    const firstToken = qTokens[0] ?? "";
    const normalizedQuery = normalizeSearchText(q);
    if (scopeType === SCOPE_ALL) {
      setScopeOptions([]);
      return;
    }
    const cacheKey = `scope:${scopeType}:${normalizeSearchText(q)}`;
    const cached = scopeOptionsCacheRef.current.get(cacheKey);
    if (cached) {
      setScopeOptions(cached.map((opt) => ({ ...opt })));
      setScopeLoading(false);
      return;
    }

    try {
      setScopeLoading(true);
      if (q) setScopeOptions([]);

      if (scopeType === SCOPE_BRAND) {
        const resp: any = await getVoucherScopeBrands({
          q,
          page: 1,
          per_page: 20,
        });
        const list = resp?.data?.serve?.data ?? [];
        if (current !== scopeSearchSeqRef.current) return;
        const options = mapBrandScopeOptions(Array.isArray(list) ? list : []);
        putScopeCache(cacheKey, options);
        setScopeOptions(options);
        return;
      }

      if (scopeType === SCOPE_PRODUCT) {
        const pageSize = 200;
        const maxPages = 20;

        const queryApiPage = async (query: string, page = 1) => {
          const resp: any = await getVoucherScopeProducts({
            q: query,
            page,
            per_page: pageSize,
          });
          return (resp?.data?.serve?.data ?? []) as any[];
        };

        const queryApi = async (query: string) => {
          if (!query) {
            return await queryApiPage(query, 1);
          }

          const all: any[] = [];
          for (let page = 1; page <= maxPages; page += 1) {
            const rows = await queryApiPage(query, page);
            if (!Array.isArray(rows) || !rows.length) break;
            all.push(...rows);
            if (rows.length < pageSize) break;
          }
          return all;
        };

        let list = await queryApi(q);
        if (current !== scopeSearchSeqRef.current) return;
        if (
          q &&
          qTokens.length > 1 &&
          list.length < 8 &&
          firstToken &&
          firstToken !== normalizedQuery
        ) {
          const extraList = await queryApi(firstToken);
          if (current !== scopeSearchSeqRef.current) return;
          if (extraList.length) list = [...list, ...extraList];

          if (!list.length) {
            const secondToken = qTokens.find(
              (token, idx) => idx > 0 && token.length >= 3,
            );
            if (secondToken && secondToken !== firstToken) {
              const secondList = await queryApi(secondToken);
              if (current !== scopeSearchSeqRef.current) return;
              if (secondList.length) list = [...list, ...secondList];
            }
          }
        }
        if (current !== scopeSearchSeqRef.current) return;

        const queryProductsByBrandKeyword = async (keywordValue: string) => {
          const brandKeyword = String(keywordValue ?? "").trim();
          if (!brandKeyword) return [] as any[];

          try {
            const brandsResp: any = await getVoucherScopeBrands({
              q: brandKeyword,
              page: 1,
              per_page: 8,
            });
            const brands = brandsResp?.data?.serve?.data ?? [];
            const brandIds = Array.from(
              new Set(
                (Array.isArray(brands) ? brands : [])
                  .map((b: any) => Number(b?.id ?? 0))
                  .filter((id: number) => Number.isFinite(id) && id > 0),
              ),
            ).slice(0, 5);

            if (!brandIds.length) return [] as any[];

            const fetchProductsByBrand = async (brandId: number) => {
              const resp: any = await getVoucherScopeProducts({
                q: "",
                brand_id: String(brandId),
                load_all: 1,
              });
              const rows = resp?.data?.serve?.data ?? [];
              return Array.isArray(rows) ? rows : [];
            };

            const productLists = await Promise.all(
              brandIds.map(async (brandId) => {
                try {
                  return await fetchProductsByBrand(brandId);
                } catch {
                  return [];
                }
              }),
            );

            return productLists.flat();
          } catch {
            return [] as any[];
          }
        };

        let sourceList = list;
        if (q.length >= 3) {
          const fromBrandKeyword = await queryProductsByBrandKeyword(q);
          if (current !== scopeSearchSeqRef.current) return;
          if (fromBrandKeyword.length) {
            sourceList = [...list, ...fromBrandKeyword];
          }
        }

        const mapped = mapProductScopeCandidates(sourceList);
        const options = filterScopeCandidates(mapped, q);
        if (current !== scopeSearchSeqRef.current) return;
        putScopeCache(cacheKey, options);
        setScopeOptions(options);
        return;
      }

      if (scopeType === SCOPE_VARIANT) {
        const pageSize = 200;
        const maxPages = 20;

        const queryApiPage = async (query: string, page = 1) => {
          const resp: any = await getVoucherScopeVariants({
            q: query,
            page,
            per_page: pageSize,
          });
          return (resp?.data?.serve?.data ?? []) as any[];
        };

        const queryApi = async (query: string) => {
          if (!query) {
            return await queryApiPage(query, 1);
          }

          const all: any[] = [];
          for (let page = 1; page <= maxPages; page += 1) {
            const rows = await queryApiPage(query, page);
            if (!Array.isArray(rows) || !rows.length) break;
            all.push(...rows);
            if (rows.length < pageSize) break;
          }
          return all;
        };

        let list = await queryApi(q);
        if (current !== scopeSearchSeqRef.current) return;
        if (
          q &&
          qTokens.length > 1 &&
          list.length < 8 &&
          firstToken &&
          firstToken !== normalizedQuery
        ) {
          const extraList = await queryApi(firstToken);
          if (current !== scopeSearchSeqRef.current) return;
          if (extraList.length) list = [...list, ...extraList];

          if (!list.length) {
            const secondToken = qTokens.find(
              (token, idx) => idx > 0 && token.length >= 3,
            );
            if (secondToken && secondToken !== firstToken) {
              const secondList = await queryApi(secondToken);
              if (current !== scopeSearchSeqRef.current) return;
              if (secondList.length) list = [...list, ...secondList];
            }
          }
        }
        if (current !== scopeSearchSeqRef.current) return;

        const mapped = mapVariantScopeCandidates(list);
        const options = filterScopeCandidates(mapped, q);
        if (current !== scopeSearchSeqRef.current) return;
        putScopeCache(cacheKey, options);
        setScopeOptions(options);
      }
    } catch (error) {
      if (current !== scopeSearchSeqRef.current) return;
      
    } finally {
      if (current === scopeSearchSeqRef.current) setScopeLoading(false);
    }
  };

  const handleScopeTypeChange = (nextScopeType: number) => {
    setScopeType(nextScopeType);
    form.setFieldValue("scope_type", nextScopeType);
    form.setFieldValue("scope_ids", []);
    selectedScopeIdsRef.current = [];
    setScopeOptions([]);
    if (nextScopeType === SCOPE_VARIANT) {
      void searchScopeOptions("");
    }
  };

  useFormVoucherInitEffect({
    form,
    init,
    scopeAll: SCOPE_ALL,
    unlimitedQty: UNLIMITED_QTY,
    data,
    setTypeDisc,
    setScopeType,
    setQtyMode,
    setPrevLimitedQty,
    setTimeLimitEnabled,
    setLimitPerCustomer,
    setPrevPerUserLimit,
    setStackWithOtherPromo,
    setStackWithOtherVoucher,
    setPrevTimeRange,
    resolvePromoStackable,
    resolveVoucherStackable,
    hydrateScopeOptionsByIds,
  });

  useFormVoucherVariantScopeEffect({
    scopeType,
    scopeVariant: SCOPE_VARIANT,
    searchScopeOptions,
  });

  useFormVoucherDebounceCleanup({
    scopeSearchDebounceRef,
  });

  useFormVoucherSyncSelectedScopeIds({
    scopeIdsValue,
    selectedScopeIdsRef,
    normalizeScopeIds,
  });

  useFormVoucherResetPreviewPage({
    scopeType,
    setPreviewPage,
  });

  useEffect(() => {
    if (!isEditMode || !isProductVoucher || !data) return;

    const giftProductId =
      (data as any)?.gift_product_id ??
      (Array.isArray((data as any)?.gift_product_ids) &&
      (data as any).gift_product_ids.length > 0
        ? Number((data as any).gift_product_ids[0])
        : null);

    form.setFieldsValue({
      product_started_at: data.startedAt ? toDatePickerValue(data.startedAt) : null,
      product_expired_at: data.expiredAt ? toDatePickerValue(data.expiredAt) : null,
      product_min_purchase_amount:
        data.min_purchase_amount === undefined || data.min_purchase_amount === null
          ? null
          : data.min_purchase_amount,
      product_qty: data.qty ?? 0,
      product_per_user_limit:
        data.perUserLimit === undefined || data.perUserLimit === null
          ? null
          : data.perUserLimit,
      product_scope_type: Number(data.scopeType ?? SCOPE_PRODUCT),
      product_scope_ids: Array.isArray(data.scopeIds) ? data.scopeIds : [],
      product_gift_product_id:
        giftProductId === undefined || giftProductId === null
          ? null
          : Number(giftProductId),
      product_gift_product_name: data.gift_product_name ?? null,
    });
  }, [isEditMode, isProductVoucher, data, form]);

  const onFinish = async (values: VoucherFormValues) => {
    try {
      let payload: Record<string, any>;
      if (activeTab === "product") {
        const productScopeType = Number(values.product_scope_type ?? SCOPE_PRODUCT);
        const productScopeIds = normalizeScopeIds(values.product_scope_ids);
        const normalizedMinPurchase =
          values.product_min_purchase_amount === undefined ||
          values.product_min_purchase_amount === null ||
          String(values.product_min_purchase_amount).trim() === ""
            ? null
            : Number(digitsOnly(String(values.product_min_purchase_amount)));
        const normalizedGiftProductId =
          values.product_gift_product_id === undefined ||
          values.product_gift_product_id === null ||
          String(values.product_gift_product_id).trim() === ""
            ? null
            : Number(values.product_gift_product_id);
        payload = {
          id: values.id ? Number(values.id) : undefined,
          name: String(values.name ?? "").trim(),
          code: String(values.code ?? "").trim(),
          reward_type: 2,
          type: 1,
          qty: Number(values.product_qty ?? 0),
          is_percentage: 2,
          is_active: Number(values.is_active ?? 1),
          started_at: toServerDateTime(values.product_started_at),
          expired_at: toServerDateTime(values.product_expired_at),
          min_purchase_amount:
            normalizedMinPurchase !== null && Number.isFinite(normalizedMinPurchase)
              ? String(normalizedMinPurchase)
              : null,
          per_user_limit:
            values.product_per_user_limit === undefined ||
            values.product_per_user_limit === null ||
            String(values.product_per_user_limit).trim() === ""
              ? null
              : Number(values.product_per_user_limit),
          scope_type: productScopeType,
          scope_ids: productScopeType === SCOPE_ALL ? [] : productScopeIds,
          gift_product_ids:
            normalizedGiftProductId !== null && Number.isFinite(normalizedGiftProductId)
              ? [normalizedGiftProductId]
              : [],
          gift_product_id:
            normalizedGiftProductId !== null && Number.isFinite(normalizedGiftProductId)
              ? normalizedGiftProductId
              : null,
          gift_product_name: values.product_gift_product_name ?? null,
          price: null,
          percentage: null,
          max_disc_price: null,
          is_stackable: Boolean(stackWithOtherPromo),
          is_voucher_stackable: Boolean(stackWithOtherVoucher),
        };
      } else {
        payload = buildVoucherSubmitPayload({
          values,
          limitPerCustomer,
          stackWithOtherPromo,
          stackWithOtherVoucher,
          scopeType,
          scopeAll: SCOPE_ALL,
          normalizeScopeIds,
        });
      }

      if (data) {
        await updateVoucher(payload);
      } else {
        // jangan kirim id saat create
        delete payload.id;
        await createVoucher(payload);
      }

      message.success("Voucher berhasil disimpan.");
      form.resetFields();
      handleClose();
    } catch (err: any) {
      const responseData = err?.response?.data;
      const validationErrors = Array.isArray(responseData?.errors)
        ? responseData.errors
            .map((e: any) => e?.message || e?.field)
            .filter(Boolean)
            .join(", ")
        : "";
      const errMsg =
        validationErrors ||
        responseData?.message ||
        "Gagal menyimpan voucher. Silakan cek field yang wajib diisi.";
      message.error(errMsg, 5);

      // biar kamu langsung liat alasan 422 dari backend
      
    }
  };

  const onFinishFailed = ({ errorFields }: { errorFields?: any[] }) => {
    const firstError = errorFields?.[0]?.errors?.[0];
    message.error(
      firstError || "Form belum valid. Mohon lengkapi field yang wajib diisi.",
    );
  };

  const sectionTextStyle: React.CSSProperties = {
    display: "block",
  };

  const palette = {
    primary700: isDarkMode ? "#f687b3" : "#ae2d68",
    primary200: isDarkMode ? "#6d1d41" : "#f6d4e8",
    primary50: isDarkMode ? "rgba(174, 45, 104, 0.15)" : "#fcf3f8",
    neutral900: isDarkMode ? "#e0e0e0" : "#3d3d3d",
    neutral700: isDarkMode ? "#bdbdbd" : "#4f4f4f",
    neutral400: isDarkMode ? "#aaaaaa" : "#888888",
    neutral100: isDarkMode ? "#333333" : "#e7e7e7",
    success600: isDarkMode ? "#45c52c" : "#319920",
  };

  const sectionCardStyle: React.CSSProperties = {
    border: `1px solid ${palette.primary200}`,
    background: palette.primary50,
    borderRadius: 12,
    marginBottom: 16,
    color: isDarkMode ? "#e0e0e0" : undefined,
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: isDarkMode ? "#f687b3" : palette.primary700,
    marginBottom: 8,
    fontWeight: 700,
  };

  const selectedScopeIds = normalizeScopeIds(scopeIdsValue);
  const isScopeInvalid =
    scopeType !== SCOPE_ALL && selectedScopeIds.length === 0;
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

  const handlePriceChange = (value: string) => {
    form.setFieldValue("price", value ? helper.formatRupiah(value) : "");
  };

  const handleMaxDiscChange = (value: string) => {
    form.setFieldValue(
      "max_disc_price",
      value ? helper.formatRupiah(value) : "",
    );
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

  const handleScopeFocus = () => {
    if (scopeSearchDebounceRef.current) {
      clearTimeout(scopeSearchDebounceRef.current);
    }
    void searchScopeOptions("");
  };

  const handleScopeOpenChange = (open: boolean) => {
    if (!open) return;
    if (scopeSearchDebounceRef.current) {
      clearTimeout(scopeSearchDebounceRef.current);
    }
    void searchScopeOptions("");
  };

  return (
    <Form<VoucherFormValues>
      autoComplete="off"
      form={form}
      name="formVoucher"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item label="ID" name="id" hidden>
        <Input hidden />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label={
              <Space size={6}>
                <InfoCircleOutlined style={{ color: palette.primary700 }} />
                <Typography.Text>Nama Voucher</Typography.Text>
              </Space>
            }
            name="name"
            rules={[{ required: true, message: "Name required" }]}
          >
            <Input placeholder="Contoh: Welcome Voucher" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label={
              <Space size={6}>
                <InfoCircleOutlined style={{ color: palette.primary700 }} />
                <Typography.Text>Kode Voucher</Typography.Text>
              </Space>
            }
            name="code"
            rules={[
              { required: true, message: "Code required" },
              {
                pattern: /^[A-Z0-9]+$/,
                message: "Kode voucher hanya boleh huruf (A–Z) dan angka (0–9), tanpa spasi atau simbol.",
              },
            ]}
          >
            <Input
              placeholder="Contoh: WELCOME10"
              maxLength={30}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                form.setFieldValue("code", cleaned);
              }}
              style={{ textTransform: "uppercase", fontFamily: "monospace" }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          if (isEditMode) return;
          setActiveTab(key as "discount" | "product");
        }}
        destroyOnHidden
        items={[
          {
            key: "discount",
            label: "Potongan Harga",
            disabled: isEditMode && isProductVoucher,
            children: (
              <VoucherDiscountTab
                typeDisc={typeDisc}
                setTypeDisc={setTypeDisc}
                onMaxDiscChange={handleMaxDiscChange}
                onPriceChange={handlePriceChange}
                qtyMode={qtyMode}
                onQtyModeChange={handleQtyModeChange}
                unlimitedQty={UNLIMITED_QTY}
                sectionTextStyle={sectionTextStyle}
                limitPerCustomer={limitPerCustomer}
                perUserLimitValue={perUserLimitValue}
                onLimitPerCustomerToggle={handleLimitPerCustomerToggle}
                timeLimitEnabled={timeLimitEnabled}
                onTimeLimitToggle={handleTimeLimitToggle}
                palette={palette}
                sectionCardStyle={sectionCardStyle}
                sectionTitleStyle={sectionTitleStyle}
                scopeType={scopeType}
                scopeAll={SCOPE_ALL}
                scopeBrand={SCOPE_BRAND}
                scopeProduct={SCOPE_PRODUCT}
                scopeVariant={SCOPE_VARIANT}
                onScopeTypeChange={handleScopeTypeChange}
                onScopeIdsChange={handleScopeIdsChange}
                onScopeSearch={runDebouncedScopeSearch}
                onScopeFocus={handleScopeFocus}
                onScopeOpenChange={handleScopeOpenChange}
                scopeLoading={scopeLoading}
                scopeNotFoundContent={scopeNotFoundContent}
                scopePlaceholder={scopePlaceholder}
                scopeOptions={scopeOptions}
                normalizeScopeIds={normalizeScopeIds}
                isScopeInvalid={isScopeInvalid}
                previewLoading={previewLoading}
                onAddSelected={handleAddSelected}
                previewRows={previewRows}
                pagedPreviewRows={pagedPreviewRows}
                previewPage={previewPage}
                previewPageSize={previewPageSize}
                setPreviewPage={setPreviewPage}
                setPreviewPageSize={setPreviewPageSize}
                formatMoney={formatMoney}
                resolveDiscount={resolveDiscount}
                onRemovePreview={handleRemovePreview}
                stackWithOtherPromo={stackWithOtherPromo}
                setStackWithOtherPromo={setStackWithOtherPromo}
                stackWithOtherVoucher={stackWithOtherVoucher}
                setStackWithOtherVoucher={setStackWithOtherVoucher}
              />
            ),
          },
          {
            key: "product",
            label: "Produk",
            disabled: isEditMode && !isProductVoucher,
            children: (
              <VoucherProductTab
                stackWithOtherPromo={stackWithOtherPromo}
                setStackWithOtherPromo={setStackWithOtherPromo}
                stackWithOtherVoucher={stackWithOtherVoucher}
                setStackWithOtherVoucher={setStackWithOtherVoucher}
              />
            ),
          },
        ]}
      />

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          shape="round"
          block
          disabled={activeTab === "discount" ? isScopeInvalid : false}
        >
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormVoucher;
