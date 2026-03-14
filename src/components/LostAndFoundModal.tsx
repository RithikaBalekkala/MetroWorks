'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  ALL_STATIONS,
  type Station,
} from '@/lib/metro-network';
import {
  inferLostItemCategory,
  type LostItemCategory,
} from '@/lib/lost-and-found';
import type { LostFoundAgentResponse } from '@/agents/lostAndFoundAgent';

interface LostAndFoundModalProps {
  isOpen: boolean;
  defaultStationName?: string;
  onClose: () => void;
}

const categories: LostItemCategory[] = ['BAG', 'MOBILE', 'WALLET', 'LAPTOP', 'DOCUMENTS', 'JEWELLERY', 'OTHER'];

function defaultQuery(category: LostItemCategory): string {
  switch (category) {
    case 'BAG':
      return 'I lost my bag in the metro coach. Please help.';
    case 'MOBILE':
      return 'I lost my mobile phone in a metro train.';
    case 'WALLET':
      return 'I lost my wallet while travelling in metro.';
    case 'LAPTOP':
      return 'I left my laptop bag near platform area.';
    case 'DOCUMENTS':
      return 'I misplaced my documents in station premises.';
    case 'JEWELLERY':
      return 'I may have dropped jewellery while boarding.';
    default:
      return 'I lost an item while using metro service.';
  }
}

export default function LostAndFoundModal({ isOpen, defaultStationName, onClose }: LostAndFoundModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const stationOptions = useMemo(() => [...ALL_STATIONS].sort((a: Station, b: Station) => a.name.localeCompare(b.name)), []);

  const [stationName, setStationName] = useState(defaultStationName ?? '');
  const [category, setCategory] = useState<LostItemCategory>('OTHER');
  const [description, setDescription] = useState('');
  const [assistance, setAssistance] = useState<LostFoundAgentResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStationName(defaultStationName ?? '');
  }, [defaultStationName]);

  useEffect(() => {
    if (!isOpen) return;

    const container = modalRef.current;
    if (!container) return;

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    );
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!description.trim()) return;
    setCategory(inferLostItemCategory(description));
  }, [description]);

  const requestAssistance = async () => {
    const userQuery = description.trim() || defaultQuery(category);
    setLoading(true);
    setAssistance(null);

    try {
      const response = await fetch('/api/home-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `lost and found help at ${stationName || 'Majestic'}: ${userQuery}`,
        }),
      });

      const json = await response.json();
      const result = json?.data;

      if (result?.answerType === 'LOST_FOUND') {
        setAssistance(result as LostFoundAgentResponse);
      } else {
        const fallback = await fetch('/api/orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent: 'lost-and-found',
            message: userQuery,
            station: stationName,
          }),
        });

        const fallbackJson = await fallback.json();
        const fallbackResult = fallbackJson?.data?.result;
        if (fallbackResult?.answerType === 'LOST_FOUND') {
          setAssistance(fallbackResult as LostFoundAgentResponse);
        }
      }
    } catch {
      setAssistance(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Lost and Found"
        className="w-full h-full sm:h-auto sm:max-w-2xl bg-white sm:rounded-2xl shadow-2xl p-5 sm:p-6 overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Lost and Found Support</h3>
            <p className="text-sm text-gray-500">File a quick report and get desk guidance</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close lost and found modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
            <select
              value={stationName}
              onChange={e => setStationName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2D8B]"
            >
              <option value="">Select station</option>
              {stationOptions.map(station => (
                <option key={station.id} value={station.name}>{station.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as LostItemCategory)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2D8B]"
            >
              {categories.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Details</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe item, travel direction, platform or coach details..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2D8B]"
          />
        </div>

        <button
          type="button"
          onClick={requestAssistance}
          disabled={loading}
          className="mt-4 w-full py-3 bg-[#7B2D8B] text-white font-semibold rounded-xl hover:bg-[#6a2679] transition disabled:opacity-60"
        >
          {loading ? 'Generating Assistance...' : 'Get AI Lost and Found Guidance'}
        </button>

        {assistance && (
          <div className="mt-4 rounded-xl border border-[#d7e4d8] bg-[#f7fbf8] p-4">
            <p className="text-sm font-semibold text-gray-900">Suggested Desk: {assistance.stationName}</p>
            <p className="text-sm text-gray-700 mt-1">Case Template: {assistance.caseIdTemplate}</p>
            <p className="text-sm text-gray-700">Location: {assistance.deskLocation}</p>
            <p className="text-sm text-gray-700">Contact: {assistance.contactNumber}</p>
            <p className="text-sm text-gray-700">Hours: {assistance.operatingHours}</p>
            <p className="text-sm text-gray-700">Escalation: {assistance.escalationOffice}</p>
            <p className="text-sm text-gray-700">Callback ETA: {assistance.etaForCallbackHours} hours</p>

            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-900">Next Steps</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 space-y-1">
                {assistance.nextSteps.map(step => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
