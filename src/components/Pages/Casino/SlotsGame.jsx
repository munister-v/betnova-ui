import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";
const FALLBACK_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];

const THEMES = {
  classic: { primary: "#f59e0b", secondary: "#ef4444", glow: "rgba(245,158,11,0.6)", accent: "🎰" },
  bonanza: { primary: "#ec4899", secondary: "#8b5cf6", glow: "rgba(236,72,153,0.6)", accent: "🍬" },
  egypt:   { primary: "#facc15", secondary: "#92400e", glow: "rgba(250,204,21,0.6)", accent: "📜" },
  dragon:  { primary: "#dc2626", secondary: "#facc15", glow: "rgba(220,38,38,0.6)", accent: "🐉" },
  pirate:  { primary: "#06b6d4", secondary: "#0e7490", glow: "rgba(6,182,212,0.6)", accent: "🏴‍☠️" },
  space:   { primary: "#8b5cf6", secondary: "#3b82f6", glow: "rgba(139,92,246,0.6)", accent: "🚀" },
  vegas:   { primary: "#ef4444", secondary: "#f59e0b", glow: "rgba(239,68,68,0.6)", accent: "🎰" },
  jungle:  { primary: "#16a34a", secondary: "#84cc16", glow: "rgba(22,163,74,0.6)", accent: "🦁" },
};

// ─── Reel column for 3×3 and 5×3 ──────────────────────────────────────────
function ReelColumn({ allSymbols, spinning, results, cellSize = 80, winning = [] }) {
  return (
    <div style={{
      width: cellSize, borderRadius: 10, overflow: "hidden",
      background: "rgba(10,12,20,0.92)", border: "2px solid rgba(255,255,255,0.08)",
      position: "relative", display: "flex", flexDirection: "column",
    }}>
      {spinning ? (
        <div style={{ animation: `slotSpin 0.1s linear infinite`, display: "flex", flexDirection: "column" }}>
          {[...allSymbols, ...allSymbols, ...allSymbols].map((s, i) => (
            <div key={i} style={{ height: cellSize, display: "flex", alignItems: "center", justifyContent: "center", fontSize: cellSize * 0.5 }}>{s}</div>
          ))}
        </div>
      ) : (
        results.map((sym, i) => (
          <div key={i} style={{
            height: cellSize, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: cellSize * 0.5, borderBottom: i < results.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
            background: winning.includes(i) ? "rgba(74,222,128,0.18)" : "transparent",
            transition: "background 0.3s",
          }}>{sym}</div>
        ))
      )}
    </div>
  );
}

// ─── Engine: 3×3 grid ──────────────────────────────────────────────────────
function Grid3x3({ grid, spinning, allSymbols, theme, winningCells }) {
  const reels = grid
    ? [[grid[0], grid[3], grid[6]], [grid[1], grid[4], grid[7]], [grid[2], grid[5], grid[8]]]
    : [["❓","❓","❓"], ["❓","❓","❓"], ["❓","❓","❓"]];

  const winningInReel = (reelIdx) => {
    const cellsInReel = [reelIdx, reelIdx + 3, reelIdx + 6]; // grid layout: row*3+col
    return winningCells.filter(c => cellsInReel.includes(c)).map(c => Math.floor(c / 3));
  };

  return (
    <div style={{
      display: "flex", gap: 8, justifyContent: "center", padding: 24,
      borderRadius: 16, background: `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)`,
      border: `1px solid ${theme.primary}33`,
    }}>
      {reels.map((reel, i) => (
        <ReelColumn key={i} allSymbols={allSymbols} spinning={spinning} results={reel} cellSize={90} winning={winningInReel(i)} />
      ))}
    </div>
  );
}

// ─── Engine: 5×3 grid ──────────────────────────────────────────────────────
function Grid5x3({ grid, spinning, allSymbols, theme, winningCells }) {
  // Grid is row-major: idx = row*5 + col → cells 0..14
  const reels = grid
    ? Array.from({ length: 5 }, (_, c) => [grid[c], grid[c + 5], grid[c + 10]])
    : Array.from({ length: 5 }, () => ["❓","❓","❓"]);

  const winningInReel = (reelIdx) => {
    const cells = [reelIdx, reelIdx + 5, reelIdx + 10];
    return winningCells.filter(c => cells.includes(c)).map(c => Math.floor(c / 5));
  };

  return (
    <div style={{
      display: "flex", gap: 6, justifyContent: "center", padding: 16,
      borderRadius: 16, background: `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)`,
      border: `1px solid ${theme.primary}33`,
      overflowX: "auto",
    }}>
      {reels.map((reel, i) => (
        <ReelColumn key={i} allSymbols={allSymbols} spinning={spinning} results={reel} cellSize={70} winning={winningInReel(i)} />
      ))}
    </div>
  );
}

