// RamadanPrizeModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Button, Card, Select, Tag, theme } from "antd";
import {
  GiftOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { RamadanParticipantRecord, PrizeSelection } from "./ramadhanTypes";
import http from "../../../../api/http";

interface RamadanPrizeModalProps {
  prizeModalOpen: boolean;
  setPrizeModalOpen: (open: boolean) => void;
  current: RamadanParticipantRecord | false;
  prizeSelection: PrizeSelection;
  setPrizeSelection: React.Dispatch<React.SetStateAction<PrizeSelection>>;
  loading: boolean;
  handleSavePrize: () => void;
}

const RamadanPrizeModal: React.FC<RamadanPrizeModalProps> = ({
  prizeModalOpen,
  setPrizeModalOpen,
  current,
  prizeSelection,
  setPrizeSelection,
  loading,
  handleSavePrize,
}) => {
  const { token } = theme.useToken();
  const [giftOptions, setGiftOptions] = useState<
    { label: string; value: number | string }[]
  >([]);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftSearch, setGiftSearch] = useState("");
  const [giftPage, setGiftPage] = useState(1);
  const [giftHasMore, setGiftHasMore] = useState(true);
  const searchTimer = useRef<number | null>(null);
  const pageSize = 50;

  const normalizeGiftLabel = (gift: any) => {
    const rawName = gift?.name || gift?.product_name || "Gift";
    const brand = gift?.brand_name || "";
    const name =
      brand && !String(rawName).toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} - ${rawName}`
        : rawName;
    const sku = gift?.sku ? ` • SKU: ${gift.sku}` : "";
    const stock = Number(gift?.available_stock ?? gift?.stock ?? 0);
    const stockLabel = ` • Stok: ${Number.isFinite(stock) ? stock : 0}`;
    return `${name}${sku}${stockLabel}`;
  };

  const fetchGiftProducts = async ({
    page,
    search,
    append,
  }: {
    page: number;
    search: string;
    append: boolean;
  }) => {
    try {
      setGiftLoading(true);
      const resp = await http.get(
        `/admin/gift-products?page=${page}&limit=${pageSize}&search=${encodeURIComponent(
          search,
        )}&is_active=1`,
      );
      const rows = resp?.data?.data || resp?.data?.serve || [];
      const meta = resp?.data?.meta || {};
      const list = Array.isArray(rows) ? rows : [];
      const mapped = list.map((gift: any) => ({
        label: normalizeGiftLabel(gift),
        value: Number(gift?.id),
      }));

      setGiftOptions((prev) => (append ? [...prev, ...mapped] : mapped));

      const currentPage = Number(meta?.currentPage || meta?.page || page);
      const perPage = Number(meta?.perPage || meta?.limit || pageSize);
      const total = Number(meta?.total || 0);
      const loaded = currentPage * perPage;
      setGiftHasMore(total ? loaded < total : list.length >= perPage);
      setGiftPage(currentPage);
    } catch (err) {
      
      setGiftOptions((prev) => (append ? prev : []));
      setGiftHasMore(false);
    } finally {
      setGiftLoading(false);
    }
  };

  useEffect(() => {
    if (!prizeModalOpen) return;
    setGiftOptions([]);
    setGiftPage(1);
    setGiftHasMore(true);
    fetchGiftProducts({ page: 1, search: giftSearch, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prizeModalOpen]);

  useEffect(() => {
    if (!prizeModalOpen) return;
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setGiftOptions([]);
      setGiftPage(1);
      setGiftHasMore(true);
      fetchGiftProducts({ page: 1, search: giftSearch, append: false });
    }, 350);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftSearch, prizeModalOpen]);

  const mergedGiftOptions = useMemo(() => {
    const existing = new Set(giftOptions.map((opt) => String(opt.value)));
    const extraValues = [prizeSelection[7], prizeSelection[15], prizeSelection[30]]
      .filter(Boolean)
      .map(String);
    const extras = extraValues
      .filter((val) => !existing.has(val))
      .map((val) => ({ label: val, value: val }));
    return [...extras, ...giftOptions];
  }, [giftOptions, prizeSelection]);

  const handleGiftScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!giftHasMore || giftLoading) return;
    if (target.scrollTop + target.offsetHeight + 80 >= target.scrollHeight) {
      fetchGiftProducts({
        page: giftPage + 1,
        search: giftSearch,
        append: true,
      });
    }
  };

  return (
    <Modal
      centered
      open={prizeModalOpen}
      title={
        <div
          style={{ display: "flex", alignItems: "center", fontSize: "16px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              background: token.colorFillAlter,
              borderRadius: "50%",
              marginRight: 12,
              border: `1px solid ${token.colorBorderSecondary}`
            }}
          >
            <GiftOutlined style={{ color: token.colorPrimary, fontSize: "20px" }} />
          </div>
          <span style={{ fontWeight: 600 }}>Input Hadiah Peserta</span>
        </div>
      }
      onCancel={() => setPrizeModalOpen(false)}
      footer={[
        <Button key="cancel" onClick={() => setPrizeModalOpen(false)}>
          Batal
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={loading}
          onClick={handleSavePrize}
        >
          Simpan Hadiah
        </Button>,
      ]}
      width={600}
    >
      {current && (
        <div>
          <Card
            size="small"
            style={{
              marginBottom: 16,
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <UserOutlined style={{ color: token.colorPrimary, fontSize: "18px" }} />
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    color: token.colorText,
                  }}
                >
                  {current.name}
                </div>
                <div style={{ fontSize: "11px", color: token.colorTextDescription }}>
                  {current.phone_number ?? "-"}
                </div>
              </div>
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[7, 15, 30].map((milestone) => {
              const totalCheckin = (() => {
                const tc = (current as any).totalCheckin;
                if (tc !== undefined && tc !== null) return tc;
                const a = Number(current.totalFasting || 0);
                const b = Number(current.totalNotFasting || 0);
                return a + b;
              })();
              const isEligible = totalCheckin >= milestone;

              return (
                <Card
                  key={milestone}
                  size="small"
                  style={{
                    background: isEligible ? token.colorSuccessBg : token.colorFillAlter,
                    border: isEligible
                      ? `2px solid ${token.colorSuccessBorder}`
                      : `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: "8px",
                  }}
                  styles={{ body: { padding: 12 } }}
                >
                  <div
                    style={{
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "13px",
                        color: token.colorText,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <TrophyOutlined
                        style={{
                          marginRight: 8,
                          color: isEligible ? token.colorSuccess : token.colorTextQuaternary,
                        }}
                      />
                      Hadiah Milestone {milestone} Hari
                    </span>
                    {isEligible ? (
                      <Tag color="success" style={{ fontSize: "11px" }}>
                        Memenuhi syarat
                      </Tag>
                    ) : (
                      <Tag color="default" style={{ fontSize: "11px" }}>
                        Belum memenuhi
                      </Tag>
                    )}
                  </div>
                  <Select
                    placeholder="Pilih gift product"
                    value={
                      prizeSelection[milestone as keyof PrizeSelection] ?? undefined
                    }
                    onChange={(value, option) => {
                      const opt = option as { label?: string } | undefined;
                      const selectedLabel =
                        opt?.label ||
                        (typeof value === "string" ? value : undefined) ||
                        null;
                      setPrizeSelection(
                        (prev: PrizeSelection): PrizeSelection => ({
                          ...prev,
                          [milestone as keyof PrizeSelection]: selectedLabel,
                        }),
                      );
                    }}
                    options={mergedGiftOptions}
                    loading={giftLoading}
                    showSearch
                    filterOption={false}
                    onSearch={setGiftSearch}
                    onPopupScroll={handleGiftScroll}
                    notFoundContent={giftLoading ? "Memuat..." : "Tidak ada data"}
                    disabled={!isEligible}
                    allowClear
                    style={{ fontSize: "12px", width: "100%" }}
                    suffixIcon={<GiftOutlined />}
                  />
                  {!isEligible && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: token.colorTextDescription,
                        marginTop: 8,
                      }}
                    >
                      Peserta butuh {milestone - totalCheckin} hari check-in
                      lagi
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

        </div>
      )}
    </Modal>
  );
};

export default RamadanPrizeModal;
