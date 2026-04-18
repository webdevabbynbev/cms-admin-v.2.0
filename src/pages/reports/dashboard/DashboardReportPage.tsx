import { useState } from "react";
import { theme, Button, Typography } from "antd";
import dayjs from "dayjs";
import { DashboardReport } from "../sales/components/DashboardReport";
import Export from "../../../components/Report/Export";
import type { CreateReportPayload } from "../../../services/api/report.services";
import DashboardDateFilter, {
  type DashboardDateFilterValue,
} from "../../../components/Report/DashboardDateFilter";

const { Title, Text } = Typography;

export default function DashboardReportPage() {
  const { token } = theme.useToken();
  const [filter, setFilter] = useState<DashboardDateFilterValue>(() => {
    const now = dayjs();
    return {
      preset: "realtime",
      range: [now.startOf("day"), now],
    };
  });

  const buildExportRequest = (format: "excel" | "csv"): CreateReportPayload => {
    const diffDays = filter.range[1].diff(filter.range[0], 'day');
    const period = diffDays > 60 ? 'monthly' : 'daily';

    return {
      title: `Dashboard Report - ${filter.preset === 'custom' ? `${filter.range[0].format('YYYY-MM-DD')} s/d ${filter.range[1].format('YYYY-MM-DD')}` : filter.preset}`,
      report_type: 'dashboard' as any,
      report_period: period as any,
      report_format: format as any,
      start_date: filter.range[0].toISOString(),
      end_date: filter.range[1].toISOString(),
      channel: "all",
    };
  };

  const getExportFileName = (format: "excel" | "csv") =>
    `Dashboard-Report-${dayjs().format('YYYYMMDD')}.${format === 'excel' ? 'xlsx' : format}`;

  return (
    <div style={{ padding: 24, background: token.colorBgLayout, minHeight: "100vh" }}>
      <div className="glass-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>Dashboard <Text type="secondary" style={{ fontStyle: 'italic', fontWeight: 300 }}>Report</Text></Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Ringkasan performa website & penjualan Abby n Bev</Text>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <DashboardDateFilter
            defaultPreset="realtime"
            onApply={(value) => setFilter(value)}
          />

          <div className="flex items-center gap-2">
            <Export
              buildRequest={buildExportRequest}
              getDownloadFileName={getExportFileName}
              formats={["excel", "csv"]}
            />
            <Button onClick={() => window.print()}>Print</Button>
          </div>
        </div>
      </div>

      <DashboardReport range={filter.range} channel="all" />
    </div>
  );
}
