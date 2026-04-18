import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useReactToPrint } from "react-to-print";
import { createAndWaitReport } from "../_shared/reportRunner";
import {
  type CreateReportPayload,
  type ReportEntity,
} from "../../../services/api/report.services";
import DateRangeFilter, {
  type DateRangeFilterValue,
} from "../../../components/Report/DateRangeFilter";
import TablePagination from "../../../components/Tables/Pagination/TablePagination";
import Export from "../../../components/Report/Export";
import { numberSorter, stringSorter } from "../../../utils/tableSorters";

const { Text, Title } = Typography;

const fmtIDR = (n: any) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

const jsonInFlightKeys = new Set<string>();

export default function InventoryReportPage() {
  const pageTitle = "Laporan Inventori";

  const [filter, setFilter] = useState<DateRangeFilterValue>(() => {
    const now = dayjs();
    return {
      preset: "today",
      range: [now.startOf("day"), now.endOf("day")],
    };
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportEntity | null>(null);
  const [productPage, setProductPage] = useState<number>(1);
  const [productPageSize, setProductPageSize] = useState<number>(10);
  const [lowStockPage, setLowStockPage] = useState<number>(1);
  const [lowStockPageSize, setLowStockPageSize] = useState<number>(10);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: pageTitle,
  });

  const run = async (currentFilter: DateRangeFilterValue = filter) => {
    let runKey: string | null = null;
    runKey = [
      "inventory",
      "custom",
      currentFilter.preset,
      currentFilter.range[0].toISOString(),
      currentFilter.range[1].toISOString(),
    ].join("|");

    if (jsonInFlightKeys.has(runKey)) return;
    jsonInFlightKeys.add(runKey);

    setLoading(true);
    try {
      const r = await createAndWaitReport({
        title: pageTitle,
        report_type: "inventory",
        report_period: "custom",
        report_format: "json",
        start_date: currentFilter.range[0].toISOString(),
        end_date: currentFilter.range[1].toISOString(),
        channel: "all",
        filters: {},
      });
      setReport(r);
    } catch (e: any) {
      message.error(e?.message || "Gagal generate laporan");
    } finally {
      jsonInFlightKeys.delete(runKey);
      setLoading(false);
    }
  };

  useEffect(() => {
    run(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildExportRequest = (format: "excel" | "csv"): CreateReportPayload => ({
    title: pageTitle,
    report_type: "inventory",
    report_period: "custom",
    report_format: format,
    start_date: filter.range[0].toISOString(),
    end_date: filter.range[1].toISOString(),
    channel: "all",
    filters: {},
  });

  const getExportFileName = (format: "excel" | "csv") =>
    `${pageTitle}-${dayjs().format("YYYYMMDD")}.${format === "excel" ? "xlsx" : "csv"}`;

  const data = report?.data || {};
  const products = useMemo(
    () => (Array.isArray(data.products) ? data.products : []),
    [data.products],
  );
  const totalProducts = products.length;
  const lowStock = useMemo(
    () =>
      Array.isArray(data.low_stock_products) ? data.low_stock_products : [],
    [data.low_stock_products],
  );
  const totalLowStock = lowStock.length;
  const summary = report?.summary || {};

  const cols = [
    { title: "SKU", dataIndex: "sku", width: 180, sorter: stringSorter<any>("sku") },
    { title: "Nama", dataIndex: "name", sorter: stringSorter<any>("name") },
    {
      title: "Stock",
      dataIndex: "current_stock",
      width: 120,
      align: "right",
      sorter: numberSorter<any>("current_stock"),
    },
    {
      title: "Terjual",
      dataIndex: "total_sold",
      width: 120,
      align: "right",
      sorter: numberSorter<any>("total_sold"),
    },
    {
      title: "Harga",
      dataIndex: "base_price",
      width: 140,
      align: "right",
      sorter: numberSorter<any>("base_price"),
      render: (v: any) => fmtIDR(v),
    },
    {
      title: "Nilai Stock",
      dataIndex: "stock_value",
      width: 160,
      align: "right",
      sorter: numberSorter<any>("stock_value"),
      render: (v: any) => fmtIDR(v),
    },
  ];

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalProducts / productPageSize));
    if (productPage > maxPage) setProductPage(maxPage);
  }, [totalProducts, productPageSize, productPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalLowStock / lowStockPageSize));
    if (lowStockPage > maxPage) setLowStockPage(maxPage);
  }, [totalLowStock, lowStockPageSize, lowStockPage]);

  const renderHeaderActions = () => (
    <>
      <Export
        buildRequest={buildExportRequest}
        getDownloadFileName={getExportFileName}
        formats={["excel", "csv"]}
        disabled={loading}
      />
      <Button onClick={handlePrint} disabled={!report} loading={loading}>
        Print
      </Button>
    </>
  );

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <Text style={{ color: "#1677ff", fontWeight: 600 }}>{pageTitle}</Text>
          <Title level={4} style={{ margin: 0, marginTop: 6 }}>
            Ringkasan Stock
          </Title>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2 md:mt-0 md:ml-auto md:justify-end">
          {renderHeaderActions()}
        </div>
      </div>

      <div className="mb-3 flex justify-between gap-3">
        <Space wrap>
          <DateRangeFilter
            defaultPreset="today"
            showApplyMessage={false}
            onApply={(value) => {
              setFilter(value);
              run(value);
            }}
          />
        </Space>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <Card>
          <Text type="secondary">Total Produk</Text>
          <Title level={4} style={{ margin: 0 }}>
            {fmtIDR(summary.total_products)}
          </Title>
        </Card>
        <Card>
          <Text type="secondary">Total Nilai Stock</Text>
          <Title level={4} style={{ margin: 0 }}>
            {fmtIDR(summary.total_stock_value)}
          </Title>
        </Card>
        <Card>
          <Text type="secondary">Low Stock</Text>
          <Title level={4} style={{ margin: 0 }}>
            {fmtIDR(summary.low_stock_count)}
          </Title>
        </Card>
      </div>

      <div ref={printRef}>
        <Card title="Semua Produk">
          <div className="overflow-x-auto md:overflow-visible">
            <Table
              rowKey={(r: any) => r.id}
              loading={loading}
              dataSource={products}
              columns={cols as any}
              sortDirections={["ascend", "descend", "ascend"]}
              scroll={{ x: "max-content" }}
              pagination={{
                current: productPage,
                pageSize: productPageSize,
                total: totalProducts,
                position: ["none", "none"],
              }}
              onChange={(nextPagination) => {
                setProductPage(nextPagination.current ?? 1);
                setProductPageSize(nextPagination.pageSize ?? 10);
              }}
            />
          </div>
          <TablePagination
            current={productPage}
            pageSize={productPageSize}
            total={totalProducts}
            onChange={(nextPage, nextPageSize) => {
              setProductPage(nextPage);
              setProductPageSize(nextPageSize);
            }}
          />
        </Card>

        <div className="h-3" />

        <Card title="Low Stock (< 10)">
          <div className="overflow-x-auto md:overflow-visible">
            <Table
              rowKey={(r: any) => r.id}
              loading={loading}
              dataSource={lowStock}
              columns={cols as any}
              sortDirections={["ascend", "descend", "ascend"]}
              scroll={{ x: "max-content" }}
              pagination={{
                current: lowStockPage,
                pageSize: lowStockPageSize,
                total: totalLowStock,
                position: ["none", "none"],
              }}
              onChange={(nextPagination) => {
                setLowStockPage(nextPagination.current ?? 1);
                setLowStockPageSize(nextPagination.pageSize ?? 10);
              }}
            />
          </div>
          <TablePagination
            current={lowStockPage}
            pageSize={lowStockPageSize}
            total={totalLowStock}
            onChange={(nextPage, nextPageSize) => {
              setLowStockPage(nextPage);
              setLowStockPageSize(nextPageSize);
            }}
          />
        </Card>
      </div>
    </div>
  );
}
