import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ─── Countdown hook ────────────────────────────────────────────────────────
function useCountdown(isoTarget) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!isoTarget) { setLabel(""); return; }
    const tick = () => {
      const diff = new Date(isoTarget).getTime() - Date.now();
      if (diff <= 0) { setLabel(""); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setLabel(`${h}h ${String(m).padStart(2,"0")}m`);
      else setLabel(`${m}m ${String(s).padStart(2,"0")}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isoTarget]);
  return label;
}

// ─── Single reward row ─────────────────────────────────────────────────────
function RewardRow({ emoji, name, desc, amountLabel, canClaim, nextClaimAt, onClaim, loading, accentColor = "#86F454", type }) {
  const countdown = useCountdown(nextClaimAt);

  const isAccumulated = type === "rakeback" || type === "rollback";

  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "11px 12px",
      borderRadius: 10,
      marginBottom: 6,
      background: canClaim
        ? `linear-gradient(135deg, ${accentColor}0d, rgba(255,255,255,0.02))`
        : "rgba(255,255,255,0.02)",
      border: canClaim
        ? `1px solid ${accentColor}33`
        : "1px solid rgba(255,255,255,0.06)",
      transition: "all 0.2s",
      gap: 10,
    }}>
      {/* Emoji icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${accentColor}18`,
        border: `1px solid ${accentColor}33`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
        filter: canClaim ? "none" : "grayscale(0.6) opacity(0.5)",
        transition: "filter 0.2s",
      }}>
        {emoji}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{name}</div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 2, lineHeight: 1.3 }}>
          {canClaim
            ? <span style={{ color: accentColor, fontWeight: 600 }}>{amountLabel}</span>
            : countdown
            ? <span>🕐 {countdown}</span>
            : isAccumulated && !canClaim
            ? <span>Accumulating…</span>
            : <span>{desc}</span>
          }
        </div>
      </div>

      {/* Button */}
      <button
        onClick={onClaim}
        disabled={!canClaim || loading}
        style={{
          flexShrink: 0,
          padding: "7px 13px",
          borderRadius: 8, border: "none",
          cursor: canClaim && !loading ? "pointer" : "not-allowed",
          fontSize: 11, fontWeight: 800,
          letterSpacing: 0.5, textTransform: "uppercase",
          background: canClaim
            ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
            : "rgba(255,255,255,0.06)",
          color: canClaim ? "#000" : "#444",
          boxShadow: canClaim ? `0 3px 12px ${accentColor}55` : "none",
          transition: "all 0.2s",
          opacity: loading ? 0.7 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {loading ? "…" : canClaim ? "CLAIM" : "—"}
      </button>
    </div>
  );
}

// ─── Weekly wager progress bar ─────────────────────────────────────────────
const TIERS = [
  { min: 10,   reward: 0.50, label: "$10"   },
  { min: 50,   reward: 2.00, label: "$50"   },
  { min: 200,  reward: 5.00, label: "$200"  },
  { min: 500,  reward: 15.00,label: "$500"  },
  { min: 2000, reward: 50.00,label: "$2000" },
];

