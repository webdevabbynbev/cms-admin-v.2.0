import React from "react";
import { theme } from "antd";
import type { TableProps } from "antd/es/table";
import RamadanStatsCards from "./RamadhanStatsCards";
import RamadanFilterCard from "./RamadhanFilterCard";
import RamadanTable from "./RamadhanTable";
import RamadanDetailModal from "./RamadhanDetailModal";
import RamadanPrizeModal from "./RamadhanPrizeModal";
import RamadhanImportCsv from "./RamadhanImportCsv";
import { useRamadanEvent } from "../../../../hooks/ramadhan/participant/useRamadhanEvent";
import type { RamadanParticipantRecord } from "./ramadhanTypes";

const TableRamadanEvent: React.FC = () => {
  const { token } = theme.useToken();
  const {
    prizes,
    selectedMilestones,
    data,
    searchParams,
    setSearchParams,
    page,
    pageSize,
    isAll,
    total,
    totalAll,
    open,
    setOpen,
    current,
    setCurrent,
    prizeModalOpen,
    setPrizeModalOpen,
    prizeSelection,
    setPrizeSelection,
    loading,
    exportLoading,
    stats,
    fetchList,
    exportCsv,
    handleSavePrize,
  } = useRamadanEvent();
  const [importOpen, setImportOpen] = React.useState(false);

  const handleTableChange: TableProps<RamadanParticipantRecord>["onChange"] = (
    p,
  ) => {
    if (isAll) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(p.current));
      next.set("per_page", String(p.pageSize));
      return next;
    });
  };

  const onInputPrize = (rec: RamadanParticipantRecord) => {
    const fromRecord = (milestone: number) => {
      const keySnake = `prize_${milestone}` as keyof RamadanParticipantRecord;
      const keyCamel = `prize${milestone}` as keyof RamadanParticipantRecord;
      return (rec as any)[keySnake] ?? (rec as any)[keyCamel] ?? null;
    };

    setCurrent(rec);
    setPrizeSelection({
      7:
        fromRecord(7) ||
        (selectedMilestones[7]
          ? (prizes.find(
            (p: any) => Number(p.id) === Number(selectedMilestones[7]),
          )?.name ?? null)
          : null),
      15:
        fromRecord(15) ||
        (selectedMilestones[15]
          ? (prizes.find(
            (p: any) => Number(p.id) === Number(selectedMilestones[15]),
          )?.name ?? null)
          : null),
      30:
        fromRecord(30) ||
        (selectedMilestones[30]
          ? (prizes.find(
            (p: any) => Number(p.id) === Number(selectedMilestones[30]),
          )?.name ?? null)
          : null),
    });
    setPrizeModalOpen(true);
  };

  return (
    <div style={{ padding: "20px", background: token.colorBgLayout, minHeight: "100vh" }}>
      <RamadanStatsCards stats={stats} />

      <RamadanFilterCard
        pageSize={pageSize}
        pageSizeValue={isAll ? "all" : pageSize}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        onExportCsv={exportCsv}
        exportLoading={exportLoading}
        onImportCsv={() => setImportOpen(true)}
      />

      <RamadanTable
        data={data}
        pagination={
          isAll
            ? false
            : {
              current: page,
              pageSize: pageSize,
              total,
            }
        }
        loading={loading}
        prizes={prizes}
        selectedMilestones={selectedMilestones}
        setOpen={setOpen}
        setCurrent={setCurrent}
        onInputPrize={onInputPrize}
        handleTableChange={handleTableChange}
      />

      <RamadanDetailModal
        open={open}
        setOpen={setOpen}
        current={current}
        setCurrent={setCurrent}
        prizes={prizes}
        selectedMilestones={selectedMilestones}
        setPrizeModalOpen={setPrizeModalOpen}
        setPrizeSelection={setPrizeSelection}
      />

      <RamadanPrizeModal
        prizeModalOpen={prizeModalOpen}
        setPrizeModalOpen={setPrizeModalOpen}
        current={current}
        prizeSelection={prizeSelection}
        setPrizeSelection={setPrizeSelection}
        loading={loading}
        handleSavePrize={handleSavePrize}
      />

      <RamadhanImportCsv
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => fetchList()}
      />
    </div>
  );
};

export default TableRamadanEvent;
