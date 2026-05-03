import React, { useState, useMemo } from "react";
import LiveWinsSection from "../../Common/WinnerCard/LiveWinsSection";
import NavigationHeader from "../../Common/NavigationHeader/NavigationHeader";
import { StyledPageContainer } from "./styles";
import SlotsGame from "./SlotsGame";

const GAMES = [
  { id: "classic", name: "Classic Fruits", emoji: "🍒", color1: "#f59e0b", color2: "#ef4444", tags: ["hot", "fruits"] },
  { id: "bonanza", name: "Sweet Bonanza", emoji: "🍬", color1: "#ec4899", color2: "#8b5cf6", tags: ["hot", "candy"] },
  { id: "egypt",   name: "Book of Pyramids", emoji: "📜", color1: "#facc15", color2: "#d97706", tags: ["book", "ancient"] },
  { id: "dragon",  name: "Dragon Fortune", emoji: "🐉", color1: "#dc2626", color2: "#facc15", tags: ["hot", "asian"] },
  { id: "pirate",  name: "Pirates Treasure", emoji: "🏴‍☠️", color1: "#06b6d4", color2: "#0891b2", tags: ["adventure"] },
  { id: "space",   name: "Cosmic Spins", emoji: "🚀", color1: "#8b5cf6", color2: "#3b82f6", tags: ["sci-fi"] },
  { id: "vegas",   name: "Vegas Lights", emoji: "🎰", color1: "#ef4444", color2: "#f59e0b", tags: ["classic"] },
  { id: "jungle",  name: "Jungle Spirits", emoji: "🦁", color1: "#16a34a", color2: "#84cc16", tags: ["wild", "animals"] },
];

const CATEGORIES = [
  { key: "all", label: "All Games" },
  { key: "hot", label: "🔥 Hot" },
  { key: "fruits", label: "🍒 Fruits" },
  { key: "candy", label: "🍬 Candy" },
  { key: "book", label: "📖 Books" },
  { key: "ancient", label: "🏛️ Ancient" },
  { key: "asian", label: "🐲 Asian" },
  { key: "sci-fi", label: "🚀 Sci-Fi" },
  { key: "classic", label: "🎰 Classic" },
];

const Slots = () => {
  const [activeGame, setActiveGame] = useState(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filteredGames = useMemo(() => {
    let list = GAMES;
    if (category !== "all") list = list.filter(g => g.tags.includes(category));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(q));
    }
    return list;
  }, [category, search]);

  return (
    <StyledPageContainer>
      <LiveWinsSection title="Live wins" hasFilters={true} />
      <NavigationHeader isNftPage={false} />

      <div className="content-container" style={{ padding: 20 }}>
        {/* Active game player */}
        {activeGame && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button onClick={() => setActiveGame(null)} style={{
                background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8,
                padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}>← Back to lobby</button>
            </div>
            <SlotsGame gameId={activeGame.id} title={activeGame.name} />
          </div>
        )}

        {!activeGame && (
          <>
            {/* Hero header */}
            <div style={{
              padding: "32px 24px",
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(236,72,153,0.15), rgba(139,92,246,0.15))",
              border: "1px solid rgba(245,158,11,0.2)",
              marginBottom: 24,
              textAlign: "center",
            }}>
              <h1 style={{
                fontSize: 32, fontWeight: 800, marginBottom: 8,
                background: "linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                🎰 BetNova Slots
              </h1>
              <p style={{ color: "#aaa", fontSize: 14, margin: 0 }}>
                {GAMES.length} unique slot games · 5 paylines · Provably Fair · Up to 100x
              </p>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Search games..."
                style={{
                  width: "100%", maxWidth: 400, padding: "12px 16px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,17,26,0.6)",
                  color: "#fff", fontSize: 14, outline: "none",
                }}
              />
            </div>

            {/* Categories */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: category === cat.key
                    ? "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(236,72,153,0.25))"
                    : "rgba(255,255,255,0.04)",
                  color: category === cat.key ? "#f59e0b" : "#aaa",
                  border: category === cat.key ? "1px solid rgba(245,158,11,0.4)" : "1px solid transparent",
                  whiteSpace: "nowrap",
                }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Game grid */}
            {filteredGames.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#676D7C" }}>
                No games match your search
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 16,
              }}>
                {filteredGames.map(game => (
                  <div
                    key={game.id}
                    onClick={() => setActiveGame(game)}
                    style={{
                      borderRadius: 14, overflow: "hidden", cursor: "pointer", position: "relative",
                      aspectRatio: "1 / 1.3",
                      background: `linear-gradient(135deg, ${game.color1}, ${game.color2})`,
                      border: `1px solid ${game.color1}66`,
                      transition: "transform 0.2s, box-shadow 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: 16,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow = `0 12px 32px ${game.color1}66`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Hot badge */}
                    {game.tags.includes("hot") && (
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700,
                        padding: "3px 8px", borderRadius: 4, textTransform: "uppercase",
                        letterSpacing: 0.5, boxShadow: "0 2px 8px rgba(239,68,68,0.6)",
                      }}>🔥 Hot</div>
                    )}

                    {/* Big emoji icon */}
                    <div style={{
                      fontSize: 80,
                      textAlign: "center",
                      filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))",
                      marginTop: 12,
                    }}>
                      {game.emoji}
                    </div>

                    {/* Name and play */}
                    <div>
                      <div style={{
                        color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 4,
                        textShadow: "0 2px 6px rgba(0,0,0,0.4)",
                      }}>
                        {game.name}
                      </div>
                      <div style={{
                        display: "inline-block",
                        padding: "5px 12px",
                        background: "rgba(0,0,0,0.4)",
                        backdropFilter: "blur(4px)",
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}>
                        ▶ Play
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </StyledPageContainer>
  );
};

export default Slots;
