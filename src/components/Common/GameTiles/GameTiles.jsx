import React from "react";
import { Link } from "react-router-dom";

const GAMES = [
  {
    name: "Crash",
    path: "/crash",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #1a0a0a 0%, #7f1d1d 40%, #ef4444 100%)",
    accent: "#ef4444",
    deco: "📈",
    decoStyle: { fontSize: 90, bottom: 30, right: -10, opacity: 0.25, transform: "rotate(-15deg)" },
    badge: "HOT",
    badgeColor: "#ef4444",
  },
  {
    name: "Slots",
    path: "/slots",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #1a1200 0%, #92400e 40%, #f59e0b 100%)",
    accent: "#f59e0b",
    deco: "🎰",
    decoStyle: { fontSize: 90, bottom: 20, right: -5, opacity: 0.25 },
    badge: "NEW",
    badgeColor: "#7c3aed",
  },
  {
    name: "Blackjack",
    path: "/blackjack",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #051a0a 0%, #14532d 40%, #16a34a 100%)",
    accent: "#22c55e",
    deco: "🃏",
    decoStyle: { fontSize: 90, bottom: 20, right: -5, opacity: 0.25, transform: "rotate(10deg)" },
  },
  {
    name: "Roulette",
    path: "/roulette",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #0d0618 0%, #4c1d95 40%, #7c3aed 100%)",
    accent: "#a78bfa",
    deco: "🎡",
    decoStyle: { fontSize: 90, bottom: 20, right: -5, opacity: 0.25 },
    badge: "LIVE",
    badgeColor: "#22c55e",
  },
  {
    name: "Coinflip",
    path: "/coinflip",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #1a1600 0%, #854d0e 40%, #facc15 100%)",
    accent: "#fbbf24",
    deco: "🪙",
    decoStyle: { fontSize: 90, bottom: 20, right: -5, opacity: 0.25 },
  },
  {
    name: "Mines",
    path: "/mines",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #001a1a 0%, #164e63 40%, #0891b2 100%)",
    accent: "#22d3ee",
    deco: "💎",
    decoStyle: { fontSize: 90, bottom: 20, right: -5, opacity: 0.25 },
    badge: "HOT",
    badgeColor: "#ef4444",
  },
  {
    name: "Dice",
    path: "/dice",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #001a0a 0%, #065f46 40%, #10b981 100%)",
    accent: "#34d399",
    deco: "🎲",
    decoStyle: { fontSize: 90, bottom: 20, right: -5, opacity: 0.25 },
    badge: "NEW",
    badgeColor: "#10b981",
  },
  {
    name: "Hi-Lo",
    path: "/hilo",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #1a0800 0%, #7c2d12 40%, #ea580c 100%)",
    accent: "#fb923c",
    deco: "🃏",
    decoStyle: { fontSize: 90, bottom: 20, right: -5, opacity: 0.25, transform: "rotate(10deg)" },
    badge: "NEW",
    badgeColor: "#ea580c",
  },
  {
    name: "Plinko",
    path: "/plinko",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #0a001a 0%, #3b0764 40%, #7c3aed 100%)",
    accent: "#a78bfa",
    deco: "🔮",
    decoStyle: { fontSize: 90, bottom: 20, right: -5, opacity: 0.25 },
    badge: "NEW",
    badgeColor: "#7c3aed",
  },
  {
    name: "Keno",
    path: "/keno",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #0a1a00 0%, #14532d 40%, #16a34a 100%)",
    accent: "#4ade80",
    deco: "🎯",
    decoStyle: { fontSize: 90, bottom: 20, right: -5, opacity: 0.25 },
    badge: "NEW",
    badgeColor: "#16a34a",
  },
  {
    name: "Jackpot",
    path: "/jackpot",
    provider: "BetNova Originals",
    bg: "linear-gradient(160deg, #1a0011 0%, #831843 40%, #db2777 100%)",
    accent: "#f472b6",
    deco: "🏆",
    decoStyle: { fontSize: 90, bottom: 20, right: -5, opacity: 0.25 },
    badge: "PRIZE",
    badgeColor: "#f59e0b",
  },
];

const GameTiles = ({ title = "Our Games", limit }) => {
  const items = limit ? GAMES.slice(0, limit) : GAMES;

  return (
    <div style={{ width: "100%", margin: "24px 0" }}>
      {title && (
        <div style={{
          color: "#fff",
          fontSize: 13,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{ width: 3, height: 16, background: "linear-gradient(180deg,#a78bfa,#ec4899)", borderRadius: 2 }} />
          {title}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 12,
        width: "100%",
      }}>
        {items.map((g) => (
          <Link key={g.path} to={g.path} style={{ textDecoration: "none", display: "block" }}>
            <div
              style={{
                position: "relative",
                aspectRatio: "3 / 4",
                borderRadius: 12,
                background: g.bg,
                border: `1px solid ${g.accent}44`,
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px) scale(1.02)";
                e.currentTarget.style.boxShadow = `0 12px 32px ${g.accent}55`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Subtle grid pattern overlay */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `radial-gradient(circle at 20% 20%, ${g.accent}22 1px, transparent 1px)`,
                backgroundSize: "24px 24px",
                pointerEvents: "none",
              }} />

              {/* Top shine */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "50%",
                background: "linear-gradient(180deg, rgba(255,255,255,0.08), transparent)",
                pointerEvents: "none",
              }} />

              {/* Badge */}
              {g.badge && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  fontSize: 9, fontWeight: 800,
                  padding: "3px 8px", borderRadius: 4,
                  background: g.badgeColor,
                  color: "#fff",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  boxShadow: `0 2px 8px ${g.badgeColor}88`,
                  zIndex: 2,
                }}>{g.badge}</div>
              )}

              {/* Decorative emoji — big, faded, background */}
              <div style={{
                position: "absolute",
                ...g.decoStyle,
                pointerEvents: "none",
                userSelect: "none",
                lineHeight: 1,
              }}>
                {g.deco}
              </div>

              {/* Bottom gradient overlay */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
                background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
                pointerEvents: "none",
              }} />

              {/* Text at bottom */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "0 12px 12px",
                zIndex: 2,
              }}>
                <div style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  lineHeight: 1.2,
                  textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                  marginBottom: 3,
                }}>{g.name}</div>
                <div style={{
                  color: g.accent,
                  fontSize: 10,
                  fontWeight: 600,
                  opacity: 0.9,
                }}>{g.provider}</div>
              </div>

              {/* PLAY hover overlay */}
              <div className="play-overlay" style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
                zIndex: 3,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0)"}
              >
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GameTiles;
