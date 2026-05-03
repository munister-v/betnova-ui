import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { StyledPageContainer } from "../Casino/styles";
import NavigationHeader from "../../Common/NavigationHeader/NavigationHeader";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

const TABS = [
  { key: "weekly-wagering", label: "🔥 Weekly Wager",  desc: "Most wagered this week" },
  { key: "wagering",        label: "💰 All-Time Wager", desc: "Most wagered overall"  },
  { key: "biggest-wins",    label: "🏆 Biggest Wins",   desc: "Highest single-bet profit" },
  { key: "level",           label: "⭐ Top Level",      desc: "Highest XP / Level"   },
];

const GAME_EMOJI = {
  crash:    "📈",
  coinflip: "🪙",
  mines:    "💣",
  roulette: "🎡",
  slots:    "🎰",
  blackjack:"🃏",
  default:  "🎮",
};

function Avatar({ url, username, size = 36 }) {
  const initials = (username || "?").slice(0, 2).toUpperCase();
  const colors = ["#7c3aed","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444"];
  const color = colors[(username || "").charCodeAt(0) % colors.length];

  if (url) {
    return (
      <img src={url} alt={username} style={{
        width: size, height: size, borderRadius: "50%",
        objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)",
        flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 800, color: "#fff",
      flexShrink: 0, border: "2px solid rgba(255,255,255,0.1)",
    }}>{initials}</div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <span style={{ fontSize: 22 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 22 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 22 }}>🥉</span>;
  return (
    <span style={{
      width: 28, height: 28, borderRadius: "50%",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, color: "#676D7C",
    }}>{rank}</span>
  );
}

function formatNum(n) {
  if (n == null) return "—";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000)    return `$${(n / 1000).toFixed(1)}K`;
  return `$${Number(n).toFixed(2)}`;
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

function SkeletonRow() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: 120, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 6 }} />
        <div style={{ width: 80, height: 10, borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
      </div>
      <div style={{ width: 70, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("weekly-wagering");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async (key) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/xp/leaderboard/${key}?limit=50`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json.leaderboard || []);
        setLastUpdated(new Date());
      }
    } catch { setData([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  const currentTab = TABS.find(t => t.key === tab);

  // My rank
  const myRank = user?.isAuthenticated
    ? data.findIndex(row => row.user_id === user.id) + 1
    : -1;

  const getMainValue = (row) => {
    if (tab === "weekly-wagering") return formatNum(row.weekly_wagered);
    if (tab === "wagering")        return formatNum(row.total_wagered);
    if (tab === "biggest-wins")    return formatNum(row.profit);
    if (tab === "level")           return `Lv ${row.level ?? 1}`;
    return "—";
  };

  const getSubValue = (row) => {
    if (tab === "biggest-wins")    return `${(row.multiplier || 0).toFixed(2)}× · ${GAME_EMOJI[row.game_type] || GAME_EMOJI.default} ${row.game_type} · bet ${formatNum(row.bet_amount)}`;
    if (tab === "level")           return `${(row.xp || 0).toLocaleString()} XP`;
    return null;
  };

  const getValueColor = (rank) => {
    if (rank === 1) return "#fbbf24";
    if (rank === 2) return "#94a3b8";
    if (rank === 3) return "#cd7f32";
    return "#22c55e";
  };

  return (
    <StyledPageContainer>
      <NavigationHeader isNftPage={false} />
      <div className="content-container" style={{ padding: 20, maxWidth: 820, margin: "0 auto" }}>

        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1), rgba(139,92,246,0.1))",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 16, padding: "28px 24px",
          marginBottom: 24, textAlign: "center",
        }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🏆</div>
          <h1 style={{
            fontSize: 28, fontWeight: 900, margin: "0 0 8px",
            background: "linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Leaderboard</h1>
          <p style={{ color: "#888", fontSize: 13, margin: 0 }}>
            Top players across BetNova · Updates live
            {lastUpdated && <span style={{ color: "#555" }}> · {timeAgo(lastUpdated.toISOString())}</span>}
          </p>
        </div>

        {/* My rank banner */}
        {user?.isAuthenticated && myRank > 0 && (
          <div style={{
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 12, padding: "12px 20px",
            marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <span style={{ color: "#c4b5fd", fontWeight: 700, fontSize: 13 }}>Your rank this board: #{myRank}</span>
            </div>
            <span style={{ color: "#888", fontSize: 12 }}>Keep playing to climb!</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap",
        }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "10px 18px", borderRadius: 10, border: "none",
              cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.2s",
              background: tab === t.key
                ? "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(239,68,68,0.2))"
                : "rgba(255,255,255,0.04)",
              color: tab === t.key ? "#fbbf24" : "#888",
              border: tab === t.key ? "1px solid rgba(245,158,11,0.4)" : "1px solid transparent",
              boxShadow: tab === t.key ? "0 4px 16px rgba(245,158,11,0.15)" : "none",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: "rgba(15,17,26,0.6)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, overflow: "hidden",
          backdropFilter: "blur(8px)",
        }}>
          {/* Table header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ width: 28, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 0.5 }}>#</div>
            <div style={{ width: 36 }} />
            <div style={{ flex: 1, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 0.5 }}>Player</div>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {currentTab?.desc}
            </div>
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
          ) : data.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#555", fontSize: 14 }}>
              No data yet — be the first to play!
            </div>
          ) : (
            data.map((row, i) => {
              const rank = i + 1;
              const isMe = user?.isAuthenticated && row.user_id === user.id;
              const sub = getSubValue(row);
              return (
                <div
                  key={row.user_id || i}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: isMe
                      ? "rgba(139,92,246,0.08)"
                      : rank <= 3
                      ? `rgba(${rank===1?"251,191,36":rank===2?"148,163,184":"205,127,50"},0.04)`
                      : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => !isMe && (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={e => e.currentTarget.style.background = isMe ? "rgba(139,92,246,0.08)" : rank <= 3 ? `rgba(${rank===1?"251,191,36":rank===2?"148,163,184":"205,127,50"},0.04)` : "transparent"}
                >
                  {/* Rank */}
                  <div style={{ width: 28, display: "flex", justifyContent: "center" }}>
                    <RankBadge rank={rank} />
                  </div>

                  {/* Avatar */}
                  <Avatar url={row.avatar_url} username={row.username} size={36} />

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: 14,
                      color: isMe ? "#c4b5fd" : "#fff",
                      display: "flex", alignItems: "center", gap: 6,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {row.username || "Anonymous"}
                      {isMe && <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 600, background: "rgba(139,92,246,0.2)", padding: "2px 6px", borderRadius: 4 }}>YOU</span>}
                    </div>
                    {sub && (
                      <div style={{ fontSize: 11, color: "#676D7C", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sub}
                        {tab === "biggest-wins" && row.created_at && (
                          <span style={{ marginLeft: 6, color: "#444" }}>· {timeAgo(row.created_at)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Value */}
                  <div style={{
                    fontWeight: 800, fontSize: 15,
                    color: getValueColor(rank),
                    textShadow: rank === 1 ? "0 0 20px rgba(251,191,36,0.5)" : "none",
                    whiteSpace: "nowrap",
                  }}>
                    {getMainValue(row)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", color: "#444", fontSize: 12, marginTop: 16 }}>
          Leaderboard updates in real-time · Weekly board resets every Monday 00:00 UTC
        </p>
      </div>
    </StyledPageContainer>
  );
}
