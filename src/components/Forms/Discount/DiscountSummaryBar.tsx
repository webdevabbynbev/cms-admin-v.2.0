import { Badge, Divider, Space, Tag, Typography, theme } from "antd";
import { useThemeStore } from "../../../hooks/useThemeStore";

const { Text } = Typography;

type Props = {
  totalProducts: number;
  totalVariants: number;
  selectedCount: number;
};

const DiscountSummaryBar: React.FC<Props> = ({
  totalProducts,
  totalVariants,
  selectedCount,
}) => {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();

  return (
    <div style={{ marginBottom: 10 }}>
      <Space wrap>
        <Badge
          count={totalProducts}
          showZero
          overflowCount={999}
          style={{ backgroundColor: token.colorPrimary }}
        />
        <Text type="secondary">produk</Text>
        <Divider type="vertical" />
        <Badge
          count={totalVariants}
          showZero
          overflowCount={9999}
          style={{ backgroundColor: token.colorPrimary }}
        />
        <Text type="secondary">varian</Text>
        {selectedCount ? (
          <>
            <Divider type="vertical" />
            <Tag
              style={{
                background: isDarkMode ? token.colorFillAlter : "#FFF0F6",
                border: `1px solid ${isDarkMode ? token.colorBorderSecondary : "#f0d7e5"}`,
                color: isDarkMode ? token.colorPrimary : "#9B3C6C",
              }}
            >
              Dipilih: <b>{selectedCount}</b>
            </Tag>
          </>
        ) : null}
      </Space>
    </div>
  );
};

export default DiscountSummaryBar;
