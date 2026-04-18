import React from "react";
import { Button, Card, Col, Row, Space } from "antd";
import FormVoucher from "../../components/Forms/Voucher/FormVoucher";
import { useVoucherFormPageHooks } from "../../hooks/voucher";

const VoucherFormPage: React.FC = () => {
  const { id, navigate, data, loading } = useVoucherFormPageHooks();

  if (loading) {
    return (
      <Row gutter={16}>
        <Col xs={24} lg={24}>
          <Card loading title="Memuat Data Voucher..." />
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={16}>
      <Col xs={24} lg={24}>
        <Card
          title={id ? "Edit Voucher" : "Buat Voucher"}
          extra={
            <Space>
              <Button onClick={() => navigate("/voucher")}>Kembali</Button>
            </Space>
          }
        >
          <FormVoucher
            data={data}
            handleClose={() => navigate("/voucher")}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default VoucherFormPage;
