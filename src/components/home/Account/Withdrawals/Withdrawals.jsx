import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { ReactComponent as BUGER } from "../../../../assets/images/Frame (50).svg";
import AccountPageTitle from "../Common/AccountPageTitle";
import AccountTabs from "../Common/AccountTabs/AccountTabs";
import { StyleProfile } from "../Profile/styles";
import { useAuth } from "@/context/AuthContext";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const ASSETS = ["BTC", "ETH", "LTC", "SOL", "USDT"];

const tabs = [
  { url: "/account/withdrawals/ALL", label: "ALL CHAINS" },
  { url: "/account/withdrawals/BTC", label: "BTC" },
  { url: "/account/withdrawals/ETH", label: "ETH" },
  { url: "/account/withdrawals/LTC", label: "LTC" },
  { url: "/account/withdrawals/SOL", label: "SOL" },
  { url: "/account/withdrawals/NFT", label: "NFT" },
];

const Withdrawals = () => {
  const { tab } = useParams();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Withdraw form state
  const [asset, setAsset] = useState("BTC");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  useEffect(() => {
    const fetchTx = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND}/api/payment/user/transactions`, {
          credentials: "include",
        });
        const json = await res.json();
        const list = json.transactions || json.data || [];
        if (json.success) setTransactions(list.filter((t) => t.type === "withdrawal"));
      } catch (_) {}
      setLoading(false);
    };
    fetchTx();
  }, []);

  const filtered =
    !tab || tab === "ALL"
      ? transactions
      : transactions.filter(
          (t) => (t.asset || "").toUpperCase() === tab.toUpperCase()
        );

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!address || !amount || parseFloat(amount) <= 0) {
      setFormMsg({ error: true, text: "Please fill in all fields." });
      return;
    }
    setSubmitting(true);
    setFormMsg(null);
    try {
      const res = await fetch(`${BACKEND}/api/payment/user/withdraw`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset, address, amount: parseFloat(amount) }),
      });
      const json = await res.json();
      if (json.success) {
        setFormMsg({ error: false, text: "Withdrawal request submitted!" });
        setAddress("");
        setAmount("");
        // Refresh list
        const res2 = await fetch(`${BACKEND}/api/payment/user/transactions`, { credentials: "include" });
        const json2 = await res2.json();
        const list = json2.transactions || json2.data || [];
        if (json2.success) setTransactions(list.filter((t) => t.type === "withdrawal"));
      } else {
        setFormMsg({ error: true, text: json.error || "Withdrawal failed." });
      }
    } catch (err) {
      setFormMsg({ error: true, text: "Network error." });
    }
    setSubmitting(false);
  };

  return (
    <StyleProfile>
      <AccountPageTitle icon={BUGER} title="Withdrawals" />
      <AccountTabs tabs={tabs} />

      {/* Withdraw form */}
      <div className="section-container" style={{ marginTop: "16px" }}>
        <h3 className="section-title">Request Withdrawal</h3>
        <form onSubmit={handleWithdraw}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              style={{
                background: "rgba(15,17,26,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              {ASSETS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <div className="input-container" style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="input-container" style={{ width: "120px" }}>
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                min="0"
                step="any"
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <button
              className="change-button"
              type="submit"
              disabled={submitting}
              style={{ marginRight: "4px", minWidth: "100px" }}
            >
              {submitting ? "Sending…" : "Withdraw"}
            </button>
          </div>
          {formMsg && (
            <div style={{ color: formMsg.error ? "#f87171" : "#4ade80", fontSize: "13px", marginBottom: "8px" }}>
              {formMsg.text}
            </div>
          )}
          <p style={{ color: "#676D7C", fontSize: "12px" }}>
            Current balance: <strong style={{ color: "#fff" }}>${parseFloat(user?.balance || 0).toFixed(2)}</strong>
          </p>
        </form>
      </div>

      {/* History */}
      {loading ? (
        <div style={{ padding: "24px 0" }}>
          <div style={{ display: "inline-flex", padding: "23px 32px", borderRadius: "8px", background: "rgba(15,17,26,0.55)" }}>
            <p style={{ color: "#676D7C", fontSize: "18px" }}>Loading…</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "24px 0" }}>
          <div style={{ display: "inline-flex", padding: "23px 32px", borderRadius: "8px", background: "rgba(15,17,26,0.55)" }}>
            <p style={{ color: "#676D7C", fontSize: "18px", textTransform: "uppercase" }}>No Entries</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
          {filtered.map((tx) => (
            <div
              key={tx.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderRadius: "8px",
                background: "rgba(15,17,26,0.55)",
                color: "#fff",
                fontSize: "14px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ color: "#aaa", fontSize: "12px" }}>{new Date(tx.created_at).toLocaleString()}</span>
                <span>{tx.asset || "—"} · {tx.address ? `${tx.address.slice(0, 10)}…` : "—"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                <span style={{ color: "#f87171", fontWeight: 600 }}>-${parseFloat(tx.amount).toFixed(2)}</span>
                <span style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  color: tx.status === "completed" ? "#4ade80" : tx.status === "failed" ? "#f87171" : "#facc15",
                }}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </StyleProfile>
  );
};

export default Withdrawals;
