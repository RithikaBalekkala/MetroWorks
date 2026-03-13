'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppProvider } from '@/lib/state-provider';
import CommuterView from '@/components/CommuterView';
import EdgeGateView from '@/components/EdgeGateView';
import OperatorDashboard from '@/components/OperatorDashboard';
import {
  Smartphone,
  Cpu,
  Brain,
  ChevronRight,
  Zap,
  Shield,
  Activity,
} from 'lucide-react';

type ViewType = 'commuter' | 'gate' | 'dashboard';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType | null>(null);

  return (
    <AppProvider>
      {activeView === null ? (
        <LandingSelector onSelect={setActiveView} />
      ) : (
        <div className="min-h-screen bg-[#0a0e1a]">
          {/* Global Nav Bar */}
          <nav className="sticky top-0 z-50 bg-[#0d1220]/90 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 flex items-center h-12">
              <button
                onClick={() => setActiveView(null)}
                className="text-xs font-mono text-white/40 hover:text-white transition mr-4"
              >
                ← BMRCL Platform
              </button>
              <div className="flex gap-1">
                {([
                  { key: 'commuter' as ViewType, icon: Smartphone, label: 'Commuter', color: 'purple' },
                  { key: 'gate' as ViewType, icon: Cpu, label: 'Edge Gate', color: 'cyan' },
                  { key: 'dashboard' as ViewType, icon: Brain, label: 'XAI Dashboard', color: 'green' },
                ]).map(v => (
                  <button
                    key={v.key}
                    onClick={() => setActiveView(v.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeView === v.key
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <v.icon className="w-3 h-3" />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* View Content */}
          <main>
            {activeView === 'commuter' && <CommuterView />}
            {activeView === 'gate' && <EdgeGateView />}
            {activeView === 'dashboard' && <OperatorDashboard />}
          </main>
        </div>
      )}
    </AppProvider>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Landing View Selector — Entry point for judges
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LandingSelector({ onSelect }: { onSelect: (v: ViewType) => void }) {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-cyan-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-cyan-500 to-green-500 flex items-center justify-center shadow-2xl shadow-purple-500/20">
            <Zap className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
          BMRCL <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">Autonomous</span> Platform
        </h1>
        <p className="text-lg text-white/40 max-w-xl mx-auto">
          Edge-Validated Ticketing & Transit Orchestration System for Namma Metro
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-white/30">
            <Shield className="w-3 h-3" /> HMAC-SHA256
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-white/30">
            <Activity className="w-3 h-3" /> Bloom Filter
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-white/30">
            <Brain className="w-3 h-3" /> Event Sourcing
          </span>
        </div>
      </div>

      {/* Three Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <ViewCard
          icon={<Smartphone className="w-8 h-8" />}
          title="Commuter App"
          description="Mobile-first journey planner with route calculator, GTFS live train tracking, and stateful QR ticket that refreshes every 30 seconds."
          gradient="from-purple-600 to-purple-900"
          borderColor="border-purple-500/20 hover:border-purple-500/50"
          tags={['Route Planner', 'QR Ticket', 'GTFS Live']}
          onClick={() => onSelect('commuter')}
        />
        <ViewCard
          icon={<Cpu className="w-8 h-8" />}
          title="Edge Gate Validator"
          description="Offline turnstile simulator with client-side HMAC-SHA256 verification and in-memory Bloom Filter for instant double-tap replay attack detection."
          gradient="from-cyan-600 to-blue-900"
          borderColor="border-cyan-500/20 hover:border-cyan-500/50"
          tags={['Bloom Filter', 'HMAC Verify', 'Offline Mode']}
          onClick={() => onSelect('gate')}
        />
        <ViewCard
          icon={<Brain className="w-8 h-8" />}
          title="XAI Dashboard"
          description="Command center with event sourcing time-travel replay. Drag the slider backward to rewind telemetry, AI alerts, and crowd state to any past moment."
          gradient="from-green-600 to-emerald-900"
          borderColor="border-green-500/20 hover:border-green-500/50"
          tags={['Time-Travel', 'XAI Reasoning', 'Telemetry']}
          onClick={() => onSelect('dashboard')}
        />
      </div>

      <div className="relative z-10 mt-8 flex items-center justify-center gap-4">
        <Link
          href="/trains"
          className="px-6 py-3 bg-[#7B2D8B] text-white font-semibold rounded-xl hover:bg-[#6a2679] transition"
        >
          Check Trains
        </Link>
        <Link
          href="/auth"
          className="px-6 py-3 bg-[#00A550] text-white font-semibold rounded-xl hover:bg-[#008c44] transition"
        >
          Book Tickets
        </Link>
      </div>

      <p className="relative z-10 mt-12 text-[10px] font-mono text-white/20 text-center">
        BMRCL HACKATHON 2026 · BANGALORE METRO RAIL CORPORATION LIMITED · PROTOTYPE DEMONSTRATION
      </p>
    </div>
  );
}

function ViewCard({
  icon,
  title,
  description,
  gradient,
  borderColor,
  tags,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  borderColor: string;
  tags: string[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left bg-[#111827]/80 backdrop-blur border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${borderColor}`}
    >
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/40 mb-4 leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tags.map(tag => (
          <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-white/50 group-hover:text-white transition">
        Launch View <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}
