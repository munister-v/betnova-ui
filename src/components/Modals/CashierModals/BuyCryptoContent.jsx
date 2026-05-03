import React from "react";
import { StyledModalContent } from "./styles";

const SERVICES = [
  {
    name: "MoonPay",
    description: "Buy crypto with card or bank transfer",
    url: "https://www.moonpay.com/buy",
    color: "#7c3aed",
    emoji: "🌙",
  },
  {
    name: "Transak",
    description: "Fast & easy crypto purchases",
    url: "https://global.transak.com/",
    color: "#0ea5e9",
    emoji: "⚡",
  },
  {
    name: "Changelly",
    description: "Exchange & buy crypto instantly",
    url: "https://changelly.com/buy",
    color: "#16a34a",
    emoji: "🔄",
  },
  {
    name: "ChangeNOW",
    description: "No limits, no registration needed",
    url: "https://changenow.io/buy-crypto",
    color: "#ea580c",
    emoji: "⚡",
  },
  {
    name: "Paybis",
    description: "Buy BTC, ETH and more with card",
    url: "https://paybis.com/",
    color: "#db2777",
    emoji: "💳",
  },
  {
    name: "Ramp",
    description: "The easiest way to get crypto",
    url: "https://ramp.network/",
    color: "#0891b2",
    emoji: "🚀",
  },
];

const BuyCryptoContent = () => {
  return (
    <StyledModalContent>
      <h1 className="title">Buy Crypto</h1>

      <p style={{ color: "#676D7C", fontSize: "13px", marginBottom: "20px" }}>
        Purchase crypto using your card or bank transfer via a trusted third-party service. Once purchased, deposit it to your BetNova account.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {SERVICES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <div style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: s.color + "22",
                border: `1px solid ${s.color}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}>
                {s.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>{s.name}</div>
                <div style={{ color: "#676D7C", fontSize: "12px", marginTop: "2px" }}>{s.description}</div>
              </div>
              <div style={{ color: "#676D7C", fontSize: "16px" }}>›</div>
            </div>
          </a>
        ))}
      </div>

      <div style={{
        marginTop: "20px",
        padding: "12px 14px",
        borderRadius: "8px",
        background: "rgba(250,204,21,0.06)",
        border: "1px solid rgba(250,204,21,0.2)",
      }}>
        <p style={{ color: "#facc15", fontSize: "12px", margin: 0 }}>
          ⚠ These are external services. After buying crypto, use the <strong>Deposit</strong> tab to add funds to your BetNova balance.
        </p>
      </div>
    </StyledModalContent>
  );
};

export default BuyCryptoContent;
