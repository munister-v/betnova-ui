import React, { useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { StyledPageContainer } from "../Casino/styles";
import NavigationHeader from "../../Common/NavigationHeader/NavigationHeader";

// ─── Pure-JS reimplementation of server RNG (mirrors backend utils/provablyFair.js) ───

async function hmacSha256Hex(key, message) {
  const enc = new TextEncoder();
  const keyBuf = enc.encode(key);
  const msgBuf = enc.encode(message);
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", keyBuf, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await window.crypto.subtle.sign("HMAC", cryptoKey, msgBuf);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await window.crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function computeFloat(serverSeed, clientSeed, nonce) {
  const hash = await hmacSha256Hex(serverSeed, `${clientSeed}:${nonce}`);
  const num = parseInt(hash.slice(0, 8), 16);
  return num / 0xffffffff;
}

async function computeCrash(serverSeed, clientSeed, nonce, houseEdge = 2) {
  const f = await computeFloat(serverSeed, clientSeed, nonce);
  const e = 100 / houseEdge;
  if (f * e < 1) return 1.0;
  return Math.floor((e / (1 - f)) * 100) / 100;
}

// Slots: 3×3 symbols (same symbol pool as backend)
const SYMBOL_POOLS = {
  "classic":  ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"],
  "vegas":    ["🎰", "💰", "🃏", "🎲", "⭐", "💎", "7️⃣"],
  "jungle":   ["🦁", "🐯", "🦊", "🐸", "🌿", "⭐", "💎"],
  "egypt":    ["📜", "👁️", "🏺", "🌙", "⭐", "🔱", "🃏"],
  "dragon":   ["🐉", "🔥", "💎", "🪙", "⭐", "🏮", "🎋"],
  "pirate":   ["⚓", "💀", "🗺️", "💰", "⭐", "🦜", "🔱"],
  "space":    ["🚀", "⭐", "🌙", "💫", "🪐", "🛸", "💎"],
  "bonanza":  ["🍬", "🍭", "🍡", "🍰", "💎", "⭐", "💝"],
};

async function computeSlotGrid(serverSeed, clientSeed, nonce, gameId = "classic") {
  const pool = SYMBOL_POOLS[gameId] || SYMBOL_POOLS["classic"];
  const grid = [];
  let n = nonce;
  for (let col = 0; col < 3; col++) {
    const column = [];
    for (let row = 0; row < 3; row++) {
      const f = await computeFloat(serverSeed, clientSeed, n++);
      column.push(pool[Math.floor(f * pool.length)]);
    }
    grid.push(column);
  }
  return grid;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

const GAMES = [
  { id: "crash",   label: "Crash",           engine: "crash"  },
  { id: "classic", label: "Slots — Classic",  engine: "slots"  },
  { id: "vegas",   label: "Slots — Vegas",    engine: "slots"  },
  { id: "egypt",   label: "Slots — Egypt",    engine: "slots"  },
  { id: "bonanza", label: "Slots — Bonanza",  engine: "slots"  },
];

function FieldRow({ label, value, mono = true, small = false }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: "#676D7C", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        padding: "10px 14px",
        fontFamily: mono ? "monospace" : "inherit",
        fontSize: small ? 11 : 13,
        color: "#e2e8f0",
        wordBreak: "break-all",
        lineHeight: 1.6,
      }}>{value || <span style={{ color: "#555" }}>—</span>}</div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "10px 14px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(15,17,26,0.7)",
          color: "#fff", fontSize: 13, fontFamily: "monospace",
          outline: "none",
        }}
      />
    </div>
  );
}

