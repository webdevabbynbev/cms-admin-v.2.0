import React from "react";
import { Form, Input, Button, InputNumber, DatePicker, Switch } from "antd";
import { useReferralCodeForm } from "../../../hooks/referral/useReferralCodeForm";
import type { ReferralCodeFormValues } from "../../../services/api/referral/referral.payload.service";
import type { ReferralCodeRecord } from "../../../services/api/referral/referral.types";

type FormReferralCodeProps = {
  data?: ReferralCodeRecord | null;
  handleClose: () => void;
};

const FormReferralCode: React.FC<FormReferralCodeProps> = ({
  data,
  handleClose,
}) => {
  const { form, handleSubmit } = useReferralCodeForm(data, handleClose);

  return (
    <Form<ReferralCodeFormValues>
      autoComplete="off"
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        label="Kode Referral"
        name="code"
        rules={[
          { required: true, message: "Kode wajib diisi" },
          {
            pattern: /^[A-Za-z0-9]{3,32}$/,
            message: "Kode harus alphanumeric (3-32 karakter)",
          },
        ]}
        extra="Kode akan otomatis diubah menjadi uppercase."
      >
        <Input placeholder="Contoh: ABBY10" />
      </Form.Item>

      <Form.Item
        label="Diskon (%)"
        name="discount_percent"
        rules={[{ required: true, message: "Diskon wajib diisi" }]}
      >
        <InputNumber min={1} max={100} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        label="Total Qty Referral"
        name="max_uses_total"
        rules={[{ required: true, message: "Total qty wajib diisi" }]}
      >
        <InputNumber
          min={1}
          precision={0}
          style={{ width: "100%" }}
          placeholder="Contoh: 100"
        />
      </Form.Item>

      <Form.Item
        label="Status Referral"
        name="is_active"
        valuePropName="checked"
      >
        <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
      </Form.Item>

      <Form.Item label="Mulai" name="started_at">
        <DatePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item label="Berakhir" name="expired_at">
        <DatePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Simpan
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormReferralCode;
