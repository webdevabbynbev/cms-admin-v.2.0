import { Typography, theme } from "antd";
import { TagOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

const DiscountHeaderSection: React.FC = () => {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        marginBottom: 24,
        paddingBottom: 20,
        borderBottom: `2.5px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Title
        level={2}
        style={{
          margin: 0,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: token.colorText,
        }}
      >
        <TagOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
        Kelola Diskon & Promo
      </Title>
      <Text type="secondary" style={{ fontSize: 14 }}>
        Buat dan kelola diskon untuk meningkatkan penjualan dengan penawaran menarik.
      </Text>
    </div>
  );
};

export default DiscountHeaderSection;
