import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/utils/toastUtils";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";
const TOTAL = 40;
const DRAWN = 20;

const PAYOUTS = {
  1:  [0, 3.8],
  2:  [0, 0, 7],
  3:  [0, 0, 2, 27],
  4:  [0, 0, 1.4, 5, 80],
  5:  [0, 0, 1.2, 3, 20, 300],
  6:  [0, 0, 1, 2, 8, 100, 1500],
  7:  [0, 0, 0.5, 1.5, 5, 30, 500, 5000],
  8:  [0, 0, 0.5, 1.2, 3, 15, 100, 1000, 10000],
  9:  [0, 0, 0.5, 1, 2, 8, 50, 300, 3000, 30000],
  10: [0, 0, 0.5, 1, 1.5, 5, 20, 100, 1000, 10000, 100000],
};

function multColor(m) {
  if (m >= 1000) return "#ff3860";
  if (m >= 100)  return "#f59e0b";
  if (m >= 10)   return "#a78bfa";
  if (m >= 2)    return "#60a5fa";
  if (m >= 1)    return "#4ade80";
  return "#333";
}

function NumberBall({ n, state, onClick, animDelay = 0 }) {
  // state: 'idle' | 'picked' | 'hit' | 'drawn' | 'miss'
  const colors = {
    idle:  { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.08)", text: "#555" },
    picked:{ bg: "rgba(124,58,237,0.3)",   border: "#7c3aed",               text: "#a78bfa" },
    hit:   { bg: "rgba(74,222,128,0.3)",   border: "#4ade80",               text: "#4ade80" },
    drawn: { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)",   text: "#666" },
    miss:  { bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.2)",  text: "#444" },
  };
  const c = colors[state] || colors.idle;

  return (
    <button
      onClick={onClick}
      style={{
        width: 44, height: 44, borderRadius: "50%",
        background: c.bg, border: `2px solid ${c.border}`,
        color: c.text, fontSize: 13, fontWeight: 700,
        cursor: onClick ? "pointer" : "default",
        transition: `all 0.2s ease ${animDelay}ms`,
        transform: state === "hit" ? "scale(1.15)" : "scale(1)",
        boxShadow: state === "hit" ? "0 0 14px #4ade8066" : state === "picked" ? "0 0 10px #7c3aed55" : "none",
      }}
    >
      {n}
    </button>
  );
}

