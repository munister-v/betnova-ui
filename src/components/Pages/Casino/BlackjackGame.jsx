import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const SUIT_COLOR = { '♠': '#fff', '♣': '#fff', '♥': '#f87171', '♦': '#f87171' };

function Card({ card, faceDown = false }) {
  if (faceDown) return (
    <div style={{
      width: 64, height: 92, borderRadius: 8,
      background: "linear-gradient(135deg, #1e3a8a, #1e40af)",
      border: "2px solid rgba(255,255,255,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
    }}>🂠</div>
  );
  return (
    <div style={{
      width: 64, height: 92, borderRadius: 8, background: "#fff",
      border: "2px solid rgba(0,0,0,0.1)", display: "flex", flexDirection: "column",
      alignItems: "flex-start", justifyContent: "space-between", padding: "6px 8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)", color: SUIT_COLOR[card.suit],
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{card.rank}<br />{card.suit}</div>
      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1, transform: "rotate(180deg)" }}>{card.rank}<br />{card.suit}</div>
    </div>
  );
}

function Hand({ cards, label, total, hideSecond = false }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        {label} {total ? <span style={{ color: "#fff", fontWeight: 700 }}>— {total}</span> : ""}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {cards.map((card, i) =>
          hideSecond && i === 1
            ? <Card key={i} faceDown />
            : <Card key={i} card={card} />
        )}
      </div>
    </div>
  );
}

