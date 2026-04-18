import React from "react";
import { message, Modal, Upload } from "antd";
import type { UploadProps, FormInstance } from "antd";
import {
  downloadDiscountTemplate,
  exportDiscountItems,
  getDiscountDetail,
  importDiscountItems,
} from "../../api/discount";
import { downloadBlob, mapApiToForm } from "./discountFormPageHelpers";
import { transformImportFile } from "./discountFormImportUtils";

type ImportHandlersDeps = {
  mode: "create" | "edit";
  currentIdentifier: string | null;
  ioScope: "variant" | "product" | "brand";
  importTransfer: boolean;
  form: FormInstance;
  setIoLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setMeta: React.Dispatch<React.SetStateAction<{ code: string } | null>>;
  hydrateFromVariantItems: (serve: any) => Promise<void>;
};

export const createDiscountImportHandlers = (deps: ImportHandlersDeps) => {
  const {
    mode,
    currentIdentifier,
    ioScope,
    importTransfer,
    form,
    setIoLoading,
    setMeta,
    hydrateFromVariantItems,
  } = deps;

  const exportItems = async (format: "csv" | "excel") => {
    if (mode !== "edit") return;
    if (!currentIdentifier) {
      message.error("Invalid discount identifier");
      return;
    }

    setIoLoading(true);
    try {
      const resp = await exportDiscountItems(
        currentIdentifier,
        format,
        ioScope,
      );

      const ext = format === "excel" ? "xlsx" : "csv";
      const filename = `discount_${currentIdentifier}_items.${ext}`;
      downloadBlob(resp.data as Blob, filename);

      message.success(`Export ${ext.toUpperCase()} berhasil`);
    } catch (e: any) {
      const blob = e?.response?.data;
      if (blob instanceof Blob) {
        try {
          const txt = await blob.text();
          const j = JSON.parse(txt);
          message.error(j?.message ?? "Gagal export");
          return;
        } catch {
          // ignore
        }
      }
      message.error(e?.response?.data?.message ?? "Gagal export");
    } finally {
      setIoLoading(false);
    }
  };

  const downloadTemplate = async (format: "csv" | "excel") => {
    if (mode !== "edit") return;
    if (!currentIdentifier) {
      message.error("Invalid discount identifier");
      return;
    }

    setIoLoading(true);
    try {
      const resp = await downloadDiscountTemplate(
        currentIdentifier,
        format,
        ioScope,
      );

      const ext = format === "excel" ? "xlsx" : "csv";
      const filename = `discount_template_${currentIdentifier}_${ioScope}.${ext}`;
      downloadBlob(resp.data as Blob, filename);

      message.success(`Template ${ext.toUpperCase()} berhasil diunduh`);
    } catch (e: any) {
      const blob = e?.response?.data;
      if (blob instanceof Blob) {
        try {
          const txt = await blob.text();
          const j = JSON.parse(txt);
          message.error(j?.message ?? "Gagal unduh template");
          return;
        } catch {
          // ignore
        }
      }
      message.error(e?.response?.data?.message ?? "Gagal unduh template");
    } finally {
      setIoLoading(false);
    }
  };

  const refreshAfterImport = async () => {
    if (mode !== "edit") return;
    if (!currentIdentifier) return;

    try {
      const resp: any = await getDiscountDetail(currentIdentifier);
      const serve = resp?.data?.serve;
      if (serve) {
        setMeta({ code: String(serve?.code ?? "") });
        form.setFieldsValue(mapApiToForm(serve));
        await hydrateFromVariantItems(serve);
      }
    } catch {
      // ignore
    }
  };

  const doImportItems = async (file: File, transferFlag: boolean) => {
    if (mode !== "edit") return;
    if (!currentIdentifier) {
      message.error("Invalid discount identifier");
      return;
    }

    setIoLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (transferFlag) fd.append("transfer", "1");
      fd.append("scope", ioScope);

      const resp: any = await importDiscountItems(currentIdentifier, fd);

      message.success(resp?.data?.message ?? "Successfully imported.");
      await refreshAfterImport();
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const serve = data?.serve;

      if (
        status === 409 &&
        serve?.code === "PROMO_CONFLICT" &&
        serve?.canTransfer
      ) {
        Modal.confirm({
          title: "Produk sedang ikut promo lain",
          content: React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { style: { marginBottom: 8 } },
              "Sebagian produk pada file import sedang ",
              React.createElement("b", null, "aktif"),
              " di promo lain.",
            ),
            React.createElement(
              "div",
              null,
              "Mau ",
              React.createElement("b", null, "dipindahkan ke Discount"),
              "? (Produk akan dikeluarkan dari promo aktif)",
            ),
          ),
          okText: "Ya / Pindahkan",
          cancelText: "Batal",
          onOk: async () => {
            try {
              setIoLoading(true);
              await doImportItems(file, true);
            } finally {
              setIoLoading(false);
            }
          },
        });
        return;
      }

      message.error(data?.message ?? "Gagal import");
    } finally {
      setIoLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    accept: ".csv,.xlsx",
    multiple: false,
    showUploadList: false,
    beforeUpload: async (file) => {
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const isXlsx = file.name.toLowerCase().endsWith(".xlsx");
      if (!isCsv && !isXlsx) {
        message.error("File harus CSV atau XLSX");
        return Upload.LIST_IGNORE;
      }

      try {
        const converted = await transformImportFile(file as File, ioScope);
        if (!converted) return Upload.LIST_IGNORE;
        await doImportItems(converted, importTransfer);
        return false;
      } catch (error) {
        
        message.error("Gagal membaca file. Pastikan format CSV/XLSX valid.");
        return Upload.LIST_IGNORE;
      }
    },
  };

  return {
    exportItems,
    downloadTemplate,
    refreshAfterImport,
    doImportItems,
    uploadProps,
  };
};
