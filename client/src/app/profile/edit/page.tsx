'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Navbar, Avatar } from '@/components/Navbar';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { api, getErrorMessage } from '@/lib/api';
import { safeRedirectPath } from '@/lib/auth-tokens';
import { CAMPUS_SPOTS } from '@/lib/constants';

const toDateInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

function EditProfileForm() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  // Read once on mount: are we in the first-login welcome flow?
  const [{ isWelcome, redirectTo }] = useState(() => {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    return {
      isWelcome: params.get('welcome') === '1',
      redirectTo: safeRedirectPath(params.get('redirect'), '/profile'),
    };
  });

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [meetAddress, setMeetAddress] = useState(user?.meetAddress || '');
  const [leavingDate, setLeavingDate] = useState(toDateInput(user?.leavingDate));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (phone.trim() && !/^[6-9]\d{9}$/.test(digits)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (isWelcome && !digits) {
      setError('Add your WhatsApp number so buyers and sellers can reach you.');
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await api.put('/users/me', {
        name: name.trim(),
        phone: phone.trim() ? digits : '',
        meetAddress: meetAddress.trim(),
        leavingDate: leavingDate || null,
      });
      setUser({ ...user, ...data.data });
      toast.success(isWelcome ? "You're all set! 🎉" : 'Profile updated');
      router.replace(isWelcome ? redirectTo : '/profile');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update profile. Please try again.'));
      setIsSaving(false);
    }
  };

  return (
    <div className="panel-card space-y-6 animate-fade-up">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} src={user.profileImage} size={56} />
        <div>
          <h1 className="text-2xl font-extrabold">{isWelcome ? `Welcome, ${user.name.split(' ')[0]}! 👋` : 'Profile settings'}</h1>
          <p className="text-sm text-text-muted">
            {isWelcome ? 'One quick step so people can reach you.' : 'These details appear on your listings.'}
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-danger-soft border border-danger/20 text-danger rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-semibold">
            WhatsApp number {isWelcome && <span className="text-danger">*</span>}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm">+91</span>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s+]/g, ''))}
              className="w-full flex-1"
              placeholder="98XXXXXXXX"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={14}
              autoFocus={isWelcome}
            />
          </div>
          <p className="text-xs text-text-muted">Shown only on your listings, so buyers can tap “Chat on WhatsApp”.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="meet" className="text-sm font-semibold">Usual meet-up spot</label>
          <input
            id="meet"
            type="text"
            value={meetAddress}
            onChange={(e) => setMeetAddress(e.target.value)}
            className="w-full"
            placeholder="e.g. Library entrance"
            list="campus-spots"
            maxLength={200}
          />
          <datalist id="campus-spots">
            {CAMPUS_SPOTS.map((spot) => (
              <option key={spot} value={spot} />
            ))}
          </datalist>
          <p className="text-xs text-text-muted">Used as the default for new listings.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="leaving" className="text-sm font-semibold">
            Leaving campus on <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="leaving"
              type="date"
              value={leavingDate}
              min={today}
              onChange={(e) => setLeavingDate(e.target.value)}
              className="w-full flex-1"
            />
            {leavingDate && (
              <button type="button" onClick={() => setLeavingDate('')} className="btn-secondary text-sm px-4">
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-text-muted">
            Graduating or moving out? Your listings get a “⏳ Leaving in X days” badge so buyers act fast.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-semibold">Display name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full" maxLength={100} required />
        </div>

        <div className="pt-2 flex gap-3 justify-end">
          {isWelcome ? (
            <button type="button" onClick={() => router.replace(redirectTo)} className="btn-secondary" disabled={isSaving}>
              Skip for now
            </button>
          ) : (
            <button type="button" onClick={() => router.back()} className="btn-secondary" disabled={isSaving}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary px-8" disabled={isSaving}>
            {isSaving ? 'Saving...' : isWelcome ? 'Continue' : 'Save changes'}
          </button>
        </div>
      </form>

      {!isWelcome && <DeleteAccount />}
    </div>
  );
}

/** Self-serve account deletion. Typing DELETE is required to enable the button. */
function DeleteAccount() {
  const { logout } = useAuth();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete your account forever?',
      message: 'Your listings, photos, questions, Wanted requests and ratings will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete everything',
      danger: true,
    });
    if (!ok) return;

    setIsDeleting(true);
    try {
      await api.delete('/users/me', { data: { confirm: 'DELETE' } });
      toast.success('Your account has been deleted. Goodbye! 👋');
      logout(); // clears tokens and returns to the homepage
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete account.'));
      setIsDeleting(false);
    }
  };

  return (
    <div className="pt-6 border-t border-border-subtle space-y-3">
      <h2 className="text-sm font-semibold text-danger">Danger zone</h2>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-sm text-text-muted hover:text-danger underline">
          Delete my account
        </button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-danger/30 bg-danger-soft p-4">
          <p className="text-sm text-text-secondary">
            This permanently deletes your account and <strong>everything</strong> you&apos;ve posted. Type{' '}
            <strong className="text-danger">DELETE</strong> to confirm.
          </p>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full"
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            autoComplete="off"
          />
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setOpen(false); setTyped(''); }} className="btn-secondary text-sm px-4 py-2">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={typed !== 'DELETE' || isDeleting}
              className="inline-flex items-center justify-center rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete my account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditProfile() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col p-4 sm:p-8 max-w-xl mx-auto w-full">
        <RequireAuth>
          <EditProfileForm />
        </RequireAuth>
      </main>
    </div>
  );
}
