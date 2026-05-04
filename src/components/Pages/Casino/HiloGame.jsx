import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/utils/toastUtils";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const SUIT_COLOR = { "♠": "#fff", "♣": "#fff", "♥": "#ef4444", "♦": "#ef4444" };

// ── Card component ────────────────────────────────────────────────────────────
function Card({ card, small = false, faceDown = false, glow = null }) {
  const size = small
    ? { w: 52, h: 74, font: 14, suitFont: 20 }
    : { w: 90, h: 126, font: 22, suitFont: 40 };

  if (faceDown) return (
    <div style={{
      width: size.w, height: size.h, borderRadius: 8,
      background: "linear-gradient(135deg, #1a1d2e, #0d0f1a)",
      border: "1px solid rgba(139,92,246,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size.suitFont, flexShrink: 0,
    }}>🂠</div>
  );

  const color = card ? SUIT_COLOR[card.suit] : "#fff";
  const glowStyle = glow
    ? { boxShadow: `0 0 20px ${glow}88, 0 0 40px ${glow}44` }
    : {};

  return (
    <div style={{
      width: size.w, height: size.h, borderRadius: 8,
      background: "linear-gradient(160deg, #1e2035 0%, #12141f 100%)",
      border: `1px solid ${glow ? glow + "66" : "rgba(255,255,255,0.1)"}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      flexShrink: 0, position: "relative",
      transition: "box-shadow 0.3s",
      ...glowStyle,
    }}>
      {card && <>
        <div style={{ position: "absolute", top: 6, left: 8, color, fontSize: size.font - 4, fontWeight: 900, lineHeight: 1 }}>{card.rank}</div>
        <div style={{ color, fontSize: size.suitFont, lineHeight: 1 }}>{card.suit}</div>
        <div style={{ position: "absolute", bottom: 6, right: 8, color, fontSize: size.font - 4, fontWeight: 900, lineHeight: 1, transform: "rotate(180deg)" }}>{card.rank}</div>
      </>}
    </div>
  );
}

// ── Guess button ──────────────────────────────────────────────────────────────
function GuessBtn({ label, emoji, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: "14px 0", borderRadius: 10, border: `1px solid ${color}44`,
      background: `${color}11`, color, fontWeight: 800, fontSize: 14,
      cursor: disabled ? "not-allowed" : "pointer", letterSpacing: 0.5,
      transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = color + "33"; e.currentTarget.style.boxShadow = `0 4px 20px ${color}44`; } }}
    onMouseLeave={e => { if (!disabled) { e.currentTarget.style.background = color + "11"; e.currentTarget.style.boxShadow = "none"; } }}
    >
      {emoji} {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const HiloGame = () => {
  const { user, fetchUserProfile } = useAuth();
  const [betAmount, setBetAmount] = useState(1);
  const [phase, setPhase]   = useState("idle");   // idle | playing | result
  const [cards, setCards]   = useState([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [potentialWin, setPotentialWin] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [history, setHistory] = useState([]);
  const [animCard, setAnimCard] = useState(null); // card being revealed

  const busy = pending;

  const loadState = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND}/api/hilo/state`, { credentials: "include" });
      const d = await r.json();
      if (d.success && d.game) {
        setCards(d.game.cards);
        setCurrentMultiplier(d.game.currentMultiplier);
        setPotentialWin(d.game.potentialWin);
        setBetAmount(d.game.betAmount);
        setPhase("playing");
      }
    } catch (_) {}
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND}/api/hilo/history?limit=10`, { credentials: "include" });
      const d = await r.json();
      if (d.success) setHistory(d.games);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (user?.isAuthenticated) {
      loadState();
      loadHistory();
    }
  }, [user?.isAuthenticated, loadState, loadHistory]);

  const startGame = async () => {
    if (!user?.isAuthenticated) { showToast("Log in to play", "error"); return; }
    if (betAmount <= 0) { showToast("Enter a valid bet", "error"); return; }
    setPending(true);
    try {
      const res = await fetch(`${BACKEND}/api/hilo/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ betAmount }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error || "Failed to start", "error"); return; }
      setCards([data.firstCard]);
      setCurrentMultiplier(1);
      setPotentialWin(betAmount);
      setLastResult(null);
      setPhase("playing");
    } catch { showToast("Connection error", "error"); }
    finally { setPending(false); }
  };

  const guess = async (g) => {
    if (phase !== "playing") return;
    setPending(true);
    try {
      const res = await fetch(`${BACKEND}/api/hilo/guess`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ guess: g }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error || "Error", "error"); return; }

      setAnimCard(data.nextCard);
      setTimeout(() => setAnimCard(null), 600);

      if (data.won) {
        setCards(data.cards);
        setCurrentMultiplier(data.currentMultiplier);
        setPotentialWin(data.potentialWin);
      } else {
        setCards(data.cards);
        setPhase("result");
        setLastResult({ won: false });
        fetchUserProfile && fetchUserProfile();
        showToast(`💀 Wrong guess — lost $${betAmount.toFixed(2)}`, "error");
        loadHistory();
      }
    } catch { showToast("Connection error", "error"); }
    finally { setPending(false); }
  };

  const cashout = async () => {
    setPending(true);
    try {
      const res = await fetch(`${BACKEND}/api/hilo/cashout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error || "Error", "error"); return; }
      setPhase("result");
      setLastResult({ won: true, profit: data.profit, multiplier: data.multiplier });
      fetchUserProfile && fetchUserProfile();
      showToast(`🎉 Cashed out $${data.profit.toFixed(2)} (${data.multiplier}×)!`, "success");
      loadHistory();
    } catch { showToast("Connection error", "error"); }
    finally { setPending(false); }
  };

  const currentCard = cards[cards.length - 1];

  // Odds display for current card
  function odds(g) {
    if (!currentCard) return "—";
    const v = currentCard.value;
    let count = g === "higher" ? (13 - v) * 4 : g === "lower" ? (v - 1) * 4 : 4;
    if (count <= 0) return "0%";
    const chance = (count / 52 * 100).toFixed(0);
    const mult = ((1 - 0.01) / (count / 52)).toFixed(2);
    return `${chance}% · ${mult}×`;
  }

  return (
    <div style={{ minHeight: "100vh", padding: "80px 0 40px", background: "linear-gradient(180deg,#05060d,#080a14)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 3, height: 22, background: "linear-gradient(180deg,#a78bfa,#ec4899)", borderRadius: 2 }} />
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 1, margin: 0 }}>HI-LO</h1>
          <span style={{ fontSize: 11, color: "#a78bfa", background: "rgba(124,58,237,0.15)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(124,58,237,0.3)", fontWeight: 700 }}>
            PROVABLY FAIR
          </span>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

          {/* Left */}
          <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Bet */}
            <div style={{ padding: 16, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Bet Amount</label>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input type="number" value={betAmount} onChange={e => setBetAmount(parseFloat(e.target.value) || 0)}
                  disabled={phase === "playing" || busy}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "rgba(15,17,26,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontWeight: 700, outline: "none" }}
                  step="0.01" min="0.01" />
                <button onClick={() => setBetAmount(v => parseFloat((v / 2).toFixed(2)))} disabled={phase === "playing" || busy}
                  style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", cursor: "pointer", fontSize: 13 }}>½</button>
                <button onClick={() => setBetAmount(v => parseFloat((v * 2).toFixed(2)))} disabled={phase === "playing" || busy}
                  style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", cursor: "pointer", fontSize: 13 }}>2×</button>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                {[0.1, 0.5, 1, 5, 10].map(p => (
                  <button key={p} onClick={() => setBetAmount(p)} disabled={phase === "playing" || busy}
                    style={{ padding: "4px 8px", borderRadius: 6, background: betAmount === p ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)", border: `1px solid ${betAmount === p ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, color: betAmount === p ? "#a78bfa" : "#676D7C", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                    ${p}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            {phase === "playing" && (
              <div style={{ padding: 16, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ color: "#676D7C", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Current Game</div>
                {[
                  { label: "Multiplier", value: `${currentMultiplier}×`, color: "#a78bfa" },
                  { label: "Potential Win", value: `$${potentialWin.toFixed(2)}`, color: "#4ade80" },
                  { label: "Cards Drawn", value: cards.length, color: "#60a5fa" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ color: "#555", fontSize: 10, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                    <div style={{ color, fontSize: 16, fontWeight: 800 }}>{value}</div>
                  </div>
                ))}
                <button onClick={cashout} disabled={busy || cards.length < 2}
                  style={{ width: "100%", marginTop: 4, padding: "10px 0", borderRadius: 8, border: "none", background: cards.length < 2 ? "rgba(74,222,128,0.1)" : "rgba(74,222,128,0.2)", color: "#4ade80", fontWeight: 800, fontSize: 14, cursor: busy || cards.length < 2 ? "not-allowed" : "pointer", borderTop: "1px solid rgba(74,222,128,0.3)" }}>
                  💰 Cash Out ${potentialWin.toFixed(2)}
                </button>
              </div>
            )}

            {/* Start / New game button */}
            {(phase === "idle" || phase === "result") && (
              <button onClick={startGame} disabled={busy}
                style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: busy ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 900, fontSize: 15, cursor: busy ? "not-allowed" : "pointer", letterSpacing: 1, boxShadow: busy ? "none" : "0 6px 24px rgba(124,58,237,0.4)" }}>
                {phase === "result" ? "🎴 NEW GAME" : "🎴 DEAL CARD"}
              </button>
            )}

            {/* Result banner */}
            {phase === "result" && lastResult && (
              <div style={{ padding: 16, borderRadius: 12, textAlign: "center", background: lastResult.won ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${lastResult.won ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                {lastResult.won ? (
                  <>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80" }}>${lastResult.profit?.toFixed(2)}</div>
                    <div style={{ color: "#a78bfa", fontSize: 13, marginTop: 4 }}>{lastResult.multiplier}× multiplier</div>
                  </>
                ) : (
                  <div style={{ fontSize: 22, color: "#ef4444", fontWeight: 900 }}>💀 BUSTED</div>
                )}
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(12,14,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent</div>
                {history.slice(0, 6).map((g, i) => (
                  <div key={g.id || i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: "rgba(15,17,26,0.5)", marginBottom: 3 }}>
                    <span style={{ color: "#aaa", fontSize: 12 }}>{g.result?.cards?.length || "—"} cards</span>
                    <span style={{ color: g.multiplier > 1 ? "#a78bfa" : "#555", fontSize: 12 }}>{g.multiplier}×</span>
                    <span style={{ color: g.profit >= 0 ? "#4ade80" : "#f87171", fontSize: 12, fontWeight: 700 }}>
                      {g.profit >= 0 ? "+" : ""}{g.profit?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — card area */}
          <div style={{ flex: 1, minWidth: 280 }}>

            {/* Cards display */}
            <div style={{ padding: "28px 20px", borderRadius: 16, background: "rgba(10,12,22,0.95)", border: "1px solid rgba(139,92,246,0.15)", marginBottom: 16, minHeight: 200, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>

              {phase === "idle" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180 }}>
                  <div style={{ textAlign: "center", color: "#333" }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🃏</div>
                    <div style={{ fontSize: 14 }}>Place a bet to start</div>
                  </div>
                </div>
              )}

              {(phase === "playing" || phase === "result") && (
                <>
                  {/* Card trail */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "nowrap", overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
                    {cards.slice(-6).map((c, i, arr) => (
                      <Card
                        key={i}
                        card={c}
                        small={i < arr.length - 1}
                        glow={i === arr.length - 1 ? (phase === "result" && !lastResult?.won ? "#ef4444" : "#a78bfa") : null}
                      />
                    ))}
                    {/* Next card slot */}
                    {phase === "playing" && (
                      animCard
                        ? <Card card={animCard} small={false} glow="#4ade80" />
                        : <Card faceDown />
                    )}
                  </div>

                  {/* Current card info */}
                  {currentCard && phase === "playing" && (
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                      <span style={{ color: "#676D7C", fontSize: 12 }}>Current card: </span>
                      <span style={{ color: SUIT_COLOR[currentCard.suit], fontWeight: 800, fontSize: 14 }}>
                        {currentCard.rank}{currentCard.suit} (value {currentCard.value})
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Guess buttons */}
            {phase === "playing" && (
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <GuessBtn label="Higher" emoji="⬆️" color="#4ade80"
                  onClick={() => guess("higher")} disabled={busy}
                  title={odds("higher")} />
                <GuessBtn label="Equal" emoji="🟰" color="#f59e0b"
                  onClick={() => guess("equal")} disabled={busy} />
                <GuessBtn label="Lower" emoji="⬇️" color="#ef4444"
                  onClick={() => guess("lower")} disabled={busy} />
              </div>
            )}

            {/* Odds row */}
            {phase === "playing" && currentCard && (
              <div style={{ display: "flex", gap: 8 }}>
                {[["higher", "#4ade80"], ["equal", "#f59e0b"], ["lower", "#ef4444"]].map(([g, color]) => (
                  <div key={g} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "rgba(12,14,24,0.8)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                    <div style={{ color: "#555", fontSize: 9, textTransform: "uppercase", marginBottom: 3 }}>{g}</div>
                    <div style={{ color, fontSize: 11, fontWeight: 700 }}>{odds(g)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HiloGame;
