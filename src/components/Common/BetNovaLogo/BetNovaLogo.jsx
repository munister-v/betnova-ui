import React from "react";

/**
 * BetNova wordmark logo
 * size: "sm" | "md" | "lg"
 * mono: true = white only (no gradient)
 */
export default function BetNovaLogo({ size = "md", mono = false }) {
  const sizes = {
    sm: { icon: 22, text: 17, gap: 7 },
    md: { icon: 28, text: 21, gap: 9 },
    lg: { icon: 36, text: 27, gap: 11 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap, userSelect: "none", textDecoration: "none" }}>
      {/* Icon — stylized "B" hexagon */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="bn-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        {/* Hexagon background */}
        <path
          d="M16 2L29 9.5V22.5L16 30L3 22.5V9.5L16 2Z"
          fill={mono ? "rgba(255,255,255,0.15)" : "url(#bn-logo-grad)"}
          opacity={mono ? 1 : 0.95}
        />
        {/* "B" letterform */}
        <text
          x="16" y="22"
          textAnchor="middle"
          fontFamily="Arial Black, sans-serif"
          fontWeight="900"
          fontSize="16"
          fill="#fff"
          letterSpacing="-1"
        >B</text>
      </svg>

      {/* Wordmark */}
      <span style={{
        fontFamily: "'Arial Black', 'Impact', sans-serif",
        fontWeight: 900,
        fontSize: s.text,
        letterSpacing: 1.5,
        background: mono ? "none" : "linear-gradient(135deg, #e2e8f0 0%, #ffffff 50%, #c4b5fd 100%)",
        WebkitBackgroundClip: mono ? "unset" : "text",
        WebkitTextFillColor: mono ? "#fff" : "transparent",
        color: mono ? "#fff" : "transparent",
        lineHeight: 1,
      }}>
        BET<span style={{
          background: mono ? "none" : "linear-gradient(135deg, #a78bfa, #ec4899)",
          WebkitBackgroundClip: mono ? "unset" : "text",
          WebkitTextFillColor: mono ? "#c4b5fd" : "transparent",
          color: mono ? "#c4b5fd" : "transparent",
        }}>NOVA</span>
      </span>
    </div>
  );
}
