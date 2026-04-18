import { useState } from "react";
import { Button, Space, message, Modal, List, Typography, Tag } from "antd";
import api from "../../api/http";
import {
  sendAdminNotification,
  getTransactionNotifContent,
} from "../../services/api/notification.services";

interface BulkTransactionActionsProps {
  selectedTransactions: number[];
  onSelectionChange: (ids: number[]) => void;
  onRefresh: () => void;
  transactions?: any[]; // Added for notification data
}

export default function BulkTransactionActions({
  selectedTransactions,
  onSelectionChange,
  onRefresh,
  transactions,
}: BulkTransactionActionsProps) {
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingPrint, setLoadingPrint] = useState(false);
  const [loadingResi, setLoadingResi] = useState(false);

  const showPartialResultSummary = (
    title: string,
    successCount: number,
    failedItems: Array<{ id: number | string; reason: string }>,
  ) => {
    Modal.info({
      title: `${title} - Ringkasan`,
      width: 600,
      content: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Tag color="green">{successCount} Berhasil</Tag>
            {failedItems.length > 0 && (
              <Tag color="red">{failedItems.length} Gagal</Tag>
            )}
          </div>
          {failedItems.length > 0 && (
            <List
              header={<b>Daftar Gagal</b>}
              bordered
              dataSource={failedItems}
              size="small"
              renderItem={(item) => (
                <List.Item>
                  <Typography.Text type="danger">#{item.id}</Typography.Text>:{" "}
                  {item.reason}
                </List.Item>
              )}
            />
          )}
        </div>
      ),
    });
  };

  const handleBulkConfirm = () => {
    if (selectedTransactions.length === 0) {
      message.warning("Pilih transaksi terlebih dahulu");
      return;
    }

    Modal.confirm({
      title: "Konfirmasi Bulk Confirm",
      content: `Yakin ingin mengkonfirmasi ${selectedTransactions.length} transaksi?`,
      okText: "Ya, Konfirmasi",
      cancelText: "Batal",
      onOk: async () => {
        setLoadingConfirm(true);
        try {
          // Use the new bulk-confirm endpoint
          const { data } = await api.post("/admin/transactions/bulk-confirm", {
            transactionIds: selectedTransactions,
          });

          const successIds = data?.success || [];
          const failedItems = data?.failed || [];

          // ✅ Send Notifications for each successful transaction
          if (transactions && successIds.length > 0) {
            const notifications = successIds.map((id: number) => {
              const tx = transactions.find((t) => t.id === id);
              if (tx?.user?.id) {
                const content = getTransactionNotifContent(
                  "confirm",
                  tx.transactionNumber,
                );
                return sendAdminNotification({
                  user_id: tx.user.id,
                  title: content.title,
                  message: content.message,
                  data: {
                    type: content.type,
                    link: `/orders/detail/${tx.transactionNumber}`,
                  },
                });
              }
              return Promise.resolve();
            });
            await Promise.allSettled(notifications);
          }

          if (failedItems.length > 0) {
            showPartialResultSummary(
              "Bulk Confirm",
              successIds.length,
              failedItems,
            );
          } else {
            message.success(
              `${successIds.length} transaksi berhasil dikonfirmasi`,
            );
          }

          onSelectionChange([]);
          onRefresh();
        } catch (e: any) {
          message.error(
            e?.response?.data?.message ||
              e.message ||
              "Gagal bulk confirm transaksi",
          );
        } finally {
          setLoadingConfirm(false);
        }
      },
    });
  };

  const handleBulkCancel = () => {
    if (selectedTransactions.length === 0) {
      message.warning("Pilih transaksi terlebih dahulu");
      return;
    }

    Modal.confirm({
      title: "Konfirmasi Bulk Cancel",
      content: `Yakin ingin membatalkan ${selectedTransactions.length} transaksi?`,
      okText: "Ya, Cancel",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: async () => {
        setLoadingCancel(true);
        try {
          const { data } = await api.put("/admin/transactions/cancel", {
            transactionIds: selectedTransactions,
          });

          const successIds = data?.success || (Array.isArray(data) ? data : []);
          const failedItems = data?.failed || [];

          // ✅ Send Notifications for each successful transaction
          if (transactions && successIds.length > 0) {
            const notifications = successIds.map((id: number) => {
              const tx = transactions.find((t) => t.id === id);
              if (tx?.user?.id) {
                const content = getTransactionNotifContent(
                  "cancel",
                  tx.transactionNumber,
                );
                return sendAdminNotification({
                  user_id: tx.user.id,
                  title: content.title,
                  message: content.message,
                  data: {
                    type: content.type,
                    link: `/orders/detail/${tx.transactionNumber}`,
                  },
                });
              }
              return Promise.resolve();
            });
            await Promise.allSettled(notifications);
          }

          if (failedItems.length > 0) {
            showPartialResultSummary(
              "Bulk Cancel",
              successIds.length,
              failedItems,
            );
          } else {
            message.success(
              `${successIds.length} transaksi berhasil dibatalkan`,
            );
          }

          onSelectionChange([]);
          onRefresh();
        } catch (e: any) {
          message.error(
            e?.response?.data?.message ||
              e.message ||
              "Gagal bulk cancel transaksi",
          );
        } finally {
          setLoadingCancel(false);
        }
      },
    });
  };

  const handleBulkGenerateResi = () => {
    if (selectedTransactions.length === 0) {
      message.warning("Pilih transaksi terlebih dahulu");
      return;
    }

    Modal.confirm({
      title: "Konfirmasi Bulk Generate Resi",
      content: `Yakin ingin men-generate resi untuk ${selectedTransactions.length} transaksi?`,
      okText: "Ya, Generate",
      cancelText: "Batal",
      onOk: async () => {
        setLoadingResi(true);
        try {
          const { data } = await api.post(
            "/admin/transactions/bulk-generate-receipt",
            {
              transactionIds: selectedTransactions,
            },
          );

          const successIds = data?.success || [];
          const failedItems = data?.failed || [];

          // ✅ Send Notifications for each successful transaction
          if (transactions && successIds.length > 0) {
            const notifications = successIds.map((id: number) => {
              const tx = transactions.find((t) => t.id === id);
              if (tx?.user?.id) {
                const content = getTransactionNotifContent(
                  "resi",
                  tx.transactionNumber,
                );
                return sendAdminNotification({
                  user_id: tx.user.id,
                  title: content.title,
                  message: content.message,
                  data: {
                    type: content.type,
                    link: `/orders/detail/${tx.transactionNumber}`,
                  },
                });
              }
              return Promise.resolve();
            });
            await Promise.allSettled(notifications);
          }

          if (failedItems.length > 0) {
            showPartialResultSummary(
              "Bulk Generate Resi",
              successIds.length,
              failedItems,
            );
          } else {
            message.success(
              `Berhasil men-generate resi untuk ${successIds.length} transaksi`,
            );
          }

          onSelectionChange([]);
          onRefresh();
        } catch (e: any) {
          message.error(
            e?.response?.data?.message ||
              e.message ||
              "Gagal bulk generate resi transaksi",
          );
        } finally {
          setLoadingResi(false);
        }
      },
    });
  };

  const handleBulkPrint = async () => {
    if (selectedTransactions.length === 0) {
      message.warning("Pilih transaksi terlebih dahulu");
      return;
    }

    setLoadingPrint(true);
    try {
      // Use the backend endpoint for bulk labels
      const { data } = await api.post("/admin/transactions/bulk-print-labels", {
        transactionIds: selectedTransactions,
      });

      const successItems = data?.success || []; // Array of { id, label_url }
      const failedItems = data?.failed || [];

      if (successItems.length > 0) {
        // Attempt to open each labels in a new tab
        // Note: Browsers might block multiple popups.
        // Showing a modal with links is safer if there are many.
        if (successItems.length === 1) {
          window.open(successItems[0].label_url, "_blank");
        } else {
          Modal.success({
            title: "Cetak Label Berhasil",
            content: (
              <div>
                <p>{successItems.length} label siap dicetak:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {successItems.map((item: any) => (
                    <Button
                      key={item.id}
                      size="small"
                      onClick={() => window.open(item.label_url, "_blank")}
                    >
                      Cetak #{item.id}
                    </Button>
                  ))}
                </div>
              </div>
            ),
          });
        }
      }

      if (failedItems.length > 0) {
        showPartialResultSummary(
          "Bulk Print Label",
          successItems.length,
          failedItems,
        );
      } else if (successItems.length === 0) {
        message.warning("Tidak ada label yang bisa dicetak");
      }
    } catch (e: any) {
      message.error(
        e?.response?.data?.message || e.message || "Gagal print label massal",
      );
    } finally {
      setLoadingPrint(false);
    }
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  if (selectedTransactions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        backgroundColor: "#f6ffed",
        border: "1px solid #b7eb8f",
        borderRadius: "6px",
        marginBottom: "16px",
      }}
    >
      <div style={{ fontWeight: 500 }}>
        {selectedTransactions.length} transaksi dipilih
      </div>
      <Space>
        <Button onClick={handleClearSelection}>Clear Selection</Button>
        <Button
          loading={loadingResi}
          onClick={handleBulkGenerateResi}
          style={{ backgroundColor: "#1890ff", color: "white" }}
        >
          Bulk Generate Resi
        </Button>
        <Button loading={loadingPrint} onClick={handleBulkPrint}>
          Bulk Print Label
        </Button>
        <Button
          type="primary"
          loading={loadingConfirm}
          onClick={handleBulkConfirm}
        >
          Bulk Confirm
        </Button>
        <Button danger loading={loadingCancel} onClick={handleBulkCancel}>
          Bulk Cancel
        </Button>
      </Space>
    </div>
  );
}
