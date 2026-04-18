import React from "react";
import {
  Table,
  Button,
  Card,
  Image,
  Tooltip,
  Space,
  Typography,
  Divider,
  Empty,
  Badge,
  DatePicker,
  Alert,
  theme,
  Grid,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
  CalendarOutlined,
  PictureOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import useRecommendation from "../../../../hooks/ramadhan/recommendation/useRecommendation";
import BannerModal from "./BannerModal";
import RecommendationModal from "./RecommendationModal";
import RecommendationBulkUpload from "./RecommendationBulkUpload";
import { toWib } from "../../../../utils/timezone";

const { Title, Text } = Typography;

const TableRamadanRecommendation: React.FC = () => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const {
    loading,
    isModalOpen,
    setIsModalOpen,
    selectedDate,
    setSelectedDate,
    selectedProductAbby,
    setSelectedProductAbby,
    selectedProductBev,
    setSelectedProductBev,
    selectedProductGeneral,
    setSelectedProductGeneral,
    editingRecommendation,
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
    abbyProductList,
    bevProductList,
    searchProductList,
    productLoading,
    pickLoading,
    bannerModalOpen,
    setBannerModalOpen,
    bannerForm,
    setBannerForm,
    bannerFileList,
    setBannerFileList,
    bannerMobileFileList,
    setBannerMobileFileList,
    bannerPreviewUrl,
    bannerMobilePreviewUrl,
    maxSelectable,
    maxPerDay,
    selectedDateCount,
    recommendationDates,
    rangeFilter,
    setRangeFilter,
    filteredGroupedData,
    handleSearchProduct,
    handleSubmit,
    handleDelete,
    resetRecommendationForm,
    resetBannerForm,
    handleBannerSubmit,
    handleBannerDelete,
    openEditBanner,
    openEditRecommendation,
    resolveImageUrl,
    findBannerByDate,
    fetchData,
  } = useRecommendation();

  const [bulkOpen, setBulkOpen] = React.useState(false);
  const allowedDateSet = React.useMemo(() => {
    if (!recommendationDates || recommendationDates.length === 0) return null;
    return new Set(
      recommendationDates
        .map((d) => toWib(d)?.format("YYYY-MM-DD"))
        .filter(Boolean),
    );
  }, [recommendationDates]);

  const disableDate = React.useCallback(
    (current: dayjs.Dayjs) => {
      if (!allowedDateSet || !current) return false;
      const key = current.format("YYYY-MM-DD");
      return !allowedDateSet.has(key);
    },
    [allowedDateSet],
  );

  const selectedFilterDate = rangeFilter?.start
    ? dayjs(rangeFilter.start)
    : null;

  const invalidRecommendationCount = React.useMemo(
    () =>
      (filteredGroupedData || []).reduce((acc: number, row: any) => {
        const invalidItems = (row?.items || []).filter(
          (item: any) => !item?.product,
        ).length;
        return acc + invalidItems;
      }, 0),
    [filteredGroupedData],
  );

  const handleDateFilterChange = (date: any) => {
    if (!date) {
      setRangeFilter(null);
      return;
    }
    const value = date.format("YYYY-MM-DD");
    setRangeFilter({
      start: value,
      end: value,
      label: dayjs(value).format("DD MMMM YYYY"),
    });
  };

  const columns = [
    {
      title: (
        <Space>
          <CalendarOutlined style={{ color: token.colorPrimary }} />
          <span>Tanggal</span>
        </Space>
      ),
      dataIndex: "date",
      key: "date",
      width: 220,
      render: (val: string) => {
        const key = toWib(val)?.format("YYYY-MM-DD") || val;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text strong style={{ fontSize: 13 }}>
              {dayjs(key).format("dddd")}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(key).format("DD MMMM YYYY")}
            </Text>
          </div>
        );
      },
      sorter: (a: any, b: any) => {
        const aVal = toWib(a.date);
        const bVal = toWib(b.date);
        if (aVal && bVal) return aVal.valueOf() - bVal.valueOf();
        return dayjs(a.date).unix() - dayjs(b.date).unix();
      },
    },
    {
      title: "Produk Rekomendasi",
      key: "product",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(record.items || []).map((item: any, idx: number) => {
            const product = item?.product;
            const rawProductImage =
              product?.medias?.[0]?.url ||
              product?.media?.[0]?.url ||
              product?.image ||
              product?.image_url ||
              null;
            const productImage = rawProductImage
              ? resolveImageUrl(rawProductImage)
              : "";
            const productId =
              item?.productId ??
              item?.product_id ??
              product?.id ??
              "-";
            const barcodeText =
              (product?.variants || [])
                .map((variant: any) => variant?.barcode)
                .filter(Boolean)
                .join(", ") ||
              product?.barcode ||
              "-";
            const isInvalidProduct = !product;

            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  background: token.colorFillAlter,
                  borderRadius: 8,
                  border: isInvalidProduct
                    ? `1px solid ${token.colorErrorBorder}`
                    : `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Badge
                  count={idx + 1}
                  style={{ backgroundColor: token.colorPrimary }}
                >
                  {productImage ? (
                    <Image
                      src={productImage}
                      width={60}
                      height={60}
                      style={{ borderRadius: 6, objectFit: "cover" }}
                      preview={false}
                    />
                  ) : (
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        background: token.colorFill,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PictureOutlined
                        style={{ fontSize: 24, color: token.colorTextQuaternary }}
                      />
                    </div>
                  )}
                </Badge>
                <div style={{ flex: 1 }}>
                  <Text
                    strong
                    style={{ fontSize: 13, display: "block", marginBottom: 4 }}
                    type={isInvalidProduct ? "danger" : undefined}
                  >
                    {product?.name || `Produk tidak ditemukan (ID: ${productId})`}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {isInvalidProduct
                      ? "Referensi product_id tidak valid. Perbaiki di CMS atau hapus baris ini."
                      : `Barcode: ${barcodeText}`}
                  </Text>
                </div>
                <Space>
                  <Tooltip title="Edit Rekomendasi">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEditRecommendation(item, record.date)}
                      style={{ borderRadius: 6 }}
                    />
                  </Tooltip>
                  <Tooltip title="Hapus Rekomendasi">
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(item.id)}
                      style={{ borderRadius: 6 }}
                    />
                  </Tooltip>
                </Space>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      title: (
        <Space>
          <PictureOutlined style={{ color: token.colorPrimary }} />
          <span>Banner</span>
        </Space>
      ),
      key: "banner",
      width: 280,
      render: (_: any, record: any) => {
        const banner = findBannerByDate(record.date);
        if (!banner) {
          return (
            <div
              style={{
                padding: "16px",
                background: token.colorFillAlter,
                borderRadius: 8,
                textAlign: "center",
                border: `1px dashed ${token.colorBorder}`,
              }}
            >
              <PictureOutlined
                style={{ fontSize: 24, color: token.colorTextQuaternary, marginBottom: 8 }}
              />
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                Belum ada banner
              </Text>
            </div>
          );
        }
        const src = resolveImageUrl(
          banner.imageUrl ||
          banner.image_url ||
          banner.imageMobileUrl ||
          banner.image_mobile_url,
        );
        return (
          <div
            style={{
              padding: 12,
              background: token.colorFillAlter,
              borderRadius: 8,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            {src ? (
              <Image
                src={src}
                style={{ borderRadius: 6, marginBottom: 8, width: "100%" }}
                height={100}
              />
            ) : null}
            <Text strong style={{ fontSize: 12, display: "block" }}>
              {banner.title}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      width: 200,
      render: (_: any, record: any) => {
        const existingBanner = findBannerByDate(record.date);
        return (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button
              type={existingBanner ? "default" : "primary"}
              icon={existingBanner ? <EditOutlined /> : <PlusOutlined />}
              onClick={() => {
                if (existingBanner) {
                  openEditBanner(existingBanner);
                } else {
                  resetBannerForm();
                  setBannerForm((prev) => ({ ...prev, date: record.date }));
                  setBannerModalOpen(true);
                }
              }}
              block
              style={{ borderRadius: 6 }}
            >
              {existingBanner ? "Edit Banner" : "Tambah Banner"}
            </Button>
            {existingBanner && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleBannerDelete(existingBanner.id)}
                block
                style={{ borderRadius: 6 }}
              >
                Hapus Banner
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Card
        title={
          <Space>
            <CalendarOutlined
              style={{ fontSize: 18, color: token.colorPrimary }}
            />
            <Title level={4} style={{ margin: 0 }}>
              Rekomendasi Produk Ramadan
            </Title>
          </Space>
        }
        extra={!isMobile ? (
          <Space>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setBulkOpen(true)}
              style={{ borderRadius: 6 }}
            >
              Bulk Upload
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                resetRecommendationForm();
                setIsModalOpen(true);
              }}
              style={{ borderRadius: 6 }}
            >
              Tambah Rekomendasi
            </Button>
          </Space>
        ) : undefined}
        style={{ borderRadius: 8 }}
        className="shadow"
      >
        {isMobile && (
          <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setBulkOpen(true)}
              style={{ borderRadius: 6 }}
            >
              Bulk Upload
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                resetRecommendationForm();
                setIsModalOpen(true);
              }}
              style={{ borderRadius: 6 }}
            >
              Tambah Rekomendasi
            </Button>
          </div>
        )}

        {/* Filter Chips */}
        <div style={{ marginBottom: 16 }}>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 8 }}
          >
            Pilih Tanggal:
          </Text>
          <Space wrap>
            <DatePicker
              style={{ minWidth: 220 }}
              placeholder="Pilih tanggal"
              value={selectedFilterDate}
              onChange={handleDateFilterChange}
              format="DD MMMM YYYY"
              disabledDate={disableDate}
              allowClear
            />
            <Button
              onClick={() => setRangeFilter(null)}
              type={rangeFilter ? "default" : "primary"}
            >
              Semua Tanggal
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        {invalidRecommendationCount > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={`${invalidRecommendationCount} rekomendasi memiliki product_id yang tidak ditemukan`}
            description="Data ini tetap ditampilkan agar bisa Anda edit/hapus. Sumber masalah biasanya product lama sudah terhapus tetapi masih direferensikan di ramadan_recommendations."
          />
        )}

        {/* Table */}
        <div className="overflow-x-auto md:overflow-visible">
          <Table
            dataSource={filteredGroupedData}
            columns={columns}
            loading={loading}
            rowKey={(record: any) => String(record.date)}
            pagination={{
              pageSize: 2,
              showSizeChanger: false,
              showTotal: (total) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Total {total} tanggal
                </Text>
              ),
            }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Belum ada data rekomendasi
                    </Text>
                  }
                />
              ),
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      <BannerModal
        open={bannerModalOpen}
        form={bannerForm}
        setForm={setBannerForm}
        fileList={bannerFileList}
        setFileList={setBannerFileList}
        previewUrl={bannerPreviewUrl}
        mobileFileList={bannerMobileFileList}
        setMobileFileList={setBannerMobileFileList}
        mobilePreviewUrl={bannerMobilePreviewUrl}
        allowedDates={recommendationDates}
        onCancel={() => {
          setBannerModalOpen(false);
          resetBannerForm();
        }}
        onOk={handleBannerSubmit}
      />

      <RecommendationModal
        open={isModalOpen}
        isEditing={Boolean(editingRecommendation)}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedProductAbby={selectedProductAbby}
        setSelectedProductAbby={setSelectedProductAbby}
        selectedProductBev={selectedProductBev}
        setSelectedProductBev={setSelectedProductBev}
        selectedProductGeneral={selectedProductGeneral}
        setSelectedProductGeneral={setSelectedProductGeneral}
        addDiscount={addDiscount}
        setAddDiscount={setAddDiscount}
        discountType={discountType}
        setDiscountType={setDiscountType}
        discountPercent={discountPercent}
        setDiscountPercent={setDiscountPercent}
        discountMaxPrice={discountMaxPrice}
        setDiscountMaxPrice={setDiscountMaxPrice}
        discountAmount={discountAmount}
        setDiscountAmount={setDiscountAmount}
        maxSelectable={maxSelectable}
        maxPerDay={maxPerDay}
        selectedDateCount={selectedDateCount}
        abbyProductList={abbyProductList}
        bevProductList={bevProductList}
        searchProductList={searchProductList}
        productLoading={productLoading}
        pickLoading={pickLoading}
        onSearch={handleSearchProduct}
        onCancel={() => {
          setIsModalOpen(false);
          resetRecommendationForm();
        }}
        onOk={handleSubmit}
      />

      <RecommendationBulkUpload
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSuccess={() => fetchData()}
      />
    </>
  );
};

export default TableRamadanRecommendation;
