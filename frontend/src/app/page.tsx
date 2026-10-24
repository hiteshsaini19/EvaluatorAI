'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import TopNav from '@/components/TopNav';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);
    
    if (!loggedIn) {
      router.push('/login');
    }
  }, [router]);

  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <>
      <TopNav 
        title="Dashboard" 
        subtitle="Manage your interview platform" 
      />
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, Super Admin!
          </h2>
          <p className="text-gray-600">
            Here's an overview of your interview platform
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link 
            href="/categories"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border"
          >
            <h3 className="text-xl font-bold mb-2 text-blue-600">Categories</h3>
            <p className="text-sm text-gray-600">View all question categories</p>
          </Link>
          
          <Link 
            href="/questions"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border"
          >
            <h3 className="text-xl font-bold mb-2 text-green-600">Questions</h3>
            <p className="text-sm text-gray-600">View all questions</p>
          </Link>
          
          <Link 
            href="/tests"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border"
          >
            <h3 className="text-xl font-bold mb-2 text-purple-600">Tests</h3>
            <p className="text-sm text-gray-600">View all created tests</p>
          </Link>
          
          <Link 
            href="/results"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border"
          >
            <h3 className="text-xl font-bold mb-2 text-orange-600">Results</h3>
            <p className="text-sm text-gray-600">View candidate results</p>
          </Link>
        </div>
      </div>
    </>
  );
}