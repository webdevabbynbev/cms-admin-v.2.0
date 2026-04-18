import React from "react";
import { Card, Col, Form, Input, Row, theme } from "antd";
import { TagsOutlined } from "@ant-design/icons";
import { useThemeStore } from "../../../hooks/useThemeStore";

const SaleInfoCard: React.FC = () => {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();

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
            color: isDarkMode ? token.colorPrimary : token.colorTextHeading,
          }}
        >
          <TagsOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
          Informasi Sale
        </span>
      }
      style={{
        marginBottom: 20,
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: isDarkMode ? "none" : token.boxShadowTertiary,
        background: isDarkMode ? token.colorBgContainer : "#fff",
      }}
      headStyle={{
        background: isDarkMode 
          ? token.colorBgElevated 
          : `linear-gradient(90deg, ${token.colorFillAlter} 0%, #ffffff 60%)`,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      }}
      bodyStyle={{ padding: 20 }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            label={<span style={{ fontWeight: 500, color: token.colorText }}>Judul Sale</span>}
            name="title"
            rules={[{ required: true, message: "Judul wajib diisi" }]}
          >
            <Input placeholder="Contoh: Sale Weekend" allowClear size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label={<span style={{ fontWeight: 500, color: token.colorText }}>Deskripsi</span>}
            name="description"
          >
            <Input.TextArea
              rows={2}
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="Opsional - Deskripsi singkat tentang sale"
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default SaleInfoCard;
