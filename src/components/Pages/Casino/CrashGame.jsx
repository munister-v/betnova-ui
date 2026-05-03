import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { connectWebSocket, onSocketEvent, offSocketEvent, emitSocketEvent } from "@/lib/websocket";
import { StyledPageContainer } from "./styles";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

// ── helpers ───────────────────────────────────────────────────────────────────
function MultiplierDisplay({ multiplier, status }) {
  const color =
    status === "crashed" ? "#ef4444" : status === "running" ? "#4ade80" : "#facc15";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "200px",
        borderRadius: "12px",
        background: "rgba(15,17,26,0.8)",
        fontSize: "64px",
        fontWeight: 900,
        color,
        letterSpacing: "-2px",
        transition: "color 0.2s",
        marginBottom: "16px",
        border: `2px solid ${color}33`,
      }}
    >
      {status === "waiting"
        ? "🚀 Waiting…"
        : status === "crashed"
        ? `💥 ${parseFloat(multiplier).toFixed(2)}x`
        : `${parseFloat(multiplier).toFixed(2)}x`}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
const CrashGame = () => {
  const { user, updateBalance } = useAuth();

  const [gameState, setGameState] = useState({ status: "waiting", multiplier: 1.0, gameId: null });
  const [betAmount, setBetAmount] = useState("10");
  const [autoCashout, setAutoCashout] = useState("");
  const [myBet, setMyBet] = useState(null); // { betId, amount, status }
  const [bets, setBets] = useState([]);
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // toast helper
  const toast = useCallback((text, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg(null), 3000);
  }, []);

  // ── socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    connectWebSocket().catch(() => {});
    emitSocketEvent("join:game", { gameType: "crash" });

    const onWaiting = (data) => {
      setGameState({ status: "waiting", multiplier: 1.0, gameId: data.gameId });
      setMyBet(null);
      setBets([]);
    };
    const onStarted = (data) => {
      setGameState((prev) => ({ ...prev, status: "running", gameId: data.gameId }));
    };
    const onTick = (data) => {
      setGameState((prev) => ({ ...prev, multiplier: data.multiplier, status: "running" }));
    };
    const onCrashed = (data) => {
      setGameState((prev) => ({ ...prev, status: "crashed", multiplier: data.multiplier }));
      setHistory((prev) => [{ crash_multiplier: data.multiplier }, ...prev].slice(0, 20));
      setMyBet((b) => b && b.status === "active" ? { ...b, status: "lost" } : b);
    };

    onSocketEvent("crash:waiting", onWaiting);
    onSocketEvent("crash:started", onStarted);
    onSocketEvent("crash:tick", onTick);
    onSocketEvent("crash:crashed", onCrashed);

    // Load recent history
    fetch(`${BACKEND}/api/crash/history?limit=10`)
      .then((r) => r.json())
      .then((j) => j.success && setHistory(j.games || []));

    // Load current game state
    fetch(`${BACKEND}/api/crash/current`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.game) {
          setGameState({ status: j.game.status, multiplier: j.game.multiplier || 1.0, gameId: j.game.id });
          setBets(j.bets || []);
        }
      });

    return () => {
      emitSocketEvent("leave:game", { gameType: "crash" });
      offSocketEvent("crash:waiting", onWaiting);
      offSocketEvent("crash:started", onStarted);
      offSocketEvent("crash:tick", onTick);
      offSocketEvent("crash:crashed", onCrashed);
    };
  }, []);

  // ── actions ───────────────────────────────────────────────────────────────
  const placeBet = async () => {
    if (!user?.isAuthenticated) return toast("Please log in first.", true);
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) return toast("Invalid bet amount.", true);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/crash/bet`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, autoCashout: autoCashout ? parseFloat(autoCashout) : null }),
      });
      const json = await res.json();
      if (json.success) {
        setMyBet({ betId: json.betId, amount, status: "active" });
        if (json.balance !== undefined) updateBalance(json.balance);
        toast("✅ Bet placed!");
      } else {
        toast(json.error || "Failed to place bet.", true);
      }
    } catch (_) {
      toast("Network error.", true);
    }
    setLoading(false);
  };

  const cashout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/crash/cashout`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!json.success) toast(json.error || "Cashout failed.", true);
    } catch (_) {
      toast("Network error.", true);
    }
    setLoading(false);
  };

  const canBet = gameState.status === "waiting" && !myBet;
  const canCashout = gameState.status === "running" && myBet?.status === "active";

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <StyledPageContainer>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
        <h2 style={{ color: "#fff", fontSize: "24px", marginBottom: "16px" }}>🚀 Crash</h2>

        {/* Multiplier display */}
        <MultiplierDisplay multiplier={gameState.multiplier} status={gameState.status} />

        {/* History chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
          {history.map((h, i) => (
            <span
              key={i}
              style={{
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                background: parseFloat(h.crash_multiplier || h.crashMultiplier) < 2 ? "rgba(239,68,68,0.2)" : "rgba(74,222,128,0.2)",
                color: parseFloat(h.crash_multiplier || h.crashMultiplier) < 2 ? "#ef4444" : "#4ade80",
              }}
            >
              {parseFloat(h.crash_multiplier || h.crashMultiplier).toFixed(2)}x
            </span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Bet panel */}
          <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(15,17,26,0.8)" }}>
            <h3 style={{ color: "#fff", marginBottom: "12px" }}>Place Bet</h3>

            <label style={{ color: "#aaa", fontSize: "12px" }}>Bet Amount ($)</label>
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px", marginTop: "4px" }}>
              <input
                type="number"
                value={betAmount}
                min="0.01"
                step="any"
                onChange={(e) => setBetAmount(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px" }}
              />
              {[10, 50, 100].map((v) => (
                <button key={v} onClick={() => setBetAmount(String(v))}
                  style={{ padding: "8px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", cursor: "pointer", fontSize: "12px" }}>
                  ${v}
                </button>
              ))}
            </div>

            <label style={{ color: "#aaa", fontSize: "12px" }}>Auto Cashout (optional)</label>
            <input
              type="number"
              placeholder="e.g. 2.00"
              value={autoCashout}
              min="1.01"
              step="0.01"
              onChange={(e) => setAutoCashout(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px", marginTop: "4px", marginBottom: "14px", boxSizing: "border-box" }}
            />

            {canBet && (
              <button
                onClick={placeBet}
                disabled={loading}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#4ade80", color: "#000", fontWeight: 700, fontSize: "16px", cursor: "pointer", border: "none" }}
              >
                {loading ? "Placing…" : `Bet $${betAmount}`}
              </button>
            )}

            {canCashout && (
              <button
                onClick={cashout}
                disabled={loading}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#facc15", color: "#000", fontWeight: 700, fontSize: "16px", cursor: "pointer", border: "none" }}
              >
                {loading ? "…" : `💰 Cashout @ ${parseFloat(gameState.multiplier).toFixed(2)}x`}
              </button>
            )}

            {myBet?.status === "cashed_out" && (
              <div style={{ textAlign: "center", padding: "12px", color: "#4ade80", fontWeight: 700 }}>
                ✅ Cashed out at {myBet.cashout_multiplier}x
              </div>
            )}
            {myBet?.status === "lost" && (
              <div style={{ textAlign: "center", padding: "12px", color: "#ef4444", fontWeight: 700 }}>
                💥 Lost ${myBet.amount?.toFixed(2)}
              </div>
            )}

            {gameState.status === "running" && !myBet && (
              <div style={{ textAlign: "center", padding: "12px", color: "#aaa", fontSize: "13px" }}>
                Wait for next round to bet
              </div>
            )}

            {msg && (
              <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "6px", background: msg.error ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.15)", color: msg.error ? "#ef4444" : "#4ade80", fontSize: "13px" }}>
                {msg.text}
              </div>
            )}
          </div>

          {/* Active bets */}
          <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(15,17,26,0.8)" }}>
            <h3 style={{ color: "#fff", marginBottom: "12px" }}>Active Bets ({bets.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "280px", overflowY: "auto" }}>
              {bets.length === 0 && <p style={{ color: "#676D7C", fontSize: "13px" }}>No bets yet</p>}
              {bets.map((b) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.04)", fontSize: "13px" }}>
                  <span style={{ color: "#fff" }}>{b.users?.username || b.user_id?.slice(0, 8)}</span>
                  <span style={{ color: b.status === "cashed_out" ? "#4ade80" : b.status === "lost" ? "#ef4444" : "#facc15" }}>
                    ${parseFloat(b.bet_amount).toFixed(2)}
                    {b.cashout_multiplier && ` @ ${b.cashout_multiplier}x`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StyledPageContainer>
  );
};

export default CrashGame;
