import React, { useEffect, useRef, useState, useCallback } from "react";
import { ReactComponent as IMG1 } from "../../../assets/images/Frame (28).svg";
import SectionHeader from "../../Common/SectionHeader/SectionHeader";
import GameInfoItem from "../../Common/TableView/GameInfoItem";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const GAME_LABELS = { crash: "Crash", coinflip: "Coinflip", roulette: "Roulette", mine: "Mines" };

const TableView = () => {
  const filterOptions = ["All Bets", "High Rollers", "Lucky Bets"];
  const [activeOption, setActiveOption] = useState(filterOptions[0]);
  const [bets, setBets] = useState([]);
  const tableContainerRef = useRef(null);
  const animRef = useRef(null);
  const scrollSpeed = 0.5;

  const fetchBets = useCallback(async () => {
    try {
      let url = `${BACKEND}/api/game-history/recent?limit=20`;
      if (activeOption === "High Rollers") url += "&minBet=100";
      if (activeOption === "Lucky Bets") url += "&minMultiplier=5";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.wins) setBets(json.wins);
    } catch (_) {}
  }, [activeOption]);

  useEffect(() => {
    fetchBets();
    const interval = setInterval(fetchBets, 8000);
    return () => clearInterval(interval);
  }, [fetchBets]);

  // Auto-scroll
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const scroll = () => {
      container.scrollTop -= scrollSpeed;
      if (container.scrollTop <= 0) container.scrollTop = container.scrollHeight;
      animRef.current = requestAnimationFrame(scroll);
    };

    animRef.current = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animRef.current);
  }, [bets]);

  // Fallback placeholder rows when no real data yet
  const rows = bets.length > 0
    ? bets
    : Array(8).fill({ game_type: "crash", users: { username: "—" }, bet_amount: "0", multiplier: "0", profit: "0", created_at: new Date().toISOString() });

  return (
    <div className="container" style={{ display: "flex" }}>
      <div className="row">
        <SectionHeader
          iconHeader={IMG1}
          casinoText="BETS"
          hasArrows={false}
          hasFilterOptions={true}
          onOptionChange={setActiveOption}
          filterOptions={filterOptions}
        />

        {/* Column headers */}
        <div
          style={{
            color: "#686D7B",
            display: "flex",
            padding: "20px 20px",
            alignItems: "flex-start",
            justifyContent: "space-between",
            fontSize: "12px",
          }}
        >
          <div style={{ flex: 1 }}>Game</div>
          <div style={{ flex: 1 }}>Player</div>
          <div style={{ flex: 1, textAlign: "right" }}>Bet</div>
          <div style={{ flex: 1, textAlign: "right" }}>Multiplier</div>
          <div style={{ flex: 1, textAlign: "right" }}>Payout</div>
        </div>

        {/* Scrolling table */}
        <div
          ref={tableContainerRef}
          style={{ height: "220px", overflowY: "hidden" }}
        >
          {rows.map((item, index) => (
            <GameInfoItem
              key={index}
              index={index}
              uniqueKey={index}
              gameInfo={{
                name: GAME_LABELS[item.game_type] || item.game_type || "—",
                player: item.users?.username || "Anonymous",
                time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
                bet: parseFloat(item.bet_amount || 0).toFixed(2),
                multiplier: item.multiplier ? parseFloat(item.multiplier).toFixed(2) : "—",
                payout: parseFloat(item.profit || 0) > 0 ? `+${parseFloat(item.profit).toFixed(2)}` : parseFloat(item.profit || 0).toFixed(2),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableView;
