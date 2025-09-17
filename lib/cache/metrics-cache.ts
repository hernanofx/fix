// Sistema de cache simple para métricas del sistema
class MetricsCache {
    private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
    private static instance: MetricsCache

    private constructor() { }

    static getInstance(): MetricsCache {
        if (!MetricsCache.instance) {
            MetricsCache.instance = new MetricsCache()
        }
        return MetricsCache.instance
    }

    set(key: string, data: any, ttlSeconds: number = 300): void { // Default 5 minutes TTL
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlSeconds * 1000
        })
    }

    get(key: string): any | null {
        const cached = this.cache.get(key)
        if (!cached) return null

        // Check if cache is expired
        if (Date.now() - cached.timestamp > cached.ttl) {
            this.cache.delete(key)
            return null
        }

        return cached.data
    }

    invalidate(key: string): void {
        this.cache.delete(key)
    }

    invalidatePattern(pattern: string): void {
        for (const key of Array.from(this.cache.keys())) {
            if (key.includes(pattern)) {
                this.cache.delete(key)
            }
        }
    }

    clear(): void {
        this.cache.clear()
    }

    // Get cache stats
    getStats() {
        const now = Date.now()
        let validEntries = 0
        let expiredEntries = 0
        let totalSize = 0

        for (const [key, value] of Array.from(this.cache.entries())) {
            if (now - value.timestamp > value.ttl) {
                expiredEntries++
            } else {
                validEntries++
                totalSize += JSON.stringify(value.data).length
            }
        }

        return {
            totalEntries: this.cache.size,
            validEntries,
            expiredEntries,
            totalSizeBytes: totalSize,
            hitRate: 0 // Would need to track hits/misses for this
        }
    }

    // Clean expired entries
    cleanup(): void {
        const now = Date.now()
        for (const [key, value] of Array.from(this.cache.entries())) {
            if (now - value.timestamp > value.ttl) {
                this.cache.delete(key)
            }
        }
    }
}

export const metricsCache = MetricsCache.getInstance()

// Cache keys constants
export const CACHE_KEYS = {
    SYSTEM_METRICS: 'system_metrics',
    SYSTEM_REPORTS: 'system_reports',
    DATABASE_HEALTH: 'database_health',
    SERVER_METRICS: 'server_metrics',
    USER_ACTIVITY: 'user_activity',
    ORGANIZATION_STATS: 'organization_stats'
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
    SYSTEM_METRICS: 60,      // 1 minute - fast changing
    SYSTEM_REPORTS: 300,     // 5 minutes - moderate changing
    DATABASE_HEALTH: 30,     // 30 seconds - critical
    SERVER_METRICS: 120,     // 2 minutes - system resources
    USER_ACTIVITY: 180,      // 3 minutes - user data
    ORGANIZATION_STATS: 600  // 10 minutes - stable data
}