function SlotGrid({ grid }) {
  if (!grid) return null;
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "12px 0" }}>
      {grid.map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {col.map((sym, ri) => (
            <div key={ri} style={{
              width: 52, height: 52, borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>{sym}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ProvablyFair() {
  const { user } = useAuth();

  // My seeds panel
  const serverSeedHash = user?.server_seed_hash || "";
  const clientSeed     = user?.client_seed || "";
  const nonce          = user?.nonce ?? "";

  // Verify panel
  const [game,       setGame]       = useState("crash");
  const [vServerSeed, setVServerSeed] = useState("");
  const [vClientSeed, setVClientSeed] = useState("");
  const [vNonce,      setVNonce]      = useState("");
  const [result,     setResult]     = useState(null);
  const [verifying,  setVerifying]  = useState(false);
  const [error,      setError]      = useState("");

  // Hash checker panel
  const [rawSeed,   setRawSeed]   = useState("");
  const [hashResult, setHashResult] = useState("");

  const handleVerify = useCallback(async () => {
    setError("");
    setResult(null);
    if (!vServerSeed.trim()) { setError("Server seed required"); return; }
    if (!vClientSeed.trim()) { setError("Client seed required"); return; }
    const nonceNum = parseInt(vNonce, 10);
    if (isNaN(nonceNum) || nonceNum < 0) { setError("Nonce must be a non-negative integer"); return; }

    setVerifying(true);
    try {
      const gameObj = GAMES.find(g => g.id === game);
      if (gameObj?.engine === "crash") {
        const mult = await computeCrash(vServerSeed.trim(), vClientSeed.trim(), nonceNum);
        const floatVal = await computeFloat(vServerSeed.trim(), vClientSeed.trim(), nonceNum);
        const hash = await hmacSha256Hex(vServerSeed.trim(), `${vClientSeed.trim()}:${nonceNum}`);
        setResult({ type: "crash", mult, floatVal, hash });
      } else {
        const grid = await computeSlotGrid(vServerSeed.trim(), vClientSeed.trim(), nonceNum, game);
        const hash = await hmacSha256Hex(vServerSeed.trim(), `${vClientSeed.trim()}:${nonceNum}`);
        setResult({ type: "slots", grid, hash, gameId: game });
      }
    } catch (e) {
      setError("Computation error: " + e.message);
    } finally {
      setVerifying(false);
    }
  }, [game, vServerSeed, vClientSeed, vNonce]);

  const handleHash = useCallback(async () => {
    if (!rawSeed.trim()) return;
    const h = await sha256Hex(rawSeed.trim());
    setHashResult(h);
  }, [rawSeed]);

  const card = {
    background: "rgba(15,17,26,0.6)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "24px",
    marginBottom: 20,
    backdropFilter: "blur(8px)",
  };

  const sectionTitle = (emoji, text) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>{text}</span>
    </div>
  );

  return (
    <StyledPageContainer>
      <NavigationHeader isNftPage={false} />
      <div className="content-container" style={{ padding: 20, maxWidth: 760, margin: "0 auto" }}>

        {/* Hero */}
        <div style={{
          ...card,
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))",
          border: "1px solid rgba(139,92,246,0.25)",
          textAlign: "center",
          padding: "32px 24px",
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, margin: "0 0 8px",
            background: "linear-gradient(135deg, #a78bfa, #ec4899)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Provably Fair</h1>
          <p style={{ color: "#aaa", fontSize: 14, margin: 0, lineHeight: 1.7 }}>
            Every BetNova game outcome is verifiably fair. Before each game, we commit to a
            <strong style={{ color: "#c4b5fd" }}> server seed hash</strong>. After the round,
            you can reveal the server seed and verify the result independently in your browser —
            no trust required.
          </p>
        </div>

        {/* How it works */}
        <div style={{ ...card }}>
          {sectionTitle("📖", "How It Works")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { n: "1", title: "Commit", desc: "Before your bet, we publish a SHA-256 hash of the server seed. You can't know the seed, but we can't change it.", color: "#a78bfa" },
              { n: "2", title: "Combine", desc: "Your client seed + server seed + nonce are combined via HMAC-SHA256 to produce a unique hash for each bet.", color: "#ec4899" },
              { n: "3", title: "Derive",  desc: "The first 8 hex chars of the HMAC hash convert to a float 0–1, which maps to a game outcome.", color: "#f59e0b" },
              { n: "4", title: "Verify",  desc: "After the round, reveal the server seed and verify the exact outcome yourself using our tool below.", color: "#22c55e" },
            ].map(step => (
              <div key={step.n} style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${step.color}30`,
                borderRadius: 12, padding: "16px",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: `${step.color}25`, border: `1px solid ${step.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: step.color, marginBottom: 10,
                }}>{step.n}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>

          {/* Formula box */}
          <div style={{
            marginTop: 16,
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 10,
            padding: "14px 18px",
          }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Formula</div>
            <code style={{ fontSize: 13, color: "#c4b5fd", lineHeight: 2 }}>
              hash = HMAC-SHA256(serverSeed, clientSeed + ":" + nonce)<br />
              float = parseInt(hash[0..8], 16) / 0xFFFFFFFF<br />
              crash = floor(100 / houseEdge / (1 - float) × 100) / 100
            </code>
          </div>
        </div>

        {/* My seeds */}
        {user?.isAuthenticated && (
          <div style={{ ...card }}>
            {sectionTitle("🔑", "Your Current Seeds")}
            <FieldRow label="Server Seed Hash (SHA-256)" value={serverSeedHash} />
            <FieldRow label="Client Seed" value={clientSeed} />
            <FieldRow label="Current Nonce" value={String(nonce)} />
            <p style={{ fontSize: 12, color: "#676D7C", margin: "12px 0 0" }}>
              The server seed is revealed when you rotate seeds in Settings → Security. Once revealed, paste it below to verify past rounds.
            </p>
          </div>
        )}

        {/* Verify a round */}
        <div style={{ ...card }}>
          {sectionTitle("🔍", "Verify a Round")}

          {/* Game selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Game</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {GAMES.map(g => (
                <button
                  key={g.id}
                  onClick={() => { setGame(g.id); setResult(null); }}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                    background: game === g.id
                      ? "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))"
                      : "rgba(255,255,255,0.04)",
                    color: game === g.id ? "#a78bfa" : "#888",
                    border: game === g.id ? "1px solid rgba(139,92,246,0.5)" : "1px solid transparent",
                  }}
                >{g.label}</button>
              ))}
            </div>
          </div>

          <InputField label="Server Seed (revealed after rotation)" value={vServerSeed} onChange={setVServerSeed} placeholder="e.g. a3f9c2..." />
          <InputField label="Client Seed" value={vClientSeed} onChange={setVClientSeed} placeholder="e.g. b7d41e..." />
          <InputField label="Nonce" value={vNonce} onChange={setVNonce} placeholder="e.g. 42" />

          {error && (
            <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={verifying}
            style={{
              width: "100%", padding: "12px", borderRadius: 10,
              border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
              opacity: verifying ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {verifying ? "Verifying..." : "🔍 Verify Outcome"}
          </button>

          {/* Result */}
          {result && (
            <div style={{
              marginTop: 20,
              background: "rgba(34,197,94,0.07)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 12, padding: 20,
            }}>
              <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>✓ Verification Successful</div>

              <FieldRow label="HMAC-SHA256 Hash" value={result.hash} small />

              {result.type === "crash" && (
                <>
                  <FieldRow label="Float (0–1)" value={result.floatVal?.toFixed(10)} />
                  <div style={{ textAlign: "center", margin: "16px 0" }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4, textTransform: "uppercase" }}>Crash Multiplier</div>
                    <div style={{
                      fontSize: 48, fontWeight: 900,
                      color: result.mult < 2 ? "#f87171" : result.mult < 5 ? "#fbbf24" : "#4ade80",
                      textShadow: result.mult >= 5 ? "0 0 30px rgba(74,222,128,0.6)" : "none",
                    }}>
                      {result.mult.toFixed(2)}×
                    </div>
                  </div>
                </>
              )}

              {result.type === "slots" && (
                <>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8, textTransform: "uppercase" }}>Resulting Grid (3×3)</div>
                  <SlotGrid grid={result.grid} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Hash checker */}
        <div style={{ ...card }}>
          {sectionTitle("🔒", "Verify Server Seed Hash")}
          <p style={{ fontSize: 13, color: "#888", marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
            Check that a server seed matches the hash we committed to before your round.
          </p>
          <InputField label="Server Seed (revealed)" value={rawSeed} onChange={setRawSeed} placeholder="Paste the revealed server seed..." />
          <button
            onClick={handleHash}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13,
              background: "rgba(139,92,246,0.2)", color: "#a78bfa",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
          >Compute SHA-256 →</button>

          {hashResult && (
            <div style={{ marginTop: 16 }}>
              <FieldRow label="SHA-256 Hash" value={hashResult} />
              <p style={{ fontSize: 12, color: "#676D7C", margin: "8px 0 0" }}>
                Compare this with the server seed hash shown in "Your Current Seeds" above — they must match exactly.
              </p>
            </div>
          )}
        </div>

      </div>
    </StyledPageContainer>
  );
}
