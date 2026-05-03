import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { StyledPageContainer } from "./styles";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const BLACK_NUMBERS = new Set([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]);

const BET_TYPES = [
  { label: "Red",    key: "red",    payout: "2x", color: "#ef4444" },
  { label: "Black",  key: "black",  payout: "2x", color: "#1f2937" },
  { label: "Green",  key: "0",      payout: "36x",color: "#22c55e" },
  { label: "Odd",    key: "odd",    payout: "2x", color: "#8b5cf6" },
  { label: "Even",   key: "even",   payout: "2x", color: "#8b5cf6" },
  { label: "1–18",   key: "1-18",   payout: "2x", color: "#0ea5e9" },
  { label: "19–36",  key: "19-36",  payout: "2x", color: "#0ea5e9" },
  { label: "1st 12", key: "1st12",  payout: "3x", color: "#f59e0b" },
  { label: "2nd 12", key: "2nd12",  payout: "3x", color: "#f59e0b" },
  { label: "3rd 12", key: "3rd12",  payout: "3x", color: "#f59e0b" },
];

function numberColor(n) {
  if (n === 0) return "#22c55e";
  if (RED_NUMBERS.has(n)) return "#ef4444";
  return "#1f2937";
}

function RouletteWheel({ result, spinning }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "20px 0" }}>
      <div style={{
        width: "120px", height: "120px", borderRadius: "50%",
        border: "4px solid rgba(255,255,255,0.15)",
        background: spinning
          ? "conic-gradient(#ef4444, #1f2937, #22c55e, #ef4444)"
          : result !== null
          ? numberColor(result)
          : "rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "40px", fontWeight: 900, color: "#fff",
        animation: spinning ? "spin 0.8s linear infinite" : "none",
        transition: "background 0.5s",
        boxShadow: result !== null && !spinning ? `0 0 32px ${numberColor(result)}66` : "none",
      }}>
        {spinning ? "🎰" : result !== null ? result : "?"}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function NumberHistory({ history }) {
  if (!history.length) return null;
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginBottom: "16px" }}>
      {history.map((n, i) => (
        <span key={i} style={{
          width: "28px", height: "28px", borderRadius: "50%",
          background: numberColor(n), display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: 700, color: "#fff",
        }}>{n}</span>
      ))}
    </div>
  );
}

const RouletteGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState("10");
  const [selectedBet, setSelectedBet] = useState("red");
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState([]);
  const [myBets, setMyBets] = useState([]); // bets this round
  const [gameStatus, setGameStatus] = useState("idle"); // idle | betting | spinning | result
  const [countdown, setCountdown] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const toast = useCallback((text, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg(null), 3000);
  }, []);

  // Load history on mount
  useEffect(() => {
    fetch(`${BACKEND}/api/roulette/history?limit=15`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.games) {
          setHistory(json.games.filter((g) => g.result_number !== null).map((g) => g.result_number));
        }
      })
      .catch(() => {});
  }, []);

  // Poll current game status every 2s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/roulette/current`);
        const json = await res.json();
        if (json.success && json.game) {
          const g = json.game;
          if (g.status === "betting") {
            setGameStatus("betting");
            setSpinning(false);
            const closes = new Date(g.betting_closes_at).getTime();
            const left = Math.max(0, Math.round((closes - Date.now()) / 1000));
            setCountdown(left);
          } else if (g.status === "spinning") {
            setGameStatus("spinning");
            setSpinning(true);
            setCountdown(null);
          } else if (g.status === "completed" && g.result_number !== null) {
            setSpinning(false);
            setResult(g.result_number);
            setGameStatus("result");
          }
        } else {
          setGameStatus("idle");
          setSpinning(false);
        }
      } catch (_) {}
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  // Countdown tick
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    timerRef.current = setTimeout(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  const placeBet = async () => {
    if (!user?.isAuthenticated) return toast("Please log in first.", true);
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) return toast("Invalid bet amount.", true);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/roulette/bet`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount: amount, betType: selectedBet }),
      });
      const json = await res.json();
      if (json.success) {
        setMyBets((prev) => [...prev, { betType: selectedBet, betAmount: amount }]);
        if (json.balance !== undefined) updateBalance(json.balance);
        toast(`✅ Bet placed on ${selectedBet}!`);
        // Handle instant result (single-player mode)
        if (json.result !== undefined) {
          setSpinning(true);
          setTimeout(() => {
            setSpinning(false);
            setResult(json.result);
            setHistory((prev) => [json.result, ...prev].slice(0, 15));
            setMyBets([]);
            if (json.profit > 0) {
              toast(`🎉 Won $${json.profit.toFixed(2)}! Number: ${json.result}`);
            } else {
              toast(`💥 Lost. Number was ${json.result}`, true);
            }
            if (json.balance !== undefined) updateBalance(json.balance);
          }, 2000);
        }
      } else {
        toast(json.error || "Failed to place bet.", true);
      }
    } catch (_) {
      toast("Network error.", true);
    }
    setLoading(false);
  };

  const betColor = BET_TYPES.find((b) => b.key === selectedBet)?.color || "#fff";

  return (
    <StyledPageContainer>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px 16px" }}>
        <h2 style={{ color: "#fff", fontSize: "24px", marginBottom: "8px" }}>🎰 Roulette</h2>

        {/* Status bar */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
          <span style={{
            padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
            background: gameStatus === "betting" ? "rgba(74,222,128,0.15)" : gameStatus === "spinning" ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.05)",
            color: gameStatus === "betting" ? "#4ade80" : gameStatus === "spinning" ? "#facc15" : "#aaa",
          }}>
            {gameStatus === "betting" ? "🟢 Bets Open" : gameStatus === "spinning" ? "🌀 Spinning" : gameStatus === "result" ? "✅ Result" : "⏳ Waiting"}
          </span>
          {countdown !== null && countdown > 0 && (
            <span style={{ color: countdown <= 5 ? "#ef4444" : "#facc15", fontWeight: 700, fontSize: "18px" }}>
              {countdown}s
            </span>
          )}
        </div>

        {/* Wheel + history */}
        <NumberHistory history={history} />
        <RouletteWheel result={result} spinning={spinning} />

        {/* Bet panel */}
        <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(15,17,26,0.8)", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#aaa", fontSize: "12px", display: "block", marginBottom: "4px" }}>Bet Amount ($)</label>
              <div style={{ display: "flex", gap: "4px" }}>
                <input
                  type="number"
                  value={betAmount}
                  min="0.01"
                  step="any"
                  onChange={(e) => setBetAmount(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px" }}
                />
                {[5, 10, 50, 100].map((v) => (
                  <button key={v} onClick={() => setBetAmount(String(v))}
                    style={{ padding: "8px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", cursor: "pointer", fontSize: "12px" }}>
                    ${v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bet type grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px", marginBottom: "14px" }}>
            {BET_TYPES.map((bt) => (
              <button key={bt.key} onClick={() => setSelectedBet(bt.key)}
                style={{
                  padding: "10px 6px", borderRadius: "6px", border: selectedBet === bt.key ? "2px solid #facc15" : "2px solid transparent",
                  background: bt.color === "#1f2937" ? "#1f2937" : bt.color + "33",
                  color: "#fff", cursor: "pointer", fontWeight: selectedBet === bt.key ? 700 : 400,
                  fontSize: "12px", textAlign: "center",
                }}>
                <div>{bt.label}</div>
                <div style={{ fontSize: "10px", color: "#facc15", marginTop: "2px" }}>{bt.payout}</div>
              </button>
            ))}
          </div>

          <button
            onClick={placeBet}
            disabled={loading || spinning}
            style={{
              width: "100%", padding: "12px", borderRadius: "8px",
              background: loading || spinning ? "rgba(255,255,255,0.1)" : betColor,
              color: betColor === "#1f2937" || betColor === "#8b5cf6" || betColor === "#0ea5e9" || betColor === "#f59e0b" ? "#fff" : "#000",
              fontWeight: 700, fontSize: "16px", cursor: loading || spinning ? "not-allowed" : "pointer",
              border: "none", opacity: loading || spinning ? 0.6 : 1,
            }}
          >
            {loading ? "Placing…" : spinning ? "Spinning…" : `Bet $${betAmount} on ${BET_TYPES.find(b=>b.key===selectedBet)?.label || selectedBet}`}
          </button>

          {msg && (
            <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "6px", background: msg.error ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.15)", color: msg.error ? "#ef4444" : "#4ade80", fontSize: "13px" }}>
              {msg.text}
            </div>
          )}
        </div>

        {/* Active bets this round */}
        {myBets.length > 0 && (
          <div style={{ padding: "14px 16px", borderRadius: "8px", background: "rgba(15,17,26,0.8)" }}>
            <h4 style={{ color: "#fff", marginBottom: "8px", fontSize: "14px" }}>My bets this round</h4>
            {myBets.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#aaa", marginBottom: "4px" }}>
                <span>{b.betType}</span>
                <span style={{ color: "#fff" }}>${b.betAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </StyledPageContainer>
  );
};

export default RouletteGame;
