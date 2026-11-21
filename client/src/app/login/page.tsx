'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { safeRedirectPath } from '@/lib/auth-tokens';
import { Logo } from '@/components/Logo';

const PERKS = [
  { icon: '🎓', title: 'Seniors sell, juniors save', text: 'Grab textbooks, cycles and hostel gear at a fraction of the price.' },
  { icon: '🤝', title: 'Meet on campus', text: 'No shipping, no scams. Check the item, then pay in cash or UPI.' },
  { icon: '💬', title: 'One tap to WhatsApp', text: 'Chat with the seller directly, no in-app messaging needed.' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    if (!credentialResponse.credential) {
      setError('Google sign-in failed. Please try again.');
      return;
    }

    setIsLoading(true);
    const result = await login(credentialResponse.credential);

    if (!result.success) {
      setError(result.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
      return;
    }

    const redirect = safeRedirectPath(new URLSearchParams(window.location.search).get('redirect'));
    // First-time users add their WhatsApp number before anything else
    if (result.needsPhone) {
      router.replace(`/profile/edit?welcome=1&redirect=${encodeURIComponent(redirect)}`);
    } else {
      router.replace(redirect);
    }
  };

  return (
    <div className="flex-1 grid lg:grid-cols-2 min-h-screen">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-brand-primary relative overflow-hidden" style={{ color: 'var(--text-on-brand)' }}>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-black/10 blur-2xl" aria-hidden="true" />
        <div className="relative">
          <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold">CampusMart</span>
        </div>
        <div className="relative space-y-8 max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight text-balance">
            Your seniors&apos; stuff, at your price.
          </h1>
          <ul className="space-y-5">
            {PERKS.map((perk) => (
              <li key={perk.title} className="flex gap-4">
                <span className="text-2xl" aria-hidden="true">{perk.icon}</span>
                <div>
                  <p className="font-semibold">{perk.title}</p>
                  <p className="text-sm opacity-80">{perk.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm opacity-70">Made by students, for students.</p>
      </div>

      {/* Sign-in panel */}
      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Logo />
        </div>

        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-sm text-center space-y-8 animate-fade-up">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold">Welcome 👋</h2>
              <p className="text-text-secondary">Sign in with Google to buy, sell and save items.</p>
            </div>

            {error && (
              <div role="alert" className="p-3 bg-danger-soft text-danger text-sm rounded-xl border border-danger/20">
                {error}
              </div>
            )}

            <div className="flex justify-center min-h-[44px]">
              {isLoading ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <div className="w-4 h-4 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => setError('Google sign-in failed. Please try again.')}
                  useOneTap
                  theme="outline"
                  shape="pill"
                  size="large"
                  text="continue_with"
                  width="300"
                />
              )}
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              We only use your Google name, email and photo. Your WhatsApp number is shown only on your
              own listings so buyers can reach you. See our{' '}
              <a href="/privacy" className="underline hover:text-text-primary">privacy note</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
