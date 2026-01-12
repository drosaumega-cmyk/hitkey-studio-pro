/**
 * Admin Dashboard API handlers
 */

import { Context } from 'hono';
import { DatabaseService } from '../lib/database';
import { AuthService } from '../lib/auth';
import { nanoid } from 'nanoid';

export class AdminHandler {
  private db: DatabaseService;
  private authService: AuthService;

  constructor(db: DatabaseService) {
    this.db = db;
    this.authService = new AuthService(
      process.env.JWT_SECRET || 'your-secret-key',
      process.env.JWT_EXPIRATION || '7d'
    );
  }

  /**
   * Middleware to check admin access
   */
  private async requireAdmin(c: Context, requiredRole?: string) {
    const authUser = c.get('authUser');
    if (!authUser) {
      return { error: 'Authentication required', status: 401 };
    }
    
    // Check if user is admin
    const adminCheck = await this.db.executeOne(
      'SELECT role, permissions FROM admin_accounts WHERE user_id = ?',
      [authUser.id]
    );
    
    if (!adminCheck) {
      return { error: 'Admin access required', status: 403 };
    }
    
    // Check role hierarchy if required
    if (requiredRole) {
      const roleHierarchy = {
        'super_admin': 3,
        'admin': 2,
        'moderator': 1
      };
      
      if (roleHierarchy[adminCheck.role] < roleHierarchy[requiredRole]) {
        return { error: 'Insufficient privileges', status: 403 };
      }
    }
    
    return { admin: adminCheck, userId: authUser.id };
  }

  /**
   * Get admin dashboard overview
   */
  async getDashboard(c: Context) {
    try {
      const auth = await this.requireAdmin(c);
      if (auth.error) {
        return c.json({ error: auth.error }, auth.status);
      }
      
      // Get overview statistics
      const [
        userStats,
        subscriptionStats,
        tokenStats,
        revenueStats,
        referralStats
      ] = await Promise.all([
        this.db.executeOne('SELECT COUNT(*) as totalUsers, COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verifiedUsers FROM users'),
        this.db.executeOne('SELECT COUNT(*) as totalSubscriptions, COUNT(CASE WHEN status = "active" THEN 1 END) as activeSubscriptions FROM subscriptions'),
        this.db.executeOne('SELECT SUM(tokens) as totalTokens FROM user_tokens'),
        this.db.executeOne('SELECT SUM(amount) as totalRevenue FROM payments WHERE status = "completed"'),
        this.db.executeOne('SELECT COUNT(*) as totalReferrals, COUNT(CASE WHEN status = "completed" THEN 1 END) as completedReferrals FROM referrals')
      ]);
      
      // Get recent activity
      const recentActivity = await this.db.execute(`
        SELECT 
          'user' as type,
          u.email,
          u.created_at as timestamp,
          'New user registered' as action
        FROM users u
        WHERE u.created_at > datetime('now', '-7 days')
        
        UNION ALL
        
        SELECT 
          'subscription' as type,
          u.email,
          s.created_at as timestamp,
          'New subscription' || ' (' || sp.name || ')' as action
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.created_at > datetime('now', '-7 days')
        
        ORDER BY timestamp DESC
        LIMIT 10
      `);
      
      // Get top performing plans
      const topPlans = await this.db.execute(`
        SELECT 
          sp.name,
          sp.tier,
          COUNT(s.id) as subscriptions,
          SUM(sp.price) as revenue
        FROM subscription_plans sp
        LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
        GROUP BY sp.id
        ORDER BY subscriptions DESC
        LIMIT 5
      `);
      
      return c.json({
        success: true,
        overview: {
          users: userStats,
          subscriptions: subscriptionStats,
          tokens: tokenStats,
          revenue: revenueStats,
          referrals: referralStats
        },
        recentActivity,
        topPlans
      });
      
    } catch (error) {
      console.error('Admin dashboard error:', error);
      return c.json({ error: 'Failed to get dashboard data' }, 500);
    }
  }

