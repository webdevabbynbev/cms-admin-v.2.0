import { Select } from "antd";

export type GroupBy =
  | "per-product"
  | "per-brand"
  | "per-variant"
  | "per-category"
  | "per-concern";

type Option = { value: string; label: string };

type DetailFiltersProps = {
  groupBy: GroupBy;
  selectedFilter?: string;
  groupLabel: string;
  filterOptions: Option[];
  onGroupByChange: (value: GroupBy) => void;
  onSelectedFilterChange: (value?: string) => void;
};

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "per-product", label: "Per-Produk" },
  { value: "per-brand", label: "Per-Brand" },
  { value: "per-variant", label: "Per-Varian" },
  { value: "per-category", label: "Per-Kategori" },
  { value: "per-concern", label: "Per-Concern" },
];

export default function DetailFilters({
  groupBy,
  selectedFilter,
  groupLabel,
  filterOptions,
  onGroupByChange,
  onSelectedFilterChange,
}: DetailFiltersProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <Select<GroupBy>
        value={groupBy}
        onChange={onGroupByChange}
        className="w-full md:w-auto"
        style={{ minWidth: 220 }}
        options={GROUP_BY_OPTIONS}
      />
      <Select
        showSearch
        allowClear
        value={selectedFilter}
        onChange={(value) => onSelectedFilterChange(value)}
        className="w-full md:w-auto"
        style={{ minWidth: 260 }}
        placeholder={`Filter ${groupLabel}`}
        options={filterOptions}
        optionFilterProp="label"
        filterOption={(input, option) =>
          String(option?.label || "")
            .toLowerCase()
            .includes(input.toLowerCase())
        }
      />
    </div>
  );
}
