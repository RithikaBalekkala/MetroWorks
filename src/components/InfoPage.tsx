import React from 'react';
import AppShell from '@/components/AppShell';

interface InfoPageProps {
  title: string;
  description: string;
  points: string[];
}

export default function InfoPage({ title, description, points }: InfoPageProps) {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#d7e4d8] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-black">{title}</h1>
          <p className="mt-3 text-base text-gray-700">{description}</p>
          <ul className="mt-6 space-y-3 text-gray-800">
            {points.map(point => (
              <li key={point} className="rounded-lg bg-[#f4f8f5] p-3">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
