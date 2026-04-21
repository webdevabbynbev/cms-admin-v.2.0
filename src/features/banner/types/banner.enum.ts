export enum BannerType {
  HeroCarousel = 'hero_carousel',
  BannerTopHome = 'banner_top_home',
  PageSale = 'page_sale',
  FeaturedSection = 'featured_section',
  General = 'general',
}

export enum BannerPosition {
  BottomLeft = 'bottom-left',
  TopLeft = 'top-left',
  TopRight = 'top-right',
  Center = 'center',
}

export const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  [BannerType.HeroCarousel]: 'Hero Carousel',
  [BannerType.BannerTopHome]: 'Banner Top Home',
  [BannerType.PageSale]: 'Page Sale',
  [BannerType.FeaturedSection]: 'Featured Section',
  [BannerType.General]: 'General',
};

export const BANNER_POSITION_LABELS: Record<BannerPosition, string> = {
  [BannerPosition.BottomLeft]: 'Bottom Left',
  [BannerPosition.TopLeft]: 'Top Left',
  [BannerPosition.TopRight]: 'Top Right',
  [BannerPosition.Center]: 'Center',
};
