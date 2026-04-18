import React from "react";
import { Card, Col, Row, Statistic } from "antd";
import {
  ShoppingOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

type Props = {
  stats: {
    total: number;
    active: number;
    upcoming: number;
    ended: number;
  };
};

const FlashSaleStatsCards: React.FC<Props> = ({ stats }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            background: "#FEF0F3",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(155, 60, 108, 0.15)",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 24, textAlign: "center" }}
        >
          <Statistic
            title={
              <span style={{ color: "#9B3C6C", fontSize: 13, fontWeight: 500 }}>
                Total Flash Sale
              </span>
            }
            value={stats.total}
            prefix={
              <ShoppingOutlined style={{ color: "#9B3C6C", fontSize: 28 }} />
            }
            valueStyle={{ color: "#9B3C6C", fontSize: 32, fontWeight: 700 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            background: "#FEF0F3",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(155, 60, 108, 0.15)",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 24, textAlign: "center" }}
        >
          <Statistic
            title={
              <span style={{ color: "#9B3C6C", fontSize: 13, fontWeight: 500 }}>
                Sedang Berjalan
              </span>
            }
            value={stats.active}
            prefix={<SyncOutlined style={{ color: "#9B3C6C", fontSize: 28 }} />}
            valueStyle={{ color: "#9B3C6C", fontSize: 32, fontWeight: 700 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            background: "#FEF0F3",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(155, 60, 108, 0.15)",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 24, textAlign: "center" }}
        >
          <Statistic
            title={
              <span style={{ color: "#9B3C6C", fontSize: 13, fontWeight: 500 }}>
                Akan Datang
              </span>
            }
            value={stats.upcoming}
            prefix={
              <ClockCircleOutlined style={{ color: "#9B3C6C", fontSize: 28 }} />
            }
            valueStyle={{ color: "#9B3C6C", fontSize: 32, fontWeight: 700 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            background: "#FEF0F3",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(155, 60, 108, 0.15)",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 24, textAlign: "center" }}
        >
          <Statistic
            title={
              <span style={{ color: "#9B3C6C", fontSize: 13, fontWeight: 500 }}>
                Berakhir
              </span>
            }
            value={stats.ended}
            prefix={
              <CheckCircleOutlined style={{ color: "#9B3C6C", fontSize: 28 }} />
            }
            valueStyle={{ color: "#9B3C6C", fontSize: 32, fontWeight: 700 }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default FlashSaleStatsCards;
