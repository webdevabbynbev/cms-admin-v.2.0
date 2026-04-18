import React from "react";
import { GiftOutlined } from "@ant-design/icons";

const SaleHeaderSection: React.FC = () => {
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
        <GiftOutlined style={{ fontSize: 28, color: "#C53D7F" }} />
        Kelola Sale & Promosi
      </h2>
      <p style={{ color: "#8c8c8c", fontSize: 14, margin: 0 }}>
        Pantau, kelola, dan optimalkan kampanye sale Anda secara real-time.
      </p>
    </div>
  );
};

export default SaleHeaderSection;
