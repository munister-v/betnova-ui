import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/utils/toastUtils";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

// ── Dice roll visualizer ──────────────────────────────────────────────────────
function RollBar({ roll, target, direction, rolling }) {
  const pct = roll !== null ? roll : 50;

  // win zone
  const winLeft  = direction === "over"  ? target : 0;
  const winRight = direction === "over"  ? 99.99  : target;
  const winW     = winRight - winLeft;

  const won = roll !== null && (
    direction === "over" ? roll > target : roll < target
  );

  return (
    <div style={{ userSelect: "none" }}>
      {/* Track */}
      <div style={{ position: "relative", height: 48, marginBottom: 8 }}>
        {/* Full track bg */}
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0,
          height: 12, borderRadius: 6,
          transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.06)",
        }} />

        {/* Win zone */}
        <div style={{
          position: "absolute", top: "50%",
          left: `${winLeft}%`, width: `${winW}%`,
          height: 12, borderRadius: 0,
          transform: "translateY(-50%)",
          background: "rgba(74,222,128,0.25)",
          borderLeft: direction === "over" ? "2px solid #4ade80" : "none",
          borderRight: direction === "under" ? "2px solid #4ade80" : "none",
          transition: "all 0.3s",
        }} />

        {/* Target line */}
        <div style={{
          position: "absolute", top: "50%",
          left: `${target}%`,
          width: 2, height: 24,
          background: "#a78bfa",
          transform: "translateY(-50%)",
          borderRadius: 1,
          transition: "left 0.2s",
        }} />

        {/* Roll indicator */}
        {roll !== null && (
          <div style={{
            position: "absolute", top: "50%",
            left: `${pct}%`,
            width: 18, height: 18,
            borderRadius: "50%",
            background: won ? "#4ade80" : "#ef4444",
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 12px ${won ? "#4ade80" : "#ef4444"}`,
            border: "2px solid #fff",
            transition: rolling ? "none" : "left 0.4s cubic-bezier(.34,1.56,.64,1)",
            zIndex: 2,
          }} />
        )}
      </div>

      {/* Labels */}
      <div style={{ display: "flex", justifyContent: "space-between", color: "#555", fontSize: 11 }}>
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>99.99</span>
      </div>
    </div>
  );
}

// ── History row ───────────────────────────────────────────────────────────────
function HistRow({ g }) {
  const r = g.result || {};
  const won = r.won ?? g.profit > 0;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", borderRadius: 8, background: "rgba(15,17,26,0.5)", marginBottom: 3 }}>
      <span style={{ color: won ? "#4ade80" : "#ef4444", fontSize: 20 }}>{won ? "🎲" : "💀"}</span>
      <span style={{ color: "#aaa", fontSize: 12, flex: 1 }}>
        {r.roll?.toFixed(2)} {r.direction === "over" ? ">" : "<"} {r.target}
      </span>
      <span style={{ color: won ? "#4ade80" : "#f87171", fontSize: 12, fontWeight: 700 }}>
        {won ? "+" : ""}{(g.profit ?? g.netProfit)?.toFixed(2)}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const DiceGame = () => {
  const { user, fetchUserProfile } = useAuth();
  const [betAmount, setBetAmount] = useState(1);
  const [target, setTarget]       = useState(50);
  const [direction, setDirection] = useState("over");
  const [rolling, setRolling]     = useState(false);
  const [lastRoll, setLastRoll]   = useState(null);   // number
  const [lastResult, setLastResult] = useState(null); // full result obj
  const [history, setHistory]     = useState([]);
  const [animRoll, setAnimRoll]   = useState(null);
  const animRef = useRef(null);

  const winChance = direction === "over" ? (99 - target) : (target - 1);
  const multiplier = winChance > 0 ? ((99 / winChance)).toFixed(4) : "0";

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND}/api/dice/history?limit=10`, { credentials: "include" });
      const d = await r.json();
      if (d.success) setHistory(d.games);
    } catch (_) {}
  }, []);

  useEffect(() => { if (user?.isAuthenticated) loadHistory(); }, [user?.isAuthenticated, loadHistory]);

  const roll = async () => {
    if (!user?.isAuthenticated) { showToast("Log in to play", "error"); return; }
    if (betAmount <= 0) { showToast("Enter a valid bet", "error"); return; }
    if (winChance <= 0) { showToast("Adjust your target", "error"); return; }
    setRolling(true);
    setLastRoll(null);
    setAnimRoll(null);
    setLastResult(null);

    // Animate fake rolling
    let frames = 0;
    const animate = () => {
      setAnimRoll(parseFloat((Math.random() * 99.99).toFixed(2)));
      frames++;
      if (frames < 12) animRef.current = setTimeout(animate, 60);
    };
    animate();

    try {
      const res = await fetch(`${BACKEND}/api/dice/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ betAmount, target, direction }),
      });
      const data = await res.json();

      clearTimeout(animRef.current);
      if (!data.success) { showToast(data.error || "Bet failed", "error"); setRolling(false); return; }

      setLastRoll(data.roll);
      setAnimRoll(null);
      setLastResult(data);
      setRolling(false);

      showToast(
        data.won
          ? `🎲 ${data.roll.toFixed(2)} — Won $${data.profit.toFixed(2)}! (${data.multiplier}×)`
          : `💀 ${data.roll.toFixed(2)} — Lost`,
        data.won ? "success" : "error"
      );
      fetchUserProfile && fetchUserProfile();
      setHistory(prev => [{
        id: Date.now(),
        bet_amount: betAmount,
        multiplier: data.multiplier,
        profit: data.netProfit,
        result: { roll: data.roll, target, direction, won: data.won },
      }, ...prev.slice(0, 9)]);
    } catch {
      clearTimeout(animRef.current);
      setRolling(false);
      showToast("Connection error", "error");
    }
  };

  const displayRoll = animRoll !== null ? animRoll : lastRoll;

  return (
    <div style={{ minHeight: "100vh", padding: "80px 0 40px", background: "linear-gradient(180deg,#05060d,#080a14)" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 3, height: 22, background: "linear-gradient(180deg,#a78bfa,#ec4899)", borderRadius: 2 }} />
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 1, margin: 0 }}>DICE</h1>
          <span style={{ fontSize: 11, color: "#a78bfa", background: "rgba(124,58,237,0.15)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(124,58,237,0.3)", fontWeight: 700 }}>
            PROVABLY FAIR
          </span>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

          {/* Left controls */}
          <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Bet amount */}
            <div style={{ padding: 16, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Bet Amount</label>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input type="number" value={betAmount} onChange={e => setBetAmount(parseFloat(e.target.value) || 0)} disabled={rolling}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "rgba(15,17,26,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontWeight: 700, outline: "none" }}
                  step="0.01" min="0.01" />
                <button onClick={() => setBetAmount(v => parseFloat((v / 2).toFixed(2)))} disabled={rolling}
                  style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>½</button>
                <button onClick={() => setBetAmount(v => parseFloat((v * 2).toFixed(2)))} disabled={rolling}
                  style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>2×</button>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                {[0.1, 0.5, 1, 5, 10].map(p => (
                  <button key={p} onClick={() => setBetAmount(p)} disabled={rolling}
                    style={{ padding: "4px 8px", borderRadius: 6, background: betAmount === p ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)", border: `1px solid ${betAmount === p ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, color: betAmount === p ? "#a78bfa" : "#676D7C", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                    ${p}
                  </button>
                ))}
              </div>
            </div>

            {/* Direction */}
            <div style={{ padding: 16, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Direction</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {[["over", "Roll Over", "#4ade80"], ["under", "Roll Under", "#f59e0b"]].map(([d, label, color]) => (
                  <button key={d} onClick={() => setDirection(d)} disabled={rolling}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: direction === d ? color + "22" : "rgba(255,255,255,0.04)", border: `1px solid ${direction === d ? color + "88" : "rgba(255,255,255,0.06)"}`, color: direction === d ? color : "#676D7C", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding: 16, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Win Chance", value: `${winChance}%`, color: "#4ade80" },
                { label: "Multiplier",  value: `${multiplier}×`, color: "#a78bfa" },
                { label: "Profit On Win", value: `$${(betAmount * parseFloat(multiplier)).toFixed(2)}`, color: "#f59e0b" },
                { label: "Target",     value: `${direction === "over" ? ">" : "<"} ${target}`, color: "#60a5fa" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ color: "#676D7C", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                  <div style={{ color, fontSize: 15, fontWeight: 800 }}>{value}</div>
                </div>
              ))}
            </div>

            <button onClick={roll} disabled={rolling}
              style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: rolling ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 900, fontSize: 15, cursor: rolling ? "not-allowed" : "pointer", letterSpacing: 1, boxShadow: rolling ? "none" : "0 6px 24px rgba(124,58,237,0.4)", transition: "all 0.2s" }}>
              {rolling ? "Rolling..." : "🎲 ROLL"}
            </button>

            {/* History */}
            {history.length > 0 && (
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent</div>
                {history.map((g, i) => <HistRow key={g.id || i} g={g} />)}
              </div>
            )}
          </div>

          {/* Right — Roll display */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Big roll number */}
            <div style={{
              padding: "40px 32px", borderRadius: 16, marginBottom: 20,
              background: "rgba(10,12,22,0.95)", border: "1px solid rgba(139,92,246,0.15)",
              textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}>
              <div style={{
                fontSize: 72, fontWeight: 900, letterSpacing: -2,
                color: displayRoll === null ? "#222" : (lastResult?.won ? "#4ade80" : animRoll !== null ? "#a78bfa" : "#ef4444"),
                transition: "color 0.3s",
                fontVariantNumeric: "tabular-nums",
                minHeight: 90,
              }}>
                {displayRoll !== null ? displayRoll.toFixed(2) : "—"}
              </div>
              {lastResult && !rolling && (
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: lastResult.won ? "#4ade80" : "#ef4444" }}>
                  {lastResult.won ? `WON $${lastResult.profit.toFixed(2)}` : "LOST"}
                </div>
              )}
            </div>

            {/* Slider bar */}
            <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(10,12,22,0.95)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <RollBar roll={displayRoll} target={target} direction={direction} rolling={rolling} />

              {/* Target slider */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Target: {target}</label>
                  <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>Win chance: {winChance}%</span>
                </div>
                <input
                  type="range" min="2" max="98" value={target}
                  onChange={e => setTarget(parseInt(e.target.value))}
                  disabled={rolling}
                  style={{ width: "100%", accentColor: "#7c3aed", cursor: rolling ? "not-allowed" : "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {[2, 25, 50, 75, 98].map(v => (
                    <button key={v} onClick={() => setTarget(v)} disabled={rolling}
                      style={{ padding: "4px 8px", borderRadius: 6, background: target === v ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)", border: "none", color: target === v ? "#a78bfa" : "#555", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Provably fair */}
            {lastResult && (
              <div style={{ marginTop: 12, padding: "10px 16px", borderRadius: 10, background: "rgba(12,14,24,0.8)", border: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "#555" }}>
                <span style={{ color: "#a78bfa", fontWeight: 700 }}>Provably Fair</span> · Nonce: {lastResult.nonce} · Seed: {lastResult.clientSeed?.slice(0, 8)}…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceGame;
