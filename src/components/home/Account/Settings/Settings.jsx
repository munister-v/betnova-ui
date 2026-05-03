import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { ReactComponent as GEAR } from "../../../../assets/images/Frame (51).svg";
import AccountPageTitle from "../Common/AccountPageTitle";
import { StyleProfile } from "../Profile/styles";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
async function apiPut(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "PUT", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function SectionCard({ title, subtitle, badge, badgeColor = "#555", children }) {
  return (
    <div style={{
      background: "rgba(15,17,26,0.6)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "20px 24px", marginBottom: 16,
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "#676D7C", marginTop: 3 }}>{subtitle}</div>}
        </div>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "4px 10px",
            borderRadius: 6, background: `${badgeColor}22`,
            color: badgeColor, border: `1px solid ${badgeColor}44`,
          }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, readOnly }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{label}</label>}
      <input
        type={type} value={value}
        onChange={onChange} placeholder={placeholder} readOnly={readOnly}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "10px 14px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)",
          background: readOnly ? "rgba(255,255,255,0.03)" : "rgba(15,17,26,0.8)",
          color: readOnly ? "#555" : "#fff",
          fontSize: 13, outline: "none",
          cursor: readOnly ? "not-allowed" : "text",
        }}
      />
    </div>
  );
}

function SaveBtn({ onClick, loading, label = "Save Changes", danger }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      padding: "10px 24px", borderRadius: 8, border: "none",
      cursor: loading ? "not-allowed" : "pointer",
      fontWeight: 700, fontSize: 13,
      background: danger ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
      color: "#fff",
      boxShadow: danger ? "0 4px 16px rgba(239,68,68,0.25)" : "0 4px 16px rgba(124,58,237,0.3)",
      opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
    }}>
      {loading ? "Saving..." : label}
    </button>
  );
}

