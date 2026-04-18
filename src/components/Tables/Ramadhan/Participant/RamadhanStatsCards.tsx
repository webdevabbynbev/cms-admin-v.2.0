// RamadanStatsCards.tsx
import React from "react";
import { Card, Row, Col, Statistic, theme } from "antd";
import { UserOutlined, TrophyOutlined } from "@ant-design/icons";
import type { StatsType } from "./ramadhanTypes";

interface RamadanStatsCardsProps {
  stats: StatsType;
}

const RamadanStatsCards: React.FC<RamadanStatsCardsProps> = ({ stats }) => {
  const { token } = theme.useToken();
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
      <Col xs={24} sm={12} md={6}>
        <Card
          className="shadow"
          style={{
            background: token.colorFillAlter,
            borderRadius: "8px",
            boxShadow: token.boxShadowTertiary,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`
          }}
          styles={{ body: { padding: "24px", textAlign: "center" } }}
        >
          <Statistic
            title={
              <span
                style={{
                  color: token.colorTextDescription,
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Total Peserta
              </span>
            }
            value={stats.totalParticipants}
            prefix={
              <UserOutlined style={{ color: token.colorPrimary, fontSize: "28px" }} />
            }
            valueStyle={{
              color: token.colorText,
              fontSize: "32px",
              fontWeight: 700,
            }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          className="shadow"
          style={{
            background: token.colorFillAlter,
            borderRadius: "8px",
            boxShadow: token.boxShadowTertiary,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`
          }}
          styles={{ body: { padding: "24px", textAlign: "center" } }}
        >
          <Statistic
            title={
              <span
                style={{
                  color: token.colorTextDescription,
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Check-in ≥ 7 Hari
              </span>
            }
            value={stats.totalWith7Days}
            prefix={
              <TrophyOutlined style={{ color: token.colorPrimary, fontSize: "28px" }} />
            }
            valueStyle={{
              color: token.colorText,
              fontSize: "32px",
              fontWeight: 700,
            }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          className="shadow"
          style={{
            background: token.colorFillAlter,
            borderRadius: "8px",
            boxShadow: token.boxShadowTertiary,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`
          }}
          styles={{ body: { padding: "24px", textAlign: "center" } }}
        >
          <Statistic
            title={
              <span
                style={{
                  color: token.colorTextDescription,
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Check-in ≥ 15 Hari
              </span>
            }
            value={stats.totalWith15Days}
            prefix={
              <TrophyOutlined style={{ color: token.colorPrimary, fontSize: "28px" }} />
            }
            valueStyle={{
              color: token.colorText,
              fontSize: "32px",
              fontWeight: 700,
            }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          className="shadow"
          style={{
            background: token.colorFillAlter,
            borderRadius: "8px",
            boxShadow: token.boxShadowTertiary,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`
          }}
          styles={{ body: { padding: "24px", textAlign: "center" } }}
        >
          <Statistic
            title={
              <span
                style={{
                  color: token.colorTextDescription,
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Check-in ≥ 30 Hari
              </span>
            }
            value={stats.totalWith30Days}
            prefix={
              <TrophyOutlined style={{ color: token.colorPrimary, fontSize: "28px" }} />
            }
            valueStyle={{
              color: token.colorText,
              fontSize: "32px",
              fontWeight: 700,
            }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default RamadanStatsCards;
