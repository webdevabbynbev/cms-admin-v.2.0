import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, Col, Form, Row, Space } from "antd";
import FormFlashSale from "../components/Forms/FlashSale/FormFlashSale";
import type { FlashSaleRecord } from "../components/Forms/FlashSale/flashTypes";
import { getFlashSaleDetail } from "../api/flash-sale";
import { normalizeFlashSale } from "../services/api/flash-sale/flashsale.mapper";

const AddFlashSalePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [data, setData] = React.useState<FlashSaleRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const flashSaleId = Number(id);
  const resolvedFlashSaleId = Number.isFinite(flashSaleId) ? flashSaleId : undefined;

  React.useEffect(() => {
    if (id) {
      setLoading(true);
      getFlashSaleDetail(id).then((resp) => {
          const rawData =
            resp?.data?.serve ?? resp?.data?.data ?? resp?.data ?? {};
          setData(normalizeFlashSale(rawData));
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
          <Card loading title="Memuat Data Flash Sale..." />
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={16}>
      <Col xs={24} lg={24}>
        <Card
          title={id ? "Edit Flash Sale" : "Buat Flash Sale"}
          extra={
            <Space>
              <Button onClick={() => navigate("/flash-sale")}>Batal</Button>
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
          <FormFlashSale
            data={data}
            form={form}
            flashSaleId={resolvedFlashSaleId}
            showSubmitButton={false}
            onLoadingChange={setSubmitLoading}
            handleClose={() => navigate("/flash-sale")}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default AddFlashSalePage;
