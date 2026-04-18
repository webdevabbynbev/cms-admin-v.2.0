import {
  extractGiftsFromDetails,
  getProductVariantDisplay,
} from "../../../utils/b1g1GiftUtils";
import { getTransactionStepCurrent } from "../transactionUtils";

export class TransactionDetailModel {
  data: any;

  constructor(data: any) {
    this.data = data;
  }

  get qty() {
    return this.data.qty || 0;
  }
  get price() {
    return Number(this.data.price || 0);
  }
  get discount() {
    return Number(this.data.discount || 0);
  }
  get amount() {
    return Number(this.data.amount) || this.price * this.qty - this.discount;
  }
  get originalSubtotal() {
    return this.price * this.qty;
  }
  get unitAmount() {
    return this.amount / this.qty;
  }

  get isGift() {
    return Boolean(
      this.data.isGiftItem || this.data.is_gift_item || this.data.is_b1g1_gift,
    );
  }

  get isB1G1() {
    const attr = this.parsedAttributes;
    return Boolean(attr?.is_b1g1 || attr?.buyOneGetOneItemId);
  }

  get parsedAttributes() {
    const raw = this.data.attributes;
    if (!raw) return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return raw;
  }

  get brandName() {
    const attr = this.parsedAttributes;
    return this.isGift
      ? attr?.brand_name || (this.data.product as any)?.brand?.name || ""
      : (this.data.product as any)?.brand?.name || attr?.brand_name || "";
  }

  get productName() {
    const attr = this.parsedAttributes;
    return this.isGift
      ? attr?.name ||
          this.data.name ||
          this.data.product?.name ||
          "Produk Hadiah"
      : this.data.product?.name || this.data.name || attr?.name || "Produk";
  }

  get imageUrl() {
    const attr = this.parsedAttributes;
    return this.isGift
      ? attr?.image_url ||
          attr?.imageUrl ||
          attr?.thumbnail ||
          attr?.image ||
          this.data.product?.thumbnail ||
          this.data.product?.medias?.[0]?.url ||
          this.data.product?.image ||
          ""
      : this.data.product?.thumbnail ||
          this.data.product?.medias?.[0]?.url ||
          this.data.product?.image ||
          "";
  }

  get variantName() {
    if (this.isGift) {
      const attr = this.parsedAttributes || {};
      const giftName =
        attr?.gift_name ||
        attr?.name ||
        this.data.product?.name ||
        this.data.name ||
        "";
      if (giftName) {
        const parts = giftName.split(" - ");
        if (parts.length >= 3) {
          const variant = parts.slice(2).join(" - ").trim();
          const clean = variant.toLowerCase() === "default" ? "" : variant;
          if (clean) return clean;
        }
      }
      return "-";
    }

    if (this.data.variant?.attributes) {
      let vAttrs = this.data.variant.attributes;
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
        if (vals.length > 0) return vals.join(" / ");
      }
    }

    return getProductVariantDisplay(this.data, this.isGift) || "-";
  }

  get skuOrBarcode() {
    if (this.isGift) {
      const attr = this.parsedAttributes || {};
      return (
        attr?.gift_sku ||
        attr?.sku ||
        this.data.product?.sku ||
        this.data.variant?.sku ||
        "-"
      );
    }
    return this.data.variant?.barcode || this.data.variant?.sku || "-";
  }
}

export class TransactionModel {
  data: any;

  constructor(data: any) {
    this.data = data;
  }

  // Identity
  get id() {
    return this.data.id;
  }
  get transactionNumber() {
    return this.data.transactionNumber;
  }
  get rawStatus() {
    return String(this.data.transactionStatus ?? "");
  }
  get amount() {
    return this.data.amount;
  }
  get createdAt() {
    return this.data.createdAt || this.data.created_at;
  }

  // User
  get user() {
    return this.data.user || {};
  }
  get userId() {
    return this.user.id;
  }
  get customerName() {
    const u = this.user;
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    return name || u.fullName || u.name || "-";
  }
  get customerEmail() {
    return this.user.email || "-";
  }
  get customerPhone() {
    return this.user.phone || "-";
  }

  // Shipment
  get shipment() {
    return this.data.shipments?.[0] || {};
  }
  get hasResi() {
    return Boolean(this.shipment.resiNumber || this.shipment.resi_number);
  }
  get resi() {
    return this.shipment.resiNumber || this.shipment.resi_number || "-";
  }
  get courierService() {
    return this.shipment.service || "-";
  }
  get courierServiceType() {
    return this.shipment.serviceType || "-";
  }
  get picName() {
    return this.shipment.pic || "-";
  }
  get picPhone() {
    return this.shipment.picPhone || this.shipment.pic_phone || "-";
  }
  get shippingCost() {
    return Number(
      this.data.shippingCost ||
        this.data.shipping_cost ||
        this.data.ecommerce?.shippingCost ||
        this.shipment.price ||
        0,
    );
  }

  get paymentMethod() {
    return String(
      this.data.ecommerce?.paymentMethod ||
        this.data.paymentMethod ||
        "MANUAL TRANSFER",
    ).toUpperCase();
  }

  // Details
  get details() {
    return (this.data.details || []).map(
      (d: any) => new TransactionDetailModel(d),
    );
  }

  get separatedItems() {
    const { regularItems, giftItems } = extractGiftsFromDetails(
      this.data.details || [],
    );
    return {
      regularItems: regularItems.map((d: any) => new TransactionDetailModel(d)),
      giftItems: giftItems.map((d: any) => new TransactionDetailModel(d)),
    };
  }

  // Subtotals & Discounts
  get subtotal() {
    return Number(
      this.data.itemsSubtotal ||
        this.data.subTotal ||
        this.data.sub_total ||
        this.details.reduce(
          (acc: number, d: TransactionDetailModel) => acc + d.price * d.qty,
          0,
        ),
    );
  }

  get totalDiscount() {
    return Number(
      this.data.discountTotal ||
        this.data.discountAmount ||
        this.data.discount ||
        0,
    );
  }

  get productDiscount() {
    return this.details
      .filter((d: TransactionDetailModel) => d.price > 0)
      .reduce((acc: number, d: TransactionDetailModel) => acc + d.discount, 0);
  }

  get discountBreakdown() {
    const diskonProduk = this.productDiscount;
    const remainingDiscount = Math.max(0, this.totalDiscount - diskonProduk);

    // Up to max `shippingCost` (capped at 10,000) from the remaining could be the shipping voucher
    const maxShippingDiscount = Math.min(this.shippingCost, 10000);
    const diskonVoucherOngkir =
      remainingDiscount > maxShippingDiscount
        ? maxShippingDiscount
        : remainingDiscount;

    const diskonVoucherBelanja = Math.max(
      0,
      remainingDiscount - diskonVoucherOngkir,
    );

    const ongkirDibayarPembeli = this.shippingCost - diskonVoucherOngkir;

    return {
      diskonProduk,
      diskonVoucherOngkir,
      diskonVoucherBelanja,
      ongkirDibayarPembeli,
    };
  }

  // Steps
  get stepCurrent() {
    return getTransactionStepCurrent(this.rawStatus);
  }
}
