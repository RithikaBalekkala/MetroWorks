'use client';

import { useMemo, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';

interface ChatAnswer {
  answerType: 'ROUTE' | 'TRAIN_INFO' | 'GENERAL';
  title: string;
  summary: string;
  details: Array<{ label: string; value: string }>;
  quickFollowUps: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  answer?: ChatAnswer;
}

const starterQuestions = [
  'Fare from Whitefield to Majestic',
  'Route from Indiranagar to Jayanagar',
  'What are train timings and frequency?',
];

export default function HomeAIChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Ask your metro question. I will return exact structured fare, route, and train details.',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q) return;

    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/home-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      const json = await res.json();
      const data: ChatAnswer | undefined = json?.data;

      if (!data) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: 'I could not read that response. Please try again with source and destination station names.',
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: data.summary,
            answer: data,
          },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Assistant is temporarily unavailable. Please retry your metro question in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSend = () => {
    if (!canSend) return;
    ask(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-[360px] max-w-[92vw] rounded-2xl border border-[#d7e4d8] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-[#efe2f4] p-2 text-[#7B2D8B]">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-black">Namma Metro AI Assistant</p>
                <p className="text-[11px] text-gray-600">Fare, route, train details</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user' ? 'bg-[#7B2D8B] text-white' : 'bg-[#f6faf7] text-black border border-gray-100'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {msg.answer && (
                  <div className="mt-2 rounded-xl border border-gray-100 bg-white p-3 text-left">
                    <p className="text-sm font-semibold text-black">{msg.answer.title}</p>
                    <div className="mt-2 space-y-1">
                      {msg.answer.details.map(item => (
                        <div key={`${item.label}-${item.value}`} className="text-xs text-gray-700">
                          <span className="font-semibold text-black">{item.label}:</span> {item.value}
                        </div>
                      ))}
                    </div>
                    {msg.answer.quickFollowUps.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.answer.quickFollowUps.slice(0, 2).map(q => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => ask(q)}
                            className="rounded-full border border-[#d7e4d8] bg-[#f8fbf9] px-2.5 py-1 text-[11px] text-gray-700 hover:bg-[#edf5ef]"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-500">Thinking...</div>
            )}
          </div>

          <div className="border-t border-gray-100 p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {starterQuestions.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="rounded-full border border-[#d7e4d8] bg-[#f8fbf9] px-2.5 py-1 text-[11px] text-gray-700 hover:bg-[#edf5ef]"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') onSend();
                }}
                placeholder="Ask fare, route, train details..."
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#7B2D8B]"
              />
              <button
                type="button"
                disabled={!canSend}
                onClick={onSend}
                className="rounded-xl bg-[#00A550] px-3 py-2 text-white disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#7B2D8B] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#6a2679]"
        >
          <MessageCircle className="h-4 w-4" />
          Metro Q&A
        </button>
      )}
    </div>
  );
}
