import React from "react";
import { Form, Select, Input, Divider, Button, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import helper from "../../../utils/helper";
import http from "../../../api/http";

type BrandType = {
  id: number;
  name: string;
};

type PersonaType = {
  id: number;
  name: string;
};

type GroupedOptionType = {
  id: number;
  name: string;
  options?: any[];
};

type Props = {
  form?: any;
};

const FormCategory: React.FC<Props> = ({ form }) => {
  const [brands, setBrands] = React.useState<BrandType[]>([]);
  const [personas, setPersonas] = React.useState<PersonaType[]>([]);
  
  // Create New States
  const [newSkintone, setNewSkintone] = React.useState("");
  const [newUndertone, setNewUndertone] = React.useState("");
  const [creatingOption, setCreatingOption] = React.useState(false);

  // State for grouped options
  const [concernGroups, setConcernGroups] = React.useState<GroupedOptionType[]>([]);
  const [profileGroups, setProfileGroups] = React.useState<GroupedOptionType[]>([]);

  const [loadingOptions, setLoadingOptions] = React.useState<boolean>(false);
  const didFetchOptions = React.useRef(false);

  const fetchCategoryOptions = async () => {
    try {
      setLoadingOptions(true);
      const [
        brandsAll,
        personasAll,
        concernsAll,
        profileOptsAllRaw,
      ] = await Promise.all([
        helper.fetchAllPages<BrandType>("/admin/brands", { per_page: 1000 }),
        helper.fetchAllPages<PersonaType>("/admin/personas", { per_page: 1000 }),
        helper.fetchAllPages<GroupedOptionType>("/admin/concern", { per_page: 1000 }),
        helper.fetchAllPages<GroupedOptionType>("/admin/profile-categories", { per_page: 1000 }),
      ]);

      const profileGroupMap = new Map<string, GroupedOptionType>();
      profileOptsAllRaw.forEach((group: GroupedOptionType) => {
        if (!profileGroupMap.has(group.name)) {
          profileGroupMap.set(group.name, group);
        }
      });
      const profileOptsAll = Array.from(profileGroupMap.values());

      setBrands(brandsAll);
      setPersonas(personasAll);
      setConcernGroups(concernsAll);
      setProfileGroups(profileOptsAll);
    } catch (e) {
      setBrands([]);
      setPersonas([]);
      setConcernGroups([]);
      setProfileGroups([]);
      
    } finally {
      setLoadingOptions(false);
    }
  };
  
  const handleDeleteOption = async (id: number) => {
    try {
      await http.delete(`/admin/profile-category-options/${id}`);
      message.success("Option deleted");
      fetchCategoryOptions();
    } catch (e) {
      
      message.error("Failed to delete option");
    }
  };

  React.useEffect(() => {
    if (didFetchOptions.current) return;
    didFetchOptions.current = true;
    fetchCategoryOptions();
  }, []);

  return (
    <>
      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>
        Organization
      </div>

      <Form.Item
        label="Status"
        name="status"
      >
        <Select placeholder="Select status">
          <Select.Option value="normal">Normal Product</Select.Option>
          <Select.Option value="draft">Draft</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Brand"
        name="brand_id"
      >
        <Select
          placeholder="Please select Brand"
          loading={loadingOptions}
          showSearch
          optionFilterProp="children"
          virtual
        >
          {brands.map((brand) => (
            <Select.Option key={String(brand.id)} value={brand.id}>
              {brand.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Persona"
        name="persona_id"
      >
        <Select
          placeholder="Please select Persona"
          loading={loadingOptions}
          showSearch
          optionFilterProp="children"
          virtual
        >
          {personas.map((persona) => (
            <Select.Option key={String(persona.id)} value={persona.id}>
              {persona.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Skin Concerns"
        name="concern_option_ids"
      >
        <Select
          mode="multiple"
          placeholder="Select Skin Concerns"
          loading={loadingOptions}
          showSearch
          optionFilterProp="children"
          virtual
        >
          {concernGroups.map((group) => (
            <Select.OptGroup key={String(group.id)} label={group.name}>
              {(group.options || (group as any).concern_options || (group as any).concernOptions || [])?.map((opt: any) => (
                <Select.Option key={String(opt.id)} value={opt.id}>
                  {opt.name}
                </Select.Option>
              ))}
            </Select.OptGroup>
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
          loading={loadingOptions}
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
                      
                      const updatedGroups = await helper.fetchAllPages<GroupedOptionType>("/admin/profile-categories");
                      setProfileGroups(updatedGroups);
                      
                      // Auto select the newly created option
                      const newGroup = updatedGroups.find((g: any) => {
                        const n = (g.name || "").toLowerCase().replace(/\s+/g, "");
                        return n.includes("skintone");
                      });
                      const opts = newGroup?.options || (newGroup as any)?.profile_category_options || (newGroup as any)?.profile_options || (newGroup as any)?.profileOptions || [];
                      const newest = opts.find((o: any) => o.label === newSkintone || o.name === newSkintone);
                      
                      if (newest && form) {
                        const current = form.getFieldValue("skintone_ids") || [];
                        form.setFieldsValue({ skintone_ids: [...current, newest.id] });
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteOption(Number(option.value));
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
              <Select.Option key={String(opt.id)} value={opt.id} label={opt.label || opt.name}>
                {opt.label || opt.name}
              </Select.Option>
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
          loading={loadingOptions}
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
                      
                      const updatedGroups = await helper.fetchAllPages<GroupedOptionType>("/admin/profile-categories");
                      setProfileGroups(updatedGroups);

                      // Auto select the newly created option
                      const newGroup = updatedGroups.find((g: any) => {
                        const n = (g.name || "").toLowerCase().replace(/\s+/g, "");
                        return n.includes("undertone");
                      });
                      const opts = newGroup?.options || (newGroup as any)?.profile_category_options || (newGroup as any)?.profile_options || (newGroup as any)?.profileOptions || [];
                      const newest = opts.find((o: any) => o.label === newUndertone || o.name === newUndertone);

                      if (newest && form) {
                        const current = form.getFieldValue("undertone_ids") || [];
                        form.setFieldsValue({ undertone_ids: [...current, newest.id] });
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteOption(Number(option.value));
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
              <Select.Option key={String(opt.id)} value={opt.id} label={opt.label || opt.name}>
                {opt.label || opt.name}
              </Select.Option>
            ));
          })()}
        </Select>
      </Form.Item>

      <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 10, marginTop: 20, color: "#b31f5f" }}>
        Perfume Attributes (Optional)
      </div>

      <Form.Item label="Main Accords" name="main_accords">
        <Select
          mode="tags"
          placeholder="e.g. Floral, Woody"
          notFoundContent={null}
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
          notFoundContent={null}
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
          notFoundContent={null}
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
          notFoundContent={null}
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

      <Form.Item label="Perfume For" name="perfume_for">
        <Select placeholder="Select Target" allowClear>
          <Select.Option value="Men">Men</Select.Option>
          <Select.Option value="Women">Women</Select.Option>
          <Select.Option value="Unisex">Unisex</Select.Option>
          <Select.Option value="Kids">Kids</Select.Option>
          <Select.Option value="Home">Home</Select.Option>
        </Select>
      </Form.Item>

      <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 10, marginTop: 20, color: "#b31f5f" }}>
        Makeup Attributes (Optional)
      </div>

      <Form.Item label="Finish" name="finish">
        <Select placeholder="Select Finish" allowClear>
          <Select.Option value="Matte">Matte</Select.Option>
          <Select.Option value="Satin">Satin</Select.Option>
          <Select.Option value="Glossy">Glossy</Select.Option>
          <Select.Option value="Shimmer">Shimmer</Select.Option>
          <Select.Option value="Metallic">Metallic</Select.Option>
          <Select.Option value="Natural">Natural</Select.Option>
          <Select.Option value="Dewy">Dewy</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label="Warna" name="warna">
        <Select
          mode="tags"
          placeholder="e.g. Red, Nude"
          notFoundContent={null}
          options={[
            { label: "Nude", value: "Nude" },
            { label: "Merah", value: "Merah" },
            { label: "Merah Muda / Pink", value: "Merah Muda / Pink" },
            { label: "Coral", value: "Coral" },
            { label: "Peach", value: "Peach" },
            { label: "Mauve", value: "Mauve" },
            { label: "Berry", value: "Berry" },
            { label: "Wine / Burgundy", value: "Wine / Burgundy" },
            { label: "Oranye", value: "Oranye" },
            { label: "Cokelat", value: "Cokelat" },
            { label: "Taupe", value: "Taupe" },
            { label: "Putih", value: "Putih" },
            { label: "Hitam", value: "Hitam" },
            { label: "Rose Gold", value: "Rose Gold" },
            { label: "Gold", value: "Gold" },
            { label: "Silver", value: "Silver" },
            { label: "Lilac / Lavender", value: "Lilac / Lavender" },
            { label: "Ungu", value: "Ungu" },
            { label: "Biru", value: "Biru" },
            { label: "Hijau", value: "Hijau" },
            { label: "Transparan / Clear", value: "Transparan / Clear" },
          ]}
        />
      </Form.Item>
    </>
  );
};

export default FormCategory;
