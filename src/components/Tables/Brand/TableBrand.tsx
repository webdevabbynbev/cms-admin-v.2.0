import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Popconfirm,
  Select,
  Modal,
  Space,
  Tag,
  message,
  Tooltip,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import FormBrand from "../../Forms/Brand/FormBrand";
import BrandBulkUpdate from "../../brand/BrandBulkUpdate";
import { useSearchParams } from "react-router-dom";

export type BrandPayload = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  country?: string | null;
  website?: string | null;
  isActive?: number;
};

export type BrandRecord = BrandPayload & {
  id: number | string;
  slug: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: BrandRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  setOpen: (open: boolean) => void;
  setCurrent: (rec: BrandRecord | false) => void;
  fetch: () => void;
};

const columns = (props: ColumnsCtx): ColumnsType<BrandRecord> => [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Logo ",
    dataIndex: "logoUrl",
    render: (v?: string | null) =>
      v ? (
        <img
          src={v}
          alt="Brand Logo"
          style={{ width: 50, height: 50, objectFit: "contain" }}
        />
      ) : (
        "-"
      ),
  },
  {
    title: "Status",
    dataIndex: "isActive",
    render: (val?: number | boolean) =>
      val === 1 || val === true ? (
        <Tag color="#41BA2D">Active</Tag>
      ) : (
        <Tag color="#FF3434">Inactive</Tag>
      ),
    align: "center",
    width: 140,
  },
  {
    title: "#",
    width: 220,
    align: "center",
    render: (_: unknown, record) => (
      <Space>
        <Tooltip title="Edit Brand">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              props.setCurrent(record);
              props.setOpen(true);
            }}
          />
        </Tooltip>

        <Tooltip title="Delete Brand">
          <Popconfirm
            placement="left"
            title="Are you sure want to delete this brand?"
            okText="Yes"
            cancelText="No"
            onConfirm={async () => {
              try {
                await http.delete(`/admin/brands/${record.slug}`);
                message.success("Brand deleted");
                props.fetch();
              } catch (err: any) {
                message.error(err?.response?.data?.message || "Delete failed");
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

const TableBrand: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<BrandRecord[]>([]);

  // Derived from URL
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchName = searchParams.get("q") || "";

  const [open, setOpen] = useState<boolean>(false);
  const [openBulk, setOpenBulk] = useState<boolean>(false);
  const [current, setCurrent] = useState<BrandRecord | false>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState(0);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/brands?page=${page}&per_page=${pageSize}&q=${encodeURIComponent(searchName)}`,
      )) as ListResponse;

      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.total));
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchName]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <>
      <Card style={{ marginTop: 10 }}>
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

            <Input.Search
              placeholder="Search Brand"
              defaultValue={searchName}
              onSearch={(val) => {
                setSearchParams((prev) => {
                  if (val.trim()) prev.set("q", val.trim());
                  else prev.delete("q");
                  prev.set("page", "1");
                  return prev;
                });
              }}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button icon={<UploadOutlined />} onClick={() => setOpenBulk(true)}>
                Bulk Update
              </Button>
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
            </div>
          </div>
        ) : (
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
              <Input.Search
                placeholder="Search Brand"
                defaultValue={searchName}
                onSearch={(val) => {
                  setSearchParams((prev) => {
                    if (val.trim()) prev.set("q", val.trim());
                    else prev.delete("q");
                    prev.set("page", "1");
                    return prev;
                  });
                }}
              />
              <Button icon={<UploadOutlined />} onClick={() => setOpenBulk(true)}>
                Bulk Update
              </Button>
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
        )}
      </Card>

      <div className="overflow-x-auto md:overflow-visible">
        <Table<BrandRecord>
          style={{ marginTop: 10 }}
          columns={columns({
            setOpen: (v) => setOpen(v),
            setCurrent: (v) => setCurrent(v),
            fetch: fetchList,
          })}
          rowKey={(record) => String(record.id)}
          dataSource={data}
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
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        centered
        open={open}
        title={current ? "Edit Brand" : "Create Brand"}
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
        destroyOnClose
      >
        <FormBrand
          data={current || undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            fetchList();
          }}
          fetch={fetchList}
        />
      </Modal>

      <BrandBulkUpdate
        open={openBulk}
        onOpenChange={setOpenBulk}
        onSuccess={fetchList}
      />
    </>
  );
};

export default TableBrand;
