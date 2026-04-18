import { useState } from "react";
import { Button, DatePicker, Grid, Segmented, Space, message, theme } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

export type DateRangePreset = "today" | "7d" | "this_month" | "custom";

export type DateRangeFilterValue = {
  preset: DateRangePreset;
  range: [Dayjs, Dayjs];
};

type DateRangeFilterProps = {
  defaultPreset?: Exclude<DateRangePreset, "custom">;
  onApply: (value: DateRangeFilterValue) => void;
  showApplyMessage?: boolean;
};

const buildRangeFromPreset = (preset: Exclude<DateRangePreset, "custom">): [Dayjs, Dayjs] => {
  const now = dayjs();
  switch (preset) {
    case "today":
      return [now.startOf("day"), now.endOf("day")];
    case "7d":
      return [now.subtract(6, "day").startOf("day"), now.endOf("day")];
    case "this_month":
      return [now.startOf("month"), now.endOf("month")];
    default:
      return [now.startOf("day"), now.endOf("day")];
  }
};

export default function DateRangeFilter({
  defaultPreset = "today",
  onApply,
  showApplyMessage = true,
}: DateRangeFilterProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { token } = theme.useToken();
  const [preset, setPreset] = useState<DateRangePreset>(defaultPreset);
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => buildRangeFromPreset(defaultPreset));
  const [tempRange, setTempRange] = useState<[Dayjs, Dayjs] | null>(null);

  const handlePresetChange = (val: DateRangePreset) => {
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
      <style>{`
        .filter-segmented .ant-segmented-item-selected {
          background-color: ${token.colorPrimary} !important;
          color: #fff !important;
          box-shadow: none !important;
        }
        .filter-segmented .ant-segmented-thumb {
          background-color: ${token.colorPrimary} !important;
          box-shadow: none !important;
        }
      `}</style>
      <Segmented
        className="filter-segmented"
        value={preset}
        onChange={(v) => handlePresetChange(v as DateRangePreset)}
        options={[
          { label: "Hari ini", value: "today" },
          { label: "7 Hari Terakhir", value: "7d" },
          { label: "Bulan ini", value: "this_month" },
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
