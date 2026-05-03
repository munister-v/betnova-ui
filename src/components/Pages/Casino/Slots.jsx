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
                  <div style={{
                    position: "absolute", top: 8, right: 8, padding: "4px 10px",
                    borderRadius: 6, background: "rgba(0,0,0,0.7)", color: "#facc15", fontSize: 11, fontWeight: 600,
                  }}>DEMO MODE</div>
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
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 12,
              }}>
                {filteredGames.map(game => (
                  <div
                    key={game.id}
                    onClick={() => { setActiveGame(game.id); window.scrollTo({ top: 200, behavior: "smooth" }); }}
                    style={{
                      borderRadius: 10, overflow: "hidden", cursor: "pointer", position: "relative",
                      border: activeGame === game.id ? "2px solid #2563eb" : "2px solid transparent",
                      transition: "transform 0.15s, box-shadow 0.15s",
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
                    <img
                      src={POSTER(game.id)}
                      alt={game.name}
                      style={{ width: "100%", display: "block", aspectRatio: "2/3", objectFit: "cover", background: "#1a1d2e" }}
                      onError={e => {
                        e.target.style.display = "none";
                        e.target.parentElement.style.background = "linear-gradient(135deg, #2563eb, #7c3aed)";
                        e.target.parentElement.style.aspectRatio = "2/3";
                      }}
                    />
                    {game.tags.includes("hot") && (
                      <div style={{
                        position: "absolute", top: 6, left: 6,
                        background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700,
                        padding: "2px 6px", borderRadius: 3, textTransform: "uppercase",
                      }}>🔥 Hot</div>
                    )}
                    <div style={{
                      padding: "8px 8px", background: "rgba(15,17,26,0.95)",
                      fontSize: 11, color: "#fff", textAlign: "center", fontWeight: 500,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {game.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20, padding: 14, borderRadius: 8, background: "rgba(15,17,26,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "#676D7C", fontSize: 12, margin: 0 }}>
                📌 All games shown in <strong style={{ color: "#facc15" }}>demo mode</strong> — wins are not real money.
                Powered by BGaming. Real-money play coming soon!
              </p>
            </div>
          </>
        )}
      </div>
    </StyledPageContainer>
  );
};

export default Slots;
