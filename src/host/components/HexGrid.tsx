/**
 * HexGrid — ambient SVG hex-grid background layer.
 * Pure CSS animation, no JS per-frame work.
 */
export function HexGrid({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="hex-pattern"
          x="0"
          y="0"
          width="60"
          height="52"
          patternUnits="userSpaceOnUse"
        >
          {/* Flat-top hexagon path */}
          <path
            d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z"
            fill="none"
            stroke="rgba(56,189,248,0.055)"
            strokeWidth="0.8"
          />
        </pattern>
        <radialGradient id="hex-fade" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.7" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="hex-mask">
          <rect width="100%" height="100%" fill="url(#hex-fade)" />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#hex-pattern)"
        mask="url(#hex-mask)"
      />
    </svg>
  );
}
