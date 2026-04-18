import type React from "react";
import { message } from "antd";
import type { FormInstance } from "antd";
import { getDiscountDetail } from "../../api/discount";
import { mapApiToForm } from "./discountFormPageHelpers";
import { resolveIdentifier } from "./discountFormUtils";

type EditHandlersDeps = {
  mode: "create" | "edit";
  id: string | undefined;
  nav: (to: string) => void;
  form: FormInstance;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setMeta: React.Dispatch<React.SetStateAction<{ code: string } | null>>;
  hydrateFromVariantItems: (serve: any) => Promise<void>;
};

export const createDiscountEditHandlers = (deps: EditHandlersDeps) => {
  const { mode, id, nav, form, setLoading, setMeta, hydrateFromVariantItems } =
    deps;

  const loadEdit = async () => {
    if (mode !== "edit") return;

    const identifier = resolveIdentifier(id);
    if (!identifier) {
      message.error("Invalid discount identifier");
      nav("/discounts");
      return;
    }

    setLoading(true);
    try {
      const resp: any = await getDiscountDetail(identifier);
      
      const serve = resp?.data?.serve;
      
      
      

      if (serve) {
        setMeta({ code: String(serve?.code ?? "") });
        form.setFieldsValue(mapApiToForm(serve));
        
        await hydrateFromVariantItems(serve);
        
      } else {
        
      }
    } catch (e: any) {
      
      message.error(e?.response?.data?.message ?? "Gagal ambil detail promo");
      nav("/discounts");
    } finally {
      setLoading(false);
    }
  };

  return { loadEdit };
};
