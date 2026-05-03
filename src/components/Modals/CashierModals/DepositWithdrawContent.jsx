import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { StyledModalContent } from "./styles";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const ASSETS = [
  { symbol: "BTC",  name: "Bitcoin",  icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" },
  { symbol: "ETH",  name: "Ethereum", icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" },
  { symbol: "LTC",  name: "Litecoin", icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/2.png" },
  { symbol: "SOL",  name: "Solana",   icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png" },
  { symbol: "USDT", name: "Tether",   icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" },
];

// ── Single asset deposit view ──────────────────────────────────────────────────
function AssetDepositView({ asset, handleBack }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND}/api/payment/deposit/create`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset: asset.symbol }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setWallet(json.wallet);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [asset.symbol]);

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Back + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={handleBack}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", fontSize: "18px", padding: "4px" }}
        >
          ‹
        </button>
        <img src={asset.icon} alt={asset.symbol} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
        <span style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>Deposit {asset.name}</span>
      </div>

      <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "16px" }}>
        Send {asset.symbol} to the address below. Your balance will update after confirmation.
      </p>

      {loading ? (
        <div style={{ color: "#676D7C", textAlign: "center", padding: "20px" }}>Generating address…</div>
      ) : wallet ? (
        <>
          {/* Address box */}
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "14px 16px",
            marginBottom: "12px",
            wordBreak: "break-all",
            fontFamily: "monospace",
            color: "#fff",
            fontSize: "13px",
          }}>
            {wallet.address}
          </div>
          <button
            onClick={copyAddress}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              background: copied ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${copied ? "#4ade80" : "rgba(255,255,255,0.1)"}`,
              color: copied ? "#4ade80" : "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.2s",
            }}
          >
            {copied ? "✓ Copied!" : "Copy Address"}
          </button>

          <div style={{ marginTop: "16px", padding: "12px", borderRadius: "8px", background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.2)" }}>
            <p style={{ color: "#facc15", fontSize: "12px", margin: 0 }}>
              ⚠ Only send {asset.symbol} on {wallet.network} network to this address. Sending other assets may result in permanent loss.
            </p>
          </div>
        </>
      ) : (
        <div style={{ color: "#ef4444", textAlign: "center" }}>Failed to load address. Please log in.</div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const DepositWithdrawContent = ({ option }) => {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState(null);

  if (!user?.isAuthenticated) {
    return (
      <StyledModalContent>
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔐</div>
          <p>Please log in to see your deposit addresses.</p>
        </div>
      </StyledModalContent>
    );
  }

  if (selectedAsset) {
    return (
      <StyledModalContent>
        <AssetDepositView asset={selectedAsset} handleBack={() => setSelectedAsset(null)} />
      </StyledModalContent>
    );
  }

  return (
    <StyledModalContent>
      <h1 className="title">Deposit options</h1>
      <div className="options">
        {ASSETS.map((asset) => (
          <div
            key={asset.symbol}
            className="option"
            onClick={() => setSelectedAsset(asset)}
            style={{ cursor: "pointer" }}
          >
            <div className="icons-container">
              <img src={asset.icon} size="32" className="icon-img" alt={asset.symbol} />
            </div>
            <div className="option-title">
              {asset.name}
              <div className="option-subtitle">{asset.symbol}</div>
            </div>
          </div>
        ))}
      </div>
    </StyledModalContent>
  );
};

export default DepositWithdrawContent;
