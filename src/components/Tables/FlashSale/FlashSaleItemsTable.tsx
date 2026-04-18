import React from "react";
import { Badge, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ThunderboltOutlined,
  FireOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type {
  FlashSaleRow,
  FlashSaleItem,
  ProductGroupRow,
} from "../../../services/api/flash-sale/flashsale.types";
import {
  calcPercentOff,
  formatRp,
  getPromoItems,
  groupPromoItems,
  isPromoStockInactive,
  isPublished,
  toNumSafe,
} from "../../../utils/flash-sale/table";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { message } from "antd";
import {
  getFlashSaleProductDetail,
  updateFlashSaleOrder,
} from "../../../api/flash-sale";

const ItemType = { ROW: "row" } as const;

type DraggableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  index: number;
  moveRow: (fromIndex: number, toIndex: number) => void;
  groups: ProductGroupRow[];
  onDrop: () => void;
};

const DraggableRow: React.FC<DraggableRowProps> = ({
  index,
  moveRow,
  groups,
  onDrop,
  className,
  style,
  ...restProps
}) => {
  const ref = React.useRef<HTMLTableRowElement>(null);

  const [{ isOver }, drop] = useDrop<
    { index: number },
    void,
    { isOver: boolean }
  >({
    accept: ItemType.ROW,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
    hover(item: { index: number }) {
      if (item.index !== index) {
        moveRow(item.index, index);
        item.index = index;
      }
    },
    drop: () => {
      onDrop();
    },
  });

  const [{ isDragging }, drag] = useDrag<
    { index: number },
    void,
    { isDragging: boolean }
  >({
    type: ItemType.ROW,
    item: { index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <tr
      ref={ref}
      className={className}
      style={{
        cursor: "move",
        opacity: isDragging ? 0.3 : 1,
        backgroundColor: isOver ? "#f5f5f5" : undefined,
        ...style,
      }}
      {...restProps}
    />
  );
};

const FlashSaleItemsTable: React.FC<{
  sale: FlashSaleRow;
  onRefresh?: () => void;
}> = ({ sale, onRefresh }) => {
  const [localGroups, setLocalGroups] = React.useState<ProductGroupRow[]>([]);
  const imageCache = React.useRef<
    Map<number, { productImage: string | null; variantImages: Map<number, string> }>
  >(new Map());

  const pickMediaUrl = (medias?: any[]) => {
    if (!Array.isArray(medias) || medias.length === 0) return null;
    const main = medias.find((m: any) => Number(m?.type ?? 0) === 1);
    return (main?.url ?? medias[0]?.url ?? null) as string | null;
  };

  const resolveProductImage = (product: any) => {
    return (
      pickMediaUrl(product?.medias) ||
      pickMediaUrl(product?.media) ||
      product?.image_url ||
      product?.image ||
      product?.path ||
      null
    );
  };

  const resolveVariantImage = (variant: any, product: any) => {
    return (
      pickMediaUrl(variant?.medias) ||
      pickMediaUrl(variant?.media) ||
      variant?.image_url ||
      variant?.image ||
      resolveProductImage(product) ||
      null
    );
  };

  const applyCachedImages = React.useCallback(
    (productId: number) => {
      const cached = imageCache.current.get(productId);
      if (!cached) return;
      setLocalGroups((prev) =>
        prev.map((group) => {
          if (Number(group.productId ?? 0) !== productId) return group;
          const nextVariants = group.variants.map((v) => {
            if (v.image) return v;
            const vid = Number(v.id ?? 0);
            const img = cached.variantImages.get(vid);
            return img ? { ...v, image: img } : v;
          });
          return {
            ...group,
            image: group.image || cached.productImage || null,
            variants: nextVariants,
          };
        }),
      );
    },
    [],
  );

  const fetchProductImages = React.useCallback(
    async (productId: number) => {
      if (!productId) return;
      if (imageCache.current.has(productId)) {
        applyCachedImages(productId);
        return;
      }
      try {
        const resp: any = await getFlashSaleProductDetail(productId);
        const product = resp?.data?.serve ?? {};
        const productImage = resolveProductImage(product);
        const variantImages = new Map<number, string>();
        const rows = Array.isArray(product?.variants) ? product.variants : [];
        rows.forEach((v: any) => {
          const vid = Number(
            v?.id ?? v?.product_variant_id ?? v?.variant_id ?? 0,
          );
          if (!vid) return;
          const img = resolveVariantImage(v, product);
          if (img) variantImages.set(vid, img);
        });
        imageCache.current.set(productId, {
          productImage: productImage ?? null,
          variantImages,
        });
        applyCachedImages(productId);
      } catch {
        // silent: image enrichment is best-effort
      }
    },
    [applyCachedImages],
  );

  React.useEffect(() => {
    const items = getPromoItems(sale);
    const groups = groupPromoItems(items);
    setLocalGroups(groups);
  }, [sale]);

  React.useEffect(() => {
    if (!localGroups.length) return;
    const needsEnrich = new Set<number>();
    localGroups.forEach((group) => {
      const pid = Number(group.productId ?? 0);
      if (!pid) return;
      const missingGroupImage = !group.image;
      const missingVariantImage = group.variants.some((v) => !v.image);
      if ((missingGroupImage || missingVariantImage) && !imageCache.current.has(pid)) {
        needsEnrich.add(pid);
      }
    });
    if (!needsEnrich.size) return;
    needsEnrich.forEach((pid) => {
      fetchProductImages(pid);
    });
  }, [localGroups, fetchProductImages]);

  const moveRow = React.useCallback((fromIndex: number, toIndex: number) => {
    setLocalGroups((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const handleDrop = async () => {
    try {
      const updates: { id: number; order: number }[] = [];
      let currentOrder = 0;

      localGroups.forEach((group) => {
        if (group.variants && group.variants.length > 0) {
          group.variants.forEach((v) => {
            if (v.pivotId != null) {
              updates.push({
                id: Number(v.pivotId),
                order: currentOrder++,
              });
            }
          });
        }
      });

      if (updates.length > 0) {
        await updateFlashSaleOrder(updates);
        message.success("Urutan produk berhasil diperbarui");
        if (onRefresh) onRefresh();
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Gagal memperbarui urutan");
    }
  };

  const cols: ColumnsType<FlashSaleItem> = [
    {
      title: (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ThunderboltOutlined />
          Produk/Varian
        </span>
      ),
      key: "variant",
      width: 320,
      render: (_: unknown, it) => {
        const label = String(it.label ?? it.sku ?? "-");
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                background: "#f2f2f2",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {it.image ? (
                <img
                  src={it.image}
                  alt={label}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </div>
            <span style={{ fontWeight: 600, color: "#262626", fontSize: 13 }}>
              {label}
            </span>
          </div>
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          <ThunderboltOutlined />
          <span>Harga Normal</span>
        </span>
      ),
      key: "basePrice",
      align: "right",
      width: 140,
      render: (_: unknown, it) => {
        const base = toNumSafe(it.basePrice, 0);
        return base ? (
          <span style={{ color: "#262626", fontWeight: 500 }}>
            {formatRp(base)}
          </span>
        ) : (
          <span style={{ color: "#d9d9d9" }}>-</span>
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          <FireOutlined />
          <span>Harga Flash Sale</span>
        </span>
      ),
      key: "after",
      align: "right",
      width: 160,
      render: (_: unknown, it) => {
        const base = toNumSafe(it.basePrice, 0);
        const flash = it.flashPrice;
        if (isPromoStockInactive(it.promoStock)) {
          return base ? (
            <span style={{ color: "#8c8c8c", textDecoration: "line-through" }}>
              {formatRp(base)}
            </span>
          ) : (
            <span style={{ color: "#d9d9d9" }}>-</span>
          );
        }
        return flash === null || flash === undefined ? (
          <span style={{ color: "#d9d9d9" }}>-</span>
        ) : (
          <span style={{ color: "#faad14", fontWeight: 700, fontSize: 14 }}>
            {formatRp(flash)}
          </span>
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <FireOutlined />
          <span>Diskon</span>
        </span>
      ),
      key: "discount",
      align: "center",
      width: 110,
      render: (_: unknown, it) => {
        const base = toNumSafe(it.basePrice, 0);
        const price = it.flashPrice;
        if (
          !base ||
          price === null ||
          price === undefined ||
          isPromoStockInactive(it.promoStock)
        )
          return <span style={{ color: "#d9d9d9" }}>-</span>;
        const pct = calcPercentOff(base, price);
        return pct === null ? (
          <span style={{ color: "#d9d9d9" }}>-</span>
        ) : (
          <Tag color="orange" style={{ fontWeight: 700, fontSize: 12 }}>
            -{pct}%
          </Tag>
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <ThunderboltOutlined />
          <span>Stok Asli</span>
        </span>
      ),
      key: "stock",
      align: "center",
      width: 110,
      render: (_: unknown, it) => {
        const stock = toNumSafe(it.baseStock, 0);
        return Number.isFinite(stock) ? (
          <Badge
            count={stock}
            showZero
            color={stock > 0 ? "#52c41a" : "#d9d9d9"}
            style={{ fontWeight: 600, fontSize: 12 }}
          />
        ) : (
          <span style={{ color: "#d9d9d9" }}>-</span>
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <FireOutlined />
          <span>Kuota Flash Sale</span>
        </span>
      ),
      key: "promoStock",
      align: "center",
      width: 140,
      render: (_: unknown, it) => {
        if (it.promoStock === null || it.promoStock === undefined)
          return <span style={{ color: "#d9d9d9" }}>-</span>;
        const stock = toNumSafe(it.promoStock, 0);
        return (
          <Badge
            count={stock}
            showZero
            color={stock > 0 ? "#faad14" : "#d9d9d9"}
            style={{ fontWeight: 600, fontSize: 12 }}
          />
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <CheckCircleOutlined />
          <span>Status</span>
        </span>
      ),
      key: "status",
      align: "center",
      width: 110,
      render: (_: unknown, it) => {
        const inactive =
          !isPublished(sale) || isPromoStockInactive(it.promoStock);
        return inactive ? (
          <Tag color="error">Nonaktif</Tag>
        ) : (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Aktif
          </Tag>
        );
      },
    },
  ];

  if (!localGroups.length) {
    return (
      <div
        style={{
          padding: 24,
          color: "#8c8c8c",
          textAlign: "center",
          background: "#fafafa",
        }}
      >
        Tidak ada item dalam flash sale ini
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "12px 16px",
        background: "#fafafa",
        borderRadius: 4,
        marginTop: 8,
      }}
    >
      <DndProvider backend={HTML5Backend}>
        <Table<ProductGroupRow>
          size="small"
          rowKey="key"
          dataSource={localGroups}
          pagination={false}
          bordered
          style={{ borderRadius: 6, overflow: "hidden" }}
          components={{
            body: {
              row: (props: any) => (
                <DraggableRow
                  {...props}
                  groups={localGroups}
                  moveRow={moveRow}
                  onDrop={handleDrop}
                />
              ),
            },
          }}
          onRow={(_, index) => ({ index }) as any}
          columns={[
            {
              title: (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <ThunderboltOutlined style={{ fontSize: 14 }} />
                  <span>Nama Produk</span>
                </span>
              ),
              dataIndex: "productName",
              key: "productName",
              render: (_: unknown, group) => (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 6,
                      background: "#f2f2f2",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {group.image ? (
                      <img
                        src={group.image}
                        alt={group.productName}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : null}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{group.productName}</div>
                  </div>
                </div>
              ),
            },
            {
              title: (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <ThunderboltOutlined style={{ fontSize: 14 }} />
                  <span>Harga Normal</span>
                </span>
              ),
              key: "base",
              width: 140,
              align: "right",
              render: () => null,
            },
            {
              title: (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <FireOutlined style={{ fontSize: 14 }} />
                  <span>Harga Flash Sale</span>
                </span>
              ),
              key: "flashPrice",
              width: 160,
              align: "right",
              render: () => null,
            },
            {
              title: (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <FireOutlined style={{ fontSize: 14 }} />
                  <span>Diskon</span>
                </span>
              ),
              key: "discount",
              width: 110,
              align: "center",
              render: () => null,
            },
            {
              title: (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <ThunderboltOutlined style={{ fontSize: 14 }} />
                  <span>Stok Asli</span>
                </span>
              ),
              key: "stock",
              width: 110,
              render: () => null,
            },
            {
              title: (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <FireOutlined style={{ fontSize: 14 }} />
                  <span>Kuota Flash Sale</span>
                </span>
              ),
              key: "promoStock",
              width: 140,
              align: "center",
              render: () => null,
            },
            {
              title: (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <CheckCircleOutlined style={{ fontSize: 14 }} />
                  <span>Status</span>
                </span>
              ),
              key: "status",
              width: 110,
              align: "center",
              render: () => null,
            },
          ]}
          expandable={{
            defaultExpandAllRows: false,
            expandedRowRender: (group) => (
              <div style={{ marginLeft: -8, marginRight: -8 }}>
                <Table<FlashSaleItem>
                  size="small"
                  columns={cols}
                  dataSource={group.variants}
                  pagination={false}
                  rowKey="__key"
                  showHeader={true}
                  bordered
                />
              </div>
            ),
          }}
        />
      </DndProvider>
    </div>
  );
};

export default FlashSaleItemsTable;
