export type Props = { mode: "create" | "edit" };

export type VariantRow = {
  productVariantId: number;
  productId: number;
  brandId?: number | null;
  brandName?: string | null;

  productName: string;
  sku: string | null;

  label: string;
  variantName: string;

  basePrice: number;
  stock: number;

  isActive: boolean;

  discountPrice: number | null;
  discountPercent: number | null;
  lastEdited: "price" | "percent" | null;

  promoStock: number | null;
  purchaseLimit: number | null;

  maxDiscount: number | null;
  image?: string | null;
};

export type ProductGroupRow = {
  key: string;
  productId: number;
  brandId?: number | null;
  brandName?: string | null;
  productName: string;
  totalVariants: number;
  image?: string | null;
  variants: VariantRow[];
};

export type BrandGroupRow = {
  key: string;
  brandId: number | null;
  brandName: string;
  totalProducts: number;
  totalVariants: number;
  products: ProductGroupRow[];
};
