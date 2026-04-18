import React from "react";
import {
  Button,
  Input,
  Row,
  Col,
  Table,
  Select,
  InputNumber,
  Divider,
  Modal,
  Form,
  message,
  Tooltip,
  Image,
} from "antd";
import { PlusOutlined, DeleteOutlined, QuestionCircleOutlined, UploadOutlined, EditOutlined, CopyOutlined } from "@ant-design/icons";
import http from "../../../api/http";
import helper from "../../../utils/helper";
import { UPLOAD_PATHS } from "../../../constants/uploadPaths";

const { Option, OptGroup } = Select;

const InlineEditCell: React.FC<{
  value: string | undefined;
  placeholder?: string;
  onChange: (val: string) => void;
}> = ({ value, placeholder, onChange }) => {
  const [editing, setEditing] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const inputRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onPressEnter={() => setEditing(false)}
        size="small"
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        width: "100%",
        padding: "2px 8px",
        borderRadius: 6,
        cursor: "text",
        border: "1px solid #d9d9d9",
        background: "#fafafa",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <span style={{
        flex: 1,
        fontSize: 13,
        color: value ? "#222" : "#bbb",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {value || placeholder}
      </span>

      {hovered && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            gap: 2,
            paddingInline: 4,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            background: "rgba(255,255,255,0.55)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="Edit" placement="top">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: 14, color: "#1677ff" }} />}
              onClick={() => setEditing(true)}
              style={{ padding: "0 5px", height: 22, borderRadius: 4 }}
            />
          </Tooltip>
          <Tooltip title="Copy" placement="top">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ fontSize: 14, color: "#888" }} />}
              onClick={() => {
                if (value) {
                  navigator.clipboard.writeText(value);
                  message.success("Disalin", 1);
                }
              }}
              style={{ padding: "0 5px", height: 22, borderRadius: 4 }}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

type AttrValueOption = { value: number; label: string };

export type AttributeRow = {
  attribute_id: number | null;
  values: AttrValueOption[];
};

type AllAttribute = {
  value: number;
  label: string;
  options: AttrValueOption[];
};

export type CombinationRow = {
  key: number;
  id?: number;
  combination: Array<number | string>;
  display: string[];
  base_price?: string;
  price: string;
  stock: number | null;
  sku: string;
  sku_variant_1?: string;
  barcode: string;
  weight?: number;
  bpom?: string;
  photo_variant?: string;
  skintone?: string;
  undertone?: string;
  finish?: string;
  warna?: string;
  perfume_for?: string;
  main_accords?: string[];
  top_notes?: string[];
  middle_notes?: string[];
  base_notes?: string[];
  concern_option_ids?: number[];
  profile_category_option_ids?: number[];
};

type Props = {
  attributes: AttributeRow[];
  setAttributes: React.Dispatch<React.SetStateAction<AttributeRow[]>>;
  combinations: CombinationRow[];
  setCombinations: React.Dispatch<React.SetStateAction<CombinationRow[]>>;
  isMakeup?: boolean;
  isPerfume?: boolean;
  isSkincare?: boolean;
  showSectionTitle?: boolean;
};

const FormAttribute: React.FC<Props> = ({
  attributes,
  setAttributes,
  combinations,
  setCombinations,
  isMakeup,
  isPerfume,
  isSkincare,
  showSectionTitle = true,
}) => {
  const [attrName, setAttrName] = React.useState<string>("");
  const [attrValue, setAttrValue] = React.useState<string>("");
  const [allAttributes, setAllAttributes] = React.useState<AllAttribute[]>([]);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingKey, setEditingKey] = React.useState<string | number | null>(null);
  const [modalForm] = Form.useForm();
  const photoVariantUrl = Form.useWatch("photo_variant", modalForm);

  // Skincare Options States
  const [concernGroups, setConcernGroups] = React.useState<any[]>([]);
  const [profileGroups, setProfileGroups] = React.useState<any[]>([]);
  const [loadingSkincare, setLoadingSkincare] = React.useState(false);
  const [newSkintone, setNewSkintone] = React.useState("");
  const [newUndertone, setNewUndertone] = React.useState("");
  const [creatingOption, setCreatingOption] = React.useState(false);

  React.useEffect(() => {
    fetchAttributeName();
    if (isSkincare) {
      fetchSkincareOptions();
    }
  }, [isSkincare]);

  const fetchSkincareOptions = async () => {
    try {
      setLoadingSkincare(true);
      const [concernsAll, profileOptsAllRaw] = await Promise.all([
        helper.fetchAllPages<any>("/admin/concern"),
        helper.fetchAllPages<any>("/admin/profile-categories"),
      ]);

      const profileGroupsMerged: any[] = [];
      profileOptsAllRaw.forEach((group: any) => {
        const existing = profileGroupsMerged.find(g => (g.name || "").toLowerCase() === (group.name || "").toLowerCase());
        if (existing) {
          existing.options = [...(existing.options || []), ...(group.options || group.profile_category_options || group.profileOptions || [])];
        } else {
          profileGroupsMerged.push({
            ...group,
            options: group.options || group.profile_category_options || group.profileOptions || []
          });
        }
      });

      setConcernGroups(concernsAll);
      setProfileGroups(profileGroupsMerged);
    } catch (e) {
      
    } finally {
      setLoadingSkincare(false);
    }
  };

  const fetchAttributeName = async () => {
    const res = await http.get("/admin/attribute/list");
    const serve: any[] = res?.data?.serve ?? [];
    if (Array.isArray(serve) && serve.length > 0) {
      const formatted: AllAttribute[] = serve.map((attr: any) => ({
        value: Number(attr.id),
        label: String(attr.name),
        options: Array.isArray(attr.values)
          ? attr.values.map((v: any) => ({
            value: Number(v.id),
            label: String(v.value),
          }))
          : [],
      }));
      setAllAttributes(formatted);
    } else {
      setAllAttributes([]);
    }
  };

  const handleAttributeChange = <
    K extends keyof AttributeRow,
    V extends AttributeRow[K]
  >(
    index: number,
    key: K,
    value: V
  ) => {
    setAttributes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const generateCombinations = () => {
    // Ignore empty attributes to avoid clearing combinations accidentally
    const filteredAttributes = attributes.filter(attr => (attr.values ?? []).length > 0);
    const valuesList: number[][] = filteredAttributes.map((attr) =>
      (attr.values ?? []).map((v) => Number(v.value))
    );

    const combos = cartesianProduct(valuesList);
    const defaultBasePrice = combinations[0]?.base_price ?? "";
    const defaultWeight = combinations[0]?.weight ?? 0;

    const next: CombinationRow[] = combos.map((combo, idx) => {
      // Improved matching:
      // 1. Try exact match
      // 2. If existing only has 1 variant and new also has matching items, or if it's the only one, try to map it.
      let exists = combinations.find(
        (c) => JSON.stringify(c.combination) === JSON.stringify(combo)
      );

      // Fallback: If no exact match and we only had one variant previously, 
      // check if this new combo is a "successor" (contains the old ID if there was only one attr, 
      // or just take the first one if the user is just adding/changing the root variant).
      if (!exists && combinations.length === 1) {
        const single = combinations[0];
        // If the new combo contains all attribute IDs from the old one, it's likely the same
        const isSuccessor = single.combination.every(id => combo.includes(Number(id)));
        if (isSuccessor || (single.combination.length === 0 && combos.length === 1)) {
          exists = single;
        }
      }

      const display = combo.map((id, i) => {
        const a = filteredAttributes[i];
        const found = a?.values?.find((v) => Number(v.value) === Number(id));
        return found ? found.label : String(id);
      });

      return {
        key: idx,
        id: exists ? exists.id : undefined,
        combination: combo,
        display,
        base_price: exists ? exists.base_price : defaultBasePrice,
        price: exists ? exists.price : "",
        stock: exists ? exists.stock : null,
        weight: exists ? (exists.weight ?? 0) : defaultWeight,
        sku: exists ? exists.sku : "",
        sku_variant_1: exists ? (exists.sku_variant_1 ?? "") : "",
        barcode: exists ? exists.barcode : "",
        bpom: exists ? exists.bpom : "",
        skintone: exists ? exists.skintone : undefined,
        undertone: exists ? exists.undertone : undefined,
        finish: exists ? exists.finish : undefined,
        warna: exists ? exists.warna : undefined,
        perfume_for: exists ? exists.perfume_for : undefined,
        main_accords: exists ? exists.main_accords : undefined,
        top_notes: exists ? exists.top_notes : undefined,
        middle_notes: exists ? exists.middle_notes : undefined,
        base_notes: exists ? exists.base_notes : undefined,
        concern_option_ids: exists ? exists.concern_option_ids : undefined,
        profile_category_option_ids: exists ? exists.profile_category_option_ids : undefined,
        photo_variant: exists ? exists.photo_variant : undefined,
      };
    });

    setCombinations(next);
  };

  const handleCombinationChange = (
    key: number,
    field: keyof CombinationRow,
    value: CombinationRow[typeof field]
  ) => {
    setCombinations((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c) => c.key === key);
      if (idx >= 0) {
        next[idx] = { ...next[idx], [field]: value } as CombinationRow;
      }
      return next;
    });
  };

  const openOptionModal = (key: number) => {
    const combo = combinations.find((c) => c.key === key);
    if (!combo) return;
    setEditingKey(key);
    modalForm.setFieldsValue({
      sku_variant_1: combo.sku_variant_1,
      photo_variant: combo.photo_variant,
      bpom: combo.bpom,
      skintone: combo.skintone ? combo.skintone.split('|').map((s) => s.trim()).filter(Boolean) : [],
      undertone: combo.undertone ? combo.undertone.split('|').map((s) => s.trim()).filter(Boolean) : [],
      finish: combo.finish ? combo.finish.split('|').map((s) => s.trim()).filter(Boolean) : [],
      warna: combo.warna ? combo.warna.split('|').map((s) => s.trim()).filter(Boolean) : [],
      perfume_for: combo.perfume_for,
      main_accords: combo.main_accords,
      top_notes: combo.top_notes,
      middle_notes: combo.middle_notes,
      base_notes: combo.base_notes,
      concern_option_ids: combo.concern_option_ids,
      skintone_ids: combo.profile_category_option_ids?.filter(id => {
        const group = profileGroups.find(g => {
          const n = (g.name || "").toLowerCase().replace(/\s+/g, "");
          return n.includes("skintone");
        });
        const opts = group?.options || group?.profile_options || group?.profileOptions || group?.profile_category_options || group?.profileCategoryOptions || [];
        return opts.some((o: any) => Number(o.id) === Number(id));
      }),
      undertone_ids: combo.profile_category_option_ids?.filter(id => {
        const group = profileGroups.find(g => {
          const n = (g.name || "").toLowerCase().replace(/\s+/g, "");
          return n.includes("undertone");
        });
        const opts = group?.options || group?.profile_options || group?.profileOptions || group?.profile_category_options || group?.profileCategoryOptions || [];
        return opts.some((o: any) => Number(o.id) === Number(id));
      }),
    });
    setModalVisible(true);
  };

  const handleModalSave = () => {
    if (editingKey === null) return;
    modalForm.validateFields().then((vals) => {
      setCombinations((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => c.key === editingKey);
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            sku_variant_1: vals.sku_variant_1,
            photo_variant: vals.photo_variant,
            bpom: vals.bpom,
            ...(isMakeup ? {
              skintone: Array.isArray(vals.skintone) ? vals.skintone.join('|') : (vals.skintone || undefined),
              undertone: Array.isArray(vals.undertone) ? vals.undertone.join('|') : (vals.undertone || undefined),
              finish: Array.isArray(vals.finish) ? vals.finish.join('|') : (vals.finish || undefined),
              warna: Array.isArray(vals.warna) ? vals.warna.join('|') : (vals.warna || undefined),
            } : {}),
            ...(isPerfume ? {
              perfume_for: vals.perfume_for,
              main_accords: vals.main_accords,
              top_notes: vals.top_notes,
              middle_notes: vals.middle_notes,
              base_notes: vals.base_notes,
            } : {}),
            ...(isSkincare ? {
              concern_option_ids: vals.concern_option_ids,
              profile_category_option_ids: [
                ...(vals.skintone_ids || []),
                ...(vals.undertone_ids || [])
              ],
            } : {}),
          };
        }
        return next;
      });
      setModalVisible(false);
      message.success("Varian berhasil disimpan");
      // We don't null editingKey immediately to keep title during close animation
      setTimeout(() => setEditingKey(null), 300);
    }).catch(err => {
      
    });
  };

  const currentCombination = combinations.find((c) => c.key === editingKey);
  const activeAttributes = attributes.filter((a) => a.attribute_id !== null);
  const selectedAttributeLabels = activeAttributes
    .map((attr) => allAttributes.find((all) => all.value === attr.attribute_id)?.label)
    .filter((label): label is string => Boolean(label));
  const displayMainColumnTitle =
    selectedAttributeLabels.length > 0
      ? selectedAttributeLabels.join(" / ")
      : "Combination / Display Name";

  return (
    <>
      {showSectionTitle && (
        <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>
          Variants
        </div>
      )}

      {attributes.map((attribute, index) => (
        <Row
          gutter={[12, 12]}
          key={index}
          style={{ marginBottom: 10, alignItems: "flex-start" }}
        >
          <Col flex="0 0 auto">
            <Select<number>
              popupMatchSelectWidth={false}
              style={{ width: "auto" }}
              placeholder="Select Attribute"
              showSearch
              value={attribute.attribute_id ?? undefined}
              onChange={(val) => handleAttributeChange(index, "attribute_id", val)}
              onSearch={(val) => setAttrName(val)}
              filterOption={(input, option) =>
                (option?.children ? String(option.children) : "").toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: "4px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "nowrap",
                      padding: 8,
                      gap: 10,
                    }}
                  >
                    <Input
                      style={{ flex: "auto", width: "auto", maxWidth:160 }}
                      value={attrName}
                      placeholder="Enter variant name..."
                      onChange={(e) => setAttrName(e.target.value)}
                    />
                    <Button
                      icon={<PlusOutlined />}
                      type="primary"
                      onClick={async () => {
                        if (!attrName.trim()) return;
                        const res = await http.post("/admin/attribute", {
                          name: attrName,
                        });
                        if (res) {
                          await fetchAttributeName();
                          setAttrName("");
                        }
                      }}
                    >
                      Create New
                    </Button>
                  </div>
                </div>
              )}
            >
              {allAttributes
                .filter(attr => ["Varian", "Shade", "Size"].includes(attr.label))
                .map((attr) => (
                  <Option key={attr.value} value={attr.value}>
                    {attr.label}
                  </Option>
                ))}
            </Select>
          </Col>

          <Col flex="1 1 0" style={{  minWidth: 0 }}>
            <Select<AttrValueOption[]>
              mode="multiple"
              labelInValue
              placeholder="Enter or Select Values"
              style={{ width: "100%" }}
              showSearch
              value={attribute.values}
              onChange={(vals) => {
                const prevVals = attribute.values ?? [];
                const removedVals = prevVals.filter(
                  (pv) => !vals.some((v) => Number(v.value) === Number(pv.value))
                );
                handleAttributeChange(index, "values", vals);
                if (removedVals.length > 0) {
                  const removedIds = new Set(removedVals.map((v) => Number(v.value)));
                  setCombinations((prev) =>
                    prev.filter((c) => !removedIds.has(Number(c.combination[0])))
                  );
                }
              }}
              onSearch={(val) => setAttrValue(val)}
              filterOption={(input, option) =>
                (option?.children ? String(option.children) : "").toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: "4px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "nowrap",
                      padding: 8,
                      gap: 10,
                    }}
                  >
                    <Input
                      style={{ flex: "auto" }}
                      value={attrValue}
                      placeholder="Enter variant value..."
                      onChange={(e) => setAttrValue(e.target.value)}
                    />
                    <Button
                      icon={<PlusOutlined />}
                      type="primary"
                      onClick={async () => {
                        if (!attribute.attribute_id || !attrValue.trim()) return;
                        const res = await http.post(
                          `/admin/attribute/list-value/${attribute.attribute_id}`,
                          { value: attrValue }
                        );
                        if (res) {
                          await fetchAttributeName();
                          setAttrValue("");
                        }
                      }}
                    >
                      Create New
                    </Button>
                  </div>
                </div>
              )}
              optionRender={(option) => (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{String(option.label)}</span>
                  <DeleteOutlined
                    style={{ color: "#ff4d4f", cursor: "pointer" }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await http.delete(`/admin/attribute/list-value/${option.value}`);
                        if (res) {
                          message.success("Value deleted");
                          await fetchAttributeName();
                        }
                      } catch (err: any) {
                        const errMsg = err.response?.data?.message || "Failed to delete value";
                        message.error(errMsg);
                        
                      }
                    }}
                  />
                </div>
              )}
            >
              {allAttributes
                .find((attr) => attr.value === attribute.attribute_id)
                ?.options.map((opt) => (
                  <Option key={opt.value} value={opt.value} label={opt.label}>
                    {opt.label}
                  </Option>
                ))}
            </Select>
          </Col>

          {index === 0 && (
            <Col flex="0 0 auto">
              {combinations.length > 0 ? (() => {
                const existingIds = new Set(
                  combinations.map((c) => c.combination[0]).filter((v) => v != null)
                );
                const newValues = attributes.flatMap((attr) =>
                  (attr.values ?? []).filter((v) => !existingIds.has(Number(v.value)))
                );
                return (
                  <Button
                    type="primary"
                    style={{ whiteSpace: "nowrap" }}
                    icon={<PlusOutlined />}
                    disabled={newValues.length === 0}
                    onClick={() => {
                      const maxKey = Math.max(0, ...combinations.map((c) => c.key));
                      const newRows: CombinationRow[] = newValues.map((v, i) => ({
                        key: maxKey + i + 1,
                        combination: [Number(v.value)],
                        display: [v.label],
                        price: "",
                        stock: null,
                        sku: "",
                        barcode: "",
                      }));
                      setCombinations((prev) => [...prev, ...newRows]);
                    }}
                  >
                    Tambah atribut
                  </Button>
                );
              })() : (
                <Button
                  type="primary"
                  style={{ whiteSpace: "nowrap" }}
                  onClick={generateCombinations}
                  disabled={attributes.length === 0}
                >
                  Generate
                </Button>
              )}
            </Col>
          )}
        </Row>
      ))}

      {combinations.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Table<CombinationRow>
            dataSource={combinations}
            pagination={false}
            scroll={{ x: "max-content" }}
            rowKey="key"
  columns={[
    {
      title: displayMainColumnTitle,
      key: "display_main",
      fixed: "left" as const,
      render: (_, record: CombinationRow) => {
        const isEditingDisplay = editingKey === `display_${record.key}`;
        const displayText = (record.display?.length && record.display.some((d) => d))
          ? record.display.join(" - ")
          : record.sku_variant_1 || `Variant ${Number(record.key) + 1}`;

        if (isEditingDisplay) {
          return (
            <Input
              autoFocus
              defaultValue={displayText}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val) {
                  handleCombinationChange(record.key, "sku_variant_1", val);
                }
                setEditingKey(null);
              }}
              onPressEnter={(e: any) => {
                const val = e.target.value.trim();
                if (val) {
                  handleCombinationChange(record.key, "sku_variant_1", val);
                }
                setEditingKey(null);
              }}
            />
          );
        }

        return (
          <div
            style={{
              cursor: "pointer",
              borderBottom: "1px dashed #666",
              display: "inline-block",
              whiteSpace: "nowrap",
            }}
            onClick={() => setEditingKey(`display_${record.key}`)}
            title="Click to edit display name"
          >
            {displayText}
          </div>
        );
      },
    },
    // Dynamic Attribute Columns
    ...(activeAttributes.length > 1
      ? activeAttributes.map((attr, attrIdx) => {
        const attrInfo = allAttributes.find((all) => all.value === attr.attribute_id);
        const title = attrInfo ? attrInfo.label : `Attribute ${attrIdx + 1}`;
        return {
          title,
          key: `attr_${attrIdx}`,
          fixed: "left" as const,
          render: (_: any, record: CombinationRow) => {
            return (
              <span style={{ whiteSpace: "nowrap", display: "inline-block" }}>
                {record.display?.[attrIdx] || "-"}
              </span>
            );
          }
        };
      })
      : []),

    // Scrollable data columns
    {
      title: "Base Price",
      dataIndex: "base_price",
      key: "base_price",
      width: 140,
      render: (_: unknown, record) => (
        <Input
          prefix="Rp"
          placeholder="Harga dasar (opsional)"
          value={helper.formatRupiah(record.base_price || "")}
          onChange={(e) => {
            const val = e.target.value ?? "";
            const rupiahFormat = val ? helper.formatRupiah(val) : "";
            handleCombinationChange(record.key, "base_price", rupiahFormat);
          }}
        />
      ),
    },
    {
      title: (
        <span>
          Price{" "}
          <Tooltip title="Harga yang akan tampil di website">
            <QuestionCircleOutlined style={{ color: "#999", cursor: "pointer" }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "price",
      key: "price",
      width: 140,
      render: (_: unknown, record) => (
        <Input
          prefix="Rp"
          value={helper.formatRupiah(record.price || "")}
          onChange={(e) => {
            const val = e.target.value ?? "";
            const rupiahFormat = val ? helper.formatRupiah(val) : "";
            handleCombinationChange(record.key, "price", rupiahFormat);
          }}
        />
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 100,
      render: (_: unknown, record) => (
        <InputNumber
          min={0}
          value={record.stock ?? 0}
          onChange={(value) =>
            handleCombinationChange(
              record.key,
              "stock",
              typeof value === "number" ? value : 0
            )
          }
        />
      ),
    },
    {
      title: "Weight (g)",
      dataIndex: "weight",
      key: "weight",
      width: 100,
      render: (_: unknown, record) => (
        <InputNumber
          min={0}
          placeholder="0"
          value={record.weight ?? 0}
          onChange={(value) =>
            handleCombinationChange(
              record.key,
              "weight",
              typeof value === "number" ? value : 0
            )
          }
        />
      ),
    },
    {
      title: "SKU Varian",
      dataIndex: "sku_variant_1",
      key: "sku_variant_1",
      width: 180,
      render: (_: unknown, record) => (
        <InlineEditCell
          value={record.sku_variant_1}
          placeholder="SKU Varian 1"
          onChange={(val) => handleCombinationChange(record.key, "sku_variant_1", val)}
        />
      ),
    },
    {
      title: "Barcode (unik)",
      dataIndex: "barcode",
      key: "barcode",
      width: 180,
      render: (_: unknown, record) => (
        <InlineEditCell
          value={record.barcode}
          placeholder="Wajib unik"
          onChange={(val) => handleCombinationChange(record.key, "barcode", val)}
        />
      ),
    },
    {
      title: "BPOM",
      dataIndex: "bpom",
      key: "bpom",
      width: 180,
      render: (_: unknown, record) => (
        <InlineEditCell
          value={record.bpom}
          placeholder="BPOM (Opsional)"
          onChange={(val) => handleCombinationChange(record.key, "bpom", val)}
        />
      ),
    },
    // Beauty Columns (Conditional) — skintone/undertone/finish/warna moved to More modal
    // Perfume Columns (Conditional)
    ...(isPerfume ? [
      {
        title: "Perfume For",
        dataIndex: "perfume_for",
        key: "perfume_for",
        width: 150,
        render: (_: unknown, record: CombinationRow) => (
          <Select
            style={{ width: "100%" }}
            value={record.perfume_for}
            onChange={(val) => handleCombinationChange(record.key, "perfume_for", val)}
            placeholder="Select Target"
            allowClear
          >
            <Option value="Men">Men</Option>
            <Option value="Women">Women</Option>
            <Option value="Unisex">Unisex</Option>
            <Option value="Kids">Kids</Option>
            <Option value="Home">Home</Option>
          </Select>
        ),
      },
      {
        title: "Main Accords",
        dataIndex: "main_accords",
        key: "main_accords",
        width: 250,
        render: (_: unknown, record: CombinationRow) => (
          <Select
            mode="tags"
            style={{ width: "100%" }}
            value={record.main_accords}
            options={[
              { label: "Floral", value: "Floral" },
              { label: "Woody", value: "Woody" },
              { label: "Fresh", value: "Fresh" },
              { label: "Oriental", value: "Oriental" },
              { label: "Citrus", value: "Citrus" },
              { label: "Aquatic", value: "Aquatic" },
              { label: "Fougere", value: "Fougere" },
              { label: "Chypre", value: "Chypre" },
              { label: "Gourmand", value: "Gourmand" },
              { label: "Musky", value: "Musky" },
              { label: "Spicy", value: "Spicy" },
              { label: "Green", value: "Green" },
              { label: "Leather", value: "Leather" },
              { label: "Powdery", value: "Powdery" },
              { label: "Smoky", value: "Smoky" },
            ]}
            allowClear
          />
        ),
      },
      {
        title: "Top Notes",
        dataIndex: "top_notes",
        key: "top_notes",
        width: 250,
        render: (_: unknown, record: CombinationRow) => (
          <Select
            mode="tags"
            style={{ width: "100%" }}
            value={record.top_notes}
            options={[
              { label: "Bergamot", value: "Bergamot" },
              { label: "Lemon", value: "Lemon" },
              { label: "Apple", value: "Apple" },
              { label: "Pear", value: "Pear" },
              { label: "Grapefruit", value: "Grapefruit" },
              { label: "Mandarin", value: "Mandarin" },
              { label: "Orange", value: "Orange" },
              { label: "Blackcurrant", value: "Blackcurrant" },
              { label: "Peach", value: "Peach" },
              { label: "Pink Pepper", value: "Pink Pepper" },
              { label: "Cardamom", value: "Cardamom" },
              { label: "Aldehydes", value: "Aldehydes" },
            ]}
            allowClear
          />
        ),
      },
      {
        title: "Middle Notes",
        dataIndex: "middle_notes",
        key: "middle_notes",
        width: 250,
        render: (_: unknown, record: CombinationRow) => (
          <Select
            mode="tags"
            style={{ width: "100%" }}
            value={record.middle_notes}
            options={[
              { label: "Jasmine", value: "Jasmine" },
              { label: "Rose", value: "Rose" },
              { label: "Iris", value: "Iris" },
              { label: "Ylang Ylang", value: "Ylang Ylang" },
              { label: "Geranium", value: "Geranium" },
              { label: "Lily", value: "Lily" },
              { label: "Lavender", value: "Lavender" },
              { label: "Peony", value: "Peony" },
              { label: "Tuberose", value: "Tuberose" },
              { label: "Violet", value: "Violet" },
              { label: "Magnolia", value: "Magnolia" },
            ]}
            allowClear
          />
        ),
      },
      {
        title: "Base Notes",
        dataIndex: "base_notes",
        key: "base_notes",
        width: 250,
        render: (_: unknown, record: CombinationRow) => (
          <Select
            mode="tags"
            style={{ width: "100%" }}
            value={record.base_notes}
            options={[
              { label: "Amber", value: "Amber" },
              { label: "Musk", value: "Musk" },
              { label: "Sandalwood", value: "Sandalwood" },
              { label: "Cedarwood", value: "Cedarwood" },
              { label: "Vetiver", value: "Vetiver" },
              { label: "Patchouli", value: "Patchouli" },
              { label: "Vanilla", value: "Vanilla" },
              { label: "Benzyl Benzoate", value: "Benzyl Benzoate" },
              { label: "Oud", value: "Oud" },
              { label: "Oakmoss", value: "Oakmoss" },
              { label: "Tonka Bean", value: "Tonka Bean" },
              { label: "Civet", value: "Civet" },
              { label: "Labdanum", value: "Labdanum" },
            ]}
            allowClear
          />
        ),
      }
    ] : []),
    {
      title: "Options",
      key: "options",
      fixed: "right",
      width: 80,
      render: (_: unknown, record) => (
        <Button type="link" onClick={() => openOptionModal(record.key)}>
          More
        </Button>
      ),
    },
    {
      title: "Delete",
      key: "delete",
      fixed: "right",
      width: 80,
      render: (_: unknown, record: CombinationRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            setCombinations((prev) => prev.filter((c) => c.key !== record.key));
            const removedId = record.combination[0];
            if (removedId != null) {
              setAttributes((prev) =>
                prev.map((attr) => ({
                  ...attr,
                  values: (attr.values ?? []).filter(
                    (v) => Number(v.value) !== Number(removedId)
                  ),
                }))
              );
            }
            if (editingKey === record.key || editingKey === `display_${record.key}`) {
              setEditingKey(null);
            }
          }}
        />
      ),
    },
  ]}
          />
        </div>
      )}

      {/* Modal for additional details */}
      <Modal
        title={`Detail - ${currentCombination?.sku_variant_1 || currentCombination?.display?.join(" - ") || ""}`}
        open={modalVisible}
        onOk={handleModalSave}
        onCancel={() => setModalVisible(false)}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
      >
        <Form form={modalForm} layout="vertical">
          <Form.Item label="SKU Varian 1 (Opsional)" name="sku_variant_1">
            <Input placeholder="SKU Varian 1" />
          </Form.Item>
          <Form.Item name="photo_variant" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label={
              <span>
                Photo Variant&nbsp;
                <Tooltip title="Foto spesifik untuk varian ini.">
                  <QuestionCircleOutlined style={{ color: "rgba(0,0,0,0.45)" }} />
                </Tooltip>
              </span>
            }
          >
            {(() => {
              const handlePhotoUpload = () => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async (e: Event) => {
                  const target = e.target as HTMLInputElement;
                  if (!target.files?.[0]) return;
                  const file = target.files[0];
                  const fd = new FormData();
                  fd.append("file", file);
                  fd.append("folder", UPLOAD_PATHS.products);
                  try {
                    const res = await http.post("/upload", fd, {
                      headers: { "content-type": "multipart/form-data" },
                    });
                    const signedUrl: string = res?.data?.signedUrl;
                    if (signedUrl) modalForm.setFieldValue("photo_variant", signedUrl);
                  } catch {
                    message.error("Upload failed");
                  }
                };
                input.click();
              };
              return photoVariantUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Image
                    src={helper.renderImage(photoVariantUrl)}
                    width={80}
                    height={80}
                    style={{ objectFit: "contain", borderRadius: 4, border: "1px solid #d9d9d9" }}
                    alt="photo variant"
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Button size="small" icon={<UploadOutlined />} onClick={handlePhotoUpload}>
                      Ganti Foto
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => modalForm.setFieldValue("photo_variant", "")}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="hover-file"
                  style={{
                    border: "1px dashed var(--ant-primary-color)",
                    padding: 10,
                    borderRadius: 8,
                    width: "max-content",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                  }}
                  onClick={handlePhotoUpload}
                >
                  <UploadOutlined style={{ fontSize: 24 }} />
                  <div style={{ fontSize: 12 }}>Upload Photo Variant</div>
                </div>
              );
            })()}
          </Form.Item>
          {isPerfume && (
            <>
              <Form.Item label="Perfume For" name="perfume_for">
                <Select placeholder="Select Target" allowClear>
                  <Option value="Men">Men</Option>
                  <Option value="Women">Women</Option>
                  <Option value="Unisex">Unisex</Option>
                  <Option value="Kids">Kids</Option>
                  <Option value="Home">Home</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Main Accords" name="main_accords">
                <Select
                  mode="tags"
                  placeholder="e.g. Floral, Woody"
                  style={{ width: "100%" }}
                  allowClear
                  options={[
                    { label: "Floral", value: "Floral" },
                    { label: "Woody", value: "Woody" },
                    { label: "Fresh", value: "Fresh" },
                    { label: "Oriental", value: "Oriental" },
                    { label: "Citrus", value: "Citrus" },
                    { label: "Aquatic", value: "Aquatic" },
                    { label: "Fougere", value: "Fougere" },
                    { label: "Chypre", value: "Chypre" },
                    { label: "Gourmand", value: "Gourmand" },
                    { label: "Musky", value: "Musky" },
                    { label: "Spicy", value: "Spicy" },
                    { label: "Green", value: "Green" },
                    { label: "Leather", value: "Leather" },
                    { label: "Powdery", value: "Powdery" },
                    { label: "Smoky", value: "Smoky" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Top Notes" name="top_notes">
                <Select
                  mode="tags"
                  placeholder="e.g. Bergamot, Apple"
                  style={{ width: "100%" }}
                  allowClear
                  options={[
                    { label: "Bergamot", value: "Bergamot" },
                    { label: "Lemon", value: "Lemon" },
                    { label: "Apple", value: "Apple" },
                    { label: "Pear", value: "Pear" },
                    { label: "Grapefruit", value: "Grapefruit" },
                    { label: "Mandarin", value: "Mandarin" },
                    { label: "Orange", value: "Orange" },
                    { label: "Blackcurrant", value: "Blackcurrant" },
                    { label: "Peach", value: "Peach" },
                    { label: "Pink Pepper", value: "Pink Pepper" },
                    { label: "Cardamom", value: "Cardamom" },
                    { label: "Aldehydes", value: "Aldehydes" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Middle Notes" name="middle_notes">
                <Select
                  mode="tags"
                  placeholder="e.g. Jasmine, Rose"
                  style={{ width: "100%" }}
                  allowClear
                  options={[
                    { label: "Jasmine", value: "Jasmine" },
                    { label: "Rose", value: "Rose" },
                    { label: "Iris", value: "Iris" },
                    { label: "Ylang Ylang", value: "Ylang Ylang" },
                    { label: "Geranium", value: "Geranium" },
                    { label: "Lily", value: "Lily" },
                    { label: "Lavender", value: "Lavender" },
                    { label: "Peony", value: "Peony" },
                    { label: "Tuberose", value: "Tuberose" },
                    { label: "Violet", value: "Violet" },
                    { label: "Magnolia", value: "Magnolia" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Base Notes" name="base_notes">
                <Select
                  mode="tags"
                  placeholder="e.g. Amber, Musk"
                  style={{ width: "100%" }}
                  allowClear
                  options={[
                    { label: "Amber", value: "Amber" },
                    { label: "Musk", value: "Musk" },
                    { label: "Sandalwood", value: "Sandalwood" },
                    { label: "Cedarwood", value: "Cedarwood" },
                    { label: "Vetiver", value: "Vetiver" },
                    { label: "Patchouli", value: "Patchouli" },
                    { label: "Vanilla", value: "Vanilla" },
                    { label: "Benzyl Benzoate", value: "Benzyl Benzoate" },
                    { label: "Oud", value: "Oud" },
                    { label: "Oakmoss", value: "Oakmoss" },
                    { label: "Tonka Bean", value: "Tonka Bean" },
                    { label: "Civet", value: "Civet" },
                    { label: "Labdanum", value: "Labdanum" },
                  ]}
                />
              </Form.Item>
            </>
          )}
          {isMakeup && (
            <>
              <Form.Item label="Skintone" name="skintone">
                <Select mode="tags" placeholder="Select Skintone" allowClear style={{ width: "100%" }}>
                  <Option value="Fair">Fair</Option>
                  <Option value="Light">Light</Option>
                  <Option value="Medium Light">Medium Light</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Medium to Tan">Medium to Tan</Option>
                  <Option value="Tan">Tan</Option>
                  <Option value="Medium Dark">Medium Dark</Option>
                  <Option value="Dark">Dark</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Undertone" name="undertone">
                <Select mode="tags" placeholder="Select Undertone" allowClear style={{ width: "100%" }}>
                  <Option value="Cool">Cool</Option>
                  <Option value="Neutral">Neutral</Option>
                  <Option value="Warm">Warm</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Finish" name="finish">
                <Select mode="tags" placeholder="Select Finish" allowClear style={{ width: "100%" }}>
                  <Option value="Matte">Matte</Option>
                  <Option value="Glossy">Glossy</Option>
                  <Option value="Satin">Satin</Option>
                  <Option value="Dewy">Dewy</Option>
                  <Option value="Natural">Natural</Option>
                  <Option value="Shimmer">Shimmer</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Warna" name="warna">
                <Select mode="tags" placeholder="Select Warna" allowClear style={{ width: "100%" }}>
                  <Option value="Nude">Nude</Option>
                  <Option value="Pink">Pink</Option>
                  <Option value="Red">Red</Option>
                  <Option value="Berry">Berry</Option>
                  <Option value="Coral">Coral</Option>
                  <Option value="Brown">Brown</Option>
                  <Option value="Orange">Orange</Option>
                  <Option value="Peach">Peach</Option>
                  <Option value="Mauve">Mauve</Option>
                  <Option value="Rose">Rose</Option>
                  <Option value="Plum">Plum</Option>
                </Select>
              </Form.Item>
            </>
          )}
          {isSkincare && (
            <>
              <Form.Item
                label="Skin Concerns"
                name="concern_option_ids"
              >
                <Select
                  mode="multiple"
                  placeholder="Select Skin Concerns"
                  loading={loadingSkincare}
                  showSearch
                  optionFilterProp="children"
                  virtual
                >
                  {concernGroups.map((group) => (
                    <OptGroup key={String(group.id || group.name)} label={group.name}>
                      {(group.options || group.concern_options || group.concernOptions || [])?.map((opt: any) => (
                        <Option key={String(opt.id)} value={opt.id}>
                          {opt.name}
                        </Option>
                      ))}
                    </OptGroup>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Skintone"
                name="skintone_ids"
              >
                <Select
                  mode="multiple"
                  placeholder="Select Skintone"
                  loading={loadingSkincare}
                  showSearch
                  optionFilterProp="children"
                  virtual
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                      <Divider style={{ margin: "4px 0" }} />
                      <div style={{ display: "flex", flexWrap: "nowrap", padding: 8, gap: 10 }}>
                        <Input
                          style={{ flex: "auto" }}
                          value={newSkintone}
                          placeholder="Enter new skintone..."
                          onChange={(e) => setNewSkintone(e.target.value)}
                        />
                        <Button
                          icon={<PlusOutlined />}
                          type="primary"
                          loading={creatingOption}
                          onClick={async () => {
                            if (!newSkintone.trim()) return;
                            const group = profileGroups.find(g => {
                              const n = (g.name || "").toLowerCase().replace(/\s+/g, "");
                              return n.includes("skintone");
                            });
                            if (!group) {
                              message.error("Kategori Skintone tidak ditemukan di sistem");
                              return;
                            }
                            setCreatingOption(true);
                            try {
                              await http.post("/admin/profile-category-options", {
                                profileCategoriesId: group.id,
                                label: newSkintone,
                                value: newSkintone.toLowerCase().replace(/\s+/g, "_"),
                                isActive: true,
                              });
                              
                              const updatedGroups = await helper.fetchAllPages<any>("/admin/profile-categories");
                              
                              const profileGroupsMerged: any[] = [];
                              updatedGroups.forEach((group: any) => {
                                const existing = profileGroupsMerged.find(g => (g.name || "").toLowerCase() === (group.name || "").toLowerCase());
                                if (existing) {
                                  existing.options = [...(existing.options || []), ...(group.options || group.profile_category_options || group.profileOptions || [])];
                                } else {
                                  profileGroupsMerged.push({
                                    ...group,
                                    options: group.options || group.profile_category_options || group.profileOptions || []
                                  });
                                }
                              });
                              setProfileGroups(profileGroupsMerged);
                              
                              // Auto select the newly created option
                              const newGroup = profileGroupsMerged.find((g: any) => {
                                const n = (g.name || "").toLowerCase().replace(/\s+/g, "");
                                return n.includes("skintone");
                              });
                              const opts = newGroup?.options || [];
                              const newest = opts.find((o: any) => o.label === newSkintone || o.name === newSkintone);
                              
                              if (newest) {
                                const current = modalForm.getFieldValue("skintone_ids") || [];
                                modalForm.setFieldsValue({ skintone_ids: [...current, newest.id] });
                              }

                              setNewSkintone("");
                              message.success("Skintone added");
                            } finally {
                              setCreatingOption(false);
                            }
                          }}
                        >
                          Create New
                        </Button>
                      </div>
                    </div>
                  )}
                  optionRender={(option) => (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{String(option.label)}</span>
                      <DeleteOutlined
                        style={{ color: "#ff4d4f", cursor: "pointer" }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await http.delete(`/admin/profile-category-options/${option.value}`);
                            message.success("Option deleted");
                            fetchSkincareOptions();
                          } catch (err) {
                            message.error("Failed to delete option");
                          }
                        }}
                      />
                    </div>
                  )}
                >
                  {(() => {
                    const group = profileGroups.find((g) => {
                      const n = (g.name || "").toLowerCase().replace(/\s+/g, "");
                      return n.includes("skintone");
                    });
                    const opts = group?.options || (group as any)?.profile_category_options || (group as any)?.profile_options || (group as any)?.profileOptions || (group as any)?.profileCategoryOptions || [];
                    return opts.map((opt: any) => (
                      <Option key={String(opt.id)} value={opt.id} label={opt.label || opt.name}>
                        {opt.label || opt.name}
                      </Option>
                    ));
                  })()}
                </Select>
              </Form.Item>

              <Form.Item
                label="Undertone"
                name="undertone_ids"
              >
                <Select
                  mode="multiple"
                  placeholder="Select Undertone"
                  loading={loadingSkincare}
                  showSearch
                  optionFilterProp="children"
                  virtual
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                      <Divider style={{ margin: "4px 0" }} />
                      <div style={{ display: "flex", flexWrap: "nowrap", padding: 8, gap: 10 }}>
                        <Input
                          style={{ flex: "auto" }}
                          value={newUndertone}
                          placeholder="Enter new undertone..."
                          onChange={(e) => setNewUndertone(e.target.value)}
                        />
                        <Button
                          icon={<PlusOutlined />}
                          type="primary"
                          loading={creatingOption}
                          onClick={async () => {
                            if (!newUndertone.trim()) return;
                            const group = profileGroups.find(g => {
                              const n = (g.name || "").toLowerCase().replace(/\s+/g, "");
                              return n.includes("undertone");
                            });
                            if (!group) {
                              message.error("Kategori Undertone tidak ditemukan di sistem");
                              return;
                            }
                            setCreatingOption(true);
                            try {
                              await http.post("/admin/profile-category-options", {
                                profileCategoriesId: group.id,
                                label: newUndertone,
                                value: newUndertone.toLowerCase().replace(/\s+/g, "_"),
                                isActive: true,
                              });
                              
                              const updatedGroups = await helper.fetchAllPages<any>("/admin/profile-categories");
                              
                              const profileGroupsMerged: any[] = [];
                              updatedGroups.forEach((group: any) => {
                                const existing = profileGroupsMerged.find(g => (g.name || "").toLowerCase() === (group.name || "").toLowerCase());
                                if (existing) {
                                  existing.options = [...(existing.options || []), ...(group.options || group.profile_category_options || group.profileOptions || [])];
                                } else {
                                  profileGroupsMerged.push({
                                    ...group,
                                    options: group.options || group.profile_category_options || group.profileOptions || []
                                  });
                                }
                              });
                              setProfileGroups(profileGroupsMerged);
                              
                              // Auto select the newly created option
                              const newGroup = profileGroupsMerged.find((g: any) => {
                                const n = (g.name || "").toLowerCase().replace(/\s+/g, "");
                                return n.includes("undertone");
                              });
                              const opts = newGroup?.options || [];
                              const newest = opts.find((o: any) => o.label === newUndertone || o.name === newUndertone);
    
                              if (newest) {
                                const current = modalForm.getFieldValue("undertone_ids") || [];
                                modalForm.setFieldsValue({ undertone_ids: [...current, newest.id] });
                              }
    
                              setNewUndertone("");
                              message.success("Undertone added");
                            } finally {
                              setCreatingOption(false);
                            }
                          }}
                        >
                          Create New
                        </Button>
                      </div>
                    </div>
                  )}
                  optionRender={(option) => (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{String(option.label)}</span>
                      <DeleteOutlined
                        style={{ color: "#ff4d4f", cursor: "pointer" }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await http.delete(`/admin/profile-category-options/${option.value}`);
                            message.success("Option deleted");
                            fetchSkincareOptions();
                          } catch (err) {
                            message.error("Failed to delete option");
                          }
                        }}
                      />
                    </div>
                  )}
                >
                  {(() => {
                    const group = profileGroups.find((g) => {
                      const n = (g.name || "").toLowerCase().replace(/\s+/g, "");
                      return n.includes("undertone");
                    });
                    const opts = group?.options || (group as any)?.profile_category_options || (group as any)?.profile_options || (group as any)?.profileOptions || (group as any)?.profileCategoryOptions || [];
                    return opts.map((opt: any) => (
                      <Option key={String(opt.id)} value={opt.id} label={opt.label || opt.name}>
                        {opt.label || opt.name}
                      </Option>
                    ));
                  })()}
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
};

const cartesianProduct = (arrays: number[][]): number[][] => {
  if (arrays.length === 0) return [];
  return arrays.reduce<number[][]>(
    (a, b) => a.flatMap((d) => b.map((e) => [...(Array.isArray(d) ? d : [d]), e])),
    [[]]
  );
};

export default FormAttribute;
