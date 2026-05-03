import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { StyledCouponsContent } from "./styles";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const CouponsReferralsContent = ({ option }) => {
  const { user, updateBalance } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const isCoupons = option === "Coupons";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Please enter a code");
    if (!user?.isAuthenticated) return toast.error("Please log in first");

    setLoading(true);

    try {
      if (isCoupons) {
        const res = await fetch(`${BACKEND}/api/promo/redeem`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`🎉 ${data.message}`);
          if (typeof updateBalance === "function") updateBalance(data.newBalance);
          setCode("");
        } else {
          toast.error(data.error || "Failed to redeem code");
        }
      } else {
        // Referral
        const res = await fetch(`${BACKEND}/api/referrals/apply`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("✅ Referral code applied!");
          setCode("");
        } else {
          toast.error(data.error || "Invalid referral code");
        }
      }
    } catch (err) {
      toast.error("Network error");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <StyledCouponsContent>
        <div style={{
          width: "120px",
          height: "120px",
          margin: "24px auto 32px",
          borderRadius: "50%",
          background: isCoupons ? "rgba(245,158,11,0.15)" : "rgba(124,58,237,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "60px",
        }}>
          {isCoupons ? "🎟️" : "🤝"}
        </div>

        <h1 className="title">
          {isCoupons ? "Redeem Promo Code" : "Apply Referral Code"}
        </h1>

        <div className="input-container">
          <input
            type="text"
            name="code"
            placeholder={isCoupons ? "Enter promo code..." : "Enter referral code..."}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            style={{ textTransform: "uppercase" }}
          />
        </div>

        <div className="info-text" style={{ textAlign: "center", marginTop: "12px" }}>
          {isCoupons
            ? <>Try <strong style={{ color: "#f59e0b" }}>WELCOME5</strong>, <strong style={{ color: "#f59e0b" }}>BETNOVA10</strong>, or <strong style={{ color: "#f59e0b" }}>LUCKY1</strong></>
            : <>Don't have a code? Ask a friend!</>
          }
        </div>

        <button
          className="claim-button"
          type="submit"
          disabled={loading || !code.trim()}
          style={{
            width: "180px",
            marginTop: "32px",
            opacity: loading || !code.trim() ? 0.6 : 1,
            cursor: loading || !code.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "..." : (isCoupons ? "Claim" : "Apply")}
        </button>
      </StyledCouponsContent>
    </form>
  );
};

export default CouponsReferralsContent;
