import React, { useState, useRef, useContext } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const ALL_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];

const PAYTABLE = [
  { symbol: "7️⃣", pay3: "50x" },
  { symbol: "💎", pay3: "25x" },
  { symbol: "⭐", pay3: "15x" },
  { symbol: "🍇", pay3: "8x" },
  { symbol: "🍊", pay3: "5x" },
  { symbol: "🍋", pay3: "3x" },
  { symbol: "🍒", pay3: "2x", pay2: "0.5x" },
];

function ReelColumn({ symbols, spinning, result, delay }) {
  return (
    <div style={{
      width: 90, height: 270, borderRadius: 12, overflow: "hidden",
      background: "rgba(10,12,20,0.8)", border: "2px solid rgba(255,255,255,0.08)",
      position: "relative", display: "flex", flexDirection: "column",
    }}>
      {spinning ? (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          animation: `slotSpin 0.1s linear infinite`,
          display: "flex", flexDirection: "column",
        }}>
          {[...ALL_SYMBOLS, ...ALL_SYMBOLS, ...ALL_SYMBOLS].map((s, i) => (
            <div key={i} style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>{s}</div>
          ))}
        </div>
      ) : (
        (result || ["❓", "❓", "❓"]).map((sym, i) => (
          <div key={i} style={{
            height: 90, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>{sym}</div>
        ))
      )}
    </div>
  );
}

const SlotsGame = () => {
  const { user, updateBalance } = useAuth();
  const [bet, setBet] = useState("1");
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState(null); // 9 symbols flat array
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);

  const handleSpin = async () => {
    if (spinning) return;
    const betAmount = parseFloat(bet);
    if (!betAmount || betAmount <= 0) return toast.error("Invalid bet");
    if (!user?.isAuthenticated) return toast.error("Login to play");

    setSpinning(true);
    setLastResult(null);

    try {
      const res = await fetch(`${BACKEND}/api/slots/spin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount }),
      });
      const data = await res.json();

      // Keep spinning for 1.5s minimum
      await new Promise(r => setTimeout(r, 1500));

      if (!data.success) {
        toast.error(data.error || "Error");
        setSpinning(false);
        return;
      }

      setGrid(data.grid);
      setLastResult(data);
      setSpinning(false);

      if (data.payout > 0) {
        toast.success(`🎰 Won $${data.payout.toFixed(2)} (${data.multiplier}x)!`);
      }

      if (typeof updateBalance === "function") updateBalance(data.balance);

      setHistory(prev => [data, ...prev].slice(0, 10));
    } catch (err) {
      toast.error("Connection error");
      setSpinning(false);
    }
  };

  // Split flat 9-symbol grid into 3 reels of 3 symbols each
  const reels = grid
    ? [[grid[0], grid[3], grid[6]], [grid[1], grid[4], grid[7]], [grid[2], grid[5], grid[8]]]
    : [null, null, null];

  const winLines = lastResult?.winningLines || [];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20, color: "#fff" }}>
      <style>{`
        @keyframes slotSpin {
          0% { transform: translateY(0); }
          100% { transform: translateY(-90px); }
        }
        @keyframes winPulse {
          0%,100% { box-shadow: 0 0 0 rgba(245,158,11,0); }
          50% { box-shadow: 0 0 24px rgba(245,158,11,0.6); }
        }
      `}</style>

      <h2 style={{ textAlign: "center", marginBottom: 8, fontSize: 28, fontWeight: 700 }}>🎰 Slots</h2>
      <p style={{ textAlign: "center", color: "#676D7C", marginBottom: 24, fontSize: 13 }}>5 paylines · Provably Fair</p>

      {/* Reels */}
      <div style={{
        display: "flex", gap: 8, justifyContent: "center", marginBottom: 24,
        padding: 20, borderRadius: 16, background: "rgba(15,17,26,0.8)",
        border: "1px solid rgba(255,255,255,0.07)",
        animation: winLines.length > 0 && !spinning ? "winPulse 1s ease 3" : "none",
      }}>
        {reels.map((reel, i) => (
          <ReelColumn key={i} symbols={ALL_SYMBOLS} spinning={spinning} result={reel} delay={i * 150} />
        ))}
      </div>

      {/* Win display */}
      {lastResult && !spinning && (
        <div style={{
          textAlign: "center", marginBottom: 20, padding: "12px 20px",
          borderRadius: 10, background: lastResult.payout > 0 ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.08)",
          border: `1px solid ${lastResult.payout > 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.2)"}`,
        }}>
          {lastResult.payout > 0 ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#4ade80" }}>+${lastResult.payout.toFixed(2)}</div>
              <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>
                {winLines.map((l, i) => `${l.symbol} ${l.multiplier}x`).join(" · ")}
              </div>
            </>
          ) : (
            <div style={{ color: "#676D7C", fontSize: 16 }}>No win — try again!</div>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", marginBottom: 6 }}>Bet Amount ($)</div>
          <input
            type="number" value={bet} onChange={e => setBet(e.target.value)} min="0.01" step="0.01"
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(15,17,26,0.8)", color: "#fff", fontSize: 16, boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 22 }}>
          {["0.5x", "2x", "Max"].map(label => (
            <button key={label} onClick={() => {
              const v = parseFloat(bet) || 1;
              if (label === "0.5x") setBet((v * 0.5).toFixed(2));
              else if (label === "2x") setBet((v * 2).toFixed(2));
              else setBet("1000");
            }} style={{
              padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "#aaa", fontSize: 11, cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSpin} disabled={spinning}
        style={{
          width: "100%", padding: "16px", borderRadius: 10, border: "none",
          background: spinning ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #f59e0b, #ef4444)",
          color: spinning ? "#676D7C" : "#fff", fontSize: 18, fontWeight: 700,
          cursor: spinning ? "not-allowed" : "pointer", transition: "all 0.2s", marginBottom: 24,
          letterSpacing: 1,
        }}
      >
        {spinning ? "🎰 Spinning..." : "🎰 SPIN"}
      </button>

      {/* Paytable */}
      <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(15,17,26,0.55)", marginBottom: 20 }}>
        <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Paytable</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px 16px" }}>
          {PAYTABLE.map(({ symbol, pay3, pay2 }) => (
            <div key={symbol} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ fontSize: 20 }}>{symbol}</span>
              <span style={{ color: "#fff" }}>×3 = <span style={{ color: "#f59e0b", fontWeight: 600 }}>{pay3}</span></span>
              {pay2 && <span style={{ color: "#676D7C", fontSize: 11 }}>×2 = {pay2}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent Spins</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 14px", borderRadius: 8, background: "rgba(15,17,26,0.55)", fontSize: 13,
              }}>
                <span style={{ letterSpacing: 2 }}>{h.grid?.join(" ")}</span>
                <span style={{ color: h.payout > 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                  {h.payout > 0 ? `+$${h.payout.toFixed(2)}` : `-$${parseFloat(bet).toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotsGame;
