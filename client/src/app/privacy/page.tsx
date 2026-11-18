import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { APP_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What data we collect and how it is used.',
};

const SECTIONS = [
  {
    title: 'What we collect',
    body: [
      'From Google sign-in: your name, email address and profile photo.',
      'What you add: your WhatsApp number, usual meet-up spot, leaving date, listings, photos, questions, ratings and reports.',
    ],
  },
  {
    title: 'Who can see what',
    body: [
      'Anyone can see your listings, your name, photo, rating and meet-up spot.',
      'Your WhatsApp number appears on your listings so buyers can contact you. On the Wanted board, it is shown only to logged-in users.',
      'Your email address is never shown to other users. Moderators can see it when you report a listing.',
    ],
  },
  {
    title: 'What we don’t do',
    body: [
      'We don’t sell your data, show ads, or handle payments. Deals happen directly between students.',
    ],
  },
  {
    title: 'Deleting your data',
    body: [
      'You can delete your listings, questions and requests at any time.',
      'To delete your whole account, go to Profile → Edit profile details → Delete my account. Your listings, photos, questions, Wanted requests and ratings are permanently removed straight away.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Privacy, in plain words</h1>
        <p className="text-text-secondary mb-10">{APP_NAME} is a student project. Here’s exactly what happens with your information.</p>
        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-lg font-bold">{section.title}</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
                {section.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
