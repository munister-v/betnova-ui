import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

function useCountdown(targetIso) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!targetIso) { setLeft(0); return; }
    const update = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      setLeft(Math.max(0, diff));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!left) return null;
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export default function DailyBonus() {
  const { user, fetchUserProfile } = useAuth();
  const [status, setStatus] = useState(null); // { canClaim, nextClaimAt, amount }
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const countdown = useCountdown(status?.nextClaimAt);

  const fetchStatus = useCallback(async () => {
    if (!user?.isAuthenticated) return;
    try {
      const res = await fetch(`${API}/api/bonus/daily/status`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setStatus(data);
    } catch {/* ignore */}
  }, [user?.isAuthenticated]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Re-check when countdown hits 0
  useEffect(() => {
    if (status && !status.canClaim && !countdown) {
      // Timer expired — refresh status
      setTimeout(fetchStatus, 500);
    }
  }, [countdown, status, fetchStatus]);

  const handleClaim = async () => {
    if (loading || !status?.canClaim) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/bonus/daily/claim`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setClaimed(true);
        setStatus({ canClaim: false, nextClaimAt: data.nextClaimAt, amount: data.amount });
        toast.success(`🎁 Daily bonus claimed! +$${data.amount.toFixed(2)}`, { duration: 4000 });
        if (fetchUserProfile) fetchUserProfile();
        setTimeout(() => setClaimed(false), 3000);
      } else {
        toast.error(data.error || "Failed to claim");
        fetchStatus();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAuthenticated) return null;
  if (!status) return null;

  const canClaim = status.canClaim;

  return (
    <div style={{
      background: canClaim
        ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))"
        : "rgba(255,255,255,0.03)",
      border: canClaim
        ? "1px solid rgba(34,197,94,0.4)"
        : "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      transition: "all 0.3s",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow pulse when claimable */}
      {canClaim && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          background: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.2), transparent 70%)",
          animation: "bonusPulse 2s ease-in-out infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* Left: icon + text */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
        <div style={{
          fontSize: 28,
          filter: canClaim ? "drop-shadow(0 0 10px rgba(34,197,94,0.8))" : "grayscale(0.6) opacity(0.5)",
          transition: "filter 0.3s",
        }}>
          🎁
        </div>
        <div>
          <div style={{ color: canClaim ? "#4ade80" : "#aaa", fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
            Daily Bonus
          </div>
          <div style={{ color: "#676D7C", fontSize: 11, marginTop: 2 }}>
            {canClaim
              ? `$${status.amount?.toFixed(2)} ready to claim!`
              : countdown
              ? `Next in ${countdown}`
              : "Checking..."}
          </div>
        </div>
      </div>

      {/* Right: button */}
      <button
        onClick={handleClaim}
        disabled={!canClaim || loading}
        style={{
          zIndex: 1,
          padding: "9px 20px",
          borderRadius: 8,
          border: "none",
          cursor: canClaim ? "pointer" : "not-allowed",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: 0.5,
          transition: "all 0.2s",
          background: claimed
            ? "linear-gradient(135deg, #22c55e, #16a34a)"
            : canClaim
            ? "linear-gradient(135deg, #22c55e, #10b981)"
            : "rgba(255,255,255,0.05)",
          color: canClaim ? "#fff" : "#555",
          boxShadow: canClaim && !claimed ? "0 4px 16px rgba(34,197,94,0.4)" : "none",
          transform: canClaim && !loading ? "scale(1)" : "scale(0.97)",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={e => canClaim && (e.target.style.transform = "scale(1.05)")}
        onMouseLeave={e => e.target.style.transform = "scale(1)"}
      >
        {claimed ? "✓ Claimed!" : loading ? "..." : canClaim ? "Claim $1" : "Claimed"}
      </button>

      <style>{`
        @keyframes bonusPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
