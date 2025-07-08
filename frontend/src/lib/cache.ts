interface CacheItem<T> {
  data: T;
  timestamp: number;
  key: string;
}

class SecureCache {
  private cache: Map<string, CacheItem<any>>;
  private maxItems: number;
  private defaultTTL: number;

  constructor(maxItems = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxItems = maxItems;
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxItems) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });

    // Set expiry timer
    if (ttl !== 0) { // 0 means no expiry
      const timeout = ttl || this.defaultTTL;
      setTimeout(() => this.delete(key), timeout);
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get all keys that match a pattern
  getKeysByPattern(pattern: RegExp): string[] {
    return Array.from(this.cache.values())
      .filter(item => pattern.test(item.key))
      .map(item => item.key);
  }

  // Delete all keys that match a pattern
  deleteByPattern(pattern: RegExp): void {
    this.getKeysByPattern(pattern).forEach(key => this.delete(key));
  }

  // Check if a key exists and is not expired
  has(key: string): boolean {
    return this.cache.has(key);
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxItems: this.maxItems,
      keys: Array.from(this.cache.keys()),
      oldestItem: Array.from(this.cache.values())
        .sort((a, b) => a.timestamp - b.timestamp)[0]?.timestamp || null,
      newestItem: Array.from(this.cache.values())
        .sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp || null
    };
  }
}

// Create singleton instance
export const cache = new SecureCache();

// Helper functions for common cache operations
export const cacheKey = (prefix: string, ...parts: (string | number)[]) => 
  `${prefix}:${parts.join(':')}`;

export const clearUserCache = (userId: string) => 
  cache.deleteByPattern(new RegExp(`^user:${userId}`));

export const clearLeadCache = (leadId: string) =>
  cache.deleteByPattern(new RegExp(`^lead:${leadId}`));

export const clearAllCache = () => cache.clear();

// Example usage:
// cache.set(cacheKey('user', userId, 'profile'), userProfile);
// const profile = cache.get(cacheKey('user', userId, 'profile'));
