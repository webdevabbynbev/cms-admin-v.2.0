import { Tabs } from "antd";
import TableB1G1 from "../../components/Tables/B1G1/TableB1G1";
import TableB1G1Products from "../../components/Tables/B1G1/TableB1G1Products";

export default function B1G1Page() {
  const items = [
    {
      key: "1",
      label: "Campaigns (Bundling)",
      children: <TableB1G1 />,
    },
    {
      key: "2",
      label: "Master Products (Pool)",
      children: <TableB1G1Products />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
}