export default function Settings() {
  const { user, fetchUserProfile } = useAuth();

  const [username,       setUsername]       = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);

  const [email,       setEmail]       = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [currPass,    setCurrPass]    = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass,  setSavingPass]  = useState(false);
  const [showPass,    setShowPass]    = useState(false);

  const [rotatingSeed, setRotatingSeed] = useState(false);

  const handleUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed || trimmed === user?.username) return;
    if (trimmed.length < 3) { toast.error("Min 3 characters"); return; }
    setSavingUsername(true);
    try {
      const d = await apiPut("/api/user/profile", { username: trimmed });
      if (d.success) { toast.success("Username updated!"); fetchUserProfile?.(); }
      else toast.error(d.error || "Failed");
    } catch { toast.error("Network error"); }
    finally { setSavingUsername(false); }
  };

  const handleEmail = async () => {
    if (!email.trim()) return;
    setSavingEmail(true);
    try {
      const d = await apiPost("/api/user/change-email", { email: email.trim() });
      if (d.success) { toast.success("Email updated!"); setEmail(""); fetchUserProfile?.(); }
      else toast.error(d.error || "Failed");
    } catch { toast.error("Network error"); }
    finally { setSavingEmail(false); }
  };

  const handlePassword = async () => {
    if (!currPass || !newPass) { toast.error("Fill all fields"); return; }
    if (newPass.length < 6)   { toast.error("Min 6 characters"); return; }
    if (newPass !== confirmPass) { toast.error("Passwords don't match"); return; }
    setSavingPass(true);
    try {
      const d = await apiPost("/api/user/change-password", { currentPassword: currPass, newPassword: newPass });
      if (d.success) { toast.success("Password changed!"); setCurrPass(""); setNewPass(""); setConfirmPass(""); }
      else toast.error(d.error || "Failed");
    } catch { toast.error("Network error"); }
    finally { setSavingPass(false); }
  };

  const handleRotateSeed = async () => {
    setRotatingSeed(true);
    try {
      const res = await fetch(`${API}/api/user/regenerate-seed`, { method: "POST", credentials: "include" });
      const d = await res.json();
      if (d.success) { toast.success("Seeds rotated! New cycle started."); fetchUserProfile?.(); }
      else toast.error(d.error || "Failed");
    } catch { toast.error("Network error"); }
    finally { setRotatingSeed(false); }
  };

  return (
    <StyleProfile>
      <AccountPageTitle icon={GEAR} title="SETTINGS" />

      {/* Profile */}
      <SectionCard title="Profile" subtitle="Update your public display name">
        <Field label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" />
        <Field label="Account email (read-only)" value={user?.email || ""} readOnly />
        <SaveBtn onClick={handleUsername} loading={savingUsername} label="Update Username" />
      </SectionCard>

      {/* Email */}
      <SectionCard
        title="Email Address"
        subtitle="Change your login email"
        badge={user?.email ? "Linked" : "Not set"}
        badgeColor={user?.email ? "#22c55e" : "#ef4444"}
      >
        <Field label="New Email" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Enter new email address" />
        <SaveBtn onClick={handleEmail} loading={savingEmail} label="Update Email" />
      </SectionCard>

      {/* Password */}
      <SectionCard title="Change Password" subtitle="Use a strong, unique password">
        <Field label="Current Password" value={currPass} onChange={e => setCurrPass(e.target.value)} type={showPass ? "text" : "password"} placeholder="••••••••" />
        <Field label="New Password"     value={newPass}  onChange={e => setNewPass(e.target.value)}  type={showPass ? "text" : "password"} placeholder="Min 6 characters" />
        <Field label="Confirm New Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type={showPass ? "text" : "password"} placeholder="Repeat new password" />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
          <SaveBtn onClick={handlePassword} loading={savingPass} label="Change Password" />
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#888", userSelect: "none" }}>
            <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} style={{ cursor: "pointer" }} />
            Show passwords
          </label>
        </div>
      </SectionCard>

      {/* Provably Fair seeds */}
      <SectionCard title="🔐 Provably Fair Seeds" subtitle="Rotate seeds to start a fresh verification cycle" badge="Active" badgeColor="#22c55e">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Server Seed Hash", value: user?.server_seed_hash },
            { label: "Client Seed",      value: user?.client_seed },
          ].map(f => (
            <div key={f.label} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#888", wordBreak: "break-all" }}>{f.value || "—"}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#555", marginBottom: 14, lineHeight: 1.7 }}>
          ⚠ Rotating seeds reveals your current server seed. Save it first if you want to verify past rounds on the{" "}
          <a href="/fairness" style={{ color: "#a78bfa" }}>Provably Fair page</a>.
        </div>
        <SaveBtn onClick={handleRotateSeed} loading={rotatingSeed} label="🔄 Rotate Seeds" />
      </SectionCard>

      {/* 2FA */}
      <SectionCard title="Two-Factor Authentication" subtitle="Extra security layer for your account" badge="Disabled" badgeColor="#f59e0b">
        <p style={{ fontSize: 13, color: "#676D7C", margin: "0 0 16px", lineHeight: 1.7 }}>
          TOTP two-factor authentication adds a second verification step on login, protecting your account even if your password is compromised.
        </p>
        <button onClick={() => toast("2FA coming soon!", { icon: "🚧" })} style={{
          padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
          background: "rgba(245,158,11,0.08)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)",
        }}>Enable 2FA</button>
      </SectionCard>

      {/* KYC */}
      <SectionCard title="Identity Verification (KYC)" subtitle="Required for withdrawals above $500" badge="Unverified" badgeColor="#ef4444">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { emoji: "📋", text: "Basic KYC",    sub: "Up to $500/day"  },
            { emoji: "🪪", text: "Full KYC",     sub: "Up to $10K/day" },
            { emoji: "🏦", text: "Enhanced KYC", sub: "Unlimited"       },
          ].map(tier => (
            <div key={tier.text} style={{
              flex: "1 1 130px", borderRadius: 10, padding: 14,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{tier.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{tier.text}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{tier.sub}</div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#ef4444", fontWeight: 600 }}>✗ Not verified</div>
            </div>
          ))}
        </div>
        <button onClick={() => toast("KYC verification coming soon!", { icon: "📋" })} style={{
          padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
          background: "rgba(245,158,11,0.07)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)",
        }}>Start Verification →</button>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="⚠️ Danger Zone" subtitle="Irreversible account actions">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => toast.error("Contact support to close your account")} style={{
            padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12,
            background: "rgba(239,68,68,0.07)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)",
          }}>Close Account</button>
          <button onClick={() => toast("Self-exclusion coming soon", { icon: "🚫" })} style={{
            padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12,
            background: "rgba(245,158,11,0.07)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)",
          }}>Self-Exclusion</button>
        </div>
      </SectionCard>
    </StyleProfile>
  );
}
