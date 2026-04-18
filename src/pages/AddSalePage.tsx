import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, Col, Form, Row, Space } from "antd";
import FormSale from "../components/Forms/Sale/FormSale";
import type { SaleRecord } from "../components/Forms/Sale/saleTypes";
import http from "../api/http";

// Helper untuk mengambil array yang TIDAK kosong
const getNonEmptyArray = (...arrays: any[]) => {
  for (const arr of arrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr;
    }
  }
  return [];
};

const normalizeSale = (raw: any): SaleRecord => {
  // Debugging: Cek apa yang dikirim backend
  

  return {
    id: Number(raw?.id ?? 0),
    title: raw?.title ?? raw?.name ?? "",
    description: raw?.description ?? "",
    hasButton: raw?.hasButton ?? raw?.has_button ?? false,
    buttonText: raw?.buttonText ?? raw?.button_text ?? null,
    buttonUrl: raw?.buttonUrl ?? raw?.button_url ?? null,
    startDatetime:
      raw?.startDatetime ?? raw?.start_datetime ?? raw?.startDateTime ?? "",
    endDatetime:
      raw?.endDatetime ?? raw?.end_datetime ?? raw?.endDateTime ?? "",
    isPublish: raw?.isPublish ?? raw?.is_publish ?? false,

    // PERBAIKAN: Prioritaskan array yang ada isinya
    products: getNonEmptyArray(
      raw?.products,
      raw?.sale_products,
      raw?.saleProducts,
      raw?.saleProductsData,
      raw?.details, // Kadang backend simpan di details
    ),

    // PERBAIKAN: Prioritaskan array yang ada isinya
    variants: getNonEmptyArray(
      raw?.variants,
      raw?.sale_variants,
      raw?.saleVariants,
      raw?.product_variants,
    ),
  };
};

const AddSalePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [data, setData] = React.useState<SaleRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitLoading, setSubmitLoading] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      setLoading(true);
      http
        .get(`/admin/sales/${id}`)
        .then((resp) => {
          // Ambil data dari wrapper response yang biasa dipakai (serve / data)
          const rawData =
            resp?.data?.serve ?? resp?.data?.data ?? resp?.data ?? {};
          setData(normalizeSale(rawData));
          setLoading(false);
        })
        .catch((err) => {
          
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading && id) {
    return (
      <Row gutter={16}>
        <Col xs={24} lg={24}>
          <Card loading title="Memuat Data Sale..." />
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={16}>
      <Col xs={24} lg={24}>
        <Card
          title={id ? "Edit Sale" : "Buat Sale"}
          extra={
            <Space>
              <Button onClick={() => navigate("/sale-products")}>Batal</Button>
              <Button
                type="primary"
                loading={submitLoading}
                onClick={() => form.submit()}
              >
                Konfirmasi
              </Button>
            </Space>
          }
        >
          <FormSale
            data={data}
            form={form}
            showSubmitButton={false}
            onLoadingChange={setSubmitLoading}
            handleClose={() => navigate("/sale-products")}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default AddSalePage;
