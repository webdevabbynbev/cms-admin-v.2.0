import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Select,
  Modal,
  Space,
  Popconfirm,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import http from "../../../api/http";
import FormConcernOption from "../../Forms/Concern/FormConcernOption";
import type { ConcernOptionRecord } from "../../Forms/Concern/FormConcernOption";

type Row = ConcernOptionRecord & { concern?: { id: number; name: string } };

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: (ConcernOptionRecord & { concern?: { id: number; name: string } })[];
};

type ListResponse = {
  data?: { serve: ServePayload };
};

const { Search } = Input;

type Props = {
  concernId?: number;
  concernName?: string;
};

const TableConcernOption: React.FC<Props> = ({ concernId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = React.useState<
    (ConcernOptionRecord & { concern?: { id: number; name: string } })[]
  >([]);

  // Derived state from URL
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchQuery = searchParams.get("q") || "";

  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<ConcernOptionRecord | false>(
    false,
  );

  React.useEffect(() => {
    fetchList();
  }, [concernId, currentPage, pageSize, searchQuery]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (searchQuery) qs.set("q", searchQuery);
      if (concernId) qs.set("concern_id", String(concernId));
      qs.set("page", String(currentPage));
      qs.set("per_page", String(pageSize));

      const resp = (await http.get(
        `/admin/concern-options?${qs.toString()}`,
      )) as ListResponse;
      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.total));
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (p: TablePaginationConfig) => {
    setSearchParams((prev) => {
      prev.set("page", String(p.current ?? 1));
      prev.set("per_page", String(p.pageSize ?? 10));
      return prev;
    });
  };
  const optimisticRemove = (slug: string) => {
    setData((prev) => prev.filter((x) => x.slug !== slug));
  };

  const columns: ColumnsType<
    ConcernOptionRecord & { concern?: { id: number; name: string } }
  > = [
    {
      title: "Concern",
      dataIndex: ["concern", "name"],
      render: (val?: string) => val ?? "-",
    } as any,
    { title: "Name", dataIndex: "name" },
    {
      title: "Description",
      dataIndex: "description",
      render: (val?: string) => val || "-",
    },
    {
      title: "Position",
      dataIndex: "position",
      width: 110,
      align: "center",
      render: (v?: number) => (typeof v === "number" ? v : "-"),
    },
    {
      title: "#",
      width: 170,
      align: "center",
      render: (_: unknown, record: Row) => (
        <Space>
          <Tooltip title="Edit Option">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrent(record);
                setOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete Option">
            <Popconfirm
              title="Are you sure want to delete?"
              okText="Yes"
              cancelText="No"
              onConfirm={async () => {
                try {
                  await http.delete(`/admin/concern-options/${record.slug}`);
                  optimisticRemove(record.slug);
                  message.success("Deleted");
                  fetchList();
                } catch (e: any) {
                  message.error(e?.response?.data?.message || "Delete failed");
                }
              }}
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {!concernId && (
        <Card style={{ marginTop: 10 }}>
          <div
            className="flex flex-wrap"
            style={{ width: "100%", alignItems: "flex-end" }}
          >
            <div className="flex align-center">
              <span style={{ fontSize: 12 }}>Show</span>
              <Select<number>
                style={{ width: 80, marginLeft: 10, marginRight: 10 }}
                value={pageSize}
                onChange={(val) => {
                  setSearchParams((prev) => {
                    prev.set("per_page", String(val));
                    prev.set("page", "1");
                    return prev;
                  });
                }}
                options={[
                  { value: 10, label: "10" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                  { value: 500, label: "500" },
                ]}
              />
              <span style={{ fontSize: 12 }}>entries</span>
            </div>

            <Space
              style={{ marginLeft: "auto" }}
              className="flex align-center mt-2"
            >
              <Search
                placeholder="Search Concern Option"
                allowClear
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchParams((prev) => {
                    if (val) prev.set("q", val);
                    else prev.delete("q");
                    prev.set("page", "1");
                    return prev;
                  });
                }}
                onSearch={(val) => {
                  setSearchParams((prev) => {
                    if (val) prev.set("q", val);
                    else prev.delete("q");
                    prev.set("page", "1");
                    return prev;
                  });
                }}
              />
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => {
                  setCurrent(false);
                  setOpen(true);
                }}
              >
                Create New
              </Button>
            </Space>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto md:overflow-visible">
        <Table<Row>
          rowKey={(r) => r.slug}
          dataSource={data}
          columns={columns}
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
          }}
          loading={loading}
          onChange={handleTableChange}
        />
      </div>
      <Modal
        centered
        open={open}
        title={current ? "Edit Concern Option" : "Create Concern Option"}
        destroyOnClose
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
      >
        <FormConcernOption
          data={current || undefined}
          concernId={concernId}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            fetchList();
          }}
        />
      </Modal>
    </>
  );
};

export default TableConcernOption;
