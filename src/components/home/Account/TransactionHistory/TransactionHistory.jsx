import React, { useState, useEffect, useCallback } from "react";
import { StyleProfile } from "../Profile/styles";
import AccountPageTitle from "../Common/AccountPageTitle";
import { ReactComponent as BUGER } from "../../../../assets/images/Frame (50).svg";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const GAME_LABELS = {
  crash: "Crash",
  coinflip: "Coin Flip",
  roulette: "Roulette",
  mine: "Mines",
  slots: "Slots",
  blackjack: "Blackjack",
  jackpot: "Jackpot",
};

function GameHistory() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (filter) params.set("gameType", filter);
    const res = await fetch(`${BACKEND}/api/game-history/user?${params}`, { credentials: "include" });
    const data = await res.json();
    if (data.success) { setGames(data.games || []); setTotal(data.total || 0); }
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["", "crash", "coinflip", "roulette", "mine", "slots", "blackjack", "jackpot"].map(g => (
          <button key={g} onClick={() => { setFilter(g); setPage(1); }} style={{
            padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
            background: filter === g ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
            color: filter === g ? "#f59e0b" : "#aaa",
          }}>{g ? GAME_LABELS[g] || g : "All Games"}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#676D7C" }}>Loading...</div>
      ) : games.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#676D7C" }}>No games yet</div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "8px 12px", color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
              <span>Game</span><span>Bet</span><span>Profit</span><span>Date</span>
            </div>
            {games.map(g => {
              const profit = g.profit ?? 0;
              return (
                <div key={g.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  padding: "12px", borderRadius: 8, background: "rgba(255,255,255,0.03)",
                  fontSize: 14,
                }}>
                  <span style={{ color: "#fff" }}>{GAME_LABELS[g.game_type] || g.game_type}</span>
                  <span style={{ color: "#aaa" }}>${(g.bet_amount || 0).toFixed(2)}</span>
                  <span style={{ color: profit >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                    {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
                  </span>
                  <span style={{ color: "#676D7C", fontSize: 12 }}>
                    {new Date(g.created_at).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.07)", color: "#fff", cursor: "pointer" }}>←</button>
              <span style={{ padding: "6px 14px", color: "#aaa", fontSize: 13 }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.07)", color: "#fff", cursor: "pointer" }}>→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TxHistory() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (filter) params.set("type", filter);
    const res = await fetch(`${BACKEND}/api/transaction/history-page?${params}`, { credentials: "include" });
    const data = await res.json();
    if (data.success) { setTxs(data.transactions || []); setTotal(data.total || 0); }
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  const STATUS_COLOR = { completed: "#4ade80", pending: "#f59e0b", failed: "#f87171" };
  const TYPE_LABEL = { deposit: "Deposit", withdrawal: "Withdrawal", bet: "Bet", win: "Win" };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["", "deposit", "withdrawal"].map(t => (
          <button key={t} onClick={() => { setFilter(t); setPage(1); }} style={{
            padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
            background: filter === t ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
            color: filter === t ? "#f59e0b" : "#aaa",
          }}>{t ? TYPE_LABEL[t] || t : "All"}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#676D7C" }}>Loading...</div>
      ) : txs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#676D7C" }}>No transactions yet</div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "8px 12px", color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
              <span>Type</span><span>Amount</span><span>Status</span><span>Date</span>
            </div>
            {txs.map(tx => (
              <div key={tx.id} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                padding: "12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", fontSize: 14,
              }}>
                <span style={{ color: "#fff" }}>{TYPE_LABEL[tx.type] || tx.type}</span>
                <span style={{ color: "#f59e0b", fontWeight: 600 }}>${(tx.amount || 0).toFixed(2)}</span>
                <span style={{ color: STATUS_COLOR[tx.status] || "#aaa", fontSize: 13 }}>{tx.status}</span>
                <span style={{ color: "#676D7C", fontSize: 12 }}>{new Date(tx.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.07)", color: "#fff", cursor: "pointer" }}>←</button>
              <span style={{ padding: "6px 14px", color: "#aaa", fontSize: 13 }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.07)", color: "#fff", cursor: "pointer" }}>→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const TransactionHistory = () => {
  const [tab, setTab] = useState("games");

  return (
    <StyleProfile>
      <AccountPageTitle icon={BUGER} title="History" />

      <div className="section-container">
        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(15,17,26,0.55)", padding: 4, borderRadius: 10, width: "fit-content" }}>
          {[{ id: "games", label: "Game History" }, { id: "transactions", label: "Transactions" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === t.id ? "rgba(203,215,255,0.1)" : "transparent",
              color: tab === t.id ? "#fff" : "#676D7C",
            }}>{t.label}</button>
          ))}
        </div>

        {tab === "games" ? <GameHistory /> : <TxHistory />}
      </div>
    </StyleProfile>
  );
};

export default TransactionHistory;
