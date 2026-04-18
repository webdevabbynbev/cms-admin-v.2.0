import React, { useCallback, useEffect } from "react";
import { Form, Button, Card, message, Grid } from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import http from "../../../api/http";

type AboutUsData = {
  value: string;
};

const FormAboutUs: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [form] = Form.useForm<AboutUsData>();
  const fetchAboutUs = useCallback(async (): Promise<void> => {
    try {
      const response = await http.get("/admin/about-us");
      const data = response?.data?.serve;

      if (data?.value) {
        form.setFieldsValue({ value: data.value });
      } else {
        
      }
    } catch (error) {
      
      message.error("Failed to load About Us data");
    }
  }, [form]);
  useEffect(() => {
    fetchAboutUs();
  }, [fetchAboutUs]);
  const onFinish = async (values: AboutUsData): Promise<void> => {
    try {
      const res = await http.post("/admin/about-us", values, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res) {
        message.success("About Us updated successfully!");
        fetchAboutUs();
      }
    } catch (error) {
      
      message.error("Submission failed, please try again!");
    }
  };

  return (
    <Card title="About Us Form" style={{ marginTop: 10 }}>
      <Form<AboutUsData>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ width: "100%" }}
      >
        <Form.Item
          name="value"
          label="About Us Content"
          rules={[{ required: true, message: "About Us content is required" }]}
        >
          <ReactQuill
            theme="snow"
            value={form.getFieldValue("value")}
            onChange={(value) => form.setFieldsValue({ value })}
            style={{ height: "20rem", width: "100%" }}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: isMobile ? "5rem" : "3.5rem" }}>
          <Button type="primary" htmlType="submit" shape="round">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FormAboutUs;
