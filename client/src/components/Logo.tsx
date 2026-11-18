import Link from 'next/link';
import { APP_NAME } from '@/lib/brand';

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span
      className={`${className} rounded-xl bg-brand-primary flex items-center justify-center shadow-sm`}
      style={{ color: 'var(--text-on-brand)' }}
      aria-hidden="true"
    >
      {/* Shopping bag with a graduation-cap fold */}
      <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      </svg>
    </span>
  );
}

export function Logo({ hideTextOnMobile = false }: { hideTextOnMobile?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label={`${APP_NAME} home`}>
      <LogoMark />
      <span
        className={`font-[family-name:var(--font-display)] font-extrabold text-lg tracking-tight ${
          hideTextOnMobile ? 'hidden min-[380px]:inline' : ''
        }`}
      >
        {APP_NAME}
      </span>
    </Link>
  );
}
