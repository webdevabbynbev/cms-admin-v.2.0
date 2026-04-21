import type {
  Transaction,
  TransactionUser,
  TransactionShipment,
  TransactionDetail,
} from '../types';

function normalizeUser(raw: Record<string, unknown>): TransactionUser {
  return {
    id: Number(raw.id ?? 0),
    firstName: ((raw.firstName ?? raw.first_name) as string | null) ?? null,
    lastName: ((raw.lastName ?? raw.last_name) as string | null) ?? null,
    email: String(raw.email ?? ''),
    phoneNumber: ((raw.phoneNumber ?? raw.phone_number) as string | null) ?? null,
  };
}

function normalizeShipment(raw: Record<string, unknown>): TransactionShipment {
  return {
    id: Number(raw.id ?? 0),
    resiNumber: ((raw.resiNumber ?? raw.resi_number) as string | null) ?? null,
    courier: (raw.courier as string | null) ?? null,
    service: (raw.service as string | null) ?? null,
  };
}

function normalizeDetail(raw: Record<string, unknown>): TransactionDetail {
  return {
    id: Number(raw.id ?? 0),
    productName: String(raw.productName ?? raw.product_name ?? ''),
    variantName: ((raw.variantName ?? raw.variant_name) as string | null) ?? null,
    qty: Number(raw.qty ?? raw.quantity ?? 0),
    price: Number(raw.price ?? 0),
    discount: Number(raw.discount ?? 0),
    imageUrl: ((raw.imageUrl ?? raw.image_url) as string | null) ?? null,
  };
}

export function normalizeTransaction(raw: unknown): Transaction {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    transactionNumber: String(r.transactionNumber ?? r.transaction_number ?? ''),
    transactionStatus: String(r.transactionStatus ?? r.transaction_status ?? ''),
    failureSource: ((r.failureSource ?? r.failure_source) as string | null) ?? null,
    amount: Number(r.amount ?? 0),
    createdAt: ((r.createdAt ?? r.created_at) as string | null) ?? null,
    user: r.user ? normalizeUser(r.user as Record<string, unknown>) : null,
    shipments: Array.isArray(r.shipments)
      ? r.shipments.map((s) => normalizeShipment(s as Record<string, unknown>))
      : [],
    details: Array.isArray(r.details)
      ? r.details.map((d) => normalizeDetail(d as Record<string, unknown>))
      : [],
  };
}
