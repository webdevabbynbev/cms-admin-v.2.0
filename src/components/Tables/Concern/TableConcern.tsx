import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Select,
  Modal,
  Space,
  Popconfirm,
  Tag,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import FormConcern from "../../Forms/Concern/FormConcern";
import type { ConcernRecord } from "../../Forms/Concern/FormConcern";
import TableConcernOption from "../Concern/TableConcernOption";
import { useSearchParams } from "react-router-dom";

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: (ConcernRecord & { options?: Array<any> })[];
};

type ListResponse = {
  data?: { serve: ServePayload };
};

const { Search } = Input;

const TableConcern: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<(ConcernRecord & { options?: any[] })[]>([]);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchText = searchParams.get("q") || "";

  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ConcernRecord | false>(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerConcern, setDrawerConcern] = useState<ConcernRecord | null>(
    null,
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/admin/concern?q=${encodeURIComponent(searchText)}&page=${page}&per_page=${pageSize}`;
      const resp = (await http.get(url)) as ListResponse;

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
  }, [page, pageSize, searchText]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const optimisticRemove = (slug: string) => {
    setData((prev) => prev.filter((x) => x.slug !== slug));
  };

  const columns: ColumnsType<ConcernRecord & { options?: any[] }> = [
    { title: "Name", dataIndex: "name" },
    {
      title: "Description",
      dataIndex: "description",
      render: (val?: string) => val || "-",
    },
    {
      title: "Position",
      dataIndex: "position",
      render: (val?: number) => (typeof val === "number" ? val : "-"),
      width: 110,
      align: "center",
    },
    {
      title: "Options",
      key: "optcount",
      width: 110,
      align: "center",
      render: (_, record) => <Tag>{record.options?.length ?? 0}</Tag>,
    },
    {
      title: "#",
      dataIndex: "action",
      width: 220,
      align: "center",
      render: (_: unknown, record) => (
        <Space>
          <Tooltip title="Manage Options">
            <Button
              icon={<ApartmentOutlined />}
              onClick={() => {
                setDrawerConcern(record);
                setDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit Concern">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrent(record);
                setOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete Concern">
            <Popconfirm
              title="Are you sure want to delete?"
              okText="Yes"
              cancelText="No"
              onConfirm={async () => {
                try {
                  await http.delete(`/admin/concern/${record.slug}`);
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
              onChange={(ps) => {
                setSearchParams((prev) => {
                  prev.set("per_page", String(ps));
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
              placeholder="Search Concern"
              allowClear
              defaultValue={searchText}
              onSearch={(val) => {
                setSearchParams((prev) => {
                  if (val.trim()) prev.set("q", val.trim());
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

      <div className="overflow-x-auto md:overflow-visible">
        <Table
          style={{ marginTop: 10 }}
          rowKey={(r) => r.slug}
          dataSource={data}
          columns={columns}
          scroll={{ x: "max-content" }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total,
          }}
          loading={loading}
          onChange={(p) => {
            setSearchParams((prev) => {
              prev.set("page", String(p.current));
              prev.set("per_page", String(p.pageSize));
              return prev;
            });
          }}
        />
      </div>

      <Modal
        centered
        open={open}
        title={current ? "Edit Concern" : "Create Concern"}
        destroyOnClose
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
      >
        <FormConcern
          data={current || undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            fetchList();
          }}
        />
      </Modal>

      <Modal
        open={drawerOpen}
        onCancel={() => {
          setDrawerOpen(false);
          setDrawerConcern(null);
        }}
        footer={null}
        width={900}
        title={
          <span>
            Concern Options — <strong>{drawerConcern?.name || "-"}</strong>
          </span>
        }
        destroyOnClose
      >
        {drawerConcern && (
          <TableConcernOption
            concernId={drawerConcern.id}
            concernName={drawerConcern.name}
          />
        )}
      </Modal>
    </>
  );
};

export default TableConcern;
