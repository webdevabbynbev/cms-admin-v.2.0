import api from "../../api/http";

export interface NotificationPayload {
  user_id: number;
  title: string;
  message: string;
  data: {
    type: string;
    link: string;
  };
}

/**
 * Service to send custom notifications to users via Admin API
 */
export const sendAdminNotification = async (payload: NotificationPayload) => {
  try {
    await api.post("/admin/notifications", payload);
    
  } catch (error) {
    
    // We don't throw here to avoid breaking the main transaction flow
  }
};

/**
 * Helper to determine message content based on transaction action
 */
export const getTransactionNotifContent = (
  action: "confirm" | "cancel" | "resi",
  transactionNumber: string,
) => {
  switch (action) {
    case "confirm":
      return {
        title: "Pesanan Dikonfirmasi",
        message: `Pesanan ${transactionNumber} Anda telah dikonfirmasi dan sedang diproses.`,
        type: "order_confirmed",
      };
    case "cancel":
      return {
        title: "Pesanan Dibatalkan",
        message: `Pesanan ${transactionNumber} Anda telah dibatalkan. Silakan cek detail untuk informasi lebih lanjut.`,
        type: "order_cancelled",
      };
    case "resi":
      return {
        title: "Pesanan Sedang Dikirim",
        message: `Resi untuk pesanan ${transactionNumber} telah diterbitkan. Pesanan Anda segera sampai!`,
        type: "order_shipped",
      };
    default:
      return {
        title: "Update Pesanan",
        message: `Ada pembaruan status pada pesanan ${transactionNumber}.`,
        type: "order_update",
      };
  }
};
