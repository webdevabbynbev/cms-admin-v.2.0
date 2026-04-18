import { useEffect } from "react";
import {
    Form,
    Input,
    Button,
    InputNumber,
    Row,
    Col,
    Modal,
    message,
    Space,
    Tooltip,
} from "antd";
import type { FormInstance } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import http from "../../../api/http";

export interface NEDProductFormRecord {
    id?: number;
    sku: string;
    nama_produk: string;
    varian?: string;
    price?: number;
    discount_percent?: number;
    stock_jual?: number;
    stock_free_gift?: number;
}

interface FormNEDProductProps {
    data?: NEDProductFormRecord | null;
    form: FormInstance;
    open: boolean;
    onSuccess: () => void;
    onCancel: () => void;
}

/** Helper: label form dengan tooltip info */
const FieldLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
    <Space size={4}>
        {label}
        <Tooltip title={tooltip}>
            <QuestionCircleOutlined style={{ color: "#aaa", cursor: "help" }} />
        </Tooltip>
    </Space>
);

const FormNEDProduct: React.FC<FormNEDProductProps> = ({
    data,
    form,
    open,
    onSuccess,
    onCancel,
}) => {
    useEffect(() => {
        if (open) {
            if (data) {
                form.setFieldsValue({
                    sku: data.sku,
                    nama_produk:
                        data.nama_produk ||
                        (data as any).namaProduk ||
                        (data as any).name,
                    varian: data.varian || (data as any).varian || "",
                    price:
                        data.price !== undefined ? data.price : (data as any).het,
                    discount_percent:
                        data.discount_percent !== undefined
                            ? data.discount_percent
                            : (data as any).discountPercent,
                    stock_jual:
                        data.stock_jual !== undefined
                            ? data.stock_jual
                            : (data as any).stockJual,
                    stock_free_gift:
                        data.stock_free_gift !== undefined
                            ? data.stock_free_gift
                            : (data as any).stockFreeGift,
                });
            } else {
                form.resetFields();
            }
        }
    }, [data, form, open]);

    const onFinish = async (values: NEDProductFormRecord) => {
        try {
            if (data?.id) {
                await http.put(`/admin/ned-products/${data.id}`, values);
                message.success("Produk berhasil diperbarui");
            } else {
                await http.post("/admin/ned-products", values);
                message.success("Produk berhasil ditambahkan ke pool NED");
            }
            onSuccess();
        } catch (error: any) {
            
            message.error(error?.response?.data?.message || "Gagal menyimpan produk");
        }
    };

    return (
        <Modal
            title={
                data?.id
                    ? "Edit Master NED Product"
                    : "Tambah Produk ke Master NED Pool"
            }
            open={open}
            onCancel={onCancel}
            footer={null}
            width={620}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    discount_percent: 0,
                    stock_jual: 0,
                    stock_free_gift: 0,
                }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="sku"
                            label={
                                <FieldLabel
                                    label="SKU"
                                    tooltip="Kode unik produk (barcode/SKU) yang terdaftar di sistem. Harus cocok dengan SKU di katalog produk utama agar promo NED bisa diterapkan saat checkout."
                                />
                            }
                            rules={[{ required: true, message: "SKU wajib diisi" }]}
                        >
                            <Input placeholder="Scan barcode atau ketik SKU..." />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="nama_produk"
                            label={
                                <FieldLabel
                                    label="Nama Produk"
                                    tooltip="Nama lengkap produk yang akan masuk ke program NED. Pastikan nama sesuai dengan katalog produk."
                                />
                            }
                            rules={[{ required: true, message: "Nama produk wajib diisi" }]}
                        >
                            <Input placeholder="Nama Produk" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name="varian"
                            label={
                                <FieldLabel
                                    label="Varian"
                                    tooltip="Varian spesifik produk ini, misalnya: warna, ukuran, atau rasa. Kosongkan jika produk tidak memiliki varian."
                                />
                            }
                        >
                            <Input placeholder="Contoh: Merah, 250ml, Original (opsional)" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="price"
                            label={
                                <FieldLabel
                                    label="HET / Harga (Rp)"
                                    tooltip="Harga Eceran Tertinggi (HET) — harga jual resmi produk ini ke konsumen akhir. Digunakan sebagai dasar perhitungan diskon NED."
                                />
                            }
                            rules={[{ required: true, message: "Harga wajib diisi" }]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                addonBefore="Rp"
                                placeholder="0"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="discount_percent"
                            label={
                                <FieldLabel
                                    label="Discount (%)"
                                    tooltip="Persentase diskon yang diberikan kepada pelanggan saat membeli produk ini dalam program NED. Isi 0 jika tidak ada diskon (hanya free gift)."
                                />
                            }
                        >
                            <InputNumber
                                min={0}
                                max={100}
                                style={{ width: "100%" }}
                                addonAfter="%"
                                placeholder="0"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="stock_jual"
                            label={
                                <FieldLabel
                                    label="Stock Sales"
                                    tooltip="Jumlah stok produk ini yang tersedia untuk dijual melalui program NED. Stok ini dikurangi saat transaksi berhasil dibayar."
                                />
                            }
                            rules={[{ required: true, message: "Stok jual wajib diisi" }]}
                        >
                            <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="stock_free_gift"
                            label={
                                <FieldLabel
                                    label="Stock Free Gift"
                                    tooltip="Kuota total hadiah gratis yang tersedia dalam program NED ini. Stok ini dikurangi setiap kali pelanggan berhasil mendapatkan hadiah NED."
                                />
                            }
                            rules={[{ required: true, message: "Stok free gift wajib diisi" }]}
                        >
                            <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
                        </Form.Item>
                    </Col>
                </Row>

                <div style={{ textAlign: "right", marginTop: 8 }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>
                        Batal
                    </Button>
                    <Button type="primary" htmlType="submit">
                        Simpan
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default FormNEDProduct;
