import { useState } from "react";
import { Button, DatePicker, Grid, Segmented, Space, message } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

export type DashboardDatePreset = "realtime" | "7d" | "this_month" | "custom";

export type DashboardDateFilterValue = {
  preset: DashboardDatePreset;
  range: [Dayjs, Dayjs];
};

type DashboardDateFilterProps = {
  defaultPreset?: Exclude<DashboardDatePreset, "custom">;
  onApply: (value: DashboardDateFilterValue) => void;
  showApplyMessage?: boolean;
};

const buildRangeFromPreset = (preset: Exclude<DashboardDatePreset, "custom">): [Dayjs, Dayjs] => {
  const now = dayjs();
  switch (preset) {
    case "realtime":
      return [now.startOf("day"), now];
    case "7d":
      return [now.subtract(6, "day").startOf("day"), now.endOf("day")];
    case "this_month":
      return [now.startOf("month"), now.endOf("day")];
    default:
      return [now.startOf("day"), now];
  }
};

export default function DashboardDateFilter({
  defaultPreset = "realtime",
  onApply,
  showApplyMessage = true,
}: DashboardDateFilterProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [preset, setPreset] = useState<DashboardDatePreset>(defaultPreset);
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => buildRangeFromPreset(defaultPreset));
  const [tempRange, setTempRange] = useState<[Dayjs, Dayjs] | null>(null);

  const handlePresetChange = (val: DashboardDatePreset) => {
    setPreset(val);
    setTempRange(null);

    if (val === "custom") {
      return;
    }

    const nextRange = buildRangeFromPreset(val);
    setRange(nextRange);
    onApply({ preset: val, range: nextRange });
  };

  const handleApplyCustom = () => {
    if (!tempRange?.[0] || !tempRange?.[1]) {
      return;
    }

    setRange(tempRange);
    onApply({ preset: "custom", range: tempRange });

    if (showApplyMessage) {
      message.success("Rentang waktu kustom diterapkan");
    }
  };

  return (
    <Space size="small" align="start" direction={isMobile ? "vertical" : "horizontal"}>
      <Segmented
        className="filter-segmented"
        value={preset}
        onChange={(v) => handlePresetChange(v as DashboardDatePreset)}
        options={[
          {
            label: (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 ring-2 ring-green-500/30" />
                Real-time
              </span>
            ),
            value: "realtime",
          },
          { label: "7 Hari Terakhir", value: "7d" },
          { label: "Bulan Ini", value: "this_month" },
          { label: "Custom", value: "custom" },
        ]}
      />

      {preset === "custom" && (
        <Space size="small">
          <DatePicker.RangePicker
            value={tempRange || range}
            allowClear={false}
            onChange={(v) => {
              if (v?.[0] && v?.[1]) {
                setTempRange([
                  v[0].startOf("day"),
                  v[1].endOf("day"),
                ]);
              }
            }}
            style={{ borderRadius: 8, width: 250 }}
          />
          <Button
            type="primary"
            onClick={handleApplyCustom}
            disabled={!tempRange}
            icon={<CheckOutlined />}
            style={{ borderRadius: 8, background: "#10b981", borderColor: "#10b981" }}
          >
            Terapkan
          </Button>
        </Space>
      )}
    </Space>
  );
}
