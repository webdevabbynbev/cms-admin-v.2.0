import React from "react";
import { Card, Col, Form, Input, Row } from "antd";
import { ShoppingOutlined } from "@ant-design/icons";

const FlashSaleInfoCard: React.FC = () => {
  return (
    <Card
      size="small"
      title={
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
          }}
        >
          <ShoppingOutlined
            style={{ color: "var(--ant-primary-color)", fontSize: 14 }}
          />
          Informasi Flash Sale
        </span>
      }
      style={{
        marginBottom: 20,
        borderRadius: 12,
      }}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Judul Flash Sale"
            name="title"
            rules={[{ required: true, message: "Judul wajib diisi" }]}
          >
            <Input placeholder="Contoh: Flash Sale 12.12" allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Deskripsi" name="description">
            <Input.TextArea
              rows={2}
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="Opsional"
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default FlashSaleInfoCard;
