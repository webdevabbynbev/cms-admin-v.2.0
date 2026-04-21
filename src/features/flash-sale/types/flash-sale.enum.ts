export enum FlashSaleStatus {
  Upcoming = 'upcoming',
  Active = 'active',
  Ended = 'ended',
  Draft = 'draft',
}

export const FLASH_SALE_STATUS_LABELS: Record<FlashSaleStatus, string> = {
  [FlashSaleStatus.Upcoming]: 'Akan Datang',
  [FlashSaleStatus.Active]: 'Sedang Berjalan',
  [FlashSaleStatus.Ended]: 'Berakhir',
  [FlashSaleStatus.Draft]: 'Draft',
};
