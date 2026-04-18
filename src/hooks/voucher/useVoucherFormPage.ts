import { useEffect, useState } from "react";
import { message } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getVoucherList } from "../../api/voucher";
import {
  normalizeVoucherEntity,
  type VoucherNormalized,
} from "../../services/api/voucher/voucher.mapper";

export type VoucherFormData = VoucherNormalized;

export const useVoucherFormPageHooks = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<VoucherFormData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const stateVoucher = (location.state as any)?.voucher;
    if (stateVoucher) {
      setData(normalizeVoucherEntity(stateVoucher));
      return;
    }

    setLoading(true);
    getVoucherList({ page: 1, per_page: 1000 })
      .then((resp) => {
        const list = resp?.data?.serve?.data ?? resp?.data?.data ?? [];
        const found = list.find(
          (item: any) => String(normalizeVoucherEntity(item).id) === String(id),
        );
        if (!found) {
          message.error("Voucher tidak ditemukan.");
          setData(undefined);
        } else {
          setData(normalizeVoucherEntity(found));
        }
      })
      .catch((err) => {
        
        message.error("Gagal memuat voucher.");
      })
      .finally(() => setLoading(false));
  }, [id, location.state]);

  return {
    id,
    navigate,
    data,
    loading,
  };
};
