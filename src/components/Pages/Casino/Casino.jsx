import React from "react";
import { Link } from "react-router-dom";
import NavigationHeader from "../../Common/NavigationHeader/NavigationHeader";
import LiveWinsSection from "../../Common/WinnerCard/LiveWinsSection";
import GameTiles from "../../Common/GameTiles/GameTiles";
import DailyBonus from "../../Common/DailyBonus/DailyBonus";
import { StyledPageContainer } from "./styles";

// Slots preview — 8 games shown as mini tiles with "View all" link
const SLOT_PREVIEW = [
  { id: "classic",  name: "Classic Fruits",    emoji: "🍒", color1: "#f59e0b", color2: "#ef4444" },
  { id: "bonanza",  name: "Sweet Bonanza",      emoji: "🍬", color1: "#ec4899", color2: "#8b5cf6" },
  { id: "egypt",    name: "Book of Pyramids",   emoji: "📜", color1: "#facc15", color2: "#d97706" },
  { id: "dragon",   name: "Dragon Fortune",     emoji: "🐉", color1: "#dc2626", color2: "#facc15" },
  { id: "pirate",   name: "Pirates Treasure",   emoji: "🏴‍☠️", color1: "#06b6d4", color2: "#0891b2" },
  { id: "space",    name: "Cosmic Spins",       emoji: "🚀", color1: "#8b5cf6", color2: "#3b82f6" },
  { id: "vegas",    name: "Vegas Lights",       emoji: "🎰", color1: "#ef4444", color2: "#f59e0b" },
  { id: "jungle",   name: "Jungle Spirits",     emoji: "🦁", color1: "#16a34a", color2: "#84cc16" },
];

function SectionHeader({ title, linkTo, linkLabel = "View all →" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 16,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        color: "#fff", fontSize: 13, fontWeight: 800,
        textTransform: "uppercase", letterSpacing: 2,
      }}>
        <div style={{ width: 3, height: 16, background: "linear-gradient(180deg,#a78bfa,#ec4899)", borderRadius: 2 }} />
        {title}
      </div>
      {linkTo && (
        <Link to={linkTo} style={{
          fontSize: 12, color: "#a78bfa", fontWeight: 600,
          textDecoration: "none", letterSpacing: 0.5,
        }}
        onMouseEnter={e => e.target.style.color = "#ec4899"}
        onMouseLeave={e => e.target.style.color = "#a78bfa"}
        >{linkLabel}</Link>
      )}
    </div>
  );
}

const Casino = () => (
  <StyledPageContainer>
    <LiveWinsSection title="Live wins" hasFilters={true} />
    <NavigationHeader isNftPage={false} />

    <div className="content-container">
      {/* Daily Bonus */}
      <div style={{ marginBottom: 24 }}>
        <DailyBonus />
      </div>

      {/* BetNova Originals */}
      <div style={{ marginBottom: 36 }}>
        <GameTiles title="BetNova Originals" />
      </div>

      {/* Slots preview */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader title="Slots" linkTo="/slots" />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 10,
        }}>
          {SLOT_PREVIEW.map(game => (
            <Link key={game.id} to={`/slots`} state={{ gameId: game.id }} style={{ textDecoration: "none" }}>
              <div
                style={{
                  position: "relative",
                  aspectRatio: "3 / 4",
                  borderRadius: 10,
                  background: `linear-gradient(160deg, ${game.color1}55 0%, ${game.color2}99 100%)`,
                  border: `1px solid ${game.color1}44`,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform 0.18s, box-shadow 0.18s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                  e.currentTarget.style.boxShadow = `0 10px 28px ${game.color1}55`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                {/* radial dot bg */}
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `radial-gradient(circle at 20% 20%, ${game.color1}22 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                  pointerEvents: "none",
                }} />
                {/* top shine */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "45%",
                  background: "linear-gradient(180deg,rgba(255,255,255,0.07),transparent)",
                  pointerEvents: "none",
                }} />
                {/* emoji */}
                <div style={{
                  position: "absolute", bottom: 28, left: 0, right: 0,
                  textAlign: "center", fontSize: 44,
                  filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
                  pointerEvents: "none",
                }}>{game.emoji}</div>
                {/* bottom gradient */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: "45%",
                  background: "linear-gradient(0deg,rgba(0,0,0,0.85),transparent)",
                  pointerEvents: "none",
                }} />
                {/* name */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "0 8px 8px",
                }}>
                  <div style={{
                    color: "#fff", fontSize: 11, fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: 0.3,
                    textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                    lineHeight: 1.2,
                  }}>{game.name}</div>
                  <div style={{ fontSize: 9, color: game.color1, fontWeight: 600, marginTop: 1 }}>BetNova Slots</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  </StyledPageContainer>
);

export default Casino;
