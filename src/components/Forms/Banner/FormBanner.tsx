import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Select, Switch, Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import http from "../../../api/http";
import helper from "../../../utils/helper";
import { UPLOAD_PATHS } from "../../../constants/uploadPaths";

const { Option } = Select;

type BannerRecord = {
  id: number | string;
  title: string;
  description: string;
  position: string;
  banner_type?: string; // ✅ Banner classification: hero_carousel, banner_top_home, page_sale, featured_section, general
  has_button: number;
  button_text?: string;
  button_url?: string;
  image?: string;
  image_url?: string;
  imageMobile?: string;
  image_mobile_url?: string;
};

type BannerSectionOption = {
  value: string;
  label: string;
};

type FormBannerProps = {
  data?: BannerRecord;
  sectionLabel?: string;
  sectionOptions?: BannerSectionOption[];
  requireSection?: boolean;
  defaultSection?: string;
  redirectTo?: string;
};

type FormValues = {
  id?: string | number;
  title?: string;
  description?: string;
  position: string;
  banner_type?: string; // ✅ Banner classification
  has_button: boolean;
  button_text?: string;
  button_url?: string;
  image_url?: string;
  image_mobile_url?: string;
  image: UploadFile[];
  image_mobile: UploadFile[];
};

const DEFAULT_SECTION_OPTIONS: BannerSectionOption[] = [
  { value: "hero_carousel", label: "Hero Carousel" },
  { value: "banner_top_home", label: "Banner Top Home" },
  { value: "page_sale", label: "Halaman Sale" },
  { value: "featured_section", label: "Featured Section" },
  { value: "general", label: "General" },
];

