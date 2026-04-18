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
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FormHomeBanner from "../../Forms/HomeBanners/FormHomeBanner";
import http from "../../../api/http";
import { getImageUrl } from "../../../utils/asset";

type BannerRecord = {
  id: number | string;
  order?: number;
  image?: string | null;
  image_url?: string | null;
  imageMobile?: string | null;
  image_mobile_url?: string | null;
  title?: string | null;
  description?: string | null;
  button_text?: string | null;
  button_url?: string | null;
};

type SectionRecord = {
  id: number | string;
  name: string;
  slug: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: BannerRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type SectionResponse = {
  data?: {
    serve: SectionRecord;
  };
};

type ColumnsCtx = {
  fetch: () => void;
  setOpen: (open: boolean) => void;
  setCurrent: (rec: BannerRecord | false) => void;
};

const resolveImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return getImageUrl(path);
};

const columns = (props: ColumnsCtx): ColumnsType<BannerRecord> => [
  {
    title: "Order",
    dataIndex: "order",
    align: "center",
  },
  {
    title: "Image",
    render: (_: unknown, row) => {
      const src = resolveImageUrl(row.image_url || row.image || "");
      if (!src) return "No Image";

      const ext = src.split("?")[0].split(".").pop()?.toLowerCase();
      if (ext === "mp4") {
        return <video width={150} src={src} controls />;
      }
      return (
        <img
          src={src}
          alt="banner"
          style={{ width: 50, objectFit: "contain" }}
        />
      );
    },
  },
  {
    title: "Image Mobile",
    render: (_: unknown, row) => {
      const src = resolveImageUrl(row.image_mobile_url || row.imageMobile || "");
      if (!src) return "No Image";

      const ext = src.split("?")[0].split(".").pop()?.toLowerCase();
      if (ext === "mp4") {
        return <video width={150} src={src} controls />;
      }
      return (
        <img
          src={src}
          alt="banner-mobile"
          style={{ width: 75, objectFit: "contain" }}
        />
      );
    },
  },
  {
    title: "Title",
    dataIndex: "title",
  },
  {
    title: "Description",
    dataIndex: "description",
  },
  {
    title: "Button Text",
    dataIndex: "button_text",
  },
  {
    title: "Button URL",
    dataIndex: "button_url",
  },
  {
    title: "#",
    width: "10%",
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
        <Tooltip title="Edit Banner">
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

        <Tooltip title="Delete Banner">
          <Popconfirm
            placement="left"
            title="Are your sure want delete this data?"
            onConfirm={async () => {
              await http({
                url: `/admin/home-banners/banners/${record.id}`,
                method: "DELETE",
              });
              props.fetch();
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Tooltip>
      </div>
    ),
  },
];

const ItemType = {
  ROW: "row",
} as const;

type DraggableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  index: number;
  moveRow: (from: number, to: number) => void;
  data: BannerRecord[];
  fetchData: () => void;
  sectionId: number | string;
};

const DraggableRow: React.FC<DraggableRowProps> = ({
  index,
  moveRow,
  className,
  style,
  data,
  fetchData,
  sectionId,
  ...restProps
}) => {
  const ref = React.useRef<HTMLTableRowElement>(null);

  const [, drop] = useDrop<{
    type: string;
    index: number;
  }>({
    accept: ItemType.ROW,
    hover(item) {
      if (item.index !== index) {
        moveRow(item.index, index);
        item.index = index;
      }
    },
    drop() {
      const updatedOrder = data.map((item, idx) => ({
        id: item.id,
        order: idx,
      }));
      http
        .post(`/admin/home-banners/sections/${sectionId}/banners/update-order`, {
          updates: updatedOrder,
        })
        .then(() => {
          fetchData();
        });
    },
  });

  const [, drag] = useDrag({
    type: ItemType.ROW,
    item: { index },
  });

  drag(drop(ref));

  return (
    <tr
      ref={ref}
      className={className}
      style={{ cursor: "move", ...style }}
      {...restProps}
    />
  );
};

type Props = {
  sectionId: number | string;
};

const TableHomeSectionBanners: React.FC<Props> = ({ sectionId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = React.useState<BannerRecord[]>([]);
  const [section, setSection] = React.useState<SectionRecord | null>(null);

  // Derived from URL
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchValue = searchParams.get("q") || "";

  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<BannerRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [total, setTotal] = React.useState(0);
  const { Search } = Input;

  const fetchSection = React.useCallback(async () => {
    try {
      const resp = (await http.get(
        `/admin/home-banners/sections/${sectionId}`,
      )) as SectionResponse;
      setSection(resp?.data?.serve || null);
    } catch {
      setSection(null);
    }
  }, [sectionId]);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/home-banners/sections/${sectionId}/banners?q=${encodeURIComponent(
          searchValue,
        )}&page=${page}&per_page=${pageSize}`,
      )) as ListResponse;

      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.total));
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchValue, sectionId]);

  React.useEffect(() => {
    fetchSection();
  }, [fetchSection]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const moveRow = (fromIndex: number, toIndex: number) => {
    const newData = [...data];
    const [movedItem] = newData.splice(fromIndex, 1);
    newData.splice(toIndex, 0, movedItem);
    setData(newData);
  };

  const FormHomeBannerAny = FormHomeBanner as React.ComponentType<any>;
  return (
    <DndProvider backend={HTML5Backend}>
      <Card style={{ marginTop: 10 }}>
        <div
          className="flex flex-wrap"
          style={{ width: "100%", alignItems: "flex-end" }}
        >
          <div className="flex align-center" style={{ gap: 8 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/homebanners")}
            >
              Back
            </Button>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {section?.name || "Home Banner Section"}
            </span>
          </div>

          <div className="flex align-center" style={{ marginLeft: "auto" }}>
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
          <Space className="flex align-center mt-2" style={{ marginLeft: 10 }}>
            <Search
              placeholder="Search Banner"
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

      <Table<BannerRecord>
        components={{
          body: {
            row: (props: any) => (
              <DraggableRow
                {...props}
                data={data}
                fetchData={fetchList}
                sectionId={sectionId}
              />
            ),
          },
        }}
        onRow={(_record, index) =>
          ({
            index: index as number,
            moveRow,
          }) as unknown as React.HTMLAttributes<HTMLTableRowElement>
        }
        style={{ marginTop: 10 }}
        columns={columns({
          fetch: fetchList,
          setOpen: (v) => setOpen(v),
          setCurrent: (v) => setCurrent(v),
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
      />

      <Modal
        centered
        open={open}
        title="Manage Banner"
        onCancel={async () => {
          setOpen(false);
          setCurrent(false);
          fetchList();
        }}
        footer={null}
      >
        <FormHomeBannerAny
          sectionId={sectionId}
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
    </DndProvider>
  );
};

export default TableHomeSectionBanners;
