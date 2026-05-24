import React from 'react';

/**
 * SVG circular progress ring.
 * @param {number} percent  0-100
 * @param {number} size     diameter in px (default 36)
 * @param {number} stroke   stroke width (default 3)
 */
export default function MasteryRing({ percent = 0, size = 36, stroke = 3, label = true }) {
  const r = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference;

  // Color interpolation: 0%→rose, 50%→amber, 100%→indigo
  const color =
    percent >= 70 ? '#4f46e5'
    : percent >= 40 ? '#f59e0b'
    : '#f43f5e';

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {label && (
        <span
          className="absolute text-[8px] font-bold tabular-nums"
          style={{ color }}
        >
          {percent}%
        </span>
      )}
    </div>
  );
}
