export interface TransactionUser {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
}

export interface TransactionShipment {
  id: number;
  resiNumber: string | null;
  courier: string | null;
  service: string | null;
}

export interface TransactionDetail {
  id: number;
  productName: string;
  variantName: string | null;
  qty: number;
  price: number;
  discount: number;
  imageUrl: string | null;
}

export interface Transaction {
  id: number;
  transactionNumber: string;
  transactionStatus: string;
  failureSource: string | null;
  amount: number;
  createdAt: string | null;
  user: TransactionUser | null;
  shipments: TransactionShipment[];
  details: TransactionDetail[];
}

export interface TransactionListQuery {
  transactionNumber?: string;
  transactionStatus?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  perPage: number;
}
