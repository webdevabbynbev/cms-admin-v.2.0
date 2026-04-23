const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

export const env = {
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID as string | undefined,
  MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined,
} as const;

export const config = {
  enableAnalytics: APP_ENV === 'production' || APP_ENV === 'staging',
  enableErrorReporting: APP_ENV === 'production' || APP_ENV === 'staging',
  enableDebugLogging: APP_ENV === 'development',
  enableServiceWorker: APP_ENV === 'production',
} as const;
