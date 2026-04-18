import React from "react";
import {
  Button,
  Row,
  Col,
  Card,
  Modal,
  Form,
  Input,
  notification,
  message,
} from "antd";
import { DeleteOutlined, UndoOutlined } from "@ant-design/icons";
import MainLayout from "../layout/MainLayout";
import http from "../api/http";
import helper from "../utils/helper";
import FormBasic from "../components/Forms/Product/FormBasic";
import FormCategory from "../components/Forms/Product/FormCategory";
import FormAttribute from "../components/Forms/Product/FormAttribute";
import type {
  AttributeRow,
  CombinationRow,
} from "../components/Forms/Product/FormAttribute";
import FormSeo from "../components/Forms/Product/FormSeo";
import { useNavigate } from "react-router-dom";

type FlatCategory = { id: number; pathLabel: string };

type MediaItem = {
  url: string;
  type: 1 | 2;
};

type CategoryNode = {
  id: number;
  name: string;
  children?: CategoryNode[];
};

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<any>();
  const [isUpdate, setIsUpdate] = React.useState<number | null>(null);
  const [attributes, setAttributes] = React.useState<AttributeRow[]>([]);
  const [combinations, setCombinations] = React.useState<CombinationRow[]>([]);
  const [medias, setMedias] = React.useState<MediaItem[]>([]);
  const [categories, setCategories] = React.useState<FlatCategory[]>([]);
  const [catLoading, setCatLoading] = React.useState<boolean>(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const isInitialized = React.useRef(false);
  const didInitEffect = React.useRef(false);
  const initialFormSnapshot = React.useRef<string>("{}");
  const initialStateSnapshot = React.useRef<string>('{"attributes":[],"combinations":[],"medias":[]}');

  const normalizeFormValues = React.useCallback((values: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {};
    for (const key of Object.keys(values)) {
      const val = values[key];
      result[key] = (val === null || val === undefined) ? "" : val;
    }
    return result;
  }, []);

  const recomputeDirty = React.useCallback((
    currentAttrs: AttributeRow[],
    currentCombos: CombinationRow[],
    currentMedias: MediaItem[],
  ) => {
    if (!isInitialized.current) return;
    const formDirty = JSON.stringify(normalizeFormValues(form.getFieldsValue())) !== initialFormSnapshot.current;
    const stateDirty =
      JSON.stringify({ attributes: currentAttrs, combinations: currentCombos, medias: currentMedias }) !==
      initialStateSnapshot.current;
    setIsDirty(formDirty || stateDirty);
  }, [form, normalizeFormValues]);

  React.useEffect(() => {
    recomputeDirty(attributes, combinations, medias);
  }, [attributes, combinations, medias, recomputeDirty]);

  const normalizeStatus = (value?: string | number | null) => {
    if (value === null || value === undefined) return "draft";
    const normalized = String(value).toLowerCase();
    if (["draft", "normal", "war"].includes(normalized)) return normalized;
    if (
      ["published", "active", "normal_product", "normal product"].includes(
        normalized,
      )
    ) {
      return "normal";
    }
    return "draft";
  };

  const fetchProductDetail = React.useCallback(
    async (id: string, duplication = false) => {
      try {
        const res = await http.get(`/admin/product/${id}`);
        const product = res?.data?.serve;
        if (!product) return;

        if (!duplication) {
          setIsUpdate(product.id);
        } else {
          setIsUpdate(null);
        }

        const allMedias: any[] = product.medias?.length ? product.medias : [];
        // Separate product-level medias from variant-specific medias
        const hasVariantMedias = allMedias.some((m: any) => m.variant_id || m.variantId);
        const initialMedias = hasVariantMedias
          ? allMedias.filter((m: any) => !m.variant_id && !m.variantId)
          : allMedias;
        if (initialMedias.length) setMedias(initialMedias);

        // Build map: variantId -> first image URL for that variant
        const variantMediaMap: Record<number, string> = {};
        allMedias.forEach((m: any) => {
          const vid = m.variant_id || m.variantId;
          if (vid && !variantMediaMap[vid]) {
            variantMediaMap[vid] = m.url;
          }
        });

        let initialAttrs: AttributeRow[] = [];
        let initialCombos: CombinationRow[] = [];

        if (product.variants?.length) {
          const transformed = transformToStructuredData(product.variants, duplication, variantMediaMap);
          initialAttrs = transformed.attributes;
          initialCombos = transformed.combinations;
          setAttributes(initialAttrs);
          setCombinations(initialCombos);
        }

        initialStateSnapshot.current = JSON.stringify({
          attributes: initialAttrs,
          combinations: initialCombos,
          medias: initialMedias,
        });

        const firstVariant = product.variants?.[0] || {};

        const how_to_use =
          product.how_to_use ||
          product.howToUse ||
          firstVariant.how_to_use ||
          firstVariant.howToUse;

        const ingredients =
          product.ingredients ||
          firstVariant.ingredients ||
          firstVariant?.ingredients;

        const bpom = product.bpom || firstVariant.bpom;

        const toArray = (val: any) => {
          if (Array.isArray(val)) return val;
          const str = String(val || "").trim();
          if (!str) return [];
          return str.split(",").map((s) => s.trim()).filter(Boolean);
        };

        const toNumberOrEmpty = (val: any) => {
          if (val === null || val === undefined || val === "") return "";
          const n = Number(val);
          return Number.isFinite(n) ? n : "";
        };

        const hasVariants = (product.variants || []).some((v: any) => {
          const attrs =
            v.variantAttributes || v.attributes || v.attribute_values || [];
          return Array.isArray(attrs) && attrs.length > 0;
        });

        const basePriceRaw = hasVariants
          ? ""
          : firstVariant.base_price ??
            firstVariant.basePrice ??
            "";

        const priceRaw = hasVariants
          ? ""
          : firstVariant.price ??
            firstVariant.base_price ??
            firstVariant.basePrice ??
            "";

        const concernIds =
          product.concern_option_ids ||
          product.concernOptions?.map((c: any) => c.id) ||
          product.concern_options?.map((c: any) => c.id) ||
          [];

        const profileIds =
          product.profile_category_option_ids ||
          product.profileOptions?.map((p: any) => p.id) ||
          product.profile_category_options?.map((p: any) => p.id) ||
          [];

        const catIdsSet = new Set<number>();
        const addCatId = (raw: any) => {
          const n = Number(raw);
          if (Number.isFinite(n) && n > 0) catIdsSet.add(n);
        };
        addCatId(product.category_type_id);
        if (product.category_types)
          product.category_types.forEach((c: any) => addCatId(c?.id));
        if (product.categoryTypes)
          product.categoryTypes.forEach((c: any) => addCatId(c?.id));

        const extFirst =
          firstVariant?.extendedAttributes ||
          firstVariant?.extended_attributes ||
          {};

        form.setFieldsValue({
          name: duplication ? `${product.name} (Copy)` : product.name,
          description: product.description,
          how_to_use,
          ingredients,
          bpom,
          base_price:
            toNumberOrEmpty(basePriceRaw) === ""
              ? ""
              : helper.formatRupiah(Number(basePriceRaw)),
          price:
            toNumberOrEmpty(priceRaw) === ""
              ? ""
              : helper.formatRupiah(Number(priceRaw)),
          weight: hasVariants ? 0 : Number(firstVariant.weight ?? 0),
          master_sku: duplication
            ? ""
            : product.master_sku || product.masterSku,
          status: duplication ? "draft" : normalizeStatus(product.status),
          brand_id: (() => {
            const n = Number(product.brand_id ?? product.brandId);
            return Number.isFinite(n) && n > 0 ? n : undefined;
          })(),
          persona_id: (() => {
            const n = Number(product.persona_id ?? product.personaId);
            return Number.isFinite(n) && n > 0 ? n : undefined;
          })(),
          meta_ai: product.meta_ai || 1,
          meta_title: product.meta_title || product.metaTitle,
          meta_description:
            product.meta_description || product.metaDescription,
          meta_keywords: product.meta_keywords || product.metaKeywords,
          concern_option_ids: concernIds,
          profile_category_option_ids: profileIds,
          category_type_id: Array.from(catIdsSet),
          sku_variant_1:
            firstVariant.sku_variant_1 || firstVariant.skuVariant1,
          barcode: firstVariant.barcode,
          stock: firstVariant.stock,
          main_accords: toArray(
            product.main_accords ||
              product.mainAccords ||
              extFirst.main_accords ||
              extFirst.mainAccords
          ),
          top_notes: toArray(
            product.top_notes ||
              product.topNotes ||
              extFirst.top_notes ||
              extFirst.topNotes
          ),
          middle_notes: toArray(
            product.middle_notes ||
              product.middleNotes ||
              extFirst.middle_notes ||
              extFirst.middleNotes
          ),
          base_notes: toArray(
            product.base_notes ||
              product.baseNotes ||
              extFirst.base_notes ||
              extFirst.baseNotes
          ),
          perfume_for:
            product.perfume_for ||
            product.perfumeFor ||
            extFirst.perfume_for ||
            extFirst.perfumeFor,
          finish: product.finish || extFirst.finish,
          warna: toArray(product.warna || extFirst.warna),
        });
      } catch (err: any) {
        
        message.error("Failed to fetch product detail.");
      } finally {
        setTimeout(() => {
          initialFormSnapshot.current = JSON.stringify(
            normalizeFormValues(form.getFieldsValue())
          );
          isInitialized.current = true;
        }, 0);
      }
    },
    [form, normalizeFormValues]
  );

  React.useEffect(() => {
    if (didInitEffect.current) return;
    didInitEffect.current = true;

    const fetchCategoryTypes = async () => {
      try {
        setCatLoading(true);
        const res = await http.get("/admin/category-types/list");
        const serve: CategoryNode[] = Array.isArray(res?.data?.serve)
          ? res.data.serve
          : [];

        const out: FlatCategory[] = [];
        const walk = (node: CategoryNode, prefix: string[] = []) => {
          const path = [...prefix, node.name];
          out.push({ id: node.id, pathLabel: path.join(" / ") });
          if (Array.isArray(node.children)) {
            node.children.forEach((c) => walk(c, path));
          }
        };
        serve.forEach((n) => walk(n));
        setCategories(out);
      } catch (e) {
        
        setCategories([]);
      } finally {
        setCatLoading(false);
      }
    };

    fetchCategoryTypes();

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const mode = params.get("mode");
    const isDup = window.location.pathname.includes("product-duplicate") || mode === "duplicate";

    if (id) {
      fetchProductDetail(id, isDup);
    } else {
      setTimeout(() => {
        initialFormSnapshot.current = JSON.stringify(normalizeFormValues(form.getFieldsValue()));
        isInitialized.current = true;
      }, 0);
    }
  }, [fetchProductDetail, form, normalizeFormValues]);

  const transformToStructuredData = (
    variants: any[],
    duplication = false,
    variantMediaMap: Record<number, string> = {},
  ) => {
    const attributes: Record<string, AttributeRow> = {};
    const combinations: CombinationRow[] = [];

    // Extended attrs stored in attribute_values must NOT appear in the combination selector.
    // Legacy injected attrs have no attr.attribute.name → include them (safe fallback).
    const EXTENDED_ATTR_NAMES = new Set([
      "skintone", "undertone", "finish", "warna",
      "main accords", "top notes", "middle notes", "base notes",
      "perfume for", "variant tags",
    ])

    variants.forEach((variant, index) => {
      // Backend can return attributes either as 'attributes' (preloaded relation name)
      // or 'variantAttributes' (some presenters rename it).
      const allVariantAttrs: any[] = variant.variantAttributes || variant.attributes || variant.attribute_values || [];

      // Exclude known extended attributes; keep legacy injected attrs (no name) as combo attrs.
      const variantAttrs = allVariantAttrs.filter((attr: any) => {
        const name = String(attr.attribute?.name || "").toLowerCase()
        if (!name) return true   // legacy path — no name available, treat as combo attr
        return !EXTENDED_ATTR_NAMES.has(name)
      })

      variantAttrs.forEach((attr: any) => {
        // Lucid serializes to camelCase, but some paths use snake_case
        const attrId: number = attr.attributeId || attr.attribute_id;
        // The display value of this attribute value entry
        const displayValue: string = attr.value || attr.label || "";
        // The ID used as combination key — attribute_value row id
        const valueId: number = attr.id;

        const attrOption = { label: displayValue, value: valueId };

        if (attrId && !attributes[attrId]) {
          attributes[attrId] = { attribute_id: attrId, values: [] };
        }
        if (attrId) {
          const exists = attributes[attrId].values.some((v) => v.value === valueId);
          if (!exists) attributes[attrId].values.push(attrOption);
        }
      });

      // Build the combination array (list of attribute_value IDs) — combo attrs only
      const combination = variantAttrs.map((attr: any) => attr.id);
      // Build display labels from the same attrs
      const display = variantAttrs.map((attr: any) => attr.value || attr.label || "");

      // Fallback: if display is empty or all blank, use sku_variant_1 or a numbered label.
      // NOTE: Never use variant.sku here — that's the auto-generated full SKU code, not a combination name.
      const fallbackName = variant.sku_variant_1 || variant.skuVariant1 || variant.name;

      const finalDisplay =
        display.length > 0 && display.some((d: string) => d)
          ? display
          : fallbackName
            ? [fallbackName]
            : [`Variant ${index + 1}`];

      const ext = variant.extendedAttributes || variant.extended_attributes || {};

      // Collect extended attribute values from attribute_values table (multiple rows per attribute).
      // e.g. 3 rows for Skintone → ["Fair to Light","Light","Light to Medium"] → joined as pipe string.
      const extAttrMap: Record<string, string[]> = {}
      for (const attr of allVariantAttrs) {
        const name = String(attr.attribute?.name || "").toLowerCase()
        if (!name || !EXTENDED_ATTR_NAMES.has(name)) continue
        const val = String(attr.value || "").trim()
        if (val) {
          if (!extAttrMap[name]) extAttrMap[name] = []
          extAttrMap[name].push(val)
        }
      }
      // Prefer attribute_values rows; fall back to legacy extendedAttributes table.
      const getExtStr = (attrName: string, legacyVal?: string) =>
        extAttrMap[attrName]?.join('|') || legacyVal || undefined
      const getExtArr = (attrName: string, legacyArr?: string[]) =>
        extAttrMap[attrName]?.length ? extAttrMap[attrName] : (legacyArr || [])

      const formatMoney = (val: any) => {
        if (val === null || val === undefined || val === "") return "";
        const num = Number(val);
        if (!Number.isFinite(num)) return "";
        return helper.formatRupiah(num);
      };

      const variantBasePriceRaw =
        variant.base_price ??
        variant.basePrice ??
        variant.price ??
        "";
      const variantPriceRaw =
        variant.price ??
        variant.base_price ??
        variant.basePrice ??
        "";

      const variantWeightRaw = variant.weight ?? variant.variant_weight ?? 0;
      const variantWeightNum = Number(variantWeightRaw);
      const resolvedWeight =
        Number.isFinite(variantWeightNum) && variantWeightNum > 0
          ? variantWeightNum
          : 0;

      combinations.push({
        key: index,
        id: duplication ? undefined : variant.id,
        combination,
        display: finalDisplay,
        base_price: formatMoney(variantBasePriceRaw),
        price: formatMoney(variantPriceRaw),
        stock: variant.stock,
        weight: resolvedWeight,
        sku: duplication ? "" : variant.sku,
        sku_variant_1: variant.sku_variant_1 || variant.skuVariant1,
        barcode: duplication ? "" : variant.barcode,
        photo_variant: duplication ? undefined : variantMediaMap[variant.id],
        bpom: variant.bpom,
        skintone: getExtStr("skintone", ext.skintone || variant.skintone),
        undertone: getExtStr("undertone", ext.undertone || variant.undertone),
        finish: getExtStr("finish", ext.finish || variant.finish),
        warna: getExtStr("warna", ext.warna || variant.warna),
        perfume_for: getExtStr("perfume for", ext.perfume_for || ext.perfumeFor || variant.perfume_for),
        main_accords: getExtArr("main accords",
          ext.main_accords || ext.mainAccords ||
          (variant.main_accords ? variant.main_accords.split(',').map((s: any) => s.trim()) : [])),
        top_notes: getExtArr("top notes",
          ext.top_notes || ext.topNotes ||
          (variant.top_notes ? variant.top_notes.split(',').map((s: any) => s.trim()) : [])),
        middle_notes: getExtArr("middle notes",
          ext.middle_notes || ext.middleNotes ||
          (variant.middle_notes ? variant.middle_notes.split(',').map((s: any) => s.trim()) : [])),
        base_notes: getExtArr("base notes",
          ext.base_notes || ext.baseNotes ||
          (variant.base_notes ? variant.base_notes.split(',').map((s: any) => s.trim()) : [])),
      });
    });

    const sortedAttributes = Object.values(attributes).sort((a, b) => (Number(a.attribute_id) - Number(b.attribute_id)));
    return { attributes: sortedAttributes, combinations };
  };

  const onFinish = async (values: any) => {
    const combinationsArr = combinations || [];
    const barcodes = combinationsArr.map(c => String(c.barcode || "").trim()).filter(Boolean);
    const uniqueBarcodes = new Set(barcodes);
    if (barcodes.length !== uniqueBarcodes.size) {
      notification.error({
        message: "Duplicate Barcode Found",
        description: "Each variant must have a unique Barcode / SKU Varian 2 within the same product.",
        placement: "bottomRight",
      });
      return;
    }

    try {
      const safeNumber = (v: any) => {
        if (v === null || v === undefined || v === "") return 0;
        if (typeof v === "number") return v;
        let s = String(v)
          .replace(/Rp\.?\s?/gi, "")
          .trim();
        const hasCommaDecimal = s.match(/,\d{2}$/);
        if (hasCommaDecimal) {
          s = s.replace(/\./g, "").replace(",", ".");
        } else {
          s = s.replace(/\./g, "");
        }
        const num = parseFloat(s);
        return isFinite(num) ? num : 0;
      };

      const safeNumberArray = (v: any) => {
        if (!v) return [];
        const arr = Array.isArray(v) ? v : [v];
        return arr.map((item) => Number(item)).filter((n) => !isNaN(n));
      };

      const category_type_ids = safeNumberArray(values.category_type_id);
      const concern_option_ids = safeNumberArray(values.concern_option_ids);
      const profile_category_option_ids = [
        ...safeNumberArray(values.skintone_ids),
        ...safeNumberArray(values.undertone_ids),
        ...safeNumberArray(values.profile_category_option_ids), // keep existing if any
      ];
      // Filter unique
      const uniqueProfileIds = Array.from(new Set(profile_category_option_ids));

      const isVariantPayloadMode =
        attributes.length > 0 ||
        combinations.length > 1 ||
        combinations.some((c) => c.combination.length > 0);

      const payload = {
        name: values.name,
        description: values.description,
        base_price: safeNumber(values.base_price),
        weight: Number(values.weight) || 0,
        status: normalizeStatus(values.status),
        is_flashsale: Boolean(values.is_flashsale),
        category_type_id:
          category_type_ids.length > 0 ? category_type_ids[0] : null,
        category_type_ids: category_type_ids,
        brand_id: values.brand_id ? Number(values.brand_id) : null,
        persona_id: values.persona_id ? Number(values.persona_id) : null,
        concern_option_ids,
        profile_category_option_ids: uniqueProfileIds,
        master_sku: values.master_sku,
        medias,
        how_to_use: values.how_to_use,
        ingredients: values.ingredients,
        bpom: values.bpom,
        main_accords: Array.isArray(values.main_accords) ? values.main_accords.join(', ') : values.main_accords,
        top_notes: Array.isArray(values.top_notes) ? values.top_notes.join(', ') : values.top_notes,
        middle_notes: Array.isArray(values.middle_notes) ? values.middle_notes.join(', ') : values.middle_notes,
        base_notes: Array.isArray(values.base_notes) ? values.base_notes.join(', ') : values.base_notes,
        perfume_for: values.perfume_for,
        finish: values.finish,
        warna: Array.isArray(values.warna) ? values.warna.join(', ') : values.warna,
        variants: isVariantPayloadMode
          ? (combinations || []).map((c) => ({
            id: c.id,
            combination: c.combination,
            price: safeNumber(c.price || c.base_price),
            base_price: safeNumber(c.base_price) || null,
            stock: Number(c.stock) || 0,
            sku: c.sku,
            sku_variant_1: c.sku_variant_1,
            barcode: c.barcode,
            bpom: c.bpom,
            ingredients: values.ingredients,
            weight: Number(c.weight ?? values.weight) || 0,
            skintone: c.skintone,
            undertone: c.undertone,
            finish: c.finish,
            warna: c.warna,
            perfume_for: c.perfume_for,
            main_accords: Array.isArray(c.main_accords) ? c.main_accords.join(', ') : c.main_accords,
            top_notes: Array.isArray(c.top_notes) ? c.top_notes.join(', ') : c.top_notes,
            middle_notes: Array.isArray(c.middle_notes) ? c.middle_notes.join(', ') : c.middle_notes,
            base_notes: Array.isArray(c.base_notes) ? c.base_notes.join(', ') : c.base_notes,
            photo_variant: c.photo_variant,
          }))
          : [{
            id: isUpdate && combinations?.[0]?.id ? combinations[0].id : undefined,
            price: safeNumber(values.price) || safeNumber(values.base_price),
            base_price: safeNumber(values.base_price),
            stock: Number(values.stock) || 0,
            sku_variant_1: values.sku_variant_1,
            barcode: values.barcode,
            combination: [],
            bpom: values.bpom,
            ingredients: values.ingredients,
            weight: Number(values.weight) || 0,
          }],
        meta_ai: values.meta_ai,
        meta_title: values.meta_title,
        meta_description: values.meta_description,
        meta_keywords: values.meta_keywords,
      };

      const hide = message.loading(
        isUpdate ? "Updating product..." : "Creating product...",
        0,
      );
      try {
        const requestConfig = { timeout: 120000 };
        if (isUpdate) {
          await http.put(`/admin/product/${isUpdate}`, payload, requestConfig);
        } else {
          await http.post(`/admin/product`, payload, requestConfig);
        }
        hide();
        setIsDirty(false);
        initialFormSnapshot.current = JSON.stringify(normalizeFormValues(form.getFieldsValue()));
        initialStateSnapshot.current = JSON.stringify({ attributes, combinations, medias });
        message.success(
          isUpdate
            ? "Product updated successfully!"
            : "Product created successfully!",
        );

        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.delete("id");
          urlParams.delete("mode");
          const search = urlParams.toString();
          navigate(`/master-product${search ? "?" + search : ""}`);
        }, 500);
      } catch (err: any) {
        hide();
        
        const errorData = err?.response?.data;
        const isTimeout =
          err?.code === "ECONNABORTED" ||
          String(err?.message || "").toLowerCase().includes("timeout");
        const mainMessage = isTimeout
          ? "Request timeout. Server masih memproses, coba refresh atau cek data terlebih dulu."
          : errorData?.message || "Failed to save product.";
        const validationErrors = errorData?.errors;
        let description = "";
        if (Array.isArray(validationErrors)) {
          description = validationErrors.map((e: any) => `${e.field}: ${e.message}`).join("\n");
        } else if (validationErrors && typeof validationErrors === "object") {
          description = Object.entries(validationErrors)
            .map(([field, msg]: any) => `${field}: ${msg}`)
            .join("\n");
        } else {
          description = err?.stack || "";
        }
        notification.error({
          message: mainMessage,
          description: <pre style={{ whiteSpace: "pre-wrap" }}>{description}</pre>,
          placement: "bottomRight",
          duration: 10,
        });
      }
    } catch (err: any) {
      
      notification.error({
        message: err?.message || "Unexpected error in onFinish.",
        description: err?.stack,
        placement: "bottomRight",
      });
    }
  };

  const onFinishFailed = () => {
    notification.error({
      message: "Form Validation Failed",
      description: "Please check the highlighted fields.",
      placement: "bottomRight",
    });
  };

  const selectedCategoryIds = Form.useWatch("category_type_id", form);

  const categoryDetection = React.useMemo(() => {
    if (!selectedCategoryIds || !Array.isArray(selectedCategoryIds)) {
      return { isMakeup: false, isPerfume: false };
    }
    const selectedLabels = categories
      .filter((c: FlatCategory) => selectedCategoryIds.includes(c.id))
      .map((c: FlatCategory) => c.pathLabel.toLowerCase());

    return {
      isMakeup: selectedLabels.some((l: string) => l.toLowerCase().includes("makeup")),
      isPerfume: selectedLabels.some((l: string) => l.toLowerCase().includes("perfume") || l.toLowerCase().includes("fragrance")),
      isSkincare: selectedLabels.some((l: string) => l.toLowerCase().includes("skincare")),
    };
  }, [selectedCategoryIds, categories]);

  const { isMakeup, isPerfume, isSkincare } = categoryDetection;
  const hasVariantAttributes = attributes.length > 0;
  const hasVariantCombinations = combinations.some(
    (c) => Array.isArray(c.combination) && c.combination.length > 0,
  );
  const isVariantMode = hasVariantAttributes || hasVariantCombinations || combinations.length > 0;
  const handleVariantSectionAction = () => {
    if (!isVariantMode) {
      setAttributes((prev) =>
        prev.length > 0 ? prev : [...prev, { attribute_id: null, values: [] }],
      );
      return;
    }

    Modal.confirm({
      title: "Hapus Variant",
      content: "Yakin ingin menghapus semua variant?",
      okText: "Hapus Variant",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: () => {
        setAttributes([]);
        setCombinations([]);
      },
    });
  };

  return (
    <MainLayout title="Form Product">
      <Form
        autoComplete="off"
        form={form}
        name="product_form"
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        onValuesChange={(_, allValues) => {
          if (!isInitialized.current) return;
          const formDirty = JSON.stringify(normalizeFormValues(allValues)) !== initialFormSnapshot.current;
          const stateDirty =
            JSON.stringify({ attributes, combinations, medias }) !== initialStateSnapshot.current;
          setIsDirty(formDirty || stateDirty);
        }}
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} lg={16}>
            <Card style={{ marginBottom: 10 }}>
              <FormBasic
                setMedias={setMedias}
                medias={medias}
                form={form}
                hasVariants={hasVariantCombinations}
                hidePricingWeightFields={isVariantMode}
                categoriesFromParent={categories}
                catLoadingFromParent={catLoading}
              />
            </Card>

            <Card style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 14 }}>Variants</div>
                <Button
                  type="dashed"
                  danger={isVariantMode}
                  icon={isVariantMode ? <DeleteOutlined /> : undefined}
                  size="small"
                  onClick={handleVariantSectionAction}
                >
                  {isVariantMode ? "Hapus Variant" : "+ Tambah Variant"}
                </Button>
              </div>
              <div
                style={{
                  maxHeight: isVariantMode ? 5000 : 0,
                  opacity: isVariantMode ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 260ms ease, opacity 180ms ease",
                  pointerEvents: isVariantMode ? "auto" : "none",
                }}
              >
                <FormAttribute
                  attributes={attributes}
                  setAttributes={setAttributes}
                  combinations={combinations}
                  setCombinations={setCombinations}
                  isMakeup={isMakeup}
                  isPerfume={isPerfume}
                  isSkincare={isSkincare}
                  showSectionTitle={false}
                />
              </div>
            </Card>

            <Card style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 16 }}>
                Product Information
              </div>
              <Form.Item label="How to Use" name="how_to_use">
                <Input.TextArea rows={3} placeholder="How to use (optional)" />
              </Form.Item>
              <Form.Item label="Ingredients" name="ingredients">
                <Input.TextArea rows={3} placeholder="Ingredients (optional)" />
              </Form.Item>
              <Form.Item label="BPOM" name="bpom">
                <Input placeholder="BPOM (optional)" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card style={{ marginBottom: 10 }}>
              <FormCategory form={form} />
            </Card>
            <Card style={{ marginBottom: 10 }}>
              <FormSeo form={form} />
            </Card>
          </Col>
        </Row>

        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: isDirty ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(120%)",
            opacity: isDirty ? 1 : 0,
            transition: "transform 280ms ease, opacity 220ms ease",
            zIndex: 1000,
            pointerEvents: isDirty ? "auto" : "none",
          }}
        >
          <Card styles={{ body: { width:'auto', padding:"12px 16px" } }} style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", gap:12 }}>
              {isUpdate && (
                <Button
                  icon={<UndoOutlined />}
                  type="default"
                  style={{ width:'auto' }}
                  onClick={() => {
                    const initialState = JSON.parse(initialStateSnapshot.current);
                    form.setFieldsValue(JSON.parse(initialFormSnapshot.current));
                    setAttributes(initialState.attributes);
                    setCombinations(initialState.combinations);
                    setMedias(initialState.medias);
                    setIsDirty(false);
                  }}
                >
                  Undo
                </Button>
              )}
              <Button htmlType="submit" type="primary">
                Simpan perubahan
              </Button>
            </div>
          </Card>
        </div>
      </Form>
    </MainLayout>
  );
};

export default AddProductPage;
