import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
import { env, config } from '../env';

// Performance metrics interface
interface PerformanceMetrics {
  cls?: number;
  inp?: number;
  fcp?: number;
  lcp?: number;
  ttfb?: number;
}

// Analytics service interface
interface AnalyticsService {
  trackEvent: (eventName: string, data?: Record<string, any>) => void;
  trackPerformance: (metrics: PerformanceMetrics) => void;
}

// Google Analytics implementation
class GoogleAnalytics implements AnalyticsService {
  private initialized = false;

  constructor() {
    if (config.enableAnalytics && env.GA_TRACKING_ID) {
      this.initialize();
    }
  }

  private initialize() {
    if (this.initialized) return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${env.GA_TRACKING_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', env.GA_TRACKING_ID);

    this.initialized = true;
  }

  trackEvent(eventName: string, data?: Record<string, any>) {
    if (!this.initialized) return;

    (window as any).gtag('event', eventName, data);
  }

  trackPerformance(metrics: PerformanceMetrics) {
    if (!this.initialized) return;

    // Send performance metrics to GA
    Object.entries(metrics).forEach(([metric, value]) => {
      if (value !== undefined) {
        this.trackEvent('web_vitals', {
          event_category: 'Web Vitals',
          event_label: metric.toUpperCase(),
          value: Math.round(value),
          custom_map: { metric_value: value }
        });
      }
    });
  }
}

// Mixpanel implementation (optional)
class MixpanelAnalytics implements AnalyticsService {
  private initialized = false;

  constructor() {
    if (config.enableAnalytics && env.MIXPANEL_TOKEN) {
      this.initialize();
    }
  }

  private initialize() {
    if (this.initialized) return;

    // Load Mixpanel script
    const script = document.createElement('script');
    script.innerHTML = `
      (function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){function g(a,d){var b=d.split(".");2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<i.length;h++)g(a,i[h]);var j="set set_once union unset remove delete".split(" ");a.get_group=function(){function b(c){d[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));a.push([e,call2])}}for(var d={},e=0;e<j.length;e++)b(j[e]);return d};b._i.push([e,f,c])};b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";e.async=!0;e.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===f.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";f.getElementsByTagName("head")[0].appendChild(e)}})(document,window.mixpanel||[]);
      mixpanel.init('${env.MIXPANEL_TOKEN}');
    `;
    document.head.appendChild(script);

    this.initialized = true;
  }

  trackEvent(eventName: string, data?: Record<string, any>) {
    if (!this.initialized || !(window as any).mixpanel) return;

    (window as any).mixpanel.track(eventName, data);
  }

  trackPerformance(metrics: PerformanceMetrics) {
    if (!this.initialized) return;

    this.trackEvent('Web Vitals', metrics);
  }
}

// Main analytics service
class Analytics {
  private services: AnalyticsService[] = [];

  constructor() {
    if (config.enableAnalytics) {
      this.services.push(new GoogleAnalytics());
      if (env.MIXPANEL_TOKEN) {
        this.services.push(new MixpanelAnalytics());
      }
    }
  }

  trackEvent(eventName: string, data?: Record<string, any>) {
    this.services.forEach(service => service.trackEvent(eventName, data));
  }

  trackPerformance(metrics: PerformanceMetrics) {
    this.services.forEach(service => service.trackPerformance(metrics));
  }

  trackPageView(page: string) {
    this.trackEvent('page_view', { page_path: page });
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });
  }
}

// Initialize analytics
export const analytics = new Analytics();

// Performance monitoring
export const initPerformanceMonitoring = () => {
  if (!config.enableAnalytics) return;

  // Track Web Vitals
  onCLS((metric: Metric) => {
    analytics.trackPerformance({ cls: metric.value });
    if (config.enableDebugLogging) {
      
    }
  });

  onINP((metric: Metric) => {
    analytics.trackPerformance({ inp: metric.value });
    if (config.enableDebugLogging) {
      
    }
  });

  onFCP((metric: Metric) => {
    analytics.trackPerformance({ fcp: metric.value });
    if (config.enableDebugLogging) {
      
    }
  });

  onLCP((metric: Metric) => {
    analytics.trackPerformance({ lcp: metric.value });
    if (config.enableDebugLogging) {
      
    }
  });

  onTTFB((metric: Metric) => {
    analytics.trackPerformance({ ttfb: metric.value });
    if (config.enableDebugLogging) {
      
    }
  });
};

// Global type declarations
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}