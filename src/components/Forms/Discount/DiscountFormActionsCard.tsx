import { Button, Card, Col, Row, Space, Typography, theme } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useThemeStore } from "../../../hooks/useThemeStore";

const { Text } = Typography;

type Props = {
  mode: "create" | "edit";
  currentIdentifier: string | null;
  loading: boolean;
  onSubmit: () => void;
  goToList: () => void;
};

const DiscountFormActionsCard: React.FC<Props> = ({
  mode,
  currentIdentifier,
  loading,
  onSubmit,
  goToList,
}) => {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();

  return (
    <Card
      variant="outlined"
      style={{
        marginBottom: 20,
        width: "100%",
        borderRadius: 12,
        boxShadow: isDarkMode ? "none" : "0 10px 24px rgba(155, 60, 108, 0.08)",
        border: `1px solid ${isDarkMode ? token.colorBorderSecondary : "#f0d7e5"}`,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Row align="middle" justify="space-between" gutter={[12, 12]}>
        <Col>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 16 }}>
              {mode === "edit"
                ? `Edit: ${currentIdentifier}`
                : "Form Promo Baru"}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Bulk apply tersedia untuk mempercepat pengaturan diskon
            </Text>
          </Space>
        </Col>
        <Col>
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={goToList}
              size="large"
              style={{ borderRadius: 8 }}
            >
              Kembali
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={loading}
              onClick={onSubmit}
              size="large"
              style={{
                borderRadius: 10,
                height: 40,
                fontWeight: 600,
                background: isDarkMode
                  ? `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
                  : "linear-gradient(135deg, #9b3c6c 0%, #c53d7f 100%)",
                borderColor: isDarkMode ? token.colorPrimary : "#9b3c6c",
                boxShadow: isDarkMode ? "none" : "0 8px 18px rgba(155, 60, 108, 0.2)",
              }}
            >
              Simpan
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default DiscountFormActionsCard;
