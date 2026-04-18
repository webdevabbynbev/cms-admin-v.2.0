import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import {
  extractGiftsFromDetails,
  getProductVariantDisplay,
} from "../../utils/b1g1GiftUtils";

const MAG = "#9B3C6C";
const GRAY = "#777";
const LIGHT = "#F5F5F5";
const BORDER = "#E8E8E8";

const S = StyleSheet.create({
  page: {
    padding: "30px 40px",
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#333",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  logoArea: { flexDirection: "column" },
  logo: { width: 110, height: 50, objectFit: "contain" },
  logoText: { fontSize: 18, fontWeight: "bold", color: MAG },
  headerRight: { alignItems: "flex-end" },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: MAG,
    marginBottom: 3,
  },
  txNumber: { fontSize: 11, fontWeight: "bold", marginBottom: 2 },
  txDate: { fontSize: 9, color: GRAY },

  // Buyer box
  infoBox: {
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: BORDER,
    padding: "10px 12px",
    marginBottom: 14,
    borderRadius: 2,
  },
  infoGrid: { flexDirection: "row", marginBottom: 6 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 8, color: GRAY, marginBottom: 2 },
  infoValue: { fontSize: 9, fontWeight: "bold" },
  infoValueNormal: { fontSize: 9 },

  // Transaction meta
  metaRow: { flexDirection: "row", marginBottom: 14 },
  metaCell: { flex: 1, paddingRight: 8 },
  metaHead: { fontSize: 8, color: GRAY, marginBottom: 2, fontWeight: "bold" },
  metaVal: { fontSize: 9 },
  metaValAccent: { fontSize: 9, color: MAG },

  // Section title
  sectionTitle: { fontSize: 10, fontWeight: "bold", marginBottom: 6 },
  subSectionTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    backgroundColor: "#FFF3F8",
    padding: "4px 6px",
    borderTopWidth: 1,
    borderColor: BORDER,
    color: MAG,
    marginTop: 6,
  },

  // Table
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    padding: "6px 4px",
    fontWeight: "bold",
    fontSize: 8.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: BORDER,
    padding: "8px 4px",
    alignItems: "flex-start",
  },
  cNo: { width: "5%", textAlign: "center" },
  cProduk: { width: "47%" },
  cVariasi: { width: "19%" },
  cHarga: { width: "15%", textAlign: "right" },
  cQty: { width: "5%", textAlign: "center" },
  cSubtotal: { width: "10%", textAlign: "right" },
  rowTop: { flexDirection: "row", alignItems: "center" },

  // Subtotal under table
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 6,
    paddingBottom: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },

  // Payment breakdown
  payBox: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  payInner: {
    width: "46%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 2,
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "6px 10px",
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  payLabel: { fontSize: 9, color: "#444" },
  payValue: { fontSize: 9 },
  payDiscount: { fontSize: 9, color: "#D32F2F" },
  payTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "8px 10px",
    backgroundColor: LIGHT,
  },
  payTotalLabel: { fontSize: 10, fontWeight: "bold" },
  payTotalValue: { fontSize: 10, fontWeight: "bold", color: MAG },

  // Footer
  footer: { position: "absolute", bottom: 24, left: 40, right: 40 },
  footerLine: {
    borderTopWidth: 1,
    borderColor: BORDER,
    paddingTop: 8,
    fontSize: 7.5,
    color: "#AAA",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pageNum: { fontSize: 8, color: "#999", textAlign: "center", marginTop: 4 },
});

function money(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("id-ID").format(n);
}

