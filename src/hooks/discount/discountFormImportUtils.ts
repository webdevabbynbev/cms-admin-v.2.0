import { message } from "antd";
import Papa from "papaparse";
import {
  loadXlsx,
  clamp,
  normalizeHeader,
  getRowValue,
  toNumberSafe,
  guessCsvDelimiter,
} from "./discountFormUtils";

export type ImportRow = Record<string, unknown>;

export const parseImportRows = async (
  file: File,
): Promise<ImportRow[] | null> => {
  const lowerName = file.name.toLowerCase();
  const isCsv = lowerName.endsWith(".csv");
  const isXlsx = lowerName.endsWith(".xlsx");
  if (!isCsv && !isXlsx) return null;

  if (isCsv) {
    const text = await file.text();
    const delimiter = guessCsvDelimiter(text);

    const parsed = Papa.parse<ImportRow>(text, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      transformHeader: (h) => h.replace(/\ufeff/g, "").trim(),
    });

    if (parsed.errors.length) {
      message.error("Gagal membaca CSV. Periksa format file.");
      return null;
    }

    return (parsed.data ?? []) as ImportRow[];
  }

  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<ImportRow>(worksheet, { defval: "" });
};

export const transformImportFile = async (
  file: File,
  scope: "variant" | "product" | "brand",
) => {
  if (scope !== "variant") return file;
  const rows = await parseImportRows(file);
  if (!rows) return file;
  if (!rows.length) return file;

  const headerKeys = Object.keys(rows[0] ?? {});
  const headerNorm = headerKeys.map(normalizeHeader);

  const hasFinalPriceCol = headerNorm.some((h) =>
    [
      "hargaakhir",
      "harga_akhir",
      "harga akhir",
      "hargadiskon",
      "finalprice",
      "final_price",
    ].some(
      (a) =>
        h === normalizeHeader(a) ||
        h.startsWith(normalizeHeader(a)) ||
        h.includes(normalizeHeader(a)),
    ),
  );
  if (hasFinalPriceCol) return file;

  const hasValueCols = headerNorm.some((h) =>
    ["value", "valuetype", "value_type"].some(
      (a) => h === normalizeHeader(a) || h.startsWith(normalizeHeader(a)),
    ),
  );
  if (!hasValueCols) return file;

  let missingBasePrice = 0;
  let missingSku = 0;

  const converted = rows
    .map((row: ImportRow) => {
      const sku = String(
        getRowValue(row, ["sku", "variant_sku", "variantsku"]) ?? "",
      ).trim();
      if (!sku) {
        missingSku += 1;
        return null;
      }

      const basePrice = toNumberSafe(
        getRowValue(row, [
          "baseprice",
          "base_price",
          "base price",
          "hargaawal",
          "harga_awal",
        ]),
      );

      const valueTypeRaw = String(
        getRowValue(row, ["value_type", "valuetype", "value type"]) ??
          "percent",
      )
        .trim()
        .toLowerCase();

      const value = toNumberSafe(
        getRowValue(row, ["value", "discount_percent", "percent", "persen"]),
      );

      if (basePrice === null || value === null) {
        missingBasePrice += 1;
        return null;
      }

      const finalPrice =
        valueTypeRaw === "fixed"
          ? clamp(Math.round(basePrice - value), 0, basePrice)
          : clamp(
              Math.round(basePrice - (basePrice * value) / 100),
              0,
              basePrice,
            );

      const promoStock = getRowValue(row, [
        "promo_stock",
        "promostock",
        "promo stock",
      ]);

      const isActive = getRowValue(row, ["is_active", "active", "status"]);

      return {
        sku,
        harga_akhir: finalPrice,
        promo_stock: promoStock ?? "",
        is_active: isActive ?? "",
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;

  if (missingSku > 0) {
    message.error("SKU wajib diisi untuk import varian.");
    return null;
  }

  if (!converted.length) {
    message.error(
      `Tidak ada baris valid untuk di-import.\n` +
        `• Rows: ${rows.length}\n` +
        `• Headers: ${headerKeys.join(", ")}`,
    );
    return null;
  }

  if (missingBasePrice > 0) {
    message.error(
      "Konversi membutuhkan Base Price/Harga Awal dan value/value_type.",
    );
    return null;
  }

  message.success(
    `Auto-convert value/value_type → Harga Akhir berhasil: ${converted.length} baris`,
  );

  const csv = Papa.unparse(converted);
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  return new File([csv], `${baseName}-converted.csv`, { type: "text/csv" });
};
