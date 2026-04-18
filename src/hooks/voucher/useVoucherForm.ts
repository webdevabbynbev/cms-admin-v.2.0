import { Form } from "antd";
import { type Dayjs } from "dayjs";
import type { FormInstance } from "antd/es/form";
import type { MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useThemeStore } from "../useThemeStore";

type VoucherData = {
  id?: number | string;
  name?: string;
  code?: string;
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

export type VoucherFormValues = {
  id?: number | string;
  name: string;
  code: string;
  min_purchase_amount?: number | string | null;
  type: number | null;
  price?: string;
  max_disc_price?: string;
  percentage?: string;
  started_at: Dayjs | null;
  expired_at: Dayjs | null;
  is_percentage: number;
  is_active: number;
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

export type ScopeOption = {
  value: number;
  label: string;
};

export type PreviewRow = {
  key: string;
  scopeType: number;
  sourceScopeType: number;
  sourceScopeId: number;
  id: number;
  name: string;
  price: number;
};

type UseFormVoucherHooksArgs = {
  data?: VoucherData;
  scopeAll: number;
  unlimitedQty: number;
  formatRupiah: (value: number | string) => string;
  toDatePickerValue: (value?: string) => Dayjs | null;
  parseBooleanInput: (raw: any, fallback?: boolean) => boolean;
};

export const useFormVoucherHooks = ({
  data,
  scopeAll,
  unlimitedQty,
  formatRupiah,
  toDatePickerValue,
  parseBooleanInput,
}: UseFormVoucherHooksArgs) => {
  const { isDarkMode } = useThemeStore();
  const [typeDisc, setTypeDisc] = useState<number>(data?.isPercentage ?? 1);
  const [qtyMode, setQtyMode] = useState<"unlimited" | "limited">("limited");
  const [prevLimitedQty, setPrevLimitedQty] = useState<number | string>(0);
  const [timeLimitEnabled, setTimeLimitEnabled] = useState<boolean>(true);
  const [limitPerCustomer, setLimitPerCustomer] = useState<boolean>(true);
  const [stackWithOtherPromo, setStackWithOtherPromo] = useState<boolean>(true);
  const [stackWithOtherVoucher, setStackWithOtherVoucher] =
    useState<boolean>(true);
  const scopeBrand = scopeAll + 1;
  const [scopeType, setScopeType] = useState<number>(data?.scopeType ?? scopeBrand);
  const [scopeOptions, setScopeOptions] = useState<ScopeOption[]>([]);
  const [scopeLoading, setScopeLoading] = useState<boolean>(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(10);
  const selectedScopeIdsRef = useRef<number[]>([]);
  const scopeSearchSeqRef = useRef(0);
  const scopeOptionsCacheRef = useRef<Map<string, ScopeOption[]>>(new Map());
  const scopeSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [prevPerUserLimit, setPrevPerUserLimit] = useState<number | string>(1);
  const [prevTimeRange, setPrevTimeRange] = useState<{
    started_at?: Dayjs | null;
    expired_at?: Dayjs | null;
  }>({});
  const [form] = Form.useForm<VoucherFormValues>();
  const perUserLimitValue = Form.useWatch("per_user_limit", form);
  const scopeIdsValue = Form.useWatch("scope_ids", form);
  const watchPercentage = Form.useWatch("percentage", form);
  const watchAmount = Form.useWatch("price", form);
  const watchMaxDisc = Form.useWatch("max_disc_price", form);
  const watchVoucherType = Form.useWatch("type", form);
  const watchIsPercentage = Form.useWatch("is_percentage", form);

  const pagedPreviewRows = useMemo(() => {
    const start = (previewPage - 1) * previewPageSize;
    return previewRows.slice(start, start + previewPageSize);
  }, [previewRows, previewPage, previewPageSize]);

  const init: VoucherFormValues = useMemo(() => {
    return {
      id: data?.id ?? "",
      name: data?.name ?? "",
      code: data?.code ?? "",
      min_purchase_amount:
        data?.min_purchase_amount === undefined || data?.min_purchase_amount === null
          ? null
          : data?.min_purchase_amount,
      type: data?.type ?? null,
      price: data?.price != null ? formatRupiah(data.price) : "",
      max_disc_price:
        data?.maxDiscPrice != null ? formatRupiah(data.maxDiscPrice) : "",
      percentage: data?.percentage != null ? String(data.percentage) : "",
      started_at: data?.startedAt ? toDatePickerValue(data.startedAt) : null,
      expired_at: data?.expiredAt ? toDatePickerValue(data.expiredAt) : null,
      is_percentage: data?.isPercentage ?? 1,
      is_active: data?.isActive ?? 1,
      qty: data?.qty ?? 0,
      per_user_limit: data
        ? data?.perUserLimit === undefined || data?.perUserLimit === null
          ? null
          : data?.perUserLimit
        : 1,
      scope_type: Number(data?.scopeType ?? (scopeAll + 1)),
      scope_ids: Array.isArray(data?.scopeIds)
        ? data?.scopeIds
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0)
        : [],
    };
  }, [data, formatRupiah, scopeAll, toDatePickerValue]);

  const resolvePromoStackable = (raw: any, fallback = true) =>
    parseBooleanInput(raw, fallback);

  const resolveVoucherStackable = (raw: any, fallback = true) =>
    parseBooleanInput(raw, fallback);

  return {
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
    unlimitedQty,
    resolvePromoStackable,
    resolveVoucherStackable,
  };
};

type UseFormVoucherInitEffectArgs = {
  form: FormInstance<VoucherFormValues>;
  init: VoucherFormValues;
  scopeAll: number;
  unlimitedQty: number;
  data?: VoucherData;
  setTypeDisc: (value: number) => void;
  setScopeType: (value: number) => void;
  setQtyMode: (value: "unlimited" | "limited") => void;
  setPrevLimitedQty: (value: number | string) => void;
  setTimeLimitEnabled: (value: boolean) => void;
  setLimitPerCustomer: (value: boolean) => void;
  setPrevPerUserLimit: (value: number | string) => void;
  setStackWithOtherPromo: (value: boolean) => void;
  setStackWithOtherVoucher: (value: boolean) => void;
  setPrevTimeRange: (value: {
    started_at?: Dayjs | null;
    expired_at?: Dayjs | null;
  }) => void;
  resolvePromoStackable: (raw: any, fallback?: boolean) => boolean;
  resolveVoucherStackable: (raw: any, fallback?: boolean) => boolean;
  hydrateScopeOptionsByIds: (nextScopeType: number, ids: number[]) => Promise<void>;
};

export const useFormVoucherInitEffect = ({
  form,
  init,
  scopeAll,
  unlimitedQty,
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
}: UseFormVoucherInitEffectArgs) => {
  useEffect(() => {
    form.setFieldsValue(init);
    setTypeDisc(init.is_percentage);
    setScopeType(Number(init.scope_type ?? (scopeAll + 1)));

    const initQty = Number(init.qty ?? 0);
    const isUnlimited = initQty >= unlimitedQty;
    setQtyMode(isUnlimited ? "unlimited" : "limited");
    setPrevLimitedQty(isUnlimited ? 0 : initQty);
    setTimeLimitEnabled(true);

    const hasLimit =
      init.per_user_limit !== null && init.per_user_limit !== undefined;
    setLimitPerCustomer(hasLimit);
    setPrevPerUserLimit(hasLimit ? (init.per_user_limit as number) : 1);

    const rawStackable =
      (data as any)?.isStackable ??
      (data as any)?.is_stackable ??
      (data as any)?.stackable ??
      (data as any)?.can_stack;
    const resolvedPromoStackable = resolvePromoStackable(rawStackable, true);
    setStackWithOtherPromo(resolvedPromoStackable);

    const rawVoucherStackable =
      (data as any)?.isVoucherStackable ??
      (data as any)?.is_voucher_stackable ??
      (data as any)?.voucher_stackable ??
      (data as any)?.can_stack_voucher;
    const resolvedVoucherStackable = resolveVoucherStackable(
      rawVoucherStackable,
      resolvedPromoStackable,
    );
    setStackWithOtherVoucher(resolvedVoucherStackable);

    setPrevTimeRange({
      started_at: init.started_at,
      expired_at: init.expired_at,
    });

    void hydrateScopeOptionsByIds(
      Number(init.scope_type ?? (scopeAll + 1)),
      Array.isArray(init.scope_ids) ? init.scope_ids : [],
    );
  }, [init, form]); // eslint-disable-line react-hooks/exhaustive-deps
};

type UseFormVoucherVariantScopeEffectArgs = {
  scopeType: number;
  scopeVariant: number;
  searchScopeOptions: (keyword: string) => Promise<void>;
};

export const useFormVoucherVariantScopeEffect = ({
  scopeType,
  scopeVariant,
  searchScopeOptions,
}: UseFormVoucherVariantScopeEffectArgs) => {
  useEffect(() => {
    if (scopeType !== scopeVariant) return;
    void searchScopeOptions("");
  }, [scopeType]); // eslint-disable-line react-hooks/exhaustive-deps
};

type UseFormVoucherDebounceCleanupArgs = {
  scopeSearchDebounceRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
};

export const useFormVoucherDebounceCleanup = ({
  scopeSearchDebounceRef,
}: UseFormVoucherDebounceCleanupArgs) => {
  useEffect(
    () => () => {
      if (scopeSearchDebounceRef.current) {
        clearTimeout(scopeSearchDebounceRef.current);
      }
    },
    [scopeSearchDebounceRef],
  );
};

type UseFormVoucherSyncSelectedScopeIdsArgs = {
  scopeIdsValue: unknown;
  selectedScopeIdsRef: MutableRefObject<number[]>;
  normalizeScopeIds: (raw: unknown) => number[];
};

export const useFormVoucherSyncSelectedScopeIds = ({
  scopeIdsValue,
  selectedScopeIdsRef,
  normalizeScopeIds,
}: UseFormVoucherSyncSelectedScopeIdsArgs) => {
  useEffect(() => {
    selectedScopeIdsRef.current = normalizeScopeIds(scopeIdsValue);
  }, [scopeIdsValue]); // eslint-disable-line react-hooks/exhaustive-deps
};

type UseFormVoucherResetPreviewPageArgs = {
  scopeType: number;
  setPreviewPage: (value: number) => void;
};

export const useFormVoucherResetPreviewPage = ({
  scopeType,
  setPreviewPage,
}: UseFormVoucherResetPreviewPageArgs) => {
  useEffect(() => {
    setPreviewPage(1);
  }, [scopeType, setPreviewPage]);
};
