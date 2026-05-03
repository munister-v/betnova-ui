import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { StyledPageContainer } from "../Casino/styles";
import { ReactComponent as JACKPOT_IMG } from "../../../assets/images/svg.svg";
import PageTitle from "../../Common/PageTitle/PageTitle";
import { onSocketEvent, offSocketEvent } from "@/lib/websocket";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

function useCountdown(endsAt) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(endsAt) - Date.now()) / 1000));
      setSeconds(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return seconds;
}

function SpinningWheel({ entries, spinning, winner }) {
  const total = entries.reduce((s, e) => s + e.amount, 0);
  if (!entries.length) return (
    <div style={{ width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#676D7C", fontSize: 13 }}>
      Waiting for players...
    </div>
  );

  let startAngle = 0;
  const COLORS = ["#2563eb","#7c3aed","#db2777","#ea580c","#16a34a","#0891b2","#d97706","#dc2626"];

  return (
    <div style={{ position: "relative", width: 220, height: 220 }}>
      <svg width="220" height="220" style={{ animation: spinning ? "spin 0.5s linear infinite" : "none" }}>
        <style>{"@keyframes spin { from { transform: rotate(0deg); transform-origin: 110px 110px; } to { transform: rotate(360deg); transform-origin: 110px 110px; } }"}</style>
        {entries.map((entry, i) => {
          const pct = entry.amount / total;
          const angle = pct * 2 * Math.PI;
          const x1 = 110 + 100 * Math.cos(startAngle);
          const y1 = 110 + 100 * Math.sin(startAngle);
          const x2 = 110 + 100 * Math.cos(startAngle + angle);
          const y2 = 110 + 100 * Math.sin(startAngle + angle);
          const large = angle > Math.PI ? 1 : 0;
          const path = `M110,110 L${x1},${y1} A100,100 0 ${large},1 ${x2},${y2} Z`;
          const midAngle = startAngle + angle / 2;
          startAngle += angle;
          return (
            <g key={entry.userId}>
              <path d={path} fill={COLORS[i % COLORS.length]} opacity={winner?.userId === entry.userId ? 1 : 0.7} />
              {pct > 0.08 && (
                <text
                  x={110 + 65 * Math.cos(midAngle)} y={110 + 65 * Math.sin(midAngle)}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="#fff" fontSize="10" fontWeight="600"
                >
                  {entry.username?.slice(0, 6)}
                </text>
              )}
            </g>
          );
        })}
        <circle cx="110" cy="110" r="30" fill="rgba(15,17,26,0.95)" />
        <text x="110" y="115" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
          {total > 0 ? `$${total.toFixed(0)}` : ""}
        </text>
      </svg>
      {/* Arrow */}
      <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", color: "#f59e0b", fontSize: 20 }}>▼</div>
    </div>
  );
}

const Jackpot = () => {
  const { user } = useAuth();
  const [round, setRound] = useState(null);
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [lastWinner, setLastWinner] = useState(null);
  const seconds = useCountdown(round?.endsAt);

  const fetchRound = useCallback(async () => {
    const res = await fetch(`${BACKEND}/api/jackpot/current`, { credentials: "include" }).then(r => r.json());
    if (res.success) setRound(res.round);
  }, []);

  useEffect(() => {
    fetchRound();
    const onUpdate = (data) => setRound(data);
    const onWinner = (data) => {
      setSpinning(true);
      setTimeout(() => {
        setSpinning(false);
        setLastWinner(data);
        toast.success(`🏆 ${data.winner?.username} won $${data.payout?.toFixed(2)}!`);
      }, 3000);
    };
    const onNew = (data) => { setRound(data); setLastWinner(null); };
    const onCancelled = () => toast.info("Round cancelled — not enough players");

    onSocketEvent("jackpot:update", onUpdate);
    onSocketEvent("jackpot:winner", onWinner);
    onSocketEvent("jackpot:new_round", onNew);
    onSocketEvent("jackpot:cancelled", onCancelled);
    return () => {
      offSocketEvent("jackpot:update", onUpdate);
      offSocketEvent("jackpot:winner", onWinner);
      offSocketEvent("jackpot:new_round", onNew);
      offSocketEvent("jackpot:cancelled", onCancelled);
    };
  }, [fetchRound]);

  const handleEnter = async () => {
    if (!user?.isAuthenticated) return toast.error("Login to play");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Invalid amount");
    setLoading(true);
    const res = await fetch(`${BACKEND}/api/jackpot/enter`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt }),
    }).then(r => r.json());
    setLoading(false);
    if (!res.success) return toast.error(res.error || "Error");
    setRound(res.round);
    toast.success(`Entered $${amt}!`);
  };

  const entries = round?.entries || [];
  const totalPool = round?.totalPool || 0;
  const myEntry = entries.find(e => e.userId === user?.id);

  return (
    <StyledPageContainer>
      <PageTitle icon={JACKPOT_IMG} title="Jackpot" />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, color: "#fff" }}>

        {/* Winner banner */}
        {lastWinner && (
          <div style={{ textAlign: "center", padding: "16px 24px", borderRadius: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>🏆 {lastWinner.winner?.username} won!</div>
            <div style={{ color: "#aaa", fontSize: 14, marginTop: 4 }}>Prize: <span style={{ color: "#4ade80", fontWeight: 600 }}>${lastWinner.payout?.toFixed(2)}</span> from a ${lastWinner.totalPool?.toFixed(2)} pool</div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {/* Wheel */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: 24, borderRadius: 16, background: "rgba(15,17,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <SpinningWheel entries={entries} spinning={spinning} winner={lastWinner?.winner} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>${totalPool.toFixed(2)}</div>
              <div style={{ color: "#676D7C", fontSize: 12 }}>Total Pool</div>
            </div>
            {round?.status === "open" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: seconds <= 10 ? 22 : 16, fontWeight: 700, color: seconds <= 10 ? "#f87171" : "#fff" }}>
                  {seconds > 0 ? `⏱ ${seconds}s` : entries.length < 2 ? "Waiting for 2+ players" : "Drawing..."}
                </div>
                <div style={{ color: "#676D7C", fontSize: 11 }}>{entries.length} player{entries.length !== 1 ? "s" : ""}</div>
              </div>
            )}
          </div>

          {/* Enter + stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "20px", borderRadius: 12, background: "rgba(15,17,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", marginBottom: 10 }}>Enter Jackpot</div>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" step="0.01"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(10,12,20,0.8)", color: "#fff", fontSize: 16, boxSizing: "border-box", marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {["1", "5", "10", "50"].map(v => (
                  <button key={v} onClick={() => setAmount(v)} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#aaa", fontSize: 12, cursor: "pointer" }}>${v}</button>
                ))}
              </div>
              <button onClick={handleEnter} disabled={loading || round?.status !== "open"} style={{
                width: "100%", padding: 14, borderRadius: 10, border: "none",
                background: round?.status !== "open" ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #f59e0b, #ef4444)",
                color: round?.status !== "open" ? "#676D7C" : "#fff",
                fontSize: 15, fontWeight: 700, cursor: round?.status !== "open" ? "not-allowed" : "pointer",
              }}>{loading ? "Entering..." : "🎰 Enter Jackpot"}</button>
            </div>

            {myEntry && (
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", marginBottom: 8 }}>Your Entry</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#f59e0b", fontWeight: 600 }}>${myEntry.amount.toFixed(2)}</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{myEntry.chance?.toFixed(1)}% chance</span>
                </div>
              </div>
            )}

            <div style={{ padding: "16px", borderRadius: 12, background: "rgba(15,17,26,0.55)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", marginBottom: 8 }}>How it works</div>
              <div style={{ color: "#aaa", fontSize: 12, lineHeight: 1.6 }}>
                • Every $1 = 1 ticket<br />
                • More tickets = higher chance<br />
                • Winner drawn after 60s<br />
                • Winner takes the pool minus 2% house edge
              </div>
            </div>
          </div>
        </div>

        {/* Players list */}
        {entries.length > 0 && (
          <div style={{ padding: 20, borderRadius: 12, background: "rgba(15,17,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Players</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...entries].sort((a, b) => b.amount - a.amount).map((entry, i) => {
                const COLORS = ["#2563eb","#7c3aed","#db2777","#ea580c","#16a34a","#0891b2","#d97706","#dc2626"];
                return (
                  <div key={entry.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, color: "#fff", fontSize: 14 }}>{entry.username}</span>
                    <span style={{ color: "#f59e0b", fontWeight: 600 }}>${entry.amount.toFixed(2)}</span>
                    <span style={{ color: "#676D7C", fontSize: 12, width: 50, textAlign: "right" }}>{entry.chance?.toFixed(1)}%</span>
                    <div style={{ width: 80, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${entry.chance}%`, background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </StyledPageContainer>
  );
};

export default Jackpot;
