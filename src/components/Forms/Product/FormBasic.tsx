import React from "react";
import { Form, Input, Row, Button, Col, Image, message, Select, InputNumber } from "antd";
import type { FormInstance } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import http from "../../../api/http";
import helper from "../../../utils/helper";
import { UPLOAD_PATHS } from "../../../constants/uploadPaths";

type MediaItem = {
  url: string;
  type: 1 | 2;
};

type FormBasicProps = {
  medias: MediaItem[];
  setMedias: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  form: FormInstance<any>;
  hasVariants?: boolean;
  hidePricingWeightFields?: boolean;
  categoriesFromParent?: FlatCategory[];
  catLoadingFromParent?: boolean;
};

type FlatCategory = { id: number; pathLabel: string };

const FormBasic: React.FC<FormBasicProps> = ({
  medias,
  setMedias,
  form,
  hasVariants,
  hidePricingWeightFields = false,
  categoriesFromParent = [],
  catLoadingFromParent = false,
}) => {

  const handleUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/mp4,video/x-m4v,video/*";
    input.multiple = true;

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;

      const files = Array.from(target.files);

      try {
        const uploadPromises = files.map(async (file) => {
          const typeFile: 1 | 2 = file.type.startsWith("video/") ? 2 : 1;
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", UPLOAD_PATHS.products);

          const res = await http.post("/upload", fd, {
            headers: { "content-type": "multipart/form-data" },
          });

          const signedUrl: string = res?.data?.signedUrl;
          return { url: signedUrl, type: typeFile } as MediaItem;
        });

        const uploadedMedias = await Promise.all(uploadPromises);

        setMedias((prev) => {
          const remaining = Math.max(0, 10 - prev.length);
          return remaining > 0
            ? [...prev, ...uploadedMedias.slice(0, remaining)]
            : prev;
        });
      } catch (err) {
        
        message.error("Upload failed");
      }
    };

    input.click();
  };

  const setBasePrice = (val: string) => {
    const formatted = val ? helper.formatRupiah(val) : "";
    if (typeof (form as any).setFieldValue === "function") {
      (form as any).setFieldValue("base_price", formatted);
    } else {
      form.setFieldsValue({ base_price: formatted });
    }
  };

  return (
    <>
      { }
      <Form.Item
        label="Title"
        name="name"
        rules={[{ required: true, message: "Title required." }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Master SKU"
        name="master_sku"
        tooltip="Optional. Jika kosong, backend akan membangkitkan default berdasarkan ID produk."
      >
        <Input placeholder="e.g. PRD-001" />
      </Form.Item>

      {!hasVariants && (
        <>
          <Form.Item
            label="Barcode / SKU Varian 2"
            name="barcode"
            tooltip="Opsional. Digunakan sebagai pengenal unik tambahan (barcode)."
          >
            <Input placeholder="e.g. 880123456789" />
          </Form.Item>

          <Form.Item
            label="Stock"
            name="stock"
            tooltip="Hanya diisi jika produk tidak memiliki varian (produk tunggal)."
          >
            <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
          </Form.Item>
        </>
      )}

      { }
      <Form.Item
        label="Category Type"
        name="category_type_id"
        rules={[
          {
            validator: (_, value) =>
              Array.isArray(value) && value.length > 0
                ? Promise.resolve()
                : Promise.reject(new Error("Category type is required.")),
          },
        ]}
      >
        <Select
          mode="multiple"
          placeholder="Please select Category Type"
          loading={catLoadingFromParent}
          showSearch
          optionFilterProp="children"
          allowClear
        >
          {categoriesFromParent.map((c) => (
            <Select.Option key={c.id} value={c.id}>
              {c.pathLabel}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Description" name="description">
        <ReactQuill
          theme="snow"
          placeholder="Product description (optional)"
          style={{ height: "15rem", width: "100%", marginBottom: "3rem" }}
          onChange={(content) => {
            form.setFieldsValue({ description: content });
          }}
        />
      </Form.Item>

      <Form.Item label="Media (10 file max)" style={{ display: hasVariants ? "none" : undefined }}>
        <Row gutter={[12, 12]} align="middle">
          {medias.length > 0 &&
            medias.map((item, key) => (
              <Col
                xs={12}
                sm={12}
                md={12}
                lg={4}
                key={`${item.url}-${key}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.type === 1 ? (
                  <Image
                    src={helper.renderImage(item.url)}
                    width="100%"
                    height={100}
                    style={{ objectFit: "contain" }}
                    alt="media"
                  />
                ) : (
                  <video
                    controls
                    src={helper.renderImage(item.url)}
                    style={{ width: "100%", height: 100 }}
                  />
                )}
                <Button
                  icon={<DeleteOutlined />}
                  style={{ marginTop: 10 }}
                  type="text"
                  danger
                  onClick={() =>
                    setMedias((prev) => prev.filter((_, idx) => idx !== key))
                  }
                />
              </Col>
            ))}

          {medias.length < 10 && (
            <Col xs={12} sm={12} md={12} lg={4}>
              <div
                className="hover-file"
                style={{
                  border: "1px dashed var(--ant-primary-color)",
                  padding: 10,
                  borderRadius: 8,
                  width: "max-content",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 10,
                }}
                onClick={handleUploadClick}
              >
                <UploadOutlined style={{ fontSize: 30 }} />
                <div style={{ fontSize: 12 }}>Upload Media</div>
              </div>
            </Col>
          )}
        </Row>
      </Form.Item >

      {!hidePricingWeightFields && (
        <>
          <Form.Item
            label="Base Price"
            name="base_price"
            rules={[{ required: !hasVariants, message: "Base price required." }]}
            tooltip={!hasVariants ? "Wajib diisi untuk produk tanpa varian." : undefined}
          >
            <Input
              prefix={hasVariants ? undefined : "Rp"}
              disabled={hasVariants}
              onChange={(e) => setBasePrice(e.target.value)}
              inputMode="numeric"
              placeholder={hasVariants ? "Produk ini memiliki varian, cek harga di bagian varian" : "0"}
            />
          </Form.Item>

          {!hasVariants && (
            <Form.Item
              label="Price"
              name="price"
              tooltip="Harga jual yang tampil di website. Kosongkan jika sama dengan Base Price."
            >
              <Input
                prefix="Rp"
                inputMode="numeric"
                placeholder="0"
                onChange={(e) => {
                  const formatted = e.target.value ? helper.formatRupiah(e.target.value) : "";
                  form.setFieldsValue({ price: formatted });
                }}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Weight"
            name="weight"
            tooltip={hasVariants ? "Opsional jika sudah diisi di tabel varian. Satuan gram (g)." : "Wajib diisi untuk produk tanpa varian. Satuan gram (g)."}
            rules={[
              { required: !hasVariants, message: "Weight required." },
              {
                validator: (_, _value) => {
                  const value = Number(_value);
                  if (_value && value < 0) {
                    return Promise.reject("Weight cannot be negative.");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              type="number"
              suffix="g"
              inputMode="numeric"
              placeholder="0"
              min={0}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val < 0) {
                  form.setFieldsValue({ weight: 0 });
                }
              }}
            />
          </Form.Item>
        </>
      )}
    </>
  );
};

export default FormBasic;
