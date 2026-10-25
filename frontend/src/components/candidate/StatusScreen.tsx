'use client';

import { AlertCircle, CheckCircle2, Clock, LinkIcon } from 'lucide-react';

type Tone = 'success' | 'warning' | 'error' | 'info';

interface StatusScreenProps {
  tone: Tone;
  title: string;
  message: React.ReactNode;
  children?: React.ReactNode;
}

const TONES: Record<Tone, { icon: typeof AlertCircle; ring: string; color: string }> = {
  success: { icon: CheckCircle2, ring: 'bg-green-50', color: 'text-green-500' },
  warning: { icon: Clock, ring: 'bg-amber-50', color: 'text-amber-500' },
  error: { icon: AlertCircle, ring: 'bg-red-50', color: 'text-red-500' },
  info: { icon: LinkIcon, ring: 'bg-blue-50', color: 'text-blue-500' },
};

// Full-page message for the candidate: invalid link, expired link, already attempted, finished
export function StatusScreen({ tone, title, message, children }: StatusScreenProps) {
  const { icon: Icon, ring, color } = TONES[tone];
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border max-w-lg w-full text-center space-y-5">
        <div className={`w-20 h-20 ${ring} rounded-full flex items-center justify-center mx-auto`}>
          <Icon className={`w-10 h-10 ${color}`} />
        </div>
        <h1 className="text-2xl font-black text-gray-900">{title}</h1>
        <div className="text-gray-600 leading-relaxed">{message}</div>
        {children}
      </div>
    </div>
  );
}
