import React, { useCallback, useEffect } from "react";
import { Form, Button, Card, message, Grid } from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import http from "../../../api/http";

type PrivacyPolicyData = {
  value: string;
};

const FormPrivacyPolicy: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [form] = Form.useForm<PrivacyPolicyData>();
  const fetchPrivacyPolicy = useCallback(async (): Promise<void> => {
    try {
      const response = await http.get("/admin/privacy-policy");
      const data = response?.data?.serve;

      if (data?.value) {
        form.setFieldsValue({ value: data.value });
      } else {
        
      }
    } catch (error) {
      
      message.error("Failed to load privacy policy data");
    }
  }, [form]);
  useEffect(() => {
    fetchPrivacyPolicy();
  }, [fetchPrivacyPolicy]);

  const onFinish = async (values: PrivacyPolicyData): Promise<void> => {
    try {
      const res = await http.post("/admin/privacy-policy", values, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res) {
        message.success("Privacy policy updated successfully!");
        fetchPrivacyPolicy();
      }
    } catch (error) {
      
      message.error("Submission failed, please try again!");
    }
  };

  return (
    <Card title="Privacy Policy Form" style={{ marginTop: 10 }}>
      <Form<PrivacyPolicyData>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ width: "100%" }}
      >
        <Form.Item
          name="value"
          label="Privacy Policy Content"
          rules={[{ required: true, message: "Privacy policy content is required" }]}
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

export default FormPrivacyPolicy;
