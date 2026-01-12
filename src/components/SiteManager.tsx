import React, { useState, useEffect } from 'react';
import { Globe, Plus, Settings, Users, BarChart, Eye, Edit, Trash2, ExternalLink } from 'lucide-react';

interface Site {
  id: string;
  domain: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  custom_domain: string | null;
  status: 'active' | 'inactive' | 'suspended';
  theme_config: any;
  created_at: string;
  updated_at: string;
  user_count: number;
  owner_email: string;
  owner_first_name: string;
}

interface SiteConfig {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
  branding: {
    logo: string;
    favicon: string;
    siteName: string;
    tagline: string;
  };
  features: {
    voiceCloning: boolean;
    stemSeparation: boolean;
    voiceCleaning: boolean;
    voiceChanging: boolean;
    videoGeneration: boolean;
  };
  limits: {
    maxFileSize: number;
    maxConcurrentJobs: number;
    dailyTokenLimit: number;
  };
}

export const SiteManager: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#8B5CF6',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937'
    },
    branding: {
      logo: '',
      favicon: '',
      siteName: 'AI Audio Studio Pro',
      tagline: 'Professional Audio Processing'
    },
    features: {
      voiceCloning: true,
      stemSeparation: true,
      voiceCleaning: true,
      voiceChanging: true,
      videoGeneration: true
    },
    limits: {
      maxFileSize: 100,
      maxConcurrentJobs: 3,
      dailyTokenLimit: 1000
    }
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/sites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSites(data.sites);
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSite = async (siteData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...siteData,
          themeConfig: siteConfig
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSites([data.site, ...sites]);
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create site');
      }
    } catch (error) {
      console.error('Failed to create site:', error);
      alert('Failed to create site');
    }
  };

  const updateSite = async (siteId: string, updates: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/sites/${siteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setSites(sites.map(site => 
          site.id === siteId ? { ...site, ...data.site } : site
        ));
        setEditingSite(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update site');
      }
    } catch (error) {
      console.error('Failed to update site:', error);
      alert('Failed to update site');
    }
  };

  const deleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/sites/${siteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSites(sites.filter(site => site.id !== siteId));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete site');
      }
    } catch (error) {
      console.error('Failed to delete site:', error);
      alert('Failed to delete site');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Multi-Site Management</h1>
          <p className="text-gray-600 mt-1">Manage multiple AI Audio Studio Pro instances</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Site
        </button>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => (
          <div key={site.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {site.logo_url ? (
                    <img src={site.logo_url} alt={site.name} className="h-10 w-10 rounded-lg mr-3" />
                  ) : (
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                    <p className="text-sm text-gray-500">{site.domain}</p>
                    {site.custom_domain && (
                      <p className="text-xs text-blue-600">{site.custom_domain}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(site.status)}`}>
                  {site.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Users</span>
                  <span className="font-medium">{site.user_count}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Owner</span>
                  <span className="font-medium">{site.owner_first_name}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">{formatDate(site.created_at)}</span>
                </div>

                {site.description && (
                  <p className="text-sm text-gray-600 mt-3">{site.description}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <button
                  onClick={() => window.open(`https://${site.domain}`, '_blank')}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Visit
                </button>
                
                <button
                  onClick={() => setEditingSite(site)}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configure
                </button>
                
                <button
                  onClick={() => deleteSite(site.id)}
                  className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Site Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Site</h2>
            </div>
            
            <SiteForm
              siteConfig={siteConfig}
              setSiteConfig={setSiteConfig}
              onSubmit={createSite}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {editingSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Configure Site: {editingSite.name}</h2>
            </div>
            
            <SiteForm
              site={editingSite}
              siteConfig={editingSite.theme_config}
              setSiteConfig={setSiteConfig}
              onSubmit={(updates) => updateSite(editingSite.id, updates)}
              onCancel={() => setEditingSite(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface SiteFormProps {
  site?: Site;
  siteConfig: SiteConfig;
  setSiteConfig: (config: SiteConfig) => void;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const SiteForm: React.FC<SiteFormProps> = ({ site, siteConfig, setSiteConfig, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    domain: site?.domain || '',
    name: site?.name || '',
    description: site?.description || '',
    customDomain: site?.custom_domain || '',
    logoUrl: site?.logo_url || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      themeConfig: siteConfig
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain *
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({...formData, domain: e.target.value})}
              placeholder="subdomain.yourdomain.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Domain
            </label>
            <input
              type="text"
              value={formData.customDomain}
              onChange={(e) => setFormData({...formData, customDomain: e.target.value})}
              placeholder="www.yourdomain.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
              placeholder="https://example.com/logo.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Theme Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <input
              type="color"
              value={siteConfig.theme.primaryColor}
              onChange={(e) => setSiteConfig({
                ...siteConfig,
                theme: {...siteConfig.theme, primaryColor: e.target.value}
              })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <input
              type="color"
              value={siteConfig.theme.secondaryColor}
              onChange={(e) => setSiteConfig({
                ...siteConfig,
                theme: {...siteConfig.theme, secondaryColor: e.target.value}
              })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <input
              type="color"
              value={siteConfig.theme.accentColor}
              onChange={(e) => setSiteConfig({
                ...siteConfig,
                theme: {...siteConfig.theme, accentColor: e.target.value}
              })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Feature Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Configuration</h3>
        <div className="space-y-3">
          {Object.entries(siteConfig.features).map(([feature, enabled]) => (
            <label key={feature} className="flex items-center">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setSiteConfig({
                  ...siteConfig,
                  features: {...siteConfig.features, [feature]: e.target.checked}
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {site ? 'Update Site' : 'Create Site'}
        </button>
      </div>
    </form>
  );
};