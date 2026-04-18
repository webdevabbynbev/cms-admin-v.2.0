import React from "react";
import { Form, Input, Button, Select, message, Checkbox, Divider } from "antd";
import http from "../../../api/http";
import { adminCreateSchema, adminEditSchema } from "./adminSchema";

const PERMISSION_SECTIONS = [
  {
    key: "reports",
    label: "Laporan (Dashboard)",
    items: [
      { value: "reports", label: "Laporan (Dashboard)" },
      { value: "reports_sales", label: "Laporan Penjualan" },
      { value: "reports_transaction", label: "Laporan Transaksi" },
      { value: "reports_revenue", label: "Laporan Pendapatan" },
      { value: "reports_customer", label: "Laporan Pelanggan" },
      { value: "reports_inventory", label: "Laporan Inventaris" },
    ],
  },
  {
    key: "system",
    label: "E-commerce & Customers",
    items: [
      { value: "admin", label: "Admin Management" },
      { value: "ecommerce_users", label: "Users E-commerce" },
      { value: "customers", label: "Customer List" },
    ],
  },
  {
    key: "product",
    label: "Product & Inventory",
    items: [
      { value: "product", label: "Modul Product (Parent)" },
      { value: "master_product", label: "Daftar Product" },
      { value: "inventory_product", label: "Inventory" },
      { value: "stock_movement", label: "Stock Movement" },
      { value: "persona", label: "Persona" },
      { value: "tag", label: "Tag" },
      { value: "category_types", label: "Category Types" },
      { value: "products_media", label: "Product Media Upload" },
    ],
  },
  {
    key: "categories",
    label: "Product Categories (Concern/Profile)",
    items: [
      { value: "concern_category", label: "Concern Category (Modul)" },
      { value: "concern", label: "Concern Item" },
      { value: "concern_option", label: "Concern Option" },
      { value: "profile_category", label: "Profile Category (Modul)" },
      { value: "profile_category_filter", label: "Filter Profile" },
      { value: "profile_category_option", label: "Option Profile" },
    ],
  },
  {
    key: "brand",
    label: "Brand Management",
    items: [
      { value: "brand", label: "Brand (Modul Parent)" },
      { value: "brand_list", label: "Daftar Brand" },
      { value: "brand_bulk_logo", label: "Brand Bulk Upload Logo" },
      { value: "brand_bulk_banner", label: "Brand Bulk Upload Banner" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing & Promotions",
    items: [
      { value: "marketing", label: "Modul Marketing (Parent)" },
      { value: "voucher", label: "Voucher" },
      { value: "referral_codes", label: "Referral Codes" },
      { value: "sale_products", label: "Sale Products" },
      { value: "flash_sale", label: "Flash Sale" },
      { value: "discounts", label: "Diskon" },
      { value: "b1g1", label: "B1G1 (Buy One Get One)" },
      { value: "gift_products", label: "Gift Products" },
      { value: "ned", label: "NED (Near Expired Date)" },
      { value: "abby_picks", label: "Abby Picks" },
      { value: "bev_picks", label: "Bev Picks" },
      { value: "top_picks_promo", label: "Top Picks Promo" },
    ],
  },
  {
    key: "ramadan",
    label: "Ramadan Event",
    items: [
      { value: "ramadan_event", label: "Modul Ramadan Event" },
      { value: "ramadan_participant", label: "Peserta Event" },
      { value: "ramadan_recommendation", label: "Rekomendasi Product" },
    ],
  },
  {
    key: "content",
    label: "Transaction & CMS Content",
    items: [
      { value: "transactions", label: "Transaction" },
      { value: "content_manager", label: "Content Manager (Modul Parent)" },
      { value: "banners", label: "Banner" },
      { value: "faqs", label: "FAQ" },
      { value: "tnc", label: "Terms & Conditions" },
      { value: "privacy_policy", label: "Privacy Policy" },
      { value: "return_policy", label: "Return Policy" },
      { value: "contact_us", label: "Contact Us" },
      { value: "about_us", label: "About Us" },
    ],
  },
  {
    key: "settings",
    label: "System Logs & Settings",
    items: [
      { value: "activity_logs", label: "Activity Log" },
      { value: "settings", label: "Settings" },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_SECTIONS.flatMap((s) => s.items.map((i) => i.value));

type AdminFormProps = {
  data?: {
    id: number | string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: number | string;
    permissions?: string;
  };
  handleClose: () => void;
  onFormChange?: () => void;
};

type AdminFormValues = {
  id?: number | string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: number;
  permissions?: string[];
};

const { Option } = Select;

const FormAdmin: React.FC<AdminFormProps> = ({
  data,
  handleClose,
  onFormChange,
}) => {
  const [form] = Form.useForm<AdminFormValues>();
  const isEdit = Boolean(data?.id);
  const [emailCheckLoading, setEmailCheckLoading] = React.useState(false);
  const [checkedPermissions, setCheckedPermissions] = React.useState<string[]>(() => {
    if (!data?.permissions) return [];
    try {
      const parsed = JSON.parse(data.permissions);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object" && parsed !== null)
        return Object.keys(parsed).filter((k) => parsed[k] === true);
    } catch { /* empty */ }
    return [];
  });

  const updatePermissions = (next: string[]) => {
    setCheckedPermissions(next);
    form.setFieldsValue({ permissions: next });
    onFormChange?.();
  };

  const toggleItem = (value: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...checkedPermissions, value])]
      : checkedPermissions.filter((v) => v !== value);
    updatePermissions(next);
  };

  const splitName = (full?: string) => {
    if (!full) return { first: "", last: "" };
    const normalized = full.trim().replace(/\s+/g, " ");
    const parts = normalized.split(" ");
    if (parts.length === 1) return { first: parts[0], last: "" };
    return {
      first: parts.slice(0, -1).join(" "),
      last: parts.slice(-1).join(" "),
    };
  };

  const init = React.useMemo<AdminFormValues>(() => {
    let firstName = "";
    let lastName = "";
    let permissions: string[] = [];

    if (data?.firstName || data?.lastName) {
      firstName = data.firstName ?? "";
      lastName = data.lastName ?? "";
    } else if (data?.name) {
      const { first, last } = splitName(data.name);
      firstName = first;
      lastName = last;
    }

    if (data?.permissions) {
      try {
        const parsed = JSON.parse(data.permissions);
        if (Array.isArray(parsed)) {
          permissions = parsed;
        } else if (typeof parsed === "object" && parsed !== null) {
          permissions = Object.keys(parsed).filter((k) => parsed[k] === true);
        }
      } catch (e) {
        
      }
    }

    return {
      id: data?.id,
      firstName: firstName,
      lastName: lastName,
      email: data?.email ?? "",
      password: "",
      role:
        typeof data?.role === "string"
          ? parseInt(data!.role, 10)
          : ((data?.role as number) ?? 1),
      permissions: permissions,
    };
  }, [data]);

  const validateEmailUnique = async (_: unknown, value: string) => {
    if (!value) return Promise.resolve();
    const trimmedEmail = value.trim();
    if (isEdit && trimmedEmail === data?.email?.trim()) {
      return Promise.resolve();
    }
    setEmailCheckLoading(true);
    try {
      const resp = await http.get(
        `/admin/users?q=${encodeURIComponent(trimmedEmail)}&per_page=1`,
      );
      const serve = resp?.data?.serve;
      const users = (serve?.data || []) as any[];
      const exactMatch = users.find(
        (u: any) => u.email?.toLowerCase() === trimmedEmail.toLowerCase(),
      );
      if (exactMatch && (!isEdit || exactMatch.id !== data?.id)) {
        return Promise.reject(new Error("Email sudah terdaftar"));
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.resolve();
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const onFinish = async (values: AdminFormValues) => {
    // Zod validation
    const schema = isEdit ? adminEditSchema : adminCreateSchema;
    const parsed = schema.safeParse({ ...values, role: Number(values.role) });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      message.error(firstError.message);
      return;
    }

    try {
      const permissionsObj: any = {};
      values.permissions?.forEach((k) => {
        permissionsObj[k] = true;
      });

      if (isEdit) {
        const payload = {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          role: Number(values.role),
          isActive: 1,
          password:
            values.password && values.password.trim().length > 0
              ? values.password
              : null,
          permissions: permissionsObj,
        };

        await http.put(`/admin/users/${values.id}`, payload);
        message.success("Success! Information updated.");
      } else {
        const payload = {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          role: Number(values.role),
          password: values.password,
          isActive: 1,
          permissions: permissionsObj,
        };

        await http.post(`/admin/users`, payload);
        message.success("Success! User created.");
      }

      form.resetFields();
      setCheckedPermissions([]);
      handleClose();
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: { message?: string; serve?: Array<{ message?: string }> };
        };
      };
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.serve?.[0]?.message ||
        "Submission failed, please try again!";
      message.error(serverMsg);
    }
  };

  return (
    <Form<AdminFormValues>
      key={data?.id || "create"}
      form={form}
      initialValues={init}
      name="adminForm"
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={() => onFormChange?.()}
    >
      <Form.Item name="id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        label="First Name"
        name="firstName"
        rules={[
          { required: true, message: "First name wajib diisi" },
          { max: 50, message: "First name maksimal 50 karakter" },
          { pattern: /^[a-zA-Z\s]+$/, message: "First name hanya boleh berisi huruf" },
        ]}
      >
        <Input placeholder="Enter first name" />
      </Form.Item>

      <Form.Item
        label="Last Name"
        name="lastName"
        rules={[
          { required: true, message: "Last name wajib diisi" },
          { max: 50, message: "Last name maksimal 50 karakter" },
          { pattern: /^[a-zA-Z\s]+$/, message: "Last name hanya boleh berisi huruf" },
        ]}
      >
        <Input placeholder="Enter last name" />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        validateTrigger={["onBlur"]}
        validateFirst
        hasFeedback
        rules={[
          { required: true, message: "Email wajib diisi" },
          {
            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            message: "Format email tidak valid (contoh: user@mail.com)",
          },
          { validator: validateEmailUnique },
        ]}
      >
        <Input
          placeholder="email@example.com"
          suffix={
            emailCheckLoading ? <span className="animate-spin">⌛</span> : null
          }
        />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        tooltip={isEdit ? "Kosongkan jika tidak ingin mengubah password" : undefined}
        rules={[
          {
            validator: async (_: unknown, value: string) => {
              const schema = isEdit ? adminEditSchema.shape.password : adminCreateSchema.shape.password;
              const result = schema.safeParse(value);
              if (!result.success) return Promise.reject(new Error(result.error.issues[0].message));
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input.Password
          placeholder={
            isEdit ? "Kosongkan jika tidak ingin mengubah password" : "Enter password"
          }
          autoComplete="new-password"
        />
      </Form.Item>

      <Form.Item name="role" label="Role" rules={[{ required: true, message: "Role wajib dipilih" }]}>
        <Select placeholder="Select role">
          <Option value={1}>Admin</Option>
          <Option value={3}>Gudang</Option>
          <Option value={4}>Finance</Option>
          <Option value={5}>Media</Option>
          <Option value={6}>Cashier n Gudang</Option>
          <Option value={7}>Cashier</Option>
        </Select>
      </Form.Item>

      <Divider orientation="left">Module Access</Divider>

      {/* Hidden form field to store permissions value */}
      <Form.Item name="permissions" hidden><Input /></Form.Item>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        {/* Master checkbox */}
        <div style={{ padding: '10px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <Checkbox
            checked={checkedPermissions.length === ALL_PERMISSIONS.length}
            indeterminate={checkedPermissions.length > 0 && checkedPermissions.length < ALL_PERMISSIONS.length}
            onChange={(e) => updatePermissions(e.target.checked ? [...ALL_PERMISSIONS] : [])}
          >
            <strong>Pilih Semua Permission</strong>
          </Checkbox>
        </div>

        {/* Sections */}
        {PERMISSION_SECTIONS.map((section, idx) => {
          const sectionValues = section.items.map((i) => i.value);
          const checkedInSection = sectionValues.filter((v) => checkedPermissions.includes(v));
          const allChecked = checkedInSection.length === sectionValues.length;
          const indeterminate = checkedInSection.length > 0 && !allChecked;

          return (
            <div
              key={section.key}
              style={{
                borderBottom: idx < PERMISSION_SECTIONS.length - 1 ? '1px solid #f0f0f0' : 'none',
                padding: '12px 16px',
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <Checkbox
                  checked={allChecked}
                  indeterminate={indeterminate}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...new Set([...checkedPermissions, ...sectionValues])]
                      : checkedPermissions.filter((v) => !sectionValues.includes(v));
                    updatePermissions(next);
                  }}
                >
                  <strong style={{ fontSize: 13 }}>{section.label}</strong>
                </Checkbox>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 0', paddingLeft: 24 }}>
                {section.items.map((item) => (
                  <div key={item.value} style={{ width: '50%' }}>
                    <Checkbox
                      checked={checkedPermissions.includes(item.value)}
                      onChange={(e) => toggleItem(item.value, e.target.checked)}
                    >
                      {item.label}
                    </Checkbox>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormAdmin;
