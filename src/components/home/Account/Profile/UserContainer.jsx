import React, { useEffect, useState } from "react";
import { StyledUserContainer } from "./styles";
import { useAuth } from "@/context/AuthContext";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

// XP thresholds per level (mirrors level_requirements in DB)
const XP_LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 250 },
  { level: 4, xp: 500 },
  { level: 5, xp: 1000 },
  { level: 10, xp: 5000 },
  { level: 20, xp: 20000 },
  { level: 30, xp: 60000 },
  { level: 50, xp: 200000 },
  { level: 100, xp: 1000000 },
];

function getProgress(xp, level) {
  const current = XP_LEVELS.find((l) => l.level === level) || XP_LEVELS[0];
  const nextEntry = XP_LEVELS.find((l) => l.level > level);
  if (!nextEntry) return { pct: 100, nextXp: null };
  const range = nextEntry.xp - current.xp;
  const earned = xp - current.xp;
  return {
    pct: Math.min(100, Math.round((earned / range) * 100)),
    nextXp: nextEntry.xp,
    nextLevel: nextEntry.level,
  };
}

// Simple SVG rank icon as fallback — uses level number
function RankBadge({ level, size = 48 }) {
  const color = level >= 50 ? "#f59e0b" : level >= 20 ? "#a78bfa" : level >= 10 ? "#60a5fa" : level >= 5 ? "#34d399" : "#94a3b8";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={color} opacity="0.15" />
      <circle cx="24" cy="24" r="22" stroke={color} strokeWidth="2" />
      <text x="24" y="29" textAnchor="middle" fill={color} fontSize="14" fontWeight="bold">
        {level}
      </text>
    </svg>
  );
}

const UserContainer = () => {
  const { user } = useAuth();
  const [xpData, setXpData] = useState(null);

  useEffect(() => {
    if (!user?.isAuthenticated) return;
    fetch(`${BACKEND}/api/xp/user`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setXpData({ xp: json.xp, level: json.level, total_wagered: json.total_wagered });
      })
      .catch(() => {});
  }, [user?.isAuthenticated]);

  const level = xpData?.level ?? user?.profile?.level ?? 1;
  const xp = xpData?.xp ?? user?.profile?.xp ?? 0;
  const { pct, nextXp, nextLevel } = getProgress(xp, level);

  return (
    <StyledUserContainer>
      <div size="70" className="rank-logo">
        <RankBadge level={level} size={56} />
      </div>
      <div className="user-info-container">
        <div className="user-name">{user?.username || "—"}</div>

        {/* Progress bar */}
        <div
          className="progress-bar"
          style={{
            position: "relative",
            width: "100%",
            height: "6px",
            borderRadius: "4px",
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${pct}%`,
              borderRadius: "4px",
              background: "linear-gradient(90deg, #E5A480, #f59e0b)",
              transition: "width 0.4s ease",
            }}
          />
        </div>

        <div className="level-container">
          <div className="level-section">
            <span className="rank-info">Lv. {level}</span>
            <span className="rank-info" style={{ marginLeft: "6px", color: "#aaa", fontSize: "11px" }}>
              {xp.toLocaleString()} XP
            </span>
          </div>
          {nextLevel && (
            <div className="level-section">
              <span className="rank-info">Next:</span>
              <div size="24" className="rank-small-logo" style={{ margin: "0 4px" }}>
                <RankBadge level={nextLevel} size={20} />
              </div>
              <div className="rank-title" style={{ color: "#E5A480" }}>
                Lv. {nextLevel}
              </div>
              <span className="rank-info" style={{ marginLeft: "6px", color: "#aaa", fontSize: "11px" }}>
                {nextXp?.toLocaleString()} XP
              </span>
            </div>
          )}
        </div>
      </div>
    </StyledUserContainer>
  );
};

export default UserContainer;
