import React, { useState, useMemo } from "react";
import LiveWinsSection from "../../Common/WinnerCard/LiveWinsSection";
import NavigationHeader from "../../Common/NavigationHeader/NavigationHeader";
import { StyledPageContainer } from "./styles";
import SlotsGame from "./SlotsGame";

const POSTER = (id) => `https://static.bgaming-network.com/games/${id}/en/poster_2x3.jpg`;

const BGAMING_GAMES = [
  // Hot / Popular
  { id: "BonanzaBillion", name: "Bonanza Billion", tags: ["hot", "slots", "buy-bonus"] },
  { id: "ElvisFrogInVegas", name: "Elvis Frog in Vegas", tags: ["hot", "slots"] },
  { id: "BookOfCats", name: "Book of Cats", tags: ["hot", "slots", "book"] },
  { id: "AztecMagicMegaways", name: "Aztec Magic Megaways", tags: ["hot", "megaways"] },
  { id: "WildCash", name: "Wild Cash", tags: ["hot", "slots"] },
  { id: "DiceTwice", name: "Dice Twice", tags: ["hot", "instant"] },

  // Slots
  { id: "BookOfSuns", name: "Book of Suns", tags: ["slots", "book"] },
  { id: "LuckyOak", name: "Lucky Oak", tags: ["slots"] },
  { id: "JokerQueen", name: "Joker Queen", tags: ["slots"] },
  { id: "CandyMonsta", name: "Candy Monsta", tags: ["slots"] },
  { id: "DragonsMoney", name: "Dragon's Money", tags: ["slots"] },
  { id: "SpinAndSpell", name: "Spin & Spell", tags: ["slots"] },
  { id: "SweetSuccess", name: "Sweet Success", tags: ["slots"] },
  { id: "PiggyRich", name: "Piggy Rich", tags: ["slots"] },
  { id: "AlohaKingElvis", name: "Aloha King Elvis", tags: ["slots"] },
  { id: "AvalonGold", name: "Avalon Gold", tags: ["slots"] },
  { id: "ScrollOfDead", name: "Scroll of Dead", tags: ["slots", "book"] },
  { id: "BookOfPyramids", name: "Book of Pyramids", tags: ["slots", "book"] },
  { id: "TempleOfDead", name: "Temple of Dead", tags: ["slots"] },
  { id: "WizardsClash", name: "Wizards Clash", tags: ["slots"] },
  { id: "BurningBerries", name: "Burning Berries", tags: ["slots", "fruits"] },
  { id: "ChillyFruits", name: "Chilly Fruits", tags: ["slots", "fruits"] },
  { id: "DesertGold", name: "Desert Gold", tags: ["slots"] },
  { id: "ClashOfPirates", name: "Clash of Pirates", tags: ["slots"] },
  { id: "DigDigDigger", name: "Dig Dig Digger", tags: ["slots"] },
  { id: "JohnnyCash", name: "Johnny Cash", tags: ["slots"] },
  { id: "PrincessRoyal", name: "Princess Royal", tags: ["slots"] },
  { id: "WestTownPokie", name: "West Town", tags: ["slots"] },
  { id: "WolfHidings", name: "Wolf Hidings", tags: ["slots"] },
  { id: "AztecMagicDeluxe", name: "Aztec Magic Deluxe", tags: ["slots"] },
  { id: "DiamondWins", name: "Diamond Wins", tags: ["slots", "buy-bonus"] },
  { id: "DolceVita", name: "Dolce Vita", tags: ["slots"] },
  { id: "DragonsGoldHold", name: "Dragon's Gold Hold", tags: ["slots", "hold"] },
  { id: "WildBuffaloHold", name: "Wild Buffalo Hold", tags: ["slots", "hold"] },
  { id: "ChickenChase", name: "Chicken Chase", tags: ["slots"] },
  { id: "HotRio", name: "Hot Rio", tags: ["slots", "fruits"] },
  { id: "HitTheRoute", name: "Hit the Route", tags: ["slots"] },
  { id: "777Strike", name: "777 Strike", tags: ["slots", "fruits"] },
  { id: "Domnitors", name: "Domnitors", tags: ["slots"] },
  { id: "Fire88", name: "Fire 88", tags: ["slots"] },
  { id: "AztecClusters", name: "Aztec Clusters", tags: ["slots", "cluster"] },
  { id: "MasterOfWands", name: "Master of Wands", tags: ["slots"] },
  { id: "WestTownVampires", name: "West Town Vampires", tags: ["slots"] },

  // Megaways
  { id: "BookOfCatsMegaways", name: "Book of Cats Megaways", tags: ["megaways", "book"] },

  // Instant / Crash
  { id: "Plinko", name: "Plinko", tags: ["instant"] },
  { id: "Hilo", name: "Hi-Lo", tags: ["instant", "cards"] },
  { id: "Mines", name: "Mines (BGaming)", tags: ["instant"] },

  // Cards / Table
  { id: "EuropeanRoulette", name: "European Roulette", tags: ["table"] },
  { id: "BlackjackSurrender", name: "Blackjack Surrender", tags: ["table", "cards"] },
  { id: "DoubleExposureBlackjack", name: "Double Exposure BJ", tags: ["table", "cards"] },
];

