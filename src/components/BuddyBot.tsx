import { motion } from 'motion/react';

/** The AI Buddy mascot: a friendly white robot. */
export function BuddyBot({ className, mood = 'idle' }: { className?: string; mood?: 'idle' | 'happy' | 'think' }) {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="bb-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="#eef2ff" />
      <line x1="32" y1="8" x2="32" y2="14" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="7" r="3" fill="#22d3ee" />
      <rect x="12" y="14" width="40" height="32" rx="14" fill="url(#bb-body)" stroke="#cbd5e1" />
      <rect x="17" y="20" width="30" height="18" rx="9" fill="#1e1b4b" />
      {mood === 'happy' ? (
        <>
          <path d="M22 30 q3 -4 6 0" stroke="#67e8f9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M36 30 q3 -4 6 0" stroke="#67e8f9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <motion.ellipse cx="25" cy="29" rx="3" ry="3.5" fill="#67e8f9" animate={{ ry: [3.5, 0.5, 3.5] }} transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 3.5 }} />
          <motion.ellipse cx="39" cy="29" rx="3" ry="3.5" fill="#67e8f9" animate={{ ry: [3.5, 0.5, 3.5] }} transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 3.5 }} />
        </>
      )}
      <circle cx="16" cy="36" r="2" fill="#fda4af" opacity="0.7" />
      <circle cx="48" cy="36" r="2" fill="#fda4af" opacity="0.7" />
      <rect x="22" y="46" width="20" height="10" rx="5" fill="url(#bb-body)" stroke="#cbd5e1" />
      <circle cx="32" cy="51" r="2" fill="#818cf8" />
    </motion.svg>
  );
}
