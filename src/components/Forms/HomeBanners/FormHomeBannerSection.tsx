import React, { useEffect, useState } from "react";
import { Form, Input, Button, message } from "antd";
import http from "../../../api/http";

type SectionRecord = {
  id: number | string;
  name: string;
  slug: string;
  order?: number | null;
};

type FormValues = {
  name: string;
  slug?: string;
};

type Props = {
  data?: SectionRecord;
  onSuccess: () => void;
  onCancel: () => void;
};

const FormHomeBannerSection: React.FC<Props> = ({ data, onSuccess, onCancel }) => {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name: data.name,
        slug: data.slug,
      });
    } else {
      form.resetFields();
    }
  }, [data, form]);

  const onFinish = async (values: FormValues) => {
    try {
      setSaving(true);
      if (data?.id) {
        await http.put(`/admin/home-banners/sections/${data.id}`, values);
      } else {
        await http.post("/admin/home-banners/sections", values);
      }
      message.success("Section saved");
      onSuccess();
    } catch (error) {
      
      message.error("Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form<FormValues>
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ name: "", slug: "" }}
    >
      <Form.Item
        label="Section Name"
        name="name"
        rules={[{ required: true, message: "Section name is required" }]}
      >
        <Input placeholder="e.g. sectionhero" />
      </Form.Item>

      <Form.Item
        label="Slug (optional)"
        name="slug"
        extra="If empty, slug will be generated from name"
      >
        <Input placeholder="e.g. sectionhero" />
      </Form.Item>

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

export default FormHomeBannerSection;
