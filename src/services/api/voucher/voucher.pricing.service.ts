type ResolveVoucherDiscountArgs = {
  basePrice: number;
  isShipping: boolean;
  isPercent: boolean;
  percent: number;
  maxDisc: number;
  amount: number;
  formatMoney: (value: number) => string;
};

export const resolveVoucherDiscount = ({
  basePrice,
  isShipping,
  isPercent,
  percent,
  maxDisc,
  amount,
  formatMoney,
}: ResolveVoucherDiscountArgs) => {
  const price = Number(basePrice ?? 0) || 0;
  if (!price || isShipping) {
    return {
      after: price,
      discount: 0,
      label: isShipping ? "Voucher ongkir" : "-",
    };
  }

  if (isPercent) {
    if (percent <= 0) return { after: price, discount: 0, label: "-" };
    let discount = (price * percent) / 100;
    if (maxDisc > 0) discount = Math.min(discount, maxDisc);
    const after = Math.max(0, price - discount);
    const label =
      maxDisc > 0 ? `${percent}% (max Rp ${formatMoney(maxDisc)})` : `${percent}%`;
    return { after, discount, label };
  }

  if (amount <= 0) return { after: price, discount: 0, label: "-" };
  const discount = Math.min(price, amount);
  const after = Math.max(0, price - discount);
  return { after, discount, label: `Rp ${formatMoney(discount)}` };
};
