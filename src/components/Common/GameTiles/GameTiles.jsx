import React from "react";
import { Link } from "react-router-dom";

const GAMES = [
  { name: "Crash", path: "/crash", emoji: "🚀", color: "#ef4444", desc: "Cash out before the crash" },
  { name: "Slots", path: "/slots", emoji: "🎰", color: "#f59e0b", desc: "Spin to win" },
  { name: "Blackjack", path: "/blackjack", emoji: "🃏", color: "#16a34a", desc: "Beat the dealer" },
  { name: "Roulette", path: "/roulette", emoji: "🎡", color: "#7c3aed", desc: "Place your bets" },
  { name: "Coinflip", path: "/coinflip", emoji: "🪙", color: "#facc15", desc: "Heads or tails" },
  { name: "Mines", path: "/mines", emoji: "💣", color: "#0891b2", desc: "Find the gems" },
  { name: "Jackpot", path: "/jackpot", emoji: "🏆", color: "#db2777", desc: "Winner takes all" },
];

const GameTiles = ({ title = "Our Games", limit }) => {
  const items = limit ? GAMES.slice(0, limit) : GAMES;

  return (
    <div style={{ margin: "32px 0" }}>
      {title && (
        <div style={{
          color: "#fff",
          fontSize: 18,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 16,
        }}>
          {title}
        </div>
      )}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 16,
      }}>
        {items.map((g) => (
          <Link key={g.path} to={g.path} style={{ textDecoration: "none" }}>
            <div
              style={{
                position: "relative",
                aspectRatio: "1 / 1.2",
                borderRadius: 12,
                background: `linear-gradient(135deg, ${g.color}33, rgba(15,17,26,0.9))`,
                border: `1px solid ${g.color}55`,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 8px 24px ${g.color}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                fontSize: 64,
                textAlign: "center",
                marginTop: 12,
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
              }}>
                {g.emoji}
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  {g.name}
                </div>
                <div style={{ color: "#aaa", fontSize: 12 }}>
                  {g.desc}
                </div>
              </div>
              <div style={{
                position: "absolute",
                top: 12,
                right: 12,
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 4,
                background: g.color,
                color: "#fff",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}>
                Play
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GameTiles;
