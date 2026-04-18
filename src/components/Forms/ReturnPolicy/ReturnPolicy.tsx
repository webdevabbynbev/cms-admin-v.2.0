import React, { useCallback, useEffect } from "react";
import { Form, Button, Card, message, Grid } from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import http from "../../../api/http";

type ReturnPolicyData = {
  value: string;
};

const FormReturnPolicy: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [form] = Form.useForm<ReturnPolicyData>();
  const fetchReturnPolicy = useCallback(async (): Promise<void> => {
    try {
      const response = await http.get("/admin/return-policy");
      const data = response?.data?.serve;

      if (data?.value) {
        form.setFieldsValue({ value: data.value });
      } else {
        
      }
    } catch (error) {
      
      message.error("Failed to load Return Policy data");
    }
  }, [form]);
  useEffect(() => {
    fetchReturnPolicy();
  }, [fetchReturnPolicy]);

  const onFinish = async (values: ReturnPolicyData): Promise<void> => {
    try {
      const res = await http.post("/admin/return-policy", values, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res) {
        message.success("Return Policy updated successfully!");
        fetchReturnPolicy();
      }
    } catch (error) {
      
      message.error("Submission failed, please try again!");
    }
  };

  return (
    <Card title="Return Policy Form" style={{ marginTop: 10 }}>
      <Form<ReturnPolicyData>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ width: "100%" }}
      >
        <Form.Item
          name="value"
          label="Return Policy content"
          rules={[{ required: true, message: "Return Policy content is required" }]}
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

export default FormReturnPolicy;
