'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { api, getErrorMessage, redirectToLogin } from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditProfile() {
  const { user, isLoading, setUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [meetAddress, setMeetAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) redirectToLogin();
  }, [isLoading, user]);

  // Pre-fill the form
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setMeetAddress(user.meetAddress || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (phone.trim() && !/^[6-9]\d{9}$/.test(digits)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setIsSaving(true);

    try {
      const { data } = await api.put('/users/me', {
        name: name.trim(),
        phone: phone.trim() ? digits : '',
        meetAddress: meetAddress.trim(),
      });

      if (data.success && data.data && user) {
        setUser({ ...user, ...data.data });
        toast.success('Profile updated');
        router.push('/profile');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update profile. Please try again.'));
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-base">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-border-subtle border-t-brand-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      <Navbar />

      <main className="flex-1 flex flex-col p-4 sm:p-8 max-w-2xl mx-auto w-full">
        <div className="panel-card space-y-6">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-sm text-text-muted">
            Update your contact details so buyers can reach you easily.
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium">Display Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">WhatsApp Phone Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border-b border-border-subtle bg-transparent text-text-secondary text-sm border-r-0">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full flex-1 border-l-0 pl-2"
                  placeholder="98XXXXXXXX"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={14}
                />
              </div>
              <p className="text-xs text-text-muted">
                Providing a WhatsApp number enables the "Chat on WhatsApp" feature on your listings.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Default Meet Address</label>
              <input
                type="text"
                value={meetAddress}
                onChange={(e) => setMeetAddress(e.target.value)}
                className="w-full"
                placeholder="e.g. Main Library, North Gate"
              />
              <p className="text-xs text-text-muted">
                This will be used as the default meeting spot for your new listings.
              </p>
            </div>

            <div className="pt-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
