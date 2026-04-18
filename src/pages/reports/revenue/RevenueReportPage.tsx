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
import { dateSorter, numberSorter } from "../../../utils/tableSorters";

const { Text, Title } = Typography;

const fmtIDR = (n: any) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

const jsonInFlightKeys = new Set<string>();

export default function RevenueReportPage() {
  const pageTitle = "Laporan Pendapatan";

  const [filter, setFilter] = useState<DateRangeFilterValue>(() => {
    const now = dayjs();
    return {
      preset: "today",
      range: [now.startOf("day"), now.endOf("day")],
    };
  });

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportEntity | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: pageTitle,
  });

  const run = async (
    currentFilter: DateRangeFilterValue = filter,
  ) => {
    let runKey: string | null = null;
    runKey = [
      "revenue",
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
        report_type: "revenue",
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

  const buildExportRequest = (format: "excel" | "csv"): CreateReportPayload => ({
    title: pageTitle,
    report_type: "revenue",
    report_period: "custom",
    report_format: format,
    start_date: filter.range[0].toISOString(),
    end_date: filter.range[1].toISOString(),
    channel: "all",
    filters: {},
  });

  const getExportFileName = (format: "excel" | "csv") =>
    `${pageTitle}-${dayjs().format("YYYYMMDD")}.${format === "excel" ? "xlsx" : "csv"}`;

  useEffect(() => {
    run(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const d = report?.data || {};
    return Array.isArray(d.revenue_by_date) ? d.revenue_by_date : [];
  }, [report]);
  const total = rows.length;

  const summary = report?.summary || {};

  const columns = [
    {
      title: "Tanggal",
      dataIndex: "date",
      width: 140,
      sorter: dateSorter<any>("date"),
    },
    {
      title: "Gross",
      dataIndex: "gross_revenue",
      align: "right",
      sorter: numberSorter<any>("gross_revenue"),
      render: (v: any) => fmtIDR(v),
    },
    {
      title: "Diskon",
      dataIndex: "discount",
      align: "right",
      sorter: numberSorter<any>("discount"),
      render: (v: any) => fmtIDR(v),
    },
    {
      title: "Net",
      dataIndex: "net_revenue",
      align: "right",
      sorter: numberSorter<any>("net_revenue"),
      render: (v: any) => fmtIDR(v),
    },
    {
      title: "Transaksi",
      dataIndex: "transactions",
      align: "right",
      sorter: numberSorter<any>("transactions"),
    },
  ];

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [total, pageSize, page]);

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
            Revenue by Date
          </Title>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2 md:mt-0 md:ml-auto md:justify-end">
          {renderHeaderActions()}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
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

      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <Text type="secondary">Total Gross</Text>
          <Title level={4} style={{ margin: 0 }}>
            {fmtIDR(summary.total_gross_revenue)}
          </Title>
        </Card>
        <Card>
          <Text type="secondary">Total Diskon</Text>
          <Title level={4} style={{ margin: 0 }}>
            {fmtIDR(summary.total_discount)}
          </Title>
        </Card>
        <Card>
          <Text type="secondary">Total Net</Text>
          <Title level={4} style={{ margin: 0 }}>
            {fmtIDR(summary.total_net_revenue)}
          </Title>
        </Card>
        <Card>
          <Text type="secondary">Total Transaksi</Text>
          <Title level={4} style={{ margin: 0 }}>
            {fmtIDR(summary.total_transactions)}
          </Title>
        </Card>
      </div>

      <div ref={printRef}>
        <Card>
          <div className="overflow-x-auto md:overflow-visible">
            <Table
              rowKey={(r: any) => r.date}
              loading={loading}
              dataSource={rows}
              columns={columns as any}
              sortDirections={["ascend", "descend", "ascend"]}
              scroll={{ x: "max-content" }}
              pagination={{
                current: page,
                pageSize,
                total,
                position: ["none", "none"],
              }}
              onChange={(nextPagination) => {
                setPage(nextPagination.current ?? 1);
                setPageSize(nextPagination.pageSize ?? 10);
              }}
            />
          </div>
          <TablePagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }}
          />
        </Card>
      </div>
    </div>
  );
}
