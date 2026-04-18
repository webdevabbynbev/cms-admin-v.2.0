import { theme } from "antd";

const DiscountTableStyles: React.FC = () => {
  const { token } = theme.useToken();
  return (
    <style>{`
      .table-row-light {
        background-color: ${token.colorBgContainer};
      }
      .table-row-dark {
        background-color: ${token.colorFillAlter};
      }
      .ant-table-expanded-row > .ant-table-cell {
        background-color: ${token.colorFillAlter} !important;
      }
      .ant-table-tbody > tr:hover > td {
        background-color: ${token.colorFillSecondary} !important;
      }
    `}</style>
  );
};

export default DiscountTableStyles;
