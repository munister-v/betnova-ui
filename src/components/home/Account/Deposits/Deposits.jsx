import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { ReactComponent as BUGER } from "../../../../assets/images/Frame (50).svg";
import AccountPageTitle from "../Common/AccountPageTitle";
import AccountTabs from "../Common/AccountTabs/AccountTabs";
import { StyleProfile } from "../Profile/styles";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const tabs = [
  { url: "/account/deposits/ALL", label: "ALL CHAINS" },
  { url: "/account/deposits/BTC", label: "BTC" },
  { url: "/account/deposits/ETH", label: "ETH" },
  { url: "/account/deposits/LTC", label: "LTC" },
  { url: "/account/deposits/SOL", label: "SOL" },
  { url: "/account/deposits/NFT", label: "NFT" },
];

const Deposits = () => {
  const { tab } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeposits = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND}/api/payment/user/transactions`, {
          credentials: "include",
        });
        const json = await res.json();
        const list = json.transactions || json.data || [];
        if (json.success && Array.isArray(list)) {
          setTransactions(list);
        }
      } catch (_) {}
      setLoading(false);
    };
    fetchDeposits();
  }, []);

  const filtered =
    !tab || tab === "ALL"
      ? transactions.filter((t) => t.type === "deposit")
      : transactions.filter(
          (t) =>
            t.type === "deposit" &&
            (t.asset || "").toUpperCase() === tab.toUpperCase()
        );

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ margin: "0 auto", padding: "24px 0" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "23px 32px",
              borderRadius: "8px",
              background: "rgba(15, 17, 26, 0.55)",
            }}
          >
            <p style={{ color: "#676D7C", fontSize: "18px" }}>Loading...</p>
          </div>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div style={{ margin: "0 auto", padding: "24px 0" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "23px 32px",
              borderRadius: "8px",
              background: "rgba(15, 17, 26, 0.55)",
            }}
          >
            <p
              style={{
                color: "#676D7C",
                fontSize: "18px",
                textTransform: "uppercase",
              }}
            >
              No Entries
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map((tx) => (
          <div
            key={tx.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderRadius: "8px",
              background: "rgba(15, 17, 26, 0.55)",
              color: "#fff",
              fontSize: "14px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ color: "#aaa", fontSize: "12px" }}>
                {new Date(tx.created_at).toLocaleString()}
              </span>
              <span>
                {tx.asset || "—"} · {tx.address ? `${tx.address.slice(0, 10)}…` : "—"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <span style={{ color: "#4ade80", fontWeight: 600 }}>
                +${parseFloat(tx.amount).toFixed(2)}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color:
                    tx.status === "completed"
                      ? "#4ade80"
                      : tx.status === "failed"
                      ? "#f87171"
                      : "#facc15",
                  textTransform: "uppercase",
                }}
              >
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
      {renderTabContent()}
    </StyleProfile>
  );
};

export default Deposits;
