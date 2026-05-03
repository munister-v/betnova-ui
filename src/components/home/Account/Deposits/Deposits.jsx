import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ReactComponent as BUGER } from "../../../../assets/images/Frame (50).svg";
import AccountPageTitle from "../Common/AccountPageTitle";
import AccountTabs from "../Common/AccountTabs/AccountTabs";
import { StyleProfile } from "../Profile/styles";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const ASSETS = ["BTC", "ETH", "LTC", "SOL", "USDT"];

const tabs = [
  { url: "/account/deposits/ALL", label: "ALL CHAINS" },
  { url: "/account/deposits/BTC", label: "BTC" },
  { url: "/account/deposits/ETH", label: "ETH" },
  { url: "/account/deposits/LTC", label: "LTC" },
  { url: "/account/deposits/SOL", label: "SOL" },
  { url: "/account/deposits/USDT", label: "USDT" },
];

const Deposits = () => {
  const { tab } = useParams();
  const asset = tab && tab !== "ALL" ? tab.toUpperCase() : null;

  const [address, setAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchAddress = useCallback(async (sym) => {
    setLoadingAddress(true);
    setAddress(null);
    try {
      const res = await fetch(`${BACKEND}/api/payment/deposit/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset: sym }),
      });
      const json = await res.json();
      if (json.success) setAddress(json.wallet?.address);
    } catch (_) {}
    setLoadingAddress(false);
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const res = await fetch(`${BACKEND}/api/payment/user/transactions`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) setTransactions(json.transactions || []);
    } catch (_) {}
    setLoadingTx(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    if (asset) fetchAddress(asset);
  }, [asset, fetchAddress]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = asset
    ? transactions.filter((t) => t.type === "deposit" && (t.asset || "").toUpperCase() === asset)
    : transactions.filter((t) => t.type === "deposit");

  const renderDepositAddress = () => {
    if (!asset) return null;
    return (
      <div style={{ marginBottom: 24, padding: "20px 24px", borderRadius: 12, background: "rgba(15,17,26,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ color: "#676D7C", fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          Your {asset} Deposit Address
        </p>
        {loadingAddress ? (
          <p style={{ color: "#676D7C" }}>Generating address...</p>
        ) : address ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#fff", fontFamily: "monospace", fontSize: 14, wordBreak: "break-all", flex: 1 }}>
              {address}
            </span>
            <button
              onClick={copyAddress}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                background: copied ? "#4ade80" : "#2563eb", color: "#fff", fontSize: 13, whiteSpace: "nowrap",
                transition: "background 0.2s",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        ) : (
          <p style={{ color: "#f87171", fontSize: 13 }}>Failed to load address. Please try again.</p>
        )}
        <p style={{ color: "#676D7C", fontSize: 12, marginTop: 12 }}>
          Send only {asset} to this address. Balance is credited after network confirmation.
        </p>
      </div>
    );
  };

  const renderTransactions = () => {
    if (loadingTx) {
      return (
        <div style={{ padding: "24px 0" }}>
          <div style={{ display: "inline-flex", padding: "23px 32px", borderRadius: 8, background: "rgba(15,17,26,0.55)" }}>
            <p style={{ color: "#676D7C", fontSize: 18 }}>Loading...</p>
          </div>
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div style={{ padding: "24px 0" }}>
          <div style={{ display: "inline-flex", padding: "23px 32px", borderRadius: 8, background: "rgba(15,17,26,0.55)" }}>
            <p style={{ color: "#676D7C", fontSize: 18, textTransform: "uppercase" }}>No Deposits</p>
          </div>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((tx) => (
          <div
            key={tx.id}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 20px", borderRadius: 8, background: "rgba(15,17,26,0.55)", color: "#fff", fontSize: 14,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "#aaa", fontSize: 12 }}>{new Date(tx.created_at).toLocaleString()}</span>
              <span>{tx.asset || "—"} · {tx.address ? `${tx.address.slice(0, 12)}…` : "—"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{ color: "#4ade80", fontWeight: 600 }}>
                {parseFloat(tx.amount) > 0 ? `+$${parseFloat(tx.amount).toFixed(2)}` : "—"}
              </span>
              <span style={{
                fontSize: 11, textTransform: "uppercase",
                color: tx.status === "completed" ? "#4ade80" : tx.status === "failed" ? "#f87171" : "#facc15",
              }}>
                {tx.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <StyleProfile>
      <AccountPageTitle icon={BUGER} title="Deposits" />
      <AccountTabs tabs={tabs} />
      {renderDepositAddress()}
      {renderTransactions()}
    </StyleProfile>
  );
};

export default Deposits;
