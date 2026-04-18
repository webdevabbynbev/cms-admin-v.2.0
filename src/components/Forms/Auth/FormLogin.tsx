import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Form, Input, Button, message } from "antd"
import { ArrowRightOutlined } from "@ant-design/icons"
import api from "../../../api/http"

interface LoginValues {
  identifier: string
  password: string
}

export function FormLogin() {
  const [form] = Form.useForm<LoginValues>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: LoginValues) => {
    try {
      setLoading(true)
      const identifier = values.identifier.trim()
      const payload = {
        email: identifier,
        password: values.password,
      }
      const res = await api.post("/auth/login-admin", payload)
      if (res && (res.data?.serve || res.data?.token)) {
        const sessionData = res.data.serve || res.data
        localStorage.setItem("session", JSON.stringify(sessionData))
        message.success("Login successful!")
        navigate("/dashboard", { replace: true })
      } else {
        message.error("Login failed: Invalid response from server")
      }
    } catch (error: any) {
      
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.message ||
        error?.message ||
        "Login failed"
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = (errorInfo: unknown) => {
    
  }

  return (
    <Form<LoginValues>
      autoComplete="off"
      form={form}
      name="basic"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="Email / Username"
        name="identifier"
        rules={[
          { required: true, message: "Email or username required" },
        ]}
      >
        <Input
          placeholder="Enter your email or username"
          autoComplete="username"
        />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Password required." }]}
      >
        <Input.Password
          placeholder="Enter your password"
          autoComplete="new-password"
        />
      </Form.Item>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Button type="primary" htmlType="submit" loading={loading}>
          Sign In <ArrowRightOutlined />
        </Button>
        <Button type="link" href="/forgot">
          Forgot password?
        </Button>
      </div>
    </Form>
  )
}