const KenoGame = () => {
  const { user, fetchUserProfile } = useAuth();
  const [betAmount, setBetAmount] = useState(1);
  const [picks, setPicks]         = useState(new Set());
  const [phase, setPhase]         = useState("idle");   // idle | drawing | result
  const [drawn, setDrawn]         = useState([]);
  const [visibleDrawn, setVisibleDrawn] = useState([]); // animated reveal
  const [lastResult, setLastResult]     = useState(null);
  const [history, setHistory]     = useState([]);

  const maxPicks = 10;
  const canPick = phase === "idle" || phase === "result";

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND}/api/keno/history?limit=8`, { credentials: "include" });
      const d = await r.json();
      if (d.success) setHistory(d.games);
    } catch (_) {}
  }, []);

  useEffect(() => { if (user?.isAuthenticated) loadHistory(); }, [user?.isAuthenticated, loadHistory]);

  const togglePick = (n) => {
    if (!canPick) return;
    setPicks(prev => {
      const next = new Set(prev);
      if (next.has(n)) { next.delete(n); return next; }
      if (next.size >= maxPicks) { showToast(`Max ${maxPicks} numbers`, "error"); return prev; }
      next.add(n); return next;
    });
  };

  const placeBet = async () => {
    if (!user?.isAuthenticated) { showToast("Log in to play", "error"); return; }
    if (picks.size === 0) { showToast("Pick at least 1 number", "error"); return; }
    if (betAmount <= 0) { showToast("Enter a valid bet", "error"); return; }

    setPhase("drawing");
    setDrawn([]); setVisibleDrawn([]);

    try {
      const res = await fetch(`${BACKEND}/api/keno/bet`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, picks: Array.from(picks) }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error || "Bet failed", "error"); setPhase("idle"); return; }

      setDrawn(data.drawn);
      setLastResult(data);

      // Animate drawn numbers one by one
      for (let i = 0; i < data.drawn.length; i++) {
        await new Promise(r => setTimeout(r, 80));
        setVisibleDrawn(prev => [...prev, data.drawn[i]]);
      }

      setPhase("result");
      fetchUserProfile && fetchUserProfile();
      loadHistory();

      if (data.matches > 0 && data.multiplier > 0) {
        showToast(`🎯 ${data.matches}/${picks.size} hits — ${data.multiplier}× — Won $${data.profit.toFixed(2)}!`, "success");
      } else {
        showToast(`😔 ${data.matches}/${picks.size} hits — No win`, "error");
      }
    } catch { showToast("Connection error", "error"); setPhase("idle"); }
  };

  const reset = () => {
    setPhase("idle"); setDrawn([]); setVisibleDrawn([]); setLastResult(null);
  };

  // Current payout table for selected picks
  const payoutRow = picks.size > 0 ? PAYOUTS[picks.size] : null;

  function ballState(n) {
    if (phase === "idle") return picks.has(n) ? "picked" : "idle";
    if (phase === "drawing" || phase === "result") {
      const isDrawn = visibleDrawn.includes(n);
      const isPicked = picks.has(n);
      if (isPicked && isDrawn) return "hit";
      if (isPicked) return "miss";
      if (isDrawn) return "drawn";
      return "idle";
    }
    return "idle";
  }

  return (
    <div style={{ minHeight: "100vh", padding: "80px 0 40px", background: "linear-gradient(180deg,#05060d,#080a14)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 3, height: 22, background: "linear-gradient(180deg,#a78bfa,#ec4899)", borderRadius: 2 }} />
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 1, margin: 0 }}>KENO</h1>
          <span style={{ fontSize: 11, color: "#a78bfa", background: "rgba(124,58,237,0.15)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(124,58,237,0.3)", fontWeight: 700 }}>
            PROVABLY FAIR
          </span>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

          {/* Left controls */}
          <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Bet */}
            <div style={{ padding: 16, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Bet Amount</label>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input type="number" value={betAmount}
                  onChange={e => setBetAmount(parseFloat(e.target.value) || 0)}
                  disabled={phase === "drawing"}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "rgba(15,17,26,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontWeight: 700, outline: "none" }}
                  step="0.01" min="0.01" />
                <button onClick={() => setBetAmount(v => parseFloat((v / 2).toFixed(2)))} disabled={phase === "drawing"}
                  style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", cursor: "pointer", fontSize: 13 }}>½</button>
                <button onClick={() => setBetAmount(v => parseFloat((v * 2).toFixed(2)))} disabled={phase === "drawing"}
                  style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", cursor: "pointer", fontSize: 13 }}>2×</button>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                {[0.5, 1, 5, 10].map(p => (
                  <button key={p} onClick={() => setBetAmount(p)} disabled={phase === "drawing"}
                    style={{ padding: "4px 8px", borderRadius: 6, background: betAmount === p ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)", border: `1px solid ${betAmount === p ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, color: betAmount === p ? "#a78bfa" : "#676D7C", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                    ${p}
                  </button>
                ))}
              </div>
            </div>

            {/* Pick counter */}
            <div style={{ padding: 14, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
              <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Numbers Selected</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: picks.size > 0 ? "#a78bfa" : "#333" }}>{picks.size}</div>
              <div style={{ color: "#555", fontSize: 11 }}>of {maxPicks} max</div>
              {picks.size > 0 && canPick && (
                <button onClick={() => setPicks(new Set())} style={{ marginTop: 8, padding: "4px 12px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", fontSize: 11 }}>
                  Clear
                </button>
              )}
            </div>

            {/* Payout table */}
            {payoutRow && (
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Payouts ({picks.size} picks)</div>
                {payoutRow.map((m, hits) => m > 0 && (
                  <div key={hits} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, padding: "4px 8px", borderRadius: 6, background: lastResult?.matches === hits ? "rgba(124,58,237,0.15)" : "transparent", border: lastResult?.matches === hits ? "1px solid #7c3aed44" : "1px solid transparent" }}>
                    <span style={{ color: "#555", fontSize: 12 }}>{hits} hit{hits !== 1 ? "s" : ""}</span>
                    <span style={{ color: multColor(m), fontWeight: 700, fontSize: 12 }}>{m >= 1000 ? m.toLocaleString() : m}×</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action button */}
            {phase !== "drawing" && (
              <button
                onClick={phase === "result" ? reset : placeBet}
                disabled={phase === "drawing" || (phase === "idle" && picks.size === 0)}
                style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: picks.size === 0 && phase !== "result" ? "rgba(124,58,237,0.15)" : "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 900, fontSize: 15, cursor: picks.size === 0 && phase !== "result" ? "not-allowed" : "pointer", letterSpacing: 1, boxShadow: picks.size === 0 && phase !== "result" ? "none" : "0 6px 24px rgba(124,58,237,0.4)" }}>
                {phase === "result" ? "🎰 Play Again" : `🎯 BET $${(betAmount * 1).toFixed(2)}`}
              </button>
            )}

            {phase === "drawing" && (
              <div style={{ textAlign: "center", padding: "14px 0", color: "#a78bfa", fontWeight: 700, fontSize: 14 }}>
                Drawing numbers…
              </div>
            )}

            {/* Result */}
            {phase === "result" && lastResult && (
              <div style={{ padding: 16, borderRadius: 12, textAlign: "center", background: lastResult.profit > 0 ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${lastResult.profit > 0 ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                <div style={{ color: lastResult.profit > 0 ? "#4ade80" : "#f87171", fontSize: 26, fontWeight: 900 }}>
                  {lastResult.profit > 0 ? `+$${lastResult.profit.toFixed(2)}` : "No Win"}
                </div>
                <div style={{ color: "#676D7C", fontSize: 13, marginTop: 4 }}>
                  {lastResult.matches}/{picks.size} matches · {lastResult.multiplier}×
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent</div>
                {history.slice(0, 5).map((g, i) => (
                  <div key={g.id || i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: 6, background: "rgba(15,17,26,0.5)", marginBottom: 3 }}>
                    <span style={{ color: "#555", fontSize: 11 }}>{g.result?.matches}/{g.result?.picks?.length} hits</span>
                    <span style={{ color: g.profit >= 0 ? "#4ade80" : "#f87171", fontSize: 11, fontWeight: 700 }}>
                      {g.profit >= 0 ? "+" : ""}{g.profit?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — number grid */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ padding: "20px", borderRadius: 16, background: "rgba(10,12,22,0.95)", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>

              {/* Legend */}
              <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { color: "#7c3aed", label: "Your picks" },
                  { color: "#4ade80", label: "Hit!" },
                  { color: "#ef4444", label: "Drawn" },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                    <span style={{ color: "#555", fontSize: 11 }}>{label}</span>
                  </div>
                ))}
                {phase === "drawing" && (
                  <span style={{ color: "#a78bfa", fontSize: 11, marginLeft: "auto" }}>
                    {visibleDrawn.length}/{DRAWN} drawn
                  </span>
                )}
                {phase === "result" && (
                  <span style={{ color: "#4ade80", fontSize: 11, marginLeft: "auto" }}>
                    {lastResult?.matches} match{lastResult?.matches !== 1 ? "es" : ""}
                  </span>
                )}
              </div>

              {/* Grid 8×5 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
                {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => (
                  <NumberBall
                    key={n}
                    n={n}
                    state={ballState(n)}
                    onClick={canPick ? () => togglePick(n) : undefined}
                    animDelay={visibleDrawn.includes(n) ? visibleDrawn.indexOf(n) * 50 : 0}
                  />
                ))}
              </div>

              {/* Quick pick */}
              {canPick && (
                <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                  {[3, 5, 7, 10].map(count => (
                    <button key={count} onClick={() => {
                      const all = Array.from({ length: TOTAL }, (_, i) => i + 1);
                      const shuffled = all.sort(() => Math.random() - 0.5).slice(0, count);
                      setPicks(new Set(shuffled));
                    }}
                    style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#676D7C", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      Quick {count}
                    </button>
                  ))}
                  <button onClick={() => setPicks(new Set())} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", color: "#f87171", cursor: "pointer", fontSize: 12 }}>
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KenoGame;
