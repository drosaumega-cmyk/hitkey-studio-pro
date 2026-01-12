/**
 * Database utilities and connection management
 */

export interface Database {
  prepare: (query: string) => any;
  batch: (statements: any[]) => Promise<any>;
  exec: (query: string) => Promise<any>;
}

export interface Env {
  DB: Database;
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  FRONTEND_URL: string;
  API_URL: string;
}

export class DatabaseService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Execute a prepared statement with parameters
   */
  async execute(query: string, params: any[] = []): Promise<any> {
    try {
      const stmt = this.db.prepare(query);
      if (params.length > 0) {
        return await stmt.bind(...params).all();
      }
      return await stmt.all();
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Execute a query that returns a single result
   */
  async executeOne(query: string, params: any[] = []): Promise<any> {
    try {
      const stmt = this.db.prepare(query);
      if (params.length > 0) {
        return await stmt.bind(...params).first();
      }
      return await stmt.first();
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Execute a query that doesn't return results (INSERT, UPDATE, DELETE)
   */
  async executeRun(query: string, params: any[] = []): Promise<any> {
    try {
      const stmt = this.db.prepare(query);
      if (params.length > 0) {
        return await stmt.bind(...params).run();
      }
      return await stmt.run();
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Execute multiple statements in a batch
   */
  async executeBatch(statements: Array<{ query: string; params?: any[] }>): Promise<any> {
    try {
      const batch = statements.map(stmt => {
        const prepared = this.db.prepare(stmt.query);
        return stmt.params && stmt.params.length > 0 
          ? prepared.bind(...stmt.params) 
          : prepared;
      });
      return await this.db.batch(batch);
    } catch (error) {
      console.error('Database batch error:', error);
      throw error;
    }
  }

  /**
   * Begin a transaction
   */
  async transaction<T>(callback: (db: DatabaseService) => Promise<T>): Promise<T> {
    try {
      // Start transaction
      await this.executeRun('BEGIN TRANSACTION');
      
      // Execute callback
      const result = await callback(this);
      
      // Commit transaction
      await this.executeRun('COMMIT');
      
      return result;
    } catch (error) {
      // Rollback on error
      await this.executeRun('ROLLBACK');
      throw error;
    }
  }

  /**
   * Get table schema information
   */
  async getTableSchema(tableName: string): Promise<any> {
    const query = `PRAGMA table_info(${tableName})`;
    return await this.execute(query);
  }

  /**
   * Check if table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    const query = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `;
    const result = await this.executeOne(query, [tableName]);
    return !!result;
  }

  /**
   * Get row count for a table
   */
  async getRowCount(tableName: string, whereClause: string = '', params: any[] = []): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
    const result = await this.executeOne(query, params);
    return result?.count || 0;
  }

  /**
   * Insert or update record (UPSERT)
   */
  async upsert(tableName: string, data: Record<string, any>, conflictColumns: string[] = ['id']): Promise<any> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');
    
    const conflictTargets = conflictColumns.join(', ');
    const updateSet = columns
      .filter(col => !conflictColumns.includes(col))
      .map(col => `${col} = excluded.${col}`)
      .join(', ');

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT(${conflictTargets}) DO UPDATE SET
      ${updateSet}
    `;

    return await this.executeRun(query, values);
  }

  /**
   * Soft delete a record
   */
  async softDelete(tableName: string, id: string): Promise<any> {
    const query = `
      UPDATE ${tableName} 
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    return await this.executeRun(query, [id]);
  }

  /**
   * Restore a soft deleted record
   */
  async restore(tableName: string, id: string): Promise<any> {
    const query = `
      UPDATE ${tableName} 
      SET status = 'active', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    return await this.executeRun(query, [id]);
  }

  /**
   * Paginated query helper
   */
  async paginate(
    query: string, 
    params: any[] = [], 
    page: number = 1, 
    limit: number = 20
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const countQuery = query.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await this.executeOne(countQuery, params);
    const total = countResult?.total || 0;
    
    // Get paginated data
    const paginatedQuery = `${query} LIMIT ? OFFSET ?`;
    const data = await this.execute(paginatedQuery, [...params, limit, offset]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Search helper with full-text search support
   */
  async search(
    tableName: string,
    searchText: string,
    searchColumns: string[],
    whereClause: string = '',
    params: any[] = [],
    limit: number = 50
  ): Promise<any[]> {
    const searchConditions = searchColumns.map(col => `${col} LIKE ?`).join(' OR ');
    const searchParams = searchColumns.map(() => `%${searchText}%`);
    
    const query = `
      SELECT * FROM ${tableName} 
      WHERE (${searchConditions}) ${whereClause ? `AND ${whereClause}` : ''}
      LIMIT ?
    `;
    
    return await this.execute(query, [...searchParams, ...params, limit]);
  }

  /**
   * Health check for database
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      await this.executeOne('SELECT 1 as test');
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Cache service using KV storage
 */
export class CacheService {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: ttlSeconds,
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      const list = await this.kv.list({ prefix: pattern });
      const deletePromises = list.keys.map(key => this.kv.delete(key.name));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Cache clear pattern error:', error);
    }
  }
}

/**
 * Session service using KV storage
 */
export class SessionService {
  private kv: KVNamespace;
  private defaultTTL: number = 7 * 24 * 60 * 60; // 7 days

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /**
   * Create a new session
   */
  async createSession(sessionId: string, userData: any, ttlSeconds?: number): Promise<void> {
    const sessionData = {
      userData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (ttlSeconds || this.defaultTTL) * 1000).toISOString(),
    };

    await this.kv.put(`session:${sessionId}`, JSON.stringify(sessionData), {
      expirationTtl: ttlSeconds || this.defaultTTL,
    });
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<any | null> {
    try {
      const sessionData = await this.kv.get(`session:${sessionId}`);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      
      // Check if session is expired
      if (new Date() > new Date(parsed.expiresAt)) {
        await this.deleteSession(sessionId);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, userData: any): Promise<void> {
    const existingSession = await this.getSession(sessionId);
    if (!existingSession) return;

    const updatedSession = {
      ...existingSession,
      userData,
      updatedAt: new Date().toISOString(),
    };

    const ttl = Math.floor((new Date(updatedSession.expiresAt).getTime() - Date.now()) / 1000);
    await this.kv.put(`session:${sessionId}`, JSON.stringify(updatedSession), {
      expirationTtl: ttl > 0 ? ttl : 1,
    });
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.kv.delete(`session:${sessionId}`);
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string, ttlSeconds?: number): Promise<void> {
    const existingSession = await this.getSession(sessionId);
    if (!existingSession) return;

    existingSession.expiresAt = new Date(Date.now() + (ttlSeconds || this.defaultTTL) * 1000).toISOString();
    
    await this.kv.put(`session:${sessionId}`, JSON.stringify(existingSession), {
      expirationTtl: ttlSeconds || this.defaultTTL,
    });
  }
}