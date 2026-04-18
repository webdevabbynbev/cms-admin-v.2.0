import React from "react";
import { Card, Col, DatePicker, Form, Row, Switch, theme } from "antd";
import { CalendarOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useThemeStore } from "../../../hooks/useThemeStore";

const SaleScheduleCard: React.FC = () => {
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
          <CalendarOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
          Rentang Waktu & Status
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
        <Col xs={24} md={8}>
          <Form.Item
            label={
              <span
                style={{
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: token.colorText,
                }}
              >
                <CalendarOutlined style={{ color: token.colorPrimary }} />
                Tanggal Mulai
              </span>
            }
            name="start_datetime"
            rules={[{ required: true, message: "Tanggal mulai harus diisi" }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
              size="large"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label={
              <span
                style={{
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: token.colorText,
                }}
              >
                <CalendarOutlined style={{ color: token.colorPrimary }} />
                Tanggal Selesai
              </span>
            }
            name="end_datetime"
            rules={[{ required: true, message: "Tanggal selesai harus diisi" }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
              size="large"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label={
              <span
                style={{
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: token.colorText,
                }}
              >
                <CheckCircleOutlined style={{ color: token.colorPrimary }} />
                Status Publikasi
              </span>
            }
            name="is_publish"
            valuePropName="checked"
            extra={
              <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
                Published akan tampil di halaman user. Draft disembunyikan.
              </span>
            }
          >
            <Switch checkedChildren="Published" unCheckedChildren="Draft" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default SaleScheduleCard;
