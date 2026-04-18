// Environment utilities for type-safe access to environment variables

export const env = {
  // App
  APP_NAME: import.meta.env.VITE_APP_NAME || 'CMS Admin',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',

  // API
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1',
  ADONIS_API_URL: import.meta.env.VITE_ADONIS_API_URL || 'http://localhost:3333',

  // Analytics
  GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID,
  MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN,

  // Monitoring
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,

  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,

  // Node env
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
} as const;

// Type-safe environment checker
export const isProduction = () => env.APP_ENV === 'production';
export const isStaging = () => env.APP_ENV === 'staging';
export const isDevelopment = () => env.APP_ENV === 'development';

// Environment-specific configurations
export const config = {
  enableAnalytics: isProduction() || isStaging(),
  enableErrorReporting: isProduction() || isStaging(),
  enableDebugLogging: isDevelopment(),
  enableServiceWorker: isProduction(), // Only enable SW in production
  apiTimeout: isProduction() ? 10000 : 30000, // Shorter timeout in prod
} as const;