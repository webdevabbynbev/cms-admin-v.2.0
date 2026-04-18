import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Button,
  Card,
  Modal,
  Space,
  Table,
  Tag,
  message,
  Typography,
  Select,
  Input,
  Checkbox,
  Divider,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import api from "../../api/http";

import { pdf } from "@react-pdf/renderer";
import JsBarcode from "jsbarcode";
import LabelPdf from "./LabelPdf";
import InvoicePdf from "./InvoicePdf";
import BulkTransactionActions from "./BulkTransactionActions";
import {
  sendAdminNotification,
  getTransactionNotifContent,
} from "../../services/api/notification.services";
import { useSearchParams } from "react-router-dom";
import {
  STATUS_FILTER_OPTIONS,
  money,
  formatDate,
  getTransactionStatusMeta,
} from "./transactionUtils";
import type { Tx } from "./transactionUtils";
import OrderManagementModal from "./OrderManagementModal";
import TransactionDetailModal from "./TransactionDetailModal";
import { getGiftAwareProductName } from "../../utils/b1g1GiftUtils";

function makeBarcodeDataUrl(text: string) {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, text, {
    format: "CODE128",
    displayValue: false,
    margin: 0,
    height: 50,
  });
  return canvas.toDataURL("image/png");
}

export default function TableTransaction() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Tx[]>([]);
  const [meta, setMeta] = useState<{
    total?: number;
    per_page?: number;
    current_page?: number;
  }>({});

  const page = Number(searchParams.get("page")) || 1;
  const perPage = Number(searchParams.get("per_page")) || 10;
  const searchQuery = searchParams.get("transaction_number") || "";
  const statusParam = searchParams.get("status") || "";
  const statusFilters = useMemo(
    () => (statusParam ? statusParam.split(",").filter(Boolean) : []),
    [statusParam],
  );
  const startDate = searchParams.get("start_date") || "";
  const endDate = searchParams.get("end_date") || "";

  const [managementModalVisible, setManagementModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>(
    [],
  );
  const { Search } = Input;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, per_page: perPage };
      if (statusFilters.length > 0) {
        params.transaction_status = statusFilters.join(",");
      }
      if (searchQuery.trim()) {
        params.transaction_number = searchQuery.trim();
      }
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const { data } = await api.get("/admin/transactions", { params });

      const serve = data?.serve;
      setRows(serve?.data || []);
      setMeta({
        total: serve?.total,
        per_page: serve?.per_page,
        current_page: serve?.current_page,
      });
    } catch (e: any) {
      message.error(
        e?.response?.data?.message || e.message || "Gagal ambil data transaksi",
      );
    } finally {
      setLoading(false);
    }
  }, [page, perPage, searchQuery, statusFilters, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSelectedTransactions([]);
  }, [page, perPage, statusFilters, searchQuery, startDate, endDate]);

  const fetchTracking = useCallback(async (id: number) => {
    setTrackingLoading(true);
    try {
      const { data } = await api.get(`/admin/transactions/${id}/tracking`);
      setTrackingData(data?.serve);
    } catch (e: any) {
      
      setTrackingData(null);
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (managementModalVisible && selectedTx) {
      const sh = selectedTx.shipments?.[0];
      const resi = sh?.resiNumber || (sh as any)?.resi_number;
      if (resi) {
        fetchTracking(selectedTx.id);
      } else {
        setTrackingData(null);
      }
    } else {
      setTrackingData(null);
    }
  }, [managementModalVisible, selectedTx, fetchTracking]);

  const confirmPaid = (transactionId: number) => {
    Modal.confirm({
      title: "Konfirmasi Pesanan",
      content: "Yakin pesanan ini sudah dicek dan mau diproses?",
      okText: "Ya, Konfirmasi",
      cancelText: "Batal",
      onOk: async () => {
        try {
          await api.put("/admin/transactions/confirm", {
            transaction_id: transactionId,
          });
          const tx = rows.find((r) => r.id === transactionId);
          if (tx?.user?.id) {
            const content = getTransactionNotifContent(
              "confirm",
              tx.transactionNumber,
            );
            await sendAdminNotification({
              user_id: tx.user.id,
              title: content.title,
              message: content.message,
              data: {
                type: content.type,
                link: `/orders/detail/${tx.transactionNumber}`,
              },
            });
          }
          message.success("Pesanan berhasil dikonfirmasi.");
          fetchData();
        } catch (e: any) {
          message.error(
            e?.response?.data?.message || e.message || "Gagal confirm pesanan",
          );
        }
      },
    });
  };

  const getBase64Logo = async (): Promise<string | null> => {
    try {
      const response = await fetch("/logoAbbyCombine.svg");
      const svgText = await response.text();
      // Convert SVG to PNG via canvas (react-pdf doesn't support SVG)
      return await new Promise<string>((resolve, reject) => {
        const img = new window.Image();
        const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 348;
          canvas.height = img.naturalHeight || 154;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to load SVG"));
        };
        img.src = url;
      });
    } catch {
      return null;
    }
  };

  const downloadOrPrintLabel = async (
    transactionId: number,
    mode: "download" | "print",
  ) => {
    try {
      const { data } = await api.get(`/admin/transactions/${transactionId}`);
      const tx = data?.serve;
      if (!tx) throw new Error("Detail transaksi kosong");

      const sh = tx?.shipments?.[0];
      const resi = sh?.resiNumber || sh?.resi_number;
      if (!resi) {
        throw new Error(
          "Resi belum ada. Silakan klik Generate Resi terlebih dahulu.",
        );
      }

      const barcodeSrc = makeBarcodeDataUrl(String(resi));
      const logoSrc = await getBase64Logo();

      const blob = await pdf(
        <LabelPdf
          tx={tx}
          barcodeSrc={barcodeSrc}
          logoSrc={logoSrc || undefined}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);

      if (mode === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = `label-${tx.transactionNumber || transactionId}.pdf`;
        a.click();
      } else {
        const w = window.open(url);
        setTimeout(() => w?.print(), 500);
      }

      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e: any) {
      message.error(
        e?.response?.data?.message || e.message || "Gagal buat/download label",
      );
    }
  };

  const downloadInvoice = async (
    transactionId: number,
    mode: "download" | "print",
  ) => {
    setLoading(true);
    try {
      let tx = null;

      // Optimization: if we already have the transaction details in selectedTx, use them
      if (selectedTx && selectedTx.id === transactionId) {
        tx = selectedTx;
      } else {
        const { data } = await api.get(`/admin/transactions/${transactionId}`);
        tx = data?.serve;
      }

      if (!tx) throw new Error("Detail transaksi kosong");

      const logoSrc = await getBase64Logo();

      const filename = `Invoice_${dayjs().format("DDMMYYYY_HHmm")}.pdf`;

      const blob = await pdf(
        <InvoicePdf
          tx={tx}
          logoSrc={logoSrc || undefined}
          title={filename.replace(".pdf", "")}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);

      if (mode === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
      } else {
        const w = window.open(url);
        if (w) w.document.title = filename;
        setTimeout(() => w?.print(), 500);
      }

      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e: any) {
      message.error(
        e?.response?.data?.message ||
          e.message ||
          "Gagal buat/download invoice",
      );
    } finally {
      setLoading(false);
    }
  };

  const generateResi = (transactionId: number) => {
    Modal.confirm({
      title: "Generate Resi",
      content: "Generate resi (Biteship) dan download label A6 sekarang?",
      okText: "Generate & Download",
      cancelText: "Batal",
      onOk: async () => {
        try {
          const res = await api.put("/admin/transactions/update-receipt", {
            transaction_id: transactionId,
          });
          message.success(
            res.data?.message || "Berhasil memproses resi/konfirmasi.",
          );
          fetchData();
        } catch (e: any) {
          message.error(
            e?.response?.data?.message || e.message || "Gagal generate resi",
          );
        }
      },
    });
  };

  const cancelTx = (transactionId: number) => {
    Modal.confirm({
      title: "Cancel Transaksi",
      content: "Yakin mau cancel transaksi ini?",
      okText: "Cancel",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: async () => {
        try {
          await api.put("/admin/transactions/cancel", {
            transactionIds: [transactionId],
          });
          const tx = rows.find((r) => r.id === transactionId);
          if (tx?.user?.id) {
            const content = getTransactionNotifContent(
              "cancel",
              tx.transactionNumber,
            );
            await sendAdminNotification({
              user_id: tx.user.id,
              title: content.title,
              message: content.message,
              data: {
                type: content.type,
                link: `/orders/detail/${tx.transactionNumber}`,
              },
            });
          }
          message.success("Transaksi dibatalkan.");
          fetchData();
        } catch (e: any) {
          message.error(
            e?.response?.data?.message || e.message || "Gagal cancel transaksi",
          );
        }
      },
    });
  };

  const showDetailModal = async (transactionId: number) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/transactions/${transactionId}`);
      const tx = data?.serve;
      if (!tx) throw new Error("Detail transaksi kosong");
      setSelectedTx(tx);
      setDetailModalVisible(true);
    } catch (e: any) {
      message.error(
        e?.response?.data?.message ||
          e.message ||
          "Gagal ambil detail transaksi",
      );
    } finally {
      setLoading(false);
    }
  };

  const showManagementModal = async (transactionId: number) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/transactions/${transactionId}`);
      const tx = data?.serve;
      if (!tx) throw new Error("Detail transaksi kosong");
      setSelectedTx(tx);
      setManagementModalVisible(true);
    } catch (e: any) {
      message.error(
        e?.response?.data?.message || e.message || "Gagal ambil detail",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Tx> = useMemo(
    () => [
      {
        title: () => {
          const currentPageIds = rows.map((r) => r.id);
          const selectedInCurrentPage = selectedTransactions.filter((id) =>
            currentPageIds.includes(id),
          );
          const isAllSelected =
            currentPageIds.length > 0 &&
            selectedInCurrentPage.length === currentPageIds.length;
          const isIndeterminate =
            selectedInCurrentPage.length > 0 &&
            selectedInCurrentPage.length < currentPageIds.length;

          return (
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={(e) => {
                if (e.target.checked) {
                  const newSelection = [
                    ...new Set([...selectedTransactions, ...currentPageIds]),
                  ];
                  setSelectedTransactions(newSelection);
                } else {
                  const newSelection = selectedTransactions.filter(
                    (id) => !currentPageIds.includes(id),
                  );
                  setSelectedTransactions(newSelection);
                }
              }}
            />
          );
        },
        key: "select",
        width: 50,
        render: (_, record) => (
          <Checkbox
            checked={selectedTransactions.includes(record.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedTransactions([...selectedTransactions, record.id]);
              } else {
                setSelectedTransactions(
                  selectedTransactions.filter((id) => id !== record.id),
                );
              }
            }}
          />
        ),
      },
      {
        title: "No. Transaksi",
        dataIndex: "transactionNumber",
        key: "transactionNumber",
        width: 180,
        render: (text: string, record: Tx) => (
          <Typography.Link
            onClick={() => showManagementModal(record.id)}
            style={{ fontWeight: 600 }}
          >
            {text || "-"}
          </Typography.Link>
        ),
      },
      {
        title: "Customer",
        key: "customer",
        width: 260,
        render: (_, r) => {
          const u = r.user;
          const name = [u?.firstName, u?.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          return (
            <div>
              <div style={{ fontWeight: 600 }}>
                {name || u?.fullName || u?.name || "-"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {u?.email || "-"}
              </div>
            </div>
          );
        },
      },
      {
        title: "Produk",
        key: "products",
        width: 320,
        render: (_, r) => {
          const items = (r.details || [])
            .map((d) => {
              return `${getGiftAwareProductName(d) || "Item"} x${d.qty}`;
            })
            .filter(Boolean);

          if (!items.length) return "-";

          const display = items.slice(0, 2).join(", ");
          const rest = items.length - 2;

          return (
            <div
              style={{
                maxWidth: 300,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={items.join("\n")}
            >
              {display}
              {rest > 0 ? ` +${rest} lainnya` : ""}
            </div>
          );
        },
      },
      {
        title: "Resi",
        key: "resi",
        width: 220,
        render: (_, r) => {
          const sh = r.shipments?.[0];
          const resi = sh?.resiNumber || (sh as any)?.resi_number;
          if (!resi) return "-";
          return <Typography.Text copyable>{resi}</Typography.Text>;
        },
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        width: 200,
        render: (v) => `Rp ${money(v)}`,
      },
      {
        title: "Status",
        dataIndex: "transactionStatus",
        key: "transactionStatus",
        width: 220,
        render: (_: any, r) => {
          const cfg = getTransactionStatusMeta(r);
          return <Tag color={cfg.color}>{cfg.text}</Tag>;
        },
      },
      {
        title: "Tanggal",
        key: "createdAt",
        width: 170,
        render: (_, r) => formatDate(r.createdAt || r.created_at),
      },
      {
        title: "Action",
        key: "action",
        width: 520,
        render: (_, r) => {
          const st = String(r.transactionStatus ?? "");
          const sh = r.shipments?.[0];
          const hasResi = Boolean(sh?.resiNumber || (sh as any)?.resi_number);

          if (st === "9") {
            return (
              <Space wrap>
                <Button onClick={() => showDetailModal(r.id)}>
                  Detail Transaksi
                </Button>
              </Space>
            );
          }

          if (st === "1") {
            return (
              <Space wrap>
                <Button type="primary" disabled>
                  Confirm
                </Button>
                <Button danger onClick={() => cancelTx(r.id)}>
                  Cancel
                </Button>
                <Button onClick={() => showDetailModal(r.id)}>
                  Detail Transaksi
                </Button>
              </Space>
            );
          }

          if (st === "2") {
            if (!hasResi) {
              return (
                <Space wrap>
                  <Button onClick={() => generateResi(r.id)}>
                    Generate Resi
                  </Button>
                  <Button onClick={() => showDetailModal(r.id)}>
                    Detail Transaksi
                  </Button>
                </Space>
              );
            }
            return (
              <Space wrap>
                <Button onClick={() => downloadOrPrintLabel(r.id, "download")}>
                  Download Label
                </Button>
                <Button onClick={() => downloadOrPrintLabel(r.id, "print")}>
                  Print
                </Button>
                <Button onClick={() => showDetailModal(r.id)}>
                  Detail Transaksi
                </Button>
              </Space>
            );
          }

          if (st === "5") {
            return (
              <Space wrap>
                <Button type="primary" onClick={() => confirmPaid(r.id)}>
                  Confirm
                </Button>
                <Button danger onClick={() => cancelTx(r.id)}>
                  Cancel
                </Button>
                <Button onClick={() => showDetailModal(r.id)}>
                  Detail Transaksi
                </Button>
              </Space>
            );
          }

          return (
            <Space wrap>
              {!hasResi && (
                <Button type="primary" onClick={() => generateResi(r.id)}>
                  Generate Resi
                </Button>
              )}
              <Button onClick={() => downloadOrPrintLabel(r.id, "download")}>
                Download Label
              </Button>
              <Button onClick={() => downloadOrPrintLabel(r.id, "print")}>
                Print
              </Button>
              <Button onClick={() => showDetailModal(r.id)}>
                Detail Transaksi
              </Button>
            </Space>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTransactions, rows],
  );

  return (
    <>
      {/* Filter Card */}
      <Card
        style={{
          marginTop: 16,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Space size={12} wrap>
              <div style={{ width: 250 }}>
                <Typography.Text
                  strong
                  style={{ display: "block", marginBottom: 4, fontSize: 12 }}
                >
                  Search Transaction
                </Typography.Text>
                <Search
                  placeholder="No. Transaksi..."
                  allowClear
                  defaultValue={searchQuery}
                  onSearch={(e) => {
                    setSearchParams((prev) => {
                      if (e.trim()) prev.set("transaction_number", e.trim());
                      else prev.delete("transaction_number");
                      prev.set("page", "1");
                      return prev;
                    });
                  }}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <Typography.Text
                  strong
                  style={{ display: "block", marginBottom: 4, fontSize: 12 }}
                >
                  Rentang Tanggal
                </Typography.Text>
                <DatePicker.RangePicker
                  style={{ width: 280 }}
                  value={
                    startDate && endDate
                      ? [dayjs(startDate), dayjs(endDate)]
                      : null
                  }
                  onChange={(dates) => {
                    setSearchParams((prev) => {
                      if (dates) {
                        prev.set("start_date", dates[0]!.format("YYYY-MM-DD"));
                        prev.set("end_date", dates[1]!.format("YYYY-MM-DD"));
                      } else {
                        prev.delete("start_date");
                        prev.delete("end_date");
                      }
                      prev.set("page", "1");
                      return prev;
                    });
                  }}
                />
              </div>
            </Space>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Show
              </Typography.Text>
              <Select<number>
                size="middle"
                onChange={(e) => {
                  setSearchParams((prev) => {
                    prev.set("per_page", String(e));
                    prev.set("page", "1");
                    return prev;
                  });
                }}
                style={{ width: 80 }}
                value={perPage}
              >
                <Select.Option value={10}>10</Select.Option>
                <Select.Option value={50}>50</Select.Option>
                <Select.Option value={100}>100</Select.Option>
                <Select.Option value={500}>500</Select.Option>
              </Select>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                entries
              </Typography.Text>
            </div>
          </div>

          <Divider style={{ margin: "4px 0" }} />

          <div>
            <Typography.Text
              strong
              style={{ display: "block", marginBottom: 8, fontSize: 12 }}
            >
              Filter Status:
            </Typography.Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {STATUS_FILTER_OPTIONS.map(({ value, label }) => {
                const isActive = statusFilters.includes(value);
                return (
                  <Tag
                    key={value}
                    style={{
                      cursor: "pointer",
                      margin: 0,
                      fontSize: 12,
                      padding: "4px 16px",
                      borderRadius: 20,
                      transition: "all 0.3s",
                      userSelect: "none",
                      border: isActive
                        ? "1px solid #9B3C6C"
                        : "1px solid #d9d9d9",
                      backgroundColor: isActive ? "#9B3C6C" : "white",
                      color: isActive ? "white" : "#595959",
                    }}
                    onClick={() => {
                      let next: string[];
                      if (statusFilters.includes(value)) {
                        next = statusFilters.filter((s) => s !== value);
                      } else {
                        next = [...statusFilters, value];
                      }
                      setSearchParams((prev) => {
                        if (next.length > 0) prev.set("status", next.join(","));
                        else prev.delete("status");
                        prev.set("page", "1");
                        return prev;
                      });
                    }}
                  >
                    {label}
                  </Tag>
                );
              })}
              {statusFilters.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setSearchParams((prev) => {
                      prev.delete("status");
                      prev.set("page", "1");
                      return prev;
                    });
                  }}
                  style={{ fontSize: 12, padding: 0, height: "auto" }}
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card
        style={{
          marginTop: 16,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            Transaction List
          </Typography.Title>
          <Button
            icon={<span className="anticon">🔄</span>}
            onClick={fetchData}
          >
            Refresh
          </Button>
        </div>
        <BulkTransactionActions
          selectedTransactions={selectedTransactions}
          onSelectionChange={setSelectedTransactions}
          onRefresh={fetchData}
          transactions={rows}
        />
        <div className="overflow-x-auto md:overflow-visible">
          <Table<Tx>
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            pagination={{
              current: page,
              pageSize: perPage,
              total: meta.total || 0,
              showSizeChanger: true,
              onChange: (p, ps) => {
                setSearchParams((prev) => {
                  prev.set("page", String(p));
                  prev.set("per_page", String(ps));
                  return prev;
                });
              },
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      {/* Management Modal */}
      <OrderManagementModal
        visible={managementModalVisible}
        onCancel={() => setManagementModalVisible(false)}
        selectedTx={selectedTx}
        downloadInvoice={downloadInvoice}
        setSearchParams={setSearchParams}
        trackingLoading={trackingLoading}
        trackingData={trackingData}
      />

      <TransactionDetailModal
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        selectedTx={selectedTx}
      />
    </>
  );
}
