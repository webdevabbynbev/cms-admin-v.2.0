import React from "react";
import { message, Modal } from "antd";
import type { FormInstance } from "antd";
import { createDiscount, updateDiscount } from "../../api/discount";
import type { VariantRow } from "./discountFormTypes";
import { clamp, resolveIdentifier } from "./discountFormUtils";

type SubmitHandlersDeps = {
  mode: "create" | "edit";
  form: FormInstance;
  variants: VariantRow[];
  meta: { code: string } | null;
  id: string | undefined;
  nav: (to: string) => void;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

type SubmitOptions = {
  allProducts?: boolean;
  allPercent?: number;
  allMaxDiscount?: number;
};

export const createDiscountSubmitHandlers = (deps: SubmitHandlersDeps) => {
  const { mode, form, variants, meta, id, nav, setLoading } = deps;

  const validateVariantsForSubmit = (
    rows: VariantRow[] = variants,
    options?: SubmitOptions,
  ) => {
    const errors: string[] = [];
    const isAllProducts = Boolean(options?.allProducts);

    for (const r of rows) {
      if (!r.isActive) continue;

      if (!isAllProducts) {
        const hasPercent =
          typeof r.discountPercent === "number" && r.discountPercent > 0;
        const hasPrice =
          typeof r.discountPrice === "number" &&
          r.discountPrice >= 0 &&
          r.discountPrice < r.basePrice;

        if (!hasPercent && !hasPrice) {
          errors.push(
            `${r.productName} • ${r.variantName}: isi Diskon % atau Harga Diskon`,
          );
        }
      }

      if (r.promoStock !== null) {
        if (r.promoStock <= 0)
          errors.push(
            `${r.productName} • ${r.variantName}: Stok Promosi harus > 0`,
          );
        if (r.stock >= 0 && r.promoStock > r.stock) {
          errors.push(
            `${r.productName} • ${r.variantName}: Stok Promosi melebihi stok (${r.stock})`,
          );
        }
      }

      if (r.purchaseLimit !== null) {
        if (r.purchaseLimit <= 0)
          errors.push(
            `${r.productName} • ${r.variantName}: Batas Pembelian harus > 0`,
          );
        if (r.promoStock !== null && r.purchaseLimit > r.promoStock) {
          errors.push(
            `${r.productName} • ${r.variantName}: Batas Pembelian melebihi Stok Promosi (${r.promoStock})`,
          );
        }
      }
    }

    if (errors.length) {
      const preview = errors.slice(0, 6).join("\n• ");
      message.error(
        `Periksa data:\n• ${preview}${errors.length > 6 ? "\n• ..." : ""}`,
      );
      return false;
    }
    return true;
  };

  const buildPayload = (
    rows: VariantRow[] = variants,
    options?: SubmitOptions,
  ) => {
    const values = form.getFieldsValue(true);
    const percentInfo = Number(options?.allPercent ?? NaN);
    const maxInfo = Number(options?.allMaxDiscount ?? NaN);
    const description = options?.allProducts
      ? `[ALL_PRODUCTS]|percent=${Number.isFinite(percentInfo) ? percentInfo : 0}|max=${Number.isFinite(maxInfo) ? Math.round(maxInfo) : 0}`
      : null;

    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}${String(now.getDate()).padStart(2, "0")}${String(
      now.getHours(),
    ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
      now.getSeconds(),
    ).padStart(2, "0")}`;
    const fallbackCode = `PROMO_TOKO_${ts}`;
    const code = mode === "edit" ? meta?.code || fallbackCode : fallbackCode;

    const resolvedAllPercent = Number.isFinite(percentInfo)
      ? clamp(percentInfo, 0, 100)
      : 0;
    const resolvedAllMaxDiscount =
      Number.isFinite(maxInfo) && maxInfo >= 0 ? Math.round(maxInfo) : null;

    const items = rows.map((r) => {
      if (options?.allProducts) {
        return {
          product_variant_id: r.productVariantId,
          product_id: r.productId,
          is_active: r.isActive ? 1 : 0,

          value_type: "percent",
          value: resolvedAllPercent,
          max_discount: resolvedAllMaxDiscount,

          promo_stock: r.promoStock ?? null,
          purchase_limit: r.purchaseLimit ?? null,
        };
      }

      let valueType: "percent" | "fixed" = "percent";
      let value = 0;

      const hasPercent =
        typeof r.discountPercent === "number" && r.discountPercent >= 0;
      const hasPrice =
        typeof r.discountPrice === "number" && r.discountPrice >= 0;

      if (r.lastEdited === "price" && hasPrice) {
        valueType = "fixed";
        value = clamp(
          Math.round(r.basePrice - (r.discountPrice as number)),
          0,
          r.basePrice,
        );
      } else if (r.lastEdited === "percent" && hasPercent) {
        valueType = "percent";
        value = clamp(Number(r.discountPercent), 0, 100);
      } else if (hasPercent) {
        valueType = "percent";
        value = clamp(Number(r.discountPercent), 0, 100);
      } else if (hasPrice) {
        valueType = "fixed";
        value = clamp(
          Math.round(r.basePrice - (r.discountPrice as number)),
          0,
          r.basePrice,
        );
      }

      return {
        product_variant_id: r.productVariantId,
        product_id: r.productId,
        is_active: r.isActive ? 1 : 0,

        value_type: valueType,
        value,
        max_discount: r.maxDiscount ?? null,

        promo_stock: r.promoStock ?? null,
        purchase_limit: r.purchaseLimit ?? null,
      };
    });

    return {
      name: String(values.name ?? "").trim(),
      code,
      description,

      value_type: 1,
      value: 0,
      max_discount: null,

      applies_to: 3,

      is_active: 1,
      is_auto: 1,
      is_ecommerce: 1,
      is_pos: 0,

      started_at: values.started_at || null,
      no_expiry: 0,
      expired_at: values.expired_at || null,
      days_of_week: ["0", "1", "2", "3", "4", "5", "6"],

      items,
    };
  };

  const extractConflictIds = (text: string | null | undefined) => {
    if (!text) return [];
    const ids = new Set<number>();
    const regex = /ID:\s*(\d+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > 0) ids.add(n);
    }
    return Array.from(ids);
  };

  const submitPayload = async (payload: any) => {
    if (mode === "edit") {
      const identifier = resolveIdentifier(id);
      if (!identifier) {
        message.error("Invalid discount identifier");
        nav("/discounts");
        return;
      }
      await updateDiscount(identifier, payload);
      message.success("Promo berhasil diupdate");
    } else {
      await createDiscount(payload);
      message.success("Promo berhasil dibuat");
    }
    nav("/discounts");
  };

  const onSubmit = async (
    overrideVariants?: VariantRow[],
    options?: SubmitOptions,
  ) => {
    try {
      await form.validateFields();
    } catch {
      message.error("Lengkapi field wajib dulu");
      return;
    }

    const activeVariants = overrideVariants ?? variants;

    if (!activeVariants.length) {
      message.error("Tambahkan minimal 1 produk");
      return;
    }

    if (!validateVariantsForSubmit(activeVariants, options)) return;

    const payload = buildPayload(activeVariants, options);

    setLoading(true);
    try {
      await submitPayload(payload);
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const serve = data?.serve;
      const backendMessage =
        data?.message ??
        serve?.message ??
        serve?.error ??
        (Array.isArray(serve?.errors) ? serve.errors.join(", ") : null);

      if (status === 409 && serve?.code === "PROMO_CONFLICT" && serve?.canTransfer) {
        setLoading(false);

        Modal.confirm({
          title: "Produk sedang ikut promo lain",
          content: React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { style: { marginBottom: 8 } },
              "Produk yang kamu pilih sedang ",
              React.createElement("b", null, "aktif"),
              " di promo lain.",
            ),
            React.createElement(
              "div",
              null,
              "Mau ",
              React.createElement("b", null, "dipindahkan ke Discount"),
              "? (Produk akan dikeluarkan dari promo aktif)",
            ),
          ),
          okText: "Ya / Pindahkan",
          cancelText: "Tidak",
          onOk: async () => {
            setLoading(true);
            try {
              const payload2 = { ...payload, transfer: 1 };

              if (mode === "edit") {
                const identifier = resolveIdentifier(id);
                if (!identifier) {
                  message.error("Invalid discount identifier");
                  nav("/discounts");
                  return;
                }
                await updateDiscount(identifier, payload2);
                message.success(
                  "Promo diupdate + produk dipindahkan dari promo aktif",
                );
              } else {
                await createDiscount(payload2);
                message.success(
                  "Promo dibuat + produk dipindahkan dari promo aktif",
                );
              }

              nav("/discounts");
            } catch (err2: any) {
              message.error(
                err2?.response?.data?.message ?? "Gagal transfer & simpan",
              );
            } finally {
              setLoading(false);
            }
          },
        });

        return;
      }

      const conflictIds = extractConflictIds(backendMessage);
      if (conflictIds.length) {
        setLoading(false);
        Modal.confirm({
          title: "Varian konflik terdeteksi",
          content: React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { style: { marginBottom: 8 } },
              `Ada ${conflictIds.length} varian yang sedang aktif di promo lain (sale/flash sale).`,
            ),
            React.createElement(
              "div",
              null,
              "Lanjutkan simpan dengan menghapus varian konflik dari payload?",
            ),
          ),
          okText: "Lanjutkan",
          cancelText: "Batal",
          onOk: async () => {
            const filtered = activeVariants.filter(
              (r) => !conflictIds.includes(r.productVariantId),
            );
            if (!filtered.length) {
              message.error("Semua varian konflik. Tidak ada yang bisa disimpan.");
              return;
            }
            const payload2 = buildPayload(filtered, options);
            setLoading(true);
            try {
              await submitPayload(payload2);
            } catch (err2: any) {
              message.error(
                err2?.response?.data?.message ?? "Gagal simpan promo",
              );
            } finally {
              setLoading(false);
            }
          },
        });
        return;
      }

      if (status === 500) {
        message.error(backendMessage ?? "Server error saat simpan promo");
        return;
      }

      message.error(backendMessage ?? "Gagal simpan promo");
    } finally {
      setLoading(false);
    }
  };

  return {
    validateVariantsForSubmit,
    buildPayload,
    onSubmit,
  };
};
