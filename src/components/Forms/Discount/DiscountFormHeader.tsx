import { Typography, theme } from "antd";
import { TagOutlined } from "@ant-design/icons";
import { useThemeStore } from "../../../hooks/useThemeStore";

const { Title, Text } = Typography;

type Props = { mode: "create" | "edit" };

const DiscountFormHeader: React.FC<Props> = ({ mode }) => {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();

  return (
    <div
      style={{
        marginBottom: 18,
        padding: "16px 16px 18px",
        borderRadius: 12,
        border: `1px solid ${isDarkMode ? token.colorBorderSecondary : "#f0d7e5"}`,
        background: isDarkMode
          ? `linear-gradient(135deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 55%)`
          : "linear-gradient(135deg, #fff6fb 0%, #ffffff 55%)",
      }}
    >
      <Title
        level={3}
        style={{
          margin: 0,
          marginBottom: 6,
          color: isDarkMode ? token.colorText : "#4b1e33",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 700,
        }}
      >
        <TagOutlined style={{ fontSize: 18, color: isDarkMode ? token.colorPrimary : "#9b3c6c" }} />
        {mode === "edit" ? "Edit Promo Diskon" : "Buat Promo Diskon"}
      </Title>
      <Text type="secondary" style={{ fontSize: 12, color: isDarkMode ? token.colorTextDescription : "#7b5b6b" }}>
        Atur nama, periode, dan diskon per varian untuk meningkatkan penjualan
        produk.
      </Text>
    </div>
  );
};

export default DiscountFormHeader;
