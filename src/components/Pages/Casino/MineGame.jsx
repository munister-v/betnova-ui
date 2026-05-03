import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { StyledPageContainer } from "./styles";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";
const GRID_SIZE = 25;

function MineGrid({ tiles, onReveal, disabled }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "8px", margin: "16px 0" }}>
      {tiles.map((tile, i) => (
        <button
          key={i}
          onClick={() => !disabled && tile.state === "hidden" && onReveal(i)}
          disabled={disabled || tile.state !== "hidden"}
          style={{
            height: "60px",
            borderRadius: "8px",
            border: "none",
            cursor: tile.state === "hidden" && !disabled ? "pointer" : "default",
            fontSize: "22px",
            fontWeight: 900,
            transition: "all 0.15s",
            background:
              tile.state === "mine"
                ? "rgba(239,68,68,0.3)"
                : tile.state === "safe"
                ? "rgba(74,222,128,0.25)"
                : "rgba(255,255,255,0.06)",
            color:
              tile.state === "mine" ? "#ef4444" : tile.state === "safe" ? "#4ade80" : "#aaa",
            boxShadow:
              tile.state === "safe"
                ? "0 0 8px rgba(74,222,128,0.3)"
                : tile.state === "mine"
                ? "0 0 8px rgba(239,68,68,0.3)"
                : "none",
          }}
        >
          {tile.state === "mine" ? "💣" : tile.state === "safe" ? "💎" : "?"}
        </button>
      ))}
    </div>
  );
}