  /**
   * Get all users (admin)
   */
  async getUsers(c: Context) {
    try {
      const auth = await this.requireAdmin(c);
      if (auth.error) {
        return c.json({ error: auth.error }, auth.status);
      }
      
      // Pagination
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '50');
      const offset = (page - 1) * limit;
      
      // Search filter
      const search = c.req.query('search') || '';
      
      let whereClause = '';
      let searchParams: any[] = [];
      
      if (search) {
        whereClause = 'WHERE u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?';
        searchParams = [`%${search}%`, `%${search}%`, `%${search}%`];
      }
      
      const users = await this.db.execute(`
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.email_verified,
          u.created_at,
          u.updated_at,
          ut.tokens,
          s.plan_id,
          s.status as subscription_status,
          sp.name as plan_name,
          sp.tier,
          aa.role as admin_role
        FROM users u
        LEFT JOIN user_tokens ut ON u.id = ut.user_id
        LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
        LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
        LEFT JOIN admin_accounts aa ON u.id = aa.user_id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `, [...searchParams, limit, offset]);
      
      const totalCount = await this.db.executeOne(`
        SELECT COUNT(*) as count FROM users u ${whereClause}
      `, searchParams);
      
      return c.json({
        success: true,
        users,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          totalPages: Math.ceil(totalCount.count / limit)
        }
      });
      
    } catch (error) {
      console.error('Get users error:', error);
      return c.json({ error: 'Failed to get users' }, 500);
    }
  }

  /**
   * Create admin account (super_admin only)
   */
  async createAdmin(c: Context) {
    try {
      const auth = await this.requireAdmin(c, 'super_admin');
      if (auth.error) {
        return c.json({ error: auth.error }, auth.status);
      }
      
      const { email, role, permissions } = await c.req.json();
      
      // Check if user exists
      const userCheck = await this.db.executeOne('SELECT id FROM users WHERE email = ?', [email]);
      if (!userCheck) {
        return c.json({ error: 'User not found' }, 404);
      }
      
      // Check if user is already admin
      const adminCheck = await this.db.executeOne('SELECT id FROM admin_accounts WHERE user_id = ?', [userCheck.id]);
      if (adminCheck) {
        return c.json({ error: 'User is already an admin' }, 400);
      }
      
      // Create admin account
      const adminId = nanoid();
      await this.db.execute(`
        INSERT INTO admin_accounts (
          id, user_id, role, permissions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        adminId,
        userCheck.id,
        role,
        JSON.stringify(permissions || [])
      ]);
      
      return c.json({
        success: true,
        message: 'Admin account created successfully',
        admin: {
          id: adminId,
          email,
          role,
          permissions: permissions || []
        }
      });
      
    } catch (error) {
      console.error('Create admin error:', error);
      return c.json({ error: 'Failed to create admin account' }, 500);
    }
  }

  /**
   * Get all admin accounts
   */
  async getAdmins(c: Context) {
    try {
      const auth = await this.requireAdmin(c, 'admin');
      if (auth.error) {
        return c.json({ error: auth.error }, auth.status);
      }
      
      const admins = await this.db.execute(`
        SELECT 
          aa.id,
          aa.role,
          aa.permissions,
          aa.created_at,
          u.email,
          u.first_name,
          u.last_name
        FROM admin_accounts aa
        JOIN users u ON aa.user_id = u.id
        ORDER BY aa.created_at DESC
      `);
      
      return c.json({
        success: true,
        admins: admins.map(admin => ({
          ...admin,
          permissions: JSON.parse(admin.permissions || '[]')
        }))
      });
      
    } catch (error) {
      console.error('Get admins error:', error);
      return c.json({ error: 'Failed to get admin accounts' }, 500);
    }
  }

  /**
   * Create site
   */
  async createSite(c: Context) {
    try {
      const auth = await this.requireAdmin(c, 'admin');
      if (auth.error) {
        return c.json({ error: auth.error }, auth.status);
      }
      
      const { domain, name, description, logoUrl, themeConfig, customDomain } = await c.req.json();
      
      // Check if domain already exists
      const domainCheck = await this.db.executeOne(
        'SELECT id FROM sites WHERE domain = ? OR custom_domain = ?',
        [domain, customDomain]
      );
      
      if (domainCheck) {
        return c.json({ error: 'Domain already exists' }, 400);
      }
      
      // Create site
      const siteId = nanoid();
      await this.db.execute(`
        INSERT INTO sites (
          id, owner_id, domain, name, description, logo_url, theme_config, custom_domain, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        siteId,
        auth.userId,
        domain,
        name,
        description || null,
        logoUrl || null,
        JSON.stringify(themeConfig || {}),
        customDomain || null
      ]);
      
      // Add owner as site user
      await this.db.execute(`
        INSERT INTO site_users (id, site_id, user_id, role, created_at)
        VALUES (?, ?, ?, 'owner', CURRENT_TIMESTAMP)
      `, [nanoid(), siteId, auth.userId]);
      
      return c.json({
        success: true,
        message: 'Site created successfully',
        site: {
          id: siteId,
          domain,
          name,
          description,
          logoUrl,
          themeConfig,
          customDomain
        }
      });
      
    } catch (error) {
      console.error('Create site error:', error);
      return c.json({ error: 'Failed to create site' }, 500);
    }
  }

  /**
   * Get all sites
   */
  async getSites(c: Context) {
    try {
      const auth = await this.requireAdmin(c, 'admin');
      if (auth.error) {
        return c.json({ error: auth.error }, auth.status);
      }
      
      // Pagination
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const offset = (page - 1) * limit;
      
      const sites = await this.db.execute(`
        SELECT 
          s.*,
          o.email as owner_email,
          o.first_name as owner_first_name,
          COUNT(su.id) as user_count
        FROM sites s
        JOIN users o ON s.owner_id = o.id
        LEFT JOIN site_users su ON s.id = su.site_id
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      
      const totalCount = await this.db.executeOne('SELECT COUNT(*) as count FROM sites');
      
      return c.json({
        success: true,
        sites: sites.map(site => ({
          ...site,
          theme_config: JSON.parse(site.theme_config || '{}')
        })),
        pagination: {
          page,
          limit,
          total: totalCount.count,
          totalPages: Math.ceil(totalCount.count / limit)
        }
      });
      
    } catch (error) {
      console.error('Get sites error:', error);
      return c.json({ error: 'Failed to get sites' }, 500);
    }
  }

  /**
   * Get system health
   */
  async getHealth(c: Context) {
    try {
      const auth = await this.requireAdmin(c);
      if (auth.error) {
        return c.json({ error: auth.error }, auth.status);
      }
      
      // Check database connectivity
      const dbCheck = await this.db.executeOne('SELECT 1 as test');
      const dbHealthy = !!dbCheck;
      
      // Get system metrics
      const metrics = await this.db.executeOne(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
          (SELECT COUNT(*) FROM payments WHERE status = 'completed') as completed_payments,
          (SELECT SUM(amount) FROM payments WHERE status = 'completed') as total_revenue,
          (SELECT COUNT(*) FROM referral_codes WHERE status = 'active') as active_referral_codes
      `);
      
      return c.json({
        success: true,
        health: {
          database: dbHealthy,
          overall: dbHealthy
        },
        metrics,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Health check error:', error);
      return c.json({ 
        success: false, 
        error: 'Health check failed',
        health: {
          database: false,
          overall: false
        }
      }, 500);
    }
  }
}