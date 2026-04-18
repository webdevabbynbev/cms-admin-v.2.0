// RamadanTable.tsx
import React from "react";
import { Table, Card, Empty, Space, Button, Tooltip, theme, Grid } from "antd";
import {
  InfoCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GiftOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";
import type {
  ColumnsType,
  TablePaginationConfig,
  TableProps,
} from "antd/es/table";
import type { RamadanParticipantRecord, ColumnsCtx } from "./ramadhanTypes";

interface RamadanTableProps {
  data: RamadanParticipantRecord[];
  pagination: TablePaginationConfig | false;
  loading: boolean;
  prizes: any[];
  selectedMilestones: { [key: number]: number | null };
  setOpen: (open: boolean) => void;
  setCurrent: (rec: RamadanParticipantRecord | false) => void;
  onInputPrize: (rec: RamadanParticipantRecord) => void;
  handleTableChange: TableProps<RamadanParticipantRecord>["onChange"];
}

const columns = (
  props: ColumnsCtx,
  token: any,
  isMobile: boolean,
): ColumnsType<RamadanParticipantRecord> => [
  {
    title: (
      <span style={{ fontWeight: 600, fontSize: "12px" }}>Nama Peserta</span>
    ),
    dataIndex: "name",
    fixed: isMobile ? undefined : "left",
    width: 200,
    render: (_val, record) => (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            background: token.colorFillAlter,
            borderRadius: "50%",
          }}
        >
          <UserOutlined style={{ color: token.colorPrimary, fontSize: "16px" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 500, color: token.colorText, fontSize: "12px" }}>
            {record.name}
          </span>
          <span style={{ fontSize: "11px", color: token.colorTextDescription }}>
            {record.phone_number || "-"}
          </span>
        </div>
      </div>
    ),
  },
  {
    title: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckCircleOutlined style={{ marginRight: 6, color: token.colorPrimary }} />
        <span style={{ fontWeight: 600, fontSize: "12px" }}>
          Total Check-in
        </span>
      </div>
    ),
    dataIndex: "totalCheckin",
    width: 120,
    align: "center",
    render: (val, record) => {
      const count =
        val ?? Number(record.totalFasting || 0) + Number(record.totalNotFasting || 0);
      if (count >= 30) {
        // High count styling
      } else if (count >= 15) {
        // Medium count styling
      } else if (count >= 7) {
        // Low count styling
      }

      return (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 52,
            height: 44,
            background: token.colorFillAlter,
            borderRadius: "8px",
            padding: "4px 12px",
            border: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 700, color: token.colorText }}>
            {count}
          </span>
        </div>
      );
    },
  },
  {
    title: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckCircleOutlined style={{ marginRight: 6, color: token.colorSuccess }} />
        <span style={{ fontWeight: 600, fontSize: "12px" }}>Hari Puasa</span>
      </div>
    ),
    dataIndex: "totalFasting",
    width: 110,
    align: "center",
    render: (val) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Tag
          color="success"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 52,
            height: 44,
            fontSize: "14px",
            fontWeight: 700,
            padding: 0,
            borderRadius: "8px",
          }}
        >
          {val ?? 0}
        </Tag>
      </div>
    ),
  },
  {
    title: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CloseCircleOutlined style={{ marginRight: 6, color: "#fa8c16" }} />
        <span style={{ fontWeight: 600, fontSize: "12px" }}>Tidak Puasa</span>
      </div>
    ),
    dataIndex: "totalNotFasting",
    width: 110,
    align: "center",
    render: (val) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Tag
          color="warning"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 52,
            height: 44,
            fontSize: "14px",
            fontWeight: 700,
            padding: 0,
            borderRadius: "8px",
          }}
        >
          {val ?? 0}
        </Tag>
      </div>
    ),
  },
  {
    title: (
      <div style={{ display: "flex", alignItems: "center" }}>
        <GiftOutlined style={{ marginRight: 6, color: token.colorPrimary }} />
        <span style={{ fontWeight: 600, fontSize: "12px" }}>Status Hadiah</span>
      </div>
    ),
    dataIndex: "spinResult",
    width: 240,
    render: (_val, record) => {
      const totalCheckin =
        (record as any).totalCheckin ??
        Number(record.totalFasting || 0) + Number(record.totalNotFasting || 0);

      const getRecordPrize = (milestone: number) => {
        const keySnake = `prize_${milestone}` as keyof RamadanParticipantRecord;
        const keyCamel = `prize${milestone}` as keyof RamadanParticipantRecord;
        return (record as any)[keySnake] ?? (record as any)[keyCamel] ?? null;
      };

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[7, 15, 30].map((milestone) => {
            const pid = props.selectedMilestones[milestone];
            const prize = props.prizes.find(
              (x: any) => Number(x.id) === Number(pid),
            );
            const isEligible = totalCheckin >= milestone;
            const recordPrize = getRecordPrize(milestone);
            const displayPrize = recordPrize || prize?.name || "Belum ada";

            return (
              <div
                key={milestone}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: isEligible ? token.colorSuccessBg : token.colorFillAlter,
                  border: `1px solid ${isEligible ? token.colorSuccessBorder : token.colorBorderSecondary}`,
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: token.colorText,
                  }}
                >
                  <TrophyOutlined
                    style={{
                      marginRight: 6,
                      color: isEligible ? token.colorSuccess : token.colorTextQuaternary,
                    }}
                  />
                  {milestone} hari:
                </span>
                <Tag
                  color={
                    displayPrize !== "Belum ada"
                      ? isEligible
                        ? "success"
                        : "processing"
                      : "default"
                  }
                  style={{ fontSize: "10px", fontWeight: 500, margin: 0 }}
                >
                  {displayPrize}
                </Tag>
              </div>
            );
          })}
        </div>
      );
    },
  },
  {
    title: <span style={{ fontWeight: 600, fontSize: "12px" }}>Aksi</span>,
    width: 110,
    align: "center",
    fixed: isMobile ? undefined : "right",
    dataIndex: "action",
    render: (_: unknown, record) => (
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <Tooltip title="Lihat Detail">
          <Button
            type="default"
            ghost
            icon={<InfoCircleOutlined />}
            size="small"
            block
            onClick={() => {
              props.setCurrent(record);
              props.setOpen(true);
            }}
            style={{
              fontSize: "12px",
              color: token.colorPrimary,
              borderColor: token.colorBorderSecondary,
              background: token.colorFillAlter,
            }}
          >
            Detail
          </Button>
        </Tooltip>
        <Tooltip title="Input Hadiah">
          <Button
            icon={<GiftOutlined />}
            size="small"
            block
            onClick={() => props.onInputPrize(record)}
            style={{ fontSize: "12px" }}
          >
            Hadiah
          </Button>
        </Tooltip>
      </Space>
    ),
  },
];

const RamadanTable: React.FC<RamadanTableProps> = ({
  data,
  pagination,
  loading,
  prizes,
  selectedMilestones,
  setOpen,
  setCurrent,
  onInputPrize,
  handleTableChange,
}) => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const paginationConfig =
    pagination === false
      ? false
      : {
        ...pagination,
        showSizeChanger: false,
        showTotal: (total: number, range: [number, number]) =>
          `Menampilkan ${range[0]}-${range[1]} dari ${total} peserta`,
        style: { marginTop: 16 },
      };

  return (
    <Card
      className="shadow"
      style={{ borderRadius: "8px", border: `1px solid ${token.colorBorderSecondary}` }}
    >
      <Table<RamadanParticipantRecord>
        size="small"
        columns={columns({
          setOpen,
          setCurrent,
          onInputPrize,
          prizes,
          selectedMilestones,
        }, token, isMobile)}
        rowKey={(record) => String(record.id)}
        dataSource={data}
        pagination={paginationConfig}
        loading={loading}
        onChange={handleTableChange}
        rowClassName={() => "hover-file"}
        scroll={{ x: "max-content" }}
        locale={{
          emptyText: (
            <Empty
              description="Tidak ada data peserta"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />
    </Card>
  );
};

export default RamadanTable;
