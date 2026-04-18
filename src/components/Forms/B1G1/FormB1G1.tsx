import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Switch,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Card,
  Table,
  Modal,
  Select,
  Space,
  Popconfirm,
  Divider,
  Tag,
} from "antd";
import type { FormInstance } from "antd";
import type { ColumnsType } from "antd/es/table/interface";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import http from "../../../api/http";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

export interface B1G1FormRecord {
  id?: number;
  name: string;
  code: string;
  description?: string;
  // Backend sends camelCase
  isActive?: boolean;
  isEcommerce?: boolean;
  isPos?: boolean;
  usageLimit?: number;
  minimumPurchase?: number;
  applyTo?: string;
  brandId?: number;
  startedAt?: string | Dayjs;
  expiredAt?: string | Dayjs;
  items?: any[];
  // snake_case fallbacks
  is_active?: boolean;
  is_ecommerce?: boolean;
  is_pos?: boolean;
  usage_limit?: number;
  minimum_purchase?: number;
  apply_to?: string;
  brand_id?: number;
  started_at?: string | Dayjs;
  expired_at?: string | Dayjs;
}

export interface B1G1Item {
  id?: number;
  buy_product_variant_id?: number;
  get_type: "gift" | "variant";
  get_product_variant_id?: number;
  get_gift_product_id?: number;
  get_quantity: number;
  // camelCase from backend
  buyProductVariantId?: number;
  getType?: string;
  getProductVariantId?: number;
  getGiftProductId?: number;
  getQuantity?: number;
  // Preloaded relations
  buyVariant?: any;
  getVariant?: any;
  getGiftProduct?: any;
}

interface FormB1G1Props {
  data?: B1G1FormRecord | null;
  form: FormInstance;
  onSuccess: () => void;
  onCancel: () => void;
}

interface GiftOption {
  label: string;
  value: number;
}

interface VariantOption {
  label: string;
  value: number;
}

