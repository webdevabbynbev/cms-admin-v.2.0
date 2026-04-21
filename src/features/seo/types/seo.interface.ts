export interface SeoLiveStats {
  activeUsers: number;
  productClicks: number;
  topProduct: string;
  minutes: Array<{ minute: number; users: number }>;
  cities: Array<{ city: string; activeUsers: number }>;
}
