import { useEffect, useMemo, useState } from "react";
import { Table } from "antd";
import type { TablePaginationConfig, TableProps } from "antd/es/table";
import TablePagination from "../Tables/Pagination/TablePagination";

type SalesDetailRow = Record<string, any>;

type DetailTableProps = {
  dataSource: SalesDetailRow[];
  loading?: boolean;
  columns: any[];
};

export default function DetailTable({
  dataSource,
  loading = false,
  columns,
}: DetailTableProps) {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const total = dataSource.length;

  const handleTableChange: TableProps<SalesDetailRow>["onChange"] = (
    nextPagination,
  ) => {
    const pg = (nextPagination as TablePaginationConfig).current ?? 1;
    const psz = (nextPagination as TablePaginationConfig).pageSize ?? 10;
    setPage(pg);
    setPageSize(psz);
  };

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [total, pageSize, page]);

  const effectiveColumns = useMemo(
    () =>
      columns.map((col) => {
        if (col?.key !== "index") return col;
        return {
          ...col,
          render: (_: any, __: SalesDetailRow, index: number) =>
            (page - 1) * pageSize + index + 1,
        };
      }),
    [columns, page, pageSize],
  );

  return (
    <div>
      <Table<SalesDetailRow>
        rowKey={(row: SalesDetailRow, index?: number) => {
          if (row.id !== undefined && row.id !== null) return String(row.id);

          const composed = [
            row.date ?? row.transaction_date ?? row.created_at ?? row.period ?? "",
            row.product_id ?? "",
            row.variant_id ?? "",
            row.sku ?? "",
            row.name ?? row.product_name ?? "",
            row.brand_name ?? row.brand ?? "",
            row.total_transactions ?? "",
            row.total_sold ?? "",
            row.total_revenue ?? "",
            index ?? 0,
          ]
            .map((v) => String(v))
            .join("|");

          return composed;
        }}
        dataSource={dataSource}
        loading={loading}
        columns={effectiveColumns as any}
        sortDirections={["ascend", "descend", "ascend"]}
        pagination={{
          current: page,
          pageSize: pageSize,
          total,
          position: ["none", "none"],
        }}
        onChange={handleTableChange}
        locale={{ emptyText: "Tidak ada data untuk periode ini" }}
        scroll={{ x: "max-content" }}
      />
      <TablePagination
        current={page}
        pageSize={pageSize}
        total={total}
        onChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
        }}
      />
    </div>
  );
}
