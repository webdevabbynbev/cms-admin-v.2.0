import React from "react";
import { Typography, theme } from "antd";
import { TagOutlined } from "@ant-design/icons";
import { useThemeStore } from "../../../hooks/useThemeStore";

const { Text, Title } = Typography;

const SaleHeader: React.FC = () => {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();

  return (
    <div
      style={{
        marginBottom: 18,
        padding: "16px 16px 18px",
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
        background: isDarkMode 
          ? token.colorBgContainer 
          : `linear-gradient(135deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 55%)`,
      }}
    >
      <Title
        level={3}
        style={{
          margin: 0,
          marginBottom: 6,
          fontWeight: 700,
          color: isDarkMode ? token.colorPrimary : token.colorTextHeading,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <TagOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
        Pengaturan Sale
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Kelola judul, periode, dan daftar varian yang ikut dalam kampanye sale
        Anda.
      </Text>
    </div>
  );
};

export default SaleHeader;
