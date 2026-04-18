import React, { useCallback, useEffect } from "react";
import { Form, Button, Card, message, Grid } from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import http from "../../../api/http";

type ContactUsData = {
  value: string;
};

const FormContactUs: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [form] = Form.useForm<ContactUsData>();
  const fetchContactUs = useCallback(async (): Promise<void> => {
    try {
      const response = await http.get("/admin/contact-us");
      const data = response?.data?.serve;

      if (data?.value) {
        form.setFieldsValue({ value: data.value });
      } else {
        
      }
    } catch (error) {
      
      message.error("Failed to load Contact Us data");
    }
  }, [form]);
  useEffect(() => {
    fetchContactUs();
  }, [fetchContactUs]);

  const onFinish = async (values: ContactUsData): Promise<void> => {
    try {
      const res = await http.post("/admin/contact-us", values, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res) {
        message.success("Contact Us updated successfully!");
        fetchContactUs();
      }
    } catch (error) {
      
      message.error("Submission failed, please try again!");
    }
  };

  return (
    <Card title="Contact Us Form" style={{ marginTop: 10 }}>
      <Form<ContactUsData>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ width: "100%" }}
      >
        <Form.Item
          name="value"
          label="Contact Us Content"
          rules={[{ required: true, message: "Contact Us content is required" }]}
        >
          <ReactQuill
            theme="snow"
            value={form.getFieldValue("value")}
            onChange={(value) => form.setFieldsValue({ value })}
            style={{ height: "20rem", width: "100%" }}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: isMobile ? "5rem" : "3.5rem" }}>
          <Button
            type="primary"
            htmlType="submit"
            shape="round"
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FormContactUs;
