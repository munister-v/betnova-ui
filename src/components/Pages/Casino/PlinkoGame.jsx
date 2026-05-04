import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/utils/toastUtils";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

// Multiplier color mapping
function multColor(m) {
  if (m >= 50)  return "#ff3860";
  if (m >= 10)  return "#ff6b35";
  if (m >= 3)   return "#f59e0b";
  if (m >= 1.5) return "#a78bfa";
  if (m >= 1)   return "#60a5fa";
  if (m >= 0.5) return "#94a3b8";
  return "#ef4444";
}

const MULTIPLIERS = {
  low: {
    8:  [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    10: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
    12: [10.0, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10.0],
    14: [18.0, 4.0, 1.7, 1.4, 1.1, 1.0, 0.7, 0.5, 0.7, 1.0, 1.1, 1.4, 1.7, 4.0, 18.0],
    16: [16.0, 9.0, 2.0, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2.0, 9.0, 16.0],
  },
  medium: {
    8:  [13.0, 3.0, 1.3, 0.7, 0.4, 0.7, 1.3, 3.0, 13.0],
    10: [22.0, 5.0, 2.0, 1.4, 0.6, 0.4, 0.6, 1.4, 2.0, 5.0, 22.0],
    12: [33.0, 11.0, 4.0, 2.0, 1.1, 0.6, 0.3, 0.6, 1.1, 2.0, 4.0, 11.0, 33.0],
    14: [43.0, 13.0, 6.0, 3.0, 1.3, 0.7, 0.4, 0.2, 0.4, 0.7, 1.3, 3.0, 6.0, 13.0, 43.0],
    16: [58.0, 15.0, 7.0, 4.0, 1.9, 1.0, 0.5, 0.2, 0.2, 0.5, 1.0, 1.9, 4.0, 7.0, 15.0, 58.0, 58.0],
  },
  high: {
    8:  [29.0, 4.0, 1.5, 0.3, 0.2, 0.3, 1.5, 4.0, 29.0],
    10: [76.0, 10.0, 3.0, 0.9, 0.3, 0.2, 0.3, 0.9, 3.0, 10.0, 76.0],
    12: [170.0, 24.0, 5.0, 2.0, 0.7, 0.2, 0.2, 0.2, 0.7, 2.0, 5.0, 24.0, 170.0],
    14: [350.0, 40.0, 8.0, 2.0, 0.7, 0.4, 0.2, 0.1, 0.2, 0.4, 0.7, 2.0, 8.0, 40.0, 350.0],
    16: [1000.0, 130.0, 26.0, 9.0, 4.0, 2.0, 0.2, 0.2, 0.2, 0.2, 2.0, 4.0, 9.0, 26.0, 130.0, 1000.0, 1000.0],
  },
};

// Canvas-based Plinko board renderer + animation
function PlinkoCanvas({ rows, risk, ballPath, animating, onAnimEnd }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const W = 480, H = 520;
  const pegR = 5;
  const topPad = 32, botPad = 56;
  const boardH = H - topPad - botPad;
  const rowH = boardH / (rows + 1);
  const boardW = W - 60;

  // Calculate peg positions
  function getPegs(r) {
    const pegs = [];
    for (let row = 0; row < r; row++) {
      const count = row + 2;
      const spacing = boardW / (count + 1);
      const startX = (W - spacing * (count - 1)) / 2;
      for (let col = 0; col < count; col++) {
        pegs.push({
          x: startX + col * spacing,
          y: topPad + (row + 1) * rowH,
          row, col,
        });
      }
    }
    return pegs;
  }

  // Calculate slot x positions
  function getSlots(r) {
    const count = r + 1;
    const spacing = boardW / count;
    const startX = 30 + spacing / 2;
    return Array.from({ length: count }, (_, i) => startX + i * spacing);
  }

  // Calculate ball trajectory from path
  function getBallPos(path, t) {
    // t = 0..1 overall progress
    const totalSteps = path.length;
    const step = t * totalSteps;
    const stepIdx = Math.min(Math.floor(step), totalSteps - 1);
    const frac = step - stepIdx;

    // Column tracking: starts at center of top row (which has 2 pegs)
    // After each row, ball is between peg[col] and peg[col+1]
    // path[i] = 0 → go left, 1 → go right

    // Compute x column indices
    let col = 0; // tracks which gap we're in (0 = leftmost gap in current row)
    const colHistory = [0];
    for (let i = 0; i < path.length; i++) {
      col = col + path[i];
      colHistory.push(col);
    }

    // Ball x: in row `r`, there are r+2 pegs, gaps are r+1
    // Gap `g` in row `r` is between peg g and peg g+1
    // x of gap = (x of peg[g] + x of peg[g+1]) / 2
    function gapX(row, gap) {
      const count = row + 2;
      const spacing = boardW / (count + 1);
      const startX = (W - spacing * (count - 1)) / 2;
      const left  = startX + gap * spacing;
      const right = startX + (gap + 1) * spacing;
      return (left + right) / 2;
    }

    function gapY(row) {
      // Ball is between row `row` pegs and row `row+1` pegs
      const y1 = topPad + (row + 1) * rowH;
      const y2 = topPad + (row + 2) * rowH;
      return (y1 + y2) / 2;
    }

    if (stepIdx >= totalSteps) {
      // Landed in final slot
      const slots = getSlots(path.length);
      const finalSlot = colHistory[totalSteps];
      return { x: slots[finalSlot], y: H - botPad + 12 };
    }

    const x1 = gapX(stepIdx, colHistory[stepIdx]);
    const x2 = gapX(stepIdx, colHistory[stepIdx + 1]);
    const y1 = gapY(stepIdx);
    // Actually let's interpolate between the midpoint before peg and midpoint after peg
    // Simplified: lerp x, parabola y
    const pegY = topPad + (stepIdx + 2) * rowH;
    const prevY = stepIdx === 0 ? topPad + 8 : gapY(stepIdx - 1);

    const x = x1 + (x2 - x1) * frac;
    // Parabola: goes up to peg then down
    const midY = pegY;
    const startY = stepIdx === 0 ? topPad + 8 : gapY(stepIdx - 1);
    const endY   = gapY(stepIdx);
    // Simple lerp for y
    const y = startY + (endY - startY) * frac;

    return { x, y };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pegs = getPegs(rows);
    const slots = getSlots(rows);
    const mults = MULTIPLIERS[risk][rows];

    let startTime = null;
    const duration = Math.max(1200, rows * 100);

    function draw(t) {
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "rgba(5,6,13,0)";
      ctx.fillRect(0, 0, W, H);

      // Draw slot backgrounds
      const slotW = boardW / (rows + 1);
      for (let i = 0; i < slots.length; i++) {
        const m = mults[i];
        const color = multColor(m);
        const sx = slots[i] - slotW / 2 + 2;
        const sy = H - botPad + 2;
        const sw = slotW - 4;
        const sh = botPad - 8;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 4);
        ctx.fillStyle = color + "22";
        ctx.fill();
        ctx.strokeStyle = color + "66";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = color;
        ctx.font = `bold ${m >= 100 ? 8 : m >= 10 ? 9 : 10}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(m >= 10 ? m.toFixed(0) + "×" : m + "×", slots[i], H - botPad + sh / 2 + 4);
      }

      // Draw pegs
      for (const peg of pegs) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegR, 0, Math.PI * 2);
        ctx.fillStyle = "#2a2d42";
        ctx.fill();
        ctx.strokeStyle = "rgba(167,139,250,0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw ball if animating or done
      if (ballPath && (animating || t >= 1)) {
        const progress = Math.min(t, 1);
        const { x, y } = getBallPos(ballPath, progress);

        // Glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 14);
        grd.addColorStop(0, "rgba(167,139,250,0.6)");
        grd.addColorStop(1, "rgba(167,139,250,0)");
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Ball
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        const ballGrd = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 7);
        ballGrd.addColorStop(0, "#e0d0ff");
        ballGrd.addColorStop(1, "#7c3aed");
        ctx.fillStyle = ballGrd;
        ctx.fill();
      }
    }

    if (!ballPath || !animating) {
      draw(0);
      return;
    }

    function frame(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = Math.min(elapsed / duration, 1);
      draw(t);
      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        draw(1);
        onAnimEnd && onAnimEnd();
      }
    }

    animRef.current = requestAnimationFrame(frame);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, risk, ballPath, animating]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}
    />
  );
}

// ─── Controls ───────────────────────────────────────────────────────────────

function BetInput({ value, onChange, disabled }) {
  const presets = [0.1, 0.5, 1, 5, 10, 50];
  return (
    <div>
      <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Bet Amount</label>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: 8,
            background: "rgba(15,17,26,0.8)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff", fontSize: 14, fontWeight: 700, outline: "none",
          }}
          step="0.01" min="0.01"
        />
        <button onClick={() => onChange(parseFloat((value / 2).toFixed(2)))} disabled={disabled}
          style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          ½
        </button>
        <button onClick={() => onChange(parseFloat((value * 2).toFixed(2)))} disabled={disabled}
          style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          2×
        </button>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
        {presets.map(p => (
          <button key={p} onClick={() => onChange(p)} disabled={disabled}
            style={{ padding: "4px 10px", borderRadius: 6, background: value === p ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)", border: `1px solid ${value === p ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, color: value === p ? "#a78bfa" : "#676D7C", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            ${p}
          </button>
        ))}
      </div>
    </div>
  );
}

