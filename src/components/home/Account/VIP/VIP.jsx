import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { StyleProfile } from "../Profile/styles";
import AccountPageTitle from "../Common/AccountPageTitle";
import { ReactComponent as StarIcon } from "../../../../assets/images/Frame (50).svg";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 }, { level: 2, xp: 100 }, { level: 3, xp: 250 },
  { level: 4, xp: 500 }, { level: 5, xp: 1000 }, { level: 10, xp: 5000 },
  { level: 20, xp: 20000 }, { level: 30, xp: 60000 },
  { level: 50, xp: 200000 }, { level: 100, xp: 1000000 },
];

function getProgress(xp, level) {
  const current = LEVEL_THRESHOLDS.find(l => l.level === level) || LEVEL_THRESHOLDS[0];
  const next = LEVEL_THRESHOLDS.find(l => l.level > level);
  if (!next) return { pct: 100, nextXp: null, nextLevel: null };
  const range = next.xp - current.xp;
  const earned = xp - current.xp;
  return { pct: Math.min(100, Math.round((earned / range) * 100)), nextXp: next.xp, nextLevel: next.level };
}

function levelColor(level) {
  if (level >= 50) return "#f59e0b";
  if (level >= 20) return "#a78bfa";
  if (level >= 10) return "#60a5fa";
  if (level >= 5) return "#34d399";
  return "#94a3b8";
}

function LevelBadge({ level, size = 40 }) {
  const color = levelColor(level);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={color} opacity="0.15" />
      <circle cx="24" cy="24" r="22" stroke={color} strokeWidth="2" />
      <text x="24" y="29" textAnchor="middle" fill={color} fontSize="13" fontWeight="bold">{level}</text>
    </svg>
  );
}

const tabs = ["progress", "achievements", "leaderboard"];

