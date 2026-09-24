/* Top-down F1 car, nose to the right. Shared by the race track and road dividers. */
export default function F1Car({ livery, number, id }: { livery: [string, string, string]; number: string; id: string }) {
  return (
    <svg viewBox="0 0 150 56" className="w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`liv-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={livery[0]} />
          <stop offset="0.55" stopColor={livery[1]} />
          <stop offset="1" stopColor={livery[2]} />
        </linearGradient>
      </defs>
      {/* rear wing */}
      <rect x="2" y="6" width="10" height="44" rx="2" fill={`url(#liv-${id})`} />
      <rect x="4" y="8" width="3" height="40" fill="#0b0b0b" opacity="0.5" />
      {/* rear tyres */}
      <rect x="16" y="1" width="22" height="12" rx="3" fill="#111" stroke="#2a2a2a" />
      <rect x="16" y="43" width="22" height="12" rx="3" fill="#111" stroke="#2a2a2a" />
      {/* body / sidepods */}
      <path d="M12 20 L40 14 L70 14 L92 20 L128 23 L140 26 L140 30 L128 33 L92 36 L70 42 L40 42 L12 36 Z" fill={`url(#liv-${id})`} />
      <path d="M40 18 L70 18 L88 23 L88 33 L70 38 L40 38 Z" fill="#000" opacity="0.18" />
      {/* engine cover stripe */}
      <path d="M14 27 H120" stroke="white" strokeOpacity="0.6" strokeWidth="1.4" />
      {/* cockpit + halo */}
      <ellipse cx="80" cy="28" rx="10" ry="6" fill="#050505" />
      <path d="M72 28 A8 6 0 0 1 90 28" stroke="#d4d4d8" strokeWidth="1.6" fill="none" />
      <circle cx="80" cy="28" r="3.2" fill={livery[2]} />
      {/* front tyres */}
      <rect x="100" y="3" width="18" height="11" rx="3" fill="#111" stroke="#2a2a2a" />
      <rect x="100" y="42" width="18" height="11" rx="3" fill="#111" stroke="#2a2a2a" />
      {/* front wing */}
      <path d="M134 6 L146 10 L146 46 L134 50 Z" fill={`url(#liv-${id})`} />
      <rect x="140" y="8" width="3" height="40" fill="white" opacity="0.5" />
      {/* number */}
      <text x="50" y="31.5" fontSize="9" fontWeight="900" fill="white" fontFamily="Arial" fontStyle="italic">
        {number}
      </text>
    </svg>
  );
}
