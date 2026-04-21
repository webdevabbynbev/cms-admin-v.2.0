export enum CustomerGender {
  Unspecified = 0,
  Male = 1,
  Female = 2,
}

export const CUSTOMER_GENDER_LABELS: Record<CustomerGender, string> = {
  [CustomerGender.Unspecified]: '-',
  [CustomerGender.Male]: 'Pria',
  [CustomerGender.Female]: 'Wanita',
};
