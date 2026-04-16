'use client';

import { useState } from 'react';

type AccordionItem = {
  question: string;
  answer: string;
};

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-white/10 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="text-white font-bold text-[0.8rem] pr-4">
              {item.question}
            </span>
            <svg
              className={`w-5 h-5 text-accent flex-shrink-0 transition-transform ${
                openIndex === i ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {openIndex === i && (
            <div className="px-4 pb-4 text-[0.75rem] leading-relaxed text-text-muted">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
