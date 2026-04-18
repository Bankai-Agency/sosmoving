export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Yellow lightning-bolt mark — subtle nod to ENOT */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
          fill="var(--color-brand)"
          stroke="var(--color-brand)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.22px] text-white">
        sos<span className="text-white/56">.admin</span>
      </span>
    </div>
  );
}
