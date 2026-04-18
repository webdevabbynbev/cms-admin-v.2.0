import { Pagination } from "antd";

type TablePaginationProps = {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
};

export default function TablePagination({
  current,
  pageSize,
  total,
  onChange,
  pageSizeOptions = [10, 20, 50, 100],
  showSizeChanger = true,
}: TablePaginationProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 12,
      }}
    >
      <Pagination
        current={current}
        pageSize={pageSize}
        total={total}
        showSizeChanger={showSizeChanger}
        pageSizeOptions={pageSizeOptions.map(String)}
        showTotal={(t, range) => `${range[0]}-${range[1]} dari ${t}`}
        onChange={onChange}
      />
    </div>
  );
}
