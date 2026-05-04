import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/utils/toastUtils";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const ASSETS = [
  { symbol: "ETH",        name: "Ethereum",        icon: "⟠",  color: "#627EEA", network: "Ethereum" },
  { symbol: "BNB",        name: "BNB",              icon: "◈",  color: "#F3BA2F", network: "BSC" },
  { symbol: "USDT",       name: "USDT (ERC-20)",    icon: "₮",  color: "#26A17B", network: "Ethereum" },
  { symbol: "USDT-BEP20", name: "USDT (BEP-20)",   icon: "₮",  color: "#26A17B", network: "BSC" },
];

function QRCode({ value, size = 140 }) {
  if (!value) return null;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=0c0e18&color=ffffff&margin=8`;
  return (
    <img src={url} alt="QR" width={size} height={size}
      style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }} />
  );
}

// ── Deposit ────────────────────────────────────────────────────────────────
function DepositTab() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prices, setPrices] = useState({});
  const [status, setStatus] = useState("waiting");
  const pollRef = useRef(null);

  useEffect(() => {
    fetch(`${BACKEND}/api/payment/prices`)
      .then(r => r.json()).then(d => { if (d.success) setPrices(d.prices); }).catch(() => {});
  }, []);

  const selectAsset = async (asset) => {
    setSelectedAsset(asset); setWallet(null); setStatus("waiting");
    clearInterval(pollRef.current);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/payment/deposit/create`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset: asset.symbol }),
      });
      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet);
        pollRef.current = setInterval(async () => {
          try {
            const sr = await fetch(`${BACKEND}/api/payment/deposit/status/${asset.symbol}`, { credentials: "include" });
            const sd = await sr.json();
            if (sd.success) setStatus(sd.status);
          } catch (_) {}
        }, 10_000);
      }
    } catch { showToast("Failed to load deposit address", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  const priceKey = selectedAsset?.symbol.includes("USDT") ? "USDT" : selectedAsset?.symbol;
  const usdPrice = priceKey ? (prices[priceKey] || 0) : 0;

  if (!selectedAsset) return (
    <div>
      <p style={{ color: "#676D7C", fontSize: 12, marginBottom: 14 }}>Select currency to get your deposit address:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ASSETS.map(a => (
          <button key={a.symbol} onClick={() => selectAsset(a)}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 10, background: "rgba(15,17,26,0.6)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.12)"; e.currentTarget.style.borderColor = "#7c3aed44"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(15,17,26,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
          >
            <span style={{ fontSize: 22, color: a.color, width: 28, textAlign: "center" }}>{a.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{a.name}</div>
              <div style={{ color: "#555", fontSize: 11 }}>{a.network}</div>
            </div>
            {prices[a.symbol.includes("USDT") ? "USDT" : a.symbol] > 0 && (
              <div style={{ color: "#676D7C", fontSize: 12 }}>
                ${(prices[a.symbol.includes("USDT") ? "USDT" : a.symbol] || 0).toLocaleString()}
              </div>
            )}
            <span style={{ color: "#333", fontSize: 16 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={() => { setSelectedAsset(null); setWallet(null); clearInterval(pollRef.current); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 13, marginBottom: 16, padding: 0 }}>
        ← Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 26, color: selectedAsset.color }}>{selectedAsset.icon}</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Deposit {selectedAsset.name}</div>
          <div style={{ color: "#555", fontSize: 11 }}>Network: {selectedAsset.network}</div>
        </div>
      </div>

      {usdPrice > 0 && (
        <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(15,17,26,0.5)", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#676D7C", fontSize: 12 }}>1 {selectedAsset.symbol.replace("-BEP20", "")} ≈</span>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>${usdPrice.toLocaleString()}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: "#555" }}>Generating address…</div>
      ) : wallet ? (
        <>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <QRCode value={wallet.address} size={132} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Deposit Address</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <div style={{ flex: 1, padding: "9px 12px", borderRadius: 8, background: "rgba(15,17,26,0.7)", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "monospace", fontSize: 10, color: "#bbb", wordBreak: "break-all" }}>
                {wallet.address}
              </div>
              <button onClick={copyAddress}
                style={{ padding: "9px 12px", borderRadius: 8, background: copied ? "rgba(74,222,128,0.15)" : "rgba(124,58,237,0.15)", border: `1px solid ${copied ? "#4ade8044" : "#7c3aed44"}`, color: copied ? "#4ade80" : "#a78bfa", cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                {copied ? "✓" : "Copy"}
              </button>
            </div>
          </div>

          <div style={{ padding: "9px 12px", borderRadius: 8, background: status === "pending_credit" ? "rgba(245,158,11,0.08)" : "rgba(15,17,26,0.4)", border: `1px solid ${status === "pending_credit" ? "#f59e0b44" : "rgba(255,255,255,0.05)"}`, display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span>{status === "pending_credit" ? "⏳" : "👁️"}</span>
            <span style={{ color: status === "pending_credit" ? "#f59e0b" : "#555", fontSize: 12 }}>
              {status === "pending_credit" ? "Transaction detected — crediting balance…" : "Monitoring for incoming transactions"}
            </span>
          </div>

          <div style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", fontSize: 11, color: "#f87171" }}>
            ⚠️ Send only <b>{selectedAsset.name}</b> on <b>{selectedAsset.network}</b>. Wrong network = lost funds.
          </div>
        </>
      ) : (
        <div style={{ color: "#ef4444", fontSize: 13 }}>Failed to generate address. Please try again.</div>
      )}
    </div>
  );
}

// ── Withdraw ───────────────────────────────────────────────────────────────
function WithdrawTab() {
  const { user } = useAuth();
  const [asset, setAsset] = useState("ETH");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState(null);

  const MIN = { ETH: 0.002, BNB: 0.01, USDT: 5, "USDT-BEP20": 2 };

  useEffect(() => {
    fetch(`${BACKEND}/api/payment/prices`).then(r => r.json())
      .then(d => { if (d.success) setPrices(d.prices); }).catch(() => {});
  }, []);

  const priceKey = asset.includes("USDT") ? "USDT" : asset;
  const usdPrice = prices[priceKey] || 0;
  const usdValue = cryptoAmount ? parseFloat(cryptoAmount) * usdPrice : 0;
  const userBalance = parseFloat(user?.balance || 0);
  const maxCrypto = usdPrice > 0 ? (userBalance / usdPrice).toFixed(6) : "0";

  const withdraw = async () => {
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) { showToast("Enter amount", "error"); return; }
    if (!toAddress) { showToast("Enter withdrawal address", "error"); return; }
    if (parseFloat(cryptoAmount) < MIN[asset]) { showToast(`Min: ${MIN[asset]} ${asset}`, "error"); return; }
    if (usdValue > userBalance) { showToast("Insufficient balance", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/payment/withdraw`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset, cryptoAmount: parseFloat(cryptoAmount), toAddress }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error || "Withdrawal failed", "error"); return; }
      setLastTx(data);
      showToast(`Withdrawal submitted!`, "success");
      setCryptoAmount(""); setToAddress("");
    } catch { showToast("Connection error", "error"); }
    finally { setLoading(false); }
  };

  const selAsset = ASSETS.find(a => a.symbol === asset);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Currency</label>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {ASSETS.map(a => (
            <button key={a.symbol} onClick={() => setAsset(a.symbol)}
              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${asset === a.symbol ? a.color + "55" : "rgba(255,255,255,0.07)"}`, background: asset === a.symbol ? a.color + "18" : "rgba(15,17,26,0.5)", color: asset === a.symbol ? a.color : "#555", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              {a.icon} {a.symbol}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "9px 14px", borderRadius: 8, background: "rgba(15,17,26,0.5)", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#676D7C", fontSize: 12 }}>Your balance</span>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#fff", fontWeight: 700 }}>${userBalance.toFixed(2)}</div>
          {usdPrice > 0 && <div style={{ color: "#555", fontSize: 11 }}>≈ {maxCrypto} {asset}</div>}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Amount ({asset})</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input type="number" value={cryptoAmount} onChange={e => setCryptoAmount(e.target.value)} disabled={loading}
            placeholder={`Min ${MIN[asset]}`}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "rgba(15,17,26,0.7)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, outline: "none" }}
            step="0.0001" min="0" />
          <button onClick={() => setCryptoAmount(maxCrypto)} disabled={loading}
            style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#a78bfa", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>MAX</button>
        </div>
        {cryptoAmount && usdPrice > 0 && (
          <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>≈ ${usdValue.toFixed(2)}</div>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ color: "#676D7C", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>To Address ({selAsset?.network})</label>
        <input type="text" value={toAddress} onChange={e => setToAddress(e.target.value)} disabled={loading}
          placeholder="0x…"
          style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, background: "rgba(15,17,26,0.7)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 11, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
      </div>

      <button onClick={withdraw} disabled={loading || !cryptoAmount || !toAddress}
        style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: loading ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 900, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.5 }}>
        {loading ? "Processing…" : `Withdraw ${asset}`}
      </button>

      {lastTx && (
        <div style={{ marginTop: 12, padding: "11px 13px", borderRadius: 8, background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.25)" }}>
          <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>✓ Withdrawal submitted</div>
          {lastTx.txHash && <div style={{ color: "#555", fontSize: 10, fontFamily: "monospace", wordBreak: "break-all" }}>TX: {lastTx.txHash}</div>}
          {lastTx.simulated && <div style={{ color: "#f59e0b", fontSize: 11, marginTop: 4 }}>⚠ Dev mode — no real tx sent</div>}
        </div>
      )}
    </div>
  );
}

// ── History ────────────────────────────────────────────────────────────────
function HistoryTab() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND}/api/payment/user/transactions?limit=20`, { credentials: "include" })
      .then(r => r.json()).then(d => { if (d.success) setTxs(d.transactions || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusColor = { completed: "#4ade80", pending: "#f59e0b", processing: "#60a5fa", failed: "#ef4444" };

  if (loading) return <div style={{ color: "#555", padding: 16 }}>Loading…</div>;
  if (!txs.length) return <div style={{ color: "#555", fontSize: 13, padding: 16 }}>No transactions yet</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {txs.map(tx => (
        <div key={tx.id} style={{ padding: "11px 13px", borderRadius: 10, background: "rgba(15,17,26,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: tx.type === "deposit" ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 13 }}>
              {tx.type === "deposit" ? "↓ Deposit" : "↑ Withdraw"}
            </span>
            <span style={{ color: "#fff", fontWeight: 800 }}>${parseFloat(tx.amount || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#555", fontSize: 11 }}>{tx.asset}</span>
            <span style={{ color: statusColor[tx.status] || "#555", fontSize: 11, fontWeight: 600 }}>{tx.status}</span>
          </div>
          <div style={{ color: "#333", fontSize: 10, marginTop: 3 }}>{new Date(tx.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
const DepositWithdrawContent = () => {
  const [tab, setTab] = useState("deposit");
  const tabs = [
    { key: "deposit",  label: "💰 Deposit" },
    { key: "withdraw", label: "📤 Withdraw" },
    { key: "history",  label: "📋 History" },
  ];

  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: tab === t.key ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)", color: tab === t.key ? "#a78bfa" : "#555", cursor: "pointer", fontSize: 12, fontWeight: tab === t.key ? 800 : 600 }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "deposit"  && <DepositTab />}
      {tab === "withdraw" && <WithdrawTab />}
      {tab === "history"  && <HistoryTab />}
    </div>
  );
};

export default DepositWithdrawContent;
