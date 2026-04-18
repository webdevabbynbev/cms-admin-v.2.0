import React from "react";
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  Input,
  message,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import helper from "../../utils/helper"; // ✅ add

const { Title, Link, Text } = Typography;

type Variant = { id: number; sku?: string; barcode?: string };
type Product = {
  id: number;
  name: string;
  variants?: Variant[];
};

type ProductListResp = {
  data?: {
    serve?: { data?: Product[] } | any;
  };
};

type MovementType = "transfer_in" | "transfer_out";

/** upsert token "Key: Value" di note pipe-separated */
function upsertPipeKV(note: string, key: string, value: string) {
  const parts = String(note ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const keyNorm = norm(key);

  let replaced = false;
  const next = parts.map((p) => {
    const idx = p.indexOf(":");
    if (idx <= 0) return p;
    const k = p.slice(0, idx).trim();
    if (norm(k) === keyNorm) {
      replaced = true;
      return `${key}: ${value}`;
    }
    return p;
  });

  if (!replaced) next.push(`${key}: ${value}`);
  return next.join(" | ");
}

export default function StockAdjustmentPage() {
  const nav = useNavigate();
  const [form] = Form.useForm();

  const [productOptions, setProductOptions] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = React.useState(false);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  const movementType: MovementType = Form.useWatch("movementType", form) ?? "transfer_in";
  const productId = Form.useWatch("product_id", form);
  const fromLocation = Form.useWatch("fromLocation", form);

  // ✅ ambil pengirim dari session
  const session = helper.isAuthenticated();
  const myName =
    session?.data?.name ??
    session?.data?.user?.name ??
    session?.data?.admin?.name ??
    "Unknown";

  const myRoleName =
    session?.data?.role_name ??
    session?.data?.roleName ??
    (session?.data?.role ? String(session.data.role) : "");

  const searchProduct = async (keyword: string) => {
    setLoadingProduct(true);
    try {
      const resp = (await http.get(
        `/admin/product?name=${encodeURIComponent(keyword)}&page=1&per_page=10`
      )) as ProductListResp;

      const serve = resp?.data?.serve;
      const data = serve?.data ?? serve?.meta?.data ?? [];
      setProductOptions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal load product");
    } finally {
      setLoadingProduct(false);
    }
  };

  const fetchProductDetail = async (id: number) => {
    setLoadingDetail(true);
    try {
      const resp = await http.get(`/admin/product/${id}`);
      const product = resp?.data?.serve ?? resp?.data?.data ?? resp?.data ?? null;
      setSelectedProduct(product);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal load detail produk");
      setSelectedProduct(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  React.useEffect(() => {
    searchProduct("");
     
  }, []);

  // sync selectedProduct dari product_id
  React.useEffect(() => {
    if (!productId) {
      setSelectedProduct(null);
      form.setFieldValue("variant_id", undefined);
      return;
    }

    const fromList = productOptions.find((p) => String(p.id) === String(productId)) ?? null;
    if (fromList) {
      setSelectedProduct(fromList);
      if (!fromList.variants || fromList.variants.length === 0) {
        fetchProductDetail(Number(productId));
      }
    } else {
      fetchProductDetail(Number(productId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, productOptions]);

  // ✅ kalau bukan Supplier, reset nama supplier
  React.useEffect(() => {
    if (fromLocation !== "Supplier") {
      form.setFieldValue("supplierName", undefined);
    }
  }, [fromLocation, form]);

  const buildNote = (values: any) => {
    const from =
      values.fromLocation === "Supplier"
        ? `From: Supplier${values.supplierName ? ` (${values.supplierName})` : ""}`
        : values.fromLocation
          ? `From: ${values.fromLocation}`
          : "";

    const to = values.toLocation ? `To: ${values.toLocation}` : "";

    const parts = [values.note, values.movementType, from, to]
      .map((x: string) => (x ?? "").trim())
      .filter(Boolean);

    return parts.join(" | ");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Link onClick={() => nav("/stock-movement")}>Stock Movement</Link>
          <Title level={3} style={{ margin: "6px 0 0" }}>
            Tambah Stock Movement
          </Title>
        </div>

        <Space>
          <Button onClick={() => nav("/stock-movement")}>Batal</Button>
          <Button type="primary" onClick={() => form.submit()}>
            Simpan
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 12 }}
        initialValues={{ movementType: "transfer_in" }}
        onFinish={async (values) => {
          try {
            const rawChange = Number(values.change ?? 0);
            if (!rawChange || Number.isNaN(rawChange)) {
              message.error("Perubahan stok wajib diisi");
              return;
            }

            const abs = Math.abs(rawChange);
            const change = values.movementType === "transfer_out" ? -abs : abs;

            // ✅ note dasar
            let note = buildNote(values);

            // ✅ inject pengirim
            note = upsertPipeKV(note, "SentBy", String(myName));
            if (myRoleName) note = upsertPipeKV(note, "SentRole", String(myRoleName));
            note = upsertPipeKV(note, "SentAt", new Date().toISOString());

            await http.post("/admin/stock-movements/adjust", {
              variant_id: values.variant_id,
              change,
              note,
            });

            message.success("Stock movement berhasil disimpan");
            nav("/stock-movement");
          } catch (e: any) {
            message.error(e?.response?.data?.message ?? "Gagal simpan stock movement");
          }
        }}
      >
        <Row gutter={16}>
          {/* LEFT */}
          <Col xs={24} lg={16}>
            <Card title="Umum">
              <Form.Item label="Pilih produk" name="product_id" rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder="Cari Produk"
                  filterOption={false}
                  loading={loadingProduct}
                  notFoundContent={loadingProduct ? <Spin size="small" /> : null}
                  onFocus={() => searchProduct("")}
                  onSearch={(v) => searchProduct(v)}
                  onSelect={(id) => {
                    form.setFieldValue("product_id", id);
                    form.setFieldValue("variant_id", undefined);
                  }}
                  options={productOptions.map((p) => ({ value: p.id, label: p.name }))}
                />
              </Form.Item>

              <Form.Item
                label="Pilih variant (SKU/Barcode)"
                name="variant_id"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder={!productId ? "Pilih produk dulu" : "Pilih variant"}
                  loading={loadingDetail}
                  disabled={!productId || loadingDetail || !(selectedProduct?.variants?.length)}
                  options={(selectedProduct?.variants ?? []).map((v) => {
                    const code = v.sku ?? v.barcode ?? String(v.id);
                    return {
                      value: v.id,
                      label: `${selectedProduct?.name ?? "Produk"} • ${code}`,
                    };
                  })}
                />
              </Form.Item>

              <Form.Item
                label={`Perubahan stok (${movementType === "transfer_out" ? "keluar" : "masuk"})`}
                name="change"
                rules={[{ required: true }]}
                extra={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {movementType === "transfer_out"
                      ? "Transfer Out akan disimpan sebagai nilai minus."
                      : "Transfer In akan disimpan sebagai nilai plus."}
                  </Text>
                }
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>

              <Form.Item label="Catatan" name="note">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Card>
          </Col>

          {/* RIGHT */}
          <Col xs={24} lg={8}>
            <Card title="Rincian">
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">Status</Text>
                <div>
                  <Text strong>Draft</Text>
                </div>
              </div>

              {/* ✅ Dikirim Oleh (read-only) */}
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">Dikirim Oleh</Text>
                <div>
                  <Text strong>
                    {myName}
                    {myRoleName ? ` (${myRoleName})` : ""}
                  </Text>
                </div>
              </div>

              <Form.Item label="Jenis Movement" name="movementType" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "transfer_in", label: "Transfer In (Masuk)" },
                    { value: "transfer_out", label: "Transfer Out (Keluar)" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="Dari"
                name="fromLocation"
                rules={[{ required: true, message: "Dari wajib diisi" }]}
              >
                <Select
                  placeholder="Pilih asal"
                  options={[
                    { value: "Gudang PRJ", label: "Gudang PRJ" },
                    { value: "Stok Web", label: "Stok Web" },
                    { value: "Supplier", label: "Supplier" },
                  ]}
                />
              </Form.Item>

              {fromLocation === "Supplier" && (
                <Form.Item
                  label="Nama Supplier"
                  name="supplierName"
                  rules={[{ required: true, message: "Nama supplier wajib diisi" }]}
                >
                  <Input placeholder="Contoh: PT. ABC Jaya" />
                </Form.Item>
              )}

              <Form.Item
                label="Ke"
                name="toLocation"
                rules={[{ required: true, message: "Ke wajib diisi" }]}
              >
                <Select
                  placeholder="Pilih tujuan"
                  options={[
                    { value: "Gudang PRJ", label: "Gudang PRJ" },
                    { value: "Stok Web", label: "Stok Web" },
                    { value: "Outlet", label: "Outlet" },
                  ]}
                />
              </Form.Item>

              <div>
                <Text type="secondary">Tips</Text>
                <div>
                  <Text>Transfer Out otomatis jadi minus, Transfer In otomatis jadi plus.</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
