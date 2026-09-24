/* Detailed top-down F1 car, nose to the right. Liveries are team-*inspired* colour schemes only. */

export type Livery = {
  base: string; // main body colour
  base2: string; // body gradient end
  accent: string; // primary stripe
  accent2: string; // secondary highlight
  number: string;
  helmet: string;
};

export const LIVERIES: Record<"bull" | "arrow", Livery> = {
  // navy / red / yellow scheme
  bull: { base: "#1b2a6b", base2: "#0f1a45", accent: "#e10600", accent2: "#ffcc00", number: "07", helmet: "#ffcc00" },
  // silver / black / teal scheme
  arrow: { base: "#c9ced4", base2: "#16181b", accent: "#00d2be", accent2: "#0a0a0a", number: "11", helmet: "#f5f5f5" },
};

export default function F1Car({ livery, id, rainLight = false }: { livery: Livery; id: string; rainLight?: boolean }) {
  const L = livery;
  const tyre = (x: number, y: number, w: number, h: number) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="7" fill="#0d0d0d" stroke="#262626" strokeWidth="1.5" />
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={i} x1={x + 4 + i * ((w - 8) / 4)} y1={y + 2} x2={x + 4 + i * ((w - 8) / 4)} y2={y + h - 2} stroke="#1f1f1f" strokeWidth="1" />
      ))}
      <rect x={x + w / 2 - 6} y={y + h / 2 - 3} width="12" height="6" rx="2" fill="#3f3f46" />
    </g>
  );
  return (
    <svg viewBox="0 0 300 110" className="w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`body-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={L.base} />
          <stop offset="0.5" stopColor={L.base} />
          <stop offset="1" stopColor={L.base2} />
        </linearGradient>
        <linearGradient id={`sheen-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* floor / plank */}
      <path d="M30 30 L252 40 L252 70 L30 80 Z" fill="#070707" />
      <path d="M40 34 L240 42 M40 76 L240 68" stroke="#1d1d1d" strokeWidth="2" />

      {/* suspension arms */}
      <g stroke="#27272a" strokeWidth="2.2">
        <path d="M60 34 L56 14 M72 34 L60 14 M60 76 L56 96 M72 76 L60 96" />
        <path d="M212 44 L236 16 M224 46 L238 16 M212 66 L236 94 M224 64 L238 94" />
      </g>

      {tyre(34, 2, 46, 24)}
      {tyre(34, 84, 46, 24)}
      {tyre(218, 5, 36, 22)}
      {tyre(218, 83, 36, 22)}

      {/* rear wing + endplates + DRS flap */}
      <rect x="6" y="10" width="22" height="90" rx="3" fill={L.base2} />
      <rect x="9" y="12" width="7" height="86" fill={L.accent} />
      <rect x="18" y="12" width="7" height="86" fill={L.base} opacity="0.9" />
      <rect x="4" y="8" width="26" height="6" rx="2" fill={L.base2} />
      <rect x="4" y="96" width="26" height="6" rx="2" fill={L.base2} />
      {/* rain light */}
      <rect x="1" y="50" width="6" height="10" rx="1.5" fill="#ff2a2a" className={rainLight ? "animate-pulse" : ""} opacity={rainLight ? 1 : 0.55} />

      {/* body: coke-bottle sidepods tapering to the nose */}
      <path
        d="M28 44 C58 40 80 24 122 24 L168 26 C192 29 206 44 232 48 L276 51 L290 55 L276 59 L232 62 C206 66 192 81 168 84 L122 86 C80 86 58 70 28 66 Z"
        fill={`url(#body-${id})`}
      />
      {/* livery stripes */}
      <path d="M40 52 L276 53 L276 57 L40 58 Z" fill={L.accent} />
      <path d="M96 30 C120 27 150 27 168 30 L168 36 C150 33 120 33 96 36 Z" fill={L.accent2} opacity="0.95" />
      <path d="M96 80 C120 83 150 83 168 80 L168 74 C150 77 120 77 96 74 Z" fill={L.accent2} opacity="0.95" />
      <path d="M232 49 L276 51.5 L276 58.5 L232 61 Z" fill={L.accent2} opacity="0.9" />
      {/* sheen */}
      <path d="M40 46 L270 52 L270 54 L40 50 Z" fill={`url(#sheen-${id})`} />

      {/* engine cover spine + airbox */}
      <path d="M40 50 C90 46 130 44 160 47 L160 63 C130 66 90 64 40 60 Z" fill="#000" opacity="0.18" />
      <ellipse cx="160" cy="55" rx="12" ry="7" fill={L.base2} stroke={L.accent} strokeWidth="1.5" />

      {/* cockpit, driver helmet, halo */}
      <ellipse cx="190" cy="55" rx="16" ry="9" fill="#050505" />
      <circle cx="188" cy="55" r="6.5" fill={L.helmet} />
      <path d="M186 51 A4 4 0 0 1 192 53" stroke="#111" strokeWidth="2" fill="none" />
      <path d="M174 55 C176 43 204 43 207 55 C204 67 176 67 174 55" stroke="#d4d4d8" strokeWidth="2.4" fill="none" />
      <path d="M207 55 L214 55" stroke="#d4d4d8" strokeWidth="2.4" />

      {/* front wing: three elements + endplates */}
      <path d="M262 8 L292 14 L292 96 L262 102 Z" fill={L.base2} />
      <path d="M266 10 L290 15 L290 95 L266 100 Z" fill={L.accent} opacity="0.95" />
      <path d="M272 12 L288 16 L288 94 L272 98 Z" fill={L.base} />
      <rect x="258" y="4" width="36" height="6" rx="2" fill={L.base2} />
      <rect x="258" y="100" width="36" height="6" rx="2" fill={L.base2} />

      {/* number on nose + engine cover */}
      <text x="240" y="58.5" fontSize="10" fontWeight="900" fill="#fff" fontFamily="Arial" fontStyle="italic">
        {L.number}
      </text>
      <text x="110" y="59" fontSize="13" fontWeight="900" fill="#fff" fontFamily="Arial" fontStyle="italic" opacity="0.9">
        {L.number}
      </text>
    </svg>
  );
}
