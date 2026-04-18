import { useState } from "react"
import { Form, Input, Button, message } from "antd"
import { ArrowRightOutlined } from "@ant-design/icons"
import type { FormInstance } from "antd/es/form"
import http from "../../../api/http"

interface ForgotValues {
  email: string
}

export function FormForgot() {
  const [form] = Form.useForm<ForgotValues>()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: ForgotValues) => {
    try {
      setLoading(true)
      const res = await http.post("/auth/forgot", values)
      if (res) {
        message.success("Password reset link sent to your email!")
        await form.resetFields()
      } else {
        message.error("Failed to send reset link. Please try again.")
      }
    } catch (error: any) {
      
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to send reset link"
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = (errorInfo: unknown) => {
    
  }

  return (
    <Form<ForgotValues>
      autoComplete="off"
      form={form as FormInstance<ForgotValues>}
      name="forgot"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item<ForgotValues>
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Email required." },
          { type: "email", message: "Email not valid" },
        ]}
      >
        <Input placeholder="Input email here" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Send link <ArrowRightOutlined />
        </Button>
      </Form.Item>
    </Form>
  )
}
