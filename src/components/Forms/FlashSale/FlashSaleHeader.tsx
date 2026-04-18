import React from "react";
import { Typography } from "antd";
import { ShoppingOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

const FlashSaleHeader: React.FC = () => {
  return (
    <div
      style={{
        marginBottom: 18,
        padding: "16px 16px 18px",
        borderRadius: 12,
      }}
    >
      <Title
        level={3}
        style={{
          margin: 0,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 700,
        }}
      >
        <ShoppingOutlined
          style={{ color: "var(--ant-primary-color)", fontSize: 16 }}
        />
        Pengaturan Flash Sale
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Buat penawaran flash sale dengan harga khusus dan stok terbatas untuk
        meningkatkan penjualan.
      </Text>
    </div>
  );
};

export default FlashSaleHeader;
