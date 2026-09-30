'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError('');
    
    if (credentialResponse.credential) {
      const success = await login(credentialResponse.credential);
      if (success) {
        router.push('/');
      } else {
        setError('Failed to authenticate. Please try again.');
        setIsLoading(false);
      }
    } else {
      setError('Google authentication failed. No credential received.');
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setError('Google authentication failed. Please try again.');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-bg-base p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity">
        <div className="h-6 w-6 rounded bg-brand-primary flex items-center justify-center text-white text-xs font-bold">
          CM
        </div>
        CampusMart
      </Link>

      <div className="w-full max-w-md panel-card flex flex-col items-center text-center space-y-6 py-12">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back</h1>
          <p className="text-text-secondary text-sm">Sign in with your Google account to continue</p>
        </div>

        {error && (
          <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div className="w-full flex justify-center py-4">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2 text-text-muted">
              <div className="w-4 h-4 rounded-full border-2 border-brand-primary border-t-transparent animate-spin"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap
              theme="outline"
              shape="rectangular"
              size="large"
              text="continue_with"
              width="300"
            />
          )}
        </div>

        <p className="text-xs text-text-muted max-w-sm mt-4">
          By signing in, you agree to CampusMart's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
