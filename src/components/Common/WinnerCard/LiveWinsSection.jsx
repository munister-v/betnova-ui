import React, { useState, useEffect, useRef } from "react";
import DOT from "../../../assets/images/Rectangle.png";
import FilterButtonGroup from "../Buttons/FilterButtonGroup";
import WinnerCard from "./WinnerCard";
import { LiveWinsSectionStyled, StyledCardsContainer } from "./styles";

// Game type → display image (use local assets)
import COIN from "../../../assets/images/IMAGE (47).png";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";
const GAME_ICONS = {
  crash: "🚀",
  coinflip: "🪙",
  roulette: "🎰",
  mine: "💣",
};

const LiveWinsSection = ({ icon: Icon, title, hasFilters }) => {
  const timeFilterOptions = ["Live", "Day", "Week", "Month"];
  const [activeOption, setActiveOption] = useState("Live");
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchWins = async (filter) => {
    try {
      const param = filter !== "Live" ? `?filter=${filter}` : "";
      const res = await fetch(`${BACKEND}/api/game-history/recent${param}`);
      const json = await res.json();
      if (json.success) setWins(json.wins || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchWins(activeOption);

    // Auto-refresh every 5s in Live mode
    if (activeOption === "Live") {
      intervalRef.current = setInterval(() => fetchWins("Live"), 5000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeOption]);

  const cards = wins.map((w) => ({
    imgSrc: COIN,
    cartIconSrc: COIN,
    username: w.users?.username || "Anonymous",
    price: parseFloat(w.profit).toFixed(2),
    game: GAME_ICONS[w.game_type] || "🎲",
    multiplier: w.multiplier ? `${parseFloat(w.multiplier).toFixed(2)}x` : null,
  }));

  return (
    <>
      <LiveWinsSectionStyled>
        <div className="dot-section">
          {hasFilters ? (
            <img src={DOT} alt="dot" className="dot-icon" />
          ) : (
            Icon && <Icon className="wins-icon" />
          )}
          {title && <span className="live-wins-text uppercase">{title}</span>}
        </div>

        {hasFilters && (
          <FilterButtonGroup
            options={timeFilterOptions}
            onOptionChange={setActiveOption}
          />
        )}
      </LiveWinsSectionStyled>

      <StyledCardsContainer>
        {loading ? (
          <div style={{ color: "#676D7C", padding: "12px 0", fontSize: "14px" }}>Loading…</div>
        ) : cards.length === 0 ? (
          <div style={{ color: "#676D7C", padding: "12px 0", fontSize: "14px" }}>No wins yet</div>
        ) : (
          cards.map((card, index) => (
            <WinnerCard
              key={index}
              imgSrc={card.imgSrc}
              cartIconSrc={card.cartIconSrc}
              username={`${card.game} ${card.username}`}
              price={card.multiplier ? `${card.price} (${card.multiplier})` : card.price}
            />
          ))
        )}
      </StyledCardsContainer>
    </>
  );
};

export default LiveWinsSection;
