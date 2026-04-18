import React from "react";
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Drawer,
  Input,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
  Spin,
  Divider,
  Grid,
} from "antd";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import { FilterOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import http from "../../api/http";
import helper, { RoleEnum, type RoleEnumType } from "../../utils/helper";

const { Title, Text } = Typography;

type StockMovementRow = {
  id: number | string;
  change: number;
  type: string;
  note?: string | null;
  createdAt?: string;
  created_at?: string;
  variant?: {
    id?: number | string;
    sku?: string;
    barcode?: string;
    product?: { name?: string };
  };
};

type ServeAny =
  | { data: StockMovementRow[]; meta?: any }
  | { data: StockMovementRow[]; currentPage?: any; perPage?: any; total?: any }
  | any;

type ListResponse = { data?: { serve: ServeAny; message?: string } };

function normalizeServe(serve: ServeAny) {
  const data: StockMovementRow[] = serve?.data ?? [];
  const meta = serve?.meta ?? serve ?? {};
  const currentPage = Number(meta.currentPage ?? meta.current_page ?? 1);
  const perPage = Number(meta.perPage ?? meta.per_page ?? 20);
  const total = Number(meta.total ?? 0);
  return { data, currentPage, perPage, total };
}

function fmtDate(row: StockMovementRow) {
  const raw = row.createdAt ?? row.created_at;
  if (!raw) return "-";
  const d = dayjs(raw);
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : String(raw);
}

/**
 * NOTE parser:
 * support:
 * - "ReceivedBy: B | ReceivedRole: FINANCE"
 * - "received_by_name: Abby | received_by_role: Administrator | received_at: ..."
 */
function parseMeta(note?: string | null) {
  const raw = String(note ?? "");
  const parts = raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");

  const map: Record<string, string> = {};
  for (const p of parts) {
    const idx = p.indexOf(":");
    if (idx <= 0) continue;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    map[normalizeKey(k)] = v;
  }

  const pickAny = (keys: string[]) => {
    for (const k of keys) {
      const v = map[normalizeKey(k)];
      if (v) return v;
    }
    return "";
  };

  return {
    from: pickAny(["From"]),
    to: pickAny(["To"]),
    sentBy: pickAny(["SentBy", "sent_by_name", "sent_by"]),
    sentRole: pickAny(["SentRole", "sent_by_role", "sent_role"]),
    receivedBy: pickAny(["ReceivedBy", "received_by_name", "received_by"]),
    receivedRole: pickAny(["ReceivedRole", "received_by_role", "received_role"]),
    receivedAt: pickAny(["ReceivedAt", "received_at"]),
  };
}

// ✅ ambil tipe UI dari note (kalau backend type masih adjustment)
function getUiType(row: StockMovementRow) {
  const note = String(row?.note ?? "").toLowerCase();
  if (note.includes("transfer_out")) return "transfer_out";
  if (note.includes("transfer_in")) return "transfer_in";
  return String(row?.type ?? "adjustment").toLowerCase();
}

const uiTypeLabel: Record<string, string> = {
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  adjustment: "Adjustment",
};

// Role yang boleh klik "Terima"
const ALLOWED_RECEIVE_ROLES: RoleEnumType[] = [
  RoleEnum.ADMINISTRATOR,
  RoleEnum.GUDANG,
  RoleEnum.CASHIERNGUDANG,
  RoleEnum.FINANCE,
  RoleEnum.CASHIER,
];

/** upsert token "Key: Value" di note pipe-separated */
function upsertPipeKV(note: string, key: string, value: string) {
  const parts = String(note ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const keyNorm = norm(key);

  let replaced = false;
  const next = parts.map((p) => {
    const idx = p.indexOf(":");
    if (idx <= 0) return p;
    const k = p.slice(0, idx).trim();
    if (norm(k) === keyNorm) {
      replaced = true;
      return `${key}: ${value}`;
    }
    return p;
  });

  if (!replaced) next.push(`${key}: ${value}`);
  return next.join(" | ");
}

export default function StockMovementListPage() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const nav = useNavigate();

  const TAB_ALL = "all";
  const tabs = [
    { key: TAB_ALL, label: "Semua" },
    { key: "transfer_in", label: "Transfer In" },
    { key: "transfer_out", label: "Transfer Out" },
  ] as const;

  const session = helper.isAuthenticated();

  const myName =
    session?.data?.name ??
    session?.data?.user?.name ??
    session?.data?.admin?.name ??
    "Unknown";

  const myRoleId = session?.data?.role as RoleEnumType | undefined;
  const myRoleName =
    session?.data?.role_name ??
    session?.data?.roleName ??
    (myRoleId ? String(myRoleId) : "");

  const canReceiveByRole = helper.hasAnyPermission(myRoleId, ALLOWED_RECEIVE_ROLES);

  const [activeTab, setActiveTab] = React.useState<string>(TAB_ALL);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<{
    productId?: string;
    variantId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  const [rows, setRows] = React.useState<StockMovementRow[]>([]);
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [receivingId, setReceivingId] = React.useState<string | number | null>(null);

  // ===== Detail Drawer (klik #SM-x) =====
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detail, setDetail] = React.useState<StockMovementRow | null>(null);

  const openDetail = async (row: StockMovementRow) => {
    setDetailOpen(true);
    setDetail(row); // tampil cepat dari row list
    setDetailLoading(true);
    try {
      const resp = await http.get(`/admin/stock-movements/${encodeURIComponent(String(row.id))}`);
      const serve = resp?.data?.serve ?? resp?.data?.data ?? null;
      if (serve?.id) setDetail(serve);
    } catch (e: any) {
      // fallback: tetap pakai data list
    } finally {
      setDetailLoading(false);
    }
  };

  // tabTotals dihitung client-side dari rows page aktif
  const tabTotals = React.useMemo(() => {
    const base = { [TAB_ALL]: rows.length, transfer_in: 0, transfer_out: 0 };
    for (const r of rows) {
      const t = getUiType(r);
      if (t === "transfer_in") base.transfer_in += 1;
      if (t === "transfer_out") base.transfer_out += 1;
    }
    return base;
  }, [rows]);

  const fetchList = async (page?: TablePaginationConfig) => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(page?.current ?? pagination.current ?? 1));
      sp.set("per_page", String(page?.pageSize ?? pagination.pageSize ?? 20));

      if (filters.productId) sp.set("product_id", filters.productId);
      if (filters.variantId) sp.set("variant_id", filters.variantId);
      if (filters.dateFrom) sp.set("date_from", filters.dateFrom);
      if (filters.dateTo) sp.set("date_to", filters.dateTo);

      const resp = (await http.get(`/admin/stock-movements?${sp.toString()}`)) as ListResponse;
      const serve = resp?.data?.serve;

      const norm = normalizeServe(serve);

      setRows(norm.data);
      setPagination({
        current: norm.currentPage,
        pageSize: norm.perPage,
        total: norm.total,
      });
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal load stock movements");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchList(pagination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange: TableProps<StockMovementRow>["onChange"] = (page) => {
    fetchList(page as TablePaginationConfig);
  };

  // Search client-side (page aktif)
  const searchedRows = React.useMemo(() => {
    if (!q.trim()) return rows;
    const k = q.toLowerCase();
    return rows.filter((r) => {
      const ref1 = `#sm-${r.id}`.toLowerCase();
      const ref2 = `sm-${r.id}`.toLowerCase();
      const p = (r.variant?.product?.name ?? "").toLowerCase();
      const sku = (r.variant?.sku ?? "").toLowerCase();
      const note = (r.note ?? "").toLowerCase();
      return ref1.includes(k) || ref2.includes(k) || p.includes(k) || sku.includes(k) || note.includes(k);
    });
  }, [rows, q]);

  // Filter tab transfer_in/out berdasarkan note (client-side)
  const displayRows = React.useMemo(() => {
    if (activeTab === TAB_ALL) return searchedRows;
    return searchedRows.filter((r) => getUiType(r) === activeTab);
  }, [searchedRows, activeTab]);

  const optimisticMarkReceived = (rowId: string | number) => {
    const nowIso = new Date().toISOString();

    const apply = (r: StockMovementRow) => {
      let nextNote = String(r.note ?? "");
      nextNote = upsertPipeKV(nextNote, "ReceivedBy", String(myName));
      if (myRoleName) nextNote = upsertPipeKV(nextNote, "ReceivedRole", String(myRoleName));
      nextNote = upsertPipeKV(nextNote, "ReceivedAt", nowIso);
      return { ...r, note: nextNote };
    };

    setRows((prev) => prev.map((r) => (String(r.id) === String(rowId) ? apply(r) : r)));
    setDetail((prev) => (prev && String(prev.id) === String(rowId) ? apply(prev) : prev));
  };

  const handleReceive = async (row: StockMovementRow) => {
    setReceivingId(row.id);

    const oldNote = row.note;
    optimisticMarkReceived(row.id);

    try {
      const resp = await http.put(`/admin/stock-movements/${encodeURIComponent(String(row.id))}/receive`);

      const updated = resp?.data?.serve ?? resp?.data?.data ?? null;
      if (updated?.id) {
        setRows((prev) => prev.map((r) => (String(r.id) === String(updated.id) ? { ...r, ...updated } : r)));
        setDetail((prev) => (prev && String(prev.id) === String(updated.id) ? { ...prev, ...updated } : prev));
      }

      message.success("Berhasil diterima");
      fetchList(pagination);
    } catch (e: any) {
      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(row.id) ? { ...r, note: oldNote ?? r.note } : r))
      );
      setDetail((prev) =>
        prev && String(prev.id) === String(row.id) ? { ...prev, note: oldNote ?? prev.note } : prev
      );
      message.error(e?.response?.data?.message ?? "Gagal terima");
    } finally {
      setReceivingId(null);
    }
  };

  // ✅ NOTE di tabel: hanya Dari→Ke dan Diterima
  const renderNoteCell = (row: StockMovementRow) => {
    const meta = parseMeta(row.note);

    return (
      <div style={{ lineHeight: 1.25 }}>
        <Text type="secondary" style={{ display: "block" }}>
          Dari: {meta.from || "-"} → Ke: {meta.to || "-"}
        </Text>

        <Text type="secondary" style={{ display: "block", marginTop: 2 }}>
          Diterima:{" "}
          {meta.receivedBy
            ? `${meta.receivedBy}${meta.receivedRole ? ` (${meta.receivedRole})` : ""}`
            : "-"}
        </Text>
      </div>
    );
  };

  const columns: ColumnsType<StockMovementRow> = [
    {
      title: "Reference",
      width: 220,
      render: (_v, r) => (
        // ✅ hanya #SM-1, tanpa produk di bawahnya
        <Button
          type="link"
          style={{ padding: 0, height: "auto", fontWeight: 700 }}
          onClick={() => openDetail(r)}
        >
          {`#SM-${r.id}`}
        </Button>
      ),
    },
    {
      title: "Type",
      width: 140,
      render: (_v, r) => {
        const t = getUiType(r);
        return <Tag>{uiTypeLabel[t] ?? t}</Tag>;
      },
    },
    { title: "Created Date", width: 160, render: (_v, r) => fmtDate(r) },
    { title: "Change", dataIndex: "change", width: 90 },

    {
      title: "Diterima Oleh",
      width: 220,
      render: (_v, r) => {
        const meta = parseMeta(r.note);
        const receivedText = meta.receivedBy
          ? `${meta.receivedBy}${meta.receivedRole ? ` (${meta.receivedRole})` : ""}`
          : "";

        if (receivedText) return <Text>{receivedText}</Text>;
        if (!canReceiveByRole) return <Text type="secondary">-</Text>;

        return (
          <Button
            size="small"
            type="primary"
            ghost
            loading={receivingId === r.id}
            onClick={() => handleReceive(r)}
          >
            Terima
          </Button>
        );
      },
    },

    {
      title: "Note",
      render: (_v, r) => renderNoteCell(r),
    },
  ];

  // ===== Drawer detail content =====
  const detailMeta = React.useMemo(() => parseMeta(detail?.note), [detail?.note]);
  const detailType = detail ? getUiType(detail) : "";
  const detailStatus = detailMeta.receivedBy ? "Diterima" : "Menunggu Diterima";
  const detailReceivedAtFmt =
    detailMeta.receivedAt && dayjs(detailMeta.receivedAt).isValid()
      ? dayjs(detailMeta.receivedAt).format("DD/MM/YYYY HH:mm")
      : detailMeta.receivedAt
      ? String(detailMeta.receivedAt)
      : "-";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          Stock Movement
        </Title>

        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => nav("/stock-movement/adjust")}>
            Tambah Stock Movement
          </Button>
        </Space>
      </div>

      <Card style={{ marginTop: 12 }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {isMobile ? (
            <>
              <Space>
                <Input
                  style={{ width: "100%" }}
                  placeholder="Cari SM / produk / SKU / note"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  allowClear
                />
                <Button icon={<FilterOutlined />} onClick={() => setDrawerOpen(true)} />
                <Button icon={<ReloadOutlined />} loading={loading} onClick={() => fetchList(pagination)} />
              </Space>

              <Tabs
                activeKey={activeTab}
                onChange={(k) => setActiveTab(k)}
                items={tabs.map((t) => ({
                  key: t.key,
                  label: (
                    <Space size={6}>
                      <span>{t.label}</span>
                      <Badge count={tabTotals[t.key] ?? 0} showZero />
                    </Space>
                  ),
                }))}
              />
            </>
          ) : (
            <>
              <Tabs
                activeKey={activeTab}
                onChange={(k) => setActiveTab(k)}
                items={tabs.map((t) => ({
                  key: t.key,
                  label: (
                    <Space size={6}>
                      <span>{t.label}</span>
                      <Badge count={tabTotals[t.key] ?? 0} showZero />
                    </Space>
                  ),
                }))}
              />

              <Space>
                <Input
                  style={{ width: 320 }}
                  placeholder="Cari SM / produk / SKU / note"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  allowClear
                />
                <Button icon={<FilterOutlined />} onClick={() => setDrawerOpen(true)} />
                <Button icon={<ReloadOutlined />} loading={loading} onClick={() => fetchList(pagination)} />
              </Space>
            </>
          )}
        </div>

        <div className="overflow-x-auto md:overflow-visible">
          <Table<StockMovementRow>
            style={{ marginTop: 8 }}
            columns={columns}
            dataSource={displayRows}
            rowKey={(r) => String(r.id)}
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      {/* Filter Drawer */}
      <Drawer
        title="Filter"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={360}
        footer={
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                setFilters({});
                setDrawerOpen(false);
                fetchList({ ...pagination, current: 1 });
              }}
            >
              Reset
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setDrawerOpen(false);
                fetchList({ ...pagination, current: 1 });
              }}
            >
              Apply
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="product_id (opsional)"
            value={filters.productId}
            onChange={(e) => setFilters((p) => ({ ...p, productId: e.target.value }))}
            allowClear
          />
          <Input
            placeholder="variant_id (opsional)"
            value={filters.variantId}
            onChange={(e) => setFilters((p) => ({ ...p, variantId: e.target.value }))}
            allowClear
          />
          <DatePicker.RangePicker
            style={{ width: "100%" }}
            onChange={(val) => {
              const dateFrom = val?.[0] ? val[0].format("YYYY-MM-DD") : "";
              const dateTo = val?.[1] ? val[1].format("YYYY-MM-DD") : "";
              setFilters((p) => ({
                ...p,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
              }));
            }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Catatan: tab Transfer In/Out & search masih client-side (page aktif). Kalau mau server-side,
            backend perlu dukung `type=transfer_in/out` dan `q`.
          </Text>
        </Space>
      </Drawer>

      {/* Detail Drawer (klik #SM-x) */}
      <Drawer
        title={
          <Space size={10}>
            <Text strong>{detail ? `#SM-${detail.id}` : "Detail"}</Text>
            {detailLoading && <Spin size="small" />}
          </Space>
        }
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={780}
        extra={
          detail && !detailMeta.receivedBy && canReceiveByRole ? (
            <Button type="primary" loading={receivingId === detail.id} onClick={() => handleReceive(detail)}>
              Terima
            </Button>
          ) : null
        }
      >
        {!detail ? (
          <Text type="secondary">Tidak ada data.</Text>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
              <Card title="Umum">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <Text type="secondary">Produk</Text>
                    <div>
                      <Text strong>{detail.variant?.product?.name ?? "-"}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {detail.variant?.sku ? `SKU: ${detail.variant.sku}` : "SKU: -"}
                    </Text>
                  </div>

                  <Divider style={{ margin: "8px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text type="secondary">Jumlah</Text>
                    <Text strong>{detail.change}</Text>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text type="secondary">Tanggal</Text>
                    <Text>{fmtDate(detail)}</Text>
                  </div>
                </div>
              </Card>

              <Card title="Rincian">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <Text type="secondary">Status</Text>
                    <div>
                      <Text strong>{detailStatus}</Text>
                    </div>
                  </div>

                  <div>
                    <Text type="secondary">Jenis Transfer</Text>
                    <div>
                      <Tag>{uiTypeLabel[detailType] ?? detailType}</Tag>
                    </div>
                  </div>

                  <div>
                    <Text type="secondary">Dari</Text>
                    <div>
                      <Text>{detailMeta.from || "-"}</Text>
                    </div>
                  </div>

                  <div>
                    <Text type="secondary">Ke</Text>
                    <div>
                      <Text>{detailMeta.to || "-"}</Text>
                    </div>
                  </div>

                  <div>
                    <Text type="secondary">Diterima Oleh</Text>
                    <div>
                      <Text>
                        {detailMeta.receivedBy
                          ? `${detailMeta.receivedBy}${detailMeta.receivedRole ? ` (${detailMeta.receivedRole})` : ""}`
                          : "-"}
                      </Text>
                    </div>
                  </div>

                  <div>
                    <Text type="secondary">Diterima Pada</Text>
                    <div>
                      <Text>{detailMeta.receivedBy ? detailReceivedAtFmt : "-"}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ height: 12 }} />

            {/* ✅ Catatan rapih: hanya Dari→Ke dan Diterima */}
            <Card title="Catatan">
              <Text type="secondary" style={{ display: "block" }}>
                Dari: {detailMeta.from || "-"} → Ke: {detailMeta.to || "-"}
              </Text>
              <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                Diterima:{" "}
                {detailMeta.receivedBy
                  ? `${detailMeta.receivedBy}${detailMeta.receivedRole ? ` (${detailMeta.receivedRole})` : ""}`
                  : "-"}
              </Text>
            </Card>
          </>
        )}
      </Drawer>
    </div>
  );
}
