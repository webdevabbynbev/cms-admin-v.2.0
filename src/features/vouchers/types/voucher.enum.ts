export enum VoucherType {
  Product = 1,
  Shipping = 2,
  Cashback = 3,
  Gift = 4,
}

export enum VoucherRewardType {
  Discount = 1,
  FreeItem = 2,
  FreeShipping = 3,
  Cashback = 4,
}

export enum VoucherActiveStatus {
  Active = 1,
  Inactive = 2,
}

export enum VoucherScopeType {
  All = 0,
  Product = 1,
  Variant = 2,
  Brand = 3,
}

export enum VoucherValueMode {
  Percentage = 1,
  Fixed = 2,
}

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  [VoucherType.Product]: 'Produk',
  [VoucherType.Shipping]: 'Ongkir',
  [VoucherType.Cashback]: 'Cashback',
  [VoucherType.Gift]: 'Hadiah',
};

export const VOUCHER_REWARD_TYPE_LABELS: Record<VoucherRewardType, string> = {
  [VoucherRewardType.Discount]: 'Diskon',
  [VoucherRewardType.FreeItem]: 'Gratis Barang',
  [VoucherRewardType.FreeShipping]: 'Gratis Ongkir',
  [VoucherRewardType.Cashback]: 'Cashback',
};

export const VOUCHER_SCOPE_TYPE_LABELS: Record<VoucherScopeType, string> = {
  [VoucherScopeType.All]: 'Semua Produk',
  [VoucherScopeType.Product]: 'Per Produk',
  [VoucherScopeType.Variant]: 'Per Varian',
  [VoucherScopeType.Brand]: 'Per Brand',
};
