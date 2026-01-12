import React, { useState } from 'react';
import { Gift, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ReferralInfo {
  referrerName: string;
  referrerEmail: string;
  rewardTokens: number;
  referrerRewardTokens: number;
  maxUses: number;
  currentUses: number;
}

export const ReferralApplication: React.FC<{ onApplied?: () => void }> = ({ onApplied }) => {
  const [referralCode, setReferralCode] = useState('');
  const [referralPin, setReferralPin] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    referralInfo?: ReferralInfo;
    error?: string;
  } | null>(null);
  const [applied, setApplied] = useState(false);

  const validateReferralCode = async () => {
    if (!referralCode || !referralPin) {
      setValidationResult({
        valid: false,
        error: 'Both referral code and pin are required'
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode, referralPin })
      });

      const data = await response.json();
      setValidationResult(data);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        valid: false,
        error: 'Failed to validate referral code'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const applyReferralCode = async () => {
    if (!validationResult?.valid) return;

    setApplying(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/referrals/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ referralCode, referralPin })
      });

      const data = await response.json();
      if (data.success) {
        setApplied(true);
        onApplied?.();
      } else {
        setValidationResult({
          valid: false,
          error: data.error || 'Failed to apply referral code'
        });
      }
    } catch (error) {
      console.error('Application error:', error);
      setValidationResult({
        valid: false,
        error: 'Failed to apply referral code'
      });
    } finally {
      setApplying(false);
    }
  };

  const reset = () => {
    setReferralCode('');
    setReferralPin('');
    setValidationResult(null);
    setApplied(false);
  };

  if (applied) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Referral Applied Successfully!</h3>
          <p className="text-sm text-gray-600 mb-4">
            You've earned {validationResult?.referralInfo?.rewardTokens} tokens from this referral!
          </p>
          <button
            onClick={reset}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Another Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
          <Gift className="h-6 w-6 text-purple-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Have a Referral Code?</h3>
        <p className="text-sm text-gray-600">
          Enter your referral code and PIN to earn bonus tokens
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
            Referral Code
          </label>
          <input
            type="text"
            id="referralCode"
            value={referralCode}
            onChange={(e) => {
              setReferralCode(e.target.value.toUpperCase());
              setValidationResult(null);
            }}
            placeholder="e.g., AUDIO123ABC"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isValidating || applying}
          />
        </div>

        <div>
          <label htmlFor="referralPin" className="block text-sm font-medium text-gray-700 mb-2">
            Referral PIN
          </label>
          <input
            type="text"
            id="referralPin"
            value={referralPin}
            onChange={(e) => {
              setReferralPin(e.target.value.toUpperCase());
              setValidationResult(null);
            }}
            placeholder="e.g., ABCD1234"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isValidating || applying}
          />
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`p-4 rounded-lg ${
            validationResult.valid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              {validationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              )}
              <div className="flex-1">
                {validationResult.valid && validationResult.referralInfo ? (
                  <div>
                    <p className="text-sm font-medium text-green-800 mb-2">
                      Valid referral code from {validationResult.referralInfo.referrerName}
                    </p>
                    <div className="text-xs text-green-700 space-y-1">
                      <p>• You'll receive <strong>{validationResult.referralInfo.rewardTokens} tokens</strong></p>
                      <p>• Referrer will receive <strong>{validationResult.referralInfo.referrerRewardTokens} tokens</strong></p>
                      <p>• Code uses: {validationResult.referralInfo.currentUses}/{validationResult.referralInfo.maxUses}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-800">
                    {validationResult.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!validationResult?.valid ? (
            <>
              <button
                onClick={validateReferralCode}
                disabled={isValidating || !referralCode || !referralPin}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Code'
                )}
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </>
          ) : (
            <>
              <button
                onClick={applyReferralCode}
                disabled={applying}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply Referral'
                )}
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">How referral codes work:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Enter both the referral code and PIN exactly as provided</li>
          <li>• Valid codes will award you bonus tokens immediately</li>
          <li>• The person who referred you will also receive tokens</li>
          <li>• Each code has a limited number of uses</li>
          <li>• Codes may expire after a certain date</li>
        </ul>
      </div>
    </div>
  );
};