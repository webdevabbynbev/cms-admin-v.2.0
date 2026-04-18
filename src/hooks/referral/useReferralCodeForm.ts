import { useEffect } from "react";
import { Form, message } from "antd";
import {
  buildReferralCodePayload,
  defaultReferralFormValues,
  mapReferralRecordToFormValues,
  type ReferralCodeFormValues,
} from "../../services/api/referral/referral.payload.service";
import type { ReferralCodeRecord } from "../../services/api/referral/referral.types";
import { createReferralCode, updateReferralCode } from "../../api/referral";

export const useReferralCodeForm = (
  data?: ReferralCodeRecord | null,
  onSuccess?: () => void,
) => {
  const [form] = Form.useForm<ReferralCodeFormValues>();

  useEffect(() => {
    if (!data) {
      form.resetFields();
      form.setFieldsValue(defaultReferralFormValues);
      return;
    }
    form.setFieldsValue(mapReferralRecordToFormValues(data));
  }, [data, form]);

  const handleSubmit = async (values: ReferralCodeFormValues) => {
    const payload = buildReferralCodePayload(values);

    try {
      if (data?.id) {
        await updateReferralCode(data.id, payload);
      } else {
        await createReferralCode(payload);
      }
      form.resetFields();
      onSuccess?.();
      message.success("Referral code berhasil disimpan");
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ?? "Gagal menyimpan referral code",
      );
    }
  };

  return { form, handleSubmit };
};
