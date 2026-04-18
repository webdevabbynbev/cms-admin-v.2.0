import React from "react";
import { Skeleton, Table, theme } from "antd";
import { CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type {
  BrandGroupRow,
  ProductGroupRow,
  VariantRow,
} from "../../../hooks/discount/discountFormTypes";

type Props = {
  inputMode: "product" | "brand" | "all" | "variant";
  autoExpand?: boolean;
  loading?: boolean;
  brandGroups: BrandGroupRow[];
  productGroups: ProductGroupRow[];
  variantRows?: VariantRow[];
  brandColumns: ColumnsType<BrandGroupRow>;
  productColumns: ColumnsType<ProductGroupRow>;
  variantColumns: ColumnsType<VariantRow>;
  defaultExpandedRowKeys: string[];
  defaultExpandedBrandKeys: string[];
  selectedVariantIds: number[];
  setSelectedVariantIds: (ids: number[]) => void;
};

const DiscountVariantsTables: React.FC<Props> = ({
  inputMode,
  autoExpand = true,
  loading = false,
  brandGroups,
  productGroups,
  variantRows = [],
  brandColumns,
  productColumns,
  variantColumns,
  defaultExpandedRowKeys,
  defaultExpandedBrandKeys,
  selectedVariantIds,
  setSelectedVariantIds,
}) => {
  const { token } = theme.useToken();
  const nestedProductPagination = React.useMemo(
    () => ({
      pageSize: 10,
      showSizeChanger: true,
      pageSizeOptions: [5, 10, 20, 50],
      size: "small" as const,
    }),
    [],
  );
  const nestedVariantPagination = React.useMemo(
    () => ({
      pageSize: 10,
      showSizeChanger: true,
      pageSizeOptions: [5, 10, 20, 50],
      size: "small" as const,
    }),
    [],
  );
  const variantRowSelection = React.useMemo(
    () => ({
      selectedRowKeys: selectedVariantIds,
      onChange: (keys: React.Key[]) =>
        setSelectedVariantIds(keys.map((k) => Number(k))),
    }),
    [selectedVariantIds, setSelectedVariantIds],
  );
  const renderExpandIcon = (
    expanded: boolean,
    onExpand: (record: any, e: React.MouseEvent<HTMLElement>) => void,
    record: any,
  ) => (
    <span
      className="discount-expand-icon"
      onClick={(e) => onExpand(record, e)}
      aria-label={expanded ? "Collapse row" : "Expand row"}
      role="button"
      tabIndex={0}
    >
      {expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
    </span>
  );
  const emptyState = loading ? (
    <Skeleton active paragraph={{ rows: 4 }} />
  ) : (
    "Belum ada produk. Tambahkan produk dulu."
  );

  return (
    <>
      {inputMode === "variant" ? (
        <Table<VariantRow>
          rowKey="productVariantId"
          dataSource={variantRows}
          columns={variantColumns}
          size="middle"
          loading={loading}
          virtual
          className="discount-variants-table"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50, 100],
          }}
          scroll={{ x: 1200, y: 560 }}
          tableLayout="fixed"
          rowClassName={(r) => (!r.isActive ? "row-disabled" : "")}
          rowSelection={variantRowSelection}
          locale={{
            emptyText: emptyState,
          }}
        />
      ) : inputMode === "brand" ? (
        <Table<BrandGroupRow>
          rowKey="key"
          dataSource={brandGroups}
          columns={brandColumns}
          size="middle"
          loading={loading}
          virtual
          className="discount-variants-table"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50, 100],
          }}
          scroll={{ x: 1200, y: 560 }}
          expandable={{
            defaultExpandedRowKeys: autoExpand ? defaultExpandedBrandKeys : [],
            expandIcon: ({ expanded, onExpand, record }) =>
              renderExpandIcon(expanded, onExpand, record),
            expandedRowRender: (brand) => (
              <div style={{ padding: "8px 8px 0" }}>
                <Table<ProductGroupRow>
                  rowKey="key"
                  dataSource={brand.products}
                  columns={productColumns}
                  size="small"
                  pagination={nestedProductPagination}
                  expandable={{
                    // Performance: cap auto-expand to first 5 products per brand
                    // to avoid mounting too many variant tables at once.
                    defaultExpandedRowKeys: autoExpand
                      ? brand.products.slice(0, 5).map((item) => item.key)
                      : [],
                    expandIcon: ({ expanded, onExpand, record }) =>
                      renderExpandIcon(expanded, onExpand, record),
                    expandedRowRender: (group) => (
                      <div style={{ padding: "8px 8px 0" }}>
                        <Table<VariantRow>
                          rowKey="productVariantId"
                          dataSource={group.variants}
                          columns={variantColumns}
                          size="small"
                          pagination={nestedVariantPagination}
                          scroll={{ x: 1200 }}
                          tableLayout="fixed"
                          rowClassName={(r) =>
                            !r.isActive ? "row-disabled" : ""
                          }
                          rowSelection={variantRowSelection}
                        />
                      </div>
                    ),
                  }}
                />
              </div>
            ),
          }}
          locale={{
            emptyText: emptyState,
          }}
        />
      ) : (
        <Table<ProductGroupRow>
          rowKey="key"
          dataSource={productGroups}
          columns={productColumns}
          size="middle"
          loading={loading}
          virtual
          className="discount-variants-table"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50, 100],
          }}
          scroll={{ x: 1200, y: 560 }}
          expandable={{
            defaultExpandedRowKeys: autoExpand ? defaultExpandedRowKeys : [],
            expandIcon: ({ expanded, onExpand, record }) =>
              renderExpandIcon(expanded, onExpand, record),
            expandedRowRender: (group) => (
              <div style={{ padding: "8px 8px 0" }}>
                <Table<VariantRow>
                  rowKey="productVariantId"
                  dataSource={group.variants}
                  columns={variantColumns}
                  size="small"
                  pagination={nestedVariantPagination}
                  scroll={{ x: 1200 }}
                  tableLayout="fixed"
                  rowClassName={(r) => (!r.isActive ? "row-disabled" : "")}
                  rowSelection={variantRowSelection}
                />
              </div>
            ),
          }}
          locale={{
            emptyText: emptyState,
          }}
        />
      )}
      <style>{`
        .row-disabled td { opacity: 0.55; }
        .discount-variants-table .ant-table-thead > tr > th {
          font-weight: 600;
          padding: 10px 12px;
        }
        .discount-variants-table .ant-table-tbody > tr > td {
          padding: 10px 12px;
          vertical-align: middle;
        }
        .discount-variants-table .ant-table-row-expand-icon-cell {
          width: 28px;
          text-align: left;
          padding-left: 8px;
        }
        .discount-variants-table .discount-expand-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          border: 1px solid ${token.colorBorderSecondary};
          color: ${token.colorText};
          cursor: pointer;
          transition: all 0.2s ease;
          background: ${token.colorBgContainer};
        }
        .discount-variants-table .discount-expand-icon:hover {
          color: ${token.colorPrimary};
          border-color: ${token.colorPrimary};
        }
        .discount-variants-table .ant-table-tbody > tr:nth-child(odd) > td {
          background: ${token.colorBgContainer};
        }
        .discount-variants-table .ant-table-tbody > tr:nth-child(even) > td {
          background: ${token.colorFillAlter};
        }
        .discount-variants-table .ant-table-tbody > tr:hover > td {
          background: ${token.colorFillSecondary} !important;
        }
      `}</style>
    </>
  );
};

export default DiscountVariantsTables;
