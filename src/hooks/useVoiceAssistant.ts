'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

type VoiceAction = {
  type: 'NAVIGATE' | 'NONE';
  href?: string;
};

type VoiceApiResponse = {
  ok: boolean;
  text: string;
  action?: VoiceAction;
  error?: string;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
};

type SpeechRecognitionEventLike = Event & {
  results: {
    0: SpeechRecognitionResultLike;
    length: number;
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

function mapRecognitionError(errorCode: string): string {
  if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
    return 'Microphone permission denied. Please allow microphone access and try again.';
  }
  if (errorCode === 'no-speech') {
    return 'No speech detected. Please try speaking clearly.';
  }
  if (errorCode === 'audio-capture') {
    return 'No microphone detected. Please check your microphone settings.';
  }
  if (errorCode === 'network') {
    return 'Speech service network issue. Please retry.';
  }
  return 'Voice recognition failed. Please try again.';
}

export function useVoiceAssistant() {
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [action, setAction] = useState<VoiceAction | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const statusRef = useRef<AssistantStatus>('idle');
  const networkRetryDoneRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const w = window as WindowWithSpeech;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition) && 'speechSynthesis' in window;
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    speechUtteranceRef.current = null;
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setStatus('speaking');
    };

    utterance.onerror = () => {
      setStatus('error');
      setError('Could not play voice response.');
    };

    utterance.onend = () => {
      setStatus('idle');
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [stopSpeaking]);

  const requestAssistant = useCallback(async (spokenText: string) => {
    setStatus('processing');
    setError(null);

    try {
      const res = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: spokenText }),
      });

      const json = (await res.json()) as VoiceApiResponse;
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Assistant failed');
      }

      setResponseText(json.text);
      setAction(json.action ?? null);
      speak(json.text);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Assistant unavailable';
      setStatus('error');
      setError(message);
    }
  }, [speak]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (statusRef.current === 'listening') {
      setStatus('idle');
      statusRef.current = 'idle';
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || typeof window === 'undefined') {
      setStatus('error');
      setError('Voice assistant is not supported in this browser.');
      return;
    }

    stopSpeaking();
    setError(null);
    setAction(null);
    networkRetryDoneRef.current = false;

    const w = window as WindowWithSpeech;
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus('error');
      setError('Speech recognition is not available.');
      return;
    }

    const attemptRecognition = (lang: string) => {
      const recognition = new Recognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setStatus('listening');
        statusRef.current = 'listening';
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const text = event.results?.[0]?.[0]?.transcript?.trim() || '';
        if (!text) {
          setStatus('error');
          statusRef.current = 'error';
          setError('No speech detected. Please try again.');
          return;
        }
        setTranscript(text);
        void requestAssistant(text);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'abort' || event.error === 'aborted') {
          return;
        }

        if (event.error === 'network' && !networkRetryDoneRef.current) {
          networkRetryDoneRef.current = true;
          attemptRecognition('en-US');
          return;
        }

        setStatus('error');
        statusRef.current = 'error';
        setError(mapRecognitionError(event.error));
      };

      recognition.onend = () => {
        if (statusRef.current === 'listening') {
          setStatus('idle');
          statusRef.current = 'idle';
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch {
        setStatus('error');
        statusRef.current = 'error';
        setError('Could not start microphone. Please retry.');
      }
    };

    attemptRecognition('en-IN');
  }, [isSupported, requestAssistant, stopSpeaking]);

  const replayResponse = useCallback(() => {
    if (!responseText) return;
    speak(responseText);
  }, [responseText, speak]);

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    stopSpeaking();
    setStatus('idle');
    statusRef.current = 'idle';
    setError(null);
    setTranscript('');
    setResponseText('');
    setAction(null);
    networkRetryDoneRef.current = false;
  }, [stopSpeaking]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    status,
    error,
    transcript,
    responseText,
    action,
    isSupported,
    isListening: status === 'listening',
    isProcessing: status === 'processing',
    isSpeaking: status === 'speaking',
    startListening,
    stopListening,
    replayResponse,
    reset,
  };
}
