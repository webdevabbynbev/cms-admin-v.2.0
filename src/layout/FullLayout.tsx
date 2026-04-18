import React, { type ReactNode } from "react";
import { Card } from "antd";
import loginLeft from "../assets/img/BannerLoginSimako.webp";
import "./FullLayout.css";

interface FullLayoutProps {
  children: ReactNode;
}

const FullLayout: React.FC<FullLayoutProps> = ({ children }) => {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Left Side */}
      <div
        className="left-side"
        style={{ backgroundImage: `url(${loginLeft})` }}
      />

      {/* Right Side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
        }}
      >
        <Card
          variant="borderless"
          style={{
            width: "100%",
            maxWidth: 420,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            borderRadius: 12,
          }}
          styles={{ body: { padding: "40px 30px" } }}
        >
          {children}
        </Card>
      </div>
    </div>
  );
};

export default FullLayout;
