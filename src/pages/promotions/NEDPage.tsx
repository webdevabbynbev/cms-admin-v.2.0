import { Tabs, Typography, Tooltip, Space, Tag } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import TableNED from "../../components/Tables/NED/TableNED";
import TableNEDProducts from "../../components/Tables/NED/TableNEDProducts";

const { Title, Text } = Typography;

const tabTooltips: Record<string, string> = {
  "1": "Kampanye NED: konfigurasi aturan promo (produk mana yang dibeli → mendapat produk/gift apa).",
  "2": "Master Pool Produk: daftar produk yang terdaftar dalam program NED beserta stok dan informasi gift-nya.",
};

const tabLabel = (key: string, label: string) => (
  <Tooltip title={tabTooltips[key]} placement="bottom">
    <Space size={4}>
      {label}
      <InfoCircleOutlined style={{ fontSize: 12, color: "#aaa" }} />
    </Space>
  </Tooltip>
);

export default function NEDPage() {
  const items = [
    {
      key: "1",
      label: tabLabel("1", "Campaigns (Bundling)"),
      children: <TableNED />,
    },
    {
      key: "2",
      label: tabLabel("2", "Master Products (Pool)"),
      children: <TableNEDProducts />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Space align="center" size={8}>
          <Title level={4} style={{ margin: 0 }}>
            NED – Near Expired Date
          </Title>
          <Tag color="orange" style={{ fontSize: 12 }}>
            Promo
          </Tag>
        </Space>
        <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
          Program promosi di mana pelanggan yang membeli produk mendekati tanggal kadaluwarsa
          akan mendapatkan <strong>diskon</strong> dan/atau <strong>hadiah gratis (free gift)</strong> secara otomatis.
        </Text>
      </div>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
}