const CATEGORIES = [
  { key: "all", label: "All Games", count: BGAMING_GAMES.length },
  { key: "hot", label: "🔥 Hot" },
  { key: "slots", label: "🎰 Slots" },
  { key: "megaways", label: "💫 Megaways" },
  { key: "book", label: "📖 Book of..." },
  { key: "fruits", label: "🍒 Fruits" },
  { key: "buy-bonus", label: "💰 Buy Bonus" },
  { key: "instant", label: "⚡ Instant" },
  { key: "table", label: "🃏 Table Games" },
];

const Slots = () => {
  const [activeTab, setActiveTab] = useState("bgaming");
  const [activeGame, setActiveGame] = useState(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filteredGames = useMemo(() => {
    let list = BGAMING_GAMES;
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

      <div className="content-container">
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[["bgaming", "🎮 Slots Library"], ["betnova", "🎰 BetNova Original"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: "10px 22px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: activeTab === key ? "#2563eb" : "rgba(255,255,255,0.05)",
              color: activeTab === key ? "#fff" : "#676D7C",
            }}>{label}</button>
          ))}
        </div>

        {activeTab === "betnova" && <SlotsGame />}

        {activeTab === "bgaming" && (
          <>
            {/* Active iframe player */}
            {activeGame && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>
                    {BGAMING_GAMES.find(g => g.id === activeGame)?.name}
                  </div>
                  <button onClick={() => setActiveGame(null)} style={{
                    background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6,
                    padding: "6px 14px", color: "#aaa", cursor: "pointer", fontSize: 13,
                  }}>✕ Close</button>
                </div>
                <div style={{
                  width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden",
                  background: "#000", border: "1px solid rgba(255,255,255,0.07)", position: "relative",
                }}>
                  <iframe
                    key={activeGame}
                    src={`https://demo.bgaming-network.com/games/${activeGame}/index.html?currency=USD&bet_size=1&lang=en`}
                    style={{ width: "100%", height: "100%", border: "none" }}
                    title={activeGame}
                    allow="autoplay"
                  />
                  {/* Mask BGaming "DEMO MODE" injected badge in top-right corner */}
                  <div style={{
                    position: "absolute",
                    top: 0, right: 0,
                    width: 180, height: 56,
                    background: "#000",
                    pointerEvents: "none",
                    zIndex: 2,
                  }} />
                </div>
              </div>
            )}

            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Search games..."
                style={{
                  width: "100%", maxWidth: 400, padding: "10px 14px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,17,26,0.6)",
                  color: "#fff", fontSize: 14, outline: "none",
                }}
              />
            </div>

            {/* Categories */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
                  padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: category === cat.key ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.04)",
                  color: category === cat.key ? "#f59e0b" : "#aaa",
                  whiteSpace: "nowrap",
                }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Games grid */}
            {filteredGames.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#676D7C" }}>
                No games found
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 14,
              }}>
                {filteredGames.map((game, idx) => {
                  const gradients = [
                    "linear-gradient(135deg, #ef4444, #f59e0b)",
                    "linear-gradient(135deg, #8b5cf6, #ec4899)",
                    "linear-gradient(135deg, #3b82f6, #06b6d4)",
                    "linear-gradient(135deg, #10b981, #14b8a6)",
                    "linear-gradient(135deg, #f59e0b, #ef4444)",
                    "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  ];
                  const gradient = gradients[idx % gradients.length];

                  return (
                    <div
                      key={game.id}
                      onClick={() => { setActiveGame(game.id); window.scrollTo({ top: 200, behavior: "smooth" }); }}
                      style={{
                        borderRadius: 10, overflow: "hidden", cursor: "pointer", position: "relative",
                        border: activeGame === game.id ? "2px solid #2563eb" : "2px solid transparent",
                        transition: "transform 0.15s, box-shadow 0.15s",
                        background: "#1a1d2e",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.35)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Poster area with fixed aspect */}
                      <div style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "2 / 3",
                        background: gradient,
                        overflow: "hidden",
                      }}>
                        <img
                          src={POSTER(game.id)}
                          alt={game.name}
                          loading="lazy"
                          style={{
                            width: "100%", height: "100%",
                            objectFit: "cover", display: "block",
                          }}
                          onError={e => { e.target.style.display = "none"; }}
                        />
                        {/* Gradient title overlay (always shown — works as fallback too) */}
                        <div style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 12,
                          background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)",
                          pointerEvents: "none",
                        }}>
                          <span style={{
                            color: "#fff", fontWeight: 800, fontSize: 18,
                            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                            opacity: 0,
                          }}>{game.name.charAt(0)}</span>
                        </div>

                        {game.tags.includes("hot") && (
                          <div style={{
                            position: "absolute", top: 8, left: 8,
                            background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700,
                            padding: "3px 7px", borderRadius: 4, textTransform: "uppercase",
                            letterSpacing: 0.5, boxShadow: "0 2px 6px rgba(239,68,68,0.5)",
                          }}>🔥 Hot</div>
                        )}
                      </div>

                      {/* Title */}
                      <div style={{
                        padding: "10px 8px", background: "rgba(15,17,26,0.95)",
                        fontSize: 12, color: "#fff", textAlign: "center", fontWeight: 600,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {game.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </>
        )}
      </div>
    </StyledPageContainer>
  );
};

export default Slots;
