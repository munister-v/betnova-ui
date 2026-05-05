import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ReactComponent as FLOW } from "../../../../assets/images/Frame (49).svg";
import AccountPageTitle from "../Common/AccountPageTitle";
import AccountTabs from "../Common/AccountTabs/AccountTabs";
import { StyleProfile } from "../Profile/styles";
import ReferralBanner from "./ReferralBanner";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const tabs = [
  { url: "/account/referrals/codes", label: "Referral Codes" },
  { url: "/account/referrals/users", label: "Referred Users" },
];

const Referrals = () => {
  const { tab } = useParams();

  const [codes, setCodes] = useState([]);
  const [referredUsers, setReferredUsers] = useState([]);
  const [stats, setStats] = useState({ total_referrals: 0, total_earned: 0 });
  const [loading, setLoading] = useState(true);

  const [newCode, setNewCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState(null);
  const [pending, setPending] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/referrals/my`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setCodes(json.codes || []);
        setStats({ total_referrals: json.total_referrals, total_earned: json.total_earned });
      }
    } catch (_) {}

    try {
      const res2 = await fetch(`${BACKEND}/api/referrals/users`, { credentials: "include" });
      const json2 = await res2.json();
      if (json2.success) setReferredUsers(json2.users || []);
    } catch (_) {}

    try {
      const res3 = await fetch(`${BACKEND}/api/referrals/pending`, { credentials: "include" });
      const json3 = await res3.json();
      if (json3.success) setPending(json3.pending || 0);
    } catch (_) {}

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setCreating(true);
    setFormMsg(null);
    try {
      const res = await fetch(`${BACKEND}/api/referrals/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setFormMsg({ error: false, text: "Code created!" });
        setNewCode("");
        setCodes((prev) => [json.code, ...prev]);
      } else {
        setFormMsg({ error: true, text: json.error || "Failed to create code." });
      }
    } catch (_) {
      setFormMsg({ error: true, text: "Network error." });
    }
    setCreating(false);
  };

  const handleClaim = async () => {
    if (pending <= 0 || claiming) return;
    setClaiming(true);
    setClaimMsg(null);
    try {
      const res = await fetch(`${BACKEND}/api/referrals/claim`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        setClaimMsg({ error: false, text: `Claimed $${json.claimed.toFixed(2)}!` });
        setPending(0);
        setStats((s) => ({ ...s, total_earned: s.total_earned }));
      } else {
        setClaimMsg({ error: true, text: json.error || "Claim failed." });
      }
    } catch (_) {
      setClaimMsg({ error: true, text: "Network error." });
    }
    setClaiming(false);
  };

  const renderTabContent = () => {
    if (tab === "codes" || !tab) {
      if (loading) return <div style={{ padding: "24px 0", color: "#676D7C" }}>Loading…</div>;
      if (codes.length === 0) {
        return (
          <div style={{ margin: "0 auto", padding: "24px 0" }}>
            <div style={{ display: "inline-flex", padding: "23px 32px", borderRadius: "8px", background: "rgba(15,17,26,0.55)" }}>
              <p style={{ color: "#676D7C", fontSize: "18px", textTransform: "uppercase" }}>No Referral Codes Found</p>
            </div>
          </div>
        );
      }
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
          {codes.map((c) => (
            <div key={c.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 20px", borderRadius: "8px", background: "rgba(15,17,26,0.55)",
              color: "#fff", fontSize: "14px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontWeight: 700, color: "#FFB018", letterSpacing: "1px" }}>{c.code}</span>
                <span style={{ color: "#aaa", fontSize: "12px" }}>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "#aaa" }}>
                <span>Uses: <strong style={{ color: "#fff" }}>{c.uses}</strong></span>
                <span>Earned: <strong style={{ color: "#4ade80" }}>${parseFloat(c.earned).toFixed(2)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (tab === "users") {
      if (loading) return <div style={{ padding: "24px 0", color: "#676D7C" }}>Loading…</div>;
      if (referredUsers.length === 0) {
        return (
          <div style={{ margin: "0 auto", padding: "24px 0" }}>
            <div style={{ display: "inline-flex", padding: "23px 32px", borderRadius: "8px", background: "rgba(15,17,26,0.55)" }}>
              <p style={{ color: "#676D7C", fontSize: "18px", textTransform: "uppercase" }}>No Referred Users</p>
            </div>
          </div>
        );
      }
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
          {referredUsers.map((u) => (
            <div key={u.referred_id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 20px", borderRadius: "8px", background: "rgba(15,17,26,0.55)",
              color: "#fff", fontSize: "14px",
            }}>
              <span>{u.users?.username || u.referred_id?.slice(0, 8)}</span>
              <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "#aaa" }}>
                <span>Commission: <strong style={{ color: "#4ade80" }}>${parseFloat(u.commission).toFixed(2)}</strong></span>
                <span style={{ color: "#aaa", fontSize: "12px" }}>{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <StyleProfile>
      <AccountPageTitle icon={FLOW} title="Referrals" />
      <ReferralBanner />

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", margin: "16px 0" }}>
        <div style={{ flex: 1, padding: "16px 20px", borderRadius: "8px", background: "rgba(15,17,26,0.55)", color: "#fff" }}>
          <div style={{ color: "#aaa", fontSize: "12px", marginBottom: "4px" }}>Total Referred</div>
          <div style={{ fontSize: "22px", fontWeight: 700 }}>{stats.total_referrals}</div>
        </div>
        <div style={{ flex: 1, padding: "16px 20px", borderRadius: "8px", background: "rgba(15,17,26,0.55)", color: "#fff" }}>
          <div style={{ color: "#aaa", fontSize: "12px", marginBottom: "4px" }}>Total Earned</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#4ade80" }}>${parseFloat(stats.total_earned).toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, padding: "16px 20px", borderRadius: "8px", background: "rgba(15,17,26,0.55)", color: "#fff" }}>
          <div style={{ color: "#aaa", fontSize: "12px", marginBottom: "4px" }}>Pending Claim</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#FFB018" }}>${pending.toFixed(2)}</div>
          <button
            onClick={handleClaim}
            disabled={pending <= 0 || claiming}
            style={{
              marginTop: "8px", padding: "6px 14px", borderRadius: "6px", border: "none",
              background: pending > 0 ? "#FFB018" : "#444", color: pending > 0 ? "#000" : "#888",
              fontWeight: 700, fontSize: "13px", cursor: pending > 0 ? "pointer" : "not-allowed",
            }}
          >
            {claiming ? "Claiming…" : "Claim"}
          </button>
          {claimMsg && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: claimMsg.error ? "#f87171" : "#4ade80" }}>
              {claimMsg.text}
            </div>
          )}
        </div>
      </div>

      <AccountTabs tabs={tabs} />

      {renderTabContent()}

      {/* Create code form */}
      <div className="section-container">
        <form onSubmit={handleCreate}>
          <div>
            <div className="input-container">
              <input
                type="text"
                name="name"
                placeholder="Create new referral code"
                id="rollbit-field-62399"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                maxLength={20}
              />
              <button
                className="change-button"
                disabled={!newCode.trim() || creating}
                type="submit"
                style={{ marginRight: "4px" }}
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
          {formMsg && (
            <div style={{ marginTop: "8px", fontSize: "13px", color: formMsg.error ? "#f87171" : "#4ade80" }}>
              {formMsg.text}
            </div>
          )}
        </form>
      </div>

      {/* Divider */}
      <div className="section-divider">
        <p style={{ width: "100%", color: "#B1B6C6", fontSize: "14px", lineHeight: "16.8px" }}>
          If you're a content creator, make sure to check out our{" "}
          <span style={{ color: "#FFB018" }}>Partnership Program</span>.
        </p>
      </div>
    </StyleProfile>
  );
};

export default Referrals;
