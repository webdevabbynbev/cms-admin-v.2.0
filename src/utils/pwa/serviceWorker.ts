import { config } from '../env';

// Service Worker registration and management
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private updateCallbacks: (() => void)[] = [];

  async register() {
    if (!('serviceWorker' in navigator)) {
      
      return;
    }

    if (!config.enableServiceWorker) {
      
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (this.updateAvailable) {
          window.location.reload();
        }
      });

    } catch (error) {
      
    }
  }

  onUpdateAvailable(callback: () => void) {
    this.updateCallbacks.push(callback);
  }

  private notifyUpdateAvailable() {
    this.updateCallbacks.forEach(callback => callback());
  }

  async update() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  async unregister() {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
      
    }
  }
}

// API Cache Manager for client-side caching
export class ApiCacheManager {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor() {
    // Load from localStorage on initialization
    this.loadFromStorage();
  }

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, cacheEntry);
    this.saveToStorage();
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
    localStorage.removeItem('api-cache');
  }

  private saveToStorage() {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      localStorage.setItem('api-cache', JSON.stringify(cacheObject));
    } catch (error) {
      
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('api-cache');
      if (stored) {
        const cacheObject = JSON.parse(stored);
        this.cache = new Map(Object.entries(cacheObject));
      }
    } catch (error) {
      
    }
  }
}

// Initialize service worker and cache manager
export const swManager = new ServiceWorkerManager();
export const apiCache = new ApiCacheManager();

// Auto-register service worker on app start
export const initServiceWorker = () => {
  if (typeof window !== 'undefined') {
    swManager.register();
  }
};