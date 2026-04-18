import { Form } from "antd";
import useDiscountFormPage, {
  type Props,
} from "../../hooks/discount/useDiscountFormPage";
import DiscountForm from "../../components/Forms/Discount/DiscountForm";

export default function DiscountFormPage({ mode }: Props) {
  const [form] = Form.useForm();
  const vm = useDiscountFormPage({ mode, form });

  return <DiscountForm mode={mode} form={form} vm={vm} />;
}