const RESULT_STYLE = {
  win:       { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.3)",  color: "#4ade80" },
  blackjack: { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.4)",  color: "#f59e0b" },
  push:      { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "#fff"    },
  lose:      { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", color: "#f87171" },
  bust:      { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", color: "#f87171" },
};

const BlackjackGame = () => {
  const { user, updateBalance } = useAuth();
  const [bet, setBet] = useState("1");
  const [gameId, setGameId] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerCard, setDealerCard] = useState(null);
  const [dealerHand, setDealerHand] = useState([]);
  const [playerTotal, setPlayerTotal] = useState(null);
  const [dealerTotal, setDealerTotal] = useState(null);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [payout, setPayout] = useState(null);
  const [canDouble, setCanDouble] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const api = async (endpoint, body) => {
    const res = await fetch(`${BACKEND}/api/blackjack/${endpoint}`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const endGame = (data) => {
    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setPlayerTotal(data.playerTotal);
    setDealerTotal(data.dealerTotal);
    setResult(data.result);
    setMessage(data.message);
    setPayout(data.payout);
    setGameId(null);
    setCanDouble(false);
    if (typeof updateBalance === "function" && data.payout !== undefined) {
      // balance updated server-side, just refresh
    }
    setHistory(prev => [{ result: data.result, payout: data.payout, bet: parseFloat(bet) }, ...prev].slice(0, 10));
  };

  const handleDeal = async () => {
    if (!user?.isAuthenticated) return toast.error("Login to play");
    const betAmount = parseFloat(bet);
    if (!betAmount || betAmount <= 0) return toast.error("Invalid bet");
    setLoading(true);
    setResult(null); setMessage(null); setPayout(null);
    setDealerHand([]); setPlayerHand([]); setDealerCard(null);

    const data = await api("deal", { betAmount });
    setLoading(false);
    if (!data.success) return toast.error(data.error || "Error");

    setGameId(data.gameId);
    setPlayerHand(data.playerHand);
    setPlayerTotal(data.playerTotal);
    setDealerCard(data.dealerCard);
    setCanDouble(data.canDouble);

    if (data.result) endGame(data); // immediate result (blackjack/push)
  };

  const handleHit = async () => {
    setLoading(true);
    const data = await api("hit", { gameId });
    setLoading(false);
    if (!data.success) return toast.error(data.error);
    setPlayerHand(data.playerHand);
    setPlayerTotal(data.playerTotal);
    setCanDouble(false);
    if (data.result) endGame(data);
  };

  const handleStand = async () => {
    setLoading(true);
    const data = await api("stand", { gameId });
    setLoading(false);
    if (!data.success) return toast.error(data.error);
    endGame(data);
  };

  const handleDouble = async () => {
    setLoading(true);
    const data = await api("double", { gameId });
    setLoading(false);
    if (!data.success) return toast.error(data.error);
    endGame(data);
  };

  const isPlaying = !!gameId;
  const rs = result ? RESULT_STYLE[result] || RESULT_STYLE.lose : null;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: 20, color: "#fff" }}>
      <h2 style={{ textAlign: "center", marginBottom: 4, fontSize: 28, fontWeight: 700 }}>🃏 Blackjack</h2>
      <p style={{ textAlign: "center", color: "#676D7C", marginBottom: 24, fontSize: 13 }}>
        Dealer stands on soft 17 · Blackjack pays 3:2
      </p>

      {/* Table */}
      <div style={{ padding: 24, borderRadius: 16, background: "rgba(15,17,26,0.8)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
        {/* Dealer */}
        {(dealerHand.length > 0 || dealerCard) && (
          <Hand
            label="Dealer"
            cards={dealerHand.length > 0 ? dealerHand : [dealerCard, { rank: "?", suit: "?" }]}
            total={dealerTotal || "?"}
            hideSecond={isPlaying && dealerHand.length === 0}
          />
        )}

        {/* Divider */}
        {(playerHand.length > 0 || dealerCard) && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "16px 0" }} />
        )}

        {/* Player */}
        {playerHand.length > 0 && (
          <Hand label="You" cards={playerHand} total={playerTotal} />
        )}

        {/* Empty state */}
        {!isPlaying && playerHand.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#676D7C" }}>
            Place a bet and deal to start
          </div>
        )}
      </div>

      {/* Result */}
      {result && rs && (
        <div style={{
          textAlign: "center", padding: "16px 20px", borderRadius: 10, marginBottom: 20,
          background: rs.bg, border: `1px solid ${rs.border}`,
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: rs.color }}>{message}</div>
          {payout > 0 && (
            <div style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>
              Payout: <span style={{ color: "#4ade80", fontWeight: 600 }}>${payout.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      {!isPlaying && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", marginBottom: 6 }}>Bet ($)</div>
            <input type="number" value={bet} onChange={e => setBet(e.target.value)} min="0.01" step="0.01"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,17,26,0.8)", color: "#fff", fontSize: 16, boxSizing: "border-box" }} />
          </div>
          {["0.5x", "2x", "5", "25"].map(label => (
            <button key={label} onClick={() => {
              const v = parseFloat(bet) || 1;
              if (label === "0.5x") setBet((v * 0.5).toFixed(2));
              else if (label === "2x") setBet((v * 2).toFixed(2));
              else setBet(label);
            }} style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#aaa", fontSize: 12, cursor: "pointer" }}>{label}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {!isPlaying ? (
          <button onClick={handleDeal} disabled={loading} style={{
            flex: 1, padding: 16, borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff",
            fontSize: 17, fontWeight: 700, cursor: "pointer",
          }}>{loading ? "Dealing..." : "🃏 Deal"}</button>
        ) : (
          <>
            <button onClick={handleHit} disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Hit
            </button>
            <button onClick={handleStand} disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Stand
            </button>
            {canDouble && (
              <button onClick={handleDouble} disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", background: "#d97706", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Double
              </button>
            )}
          </>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent Hands</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {history.map((h, i) => (
              <div key={i} style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12,
                background: h.result === "win" || h.result === "blackjack" ? "rgba(74,222,128,0.1)" : h.result === "push" ? "rgba(255,255,255,0.05)" : "rgba(248,113,113,0.08)",
                color: h.result === "win" || h.result === "blackjack" ? "#4ade80" : h.result === "push" ? "#fff" : "#f87171",
              }}>
                {h.result === "win" || h.result === "blackjack" ? `+$${h.payout?.toFixed(2)}` : h.result === "push" ? "Push" : `-$${h.bet?.toFixed(2)}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlackjackGame;
