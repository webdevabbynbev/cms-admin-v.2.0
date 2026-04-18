import React from "react";
import { ThunderboltOutlined } from "@ant-design/icons";

const FlashSaleHeaderSection: React.FC = () => {
  return (
    <div
      style={{
        marginBottom: 28,
        paddingBottom: 20,
        borderBottom: "2px solid #f0f0f0",
      }}
    >
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 8,
          color: "#262626",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <ThunderboltOutlined style={{ fontSize: 28, color: "#faad14" }} />
        Kelola Flash Sale
      </h2>
      <p style={{ color: "#8c8c8c", fontSize: 14, margin: 0 }}>
        Buat dan kelola penawaran flash sale terbatas dengan harga spesial untuk
        meningkatkan penjualan.
      </p>
    </div>
  );
};

export default FlashSaleHeaderSection;
