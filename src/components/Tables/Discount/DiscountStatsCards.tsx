import { Card, Col, Row, Statistic, theme } from "antd";
import {
  FireOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { promoStatus } from "../../../utils/discount/table";
import type { DiscountRecord } from "../../../services/api/discount/discount.types";

type Props = {
  total: number;
  filteredData: DiscountRecord[];
};

const DiscountStatsCards: React.FC<Props> = ({ total, filteredData }) => {
  const { token } = theme.useToken();
  const runningCount = filteredData.filter(
    (r) => promoStatus(r).label === "Sedang Berjalan",
  ).length;
  const upcomingCount = filteredData.filter(
    (r) => promoStatus(r).label === "Akan Datang",
  ).length;
  const endedCount = filteredData.filter(
    (r) => promoStatus(r).label === "Berakhir",
  ).length;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            background: token.colorFillAlter,
            borderRadius: 8,
            boxShadow: token.boxShadowTertiary,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`
          }}
          styles={{ body: { padding: 24, textAlign: "center" } }}
        >
          <Statistic
            title={
              <span style={{ color: token.colorTextDescription, fontSize: 13, fontWeight: 500 }}>
                Total Promo
              </span>
            }
            value={total}
            prefix={<TagOutlined style={{ color: token.colorPrimary, fontSize: 28 }} />}
            valueStyle={{ color: token.colorText, fontSize: 32, fontWeight: 700 }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            background: token.colorFillAlter,
            borderRadius: 8,
            boxShadow: token.boxShadowTertiary,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`
          }}
          styles={{ body: { padding: 24, textAlign: "center" } }}
        >
          <Statistic
            title={
              <span style={{ color: token.colorTextDescription, fontSize: 13, fontWeight: 500 }}>
                Sedang Berjalan
              </span>
            }
            value={runningCount}
            prefix={<FireOutlined style={{ color: token.colorPrimary, fontSize: 28 }} />}
            valueStyle={{ color: token.colorText, fontSize: 32, fontWeight: 700 }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            background: token.colorFillAlter,
            borderRadius: 8,
            boxShadow: token.boxShadowTertiary,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`
          }}
          styles={{ body: { padding: 24, textAlign: "center" } }}
        >
          <Statistic
            title={
              <span style={{ color: token.colorTextDescription, fontSize: 13, fontWeight: 500 }}>
                Akan Datang
              </span>
            }
            value={upcomingCount}
            prefix={<ClockCircleOutlined style={{ color: token.colorPrimary, fontSize: 28 }} />}
            valueStyle={{ color: token.colorText, fontSize: 32, fontWeight: 700 }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            background: token.colorFillAlter,
            borderRadius: 8,
            boxShadow: token.boxShadowTertiary,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`
          }}
          styles={{ body: { padding: 24, textAlign: "center" } }}
        >
          <Statistic
            title={
              <span style={{ color: token.colorTextDescription, fontSize: 13, fontWeight: 500 }}>
                Berakhir
              </span>
            }
            value={endedCount}
            prefix={<CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 28 }} />}
            valueStyle={{ color: token.colorText, fontSize: 32, fontWeight: 700 }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default DiscountStatsCards;
