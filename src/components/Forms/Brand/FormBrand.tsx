import React, { useEffect, useState } from "react";
import { Form, Input, Button, Switch, message, Upload, Row, Col } from "antd";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { UploadOutlined } from "@ant-design/icons";
import http from "../../../api/http";

export type BrandPayload = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  country?: string | null;
  website?: string | null;
  isActive?: number; // backend expects 0/1
};

export type BrandRecord = BrandPayload & {
  id: number | string;
  slug: string;
};

type BrandFormValues = Omit<BrandPayload, "isActive"> & {
  isActive?: boolean; // switch = boolean
};

type FormBrandProps = {
  data?: BrandRecord;
  handleClose: () => void;
  fetch?: () => void;
};

const normStr = (v: any) => {
  const s = typeof v === "string" ? v.trim() : v;
  return s === "" || s === null ? undefined : s;
};

const FormBrand: React.FC<FormBrandProps> = ({ data, handleClose, fetch }) => {
  const [form] = Form.useForm<BrandFormValues>();
  const [logoFiles, setLogoFiles] = useState<UploadFile[]>([]);
  const [bannerFiles, setBannerFiles] = useState<UploadFile[]>([]);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name: data.name,
        description: data.description ?? undefined,
        logoUrl: data.logoUrl ?? undefined,
        bannerUrl: data.bannerUrl ?? undefined,
        country: data.country ?? undefined,
        website: data.website ?? undefined,
        // ✅ Switch butuh boolean
        isActive: Number(data.isActive) === 1,
      });
      setLogoFiles(
        data.logoUrl
          ? [
              {
                uid: "logo",
                name: "logo",
                status: "done",
                url: data.logoUrl,
              },
            ]
          : [],
      );
      setBannerFiles(
        data.bannerUrl
          ? [
              {
                uid: "banner",
                name: "banner",
                status: "done",
                url: data.bannerUrl,
              },
            ]
          : [],
      );
    } else {
      form.setFieldsValue({ isActive: true });
      setLogoFiles([]);
      setBannerFiles([]);
    }
  }, [data, form]);

  const validateLogoFile: UploadProps["beforeUpload"] = (file) => {
    const isAllowed = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/svg+xml"].includes(file.type);
    if (!isAllowed) {
      message.error("Logo harus berupa JPG/JPEG/PNG/WEBP/SVG");
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Logo harus lebih kecil dari 5MB");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const validateBannerFile: UploadProps["beforeUpload"] = (file) => {
    const isAllowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type);
    if (!isAllowed) {
      message.error("Banner harus berupa JPG/JPEG/PNG/WEBP");
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("Banner harus lebih kecil dari 10MB");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleUploadLogo: UploadProps["customRequest"] = async (options) => {
    if (!data?.slug) {
      message.error("Simpan brand terlebih dahulu sebelum upload logo");
      return;
    }
    const { file, onSuccess, onError } = options;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file as File);

      const resp = await http.post(`/admin/brands/${data.slug}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = resp?.data?.serve?.logoUrl;
      if (url) {
        form.setFieldValue("logoUrl", url);
        setLogoFiles([
          {
            uid: "logo",
            name: (file as File)?.name || "logo",
            status: "done",
            url,
          },
        ]);
      }
      message.success("Logo uploaded");
      onSuccess?.(resp?.data);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Upload logo gagal");
      onError?.(err);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleUploadBanner: UploadProps["customRequest"] = async (options) => {
    if (!data?.slug) {
      message.error("Simpan brand terlebih dahulu sebelum upload banner");
      return;
    }
    const { file, onSuccess, onError } = options;
    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append("banner", file as File);

      const resp = await http.post(`/admin/brands/${data.slug}/banner`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = resp?.data?.serve?.bannerUrl;
      if (url) {
        form.setFieldValue("bannerUrl", url);
        setBannerFiles([
          {
            uid: "banner",
            name: (file as File)?.name || "banner",
            status: "done",
            url,
          },
        ]);
      }
      message.success("Banner uploaded");
      onSuccess?.(resp?.data);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Upload banner gagal");
      onError?.(err);
    } finally {
      setBannerUploading(false);
    }
  };

  const onFinish = async (values: BrandFormValues) => {
    try {
      // normalize
      const normalized: BrandPayload = {
        name: (values.name || "").trim(),
        description: normStr(values.description),
        logoUrl: normStr(values.logoUrl),
        bannerUrl: normStr(values.bannerUrl),
        country: normStr(values.country),
        website: normStr(values.website),
        isActive: values.isActive ? 1 : 0,
      };

      if (data) {
        // ✅ kirim hanya yang berubah (biar field URL yang lama “jelek” gak ikut ke-validate)
        const payload: Partial<BrandPayload> = {};

        const fields: (keyof BrandPayload)[] = [
          "name",
          "description",
          "logoUrl",
          "bannerUrl",
          "country",
          "website",
          "isActive",
        ];

        for (const k of fields) {
          const nextVal = (normalized as any)[k] ?? undefined;
          const oldVal = (data as any)[k] ?? undefined;

          // normalisasi perbandingan string
          const a = typeof nextVal === "string" ? nextVal.trim() : nextVal;
          const b = typeof oldVal === "string" ? oldVal.trim() : oldVal;

          if (a !== b) payload[k] = nextVal;
        }

        // kalau gak ada perubahan, gak usah hit server
        if (Object.keys(payload).length === 0) {
          message.info("No changes to save");
          handleClose();
          return;
        }

        await http.put(`/admin/brands/${data.slug}`, payload);
        message.success("Brand updated");
      } else {
        await http.post(`/admin/brands`, normalized);
        message.success("Brand created");
      }

      form.resetFields();
      handleClose();
      fetch?.();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to submit brand");
    }
  };

  return (
    <Form<BrandFormValues>
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={() => message.error("Please check the form again.")}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Name is required." }]}
      >
        <Input />
      </Form.Item>

      <Form.Item label="Description" name="description">
        <Input.TextArea rows={4} />
      </Form.Item>

      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item label="Banner Upload">
            <Upload
              accept="image/jpg,image/jpeg,image/png,image/webp"
              listType="picture"
              maxCount={1}
              fileList={bannerFiles}
              beforeUpload={validateBannerFile}
              customRequest={handleUploadBanner}
              onChange={({ fileList }) => setBannerFiles(fileList.slice(-1))}
              disabled={!data?.slug || bannerUploading}
            >
              <Button icon={<UploadOutlined />} loading={bannerUploading}>
                {bannerUploading ? "Uploading..." : "Upload Banner"}
              </Button>
            </Upload>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Logo Upload">
            <Upload
              accept="image/jpg,image/jpeg,image/png,image/webp,image/svg+xml"
              listType="picture"
              maxCount={1}
              fileList={logoFiles}
              beforeUpload={validateLogoFile}
              customRequest={handleUploadLogo}
              onChange={({ fileList }) => setLogoFiles(fileList.slice(-1))}
              disabled={!data?.slug || logoUploading}
            >
              <Button icon={<UploadOutlined />} loading={logoUploading}>
                {logoUploading ? "Uploading..." : "Upload Logo"}
              </Button>
            </Upload>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="logoUrl" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="bannerUrl" hidden>
        <Input />
      </Form.Item>

      <Form.Item label="Active" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormBrand;
