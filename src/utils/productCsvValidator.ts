export type CsvRow = Record<string, string>;

// ✅ schema 1: template lama
export const REQUIRED_HEADERS_TEMPLATE = ["name", "category_type_id"] as const;

// ✅ schema 2: master file — kolom wajib sesuai format export
export const REQUIRED_HEADERS_MASTER = [
  "nama produk",
  "master sku",
] as const;

export function normalizeHeader(h: string) {
  return (h || "")
    .replace(/^\uFEFF/, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeHeaders(fields: string[]) {
  return fields.map((f) =>
    String(f || "")
      .replace(/^\uFEFF/, "")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function isMasterHeaders(fields: string[]) {
  const norm = fields.map(normalizeHeader);
  return REQUIRED_HEADERS_MASTER.every((h) => norm.includes(h));
}

export function isTemplateHeaders(fields: string[]) {
  const norm = fields.map(normalizeHeader);
  return REQUIRED_HEADERS_TEMPLATE.every((h) => norm.includes(h));
}

export function validateHeaders(fields: string[]) {
  const norm = fields.map(normalizeHeader);

  const missTemplate = REQUIRED_HEADERS_TEMPLATE.filter((h) => !norm.includes(h));
  const missMaster = REQUIRED_HEADERS_MASTER.filter((h) => !norm.includes(h));

  const okTemplate = missTemplate.length === 0;
  const okMaster = missMaster.length === 0;

  if (okTemplate || okMaster) return null;

  return `Header CSV tidak cocok format.\nTemplate wajib: ${REQUIRED_HEADERS_TEMPLATE.join(", ")}.\nMaster wajib: ${REQUIRED_HEADERS_MASTER.join(", ")}`;
}

export function validateRowsTemplate(rows: CsvRow[]) {
  const errors: string[] = [];
  const seenSkus = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    // ✅ Skip completely empty rows (e.g. Excel trailing rows)
    const vals = Object.values(row).map((v) => (v || "").trim()).filter(Boolean);
    if (vals.length === 0) return;

    const name = (row.name || "").trim();
    const categoryId = (row.category_type_id || "").trim();
    const basePrice = (row.base_price || "").trim();
    const weight = (row.weight || "").trim();
    const isFlash = (row.is_flash_sale || "").trim();
    const sku = (row.sku || "").trim();

    if (!name) errors.push(`Baris ${rowNumber}: name wajib diisi`);
    if (!categoryId || isNaN(Number(categoryId)))
      errors.push(`Baris ${rowNumber}: category_type_id harus angka`);

    if (basePrice !== "" && (isNaN(Number(basePrice)) || Number(basePrice) < 0)) {
      errors.push(`Baris ${rowNumber}: base_price harus angka ≥ 0 (atau kosongin)`);
    }

    if (weight !== "" && (isNaN(Number(weight)) || Number(weight) < 0)) {
      errors.push(`Baris ${rowNumber}: weight harus angka ≥ 0`);
    }

    if (isFlash !== "" && !["0", "1"].includes(isFlash)) {
      errors.push(`Baris ${rowNumber}: is_flash_sale harus 0 atau 1`);
    }

    // template: kalau ada sku, cek duplikat sku
    if (sku) {
      if (seenSkus.has(sku)) {
        errors.push(`Baris ${rowNumber}: Terdapat duplikat SKU pada ${sku}`);
      } else {
        seenSkus.add(sku);
      }
    }
  });

  return errors;
}

// Deteksi baris keterangan dari template (baris ke-2 yang berisi deskripsi kolom)
function isTemplateDescriptionRow(row: CsvRow): boolean {
  const indicators = ["[wajib]", "(angka)", "(teks)", "(url)", "wajib]", "opsional", "pisahkan koma"];
  const firstVals = Object.values(row).slice(0, 5);
  return firstVals.some((v) => {
    const lower = (v || "").toLowerCase();
    return indicators.some((kw) => lower.includes(kw));
  });
}

export function validateRowsMaster(rows: CsvRow[]) {
  const errors: string[] = [];
  const seenBarcodes = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    // ✅ Skip completely empty rows (e.g. Excel trailing rows)
    const vals = Object.values(row).map((v) => (v || "").trim()).filter(Boolean);
    if (vals.length === 0) return;

    // ✅ Skip baris keterangan dari template download
    if (isTemplateDescriptionRow(row)) return;

    // Normalize semua key ke lowercase agar case-insensitive
    const r: CsvRow = {};
    for (const k of Object.keys(row)) r[k.toLowerCase()] = row[k];

    const namaProduk = (r["nama produk"] || "").trim();
    if (!namaProduk) errors.push(`Baris ${rowNumber}: "Nama Produk" wajib diisi`);

    const skuMaster = (r["master sku"] || "").trim();
    if (!skuMaster) {
      errors.push(`Baris ${rowNumber}: "Sku Master" wajib diisi`);
      return;
    }

    // ✅ duplikat sku master di-ignore (biar sesuai strategi backend last-row-wins)
    if (seenBarcodes.has(skuMaster)) return;
    seenBarcodes.add(skuMaster);
  });

  return errors;
}
