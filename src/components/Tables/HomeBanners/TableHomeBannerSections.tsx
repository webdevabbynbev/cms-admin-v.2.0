import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Popconfirm,
  Select,
  Modal,
  Space,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import FormHomeBannerSection from "../../Forms/HomeBanners/FormHomeBannerSection";
import http from "../../../api/http";

type SectionRecord = {
  id: number | string;
  name: string;
  slug: string;
  order?: number | null;
  banners_count?: number;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: SectionRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  fetch: () => void;
  setOpen: (open: boolean) => void;
  setCurrent: (rec: SectionRecord | false) => void;
  navigateTo: (id: number | string) => void;
  page: number;
  pageSize: number;
};

const columns = (props: ColumnsCtx): ColumnsType<SectionRecord> => [
  {
    title: "No",
    width: 80,
    align: "center",
    render: (_: unknown, __: SectionRecord, index: number) =>
      (props.page - 1) * props.pageSize + index + 1,
  },
  {
    title: "Section Name",
    dataIndex: "name",
  },
  {
    title: "Slug",
    dataIndex: "slug",
  },
  {
    title: "Total Banners",
    dataIndex: "banners_count",
    align: "center",
    render: (val: number | undefined) => val ?? 0,
  },
  {
    title: "#",
    width: "18%",
    align: "center",
    dataIndex: "action",
    render: (_: unknown, record) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Tooltip title="Manage Banners">
          <Button type="primary" onClick={() => props.navigateTo(record.id)}>
            Manage
          </Button>
        </Tooltip>

        <Tooltip title="Edit Section">
          <Button
            type="primary"
            key="/edit"
            icon={<EditOutlined />}
            onClick={() => {
              props.setCurrent(record);
              props.setOpen(true);
            }}
          />
        </Tooltip>

        <Tooltip title="Delete Section">
          <Popconfirm
            placement="left"
            title="Are you sure want delete this section?"
            onConfirm={async () => {
              await http({
                url: `/admin/home-banners/sections/${record.id}`,
                method: "DELETE",
              });
              props.fetch();
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Tooltip>
      </div>
    ),
  },
];

const TableHomeBannerSections: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = React.useState<SectionRecord[]>([]);

  // Derived from URL
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchValue = searchParams.get("q") || "";

  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<SectionRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [total, setTotal] = React.useState(0);
  const { Search } = Input;

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/home-banners/sections?q=${encodeURIComponent(searchValue)}&page=${page}&per_page=${pageSize}`,
      )) as ListResponse;

      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.total));
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchValue]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const navigateTo = (id: number | string) => {
    navigate(`/homebanners/${id}`);
  };

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
              placeholder="Search Section"
              defaultValue={searchValue}
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
        <Table<SectionRecord>
          style={{ marginTop: 10 }}
          columns={columns({
            fetch: fetchList,
            setOpen: (v) => setOpen(v),
            setCurrent: (v) => setCurrent(v),
            navigateTo,
            page,
            pageSize,
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
          onRow={(record) => ({
            onDoubleClick: () => navigateTo(record.id),
          })}
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        centered
        open={open}
        title={current ? "Edit Section" : "Create Section"}
        onCancel={async () => {
          setOpen(false);
          setCurrent(false);
          fetchList();
        }}
        footer={null}
      >
        <FormHomeBannerSection
          data={current || undefined}
          onCancel={() => {
            setOpen(false);
            setCurrent(false);
          }}
          onSuccess={() => {
            setOpen(false);
            setCurrent(false);
            fetchList();
          }}
        />
      </Modal>
    </>
  );
};

export default TableHomeBannerSections;
