import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Card,
  Popconfirm,
  Image,
  message,
  Space,
  Input,
  Tag,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  PictureOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import http from "../../../api/http";
import FormPickModal from "../../Forms/Picks/FormPickModal";
import { useSearchParams } from "react-router-dom";

const ItemType = { ROW: "row" } as const;

interface PickRecord {
  id: number;
  order: number;
  is_active: boolean;
  product_id: number;
  start_date?: string | null;
  end_date?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  product?: {
    id: number;
    name: string;
    masterSku?: string | null;
    medias?: { url: string; type: number }[];
    brand?: { name: string } | null;
    categoryType?: { name: string } | null;
    variants?: {
      id: number | string;
      barcode?: string;
      sku?: string;
      stock: number;
      price: number;
    }[];
    tags?: { id: number | string; name: string }[];
  };
}

interface TablePicksProps {
  title: string;
  apiUrl: string;
}

const DraggableRow: React.FC<any> = ({
  index,
  moveRow,
  className,
  style,
  data,
  onUpdateOrder,
  ...restProps
}) => {
  const ref = React.useRef<HTMLTableRowElement>(null);

  const [, drop] = useDrop({
    accept: ItemType.ROW,
    hover(item: any) {
      if (item.index !== index) {
        moveRow(item.index, index);
        item.index = index;
      }
    },
    drop() {
      onUpdateOrder();
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

const TablePicks: React.FC<TablePicksProps> = ({ title, apiUrl }) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PickRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<PickRecord | undefined>();

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 20;
  const searchName = searchParams.get("q") || "";

  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await http.get(
        `${apiUrl}?page=${page}&per_page=${pageSize}&q=${encodeURIComponent(searchName)}`,
      );
      const serve = resp?.data?.serve || resp?.data;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.meta?.total || serve.total || 0));
      }
    } catch (e: any) {
      message.error(
        e?.response?.data?.message || `Gagal mengambil data ${title}`,
      );
    } finally {
      setLoading(false);
    }
  }, [apiUrl, page, pageSize, searchName, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    try {
      await http.delete(`${apiUrl}/${id}`);
      message.success("Produk berhasil dihapus dari daftar");
      fetchData();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Gagal menghapus produk");
    }
  };

  const handleBatchUpdateOrder = async () => {
    try {
      const promises = data.map((item, idx) =>
        http.put(`${apiUrl}/${item.id}`, { order: idx }),
      );
      await Promise.all(promises);
      message.success("Urutan berhasil diperbarui");
      fetchData();
    } catch (e: any) {
      message.error("Gagal memperbarui urutan");
    }
  };

  const moveRow = (fromIndex: number, toIndex: number) => {
    setData((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const columns: ColumnsType<PickRecord> = [
    {
      title: "Image",
      align: "center",
      width: 110,
      render: (_: any, record) => {
        const img = record.product?.medias?.find((m: any) => m.type === 1);
        return img ? (
          <Image
            src={img.url}
            width={70}
            height={50}
            style={{ objectFit: "contain" }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 70,
              height: 50,
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PictureOutlined style={{ color: "#bfbfbf" }} />
          </div>
        );
      },
    },
    {
      title: "Name",
      render: (_: any, record) => record.product?.name || "-",
    },
    {
      title: "Master SKU",
      width: 160,
      render: (_: any, record) => record.product?.masterSku || "-",
    },
    {
      title: "Brand",
      width: 120,
      render: (_: any, record) => record.product?.brand?.name ?? "-",
    },
    {
      title: "Category Type",
      width: 220,
      render: (_: any, record) => record.product?.categoryType?.name ?? "-",
    },
    {
      title: "Stock",
      width: 120,
      align: "center",
      render: (_: any, record) =>
        (record.product?.variants || []).reduce(
          (acc: number, cur: any) => acc + (Number(cur?.stock ?? 0) || 0),
          0,
        ),
    },
    {
      title: "Periode Tayang",
      width: 180,
      render: (_: any, record: any) => {
        const sDate = record.start_date || record.startDate;
        const eDate = record.end_date || record.endDate;
        if (sDate || eDate) {
          const start = sDate
            ? dayjs(sDate).format("DD MMM YYYY")
            : "Seterusnya";
          const end = eDate ? dayjs(eDate).format("DD MMM YYYY") : "Seterusnya";
          return `${start} - ${end}`;
        }
        return "Selalu Tayang";
      },
    },
    {
      title: "Status",
      align: "center",
      render: (_: any, record: any) => {
        const isActive =
          Number(record.is_active) === 1 ||
          record.is_active === true ||
          Number(record.isActive) === 1 ||
          record.isActive === true;
        return (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Aktif" : "Nonaktif"}
          </Tag>
        );
      },
    },
    {
      title: "#",
      width: 100,
      align: "center",
      render: (_: any, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setCurrentEdit(record);
              setOpenModal(true);
            }}
          />
          <Popconfirm
            title="Hapus dari daftar?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <Card
        title={
          <Space>
            <ThunderboltOutlined
              style={{ color: "var(--ant-primary-color)" }}
            />
            <span>{title}</span>
          </Space>
        }
        extra={
          !isMobile ? (
            <Space>
              <Input.Search
                placeholder={`Cari nama produk di ${title}`}
                defaultValue={searchName}
                onSearch={(val) => {
                  setSearchParams((prev) => {
                    if (val.trim()) prev.set("q", val.trim());
                    else prev.delete("q");
                    prev.set("page", "1");
                    return prev;
                  });
                }}
                style={{ width: 250 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCurrentEdit(undefined);
                  setOpenModal(true);
                }}
              >
                Tambah Produk
              </Button>
            </Space>
          ) : undefined
        }
        style={{ marginTop: 10 }}
      >
        {isMobile && (
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <Input.Search
              placeholder={`Cari nama produk di ${title}`}
              defaultValue={searchName}
              onSearch={(val) => {
                setSearchParams((prev) => {
                  if (val.trim()) prev.set("q", val.trim());
                  else prev.delete("q");
                  prev.set("page", "1");
                  return prev;
                });
              }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setCurrentEdit(undefined);
                setOpenModal(true);
              }}
            >
              Tambah Produk
            </Button>
          </div>
        )}

        <div className="overflow-x-auto md:overflow-visible">
          <Table<PickRecord>
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              onChange: (p, ps) => {
                setSearchParams((prev) => {
                  prev.set("page", String(p));
                  prev.set("per_page", String(ps));
                  return prev;
                });
              },
            }}
            components={{
              body: {
                row: (props: any) => (
                  <DraggableRow
                    {...props}
                    data={data}
                    moveRow={moveRow}
                    onUpdateOrder={handleBatchUpdateOrder}
                  />
                ),
              },
            }}
            onRow={(_, index) => ({ index, moveRow }) as any}
            expandable={{
              expandedRowRender: (record) => (
                <Table
                  rowKey={(r: any) => String(r.id)}
                  dataSource={record.product?.variants ?? []}
                  pagination={false}
                  size="small"
                  scroll={{ x: "max-content" }}
                >
                  <Table.Column title="SKU" dataIndex="sku" />
                  <Table.Column title="Stock" dataIndex="stock" />
                  <Table.Column
                    title="Price"
                    dataIndex="price"
                    render={(val: number) =>
                      `Rp. ${new Intl.NumberFormat("id-ID").format(val || 0)}`
                    }
                  />
                </Table>
              ),
              rowExpandable: (record) =>
                Array.isArray(record.product?.variants) &&
                record.product.variants.length > 0,
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      <FormPickModal
        open={openModal}
        title={title}
        apiUrl={apiUrl}
        editData={currentEdit}
        onCancel={() => {
          setOpenModal(false);
          setCurrentEdit(undefined);
        }}
        onSuccess={() => fetchData()}
      />
    </DndProvider>
  );
};

export default TablePicks;
