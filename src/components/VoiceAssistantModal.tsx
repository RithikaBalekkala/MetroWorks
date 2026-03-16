'use client';

import { useEffect, useRef } from 'react';
import { Mic, Volume2, Loader2, X, AlertCircle, Play } from 'lucide-react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

interface VoiceAssistantModalProps {
  open: boolean;
  onClose: () => void;
  assistant: ReturnType<typeof useVoiceAssistant>;
}

export default function VoiceAssistantModal({ open, onClose, assistant }: VoiceAssistantModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        assistant.reset();
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [assistant, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-3" onMouseDown={(e) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        assistant.reset();
        onClose();
      }
    }}>
      <div ref={panelRef} className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <p className="text-sm font-bold text-black">AI Voice Assistant</p>
            <p className="text-xs text-gray-600">Namma Metro route, booking, and travel help</p>
          </div>
          <button
            type="button"
            onClick={() => {
              assistant.reset();
              onClose();
            }}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close voice assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!assistant.isSupported && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>Your browser does not support voice recognition.</span>
            </div>
          )}

          {assistant.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{assistant.error}</span>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className={`relative h-10 w-10 rounded-full flex items-center justify-center ${assistant.isListening ? 'bg-purple-100 text-purple-700' : assistant.isSpeaking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {assistant.isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : assistant.isSpeaking ? <Volume2 className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                {assistant.isListening && <span className="absolute inset-0 rounded-full border-2 border-purple-300 animate-ping" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-black">
                  {assistant.isListening ? 'Listening...' : assistant.isProcessing ? 'Processing...' : assistant.isSpeaking ? 'Speaking...' : 'Ready'}
                </p>
                <p className="text-xs text-gray-600">
                  {assistant.isListening ? 'Please ask your metro question now.' : 'Tap start and speak naturally.'}
                </p>
              </div>
            </div>

            {assistant.transcript && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-white p-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">You said</p>
                <p className="text-sm text-gray-900">{assistant.transcript}</p>
              </div>
            )}

            {assistant.responseText && (
              <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-2">
                <p className="text-[11px] uppercase tracking-wide text-green-700">Assistant response</p>
                <p className="text-sm text-green-900">{assistant.responseText}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={assistant.startListening}
              disabled={!assistant.isSupported || assistant.isListening || assistant.isProcessing}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7B2D8B] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Mic className="h-4 w-4" />
              Start
            </button>
            <button
              type="button"
              onClick={assistant.stopListening}
              disabled={!assistant.isListening}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Stop
            </button>
            <button
              type="button"
              onClick={assistant.replayResponse}
              disabled={!assistant.responseText || assistant.isSpeaking}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Replay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
