import { Typography } from "antd";
import { useThemeStore } from "../hooks/useThemeStore";
import TableUserCart from "../components/Tables/Dashboard/TableUserCart";

const { Title } = Typography;

export default function AbandonedBagPage() {
  const { isDarkMode } = useThemeStore();

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100vh",
        background: isDarkMode ? "#0c0c0c" : "#f8f9fa",
      }}
    >
      <div
        style={{
          marginBottom: 24,
          padding: "18px 20px",
          borderRadius: 16,
          background: isDarkMode
            ? "linear-gradient(135deg, rgba(31,31,31,0.8), rgba(20,20,20,0.8))"
            : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",
          border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)"}`,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Abandoned Bag
        </Title>
      </div>

      <TableUserCart />
    </div>
  );
}
