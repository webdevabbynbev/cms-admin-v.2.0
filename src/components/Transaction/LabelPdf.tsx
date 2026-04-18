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

// Register fonts if needed, but standard ones are safer for initial implementation
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#000",
  },

  // Header section
  header: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    borderTop: "1px solid #000",
  },
  headerLeft: {
    width: "25%",
    padding: 5,
    borderRight: "1px solid #000",
    justifyContent: "center",
    alignItems: "center",
  },
  headerMid: {
    width: "40%",
    padding: 5,
    borderRight: "1px solid #000",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRight: {
    width: "35%",
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: "auto",
  },
  carrierTitle: {
    fontSize: 16,
    fontWeight: "heavy",
  },
  sortingCode: {
    fontSize: 18,
    fontWeight: "bold",
  },

  // Resi section
  resiSection: {
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    borderBottom: "1px solid #000",
    padding: 5,
    flexDirection: "column",
    alignItems: "center",
  },
  resiText: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 2,
  },
  barcode: {
    width: "85%",
    height: 40,
    marginTop: 5,
  },
  senderInfo: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    fontSize: 8,
  },

  // Recipient section
  recipientBox: {
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    borderBottom: "1px solid #000",
    flexDirection: "row",
  },
  recipientLeft: {
    width: "70%",
    padding: 5,
    borderRight: "1px solid #000",
  },
  recipientRight: {
    width: "30%",
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  labelTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
    textDecoration: "underline",
  },
  recipientName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 2,
  },
  recipientAddress: {
    fontSize: 8,
    lineHeight: 1.2,
  },

  // Region Breakdown Box
  regionBox: {
    flexDirection: "row",
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    borderBottom: "1px solid #000",
  },
  regionCell: {
    flex: 1,
    padding: 4,
    borderRight: "1px solid #000",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "bold",
  },

  // Weight / Payment Info
  infoGrid: {
    flexDirection: "row",
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    borderBottom: "1px solid #000",
  },
  infoCell: {
    flex: 1,
    padding: 4,
    borderRight: "1px solid #000",
    fontSize: 8,
  },

  // Table Section
  table: {
    marginTop: 10,
    borderTop: "1px solid #000",
    borderLeft: "1px solid #000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    borderRight: "1px solid #000",
    minHeight: 18,
    alignItems: "stretch", // Ensure col separators span full height
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    alignItems: "center",
  },
  cellNo: {
    width: "5%",
    textAlign: "center",
    fontSize: 7,
    padding: 3,
    borderRight: "1px solid #000",
  },
  cellName: {
    width: "50%",
    padding: 3,
    fontSize: 7,
    borderRight: "1px solid #000",
  },
  cellImg: {
    width: 20,
    height: 20,
    marginRight: 4,
    objectFit: "cover",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cellSku: {
    width: "20%",
    padding: 3,
    fontSize: 7,
    borderRight: "1px solid #000",
    textAlign: "center",
  },
  cellVariant: {
    width: "20%",
    padding: 3,
    fontSize: 7,
    borderRight: "1px solid #000",
    textAlign: "center",
  },
  cellQty: {
    width: "10%",
    textAlign: "center",
    fontSize: 7,
    padding: 3,
  },

  footerNote: {
    marginTop: 5,
    fontSize: 7,
    fontStyle: "italic",
  },
});

