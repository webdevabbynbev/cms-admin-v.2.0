import React from "react";
import {
  DatePicker,
  Divider,
  Empty,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Typography,
  Switch,
  Radio,
  InputNumber,
  theme,
} from "antd";
import { PictureOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

type ProductOption = {
  label: string;
  value: number;
  image?: string;
};

type RecommendationModalProps = {
  open: boolean;
  isEditing?: boolean;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  selectedProductAbby: number[];
  setSelectedProductAbby: (value: number[]) => void;
  selectedProductBev: number[];
  setSelectedProductBev: (value: number[]) => void;
  selectedProductGeneral: number[];
  setSelectedProductGeneral: (value: number[]) => void;
  addDiscount: boolean;
  setAddDiscount: (value: boolean) => void;
  discountType: "percent" | "nominal";
  setDiscountType: (value: "percent" | "nominal") => void;
  discountPercent: number | null;
  setDiscountPercent: (value: number | null) => void;
  discountMaxPrice: number | null;
  setDiscountMaxPrice: (value: number | null) => void;
  discountAmount: number | null;
  setDiscountAmount: (value: number | null) => void;
  maxSelectable: number;
  maxPerDay: number;
  selectedDateCount: number;
  abbyProductList: ProductOption[];
  bevProductList: ProductOption[];
  searchProductList: ProductOption[];
  productLoading: boolean;
  pickLoading?: boolean;
  onSearch: (val: string) => void;
  onCancel: () => void;
  onOk: () => void;
};
const RecommendationModal: React.FC<RecommendationModalProps> = ({
  open,
  isEditing = false,
  selectedDate,
  setSelectedDate,
  selectedProductAbby,
  setSelectedProductAbby,
  selectedProductBev,
  setSelectedProductBev,
  selectedProductGeneral,
  setSelectedProductGeneral,
  addDiscount,
  setAddDiscount,
  discountType,
  setDiscountType,
  discountPercent,
  setDiscountPercent,
  discountMaxPrice,
  setDiscountMaxPrice,
  discountAmount,
  setDiscountAmount,
  maxSelectable,
  maxPerDay,
  selectedDateCount,
  abbyProductList,
  bevProductList,
  searchProductList,
  productLoading,
  pickLoading = false,
  onSearch,
  onCancel,
  onOk,
}) => {
  const { token } = theme.useToken();
  const handleToggleDiscount = (checked: boolean) => {
    setAddDiscount(checked);
    if (!checked) {
      setDiscountType("percent");
      setDiscountPercent(null);
      setDiscountMaxPrice(null);
      setDiscountAmount(null);
    }
  };

  const formatRupiah = (value?: string | number) =>
    value ? `Rp ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : "";

  const parseRupiah = (value?: string) =>
    Number(String(value || "").replace(/[^\d]/g, "")) || 0;

  const selectedBevSet = new Set(selectedProductBev || []);
  const selectedAbbySet = new Set(selectedProductAbby || []);
  const selectedGeneralSet = new Set(selectedProductGeneral || []);
  const selectedOtherForAbby = new Set([
    ...selectedBevSet,
    ...selectedGeneralSet,
  ]);
  const selectedOtherForBev = new Set([
    ...selectedAbbySet,
    ...selectedGeneralSet,
  ]);
  const selectedOtherForGeneral = new Set([
    ...selectedAbbySet,
    ...selectedBevSet,
  ]);
  const maxAbbySelectable = Math.max(
    0,
    maxSelectable - selectedOtherForAbby.size,
  );
  const maxBevSelectable = Math.max(
    0,
    maxSelectable - selectedOtherForBev.size,
  );
  const maxGeneralSelectable = Math.max(
    0,
    maxSelectable - selectedOtherForGeneral.size,
  );

  const handleAbbyChange = (val: number[]) => {
    if (val.length > maxAbbySelectable) {
      message.warning(
        `Maksimal ${maxPerDay} produk per tanggal. Sisa slot: ${maxAbbySelectable}.`,
      );
      setSelectedProductAbby(val.slice(0, maxAbbySelectable));
      return;
    }
    setSelectedProductAbby(val);
  };

  const handleBevChange = (val: number[]) => {
    if (val.length > maxBevSelectable) {
      message.warning(
        `Maksimal ${maxPerDay} produk per tanggal. Sisa slot: ${maxBevSelectable}.`,
      );
      setSelectedProductBev(val.slice(0, maxBevSelectable));
      return;
    }
    setSelectedProductBev(val);
  };

  const handleGeneralChange = (val: number[]) => {
    if (val.length > maxGeneralSelectable) {
      message.warning(
        `Maksimal ${maxPerDay} produk per tanggal. Sisa slot: ${maxGeneralSelectable}.`,
      );
      setSelectedProductGeneral(val.slice(0, maxGeneralSelectable));
      return;
    }
    setSelectedProductGeneral(val);
  };

  const totalSelected = new Set([
    ...(selectedProductAbby || []),
    ...(selectedProductBev || []),
    ...(selectedProductGeneral || []),
  ]).size;

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined style={{ color: "var(--ant-primary-color)" }} />
          <span>
            {isEditing ? "Edit Rekomendasi Produk" : "Tambah Rekomendasi Produk"}
          </span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText={isEditing ? "Simpan Perubahan" : "Simpan"}
      cancelText="Batal"
      width={600}
    >
      <Divider style={{ margin: "12px 0 20px 0" }} />
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div>
          <Text strong style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
            Pilih Tanggal <span style={{ color: "red" }}>*</span>
          </Text>
          <DatePicker
            style={{ width: "100%", borderRadius: 6 }}
            placeholder="Pilih tanggal rekomendasi"
            onChange={(date) =>
              setSelectedDate(date ? date.format("YYYY-MM-DD") : "")
            }
            value={selectedDate ? dayjs(selectedDate) : null}
            format="DD MMMM YYYY"
          />
        </div>

        <div>
          <Text strong style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
            Pilih Produk Abby
          </Text>
          <Select
            mode="multiple"
            showSearch
            value={selectedProductAbby}
            placeholder="Cari dan pilih produk Abby..."
            style={{ width: "100%" }}
            defaultActiveFirstOption={false}
            filterOption={(input, option) =>
              String(option?.label || "")
                .toLowerCase()
                .includes(String(input || "").toLowerCase())
            }
            onChange={(val) => handleAbbyChange(val)}
            notFoundContent={
              pickLoading ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <Spin size="small" />
                </div>
              ) : (
                <Empty
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Produk tidak ditemukan
                    </Text>
                  }
                />
              )
            }
            loading={pickLoading}
            options={abbyProductList}
            suffixIcon={<SearchOutlined />}
            optionRender={(option: any) => (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "4px 0",
                }}
              >
                {option.data.image ? (
                  <img
                    src={option.data.image}
                    alt=""
                    style={{
                      width: 32,
                      height: 32,
                      objectFit: "cover",
                      borderRadius: 4,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      background: token.colorFillAlter,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <PictureOutlined style={{ fontSize: 14, color: token.colorTextQuaternary }} />
                  </div>
                )}
                <Text style={{ fontSize: 12, color: token.colorText }}>{option.label}</Text>
              </div>
            )}
          />

          <div style={{ marginTop: 12 }}>
            <Text
              strong
              style={{ fontSize: 12, display: "block", marginBottom: 6 }}
            >
              Pilih Produk Bev
            </Text>
            <Select
              mode="multiple"
              showSearch
              value={selectedProductBev}
              placeholder="Cari dan pilih produk Bev..."
              style={{ width: "100%" }}
              defaultActiveFirstOption={false}
              filterOption={(input, option) =>
                String(option?.label || "")
                  .toLowerCase()
                  .includes(String(input || "").toLowerCase())
              }
              onChange={(val) => handleBevChange(val)}
              notFoundContent={
                pickLoading ? (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <Spin size="small" />
                  </div>
                ) : (
                  <Empty
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Produk tidak ditemukan
                      </Text>
                    }
                  />
                )
              }
              loading={pickLoading}
              options={bevProductList}
              suffixIcon={<SearchOutlined />}
              optionRender={(option: any) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "4px 0",
                  }}
                >
                  {option.data.image ? (
                    <img
                      src={option.data.image}
                      alt=""
                      style={{
                        width: 32,
                        height: 32,
                        objectFit: "cover",
                        borderRadius: 4,
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: token.colorFillAlter,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <PictureOutlined style={{ fontSize: 14, color: token.colorTextQuaternary }} />
                    </div>
                  )}
                  <Text style={{ fontSize: 12, color: token.colorText }}>{option.label}</Text>
                </div>
              )}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <Text
              strong
              style={{ fontSize: 12, display: "block", marginBottom: 6 }}
            >
              Pilih Produk (Search)
            </Text>
            <Select
              mode="multiple"
              showSearch
              value={selectedProductGeneral}
              placeholder="Cari dan pilih produk..."
              style={{ width: "100%" }}
              defaultActiveFirstOption={false}
              filterOption={false}
              onSearch={onSearch}
              onChange={(val) => handleGeneralChange(val)}
              notFoundContent={
                productLoading ? (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <Spin size="small" />
                  </div>
                ) : (
                  <Empty
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Produk tidak ditemukan
                      </Text>
                    }
                  />
                )
              }
              loading={productLoading}
              options={searchProductList}
              suffixIcon={<SearchOutlined />}
              optionRender={(option: any) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "4px 0",
                  }}
                >
                  {option.data.image ? (
                    <img
                      src={option.data.image}
                      alt=""
                      style={{
                        width: 32,
                        height: 32,
                        objectFit: "cover",
                        borderRadius: 4,
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: token.colorFillAlter,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <PictureOutlined style={{ fontSize: 14, color: token.colorTextQuaternary }} />
                    </div>
                  )}
                  <Text style={{ fontSize: 12, color: token.colorText }}>{option.label}</Text>
                </div>
              )}
            />
          </div>

          <Text
            type="secondary"
            style={{ fontSize: 11, marginTop: 6, display: "block" }}
          >
            Minimal pilih 1 produk (Abby/Bev/Produk).
            <br />
            Maksimal {maxPerDay} produk per tanggal.
            {selectedDate
              ? ` Terisi ${selectedDateCount}, sisa ${maxSelectable}.`
              : " Pilih tanggal untuk melihat sisa slot."}
          </Text>
          {totalSelected > 0 && (
            <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: "block" }}>
              {totalSelected} produk dipilih
            </Text>
          )}
        </div>

        <Divider style={{ margin: "6px 0 4px 0" }} />

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Text strong style={{ fontSize: 12 }}>
              Tambahkan Diskon?
            </Text>
            <Switch checked={addDiscount} onChange={handleToggleDiscount} />
          </div>
          {addDiscount && (
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                Jenis Diskon
              </Text>
              <Radio.Group
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <Radio value="percent">Diskon %</Radio>
                <Radio value="nominal">Potongan Harga</Radio>
              </Radio.Group>

              {discountType === "percent" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <div>
                    <Text style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                      Berapa persen?
                    </Text>
                    <InputNumber
                      min={1}
                      max={100}
                      value={discountPercent ?? undefined}
                      onChange={(val) =>
                        setDiscountPercent(typeof val === "number" ? val : null)
                      }
                      style={{ width: "100%" }}
                      formatter={(value) => `${value}%`}
                      parser={(value) => Number(String(value).replace(/[^\d]/g, ""))}
                    />
                  </div>
                  <div>
                    <Text style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                      Maksimal harga diskon
                    </Text>
                    <InputNumber
                      min={1}
                      value={discountMaxPrice ?? undefined}
                      onChange={(val) =>
                        setDiscountMaxPrice(typeof val === "number" ? val : null)
                      }
                      style={{ width: "100%" }}
                      formatter={formatRupiah}
                      parser={parseRupiah}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                    Potongan harga berapa?
                  </Text>
                  <InputNumber
                    min={1}
                    value={discountAmount ?? undefined}
                    onChange={(val) =>
                      setDiscountAmount(typeof val === "number" ? val : null)
                    }
                    style={{ width: "100%" }}
                    formatter={formatRupiah}
                    parser={parseRupiah}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Space>
    </Modal>
  );
};

export default RecommendationModal;
