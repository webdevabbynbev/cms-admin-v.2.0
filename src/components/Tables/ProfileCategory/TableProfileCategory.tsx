import React, { useState, useCallback, useEffect } from "react";
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
import type { ColumnsType, TableProps } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import FormProfileCategory from "../../Forms/ProfileCategory/FormProfileCategory";
import type { ProfileCategoryRecord } from "../../Forms/ProfileCategory/FormProfileCategory";
import TableProfileCategoryOption from "./TableProfileCategoryOption";
import { useSearchParams } from "react-router-dom";

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: (ProfileCategoryRecord & { options?: Array<any> })[];
};

type ListResponseServe = {
  data?: { serve: ServePayload };
};

type MetaPayload = {
  total: number;
  perPage: number;
  currentPage: number;
};
type ListResponseMeta = {
  data?: {
    status?: boolean;
    message?: string;
    data: (ProfileCategoryRecord & { options?: Array<any> })[];
    meta: MetaPayload;
  };
};

const { Search } = Input;

const TableProfileCategory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<
    (ProfileCategoryRecord & { options?: any[] })[]
  >([]);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchText = searchParams.get("q") || "";

  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ProfileCategoryRecord | false>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] =
    useState<ProfileCategoryRecord | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/admin/profile-categories?q=${encodeURIComponent(searchText)}&page=${page}&per_page=${pageSize}`;

      const resp = (await http.get(url)) as ListResponseServe &
        ListResponseMeta;
      const serve = (resp as ListResponseServe)?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.total));
        return;
      }

      const r2 = (resp as ListResponseMeta)?.data;
      if (r2 && Array.isArray(r2.data) && r2.meta) {
        setData(r2.data || []);
        setTotal(Number(r2.meta.total));
        return;
      }
      setData([]);
      setTotal(0);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleTableChange: TableProps<ProfileCategoryRecord>["onChange"] = (
    p,
  ) => {
    setSearchParams((prev) => {
      prev.set("page", String(p.current));
      prev.set("per_page", String(p.pageSize));
      return prev;
    });
  };

  const optimisticRemove = (id: number) => {
    setData((prev) => prev.filter((x) => x.id !== id));
  };

  const columns: ColumnsType<ProfileCategoryRecord & { options?: any[] }> = [
    { title: "Name", dataIndex: "name" },
    {
      title: "Type",
      dataIndex: "type",
      render: (val?: string | null) => val || "-",
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
                setDrawerCategory(record);
                setDrawerOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Edit Profile Category">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrent(record);
                setOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Delete Profile Category">
            <Popconfirm
              title="Are you sure want to delete?"
              okText="Yes"
              cancelText="No"
              onConfirm={async () => {
                try {
                  await http.delete(`/admin/profile-categories/${record.id}`);
                  optimisticRemove(record.id);
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
              placeholder="Search Profile Category"
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
          rowKey={(r) => String(r.id)}
          dataSource={data}
          columns={columns}
          scroll={{ x: "max-content" }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total,
          }}
          loading={loading}
          onChange={handleTableChange}
        />
      </div>

      <Modal
        centered
        open={open}
        title={current ? "Edit Profile Category" : "Create Profile Category"}
        destroyOnClose
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
      >
        <FormProfileCategory
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
          setDrawerCategory(null);
        }}
        footer={null}
        width={900}
        title={
          <span>
            Profile Category Options —{" "}
            <strong>{drawerCategory?.name || "-"}</strong>
          </span>
        }
        destroyOnClose
      >
        {drawerCategory && (
          <TableProfileCategoryOption
            categoryId={drawerCategory.id}
            categoryName={drawerCategory.name}
          />
        )}
      </Modal>
    </>
  );
};

export default TableProfileCategory;