const MineGame = () => {
  const { user, updateBalance } = useAuth();

  const [betAmount, setBetAmount] = useState("10");
  const [mineCount, setMineCount] = useState(3);
  const [game, setGame] = useState(null); // active game
  const [tiles, setTiles] = useState(Array(GRID_SIZE).fill({ state: "hidden" }));
  const [multiplier, setMultiplier] = useState(1.0);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const toast = useCallback((text, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg(null), 3000);
  }, []);

  // Resume incomplete game on mount
  useEffect(() => {
    if (!user?.isAuthenticated) return;
    fetch(`${BACKEND}/api/mine/incomplete`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.game) {
          const g = json.game;
          setGame(g);
          setMultiplier(parseFloat(g.current_multiplier || 1));
          const newTiles = Array(GRID_SIZE).fill(null).map((_, i) => {
            if (g.revealed_positions?.includes(i)) return { state: "safe" };
            return { state: "hidden" };
          });
          setTiles(newTiles);
          toast("Resumed incomplete game!");
        }
      })
      .catch(() => {});
  }, [user?.isAuthenticated]);

  const startGame = async () => {
    if (!user?.isAuthenticated) return toast("Please log in first.", true);
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) return toast("Invalid bet.", true);
    if (mineCount < 1 || mineCount > 24) return toast("Mines must be 1–24.", true);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/mine/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount: amount, mineCount }),
      });
      const json = await res.json();
      if (json.success) {
        setGame(json.game);
        setTiles(Array(GRID_SIZE).fill({ state: "hidden" }));
        setMultiplier(1.0);
        if (json.balance !== undefined) updateBalance(json.balance);
      } else {
        toast(json.error || "Failed to start.", true);
      }
    } catch (_) {
      toast("Network error.", true);
    }
    setLoading(false);
  };

  const revealTile = async (position) => {
    if (!game) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/mine/${game.id}/reveal`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      const json = await res.json();
      if (json.success) {
        const newTiles = [...tiles];
        newTiles[position] = { state: json.isMine ? "mine" : "safe" };
        if (json.isMine) {
          // Reveal all mines
          (json.minePositions || []).forEach((p) => {
            newTiles[p] = { state: "mine" };
          });
          setGame(null);
          toast(`💥 Hit a mine! Lost $${parseFloat(betAmount).toFixed(2)}`, true);
          if (json.balance !== undefined) updateBalance(json.balance);
        } else {
          setMultiplier(parseFloat(json.multiplier || 1));
          toast(`💎 Safe! Multiplier: ${parseFloat(json.multiplier || 1).toFixed(2)}x`);
        }
        setTiles(newTiles);
      } else {
        toast(json.error || "Failed.", true);
      }
    } catch (_) {
      toast("Network error.", true);
    }
    setLoading(false);
  };

  const cashout = async () => {
    if (!game) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/mine/${game.id}/cashout`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        toast(`💰 Cashed out! Won $${parseFloat(json.profit || 0).toFixed(2)} at ${parseFloat(multiplier).toFixed(2)}x`);
        if (json.balance !== undefined) updateBalance(json.balance);
        setGame(null);
      } else {
        toast(json.error || "Cashout failed.", true);
      }
    } catch (_) {
      toast("Network error.", true);
    }
    setLoading(false);
  };

  const isGameActive = game && game.status === "active";
  const safeRevealed = tiles.filter((t) => t.state === "safe").length;
  const potentialWin = isGameActive
    ? (parseFloat(betAmount) * multiplier).toFixed(2)
    : "0.00";

  return (
    <StyledPageContainer>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 16px" }}>
        <h2 style={{ color: "#fff", fontSize: "24px", marginBottom: "16px" }}>💣 Mines</h2>

        {/* Settings (shown when no active game) */}
        {!isGameActive && (
          <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(15,17,26,0.8)", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: "#aaa", fontSize: "12px", display: "block", marginBottom: "4px" }}>Bet ($)</label>
                <input
                  type="number"
                  value={betAmount}
                  min="0.01"
                  step="any"
                  onChange={(e) => setBetAmount(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: "#aaa", fontSize: "12px", display: "block", marginBottom: "4px" }}>Mines (1–24)</label>
                <input
                  type="number"
                  value={mineCount}
                  min="1"
                  max="24"
                  onChange={(e) => setMineCount(parseInt(e.target.value) || 1)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <button onClick={startGame} disabled={loading}
              style={{ width: "100%", marginTop: "14px", padding: "12px", borderRadius: "8px", background: "#4ade80", color: "#000", fontWeight: 700, fontSize: "16px", cursor: "pointer", border: "none" }}>
              {loading ? "Starting…" : "Start Game"}
            </button>
          </div>
        )}

        {/* Active game info */}
        {isGameActive && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderRadius: "8px", background: "rgba(15,17,26,0.8)", marginBottom: "10px" }}>
            <div>
              <div style={{ color: "#aaa", fontSize: "12px" }}>Multiplier</div>
              <div style={{ color: "#facc15", fontSize: "20px", fontWeight: 900 }}>{parseFloat(multiplier).toFixed(2)}x</div>
            </div>
            <div>
              <div style={{ color: "#aaa", fontSize: "12px" }}>Safe tiles found</div>
              <div style={{ color: "#fff", fontSize: "20px", fontWeight: 900 }}>{safeRevealed}</div>
            </div>
            <div>
              <div style={{ color: "#aaa", fontSize: "12px" }}>Potential win</div>
              <div style={{ color: "#4ade80", fontSize: "20px", fontWeight: 900 }}>${potentialWin}</div>
            </div>
          </div>
        )}

        {/* Grid */}
        <MineGrid
          tiles={tiles}
          onReveal={revealTile}
          disabled={!isGameActive || loading}
        />

        {/* Cashout */}
        {isGameActive && safeRevealed > 0 && (
          <button onClick={cashout} disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: "8px", background: "#facc15", color: "#000", fontWeight: 700, fontSize: "16px", cursor: "pointer", border: "none", marginTop: "4px" }}>
            {loading ? "…" : `💰 Cashout $${potentialWin}`}
          </button>
        )}

        {/* Toast */}
        {msg && (
          <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "8px", background: msg.error ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.15)", color: msg.error ? "#ef4444" : "#4ade80", fontSize: "14px" }}>
            {msg.text}
          </div>
        )}
      </div>
    </StyledPageContainer>
  );
};

export default MineGame;