const FormBanner: React.FC<FormBannerProps> = ({
  data,
  sectionLabel = "Banner Type",
  sectionOptions = DEFAULT_SECTION_OPTIONS,
  requireSection = false,
  defaultSection = "general",
  redirectTo = "/banners",
}) => {
  const [form] = Form.useForm<FormValues>();
  const [isHasButton, setIsHasButton] = useState<boolean>(false);

  const onFinish = async (values: FormValues) => {
    const formData = new FormData();

    const fileList = values.image;
    const file = fileList?.[0]?.originFileObj || fileList?.[0]?.url;

    const fileListMobile = values.image_mobile;
    const fileMobile = fileListMobile?.[0]?.originFileObj || fileListMobile?.[0]?.url;

    const desktopUrl = String(values.image_url || "").trim();
    const mobileUrl = String(values.image_mobile_url || "").trim();

    if (!file && !desktopUrl) {
      message.error("Desktop image is required!");
      return;
    }
    if (!fileMobile && !mobileUrl) {
      message.error("Mobile image is required!");
      return;
    }

    formData.append("title", values.title || "");
    formData.append("description", values.description || "");
    formData.append("position", values.position);
    formData.append("banner_type", values.banner_type || defaultSection); // ✅ Add banner_type
    formData.append("has_button", values.has_button ? "1" : "0");
    formData.append("button_text", values.button_text ?? "");
    formData.append("button_url", values.button_url ?? "");

    if (desktopUrl) {
      formData.append("image_url", desktopUrl);
    } else if (typeof file === "string") {
      formData.append("image_url", file);
    } else if (file instanceof Blob) {
      formData.append("image", file);
    }

    if (mobileUrl) {
      formData.append("image_mobile_url", mobileUrl);
    } else if (fileMobile) {
      if (typeof fileMobile === "string") {
        formData.append("image_mobile_url", fileMobile);
      } else {
        formData.append("image_mobile", fileMobile);
      }
    }

    try {
      if (data) {
        await http.put(`/admin/banners/${values.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await http.post("/admin/banners", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      form.resetFields();
      window.location.href = redirectTo;
    } catch (error) {
      
      message.error("Submission failed, please try again!");
    }
  };

  const onFinishFailed = (errorInfo: unknown) => {
    
  };

  const actionButton = (checked: boolean) => {
    form.setFieldsValue({ has_button: checked });
    setIsHasButton(checked);
  };

  useEffect(() => {
    const init: Partial<FormValues> = {
      id: data?.id,
      title: data?.title ?? "",
      description: data?.description ?? "",
      banner_type: data?.banner_type ?? defaultSection, // ✅ Initialize banner_type
      position: data?.position ?? "bottom-left",
      has_button: data ? data.has_button === 1 : false,
      button_text: data?.button_text ?? "",
      button_url: data?.button_url ?? "",
      image_url: data?.image_url ?? "",
      image_mobile_url: data?.image_mobile_url ?? "",
      image: data
        ? [
            {
              uid: "-1",
              name: data.image || "banner-desktop.png",
              status: "done",
              url: data.image_url,
            },
          ]
        : [],
      image_mobile: data
        ? [
            {
              uid: "-1",
              name: data.imageMobile || "banner-mobile.png",
              status: "done",
              url: data.image_mobile_url,
            },
          ]
        : [],
    };

    form.setFieldsValue(init as FormValues);
    setIsHasButton(init.has_button ?? false);
  }, [data, defaultSection, form]);

  return (
    <Form<FormValues>
      form={form}
      name="bannerForm"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item name="id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item label="Desktop Image URL" name="image_url">
        <Input placeholder="https://..." />
      </Form.Item>

      <Form.Item
        name="image"
        label="File Desktop"
        valuePropName="fileList"
        getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
        rules={[
          ({ getFieldValue }) => ({
            validator() {
              const url = String(getFieldValue("image_url") || "").trim();
              const list = getFieldValue("image");
              if (url || (Array.isArray(list) && list.length > 0)) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Desktop image is required"));
            },
          }),
        ]}
      >
        <Upload
          accept="image/jpg, image/png, image/jpeg, image/webp, video/mp4"
          name="file"
          action={`${import.meta.env.VITE_API_URL}/upload`}
          headers={{ Authorization: `Bearer ${helper.isAuthenticated()?.token}` }}
          data={{ folder: UPLOAD_PATHS.banners }}
          listType="picture"
          beforeUpload={(file) => {
            const isAllowed =
              ["image/jpeg", "image/png", "image/jpg", "image/webp", "video/mp4"].includes(file.type);
            if (!isAllowed) {
              message.error("You can only upload JPG/JPEG/PNG/WEBP/MP4 file!");
              return Upload.LIST_IGNORE;
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (file.type === "video/mp4" && !isLt5M) {
              message.error("Video must be smaller than 5MB!");
              return Upload.LIST_IGNORE;
            }
            if (file.type !== "video/mp4" && !isLt2M) {
              message.error("Image must be smaller than 2MB!");
              return Upload.LIST_IGNORE;
            }
            return true;
          }}
        >
          <Button>Upload Banner</Button>
          <span style={{ display: "block", fontSize: "10px" }}>
            * JPG, JPEG, WEBP, PNG (≤2MB) or MP4 (≤5MB)
          </span>
        </Upload>
      </Form.Item>

      <Form.Item label="Mobile Image URL" name="image_mobile_url">
        <Input placeholder="https://..." />
      </Form.Item>

      <Form.Item
        name="image_mobile"
        label="File Mobile"
        valuePropName="fileList"
        getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
        rules={[
          ({ getFieldValue }) => ({
            validator() {
              const url = String(getFieldValue("image_mobile_url") || "").trim();
              const list = getFieldValue("image_mobile");
              if (url || (Array.isArray(list) && list.length > 0)) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Mobile image is required"));
            },
          }),
        ]}
      >
        <Upload
          accept="image/jpg, image/png, image/jpeg, image/webp, video/mp4"
          name="file"
          action={`${import.meta.env.VITE_API_URL}/upload`}
          headers={{ Authorization: `Bearer ${helper.isAuthenticated()?.token}` }}
          data={{ folder: UPLOAD_PATHS.banners }}
          listType="picture"
          beforeUpload={(file) => {
            const isAllowed =
              ["image/jpeg", "image/png", "image/jpg", "image/webp", "video/mp4"].includes(file.type);
            if (!isAllowed) {
              message.error("You can only upload JPG/JPEG/PNG/WEBP/MP4 file!");
              return Upload.LIST_IGNORE;
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (file.type === "video/mp4" && !isLt5M) {
              message.error("Video must be smaller than 5MB!");
              return Upload.LIST_IGNORE;
            }
            if (file.type !== "video/mp4" && !isLt2M) {
              message.error("Image must be smaller than 2MB!");
              return Upload.LIST_IGNORE;
            }
            return true;
          }}
        >
          <Button>Upload Banner</Button>
          <span style={{ display: "block", fontSize: "10px" }}>
            * JPG, JPEG, WEBP, PNG (≤2MB) or MP4 (≤5MB)
          </span>
        </Upload>
      </Form.Item>

      <Form.Item label="Title" name="title">
        <Input />
      </Form.Item>
      <Form.Item label="Description" name="description">
        <Input />
      </Form.Item>

      <Form.Item label="Position" name="position">
        <Select>
          <Option value="bottom-left">Bottom Left</Option>
          <Option value="top-left">Top Left</Option>
          <Option value="top-right">Top Right</Option>
          <Option value="center">Center</Option>
        </Select>
      </Form.Item>

      {/* ✅ NEW: Banner Classification Field */}
      <Form.Item
        label={sectionLabel}
        name="banner_type"
        rules={
          requireSection
            ? [{ required: true, message: `${sectionLabel} is required` }]
            : undefined
        }
      >
        <Select placeholder={`Select ${sectionLabel.toLowerCase()}...`}>
          {sectionOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Button" name="has_button" valuePropName="checked">
        <Switch
          checkedChildren="Yes"
          unCheckedChildren="No"
          checked={isHasButton}
          onChange={actionButton}
        />
      </Form.Item>

      {isHasButton && (
        <>
          <Form.Item label="Button Text" name="button_text">
            <Input />
          </Form.Item>
          <Form.Item label="Button URL" name="button_url">
            <Input />
          </Form.Item>
        </>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormBanner;
