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
  Tag, // ✅ For banner type display
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useSearchParams } from "react-router-dom";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import FormBanner from "../../Forms/Banner/FormBanner";
import http from "../../../api/http";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
  banner_type?: string | null; // ✅ Banner classification
  button_text?: string | null;
  button_url?: string | null;
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

type ColumnsCtx = {
  fetch: () => void;
  setOpen: (open: boolean) => void;
  setCurrent: (rec: BannerRecord | false) => void;
  sectionLabel?: string;
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
      const src = getImageUrl(row.image_url || row.image || "");
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
      const src = getImageUrl(row.image_mobile_url || row.imageMobile || "");
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
    title: props.sectionLabel || "Banner Type", // ✅ NEW: Show banner classification
    dataIndex: "banner_type",
    render: (type: string | null | undefined) => {
      const typeMap: Record<string, { label: string; color: string }> = {
        hero_carousel: { label: "Hero Carousel", color: "blue" },
        banner_top_home: { label: "Banner Top Home", color: "green" },
        page_sale: { label: "Halaman Sale", color: "orange" },
        featured_section: { label: "Featured Section", color: "purple" },
        general: { label: "General", color: "default" },
      };
      const displayType = typeMap[type || "general"];
      return <Tag color={displayType.color}>{displayType.label}</Tag>;
    },
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
                url: `/admin/banners/${record.id}`,
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

type TableBannerProps = {
  listApi?: string;
  listQuery?: Record<string, string | number | boolean | undefined>;
  searchParamKey?: string;
  sectionLabel?: string;
  sectionOptions?: { value: string; label: string }[];
  requireSection?: boolean;
  defaultSection?: string;
  redirectTo?: string;
  enableReorder?: boolean;
};

const ItemType = {
  ROW: "row",
} as const;

type DraggableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  index: number;
  moveRow: (from: number, to: number) => void;
  data: BannerRecord[];
  fetchData: () => void;
};

const DraggableRow: React.FC<DraggableRowProps> = ({
  index,
  moveRow,
  className,
  style,
  data,
  fetchData,
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
        .post("/admin/banners/update-order", { updates: updatedOrder })
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

const TableBanner: React.FC<TableBannerProps> = ({
  listApi = "/admin/banners",
  listQuery,
  searchParamKey = "name",
  sectionLabel,
  sectionOptions,
  requireSection = false,
  defaultSection,
  redirectTo,
  enableReorder = true,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = React.useState<BannerRecord[]>([]);

  // Derived from URL
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchValue = searchParams.get(searchParamKey) || "";

  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<BannerRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [total, setTotal] = React.useState(0);
  const { Search } = Input;

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(pageSize));
      if (searchValue) params.set(searchParamKey, searchValue);
      if (listQuery) {
        Object.entries(listQuery).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          params.set(key, String(value));
        });
      }

      const resp = (await http.get(
        `${listApi}?${params.toString()}`,
      )) as ListResponse;

      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.total));
      }
    } finally {
      setLoading(false);
    }
  }, [listApi, listQuery, page, pageSize, searchParamKey, searchValue]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const moveRow = (fromIndex: number, toIndex: number) => {
    const newData = [...data];
    const [movedItem] = newData.splice(fromIndex, 1);
    newData.splice(toIndex, 0, movedItem);
    setData(newData);
  };

  const FormBannerAny = FormBanner as React.ComponentType<any>;
  const content = (
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
              placeholder="Search Banner"
              defaultValue={searchValue}
              onSearch={(val) => {
                setSearchParams((prev) => {
                  if (val.trim()) prev.set(searchParamKey, val.trim());
                  else prev.delete(searchParamKey);
                  prev.set("page", "1");
                  return prev;
                });
              }}
            />
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setOpen(true)}
            >
              Create New
            </Button>
          </Space>
        </div>
      </Card>

      <div className="overflow-x-auto md:overflow-visible">
        <Table<BannerRecord>
          components={
            enableReorder
              ? {
                  body: {
                    row: (props: any) => (
                      <DraggableRow {...props} data={data} fetchData={fetchList} />
                    ),
                  },
                }
              : undefined
          }
          onRow={
            enableReorder
              ? (_record, index) =>
                  ({
                    index: index as number,
                    moveRow,
                  }) as unknown as React.HTMLAttributes<HTMLTableRowElement>
              : undefined
          }
          style={{ marginTop: 10 }}
          columns={columns({
            fetch: fetchList,
            setOpen: (v) => setOpen(v),
            setCurrent: (v) => setCurrent(v),
            sectionLabel,
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
        title="Manage Banner"
        onCancel={async () => {
          setOpen(false);
          setCurrent(false);
          fetchList();
        }}
        footer={null}
      >
        <FormBannerAny
          data={current || undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            fetchList();
          }}
          fetch={fetchList}
          sectionLabel={sectionLabel}
          sectionOptions={sectionOptions}
          requireSection={requireSection}
          defaultSection={defaultSection}
          redirectTo={redirectTo}
        />
      </Modal>
    </>
  );

  if (!enableReorder) return content;

  return <DndProvider backend={HTML5Backend}>{content}</DndProvider>;
};

export default TableBanner;
