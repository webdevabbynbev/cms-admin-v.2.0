import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Switch,
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
  Tooltip,
} from "antd";
import type { FormInstance } from "antd";
import type { ColumnsType } from "antd/es/table/interface";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";

export interface NEDFormRecord {
  id?: number;
  name: string;
  description?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  is_active: boolean;
  is_visible_ecommerce?: boolean;
  is_visible_pos?: boolean;
}

export interface NEDItem {
  id?: number;
  buy_ned_product_id: number;
  get_ned_product_id: number;
  get_quantity: number;
}

interface FormNEDProps {
  data?: NEDFormRecord | null;
  form: FormInstance;
  onSuccess: () => void;
  onCancel: () => void;
}

/** Helper: label dengan tooltip info */
const FieldLabel = ({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) => (
  <Space size={4}>
    {label}
    <Tooltip title={tooltip}>
      <QuestionCircleOutlined style={{ color: "#aaa", cursor: "help" }} />
    </Tooltip>
  </Space>
);

const FormNED: React.FC<FormNEDProps> = ({ data, form, onSuccess, onCancel }) => {
  const [items, setItems] = useState<NEDItem[]>([]);
  const [nedProducts, setNedProducts] = useState<{ label: string; value: number }[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NEDItem | null>(null);
  const [itemForm] = Form.useForm();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        id: data.id,
        name: data.name,
        description: data.description || "",
        sku: data.sku || "",
        price: data.price || undefined,
        quantity: data.quantity || undefined,
        is_active: data.is_active ?? true,
        is_visible_ecommerce: (data as any).isVisibleEcommerce ?? data.is_visible_ecommerce ?? true,
        is_visible_pos: (data as any).isVisiblePos ?? data.is_visible_pos ?? false,
      });
      if (data.id) {
        loadNEDItems(data.id);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
        is_visible_ecommerce: true,
        is_visible_pos: false,
      });
      setItems([]);
    }
    loadNEDProductsPool();
  }, [data, form]);

  const loadNEDProductsPool = async () => {
    try {
      setLoadingProducts(true);
      const response = await http.get("/admin/ned-products?per_page=1000");
      const rawData = response?.data?.serve || response?.data?.data || response?.data || [];
      const products = Array.isArray(rawData) ? rawData : rawData.data || [];

      if (products.length > 0) {
        const options = products.map((p: any) => ({
          label: `${p.namaProduk || p.nama_produk || p.name || "Unknown"} (SKU: ${p.sku || "N/A"}) - Rp ${(p.het || p.price || 0).toLocaleString("id-ID")}`,
          value: p.id,
        }));
        setNedProducts(options);
      } else {
        setNedProducts([]);
      }
    } catch (error) {
      
      setNedProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadNEDItems = async (nedId: number) => {
    try {
      const response = await http.get(`/admin/ned/${nedId}/items`);
      const rawData = response?.data?.serve || response?.data?.data || response?.data || [];
      setItems(Array.isArray(rawData) ? rawData : rawData.data || []);
    } catch (error) {
      
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    itemForm.resetFields();
    setItemModalOpen(true);
  };

  const handleEditItem = (item: NEDItem) => {
    setEditingItem(item);
    itemForm.setFieldsValue({
      buy_ned_product_id: item.buy_ned_product_id,
      get_ned_product_id: item.get_ned_product_id,
      get_quantity: item.get_quantity,
    });
    setItemModalOpen(true);
  };

  /**
   * PERBAIKI BUG: handleDeleteItem sekarang memanggil API DELETE ke backend
   * jika item sudah memiliki id (sudah tersimpan di database).
   */
  const handleDeleteItem = async (item: NEDItem) => {
    if (item.id && data?.id) {
      try {
        await http.delete(`/admin/ned/${data.id}/items/${item.id}`);
        message.success("Item berhasil dihapus");
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Gagal menghapus item");
        return;
      }
    }
    setItems((prev) =>
      item.id
        ? prev.filter((i) => i.id !== item.id)
        : prev.filter((i) => i !== item)
    );
  };

  const handleSaveItem = async () => {
    try {
      const values = await itemForm.validateFields();
      const newItem: NEDItem = { ...values };

      if (editingItem?.id) {
        // Edit item yang sudah ada di DB
        await http.put(`/admin/ned-items/${editingItem.id}`, newItem);
        setItems(items.map((item) =>
          item.id === editingItem.id ? { ...newItem, id: editingItem.id } : item
        ));
        message.success("Item berhasil diperbarui");
      } else if (data?.id) {
        // Saat EDIT kampanye: langsung POST ke API (bukan tunggu submit)
        const response = await http.post(`/admin/ned/${data.id}/items`, {
          buy_ned_product_id: newItem.buy_ned_product_id,
          get_ned_product_id: newItem.get_ned_product_id,
          get_quantity: newItem.get_quantity,
        });
        const savedItem = response?.data?.serve?.data || response?.data?.data || response?.data;
        setItems([...items, { ...newItem, id: savedItem?.id }]);
        message.success("Item berhasil ditambahkan");
      } else {
        // Saat CREATE kampanye baru: tampung di state dulu
        setItems([...items, newItem]);
        message.success("Item ditambahkan (akan disimpan saat submit)");
      }

      itemForm.resetFields();
      setItemModalOpen(false);
    } catch (error: any) {
      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      }
      
    }
  };

  const onFinish = async (values: NEDFormRecord) => {
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || "",
        sku: values.sku?.trim() || "",
        price: values.price || 0,
        quantity: values.quantity || 0,
        is_active: values.is_active ? 1 : 0,
        is_visible_ecommerce: values.is_visible_ecommerce ? 1 : 0,
        is_visible_pos: values.is_visible_pos ? 1 : 0,
      };

      if (data?.id) {
        await http.put(`/admin/ned/${data.id}`, payload);
        message.success("Kampanye NED berhasil diperbarui");
      } else {
        const response = await http.post("/admin/ned", payload);
        const nedId = response?.data?.serve?.id || response?.data?.id;

        // Simpan items untuk kampanye baru
        if (nedId && items.length) {
          for (const item of items) {
            await http.post(`/admin/ned/${nedId}/items`, {
              buy_ned_product_id: item.buy_ned_product_id,
              get_ned_product_id: item.get_ned_product_id,
              get_quantity: item.get_quantity,
            });
          }
        }

        message.success("Kampanye NED berhasil dibuat");
      }

      form.resetFields();
      setItems([]);
      onSuccess();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Gagal menyimpan data";
      message.error(errorMsg);
      
    }
  };

  const itemColumns: ColumnsType<NEDItem> = [
    {
      title: (
        <Tooltip title="Produk yang harus dibeli oleh pelanggan agar promo NED berlaku">
          <Space size={4}>
            Produk yang Dibeli{" "}
            <QuestionCircleOutlined style={{ color: "#aaa" }} />
          </Space>
        </Tooltip>
      ),
      dataIndex: "buy_ned_product_id",
      key: "buy_ned_product_id",
      render: (id: number) =>
        nedProducts.find((p) => p.value === id)?.label || `ID: ${id}`,
    },
    {
      title: (
        <Tooltip title="Produk yang diberikan sebagai hadiah gratis kepada pelanggan">
          <Space size={4}>
            Produk Hadiah (Gift){" "}
            <QuestionCircleOutlined style={{ color: "#aaa" }} />
          </Space>
        </Tooltip>
      ),
      dataIndex: "get_ned_product_id",
      key: "get_ned_product_id",
      render: (id: number) =>
        nedProducts.find((p) => p.value === id)?.label || `ID: ${id}`,
    },
    {
      title: (
        <Tooltip title="Jumlah unit hadiah yang diberikan ke pelanggan">
          <Space size={4}>
            Qty Hadiah <QuestionCircleOutlined style={{ color: "#aaa" }} />
          </Space>
        </Tooltip>
      ),
      dataIndex: "get_quantity",
      key: "get_quantity",
      width: 110,
    },
    {
      title: "#",
      key: "action",
      width: 100,
      align: "center",
      render: (_: any, record: NEDItem) => (
        <Space size="small">
          <Tooltip title="Edit item">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditItem(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Hapus item ini?"
            description="Item akan dihapus dari kampanye NED ini."
            onConfirm={() => handleDeleteItem(record)}
            okText="Ya, Hapus"
            cancelText="Batal"
          >
            <Tooltip title="Hapus item">
              <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Form<NEDFormRecord>
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
              label={
                <FieldLabel
                  label="Nama Kampanye"
                  tooltip="Nama kampanye NED yang mudah dikenali oleh admin. Contoh: 'NED Reveline April 2025'."
                />
              }
              name="name"
              rules={[{ required: true, message: "Nama kampanye wajib diisi" }]}
            >
              <Input placeholder="Nama kampanye NED" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label={
                <FieldLabel
                  label="SKU"
                  tooltip="SKU referensi kampanye ini (opsional). Bisa dikosongkan jika kampanye mencakup banyak produk."
                />
              }
              name="sku"
            >
              <Input placeholder="SKU produk (opsional)" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={
            <FieldLabel
              label="Deskripsi"
              tooltip="Deskripsi singkat tentang kampanye NED ini. Akan ditampilkan di detail transaksi sebagai label promo."
            />
          }
          name="description"
        >
          <Input.TextArea placeholder="Deskripsi kampanye NED (opsional)" rows={3} />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={
                <FieldLabel
                  label="Price"
                  tooltip="Harga referensi kampanye NED (opsional). Dapat diisi sebagai harga bundling atau referensi admin saja."
                />
              }
              name="price"
            >
              <InputNumber
                min={0}
                placeholder="0"
                style={{ width: "100%" }}
                addonBefore="Rp"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label={
                <FieldLabel
                  label="Quantity"
                  tooltip="Kuota maksimum penggunaan kampanye NED ini. Kosongkan jika tidak ada batasan kuota."
                />
              }
              name="quantity"
            >
              <InputNumber min={0} placeholder="Kuota maksimum (opsional)" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              label={
                <FieldLabel
                  label="Active"
                  tooltip="Aktifkan untuk mengaktifkan kampanye ini. Jika dinonaktifkan, promo tidak akan berlaku di channel manapun."
                />
              }
              name="is_active"
              valuePropName="checked"
            >
              <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label={
                <FieldLabel
                  label="Tampil di E-Commerce"
                  tooltip="Jika aktif, promo NED ini akan berlaku saat pelanggan belanja di website/e-commerce."
                />
              }
              name="is_visible_ecommerce"
              valuePropName="checked"
            >
              <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label={
                <FieldLabel
                  label="Tampil di POS"
                  tooltip="Jika aktif, promo NED ini akan berlaku di aplikasi kasir (Point of Sale)."
                />
              }
              name="is_visible_pos"
              valuePropName="checked"
            >
              <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Card
          title={
            <Tooltip title="Aturan promo: saat pelanggan membeli 'Produk yang Dibeli', sistem otomatis memberikan 'Produk Hadiah' secara gratis.">
              <Space size={4}>
                Aturan Promo NED (Beli → Dapat Hadiah)
                <QuestionCircleOutlined style={{ color: "#aaa", cursor: "help" }} />
              </Space>
            </Tooltip>
          }
          style={{ marginBottom: 16 }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddItem}
            style={{ marginBottom: 16 }}
          >
            Tambah Aturan
          </Button>
          <Table
            columns={itemColumns}
            dataSource={items}
            rowKey={(_, i) => `item-${i}`}
            pagination={false}
            size="small"
            locale={{ emptyText: "Belum ada aturan promo. Klik 'Tambah Aturan' untuk menambahkan." }}
          />
        </Card>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {data?.id ? "Update" : "Buat"} Kampanye NED
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={onCancel}>
            Batal
          </Button>
        </Form.Item>
      </Form>

      <Modal
        title={editingItem ? "Edit Aturan Promo" : "Tambah Aturan Promo"}
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        onOk={handleSaveItem}
        okText="Simpan"
        cancelText="Batal"
        destroyOnClose
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item
            label={
              <FieldLabel
                label="Produk yang Dibeli (Buy)"
                tooltip="Pilih produk dari Master Pool yang harus dibeli pelanggan agar promo ini berlaku."
              />
            }
            name="buy_ned_product_id"
            rules={[{ required: true, message: "Pilih produk yang dibeli" }]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              placeholder={
                loadingProducts
                  ? "Memuat produk..."
                  : nedProducts.length === 0
                    ? "Tidak ada produk tersedia"
                    : "Pilih produk..."
              }
              options={nedProducts}
              loading={loadingProducts}
              disabled={loadingProducts || nedProducts.length === 0}
            />
          </Form.Item>

          <Form.Item
            label={
              <FieldLabel
                label="Produk Hadiah (Get)"
                tooltip="Pilih produk dari Master Pool yang akan diberikan GRATIS kepada pelanggan sebagai hadiah NED."
              />
            }
            name="get_ned_product_id"
            rules={[{ required: true, message: "Pilih produk hadiah" }]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              placeholder={
                loadingProducts
                  ? "Memuat produk..."
                  : nedProducts.length === 0
                    ? "Tidak ada produk tersedia"
                    : "Pilih produk hadiah..."
              }
              options={nedProducts}
              loading={loadingProducts}
              disabled={loadingProducts || nedProducts.length === 0}
            />
          </Form.Item>

          <Form.Item
            label={
              <FieldLabel
                label="Jumlah Hadiah (Get Quantity)"
                tooltip="Jumlah unit produk hadiah yang diberikan kepada pelanggan per transaksi yang memenuhi syarat."
              />
            }
            name="get_quantity"
            rules={[{ required: true, message: "Masukkan jumlah hadiah" }]}
          >
            <InputNumber min={1} placeholder="Jumlah" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FormNED;
