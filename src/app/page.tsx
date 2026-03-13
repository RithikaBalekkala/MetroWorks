'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import HomeAIChatbot from '@/components/HomeAIChatbot';
import { useTranslation } from '@/lib/i18n-context';
import {
  ArrowRight,
  Train,
  Ticket,
  Wallet,
  LayoutDashboard,
  Map,
  ShieldCheck,
  Brain,
  Bell,
  Sparkles,
} from 'lucide-react';

interface HubCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'purple' | 'green';
}

const mainCards: HubCard[] = [
  {
    title: 'Check Trains',
    description: 'View all metro lines, stations, timings, fare slabs, and route info.',
    href: '/trains',
    icon: Train,
    tone: 'purple',
  },
  {
    title: 'Book Tickets',
    description: 'Start booking flow with smart route calculation and wallet payment.',
    href: '/auth?redirect=/booking',
    icon: Ticket,
    tone: 'green',
  },
  {
    title: 'Login / Sign Up',
    description: 'Access account authentication to continue with protected commuter workflows.',
    href: '/auth',
    icon: LayoutDashboard,
    tone: 'purple',
  },
  {
    title: 'Commuter Live Map',
    description: 'Use route planner, live train simulation, and dynamic QR ticket view.',
    href: '/commuter',
    icon: Map,
    tone: 'purple',
  },
  {
    title: 'My Dashboard',
    description: 'Access profile, quick actions, tickets, notifications, and wallet.',
    href: '/dashboard',
    icon: LayoutDashboard,
    tone: 'green',
  },
  {
    title: 'E-Wallet',
    description: 'Check balance, top up, and track full transaction history.',
    href: '/wallet',
    icon: Wallet,
    tone: 'purple',
  },
  {
    title: 'My Tickets',
    description: 'View active tickets, QR validity countdown, modify or cancel tickets.',
    href: '/tickets',
    icon: Ticket,
    tone: 'green',
  },
];

const advancedCards: HubCard[] = [
  {
    title: 'Edge Gate Validator',
    description: 'Simulate offline turnstile scanning with HMAC and Bloom Filter checks.',
    href: '/edge-gate',
    icon: ShieldCheck,
    tone: 'green',
  },
  {
    title: 'XAI Dashboard',
    description: 'Explore event-sourcing replay, crowd intelligence, and AI reasoning.',
    href: '/xai-dashboard',
    icon: Brain,
    tone: 'purple',
  },
  {
    title: 'Notifications Center',
    description: 'Review live transit alerts and platform updates via dashboard bell.',
    href: '/dashboard',
    icon: Bell,
    tone: 'green',
  },
];

function Card({ title, description, href, icon: Icon, tone }: HubCard) {
  const accentClass =
    tone === 'purple'
      ? 'border-[#e6d6ec] hover:border-[#7B2D8B] hover:shadow-[#7B2D8B]/15'
      : 'border-[#d6ebde] hover:border-[#00A550] hover:shadow-[#00A550]/15';
  const badgeClass =
    tone === 'purple'
      ? 'bg-[#f1e8f4] text-[#7B2D8B]'
      : 'bg-[#e8f8ef] text-[#008c44]';

  return (
    <Link
      href={href}
      className={`group block rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${accentClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex rounded-xl p-2.5 ${badgeClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xs font-semibold text-gray-600">Open</span>
      </div>
      <h3 className="mt-4 text-lg font-bold text-black">{title}</h3>
      <p className="mt-2 text-sm text-gray-700 leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center text-sm font-semibold text-black">
        Go to module
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY || 0);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroRotateY = Math.max(-10, Math.min(10, -6 + scrollY * 0.015));
  const heroRotateX = Math.max(-2, Math.min(8, 6 - scrollY * 0.01));
  const heroLift = Math.min(scrollY * 0.06, 18);
  const primaryRise = Math.max(0, 26 - scrollY * 0.04);
  const advancedRise = Math.max(0, 36 - scrollY * 0.04);

  return (
    <AppShell>
      <div className="relative overflow-hidden bg-[var(--background)]">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#efe2f4] blur-3xl" />
          <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-[#dcf7e8] blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[#efe2f4] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-[#d7e4d8] bg-white/80 p-7 shadow-lg backdrop-blur-xl sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7e4d8] bg-white/60 px-3 py-1.5 text-xs font-semibold text-black backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-[#7B2D8B]" />
                  Smart Metro Platform
                </div>
                <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl lg:text-5xl">
                  ನಮ್ಮ ಮೆಟ್ರೋ
                </h1>
                <p className="mt-4 text-base leading-relaxed text-gray-700 sm:text-lg">
                  One platform for commuters and operators: live route planning, secure ticketing,
                  wallet payments, edge validation, and explainable AI monitoring.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/trains"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7B2D8B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6a2679]"
                  >
                    {t('landing.checkTrains')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/auth?redirect=/booking"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#00A550] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#008c44]"
                  >
                    {t('landing.bookTickets')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#d7e4d8] bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#f3f8f4]"
                  >
                    Open Dashboard
                  </Link>
                </div>
              </div>

              <div className="relative w-full max-w-xl [perspective:1600px]">
                <div
                  className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/30 p-2 shadow-[0_30px_80px_-35px_rgba(17,17,17,0.45)] backdrop-blur-xl"
                  style={{
                    transform: `translateY(${heroLift}px) rotateY(${heroRotateY}deg) rotateX(${heroRotateX}deg)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="relative h-72 w-full overflow-hidden rounded-2xl sm:h-80">
                    <Image
                      src="/image2.png"
                      alt="Bengaluru Namma Metro train"
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="mt-10"
            style={{
              transform: `translateY(${primaryRise}px)`,
              opacity: Math.max(0.75, Math.min(1, 0.78 + scrollY * 0.0016)),
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black">Primary Modules</h2>
              <span className="text-sm text-gray-600">Commuter-first workflow</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mainCards.map(card => (
                <Card key={card.title} {...card} />
              ))}
            </div>
          </section>

          <section
            className="mt-10 pb-2"
            style={{
              transform: `translateY(${advancedRise}px)`,
              opacity: Math.max(0.75, Math.min(1, 0.72 + scrollY * 0.0015)),
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black">Advanced Operations</h2>
              <span className="text-sm text-gray-600">Preserved with direct access</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {advancedCards.map(card => (
                <Card key={card.title} {...card} />
              ))}
            </div>
          </section>
        </div>
      </div>
      <HomeAIChatbot />
    </AppShell>
  );
}
