import React from "react";
import { Link } from "react-router-dom";
import RegisterModal from "../Modals/RegisterModal";
import { StyledBanner } from "./StyledBanner";
import BetNovaLogo from "../BetNovaLogo/BetNovaLogo";
import { useAuth } from "@/context/AuthContext";

const STATS = [
  { value: "50K+",  label: "Players" },
  { value: "$2M+",  label: "Paid Out" },
  { value: "100x",  label: "Max Win" },
  { value: "7",     label: "Games" },
];

const Banner = () => {
  const { user } = useAuth();

  return (
    <StyledBanner className="@container">
      <div className="main-content w-full @xl:w-auto">
        <BetNovaLogo size="lg" />

        <p className="main-heading" style={{ marginTop: 8 }}>
          Provably fair crypto casino.<br />
          Instant payouts · Up to 100× multipliers.
        </p>

        {!user?.isAuthenticated && (
          <>
            <RegisterModal buttonText="🎮 PLAY NOW — IT'S FREE" modalOption="register" />

            <div style={{
              display: "flex", gap: 8, flexWrap: "wrap",
              marginTop: 12, justifyContent: "center",
            }}>
              <span style={{ fontSize: 11, color: "#676D7C" }}>Already have an account?</span>
              <RegisterModal buttonText="Sign In" modalOption="login" />
            </div>
          </>
        )}

        {user?.isAuthenticated && (
          <Link to="/casino" style={{
            display: "inline-block", marginTop: 8,
            padding: "12px 28px", borderRadius: 10,
            background: "linear-gradient(135deg,#7c3aed,#ec4899)",
            color: "#fff", fontWeight: 800, fontSize: 14,
            textDecoration: "none", letterSpacing: 0.5,
            boxShadow: "0 6px 24px rgba(124,58,237,0.4)",
          }}>🎰 Go to Casino →</Link>
        )}
      </div>

      {/* Right side — stats */}
      <div className="side-text hidden @xl:block">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-end" }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{
                fontSize: 22, fontWeight: 900, color: "#fff",
                background: "linear-gradient(135deg,#f59e0b,#ec4899)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
          <div style={{
            display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", justifyContent: "flex-end",
          }}>
            {["✔ Provably Fair", "🔒 SSL", "⚡ Instant"].map(tag => (
              <span key={tag} style={{
                fontSize: 10, color: "#555",
                padding: "3px 8px", borderRadius: 4,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </StyledBanner>
  );
};

export default Banner;
