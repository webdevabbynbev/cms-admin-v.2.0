import React from "react";
import { Form, Input } from "antd";
import type { FormInstance } from "antd";

type FormSeoProps = {
  form: FormInstance;
};

const FormSeo: React.FC<FormSeoProps> = () => {
  return (
    <>
      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>
        SEO
      </div>

      <Form.Item
        label="Meta Title"
        name="meta_title"
        rules={[{ required: true, message: "Meta title required." }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Meta Description"
        name="meta_description"
        rules={[{ required: true, message: "Meta description required." }]}
      >
        <Input.TextArea rows={4} />
      </Form.Item>

      <Form.Item
        label="Meta Keywords"
        name="meta_keywords"
        rules={[{ required: true, message: "Meta keywords required." }]}
      >
        <Input />
      </Form.Item>
    </>
  );
};

export default FormSeo;