const VIP = () => {
  const { tab = "progress" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [xpData, setXpData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbTab, setLbTab] = useState("level");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [xpRes, achRes] = await Promise.all([
        fetch(`${BACKEND}/api/xp/user`, { credentials: "include" }).then(r => r.json()),
        fetch(`${BACKEND}/api/xp/achievements`, { credentials: "include" }).then(r => r.json()),
      ]);
      if (xpRes.success) setXpData({ xp: xpRes.xp, level: xpRes.level, total_wagered: xpRes.total_wagered });
      if (achRes.success) setAchievements(achRes.achievements || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  const fetchLeaderboard = useCallback(async (type) => {
    try {
      const res = await fetch(`${BACKEND}/api/xp/leaderboard/${type}?limit=20`).then(r => r.json());
      if (res.success) setLeaderboard(res.leaderboard || []);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (tab === "leaderboard") fetchLeaderboard(lbTab); }, [tab, lbTab, fetchLeaderboard]);

  const level = xpData?.level ?? user?.level ?? 1;
  const xp = xpData?.xp ?? user?.xp ?? 0;
  const { pct, nextXp, nextLevel } = getProgress(xp, level);
  const color = levelColor(level);

  const renderProgress = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* XP Card */}
      <div style={{ padding: "24px", borderRadius: 12, background: "rgba(15,17,26,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          <LevelBadge level={level} size={64} />
          <div>
            <div style={{ color, fontSize: 28, fontWeight: 700 }}>Level {level}</div>
            <div style={{ color: "#676D7C", fontSize: 14 }}>{xp.toLocaleString()} XP total</div>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#676D7C", fontSize: 12, marginBottom: 6 }}>
            <span>Lv. {level}</span>
            {nextLevel && <span>Lv. {nextLevel} — {nextXp?.toLocaleString()} XP</span>}
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: `linear-gradient(90deg, ${color}99, ${color})`, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ textAlign: "right", color: "#676D7C", fontSize: 11, marginTop: 4 }}>{pct}%</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { label: "Total XP", value: xp.toLocaleString() },
          { label: "Total Wagered", value: `$${(xpData?.total_wagered || 0).toLocaleString()}` },
          { label: "Current Level", value: `Lv. ${level}` },
          { label: "XP to Next", value: nextXp ? (nextXp - xp).toLocaleString() : "MAX" },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(15,17,26,0.55)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* XP earning info */}
      <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(15,17,26,0.55)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ color: "#676D7C", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>How to earn XP</div>
        <div style={{ color: "#aaa", fontSize: 14 }}>
          Earn <span style={{ color: color, fontWeight: 600 }}>1 XP</span> for every <span style={{ color: "#fff", fontWeight: 600 }}>$1</span> wagered on any game — Crash, Coinflip, Mines, or Roulette.
        </div>
      </div>
    </div>
  );

  const renderAchievements = () => {
    if (loading) return <div style={{ color: "#676D7C", padding: 24 }}>Loading...</div>;
    if (achievements.length === 0) {
      return (
        <div style={{ padding: "24px 32px", borderRadius: 8, background: "rgba(15,17,26,0.55)", display: "inline-block" }}>
          <p style={{ color: "#676D7C", fontSize: 16, textTransform: "uppercase" }}>No achievements yet</p>
        </div>
      );
    }
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {achievements.map((a) => (
          <div key={a.achievement_id} style={{ padding: "16px", borderRadius: 10, background: "rgba(15,17,26,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{a.achievements?.icon || "🏆"}</div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{a.achievements?.name}</div>
            <div style={{ color: "#676D7C", fontSize: 12 }}>{a.achievements?.description}</div>
            <div style={{ color: "#f59e0b", fontSize: 12, marginTop: 8 }}>+{a.achievements?.xp_reward} XP</div>
          </div>
        ))}
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["level", "By Level"], ["wagering", "All Time"], ["weekly-wagering", "Weekly"]].map(([key, label]) => (
          <button key={key} onClick={() => setLbTab(key)} style={{
            padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
            background: lbTab === key ? "#2563eb" : "rgba(255,255,255,0.05)",
            color: lbTab === key ? "#fff" : "#676D7C",
          }}>{label}</button>
        ))}
      </div>
      {leaderboard.length === 0
        ? <div style={{ color: "#676D7C", padding: 24 }}>No data yet</div>
        : leaderboard.map((entry, i) => (
          <div key={entry.user_id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, background: "rgba(15,17,26,0.55)", marginBottom: 8 }}>
            <div style={{ color: i < 3 ? ["#f59e0b","#94a3b8","#cd7c2f"][i] : "#676D7C", fontWeight: 700, width: 24 }}>#{i + 1}</div>
            <div style={{ flex: 1, color: "#fff", fontSize: 14 }}>{entry.username || "Anonymous"}</div>
            {lbTab === "level" && <><LevelBadge level={entry.level} size={24} /><span style={{ color: "#fff", fontSize: 14 }}>Lv. {entry.level}</span><span style={{ color: "#676D7C", fontSize: 12 }}>{(entry.xp || 0).toLocaleString()} XP</span></>}
            {lbTab === "wagering" && <span style={{ color: "#4ade80", fontWeight: 600 }}>${(entry.total_wagered || 0).toLocaleString()}</span>}
            {lbTab === "weekly-wagering" && <span style={{ color: "#4ade80", fontWeight: 600 }}>${(entry.weekly_wagered || 0).toLocaleString()}</span>}
          </div>
        ))
      }
    </div>
  );

  return (
    <StyleProfile>
      <AccountPageTitle icon={StarIcon} title="VIP & XP" />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => navigate(`/account/vip/${t}`)} style={{
            padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
            background: tab === t ? "#2563eb" : "rgba(255,255,255,0.05)",
            color: tab === t ? "#fff" : "#676D7C", fontSize: 13, textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>
      {tab === "progress" && renderProgress()}
      {tab === "achievements" && renderAchievements()}
      {tab === "leaderboard" && renderLeaderboard()}
    </StyleProfile>
  );
};

export default VIP;
