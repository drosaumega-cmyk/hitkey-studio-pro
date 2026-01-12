import React, { useState, useEffect } from 'react';
import { Copy, Check, Gift, Users, TrendingUp, Calendar } from 'lucide-react';

interface ReferralCode {
  id: string;
  referral_code: string;
  referral_pin: string;
  status: string;
  max_uses: number;
  current_uses: number;
  reward_tokens: number;
  referrer_reward_tokens: number;
  expires_at: string | null;
  created_at: string;
  total_referrals: number;
}

interface ReferralStats {
  completed_referrals: number;
  pending_referrals: number;
  tokens_earned: number;
  active_codes: number;
}

interface RecentReferral {
  id: string;
  status: string;
  tokens_awarded: boolean;
  referrer_tokens_awarded: boolean;
  created_at: string;
  completed_at: string | null;
  referred_email: string;
  referred_first_name: string;
}

export const ReferralSystem: React.FC = () => {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingCode, setCreatingCode] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCodeSettings, setNewCodeSettings] = useState({
    maxUses: 100,
    rewardTokens: 50,
    referrerRewardTokens: 100,
    expiresAt: ''
  });

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const [codesRes, statsRes, referralsRes] = await Promise.all([
        fetch('/api/referrals/codes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/referrals/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (codesRes.ok) {
        const codesData = await codesRes.json();
        setReferralCodes(codesData.referralCodes || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setRecentReferrals(statsData.recentReferrals || []);
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReferralCode = async () => {
    setCreatingCode(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/referrals/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCodeSettings)
      });

      if (response.ok) {
        const data = await response.json();
        setReferralCodes([data.referralCode, ...referralCodes]);
        setShowCreateForm(false);
        setNewCodeSettings({
          maxUses: 100,
          rewardTokens: 50,
          referrerRewardTokens: 100,
          expiresAt: ''
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create referral code');
      }
    } catch (error) {
      console.error('Failed to create referral code:', error);
      alert('Failed to create referral code');
    } finally {
      setCreatingCode(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral System</h1>
        <p className="text-gray-600">Share referral codes and earn tokens when friends join</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed_referrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tokens Earned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tokens_earned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Codes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_codes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_referrals}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Referral Code */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Referral Codes</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Code
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Uses
                </label>
                <input
                  type="number"
                  value={newCodeSettings.maxUses}
                  onChange={(e) => setNewCodeSettings({...newCodeSettings, maxUses: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reward Tokens (for referred user)
                </label>
                <input
                  type="number"
                  value={newCodeSettings.rewardTokens}
                  onChange={(e) => setNewCodeSettings({...newCodeSettings, rewardTokens: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referrer Reward Tokens
                </label>
                <input
                  type="number"
                  value={newCodeSettings.referrerRewardTokens}
                  onChange={(e) => setNewCodeSettings({...newCodeSettings, referrerRewardTokens: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newCodeSettings.expiresAt}
                  onChange={(e) => setNewCodeSettings({...newCodeSettings, expiresAt: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createReferralCode}
                disabled={creatingCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {creatingCode ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </div>
        )}

        {/* Referral Codes List */}
        <div className="divide-y divide-gray-200">
          {referralCodes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No referral codes yet. Create your first code to start earning!</p>
            </div>
          ) : (
            referralCodes.map((code) => (
              <div key={code.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900">Code: {code.referral_code}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(code.status)}`}>
                        {code.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Pin: {code.referral_pin}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(code.referral_code, 'code')}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="ml-1">Copy Code</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(code.referral_pin, 'pin')}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {copied === 'pin' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="ml-1">Copy Pin</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Uses:</span>
                    <span className="ml-2 font-medium">{code.current_uses}/{code.max_uses}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Reward:</span>
                    <span className="ml-2 font-medium">{code.reward_tokens} tokens</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Referrer Reward:</span>
                    <span className="ml-2 font-medium">{code.referrer_reward_tokens} tokens</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">{formatDate(code.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Referrals */}
      {recentReferrals.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Referrals</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens Awarded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReferrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {referral.referred_first_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {referral.referred_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(referral.status)}`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {referral.tokens_awarded ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(referral.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};