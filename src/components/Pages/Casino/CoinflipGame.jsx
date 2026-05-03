import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { connectWebSocket, onSocketEvent, offSocketEvent, emitSocketEvent } from "@/lib/websocket";
import { StyledPageContainer } from "./styles";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

function CoinFlip({ result, animating }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
      <div style={{
        width: "80px", height: "80px", borderRadius: "50%",
        background: animating ? "linear-gradient(135deg,#facc15,#f59e0b)" : result === "heads" ? "#facc15" : "#94a3b8",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "32px", fontWeight: 900, color: "#000",
        boxShadow: "0 0 24px rgba(250,204,21,0.3)",
        transition: "background 0.5s",
        animation: animating ? "spin 0.6s infinite linear" : "none",
      }}>
        {animating ? "⚡" : result === "heads" ? "H" : result === "tails" ? "T" : "?"}
      </div>
      <style>{`@keyframes spin { to { transform: rotateY(360deg); } }`}</style>
    </div>
  );
}

const CoinflipGame = () => {
  const { user, updateBalance } = useAuth();

  const [games, setGames] = useState([]);
  const [betAmount, setBetAmount] = useState("10");
  const [side, setSide] = useState("heads");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(null); // gameId being animated

  const toast = useCallback((text, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg(null), 3000);
  }, []);

  useEffect(() => {
    connectWebSocket().catch(() => {});
    emitSocketEvent("join:game", { gameType: "coinflip" });

    const onNew = (game) => setGames((prev) => [game, ...prev].slice(0, 20));
    const onJoined = (game) => setGames((prev) => prev.map((g) => g.id === game.id ? { ...g, ...game } : g));
    const onResult = (data) => {
      setAnimating(data.game_id);
      setTimeout(() => {
        setAnimating(null);
        setGames((prev) => prev.map((g) => g.id === data.game_id ? { ...g, ...data, status: "completed" } : g));
        if (data.winner_id === user?.id) {
          toast(`🎉 You won $${data.profit?.toFixed(2)}!`);
          if (data.balance !== undefined) updateBalance(data.balance);
        }
      }, 1200);
    };

    onSocketEvent("coinflip:new", onNew);
    onSocketEvent("coinflip:joined", onJoined);
    onSocketEvent("coinflip:result", onResult);

    // Load open games
    fetch(`${BACKEND}/api/coinflip/games`)
      .then((r) => r.json())
      .then((j) => j.success && setGames(j.games || []));

    return () => {
      emitSocketEvent("leave:game", { gameType: "coinflip" });
      offSocketEvent("coinflip:new", onNew);
      offSocketEvent("coinflip:joined", onJoined);
      offSocketEvent("coinflip:result", onResult);
    };
  }, []);

  const createGame = async () => {
    if (!user?.isAuthenticated) return toast("Please log in first.", true);
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) return toast("Invalid bet.", true);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/coinflip/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, side }),
      });
      const json = await res.json();
      if (json.success) {
        setGames((prev) => [json.game, ...prev]);
        if (json.balance !== undefined) updateBalance(json.balance);
        toast("✅ Game created! Waiting for opponent…");
      } else {
        toast(json.error || "Failed.", true);
      }
    } catch (_) {
      toast("Network error.", true);
    }
    setLoading(false);
  };

  const joinGame = async (gameId) => {
    if (!user?.isAuthenticated) return toast("Please log in first.", true);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/coinflip/game/${gameId}/join`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        if (json.balance !== undefined) updateBalance(json.balance);
        toast("✅ Joined game!");
      } else {
        toast(json.error || "Failed.", true);
      }
    } catch (_) {
      toast("Network error.", true);
    }
    setLoading(false);
  };

  const cancelGame = async (gameId) => {
    try {
      const res = await fetch(`${BACKEND}/api/coinflip/game/${gameId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setGames((prev) => prev.filter((g) => g.id !== gameId));
        if (json.balance !== undefined) updateBalance(json.balance);
      } else {
        toast(json.error || "Failed.", true);
      }
    } catch (_) {
      toast("Network error.", true);
    }
  };

  return (
    <StyledPageContainer>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
        <h2 style={{ color: "#fff", fontSize: "24px", marginBottom: "16px" }}>🪙 Coinflip</h2>

        {/* Create game panel */}
        <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(15,17,26,0.8)", marginBottom: "20px" }}>
          <h3 style={{ color: "#fff", marginBottom: "14px" }}>Create Game</h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ color: "#aaa", fontSize: "12px", display: "block", marginBottom: "4px" }}>Amount ($)</label>
              <input
                type="number"
                value={betAmount}
                min="0.01"
                step="any"
                onChange={(e) => setBetAmount(e.target.value)}
                style={{ width: "120px", padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ color: "#aaa", fontSize: "12px", display: "block", marginBottom: "4px" }}>Side</label>
              <div style={{ display: "flex", gap: "6px" }}>
                {["heads", "tails"].map((s) => (
                  <button key={s} onClick={() => setSide(s)}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "14px", background: side === s ? "#facc15" : "rgba(255,255,255,0.05)", color: side === s ? "#000" : "#aaa" }}>
                    {s === "heads" ? "H" : "T"} {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createGame} disabled={loading}
              style={{ padding: "10px 24px", borderRadius: "8px", background: "#4ade80", color: "#000", fontWeight: 700, fontSize: "15px", cursor: "pointer", border: "none" }}>
              {loading ? "…" : "Create"}
            </button>
          </div>
          {msg && (
            <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "6px", background: msg.error ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.15)", color: msg.error ? "#ef4444" : "#4ade80", fontSize: "13px" }}>
              {msg.text}
            </div>
          )}
        </div>

        {/* Games list */}
        <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(15,17,26,0.8)" }}>
          <h3 style={{ color: "#fff", marginBottom: "14px" }}>Open Games</h3>
          {games.filter((g) => g.status !== "cancelled").length === 0 && (
            <p style={{ color: "#676D7C", fontSize: "13px" }}>No open games</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {games
              .filter((g) => g.status !== "cancelled")
              .map((g) => (
                <div key={g.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.04)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: animating === g.id ? "#facc15" : g.status === "completed" ? (g.result_side === "heads" ? "#facc15" : "#94a3b8") : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "14px", color: "#000", transition: "all 0.5s" }}>
                      {animating === g.id ? "⚡" : g.status === "completed" ? (g.result_side === "heads" ? "H" : "T") : g.creator_side === "heads" ? "H" : "T"}
                    </div>
                    <div>
                      <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>${parseFloat(g.bet_amount).toFixed(2)}</div>
                      <div style={{ color: "#aaa", fontSize: "12px" }}>{g.creator?.username || "Anonymous"} vs {g.joiner?.username || "?"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {g.status === "completed" && (
                      <span style={{ fontSize: "12px", color: "#4ade80" }}>
                        {g.result_side?.toUpperCase()} won
                      </span>
                    )}
                    {g.status === "waiting" && g.creator_id !== user?.id && (
                      <button onClick={() => joinGame(g.id)} disabled={loading}
                        style={{ padding: "6px 16px", borderRadius: "6px", background: "#4ade80", color: "#000", fontWeight: 700, fontSize: "13px", cursor: "pointer", border: "none" }}>
                        Join
                      </button>
                    )}
                    {g.status === "waiting" && g.creator_id === user?.id && (
                      <button onClick={() => cancelGame(g.id)}
                        style={{ padding: "6px 16px", borderRadius: "6px", background: "rgba(239,68,68,0.2)", color: "#ef4444", fontWeight: 700, fontSize: "13px", cursor: "pointer", border: "none" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </StyledPageContainer>
  );
};

export default CoinflipGame;