function WeeklyProgress({ wager = 0, nextTierAt }) {
  const currentTier = [...TIERS].reverse().find(t => wager >= t.min);
  const pct = nextTierAt ? Math.min(100, (wager / nextTierAt) * 100) : 100;

  return (
    <div style={{ margin: "4px 0 2px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555", marginBottom: 4 }}>
        <span>Wagered this week: <strong style={{ color: "#aaa" }}>${wager.toFixed(2)}</strong></span>
        {nextTierAt && <span>Next: ${nextTierAt}</span>}
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2,
          width: `${pct}%`,
          background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
          transition: "width 0.4s",
        }} />
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        {TIERS.map(t => (
          <div key={t.min} style={{
            flex: 1, textAlign: "center", fontSize: 9,
            color: wager >= t.min ? "#fbbf24" : "#333",
            fontWeight: wager >= t.min ? 700 : 400,
          }}>+${t.reward}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function Model1() {
  const { user, fetchUserProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState({});

  const fetchAll = useCallback(async () => {
    if (!user?.isAuthenticated) return;
    try {
      const res = await fetch(`${API}/api/bonus/all`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setData(json);
    } catch {}
  }, [user?.isAuthenticated]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const claim = async (type) => {
    setLoading(l => ({ ...l, [type]: true }));
    try {
      const res = await fetch(`${API}/api/bonus/${type}/claim`, {
        method: "POST", credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`+$${json.amount.toFixed(2)} claimed! 🎉`, { duration: 3500 });
        fetchAll();
        fetchUserProfile?.();
      } else {
        toast.error(json.error || "Failed to claim");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(l => ({ ...l, [type]: false }));
    }
  };

  if (!user?.isAuthenticated) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center", color: "#555", fontSize: 13 }}>
        Log in to access rewards
      </div>
    );
  }

  const d = data;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>🎁 Your Rewards</div>
        <button onClick={fetchAll} style={{
          background: "none", border: "none", color: "#555",
          cursor: "pointer", fontSize: 12,
        }} title="Refresh">↻</button>
      </div>

      {/* Daily Bonus */}
      <RewardRow
        emoji="📅"
        name="Daily Bonus"
        desc="Claim every 24 hours"
        amountLabel={`$1.00 ready!`}
        canClaim={d?.daily?.canClaim ?? false}
        nextClaimAt={d?.daily?.nextClaimAt}
        onClaim={() => claim("daily")}
        loading={loading.daily}
        accentColor="#4ade80"
        type="daily"
      />

      {/* Weekly Bonus */}
      <div style={{
        borderRadius: 10, marginBottom: 6,
        background: d?.weekly?.canClaim ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.02)",
        border: d?.weekly?.canClaim ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(255,255,255,0.06)",
        padding: "11px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: d != null ? 8 : 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            filter: d?.weekly?.canClaim ? "none" : "grayscale(0.5) opacity(0.6)",
          }}>📆</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Weekly Bonus</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
              {d?.weekly?.canClaim
                ? <span style={{ color: "#fbbf24", fontWeight: 600 }}>${(d.weekly.amount || 0).toFixed(2)} ready!</span>
                : d?.weekly?.nextClaimAt
                ? <span>🕐 {new Date(d.weekly.nextClaimAt) > new Date() ? "Cooldown active" : "Ready"}</span>
                : "Wager to unlock"
              }
            </div>
          </div>
          <button
            onClick={() => claim("weekly")}
            disabled={!d?.weekly?.canClaim || loading.weekly}
            style={{
              flexShrink: 0, padding: "7px 13px", borderRadius: 8, border: "none",
              cursor: d?.weekly?.canClaim && !loading.weekly ? "pointer" : "not-allowed",
              fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase",
              background: d?.weekly?.canClaim ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "rgba(255,255,255,0.06)",
              color: d?.weekly?.canClaim ? "#000" : "#444",
              boxShadow: d?.weekly?.canClaim ? "0 3px 12px rgba(245,158,11,0.4)" : "none",
              opacity: loading.weekly ? 0.7 : 1,
            }}
          >{loading.weekly ? "…" : d?.weekly?.canClaim ? "CLAIM" : "—"}</button>
        </div>
        {d != null && (
          <WeeklyProgress wager={d.weekly?.weeklyWager || 0} nextTierAt={d.weekly?.nextTierAt} />
        )}
      </div>

      {/* Rakeback */}
      <RewardRow
        emoji="💸"
        name="Rakeback"
        desc="5% of your losses returned"
        amountLabel={`$${(d?.rakeback?.pending || 0).toFixed(2)} pending`}
        canClaim={d?.rakeback?.canClaim ?? false}
        onClaim={() => claim("rakeback")}
        loading={loading.rakeback}
        accentColor="#a78bfa"
        type="rakeback"
      />

      {/* Rollback */}
      <RewardRow
        emoji="🔄"
        name="Rollback"
        desc="0.3% of all wagers returned"
        amountLabel={`$${(d?.rollback?.pending || 0).toFixed(2)} pending`}
        canClaim={d?.rollback?.canClaim ?? false}
        onClaim={() => claim("rollback")}
        loading={loading.rollback}
        accentColor="#60a5fa"
        type="rollback"
      />

      {/* Free Sidebet */}
      <RewardRow
        emoji="🎲"
        name="Free Sidebet"
        desc="$0.50 credit every 7 days"
        amountLabel="$0.50 ready!"
        canClaim={d?.freeSidebet?.canClaim ?? false}
        nextClaimAt={d?.freeSidebet?.nextClaimAt}
        onClaim={() => claim("free-sidebet")}
        loading={loading["free-sidebet"]}
        accentColor="#f472b6"
        type="freeSidebet"
      />

      {/* Footer info */}
      <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 10, color: "#444", lineHeight: 1.8 }}>
          <div>📅 Daily: $1 every 24h</div>
          <div>📆 Weekly: up to $50 based on wager volume</div>
          <div>💸 Rakeback: 5% of losses · auto-accumulates</div>
          <div>🔄 Rollback: 0.3% of all bets · auto-accumulates</div>
          <div>🎲 Free Sidebet: $0.50 credit every 7 days</div>
        </div>
      </div>
    </div>
  );
}
