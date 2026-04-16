'use client';

import { useState } from 'react';

export function QuoteForm() {
  const [step, setStep] = useState(1);

  return (
    <div className="bg-white rounded-xl p-6 max-w-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-black font-bold text-[0.9rem]">
          Free Quote for Your Move
        </h3>
        <span className="text-[0.6rem] text-dim-grey bg-gray-100 px-3 py-1 rounded-full">
          Step {step} of 2
        </span>
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.6rem] text-dim-grey mb-1">
                Your Name*
              </label>
              <input
                type="text"
                placeholder="Name Surname"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[0.7rem] text-black focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.6rem] text-dim-grey mb-1">
                Email*
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[0.7rem] text-black focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[0.6rem] text-dim-grey mb-1">
              Phone*
            </label>
            <input
              type="tel"
              placeholder="+1 (234) 567-89-10"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[0.7rem] text-black focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full bg-accent text-black font-bold py-3 rounded-lg text-[0.75rem] hover:bg-accent-hover transition-colors"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.6rem] text-dim-grey mb-1">
                Moving From (ZIP)
              </label>
              <input
                type="text"
                placeholder="ZIP code"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[0.7rem] text-black focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.6rem] text-dim-grey mb-1">
                Moving To (ZIP)
              </label>
              <input
                type="text"
                placeholder="ZIP code"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[0.7rem] text-black focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.6rem] text-dim-grey mb-1">
                Moving Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[0.7rem] text-black focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.6rem] text-dim-grey mb-1">
                Move Size
              </label>
              <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[0.7rem] text-black focus:border-accent focus:outline-none">
                <option>Select size</option>
                <option>Studio</option>
                <option>1 Bedroom</option>
                <option>2 Bedrooms</option>
                <option>3 Bedrooms</option>
                <option>4+ Bedrooms</option>
                <option>Office/Commercial</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 border border-gray-200 rounded-lg text-[0.7rem] text-dim-grey hover:border-gray-400 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-accent text-black font-bold py-3 rounded-lg text-[0.75rem] hover:bg-accent-hover transition-colors"
            >
              Get Free Quote
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