export default function LabelPdf({
  tx,
  barcodeSrc,
  qrSrc,
  logoSrc,
}: {
  tx: any;
  barcodeSrc: string;
  qrSrc?: string;
  logoSrc?: string;
}) {
  const sh = tx?.shipments?.[0];
  const user = tx?.ecommerce?.user || tx?.user;
  const addr = tx?.ecommerce?.userAddress;

  const resi = sh?.resiNumber || sh?.resi_number || "-";
  const courierBrand = (sh?.service || "STD").toUpperCase();
  const courierType = (sh?.serviceType || "EZ").toUpperCase();
  const transactionNum = tx?.transactionNumber || "-";

  const receiverName = (
    sh?.pic ||
    user?.fullName ||
    user?.name ||
    "-"
  ).toUpperCase();
  const receiverPhone = (
    sh?.pic_phone ||
    sh?.picPhone ||
    user?.phone ||
    "-"
  ).trim();

  // Address components
  const districtLine = (addr?.districtData?.name || "").toUpperCase();
  const cityLine = (addr?.cityData?.name || "").toUpperCase();
  const subDistrictLine = (addr?.subDistrictData?.name || "").toUpperCase();

  const fullAddress = [
    addr?.address,
    subDistrictLine,
    districtLine,
    cityLine,
    addr?.provinceData?.name?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(", ");

  const formatWeight = (w: any) => {
    const gram = Number(w) || 0;
    if (gram >= 1000) return `${(gram / 1000).toFixed(1)} kg`;
    return `${gram} gr`;
  };

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        {/* TOP HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                Abby N Bev
              </Text>
            )}
          </View>
          <View style={styles.headerMid}>
            <Text style={styles.carrierTitle}>{courierBrand}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.sortingCode}>
              {cityLine.substring(0, 3) || "HUB"}
            </Text>
          </View>
        </View>

        {/* RESI & BARCODE */}
        <View style={styles.resiSection}>
          <Image src={barcodeSrc} style={styles.barcode} />
          <Text style={styles.resiText}>No. Resi: {resi}</Text>
          <View style={styles.senderInfo}>
            <Text>Pengirim: Abby N Bev</Text>
            <Text>6287777838855</Text>
          </View>
        </View>

        {/* RECIPIENT BOX */}
        <View style={styles.recipientBox}>
          <View style={styles.recipientLeft}>
            <Text style={styles.labelTitle}>Penerima: {receiverName}</Text>
            <Text style={styles.recipientAddress}>{fullAddress}</Text>
            <Text style={{ marginTop: 2, fontSize: 8 }}>
              Telp: {receiverPhone}
            </Text>
          </View>
          <View style={styles.recipientRight}>
            {qrSrc ? (
              <Image src={qrSrc} style={{ width: 60, height: 60 }} />
            ) : (
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                {courierType}
              </Text>
            )}
          </View>
        </View>

        {/* REGION BREAKDOWN (Like the boxes in the middle of Shopee label) */}
        <View style={styles.regionBox}>
          <View style={styles.regionCell}>
            <Text>{cityLine}</Text>
          </View>
          <View style={styles.regionCell}>
            <Text>{districtLine}</Text>
          </View>
          <View style={[styles.regionCell, { borderRight: 0 }]}>
            <Text>{subDistrictLine}</Text>
          </View>
        </View>

        {/* EXTRA INFO */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text>Berat: {formatWeight(tx?.totalWeight)}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text>COD: {tx?.paymentMethod === "cod" ? "Ya" : "Tidak"}</Text>
          </View>
          <View style={[styles.infoCell, { borderRight: 0 }]}>
            <Text>No. Pesanan: {transactionNum}</Text>
          </View>
        </View>

        {/* PRODUCT TABLE */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.cellNo}>#</Text>
            <Text style={styles.cellName}>Nama Produk</Text>
            <Text style={styles.cellSku}>SKU</Text>
            <Text style={styles.cellVariant}>Variasi</Text>
            <Text style={styles.cellQty}>Qty</Text>
          </View>
          {(() => {
            const details = tx?.details || [];

            const parseItemAttributes = (d: any) => {
              const rawAttributes = d.attributes;
              if (!rawAttributes) return {};
              if (typeof rawAttributes === "string") {
                try {
                  return JSON.parse(rawAttributes);
                } catch {
                  return {};
                }
              }
              return rawAttributes;
            };

            // Support B1G1 extraction
            const { regularItems, giftItems } =
              extractGiftsFromDetails(details);

            const allRows: any[] = [
              ...regularItems.map((d: any) => ({ ...d, isGiftMode: false })),
              ...giftItems.map((d: any) => ({ ...d, isGiftMode: true })),
            ];

            return allRows.map((item: any, idx: number) => {
              const attr = parseItemAttributes(item);
              const isGiftMode = item.isGiftMode;

              // Brand logic: follow modal's robustness
              const brand = isGiftMode
                ? attr?.brand_name || item.product?.brand?.name || "AB"
                : item.product?.brand?.name || attr?.brand_name || "AB";

              const productName = isGiftMode
                ? attr?.name || item.name || item.product?.name || "Item"
                : item.product?.name || item.name || attr?.name || "Item";

              // Variasi: untuk gift, ekstrak dari nama; untuk reguler, dari variant.attributes[].value
              let variasi = "-";
              if (isGiftMode) {
                const giftName =
                  attr?.gift_name ||
                  attr?.name ||
                  item.product?.name ||
                  item.name ||
                  "";
                if (giftName) {
                  const parts = giftName.split(" - ");
                  if (parts.length >= 3) {
                    const variant = parts.slice(2).join(" - ").trim();
                    variasi =
                      variant.toLowerCase() === "default"
                        ? "-"
                        : variant || "-";
                  }
                }
              } else {
                if (item.variant?.attributes) {
                  let vAttrs = item.variant.attributes;
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
                          a?.value ||
                          a?.attribute_value ||
                          a?.attributeValue ||
                          "",
                      )
                      .filter(
                        (v: string) =>
                          v && v.trim().toLowerCase() !== "default",
                      );
                    if (vals.length > 0) variasi = vals.join(" / ");
                  }
                }
                if (variasi === "-") {
                  variasi = getProductVariantDisplay(item, isGiftMode) || "-";
                }
              }

              // SKU: untuk gift, dari attr.gift_sku; untuk reguler, dari variant.barcode
              const skuValue = isGiftMode
                ? attr?.gift_sku ||
                  attr?.sku ||
                  item.product?.sku ||
                  item.variant?.sku ||
                  "-"
                : item.variant?.barcode || item.variant?.sku || "-";

              const nameParts = [brand, productName];
              let cleanDisplayValue = nameParts.join(" - ");
              if (isGiftMode) {
                cleanDisplayValue = `(HADIAH) ${cleanDisplayValue}`;
              } else if (attr?.is_b1g1 || attr?.buyOneGetOneItemId) {
                cleanDisplayValue = `(B1G1) ${cleanDisplayValue}`;
              }

              const img = isGiftMode
                ? attr?.image_url ||
                  attr?.imageUrl ||
                  attr?.thumbnail ||
                  item.product?.thumbnail ||
                  item.product?.medias?.[0]?.url
                : item.product?.thumbnail || item.product?.medias?.[0]?.url;

              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.cellNo}>{idx + 1}</Text>
                  <View style={styles.cellName}>
                    <View style={styles.nameRow}>
                      {img && <Image src={img} style={styles.cellImg} />}
                      <Text style={{ flex: 1 }}>{cleanDisplayValue}</Text>
                    </View>
                  </View>
                  <Text style={styles.cellSku}>{skuValue}</Text>
                  <Text style={styles.cellVariant}>{variasi || "-"}</Text>
                  <Text style={styles.cellQty}>{item.qty}</Text>
                </View>
              );
            });
          })()}
        </View>

        <Text style={styles.footerNote}>Pesan: ({transactionNum})</Text>
      </Page>
    </Document>
  );
}