function RowSelect({ value, onChange, disabled }) {
  return (
    <div>
      <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Rows</label>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {[8, 10, 12, 14, 16].map(r => (
          <button key={r} onClick={() => onChange(r)} disabled={disabled}
            style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: value === r ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)", border: `1px solid ${value === r ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, color: value === r ? "#a78bfa" : "#676D7C", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

function RiskSelect({ value, onChange, disabled }) {
  const opts = [
    { key: "low",    label: "Low",    color: "#4ade80" },
    { key: "medium", label: "Medium", color: "#f59e0b" },
    { key: "high",   label: "High",   color: "#ef4444" },
  ];
  return (
    <div>
      <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Risk</label>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        {opts.map(o => (
          <button key={o.key} onClick={() => onChange(o.key)} disabled={disabled}
            style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: value === o.key ? o.color + "22" : "rgba(255,255,255,0.04)", border: `1px solid ${value === o.key ? o.color + "88" : "rgba(255,255,255,0.06)"}`, color: value === o.key ? o.color : "#676D7C", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── History row ─────────────────────────────────────────────────────────────

function HistoryRow({ g }) {
  const profit = g.netProfit ?? g.profit;
  const won = profit >= 0;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: "rgba(15,17,26,0.5)", marginBottom: 4 }}>
      <span style={{ color: "#676D7C", fontSize: 12 }}>${g.betAmount ?? g.bet_amount}</span>
      <span style={{ color: multColor(g.multiplier), fontSize: 12, fontWeight: 700 }}>{g.multiplier}×</span>
      <span style={{ color: won ? "#4ade80" : "#f87171", fontSize: 12, fontWeight: 700 }}>
        {won ? "+" : ""}{profit?.toFixed(2)}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const PlinkoGame = () => {
  const { user, fetchUserProfile } = useAuth();
  const [betAmount, setBetAmount] = useState(1);
  const [rows, setRows]   = useState(16);
  const [risk, setRisk]   = useState("medium");
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { slot, path, multiplier, netProfit }
  const [history, setHistory] = useState([]);

  const busy = loading || animating;

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/plinko/history?limit=10`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setHistory(data.games);
    } catch (_) {}
  }, []);

  useEffect(() => { if (user?.isAuthenticated) loadHistory(); }, [user?.isAuthenticated, loadHistory]);

  const placeBet = async () => {
    if (!user?.isAuthenticated) { showToast("Please log in to play", "error"); return; }
    if (betAmount <= 0) { showToast("Enter a valid bet amount", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/plinko/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ betAmount, rows, risk }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error || "Bet failed", "error"); return; }

      setLastResult(data);
      setAnimating(true);
      // Balance will refresh after animation ends
    } catch (err) {
      showToast("Connection error", "error");
    } finally {
      setLoading(false);
    }
  };

  const onAnimEnd = useCallback(() => {
    setAnimating(false);
    if (lastResult) {
      const won = lastResult.netProfit >= 0;
      showToast(
        won
          ? `🎉 ${lastResult.multiplier}× — Won $${lastResult.profit.toFixed(2)}!`
          : `${lastResult.multiplier}× — Lost $${betAmount.toFixed(2)}`,
        won ? "success" : "error"
      );
      fetchUserProfile && fetchUserProfile();
      // Prepend to local history
      setHistory(prev => [{
        id: Date.now(),
        bet_amount: betAmount,
        multiplier: lastResult.multiplier,
        profit: lastResult.netProfit,
        result: { slot: lastResult.slot, path: lastResult.path },
      }, ...prev.slice(0, 9)]);
    }
  }, [lastResult, betAmount, fetchUserProfile]);

  const mults = MULTIPLIERS[risk][rows];

  return (
    <div style={{
      minHeight: "100vh",
      padding: "80px 0 40px",
      background: "linear-gradient(180deg, #05060d 0%, #080a14 100%)",
    }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 3, height: 22, background: "linear-gradient(180deg,#a78bfa,#ec4899)", borderRadius: 2 }} />
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 1, margin: 0 }}>PLINKO</h1>
          <span style={{ fontSize: 11, color: "#a78bfa", background: "rgba(124,58,237,0.15)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(124,58,237,0.3)", fontWeight: 700 }}>
            PROVABLY FAIR
          </span>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

          {/* Left — Controls */}
          <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: 16, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <BetInput value={betAmount} onChange={setBetAmount} disabled={busy} />
            </div>

            <div style={{ padding: 16, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <RowSelect value={rows} onChange={setRows} disabled={busy} />
            </div>

            <div style={{ padding: 16, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <RiskSelect value={risk} onChange={setRisk} disabled={busy} />
            </div>

            <button
              onClick={placeBet}
              disabled={busy}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
                background: busy ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#ec4899)",
                color: "#fff", fontWeight: 900, fontSize: 15, cursor: busy ? "not-allowed" : "pointer",
                letterSpacing: 1, boxShadow: busy ? "none" : "0 6px 24px rgba(124,58,237,0.4)",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Rolling..." : animating ? "Dropping..." : "DROP BALL"}
            </button>

            {/* Last result */}
            {lastResult && !animating && (
              <div style={{
                padding: 16, borderRadius: 12,
                background: lastResult.netProfit >= 0 ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${lastResult.netProfit >= 0 ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}`,
                textAlign: "center",
              }}>
                <div style={{ color: multColor(lastResult.multiplier), fontSize: 28, fontWeight: 900 }}>
                  {lastResult.multiplier}×
                </div>
                <div style={{ color: lastResult.netProfit >= 0 ? "#4ade80" : "#f87171", fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                  {lastResult.netProfit >= 0 ? "+" : ""}${lastResult.profit.toFixed(2)}
                </div>
                <div style={{ color: "#676D7C", fontSize: 11, marginTop: 4 }}>
                  Slot #{lastResult.slot + 1} of {rows + 1}
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Recent
                </div>
                {history.slice(0, 6).map((g, i) => <HistoryRow key={g.id || i} g={g} />)}
              </div>
            )}
          </div>

          {/* Right — Board */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{
              borderRadius: 16,
              background: "rgba(10,12,22,0.95)",
              border: "1px solid rgba(139,92,246,0.15)",
              padding: "12px 0 8px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}>
              <PlinkoCanvas
                rows={rows}
                risk={risk}
                ballPath={lastResult?.path || null}
                animating={animating}
                onAnimEnd={onAnimEnd}
              />
            </div>

            {/* Multiplier preview strip */}
            <div style={{ display: "flex", gap: 2, marginTop: 8, flexWrap: "nowrap", overflowX: "auto" }}>
              {mults.map((m, i) => (
                <div key={i} style={{
                  flex: 1,
                  padding: "4px 2px",
                  borderRadius: 6,
                  background: lastResult && !animating && lastResult.slot === i
                    ? multColor(m) + "44"
                    : multColor(m) + "11",
                  border: `1px solid ${lastResult && !animating && lastResult.slot === i ? multColor(m) + "cc" : multColor(m) + "33"}`,
                  textAlign: "center",
                  transition: "all 0.3s",
                  transform: lastResult && !animating && lastResult.slot === i ? "scale(1.08)" : "scale(1)",
                }}>
                  <span style={{ color: multColor(m), fontSize: m >= 100 ? 8 : m >= 10 ? 9 : 10, fontWeight: 800, whiteSpace: "nowrap" }}>
                    {m >= 10 ? m.toFixed(0) : m}×
                  </span>
                </div>
              ))}
            </div>

            {/* Provably Fair info */}
            {lastResult && !animating && (
              <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(12,14,24,0.8)", border: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "#555" }}>
                <span style={{ color: "#a78bfa", fontWeight: 700 }}>Provably Fair</span> · Nonce: {lastResult.nonce} · Client seed: {lastResult.clientSeed?.slice(0, 8)}…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlinkoGame;
