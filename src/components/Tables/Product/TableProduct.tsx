import React from "react";
import {
  Table,
  Button,
  Card,
  Image,
  Tag,
  message,
  Tooltip,
  Input,
  Select,
  InputNumber,
  Grid,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  PictureOutlined,
  UploadOutlined, // ✅ CSV
  DownloadOutlined, // ✅ Export CSV
} from "@ant-design/icons";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import placeholder from "../../../assets/img/placeholder.png";
import http from "../../../api/http";
import helper from "../../../utils/helper";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCsvUpload from "../../product/ProductCsvUpload";
import { exportProductCSV } from "../../../services/api/product.services";
import { useBulkSelection } from "../../../hooks/useBulkSelection";
import { ConfirmDeleteModal } from "../../ConfirmDeleteModal";

type MediaItem = {
  url: string;
  type: 1 | 2;
  altText?: string;
};

type VariantRecord = {
  id: number | string;
  sku?: string;
  sku_variant_1?: string;
  barcode?: string;
  stock: number;
  price: number;
  weight?: number;
  total_sold?: number;
  attributes?: Array<{ value?: string; label?: string }>;
  attribute_values?: Array<{ value?: string; label?: string }>;
};

type TagRecord = { id: number | string; name: string };

type ProductRecord = {
  id: number | string;
  position?: number | null;
  name: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  masterSku?: string | null;
  medias?: MediaItem[];
  variants?: VariantRecord[];
  categoryType?: { id: number | string; name: string } | null;
  tags?: TagRecord[];
  status?: string;
  isFlashsale?: boolean;
  brand?: { id: number | string; name: string } | null;
};

type StatusFilter = "normal" | "war" | "draft";

type QueryParams = {
  name: string;
  statusFilter?: StatusFilter;
  brand_id?: number | null;
  seo_status?: "sudah" | "belum" | null;
};

type ListResponse = {
  data?: {
    serve: {
      data: ProductRecord[];
      currentPage: string | number;
      perPage: string | number;
      total: string | number;
    };
  };
};

const ItemType = { ROW: "row" } as const;

type DragItem = { index: number };

const hasSeoFilled = (record: ProductRecord) => {
  const metaTitle = String(record.meta_title ?? record.metaTitle ?? "").trim();
  const metaDescription = String(
    record.meta_description ?? record.metaDescription ?? "",
  ).trim();
  const metaKeywords = String(
    record.meta_keywords ?? record.metaKeywords ?? "",
  ).trim();
  return Boolean(metaTitle && metaDescription && metaKeywords);
};

type DraggableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  index: number;
  moveRow: (fromIndex: number, toIndex: number) => void;
  data: ProductRecord[];
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

  const [, drop] = useDrop<DragItem>({
    accept: ItemType.ROW,
    hover(item) {
      if (item.index !== index) {
        moveRow(item.index, index);
        item.index = index;
      }
    },
    async drop() {
      try {
        const updates = data.map((item, idx) => ({ id: item.id, order: idx }));
        await http.post("/admin/product/update-order", { updates });
        fetchData();
      } catch (e: any) {
        message.error(e?.response?.data?.message || "Failed to update order");
      }
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
      style={{ cursor: "move", ...(style as React.CSSProperties) }}
      {...restProps}
    />
  );
};

const EditableStock: React.FC<{
  val: number;
  vRecord: VariantRecord;
  onUpdate: (id: number | string, payload: any) => void;
}> = ({ val, vRecord, onUpdate }) => {
  const [tempVal, setTempVal] = React.useState<number | null>(val);

  React.useEffect(() => {
    setTempVal(val);
  }, [val]);

  const onSave = () => {
    if (tempVal !== null && tempVal !== val) {
      onUpdate(vRecord.id, { stock: tempVal });
    }
  };

  return (
    <InputNumber
      min={0}
      style={{ width: 110 }}
      value={tempVal}
      onChange={(v) => setTempVal(v)}
      onBlur={onSave}
      onPressEnter={onSave}
    />
  );
};

const EditablePrice: React.FC<{
  val: number;
  vRecord: VariantRecord;
  onUpdate: (id: number | string, payload: any) => void;
}> = ({ val, vRecord, onUpdate }) => {
  const [tempVal, setTempVal] = React.useState<string>(String(val));

  React.useEffect(() => {
    setTempVal(String(val));
  }, [val]);

  const onSave = () => {
    const s = tempVal.replace(/[^0-9]/g, "");
    const newVal = Number(s);
    if (newVal !== val) {
      onUpdate(vRecord.id, { price: newVal });
    }
  };

  return (
    <Input
      prefix="Rp"
      style={{ width: 140 }}
      value={helper.formatRupiah(tempVal)}
      onChange={(e) => {
        const s = e.target.value.replace(/[^0-9]/g, "");
        setTempVal(s);
      }}
      onBlur={onSave}
      onPressEnter={(e) => {
        onSave();
        (e.target as any).blur();
      }}
    />
  );
};

const buildColumns = (props: {
  fetch: () => void;
  navigate: ReturnType<typeof useNavigate>;
  page: { currentPage: number; pageSize: number };
  onDeleteOne: (id: number | string) => void;
}): ColumnsType<ProductRecord> => [
    {
      title: "Index",
      key: "index",
      width: 80,
      align: "center",
      render: (_: unknown, _record, index) => {
        if (typeof index !== "number") return "-";
        const currentPage = Math.max(1, Number(props.page?.currentPage) || 1);
        const pageSize = Math.max(1, Number(props.page?.pageSize) || 10);
        return (currentPage - 1) * pageSize + index + 1;
      },
    },
    {
      title: "SEO",
      key: "seo_status",
      width: 110,
      align: "center",
      render: (_: unknown, record) =>
        hasSeoFilled(record) ? (
          <Tag color="green">Sudah</Tag>
        ) : (
          <Tag color="red">Belum</Tag>
        ),
    },
    {
      title: "Image",
      align: "center",
      width: 110,
      render: (_: unknown, record) => {
        const img = (record.medias || []).find((m) => m.type === 1);
        return img ? (
          <Image
            alt={img.altText || record.name}
            src={helper.renderImage(img.url)}
            width={70}
            height={50}
            style={{ objectFit: "contain" }}
            preview={false}
          />
        ) : (
          <Image
            src={placeholder}
            width={70}
            height={50}
            style={{ objectFit: "contain" }}
            preview={false}
          />
        );
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (value: string, record) => {
        const search = window.location.search;
        const separator = search ? "&" : "";
        const cleanSearch = search.startsWith("?")
          ? search.substring(1)
          : search;
        const editUrl = `/product-form?id=${record.id}${separator}${cleanSearch}`;
        return (
          <Button
            type="link"
            style={{ padding: 0, height: "auto", fontWeight: 500 }}
            onClick={() => props.navigate(editUrl)}
          >
            {value || "-"}
          </Button>
        );
      },
    },
    {
      title: "Master SKU / Varian SKU",
      width: 180,
      render: (_: unknown, record) => {
        const hasVariants = Array.isArray(record.variants) && record.variants.length > 0;
        const v1 = hasVariants ? record.variants?.[0] : null;
        const sku1 = v1?.sku_variant_1 || v1?.sku || "";
        const barcode = v1?.barcode || "";
        const showBarcode = barcode && barcode !== sku1;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontWeight: 500 }}>{record.masterSku || "-"}</span>
            {v1 && (v1.sku_variant_1 || v1.sku) && (
              <span style={{ fontSize: 12, color: "#888" }}>{v1.sku_variant_1 || v1.sku}</span>
            )}
            {showBarcode && (
              <span style={{ fontSize: 11, color: "#aaa" }}>{barcode}</span>
            )}
          </div>
        );
      },
      responsive: ["md"],
    },
    {
      title: "Brand",
      width: 120,
      render: (_: unknown, r) => r.brand?.name ?? "-",
      responsive: ["md"],
    },
    {
      title: "Stock",
      width: 120,
      align: "center",
      render: (_: unknown, r) => {
        const hasVariants = Array.isArray(r.variants) && r.variants.length > 0;
        const isSingle = hasVariants && r.variants!.length === 1;
        const noVariants = !hasVariants || r.variants!.length === 0;

        if (isSingle || noVariants) {
          const v = r.variants?.[0];
          if (!v && noVariants) return "-";
          if (v) {
            return (
              <EditableStock
                val={v.stock}
                vRecord={v}
                onUpdate={(id, payload) => {
                  try {
                    http.put(`/admin/product-variant/${id}`, payload).then(() => {
                      message.success("Stock updated");
                      props.fetch();
                    });
                  } catch (e: any) {
                    message.error(e?.response?.data?.message || "Update failed");
                  }
                }}
              />
            );
          }
        }

        return (r.variants || []).reduce(
          (acc, cur) => acc + (Number(cur?.stock ?? 0) || 0),
          0,
        );
      },
      responsive: ["md"],
    },
    {
      title: "Product Price",
      width: 220,
      render: (_: unknown, r) => {
        const hasVariants = Array.isArray(r.variants) && r.variants.length > 0;
        const isSingle = hasVariants && r.variants!.length === 1;
        const noVariants = !hasVariants || r.variants!.length === 0;

        if (isSingle || noVariants) {
          const v = r.variants?.[0]; // if no variants, might be null
          if (!v && noVariants) return "-";
          if (v) {
            return (
              <EditablePrice
                val={v.price}
                vRecord={v}
                onUpdate={(id, payload) => {
                  try {
                    http.put(`/admin/product-variant/${id}`, payload).then(() => {
                      message.success("Price updated");
                      props.fetch();
                    });
                  } catch (e: any) {
                    message.error(e?.response?.data?.message || "Update failed");
                  }
                }}
              />
            );
          }
        }

        const prices = (r.variants || [])
          .map((v) => Number(v?.price ?? 0))
          .filter((p) => p > 0);
        if (prices.length === 0) return "-";
        const fmt = (n: number) =>
          `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
      },
      responsive: ["lg"],
    },
    {
      title: "Status",
      width: 160,
      align: "center",
      render: (_: unknown, r) => {
        if ((r.status || "").toLowerCase() === "draft") {
          return <Tag>Draft</Tag>;
        }
        if (r.isFlashsale) {
          return <Tag color="#87d068">War Product</Tag>;
        }
        return <Tag color="#2cb6f4">Normal Product</Tag>;
      },
    },
    {
      title: "Tag",
      render: (_: unknown, r) =>
        r.tags && r.tags.length ? r.tags.map((t) => t.name).join(", ") : "-",
      responsive: ["lg"],
    },
    {
      title: "#",
      width: 220,
      fixed: "right",
      align: "center",
      render: (_: unknown, record) => (
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Tooltip title="Edit Product">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                const search = window.location.search;
                const separator = search ? "&" : "";
                const cleanSearch = search.startsWith("?")
                  ? search.substring(1)
                  : search;
                props.navigate(
                  `/product-form?id=${record.id}${separator}${cleanSearch}`,
                );
              }}
            />
          </Tooltip>

          <Tooltip title="Manage Media">
            <Button
              icon={<PictureOutlined />}
              onClick={() => props.navigate(`/products/${record.id}/${record.brand?.name || "brand"}/${record.name}/medias`)}
            />
          </Tooltip>

          <Tooltip title="Delete Product">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => props.onDeleteOne(record.id)}
            />
          </Tooltip>

          <Tooltip title="Duplicate Product">
            <Button
              icon={<CopyOutlined />}
              onClick={() => props.navigate(`/product-duplicate?id=${record.id}&mode=duplicate`)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

const TableProduct: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();

  const [data, setData] = React.useState<ProductRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({ name: "" });

  // Debounce search state
  const [searchText, setSearchText] = React.useState("");
  const [brands, setBrands] = React.useState<{ id: number; name: string }[]>(
    [],
  );

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setParams((prev) => ({ ...prev, name: searchText }));
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [searchText]);

  React.useEffect(() => {
    // Fetch brands for filter
    http.get("/admin/brands?per_page=1000").then((res) => {
      setBrands(res.data?.serve?.data || []);
    });
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = React.useState(false);

  // Derived pagination from URL
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;

  const [total, setTotal] = React.useState(0);

  // ✅ CSV STATE
  const [openCsvUpload, setOpenCsvUpload] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<React.Key[]>([]);
  const { rowSelection, selectedRowKeys, hasSelection, resetSelection } =
    useBulkSelection<ProductRecord>();

  // ✅ EXPORT CSV — axios dengan timeout:0 (unlimited) agar tidak ECONNABORTED
  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      message.loading({
        content: "Sedang memproses export...",
        key: "csv-export",
        duration: 0,
      });

      const blob = (await exportProductCSV()) as Blob;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "products_export_master.csv");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: "CSV berhasil diunduh!", key: "csv-export" });
    } catch (err: any) {
      
      message.error({
        content: err?.response?.data?.message || "Gagal mengekspor CSV",
        key: "csv-export",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const fetchProducts = React.useCallback(async (
    q: QueryParams = params,
    page?: TablePaginationConfig,
  ) => {
    setLoading(true);
    try {
      const buildBaseQuery = () => {
        const base = new URLSearchParams();
        base.set("name", q.name);

        if (q.statusFilter === "draft") base.set("status", "draft");
        else if (q.statusFilter === "normal") {
          base.set("status", "normal");
          base.set("isFlashsale", "0");
        }
        if (q.statusFilter === "war") {
          base.set("isFlashsale", "1");
        }

        if (q.brand_id !== undefined && q.brand_id !== null) {
          base.set("brand_id", String(q.brand_id));
        }
        return base;
      };

      if (q.seo_status) {
        const perPage = 500;
        let nextPage = 1;
        let allRows: ProductRecord[] = [];
        let expectedTotal = 0;

        while (true) {
          const loopQuery = buildBaseQuery();
          loopQuery.set("page", String(nextPage));
          loopQuery.set("per_page", String(perPage));

          const loopResp = (await http.get(
            `/admin/product?${loopQuery.toString()}`,
          )) as ListResponse;
          const loopServe = loopResp?.data?.serve;
          if (!loopServe) break;

          const rows = Array.isArray(loopServe.data) ? loopServe.data : [];
          allRows = [...allRows, ...rows];

          const currentServePage = Number(loopServe.currentPage ?? nextPage);
          const servePerPage = Number(loopServe.perPage ?? perPage);
          expectedTotal = Number(loopServe.total ?? expectedTotal);

          const noMoreRows = rows.length === 0 || rows.length < servePerPage;
          const reachedTotal = expectedTotal > 0 && allRows.length >= expectedTotal;
          if (noMoreRows || reachedTotal) break;
          nextPage = currentServePage + 1;
        }

        const wantFilled = q.seo_status === "sudah";
        const seoFiltered = allRows.filter((row) => hasSeoFilled(row) === wantFilled);
        setData(seoFiltered);
        setTotal(seoFiltered.length);
        return;
      }

      const query = buildBaseQuery();
      query.set("page", String(page?.current ?? currentPage));
      query.set("per_page", String(page?.pageSize ?? pageSize));

      const resp = (await http.get(
        `/admin/product?${query.toString()}`,
      )) as ListResponse;

      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.total));
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, params]);

  React.useEffect(() => {
    // Consolidated Effect: triggers whenever filters/page/pageSize changes
    fetchProducts(params, { current: currentPage, pageSize: pageSize });
  }, [fetchProducts, params, currentPage, pageSize]);

  React.useEffect(() => {
    if (total === 0) return; // data belum loaded, jangan koreksi page dulu
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage <= maxPage) return;
    setSearchParams((prev) => {
      prev.set("page", String(maxPage));
      return prev;
    });
  }, [total, pageSize, currentPage, setSearchParams]);

  const handleUpdateVariant = async (variantId: number | string, payload: any) => {
    try {
      await http.put(`/admin/product-variant/${variantId}`, payload);
      message.success("Variant updated");
      fetchProducts(params, { current: currentPage, pageSize });
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Update failed");
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

  const columns = React.useMemo(
    () =>
      buildColumns({
        fetch: () => fetchProducts(params, { current: currentPage, pageSize }),
        navigate,
        page: { currentPage, pageSize },
        onDeleteOne: (id: number | string) => {
          setPendingDeleteIds([id]);
          setDeleteModalOpen(true);
        },
      }),
    [fetchProducts, params, currentPage, pageSize, navigate],
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setSearchParams((prev) => {
      prev.set("page", "1");
      return prev;
    });
  };

  const handleBrandChange = (val: number | null | undefined) => {
    setParams((prev) => ({ ...prev, brand_id: val || null }));
    setSearchParams((prev) => {
      prev.set("page", "1");
      return prev;
    });
  };

  const handleDeleteSelected = async () => {
    if (!pendingDeleteIds.length) return;
    try {
      setBulkDeleting(true);
      const results = await Promise.allSettled(
        pendingDeleteIds.map((id) => http.delete(`/admin/product/${id}`)),
      );
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        message.success(`${successCount} product berhasil dihapus.`);
      }
      if (failedCount > 0) {
        message.error(`${failedCount} product gagal dihapus.`);
      }

      resetSelection();
      setPendingDeleteIds([]);
      setDeleteModalOpen(false);
      fetchProducts(params, { current: currentPage, pageSize });
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSeoStatusChange = (val: "sudah" | "belum" | null | undefined) => {
    setParams((prev) => ({ ...prev, seo_status: val || null }));
    setSearchParams((prev) => {
      prev.set("page", "1");
      return prev;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {/* FILTER */}
      <Card style={{ marginTop: 10 }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Input
            placeholder="Search by Name, SKU, or Slug..."
            allowClear
            onChange={handleSearch}
            style={{ width: 300 }}
            value={searchText}
          />
          <Select
            placeholder="Filter by Brand"
            style={{ minWidth: 200 }}
            allowClear
            showSearch
            value={params.brand_id} // ✅ Controlled component
            filterOption={(input: string, option: any) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={brands.map((b) => ({ label: b.name, value: b.id }))}
            onChange={handleBrandChange}
          />
          <Select
            placeholder="Filter by SEO"
            style={{ minWidth: 180 }}
            allowClear
            value={params.seo_status ?? undefined}
            options={[
              { label: "Sudah", value: "sudah" },
              { label: "Belum", value: "belum" },
            ]}
            onChange={handleSeoStatusChange}
          />
        </div>
      </Card>

      {/* ACTION BAR */}
      <Card style={{ marginTop: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                setPendingDeleteIds([...selectedRowKeys]);
                setDeleteModalOpen(true);
              }}
              loading={bulkDeleting}
              disabled={!hasSelection || bulkDeleting}
            >
              Delete selected
            </Button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCSV}
              loading={exportLoading}
              disabled={exportLoading}
            >
              {exportLoading ? "Exporting..." : "Export CSV"}
            </Button>

            <Button
              icon={<UploadOutlined />}
              onClick={() => setOpenCsvUpload(true)}
            >
              Upload CSV
            </Button>

            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => navigate("/product-form")}
            >
              Create new
            </Button>
          </div>
        </div>
      </Card>

      <div className="overflow-x-auto md:overflow-visible">
        <Table<ProductRecord>
          components={{
            body: {
              row: (rowProps: any) => (
                <DraggableRow
                  {...rowProps}
                  data={data}
                  fetchData={() =>
                    fetchProducts(params, { current: currentPage, pageSize })
                  }
                />
              ),
            },
          }}
          onRow={(_record, index) => ({ index: index as number, moveRow }) as any}
          style={{ marginTop: 10 }}
          columns={columns}
          rowKey={(record) => String(record.id)}
          dataSource={data}
          rowSelection={rowSelection}
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total,
            showSizeChanger: true,
          }}
          loading={loading}
          onChange={(newPagination) => {
            setSearchParams((prev) => {
              prev.set("page", String(newPagination.current ?? 1));
              prev.set("per_page", String(newPagination.pageSize ?? 10));
              return prev;
            });
          }}
          expandable={{
            expandedRowRender: (record) => {
              const rows = (record.variants ?? []).map((v) => {
                const attrs = (v as any).attributes || (v as any).attribute_values || [];
                const attrName = Array.isArray(attrs)
                  ? attrs
                      .map((a: any) => a?.value || a?.label || "")
                      .map((s: string) => String(s).trim())
                      .filter(Boolean)
                      .join(" / ")
                  : "";

                return {
                  ...v,
                  product_name: record.name,
                  brand_name: record.brand?.name || "-",
                  variant_name: attrName || v.sku_variant_1 || v.sku || "-",
                  weight: v.weight ?? (record as any).weight ?? 0,
                  total_sold: (v as any).total_sold ?? (v as any).totalSold ?? null,
                };
              });

              return (
                <Table<VariantRecord & any>
                  rowKey={(r) => String(r.id)}
                  dataSource={rows}
                  pagination={false}
                  size="small"
                  scroll={{ x: "max-content" }}
                >
                  <Table.Column title="Brand" dataIndex="brand_name" render={(v) => v || "-"} />
                  <Table.Column title="Nama Produk" dataIndex="product_name" render={(v) => v || "-"} />
                  <Table.Column title="Nama Varian" dataIndex="variant_name" render={(v) => v || "-"} />
                  <Table.Column
                    title="Stock"
                    dataIndex="stock"
                    render={(val: number, vRecord: VariantRecord) => (
                      <EditableStock
                        val={val}
                        vRecord={vRecord}
                        onUpdate={handleUpdateVariant}
                      />
                    )}
                  />
                  <Table.Column
                    title="Harga"
                    dataIndex="price"
                    render={(val: number, vRecord: VariantRecord) => (
                      <EditablePrice
                        val={val}
                        vRecord={vRecord}
                        onUpdate={handleUpdateVariant}
                      />
                    )}
                  />
                  <Table.Column
                    title="Berat (g)"
                    dataIndex="weight"
                    render={(v) => (typeof v === "number" ? v : "-")}
                  />
                  <Table.Column
                    title="Performa (Terjual)"
                    dataIndex="total_sold"
                    render={(v) => (v === null || v === undefined ? "-" : v)}
                  />
                </Table>
              );
            },
            rowExpandable: (record) =>
              Array.isArray(record.variants) && record.variants.length > 0,
          }}
        />
      </div>

      {/* ✅ CSV MODAL */}
      <ProductCsvUpload
        open={openCsvUpload}
        onOpenChange={setOpenCsvUpload}
        onSuccess={() => fetchProducts(params, { current: currentPage, pageSize })}
      />

      <ConfirmDeleteModal
        open={deleteModalOpen}
        loading={bulkDeleting}
        count={pendingDeleteIds.length}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPendingDeleteIds([]);
        }}
        onConfirm={handleDeleteSelected}
      />
    </DndProvider>
  );
};

export default TableProduct;