// ─── Engine: 5×5 cluster grid with cascade animation ───────────────────────
function GridCluster({ grid, spinning, allSymbols, theme, currentCascade, winningCells }) {
  const display = grid || Array(25).fill("❓");
  const ROWS = 5, COLS = 5;

  return (
    <div style={{
      padding: 20, borderRadius: 16,
      background: `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)`,
      border: `1px solid ${theme.primary}33`,
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: 4,
        maxWidth: 360,
        margin: "0 auto",
      }}>
        {display.map((sym, idx) => {
          const isWinning = winningCells.includes(idx);
          return (
            <div key={idx} style={{
              aspectRatio: "1 / 1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              borderRadius: 8,
              background: isWinning
                ? `linear-gradient(135deg, ${theme.primary}66, ${theme.secondary}66)`
                : "rgba(10,12,20,0.85)",
              border: isWinning ? `2px solid ${theme.primary}` : "2px solid rgba(255,255,255,0.06)",
              boxShadow: isWinning ? `0 0 16px ${theme.glow}` : "none",
              animation: spinning ? `bounce 0.4s ease infinite` : isWinning ? `winPop 0.6s ease infinite` : "none",
              animationDelay: spinning ? `${(idx % 5) * 0.05}s` : "0s",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
              transition: "all 0.3s",
            }}>
              {spinning ? allSymbols[(idx + Math.floor(Date.now() / 100)) % allSymbols.length] : sym}
            </div>
          );
        })}
      </div>
      {currentCascade > 0 && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <span style={{
            display: "inline-block", padding: "4px 14px", borderRadius: 6,
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 1,
            boxShadow: `0 0 12px ${theme.glow}`,
          }}>
            ⚡ CASCADE ×{currentCascade + 1}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
const SlotsGame = ({ gameId = "classic", title }) => {
  const { user, updateBalance } = useAuth();
  const [bet, setBet] = useState("1");
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [config, setConfig] = useState(null);
  const [cascadeStep, setCascadeStep] = useState(0);
  const [winningCells, setWinningCells] = useState([]);

  const theme = THEMES[gameId] || THEMES.classic;

  useEffect(() => {
    fetch(`${BACKEND}/api/slots/config?gameId=${gameId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setConfig(data); })
      .catch(() => {});
  }, [gameId]);

  const allSymbols = config?.symbols?.map(s => s.emoji) || FALLBACK_SYMBOLS;
  const engine = config?.engine || "3x3";

  const paytable = (config?.symbols || [])
    .slice()
    .sort((a, b) => (b.pay5 || b.pay3 || 0) - (a.pay5 || a.pay3 || 0));

  const handleSpin = async () => {
    if (spinning) return;
    const betAmount = parseFloat(bet);
    if (!betAmount || betAmount <= 0) return toast.error("Invalid bet");
    if (!user?.isAuthenticated) return toast.error("Login to play");

    setSpinning(true);
    setLastResult(null);
    setCascadeStep(0);
    setWinningCells([]);

    try {
      const res = await fetch(`${BACKEND}/api/slots/spin`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, gameId }),
      });
      const data = await res.json();

      await new Promise(r => setTimeout(r, 1200));

      if (!data.success) {
        toast.error(data.error || "Error");
        setSpinning(false);
        return;
      }

      setSpinning(false);

      // For cluster engine, replay each cascade step
      if (data.engine === "cluster" && data.cascades?.length > 0) {
        for (let i = 0; i < data.cascades.length; i++) {
          const c = data.cascades[i];
          setGrid(c.grid);
          setCascadeStep(i);
          const wins = (c.clusters || []).flatMap(cl => cl.cells);
          setWinningCells(wins);
          await new Promise(r => setTimeout(r, 900));
        }
        // Final state
        setGrid(data.grid);
        setWinningCells([]);
      } else {
        setGrid(data.grid);
        // Highlight winning cells for paylines
        if (data.winningLines?.length > 0) {
          const wins = data.winningLines.flatMap(w => w.line);
          setWinningCells(wins);
        }
      }

      setLastResult(data);

      if (data.payout > 0) {
        toast.success(`🎰 Won $${data.payout.toFixed(2)} (${data.multiplier.toFixed(1)}x)!`);
      }

      if (typeof updateBalance === "function") updateBalance(data.balance);

      setHistory(prev => [data, ...prev].slice(0, 10));
    } catch (err) {
      toast.error("Connection error");
      setSpinning(false);
    }
  };

  const winLines = lastResult?.winningLines || [];
  const cascades = lastResult?.cascades || [];

  return (
    <div style={{ maxWidth: engine === "5x3" ? 800 : 700, margin: "0 auto", padding: 20, color: "#fff" }}>
      <style>{`
        @keyframes slotSpin {
          0% { transform: translateY(0); }
          100% { transform: translateY(-90px); }
        }
        @keyframes winPulse {
          0%,100% { box-shadow: 0 0 0 ${theme.glow}; }
          50% { box-shadow: 0 0 36px ${theme.glow}; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes winPop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>

      <h2 style={{
        textAlign: "center", marginBottom: 4, fontSize: 32, fontWeight: 800,
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        textShadow: `0 0 30px ${theme.glow}`,
      }}>
        {theme.accent} {title || config?.name || "Slots"}
      </h2>
      <p style={{ textAlign: "center", color: "#676D7C", marginBottom: 20, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
        {engine === "3x3" && "5 paylines · 3×3 grid"}
        {engine === "5x3" && "10 paylines · 5×3 grid · Wilds"}
        {engine === "cluster" && "Cluster pays · Cascading wins"}
        {" · Provably Fair"}
      </p>

      {/* Game grid */}
      <div style={{
        marginBottom: 20,
        animation: lastResult?.payout > 0 && !spinning ? "winPulse 1s ease 3" : "none",
        borderRadius: 16,
      }}>
        {engine === "3x3" && <Grid3x3 grid={grid} spinning={spinning} allSymbols={allSymbols} theme={theme} winningCells={winningCells} />}
        {engine === "5x3" && <Grid5x3 grid={grid} spinning={spinning} allSymbols={allSymbols} theme={theme} winningCells={winningCells} />}
        {engine === "cluster" && <GridCluster grid={grid} spinning={spinning} allSymbols={allSymbols} theme={theme} currentCascade={cascadeStep} winningCells={winningCells} />}
      </div>

      {/* Win display */}
      {lastResult && !spinning && (
        <div style={{
          textAlign: "center", marginBottom: 20, padding: "14px 20px",
          borderRadius: 12,
          background: lastResult.payout > 0
            ? `linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.1))`
            : "rgba(248,113,113,0.06)",
          border: `1px solid ${lastResult.payout > 0 ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.2)"}`,
        }}>
          {lastResult.payout > 0 ? (
            <>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#4ade80", textShadow: "0 0 20px rgba(74,222,128,0.5)" }}>
                +${lastResult.payout.toFixed(2)}
              </div>
              <div style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>
                {lastResult.multiplier.toFixed(2)}x total · {cascades.length > 0 ? `${cascades.length} cascade${cascades.length > 1 ? "s" : ""}` : `${winLines.length} line${winLines.length > 1 ? "s" : ""}`}
              </div>
            </>
          ) : (
            <div style={{ color: "#676D7C", fontSize: 16 }}>No win — try again!</div>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", marginBottom: 6, letterSpacing: 1 }}>Bet ($)</div>
          <input
            type="number" value={bet} onChange={e => setBet(e.target.value)} min="0.01" step="0.01"
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(15,17,26,0.8)", color: "#fff", fontSize: 16, boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 22 }}>
          {["½", "2×", "Max"].map(label => (
            <button key={label} onClick={() => {
              const v = parseFloat(bet) || 1;
              if (label === "½") setBet((v * 0.5).toFixed(2));
              else if (label === "2×") setBet((v * 2).toFixed(2));
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
          width: "100%", padding: "18px", borderRadius: 12, border: "none",
          background: spinning ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
          color: spinning ? "#676D7C" : "#fff", fontSize: 20, fontWeight: 800,
          cursor: spinning ? "not-allowed" : "pointer", transition: "all 0.2s", marginBottom: 24,
          letterSpacing: 2, textShadow: spinning ? "none" : "0 2px 8px rgba(0,0,0,0.4)",
          boxShadow: spinning ? "none" : `0 6px 24px ${theme.glow}, 0 0 0 1px rgba(255,255,255,0.1) inset`,
        }}
      >
        {spinning ? "🎰 SPINNING..." : `${theme.accent} SPIN`}
      </button>

      {/* Paytable */}
      {paytable.length > 0 && (
        <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(15,17,26,0.55)", marginBottom: 20, backdropFilter: "blur(8px)" }}>
          <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Paytable</div>
          <div style={{ display: "grid", gridTemplateColumns: engine === "5x3" ? "repeat(2, 1fr)" : "repeat(2, 1fr)", gap: "8px 16px" }}>
            {paytable.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <span style={{ fontSize: 24 }}>{s.emoji}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11 }}>
                  {engine === "5x3" ? (
                    <>
                      <span style={{ color: theme.primary, fontWeight: 700 }}>×5 = {s.pay5}x</span>
                      <span style={{ color: "#aaa" }}>×4 = {s.pay4}x · ×3 = {s.pay3}x</span>
                      {s.wild && <span style={{ color: "#facc15", fontSize: 9 }}>WILD</span>}
                    </>
                  ) : engine === "cluster" ? (
                    <span style={{ color: theme.primary, fontWeight: 700 }}>
                      5 = {s.payCluster?.[5]}x · 10+ = {s.payCluster?.[10]}x
                    </span>
                  ) : (
                    <>
                      <span style={{ color: theme.primary, fontWeight: 700 }}>×3 = {s.pay3}x</span>
                      {s.pay2 > 0 && <span style={{ color: "#aaa" }}>×2 = {s.pay2}x</span>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotsGame;