const FormB1G1: React.FC<FormB1G1Props> = ({ data, form, onSuccess, onCancel }) => {
  const [items, setItems] = useState<B1G1Item[]>([]);
  const [productVariants, setProductVariants] = useState<VariantOption[]>([]);
  const [giftProducts, setGiftProducts] = useState<GiftOption[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<B1G1Item | null>(null);
  const [itemForm] = Form.useForm();
  const [selectedGetType, setSelectedGetType] = useState<string>("gift");

  // Helper: get value supporting camelCase & snake_case
  const v = (camel: any, snake: any) => camel ?? snake;

  useEffect(() => {
    if (data) {
      const isActive = v(data.isActive, data.is_active) ?? true;
      const isEcommerce = v(data.isEcommerce, data.is_ecommerce) ?? true;
      const isPos = v(data.isPos, data.is_pos) ?? false;
      const startedAt = v(data.startedAt, data.started_at);
      const expiredAt = v(data.expiredAt, data.expired_at);

      form.setFieldsValue({
        id: data.id,
        name: data.name,
        code: data.code,
        description: data.description || "",
        is_active: isActive,
        is_ecommerce: isEcommerce,
        is_pos: isPos,
        usage_limit: v(data.usageLimit, data.usage_limit) || undefined,
        minimum_purchase: v(data.minimumPurchase, data.minimum_purchase) || undefined,
        apply_to: v(data.applyTo, data.apply_to) || "all",
        brand_id: v(data.brandId, data.brand_id) || undefined,
        started_at: startedAt ? dayjs(startedAt) : undefined,
        expired_at: expiredAt ? dayjs(expiredAt) : undefined,
      });

      // Map items from backend (camelCase)
      if (data.items && Array.isArray(data.items)) {
        const mappedItems: B1G1Item[] = data.items.map((item: any) => ({
          id: item.id,
          buy_product_variant_id: item.buyProductVariantId || item.buy_product_variant_id,
          get_type: item.getType || item.get_type || "gift",
          get_product_variant_id: item.getProductVariantId || item.get_product_variant_id,
          get_gift_product_id: item.getGiftProductId || item.get_gift_product_id,
          get_quantity: item.getQuantity || item.get_quantity || 1,
          buyVariant: item.buyVariant,
          getVariant: item.getVariant,
          getGiftProduct: item.getGiftProduct,
        }));
        setItems(mappedItems);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
        is_ecommerce: true,
        is_pos: false,
        apply_to: "all",
      });
      setItems([]);
    }
    loadProductVariants();
    loadGiftProducts();
  }, [data, form]);

  const loadProductVariants = async () => {
    try {
      setLoadingVariants(true);
      const response = await http.get("/admin/buy-one-get-one/variants-for-selector?limit=1000");
      const body = response?.data;
      const rawData =
        body?.data?.serve ||
        body?.serve?.data ||
        body?.serve ||
        body?.data ||
        [];
      const variants = Array.isArray(rawData) ? rawData : [];

      const options = variants.map((vr: any) => ({
        label: vr.label || `${vr.name || "Unknown"} (${vr.sku || "?"})`,
        value: vr.value || vr.id,
      }));
      setProductVariants(options);
    } catch (error) {
      
      setProductVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const loadGiftProducts = async () => {
    try {
      setLoadingGifts(true);
      const response = await http.get("/admin/gift-products-for-promo");
      const gifts = response?.data?.data || response?.data?.serve || [];
      const arr = Array.isArray(gifts) ? gifts : [];

      const options = arr.map((g: any) => ({
        label: `${g.brand_name ? g.brand_name + " - " : ""}${g.name} (Stok: ${g.available_stock ?? g.stock ?? 0})`,
        value: g.id,
      }));
      setGiftProducts(options);
    } catch (error) {
      
      setGiftProducts([]);
    } finally {
      setLoadingGifts(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    itemForm.resetFields();
    itemForm.setFieldsValue({ get_type: "gift", get_quantity: 1 });
    setSelectedGetType("gift");
    setItemModalOpen(true);
  };

  const handleEditItem = (item: B1G1Item) => {
    setEditingItem(item);
    const getType = item.get_type || "gift";
    setSelectedGetType(getType);
    itemForm.setFieldsValue({
      buy_product_variant_id: item.buy_product_variant_id,
      get_type: getType,
      get_product_variant_id: item.get_product_variant_id,
      get_gift_product_id: item.get_gift_product_id,
      get_quantity: item.get_quantity || 1,
    });
    setItemModalOpen(true);
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveItem = async () => {
    try {
      const values = await itemForm.validateFields();

      const buyIds = Array.isArray(values.buy_product_variant_id)
        ? values.buy_product_variant_id
        : (values.buy_product_variant_id ? [values.buy_product_variant_id] : []);

      // If no buy variant selected (e.g. Apply To All/Brand scope), treat as single item with null
      if (buyIds.length === 0 && !values.buy_product_variant_id) {
        buyIds.push(null);
      }

      const newItems: B1G1Item[] = buyIds.map((buyId: number | null) => ({
        buy_product_variant_id: buyId || undefined, // undefined for backend null
        get_type: values.get_type,
        get_product_variant_id: values.get_type === "variant" ? values.get_product_variant_id : undefined,
        get_gift_product_id: values.get_type === "gift" ? values.get_gift_product_id : undefined,
        get_quantity: values.get_quantity || 1,
      }));

      if (editingItem) {
        // Edit mode: only support single item update to avoid complexity
        // If user somehow selected multiple in edit (if enabled), we take the first one or treat as replace?
        // Let's assume edit mode keeps it single.
        const firstNew = newItems[0];
        const idx = items.findIndex((it) => it === editingItem);
        if (idx >= 0) {
          const updated = [...items];
          updated[idx] = { ...firstNew, id: editingItem.id };
          setItems(updated);
        }
      } else {
        // Add mode: append all new items
        setItems([...items, ...newItems]);
      }

      itemForm.resetFields();
      setItemModalOpen(false);
      message.success(editingItem ? "Item diupdate" : `${newItems.length} item ditambahkan`);
    } catch (error) {
      
    }
  };

  const onFinish = async (values: any) => {
    try {
      const payload: any = {
        name: values.name?.trim(),
        code: values.code?.trim(),
        description: values.description?.trim() || "",
        is_active: !!values.is_active,
        is_ecommerce: !!values.is_ecommerce,
        is_pos: !!values.is_pos,
        usage_limit: (values.usage_limit === undefined || values.usage_limit === null) ? null : values.usage_limit,
        minimum_purchase: (values.minimum_purchase === undefined || values.minimum_purchase === null) ? null : values.minimum_purchase,
        apply_to: values.apply_to || "all",
        brand_id: values.apply_to === "brand" ? values.brand_id : null,
        started_at: values.started_at
          ? dayjs(values.started_at).toISOString()
          : null,
        expired_at: values.expired_at
          ? dayjs(values.expired_at).toISOString()
          : null,
        items: items.map((it) => ({
          buy_product_variant_id: it.buy_product_variant_id || null,
          get_type: it.get_type || "gift",
          get_product_variant_id: it.get_type === "variant" ? it.get_product_variant_id : null,
          get_gift_product_id: it.get_type === "gift" ? it.get_gift_product_id : null,
          get_quantity: it.get_quantity || 1,
        })),
      };

      if (data?.id) {
        await http.put(`/admin/buy-one-get-one/${data.id}`, payload);
        message.success("Promo B1G1 berhasil diupdate");
      } else {
        await http.post("/admin/buy-one-get-one", payload);
        message.success("Promo B1G1 berhasil dibuat");
      }

      form.resetFields();
      setItems([]);
      onSuccess();
    } catch (error: any) {
      

      let errorMsg = "Gagal menyimpan promo";

      if (error?.response?.data) {
        const data = error.response.data;
        if (data.errors && Array.isArray(data.errors)) {
          // Join all error messages from Vine
          errorMsg = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(", ");
        } else if (data.message) {
          errorMsg = data.message;
        }
      }

      message.error(errorMsg, 5); // Show longer for detailed errors
    }
  };

  // Helper to resolve display name for items
  const getBuyLabel = (item: B1G1Item) => {
    if (item.buyVariant) {
      const p = item.buyVariant?.product?.name || "";
      const vn = item.buyVariant?.name || "";
      const sku = item.buyVariant?.sku || "";
      return `${p} - ${vn} (${sku})`;
    }
    const found = productVariants.find((pv) => pv.value === item.buy_product_variant_id);
    return found?.label || (item.buy_product_variant_id ? `Variant #${item.buy_product_variant_id}` : "Semua (apply_to)");
  };

  const getGetLabel = (item: B1G1Item) => {
    if (item.get_type === "gift") {
      if (item.getGiftProduct) {
        return item.getGiftProduct.name || item.getGiftProduct.sku || "Gift";
      }
      const found = giftProducts.find((g) => g.value === item.get_gift_product_id);
      return found ? found.label : `Gift #${item.get_gift_product_id}`;
    }
    // variant
    if (item.getVariant) {
      const p = item.getVariant?.product?.name || "";
      const vn = item.getVariant?.name || "";
      const sku = item.getVariant?.sku || "";
      return `${p} - ${vn} (${sku})`;
    }
    const found = productVariants.find((pv) => pv.value === item.get_product_variant_id);
    return found?.label || `Variant #${item.get_product_variant_id}`;
  };

  const itemColumns: ColumnsType<B1G1Item> = [
    {
      title: "Beli (Buy)",
      key: "buy",
      render: (_, record) => getBuyLabel(record),
    },
    {
      title: "Tipe",
      key: "get_type",
      width: 80,
      render: (_, record) => (
        <Tag color={record.get_type === "gift" ? "magenta" : "blue"}>
          {(record.get_type || "gift").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Dapat (Get)",
      key: "get",
      render: (_, record) => getGetLabel(record),
    },
    {
      title: "Qty",
      key: "get_quantity",
      width: 60,
      align: "center",
      render: (_, record) => record.get_quantity || 1,
    },
    {
      title: "#",
      key: "action",
      width: 90,
      align: "center",
      render: (_: any, record: B1G1Item, index: number) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(record)}
          />
          <Popconfirm
            title="Hapus item?"
            onConfirm={() => handleDeleteItem(index)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item name="id" hidden>
          <Input type="hidden" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Nama"
              name="name"
              rules={[{ required: true, message: "Nama wajib diisi" }]}
            >
              <Input placeholder="Nama promo" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Kode"
              name="code"
              rules={[{ required: true, message: "Kode wajib diisi" }]}
            >
              <Input placeholder="Kode promo" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Deskripsi" name="description">
          <Input.TextArea placeholder="Deskripsi promo" rows={2} />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item label="Apply To" name="apply_to">
              <Select
                options={[
                  { label: "Semua Produk", value: "all" },
                  { label: "Per Brand", value: "brand" },
                  { label: "Per Variant", value: "variant" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label="Tanggal Mulai"
              name="started_at"
              rules={[{ required: true, message: "Tanggal mulai wajib diisi" }]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Tanggal Berakhir" name="expired_at">
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item label="Kuota" name="usage_limit">
              <InputNumber min={0} placeholder="Tanpa batas" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Min. Purchase" name="minimum_purchase">
              <InputNumber min={0} placeholder="0" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Brand ID" name="brand_id">
              <InputNumber min={1} placeholder="Hanya jika apply_to = brand" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item label="Active" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="E-Commerce" name="is_ecommerce" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="POS" name="is_pos" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Card
          title="Items (Aturan Gift)"
          size="small"
          style={{ marginBottom: 16 }}
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddItem}
            >
              Tambah Item
            </Button>
          }
        >
          <Table
            columns={itemColumns}
            dataSource={items}
            rowKey={(_, i) => `item-${i}`}
            pagination={false}
            size="small"
          />
        </Card>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              {data?.id ? "Update" : "Buat"} Promo B1G1
            </Button>
            <Button onClick={onCancel}>Batal</Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Item Modal */}
      <Modal
        title={editingItem ? "Edit Item B1G1" : "Tambah Item B1G1"}
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        onOk={handleSaveItem}
        okText="Simpan"
        cancelText="Batal"
        destroyOnClose
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.apply_to !== curr.apply_to}
          >
            {() => {
              const applyTo = form.getFieldValue("apply_to");
              const isVariantScope = applyTo === "variant";

              return (
                <Form.Item
                  label="Produk yang Dibeli (Buy Variant)"
                  name="buy_product_variant_id"
                  rules={[
                    {
                      required: isVariantScope,
                      message: "Pilih variant yang dibeli"
                    }
                  ]}
                  extra={
                    isVariantScope
                      ? "Wajib pilih variant karena Apply To = Per Variant"
                      : "Kosongkan jika berlaku untuk semua produk dalam Brand/Toko"
                  }
                >
                  <Select
                    mode={editingItem ? undefined : "multiple"}
                    placeholder={loadingVariants ? "Memuat..." : "Pilih variant yang dibeli (Bisa pilih banyak)"}
                    options={productVariants}
                    loading={loadingVariants}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    allowClear
                    maxTagCount={undefined} // Show all tags
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            label="Tipe Hadiah"
            name="get_type"
            rules={[{ required: true, message: "Pilih tipe hadiah" }]}
          >
            <Select
              options={[
                { label: "Produk Hadiah (Gift)", value: "gift" },
                { label: "Produk Jual (Variant)", value: "variant" },
              ]}
              onChange={(val) => setSelectedGetType(val)}
            />
          </Form.Item>

          {selectedGetType === "gift" && (
            <Form.Item
              label="Gift Product"
              name="get_gift_product_id"
              rules={[{ required: true, message: "Pilih gift product" }]}
            >
              <Select
                placeholder={loadingGifts ? "Memuat..." : "Pilih gift product"}
                options={giftProducts}
                loading={loadingGifts}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}

          {selectedGetType === "variant" && (
            <Form.Item
              label="Get Variant (Produk Gratisan)"
              name="get_product_variant_id"
              rules={[{ required: true, message: "Pilih variant yang didapat" }]}
            >
              <Select
                placeholder={loadingVariants ? "Memuat..." : "Pilih variant"}
                options={productVariants}
                loading={loadingVariants}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}

          <Form.Item
            label="Jumlah (Get Quantity)"
            name="get_quantity"
            rules={[{ required: true, message: "Masukkan jumlah" }]}
          >
            <InputNumber min={1} placeholder="1" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FormB1G1;