function safeAttr(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function formatDate(d: any) {
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

const TableHeader = () => (
  <View style={S.tableHead}>
    <Text style={S.cNo}>No.</Text>
    <Text style={S.cProduk}>Produk</Text>
    <Text style={S.cVariasi}>Variasi</Text>
    <Text style={S.cHarga}>Harga Produk</Text>
    <Text style={S.cQty}>Qty</Text>
    <Text style={S.cSubtotal}>Subtotal</Text>
  </View>
);

export default function InvoicePdf({
  tx,
  logoSrc,
  title,
}: {
  tx: any;
  logoSrc?: string;
  title?: string;
}) {
  const ec = tx?.ecommerce;
  const user = ec?.user || tx?.user;
  const addr = ec?.userAddress;
  const sh = tx?.shipments?.[0];
  const details: any[] = tx?.details || [];

  const fullAddress = [
    addr?.address,
    addr?.subDistrictData?.name,
    addr?.districtData?.name,
    addr?.cityData?.name,
    addr?.provinceData?.name,
    addr?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const buyerName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.fullName ||
    user?.name ||
    sh?.pic ||
    "-";
  const buyerPhone = sh?.pic_phone || sh?.picPhone || user?.phone || "-";
  const txDate = formatDate(tx?.createdAt || tx?.created_at);
  const payMethod = (
    ec?.paymentMethod ||
    tx?.paymentMethod ||
    "Transfer Manual"
  ).toUpperCase();
  const courier = sh?.service || "-";

  // ── SEPARATE PRODUCTS (Support B1G1 extraction) ──
  const items = details || [];
  const { regularItems, giftItems } = extractGiftsFromDetails(items);

  // ── PAYMENT NUMBERS (fallback for API keys + automatic sum if 0) ──
  const calcSubtotal = regularItems.reduce(
    (acc, d) => acc + Number(d.price || 0) * Number(d.qty || 1),
    0,
  );
  const itemsSubtotal =
    Number(tx?.itemsSubtotal || tx?.subTotal || tx?.sub_total || 0) ||
    calcSubtotal;
  const shippingCost = Number(
    tx?.shippingCost || tx?.shipping_cost || sh?.price || 0,
  );
  const totalAmount = Number(
    tx?.amount || tx?.grandTotal || tx?.grand_total || 0,
  );

  // Split Discounts
  let discountItems = regularItems.reduce(
    (acc, d) => acc + Number(d.discount || 0),
    0,
  );
  const totalDiscount = Number(
    tx?.discountTotal || tx?.discountAmount || tx?.discount || 0,
  );

  let discountShipping = Math.max(0, totalDiscount - discountItems);
  const maxShippingDiscount = Math.min(shippingCost, 10000);
  if (discountShipping > maxShippingDiscount) {
    const overage = discountShipping - maxShippingDiscount;
    discountShipping = maxShippingDiscount;
    discountItems += overage;
  }

  const renderRow = (d: any, idx: number, isGift: boolean) => {
    const attr = safeAttr(d.attributes);

    // Name Hierarchy:
    // If it's a gift (extracted from B1G1), prioritize the attribute name (Garnier).
    // Otherwise use the product name (Cushion).
    const prodName = isGift
      ? attr?.name || d.product?.name || d.name || "Hadiah"
      : d.product?.name || d.name || attr?.name || "Produk";

    const brandName = isGift
      ? attr?.brand_name || d.product?.brand?.name || ""
      : d.product?.brand?.name ||
        (d as any).brandName ||
        attr?.brand_name ||
        "";

    const displayName = brandName ? `${brandName} - ${prodName}` : prodName;

    // Variasi: untuk gift, ekstrak dari nama; untuk reguler, dari variant.attributes[].value
    let variantName = "-";
    if (isGift) {
      const giftName =
        attr?.gift_name || attr?.name || d.product?.name || d.name || "";
      if (giftName) {
        const parts = giftName.split(" - ");
        if (parts.length >= 3) {
          const variant = parts.slice(2).join(" - ").trim();
          variantName =
            variant.toLowerCase() === "default" ? "-" : variant || "-";
        }
      }
    } else {
      if (d.variant?.attributes) {
        let vAttrs = d.variant.attributes;
        if (typeof vAttrs === "string") {
          try {
            vAttrs = JSON.parse(vAttrs);
          } catch {
            vAttrs = [];
          }
        }
        if (Array.isArray(vAttrs) && vAttrs.length > 0) {
          const vals = vAttrs
            .map(
              (a: any) =>
                a?.value || a?.attribute_value || a?.attributeValue || "",
            )
            .filter((v: string) => v && v.trim().toLowerCase() !== "default");
          if (vals.length > 0) variantName = vals.join(" / ");
        }
      }
      if (variantName === "-") {
        variantName = getProductVariantDisplay(d, isGift) || "-";
      }
    }

    const unitPrice = isGift ? 0 : Number(d.price);
    const qty = d.qty || 1;
    const subtotal = isGift ? 0 : unitPrice * qty;
    const discount = isGift ? 0 : Number(d.discount || 0);
    const finalAmt = isGift ? 0 : Number(d.amount) || subtotal - discount;
    const finalUnitPrice = isGift ? 0 : finalAmt / qty;

    return (
      <View key={`row-${d.id || idx}-${isGift}`} style={S.tableRow}>
        <Text style={S.cNo}>{idx + 1}</Text>
        <View style={S.cProduk}>
          <View style={S.rowTop}>
            <View style={{ flex: 1 }}>
              <Text>{displayName}</Text>
            </View>
          </View>
        </View>
        <Text style={S.cVariasi}>{variantName}</Text>
        <View
          style={[
            S.cHarga,
            { flexDirection: "column", alignItems: "flex-end" },
          ]}
        >
          {discount > 0 && (
            <Text
              style={{
                fontSize: 7,
                color: GRAY,
                textDecoration: "line-through",
                marginBottom: 2,
              }}
            >
              Rp{money(unitPrice)}
            </Text>
          )}
          <Text>Rp{money(discount > 0 ? finalUnitPrice : unitPrice)}</Text>
        </View>
        <Text style={S.cQty}>{qty}</Text>
        <View
          style={[
            S.cSubtotal,
            { flexDirection: "column", alignItems: "flex-end" },
          ]}
        >
          {discount > 0 && (
            <Text
              style={{
                fontSize: 7,
                color: GRAY,
                textDecoration: "line-through",
                marginBottom: 2,
              }}
            >
              Rp{money(subtotal)}
            </Text>
          )}
          <Text>Rp{money(discount > 0 ? finalAmt : subtotal)}</Text>
        </View>
      </View>
    );
  };

  return (
    <Document title={title || `Invoice_${tx?.transactionNumber || "tx"}`}>
      <Page size="A4" style={S.page}>
        {/* ── HEADER ── */}
        <View style={S.header}>
          <View style={S.logoArea}>
            {logoSrc ? (
              <Image src={logoSrc} style={S.logo} />
            ) : (
              <Text style={S.logoText}>Abby N Bev</Text>
            )}
          </View>
          <View style={S.headerRight}>
            <Text style={S.invoiceTitle}>INVOICE</Text>
            <Text style={S.txNumber}>{tx?.transactionNumber || "-"}</Text>
            <Text style={S.txDate}>{txDate}</Text>
          </View>
        </View>

        {/* ── BUYER BOX ── */}
        <View style={S.infoBox}>
          <View style={S.infoGrid}>
            <View style={S.infoCol}>
              <Text style={S.infoLabel}>Nama Pembeli</Text>
              <Text style={S.infoValue}>{buyerName}</Text>
            </View>
            <View style={S.infoCol}>
              <Text style={S.infoLabel}>Nama Penjual</Text>
              <Text style={S.infoValue}>Abby N Bev</Text>
            </View>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={S.infoLabel}>Alamat Pembeli</Text>
            <Text style={S.infoValueNormal}>{fullAddress || "-"}</Text>
          </View>
          <View>
            <Text style={S.infoLabel}>No. Handphone Pembeli</Text>
            <Text style={S.infoValueNormal}>{buyerPhone}</Text>
          </View>
        </View>

        {/* ── META STRIP ── */}
        <View style={S.metaRow}>
          <View style={S.metaCell}>
            <Text style={S.metaHead}>No. Pesanan</Text>
            <Text style={S.metaValAccent}>{tx?.transactionNumber || "-"}</Text>
          </View>
          <View style={S.metaCell}>
            <Text style={S.metaHead}>Tanggal Transaksi</Text>
            <Text style={S.metaVal}>{txDate}</Text>
          </View>
          <View style={S.metaCell}>
            <Text style={S.metaHead}>Metode Pembayaran</Text>
            <Text style={S.metaVal}>{payMethod}</Text>
          </View>
          <View style={S.metaCell}>
            <Text style={S.metaHead}>Jasa Kirim</Text>
            <Text style={S.metaVal}>{courier}</Text>
          </View>
        </View>

        {/* ── PRODUCT TABLE ── */}
        <Text style={S.sectionTitle}>Rincian Pesanan</Text>

        {/* Produk header */}
        <TableHeader />
        {regularItems.length > 0 ? (
          regularItems.map((d, i) => renderRow(d, i, false))
        ) : (
          <View style={S.tableRow}>
            <Text style={{ color: GRAY }}>Tidak ada produk</Text>
          </View>
        )}

        {/* Subtotal row under regular products */}
        <View style={S.subtotalRow}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontWeight: "bold", fontSize: 9 }}>
              Subtotal &nbsp;&nbsp; Rp{money(itemsSubtotal)}
            </Text>
            <Text style={{ fontSize: 7.5, color: GRAY }}>
              Total Kuantitas (Aktif) {regularItems.length} produk
            </Text>
          </View>
        </View>

        {/* ── HADIAH SECTION (same headers, separate block) ── */}
        {giftItems.length > 0 && (
          <>
            <Text style={S.subSectionTitle}>Hadiah</Text>
            <TableHeader />
            {giftItems.map((d, i) => renderRow(d, i, true))}
          </>
        )}

        {/* ── PAYMENT BREAKDOWN (synced with management modal) ── */}
        <View style={S.payBox}>
          <View style={S.payInner}>
            <View style={S.payRow}>
              <Text style={S.payLabel}>Subtotal Pesanan</Text>
              <Text style={S.payValue}>Rp{money(itemsSubtotal)}</Text>
            </View>
            <View style={S.payRow}>
              <Text style={S.payLabel}>Ongkir Dibayar Pembeli</Text>
              <Text style={S.payValue}>Rp{money(shippingCost)}</Text>
            </View>
            {discountItems > 0 && (
              <View style={S.payRow}>
                <Text style={S.payLabel}>Diskon Produk</Text>
                <Text style={S.payDiscount}>- Rp{money(discountItems)}</Text>
              </View>
            )}
            {discountShipping > 0 && (
              <View style={S.payRow}>
                <Text style={S.payLabel}>Diskon Ongkir</Text>
                <Text style={S.payDiscount}>- Rp{money(discountShipping)}</Text>
              </View>
            )}
            <View style={[S.payRow, { borderBottomWidth: 0 }]}>
              <Text
                style={[
                  S.payLabel,
                  { color: MAG, fontWeight: "bold", fontSize: 10 },
                ]}
              >
                Total Pembayaran
              </Text>
              <Text style={{ fontSize: 10, fontWeight: "bold", color: MAG }}>
                Rp{money(totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={S.footer}>
          <View style={S.footerLine}>
            <Text>Abby N Bev — Jakarta, Indonesia — +62 877-7783-8855</Text>
            <Text>Invoice dibuat otomatis oleh sistem.</Text>
          </View>
          <Text style={S.pageNum}>1 of 1 — End of receipt</Text>
        </View>
      </Page>
    </Document>
  );
}
