import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Select,
  InputNumber,
  Switch,
  Form,
  Space,
  Typography,
  Divider,
  Empty,
  Spin,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";

const { Text } = Typography;

import dayjs from "dayjs";

type ProductOption = {
  label: string;
  value: number;
  image?: string;
  masterSku?: string;
};

interface FormPickModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  apiUrl: string;
  title: string;
  editData?: any; // To support edit
}

const FormPickModal: React.FC<FormPickModalProps> = ({
  open,
  onCancel,
  onSuccess,
  apiUrl,
  title,
  editData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState("");
  const searchSeq = useRef(0);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchProducts = async (searchKeyword: string, pageNum: number) => {
    const current = ++searchSeq.current;
    if (pageNum === 1) {
      setProductLoading(true);
    } else {
      setFetchingMore(true);
    }

    try {
      const resp = await http.get(
        `/admin/product?name=${encodeURIComponent(searchKeyword)}&page=${pageNum}&per_page=50`,
      );
      if (current !== searchSeq.current) return;

      const list = resp?.data?.serve?.data || [];
      const mapped = list.map((p: any) => {
        const brandName = p.brand?.name || p.brandName || "";
        const productName = p.name || "Produk";
        return {
          value: p.id,
          label: brandName ? `${brandName} - ${productName}` : productName,
          image: p.medias?.find((m: any) => m.type === 1)?.url,
          masterSku: p.masterSku,
        };
      });

      if (pageNum === 1) {
        setProductOptions(mapped);
      } else {
        setProductOptions((prev) => [...prev, ...mapped]);
      }
      setHasMore(list.length === 50);
      setPage(pageNum);
      setKeyword(searchKeyword);
    } catch (e) {
      if (current !== searchSeq.current) return;
      if (pageNum === 1) setProductOptions([]);
    } finally {
      if (current === searchSeq.current) {
        setProductLoading(false);
        setFetchingMore(false);
      }
    }
  };

  const handleSearch = (val: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchProducts(val, 1);
    }, 500);
  };

  const handlePopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (
      !fetchingMore &&
      hasMore &&
      target.scrollTop + target.offsetHeight >= target.scrollHeight - 20
    ) {
      fetchProducts(keyword, page + 1);
    }
  };

  useEffect(() => {
    if (open) {
      // Always reset form first to clear stale values from previous session
      form.resetFields();

      if (editData) {
        // Prefill product option for Select component
        if (editData.product) {
          const p = editData.product;
          const brandName = p.brand?.name || p.brandName || "";
          const productName = p.name || "Produk";
          setProductOptions([
            {
              value: p.id || editData.product_id,
              label: brandName ? `${brandName} - ${productName}` : productName,
              image: p.medias?.find((m: any) => m.type === 1)?.url,
              masterSku: p.masterSku,
            },
          ]);
        }

        // Explicitly set form values after reset
        const sd = editData.start_date || editData.startDate;
        const ed = editData.end_date || editData.endDate;
        form.setFieldsValue({
          product_id: editData.product_id || editData.product?.id,
          order: editData.order ?? 0,
          is_active:
            Number(editData.is_active) === 1 ||
            editData.is_active === true ||
            Number(editData.isActive) === 1 ||
            editData.isActive === true,
          start_date: sd ? dayjs(sd) : undefined,
          end_date: ed ? dayjs(ed) : undefined,
        });
      } else {
        form.setFieldsValue({ is_active: true, order: 0 });
        setKeyword("");
        setPage(1);
        setHasMore(true);
        fetchProducts("", 1);
      }
    }

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [open, editData]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...(!editData && { product_id: values.product_id }),
        order: values.order || 0,
        is_active: values.is_active,
        start_date: values.start_date ? values.start_date.toISOString() : null,
        end_date: values.end_date ? values.end_date.toISOString() : null,
      };

      if (editData) {
        await http.put(`${apiUrl}/${editData.id}`, payload);
      } else {
        await http.post(apiUrl, payload);
      }
      onCancel();
      onSuccess();
    } catch (e: any) {
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined style={{ color: "var(--ant-primary-color)" }} />
          <span>
            {editData ? "Edit Data" : "Tambah Ke"} {title}
          </span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Simpan"
      cancelText="Batal"
      width={500}
      destroyOnClose
    >
      <Divider style={{ margin: "12px 0 20px 0" }} />
      {open && (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Pilih Produk"
            name="product_id"
            rules={[
              { required: true, message: "Pilih produk terlebih dahulu" },
            ]}
          >
            <Select
              showSearch
              placeholder="Cari produk berdasarkan nama..."
              filterOption={false}
              onSearch={handleSearch}
              onPopupScroll={handlePopupScroll}
              loading={productLoading}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {fetchingMore && (
                    <div style={{ textAlign: "center", padding: "8px 0" }}>
                      <Spin size="small" />
                    </div>
                  )}
                </>
              )}
              notFoundContent={
                productLoading ? (
                  <Spin size="small" />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )
              }
              suffixIcon={<SearchOutlined />}
              options={productOptions}
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
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: "#f0f0f0",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PictureOutlined
                        style={{ fontSize: 14, color: "#bfbfbf" }}
                      />
                    </div>
                  )}
                  <div>
                    <Text style={{ fontSize: 13, display: "block" }}>
                      {option.label}
                    </Text>
                    {option.data.masterSku && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        SKU: {option.data.masterSku}
                      </Text>
                    )}
                  </div>
                </div>
              )}
            />
          </Form.Item>

          <Form.Item label="Tanggal Mulai Tayang (Opsional)" name="start_date">
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>

          <Form.Item label="Tanggal Berakhir Tayang (Opsional)" name="end_date">
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>

          <Form.Item label="Urutan (Order)" name="order">
            <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
          </Form.Item>

          <Form.Item
            label="Status Aktif"
            name="is_active"
            valuePropName="checked"
          >
            <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default FormPickModal;
