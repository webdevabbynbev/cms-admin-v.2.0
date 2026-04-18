import { useEffect, useState, useMemo, useRef } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Switch,
  InputNumber,
  Row,
  Col,
  Select,
  Upload,
  Tabs,
} from "antd";
import { UploadOutlined, LoadingOutlined } from "@ant-design/icons";
import type { FormInstance, UploadFile } from "antd";
import { UPLOAD_PATHS } from "../../../constants/uploadPaths";
import http from "../../../api/http";

export interface GiftFormRecord {
  id?: number;
  brand_name?: string;
  brand_id?: number;
  product_name: string;
  variant_name?: string;
  is_sellable: boolean;
  product_variant_sku?: string;
  product_variant_id?: number;
  price: number;
  stock: number;
  quantity?: number;
  weight?: number;
  image_url?: string;
  is_active: boolean;
}

interface FormGiftProps {
  data?: GiftFormRecord | null;
  form: FormInstance;
  onSuccess: () => void;
  onCancel: () => void;
}

interface VariantOption {
  label: string;
  value: string;
  sku: string;
  brand_id?: number;
  variant_id?: number;
  image_url?: string;
  product_name?: string;
  price?: number;
  stock?: number;
  weight?: number;
}

const FormGift: React.FC<FormGiftProps> = ({
  data,
  form,
  onSuccess,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<"custom_gift" | "gift_murni">("custom_gift");

  // Snapshot state per tab — disimpan saat user pindah tab, direstore saat kembali
  type TabSnapshot = { fields: Record<string, any>; fileList: UploadFile[] };
  const TAB_FIELDS = ["brand_id", "brand_name", "product_name", "variant_name", "product_variant_sku", "product_variant_id", "image_url", "price", "stock", "weight", "quantity"];
  const customGiftSnapshot = useRef<TabSnapshot>({ fields: {}, fileList: [] });
  const giftMurniSnapshot = useRef<TabSnapshot>({ fields: {}, fileList: [] });

  const [productVariants, setProductVariants] = useState<VariantOption[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const watchedBrandId = Form.useWatch("brand_id", form);
  const watchedBrandName = Form.useWatch("brand_name", form);

  const brandOptions = useMemo(() => {
    const options = brands.map((b) => ({
      label: b.name,
      value: Number(b.id),
    }));
    const currentId = watchedBrandId || data?.brand_id || (data as any)?.brandId;
    const currentName = watchedBrandName || data?.brand_name || (data as any)?.brandName;
    if (currentId && !options.some((o) => o.value === Number(currentId))) {
      options.push({
        label: currentName || `Brand #${currentId}`,
        value: Number(currentId),
      });
    }
    return options;
  }, [brands, data, watchedBrandId, watchedBrandName]);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadProductVariants = async () => {
    try {
      setLoadingVariants(true);
      const response = await http.get(
        `/admin/buy-one-get-one/variants-for-selector?limit=5000&t=${Date.now()}`,
        { timeout: 60000 },
      );
      const body = response?.data;
      const rawData = Array.isArray(body)
        ? body
        : body?.serve?.data || body?.serve || body?.data || [];
      const variants = Array.isArray(rawData) ? rawData : [];
      const options = variants.map((vr: any) => {
        const fullLabel = vr.label || `${vr.name || "Unknown"} (${vr.sku || "?"})`;
        const productName = vr.product_name || fullLabel.split(" - ")[1]?.trim() || vr.name || "";
        return {
          label: fullLabel,
          value: vr.sku || vr.value,
          sku: vr.sku || "",
          brand_id: vr.brand_id,
          variant_id: vr.id,
          image_url: vr.image_url,
          product_name: productName,
          price: vr.price ?? vr.base_price ?? undefined,
          stock: vr.stock ?? vr.available_stock ?? undefined,
          weight: vr.weight ?? undefined,
        };
      });
      setProductVariants(options);
    } catch (error) {
      
      setProductVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const res = await http.get("/admin/brands?per_page=1000");
      const body = res?.data;
      const rawData = Array.isArray(body)
        ? body
        : body?.serve?.data || body?.serve || body?.data || [];
      const serve = Array.isArray(rawData) ? rawData : [];
      setBrands(serve);
    } catch (e) {
      
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    if (data) {
      const sellable = (data as any).is_sellable ?? (data as any).isSellable ?? false;
      const productNameValue =
        (data as any).product_name ||
        (data as any).productName ||
        (data as any).name ||
        "";
      const stockValue =
        data.stock ??
        (data as any).quantity ??
        (data as any).qty ??
        (data as any).available_stock ??
        0;
      const activeValue = data.is_active ?? (data as any).isActive ?? true;
      const brandIdValue = data.brand_id || (data as any).brandId || null;
      const brandNameValue = data.brand_name || (data as any).brandName || "";
      const variantNameValue =
        data.variant_name || (data as any).variantName || (data as any).variant || "";
      const variantSkuValue =
        data.product_variant_sku ||
        (data as any).productVariantSku ||
        (data as any).sku ||
        "";
      const rawPrice = data.price || (data as any).price || 0;
      const priceValue = typeof rawPrice === "string" ? parseFloat(rawPrice) : rawPrice;
      const imageUrlValue = data.image_url || (data as any).imageUrl || "";

      form.setFieldsValue({
        id: data.id,
        brand_name: brandNameValue,
        brand_id: brandIdValue ? Number(brandIdValue) : null,
        product_name: productNameValue,
        variant_name: variantNameValue,
        is_sellable: !!sellable,
        product_variant_sku: variantSkuValue,
        product_variant_id: data.product_variant_id || (data as any).productVariantId || null,
        price: priceValue || 0,
        stock: stockValue,
        weight: data.weight || 0,
        image_url: imageUrlValue,
        is_active: !!activeValue,
      });

      if (imageUrlValue) {
        setFileList([{ uid: "-1", name: "image.png", status: "done", url: imageUrlValue }]);
      } else {
        setFileList([]);
      }
    } else {
      form.resetFields();
      setActiveTab("custom_gift");
      setFileList([]);
      customGiftSnapshot.current = { fields: {}, fileList: [] };
      giftMurniSnapshot.current = { fields: {}, fileList: [] };
      form.setFieldsValue({
        is_sellable: false,
        is_active: true,
        stock: 0,
        weight: 0,
        price: 0,
      });
    }
  }, [data, form, brands]);

  useEffect(() => {
    if (data && productVariants.length > 0) {
      const currentImage = form.getFieldValue("image_url");
      const sku =
        data.product_variant_sku ||
        (data as any).productVariantSku ||
        (data as any).sku ||
        "";
      if (!currentImage && sku) {
        const variant = productVariants.find((v) => v.sku === sku);
        if (variant?.image_url) {
          const imageUrl = variant.image_url;
          form.setFieldValue("image_url", imageUrl);
          setFileList([{ uid: "-1", name: "image.png", status: "done", url: imageUrl }]);
        }
      }
    }
  }, [productVariants, data, form]);

  const handleTabChange = (key: string) => {
    // Simpan state tab yang sedang aktif
    const currentValues = form.getFieldsValue();
    const snapshot: TabSnapshot = {
      fields: Object.fromEntries(TAB_FIELDS.map((f) => [f, currentValues[f] ?? null])),
      fileList,
    };
    if (activeTab === "custom_gift") {
      customGiftSnapshot.current = snapshot;
    } else {
      giftMurniSnapshot.current = snapshot;
    }

    // Restore state tab tujuan
    const restore = key === "custom_gift" ? customGiftSnapshot.current : giftMurniSnapshot.current;
    form.setFieldsValue({
      ...Object.fromEntries(TAB_FIELDS.map((f) => [f, null])), // clear dulu
      ...restore.fields,
    });
    setFileList(restore.fileList);
    setActiveTab(key as "custom_gift" | "gift_murni");
  };

  const handleUpload = async (options: any) => {
    const { onSuccess, onError, file } = options;
    setLoadingUpload(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", `${UPLOAD_PATHS.gifts}`);
    try {
      const res = await http.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.serve;
      onSuccess(url);
      message.success("Image uploaded successfully");
      form.setFieldValue("image_url", url);
      setFileList([{ uid: file.uid, name: file.name, status: "done", url }]);
    } catch (err) {
      
      onError(err);
      message.error("Failed to upload image");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleRemoveImage = () => {
    setFileList([]);
    form.setFieldValue("image_url", null);
  };

  const onBrandChange = (value: number, option: any) => {
    const numValue = value ? Number(value) : null;
    form.setFieldValue("brand_id", numValue);
    form.setFieldValue("product_name", null);
    form.setFieldValue("variant_name", null);
    if (option?.image_url && fileList.length === 0) {
      form.setFieldValue("image_url", option.image_url);
      setFileList([{ uid: "-1", name: "image.png", status: "done", url: option.image_url }]);
    }
    if (option?.label) {
      form.setFieldValue("brand_name", option.label);
    } else {
      form.setFieldValue("brand_name", null);
    }
  };

  const onSkuChange = (sku: string, option: any) => {
    if (!option) return;
    const brandNameFromLabel = option.label ? option.label.split(" - ")[0].trim() : "";
    const productNameFromLabel = option.label?.split(" - ")[1]?.trim() || "";
    const variantPart = option.label?.split(" - ")[2]?.trim() || "";
    const variantNameFromLabel = variantPart.replace(/\s*\([^)]*\)\s*$/, "").trim();
    const matchedBrand = brands.find(
      (b) => b.name?.toLowerCase() === brandNameFromLabel.toLowerCase(),
    );
    const updates: any = {
      product_variant_sku: sku,
      brand_name: brandNameFromLabel,
      product_name: productNameFromLabel,
      variant_name: variantNameFromLabel,
    };
    if (option.brand_id) updates.brand_id = Number(option.brand_id);
    else if (matchedBrand) updates.brand_id = Number(matchedBrand.id);
    if (option.variant_id) updates.product_variant_id = Number(option.variant_id);
    if (option.image_url) {
      updates.image_url = option.image_url;
      setFileList([{ uid: "-1", name: "image.png", status: "done", url: option.image_url }]);
    }
    if (option.price != null) updates.price = Number(option.price);
    if (option.stock != null) updates.stock = Number(option.stock);
    if (option.weight != null) updates.weight = Number(option.weight);
    form.setFieldsValue(updates);
  };

  const onFinish = async (values: GiftFormRecord) => {
    try {
      setLoadingSubmit(true);
      const isGiftMurni = activeTab === "gift_murni";
      const payload: Record<string, any> = {
        brand_name: values.brand_name?.trim() || null,
        brand_id: values.brand_id || null,
        product_name: values.product_name?.trim() || "",
        variant_name: values.variant_name?.trim() || null,
        is_sellable: isGiftMurni,
        product_variant_sku: values.product_variant_sku?.trim() || null,
        product_variant_id: values.product_variant_id || null,
        price: values.price,
        weight: values.weight || 0,
        image_url: values.image_url?.trim() || null,
        is_active: values.is_active ? 1 : 0,
      };

      if (isGiftMurni) {
        payload.stock = values.stock;
        payload.gift_stock = values.quantity ?? 0;
      } else {
        payload.gift_stock = values.stock ?? 0;
      }

      if (data?.id) {
        await http.put(`/admin/gift-products/${data.id}`, payload);
        message.success("Gift product updated successfully");
      } else {
        await http.post("/admin/gift-products", payload);
        message.success("Gift product created successfully");
      }
      form.resetFields();
      setFileList([]);
      onSuccess();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Failed to submit form";
      message.error(errorMsg);
      
    } finally {
      setLoadingSubmit(false);
    }
  };

  const brandSelect = (
    <>
      <Form.Item
        label="Brand"
        name="brand_id"
        tooltip="Pilih Brand"
      >
        <Select
          key={data?.id || "new"}
          placeholder="Select Brand"
          options={brandOptions}
          loading={loadingBrands}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          allowClear
          onChange={onBrandChange}
        />
      </Form.Item>
      <Form.Item name="brand_name" hidden>
        <Input />
      </Form.Item>
    </>
  );

  const customGiftFields = (
    <Row gutter={16} style={{ marginLeft: 0, marginRight: 0 }}>
      <Col xs={24} sm={8}>
        {brandSelect}
      </Col>
      <Col xs={24} sm={8}>
        <Form.Item
          label="Product Name"
          name="product_name"
          rules={[{ required: !data?.id, message: "Product name wajib diisi" }]}
        >
          <Input placeholder="Masukkan nama produk" allowClear />
        </Form.Item>
      </Col>
      <Col xs={24} sm={8}>
        <Form.Item
          label="Variant Name"
          name="variant_name"
          tooltip="Opsional"
        >
          <Input placeholder="Masukkan nama varian (opsional)" allowClear />
        </Form.Item>
      </Col>
    </Row>
  );

  const giftMurniFields = (
    <Form.Item
      label="SKU Varian 3"
      name="product_variant_sku"
      tooltip="Pilih varian — Brand, Product Name, dan Variant Name akan terisi otomatis."
    >
      <Select
        placeholder={loadingVariants ? "Memuat data..." : "Cari produk atau SKU..."}
        options={productVariants}
        loading={loadingVariants}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        disabled={loadingVariants}
        onChange={onSkuChange}
        onFocus={() => {
          if (productVariants.length === 0) loadProductVariants();
        }}
      />
    </Form.Item>
  );

  return (
    <Form<GiftFormRecord> form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="id" hidden>
        <Input type="hidden" />
      </Form.Item>
      <Form.Item name="product_variant_id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        size="small"
        style={{ marginBottom: 8 }}
        items={[
          {
            key: "custom_gift",
            label: "Custom Gift",
            children: customGiftFields,
          },
          {
            key: "gift_murni",
            label: "Produk Jual",
            children: giftMurniFields,
          },
        ]}
      />

      <Row gutter={16} style={{ marginLeft: 0, marginRight: 0 }}>
        <Col xs={24} sm={6}>
          <Form.Item
            label="Harga (Rp)"
            name="price"
            rules={[{ required: activeTab === "custom_gift" && !data?.id, message: "Price wajib diisi" }]}
            tooltip={activeTab === "gift_murni" ? "Terisi otomatis dari varian" : "Tanpa titik, contoh: 75000"}
          >
            <InputNumber
              min={0}
              placeholder="Contoh: 75000"
              style={{ width: "100%" }}
              disabled={activeTab === "gift_murni"}
              formatter={(value) =>
                value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
              }
              parser={(value: string | undefined): number => {
                const parsed = value ? parseInt(value.replace(/\./g, ""), 10) : 0;
                return isNaN(parsed) ? 0 : parsed;
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item
            label={activeTab === "gift_murni" ? "Stock" : "Quantity"}
            name="stock"
            rules={[{ required: activeTab === "custom_gift" && !data?.id, message: "Quantity wajib diisi" }]}
            tooltip={activeTab === "gift_murni" ? "Stok tersedia dari varian, read only" : "Jumlah gift yang tersedia"}
          >
            <InputNumber
              min={0}
              placeholder="Contoh: 100"
              style={{ width: "100%" }}
              disabled={activeTab === "gift_murni"}
            />
          </Form.Item>
        </Col>
        {activeTab === "gift_murni" && (
          <Col xs={24} sm={6}>
            <Form.Item
              label="Quantity"
              name="quantity"
              rules={[
                { required: true, message: "Quantity wajib diisi" },
                {
                  validator: (_, value) => {
                    const stock = form.getFieldValue("stock") ?? 0;
                    if (value == null || value === "") return Promise.resolve();
                    if (Number(value) > Number(stock)) {
                      return Promise.reject(`Quantity tidak boleh melebihi stock (${stock})`);
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              tooltip="Jumlah gift yang dibuat, tidak boleh melebihi stok"
            >
              <InputNumber min={0} placeholder="Contoh: 10" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        )}
        <Col xs={24} sm={6}>
          <Form.Item
            label="Weight (gram)"
            name="weight"
            tooltip={activeTab === "gift_murni" ? "Terisi otomatis dari varian" : "Cukup angka saja, contoh: 50"}
          >
            <InputNumber
              min={0}
              placeholder="Contoh: 50"
              style={{ width: "100%" }}
              disabled={activeTab === "gift_murni"}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item label="Active" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Image" name="image_url" tooltip="Upload gambar produk">
        <Upload
          listType="picture-card"
          fileList={fileList}
          customRequest={handleUpload}
          onRemove={handleRemoveImage}
          maxCount={1}
        >
          {fileList.length < 1 && (
            <div>
              {loadingUpload ? <LoadingOutlined /> : <UploadOutlined />}
              <div style={{ marginTop: 8 }}>
                {loadingUpload ? "Uploading..." : "Upload"}
              </div>
            </div>
          )}
        </Upload>
        <Input style={{ display: "none" }} />
      </Form.Item>

      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: 8 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loadingSubmit}
          disabled={loadingUpload}
        >
          {data?.id ? "Update" : "Create"} Gift Product
        </Button>
        <Button
          style={{ marginLeft: 8 }}
          onClick={onCancel}
          disabled={loadingSubmit || loadingUpload}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
};

export default FormGift;
