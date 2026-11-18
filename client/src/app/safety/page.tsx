import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Safety tips',
  description: 'How to buy and sell safely on campus.',
};

const TIPS = [
  { icon: '📍', title: 'Meet in public, on campus', text: 'Library entrance, canteen, main gate: busy places with people around. Avoid meeting alone in hostel rooms, especially with someone you don’t know.' },
  { icon: '🔍', title: 'Inspect before you pay', text: 'Switch on electronics, check chargers, flip through books, test-ride cycles. Once you pay, the deal is done.' },
  { icon: '💸', title: 'Never pay in advance', text: 'Pay only when you have the item in hand. If someone pressures you to “reserve” with a UPI payment, walk away.' },
  { icon: '🧾', title: 'Ask about the bill and warranty', text: 'For phones, laptops and appliances, ask for the original bill. It helps with warranty claims and proves the item isn’t stolen.' },
  { icon: '🚨', title: 'Check Lost & Found', text: 'If an expensive item seems too cheap, search Lost & Found. Report suspicious listings using the “Report listing” link.' },
  { icon: '🤝', title: 'Be a good seller', text: 'Describe flaws honestly, mark items sold quickly, and reply to messages. Good ratings help your other listings sell.' },
];

export default function SafetyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Buy & sell safely</h1>
        <p className="text-text-secondary mb-10">Nearly every deal here is between two students who share a campus. These habits keep it that way.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {TIPS.map((tip) => (
            <div key={tip.title} className="panel-card !p-5 space-y-2">
              <div className="text-2xl" aria-hidden="true">{tip.icon}</div>
              <h2 className="font-bold">{tip.title}</h2>
              <p className="text-sm text-text-secondary">{tip.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary">Start browsing</Link>
          <Link href="/lost-and-found" className="btn-secondary">Check Lost & Found</Link>
        </div>
      </main>
    </div>
  );
}
