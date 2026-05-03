import React, { useState } from "react";
import LiveWinsSection from "../../Common/WinnerCard/LiveWinsSection";
import NavigationHeader from "../../Common/NavigationHeader/NavigationHeader";
import { StyledPageContainer } from "./styles";
import SlotsGame from "./SlotsGame";

const BGAMING_GAMES = [
  { id: "BookOfSuns", name: "Book of Suns", img: "https://static.bgaming-network.com/games/BookOfSuns/en/poster_2x3.jpg" },
  { id: "LuckyOak", name: "Lucky Oak", img: "https://static.bgaming-network.com/games/LuckyOak/en/poster_2x3.jpg" },
  { id: "JokerQueen", name: "Joker Queen", img: "https://static.bgaming-network.com/games/JokerQueen/en/poster_2x3.jpg" },
  { id: "CandyMonsta", name: "Candy Monsta", img: "https://static.bgaming-network.com/games/CandyMonsta/en/poster_2x3.jpg" },
  { id: "ElvisFrogInVegas", name: "Elvis Frog", img: "https://static.bgaming-network.com/games/ElvisFrogInVegas/en/poster_2x3.jpg" },
  { id: "BonanzaBillion", name: "Bonanza Billion", img: "https://static.bgaming-network.com/games/BonanzaBillion/en/poster_2x3.jpg" },
  { id: "DragonsMoney", name: "Dragons Money", img: "https://static.bgaming-network.com/games/DragonsMoney/en/poster_2x3.jpg" },
  { id: "SpinAndSpell", name: "Spin&Spell", img: "https://static.bgaming-network.com/games/SpinAndSpell/en/poster_2x3.jpg" },
  { id: "SweetSuccess", name: "Sweet Success", img: "https://static.bgaming-network.com/games/SweetSuccess/en/poster_2x3.jpg" },
  { id: "PiggyRich", name: "Piggy Rich", img: "https://static.bgaming-network.com/games/PiggyRich/en/poster_2x3.jpg" },
];

const Slots = () => {
  const [activeTab, setActiveTab] = useState("betnova");
  const [activeGame, setActiveGame] = useState(BGAMING_GAMES[0].id);
  const [iframeError, setIframeError] = useState(false);

  return (
    <StyledPageContainer>
      <LiveWinsSection title="Live wins" hasFilters={true} />
      <NavigationHeader isNftPage={false} />

      <div className="content-container">
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[["betnova", "🎰 BetNova Slots"], ["bgaming", "🎮 BGaming Demo"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              background: activeTab === key ? "#2563eb" : "rgba(255,255,255,0.05)",
              color: activeTab === key ? "#fff" : "#676D7C",
            }}>{label}</button>
          ))}
        </div>

        {activeTab === "betnova" && <SlotsGame />}

        {activeTab === "bgaming" && (
          <div>
            <div style={{
              width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden",
              background: "#000", marginBottom: 20, border: "1px solid rgba(255,255,255,0.07)", position: "relative",
            }}>
              {!iframeError ? (
                <iframe
                  key={activeGame}
                  src={`https://demo.bgaming-network.com/games/${activeGame}/index.html?currency=USD&bet_size=1`}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title={activeGame}
                  allow="autoplay"
                  onError={() => setIframeError(true)}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#676D7C" }}>
                  Demo unavailable for this game
                </div>
              )}
              <div style={{
                position: "absolute", top: 8, right: 8, padding: "4px 10px",
                borderRadius: 6, background: "rgba(0,0,0,0.7)", color: "#facc15", fontSize: 11,
              }}>DEMO MODE</div>
            </div>

            <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Select Game
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
              {BGAMING_GAMES.map(game => (
                <div key={game.id} onClick={() => { setActiveGame(game.id); setIframeError(false); }} style={{
                  borderRadius: 10, overflow: "hidden", cursor: "pointer",
                  border: activeGame === game.id ? "2px solid #2563eb" : "2px solid transparent",
                  transition: "border 0.15s",
                }}>
                  <img src={game.img} alt={game.name} style={{ width: "100%", display: "block" }}
                    onError={e => { e.target.style.background = "#1a1d2e"; e.target.style.height = "80px"; }} />
                  <div style={{ padding: "6px 8px", background: "rgba(15,17,26,0.9)", fontSize: 11, color: "#aaa", textAlign: "center" }}>
                    {game.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StyledPageContainer>
  );
};

export default Slots;
