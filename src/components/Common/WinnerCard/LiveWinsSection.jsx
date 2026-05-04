import React, { useState, useEffect, useRef, useCallback } from "react";
import DOT from "../../../assets/images/Rectangle.png";
import FilterButtonGroup from "../Buttons/FilterButtonGroup";
import WinnerCard from "./WinnerCard";
import { LiveWinsSectionStyled, StyledCardsContainer } from "./styles";
import { useSocket } from "@/context/SocketContext";

import COIN from "../../../assets/images/IMAGE (47).png";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const GAME_EMOJI = {
  crash:    "🚀",
  coinflip: "🪙",
  roulette: "🎡",
  mine:     "💎",
  plinko:   "🔮",
  dice:     "🎲",
  hilo:     "🃏",
  slots:    "🎰",
  blackjack:"♠️",
  jackpot:  "🏆",
};

function formatWin(w) {
  const emoji = w.emoji || GAME_EMOJI[w.game_type] || "🎲";
  const username = w.users?.username || w.username || "Anonymous";
  const profit = parseFloat(w.profit ?? 0).toFixed(2);
  const mult = w.multiplier ? `${parseFloat(w.multiplier).toFixed(2)}×` : null;
  return {
    imgSrc: COIN,
    cartIconSrc: COIN,
    username: `${emoji} ${username}`,
    price: mult ? `$${profit} · ${mult}` : `$${profit}`,
    id: w.id || w.ts || Math.random(),
  };
}

const LiveWinsSection = ({ icon: Icon, title, hasFilters }) => {
  const timeFilterOptions = ["Live", "Day", "Week", "Month"];
  const [activeOption, setActiveOption] = useState("Live");
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const { socket } = useSocket() || {};

  const fetchWins = useCallback(async (filter) => {
    try {
      const param = filter && filter !== "Live" ? `?filter=${filter}` : "";
      const res = await fetch(`${BACKEND}/api/game-history/recent${param}`);
      const json = await res.json();
      if (json.success) setWins(json.wins || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  // Initial load + polling fallback
  useEffect(() => {
    setLoading(true);
    fetchWins(activeOption);

    if (activeOption === "Live") {
      intervalRef.current = setInterval(() => fetchWins("Live"), 8000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeOption, fetchWins]);

  // Real-time socket update — prepend win instantly
  useEffect(() => {
    if (!socket || activeOption !== "Live") return;

    const handler = (win) => {
      setWins(prev => [
        {
          id: win.ts,
          game_type: win.gameType,
          emoji: win.emoji,
          username: win.username,
          profit: win.profit,
          multiplier: win.multiplier,
          bet_amount: win.betAmount,
          created_at: new Date().toISOString(),
        },
        ...prev.slice(0, 24),
      ]);
    };

    socket.on("live:win", handler);
    return () => socket.off("live:win", handler);
  }, [socket, activeOption]);

  const cards = wins.map(formatWin);

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
          <div style={{ color: "#676D7C", padding: "12px 0", fontSize: "14px" }}>No wins yet — be first! 🎲</div>
        ) : (
          cards.map((card) => (
            <WinnerCard
              key={card.id}
              imgSrc={card.imgSrc}
              cartIconSrc={card.cartIconSrc}
              username={card.username}
              price={card.price}
            />
          ))
        )}
      </StyledCardsContainer>
    </>
  );
};

export default LiveWinsSection;
