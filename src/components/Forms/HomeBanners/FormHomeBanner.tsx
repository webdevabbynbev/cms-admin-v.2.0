import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Switch, Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import http from "../../../api/http";

type BannerRecord = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  has_button?: number | null;
  image_url?: string | null;
  image_mobile_url?: string | null;
};

type FormValues = {
  title?: string;
  description?: string;
  has_button?: boolean;
  button_text?: string;
  button_url?: string;
  image?: UploadFile[];
  image_mobile?: UploadFile[];
};

type Props = {
  sectionId: number | string;
  data?: BannerRecord;
  onSuccess: () => void;
  onCancel: () => void;
};

const MAX_IMAGE_MB = 2;
const MAX_VIDEO_MB = 5;

const FormHomeBanner: React.FC<Props> = ({ sectionId, data, onSuccess, onCancel }) => {
  const [form] = Form.useForm<FormValues>();
  const [hasButton, setHasButton] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [fileListMobile, setFileListMobile] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (data) {
      setHasButton(Boolean(data.has_button));
      setFileList(
        data.image_url
          ? [
              {
                uid: "-1",
                name: "banner-desktop",
                status: "done",
                url: data.image_url || undefined,
              },
            ]
          : [],
      );
      setFileListMobile(
        data.image_mobile_url
          ? [
              {
                uid: "-1",
                name: "banner-mobile",
                status: "done",
                url: data.image_mobile_url || undefined,
              },
            ]
          : [],
      );
      form.setFieldsValue({
        title: data.title ?? "",
        description: data.description ?? "",
        has_button: Boolean(data.has_button),
        button_text: data.button_text ?? "",
        button_url: data.button_url ?? "",
        image: [],
        image_mobile: [],
      });
    } else {
      setHasButton(false);
      setFileList([]);
      setFileListMobile([]);
      form.resetFields();
    }
  }, [data, form]);

  const validateFile = (file: File) => {
    const isAllowed =
      ["image/jpeg", "image/png", "image/jpg", "image/webp", "video/mp4"].includes(file.type);
    if (!isAllowed) {
      message.error("You can only upload JPG/JPEG/PNG/WEBP/MP4 file!");
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < MAX_IMAGE_MB;
    const isLt5M = file.size / 1024 / 1024 < MAX_VIDEO_MB;
    if (file.type === "video/mp4" && !isLt5M) {
      message.error("Video must be smaller than 5MB!");
      return Upload.LIST_IGNORE;
    }
    if (file.type !== "video/mp4" && !isLt2M) {
      message.error("Image must be smaller than 2MB!");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const onFinish = async (values: FormValues) => {
    const formData = new FormData();

    const desktopFile = values.image?.[0]?.originFileObj;
    const mobileFile = values.image_mobile?.[0]?.originFileObj;

    if (!data && !desktopFile) {
      message.error("Desktop image is required!");
      return;
    }

    formData.append("title", values.title || "");
    formData.append("description", values.description || "");
    formData.append("has_button", values.has_button ? "1" : "0");
    formData.append("button_text", values.button_text ?? "");
    formData.append("button_url", values.button_url ?? "");

    if (desktopFile instanceof Blob) {
      formData.append("image", desktopFile);
    }
    if (mobileFile instanceof Blob) {
      formData.append("image_mobile", mobileFile);
    }

    try {
      setSaving(true);
      if (data?.id) {
        await http.put(`/admin/home-banners/banners/${data.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await http.post(`/admin/home-banners/sections/${sectionId}/banners`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      message.success("Banner saved");
      onSuccess();
    } catch (error) {
      
      message.error("Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form<FormValues>
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        title: "",
        description: "",
        has_button: false,
        button_text: "",
        button_url: "",
      }}
    >
      <Form.Item label="Desktop Image" name="image">
        <Upload
          accept="image/jpg, image/png, image/jpeg, image/webp, video/mp4"
          fileList={fileList}
          beforeUpload={validateFile}
          disabled={saving}
          maxCount={1}
          listType="picture"
          onChange={({ fileList: next }) => {
            setFileList(next);
            form.setFieldsValue({ image: next });
          }}
        >
          <Button>Upload Desktop</Button>
        </Upload>
      </Form.Item>

      <Form.Item label="Mobile Image (optional)" name="image_mobile">
        <Upload
          accept="image/jpg, image/png, image/jpeg, image/webp, video/mp4"
          fileList={fileListMobile}
          beforeUpload={validateFile}
          disabled={saving}
          maxCount={1}
          listType="picture"
          onChange={({ fileList: next }) => {
            setFileListMobile(next);
            form.setFieldsValue({ image_mobile: next });
          }}
        >
          <Button>Upload Mobile</Button>
        </Upload>
      </Form.Item>

      <Form.Item label="Title" name="title">
        <Input />
      </Form.Item>
      <Form.Item label="Description" name="description">
        <Input />
      </Form.Item>

      <Form.Item label="Button" name="has_button" valuePropName="checked">
        <Switch checked={hasButton} onChange={(v) => setHasButton(v)} />
      </Form.Item>

      {hasButton && (
        <>
          <Form.Item label="Button Text" name="button_text">
            <Input />
          </Form.Item>
          <Form.Item label="Button URL" name="button_url">
            <Input />
          </Form.Item>
        </>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="primary" htmlType="submit" loading={saving} disabled={saving}>
          Save
        </Button>
      </div>
    </Form>
  );
};

export default FormHomeBanner;
