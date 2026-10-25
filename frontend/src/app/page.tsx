'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { getCurrentUser, isAdminUser, SessionUser } from '@/lib/session';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { ListChecks, Sparkles, Share2, Timer } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setMounted(true);
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);
    if (loggedIn) getCurrentUser().then(setUser);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) return <Landing />;

  return <Dashboard user={user} />;
}

function Landing() {
  const steps = [
    {
      icon: ListChecks,
      title: 'Pick subjects and difficulty',
      text: 'Choose from 24 subjects, from Logical Reasoning to SQL, React Hooks and Deep Learning.',
    },
    {
      icon: Sparkles,
      title: 'Get a ready-made test',
      text: 'Questions are generated for you. Review them and remove any you don\'t want.',
    },
    {
      icon: Share2,
      title: 'Share one link',
      text: 'Candidates open the link, take a timed test, and you see scored results instantly.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">EA</span>
          </div>
          <span className="font-bold text-gray-900">EvaluatorAI</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Sign up free</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="py-16 md:py-24 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Create a candidate test in minutes
          </h1>
          <p className="mt-5 text-lg text-gray-600">
            Choose the subjects, difficulty and time limit. Get a ready-to-share test link,
            and see each candidate&apos;s score as soon as they finish.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
                Create your free account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                I already have an account
              </Button>
            </Link>
          </div>
        </section>

        <section className="pb-20">
          <h2 className="text-center text-sm font-bold uppercase tracking-widest text-indigo-600 mb-8">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="bg-white rounded-xl border p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-400">STEP {idx + 1}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.text}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Timer className="w-4 h-4" />
            Timed tests submit automatically, and links expire when you choose.
          </p>
        </section>
      </main>
    </div>
  );
}

function Dashboard({ user }: { user: SessionUser | null }) {
  const isAdmin = isAdminUser(user);

  const cards = [
    ...(isAdmin ? [
      { href: '/subjects', title: 'Subjects', text: 'Browse the subject catalogue and difficulty rubrics', color: 'text-blue-600' },
      { href: '/questions', title: 'Questions', text: 'Manage the example question bank', color: 'text-green-600' },
    ] : []),
    { href: '/tests', title: 'Tests', text: 'Create tests and share links with candidates', color: 'text-purple-600' },
    { href: '/results', title: 'Results', text: 'See how candidates scored', color: 'text-orange-600' },
  ];

  return (
    <>
      <TopNav
        title="Dashboard"
        subtitle="Create tests and track candidate results"
      />
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h2>
          <p className="text-gray-600">
            Here&apos;s where you manage your tests and results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(card => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border"
            >
              <h3 className={`text-xl font-bold mb-2 ${card.color}`}>{card.title}</h3>
              <p className="text-sm text-gray-600">{card.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
