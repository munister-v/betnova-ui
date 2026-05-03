import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import BetNovaLogo from "../../Common/BetNovaLogo/BetNovaLogo";

const FooterWrapper = styled.footer`
  background: #04050c;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
  padding-inline: 20px;

  .footer-container {
    display: flex;
    justify-content: space-between;
    padding: 48px 24px 32px;
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
    gap: 32px;

    @media (max-width: 800px) {
      flex-wrap: wrap;
      gap: 24px;
    }
  }

  .footer-brand {
    flex: 0 0 220px;
    @media (max-width: 800px) {
      flex: 0 0 100%;
      order: 100;
    }
  }

  .footer-column {
    display: flex;
    flex-direction: column;
    min-width: 130px;

    @media (max-width: 600px) {
      width: 45%;
    }
  }

  .footer-bottom {
    max-width: 1100px;
    margin: 0 auto;
    padding: 16px 24px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    border-top: 1px solid rgba(255,255,255,0.04);
  }
`;

const ColTitle = styled.div`
  color: #fff;
  font-weight: 800;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;

  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.07);
  }
`;

const FooterLink = styled.a`
  margin-bottom: 9px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: #676d7c;
  text-decoration: none;
  transition: color 0.15s;

  &:hover {
    color: #a78bfa;
  }
`;

const SocialBtn = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  color: #676d7c;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 7px;

  &:hover {
    background: rgba(139,92,246,0.1);
    border-color: rgba(139,92,246,0.3);
    color: #c4b5fd;
  }

  .social-icon {
    font-size: 16px;
    flex-shrink: 0;
  }
`;

const PLATFORM_LINKS = [
  { label: "Support",             href: "/support" },
  { label: "FAQ",                 href: "/faq" },
  { label: "Partnership Program", href: "/partnership" },
  { label: "Blog",                href: "/blog" },
  { label: "Help Center",         href: "/help" },
];

const ABOUT_LINKS = [
  { label: "AML Policy",          href: "/aml-policy" },
  { label: "Sports Policy",       href: "/sports-policy" },
  { label: "Responsible Gaming",  href: "/responsible-gaming" },
  { label: "Privacy Policy",      href: "/privacy-policy" },
  { label: "Terms & Conditions",  href: "/terms" },
];

const SOCIAL = [
  { label: "Facebook",  icon: "📘", href: "https://facebook.com",  color: "#1877f2" },
  { label: "Twitter",   icon: "🐦", href: "https://twitter.com",   color: "#1da1f2" },
  { label: "Instagram", icon: "📸", href: "https://instagram.com", color: "#e1306c" },
  { label: "Discord",   icon: "🎮", href: "https://discord.gg",    color: "#5865f2" },
];

const PageFooter = () => (
  <FooterWrapper>
    <div className="footer-container">

      {/* Brand column */}
      <div className="footer-brand">
        <div style={{ marginBottom: 16 }}>
          <BetNovaLogo size="md" />
        </div>
        <p style={{ color: "#3d4150", fontSize: 11, lineHeight: 1.7, marginBottom: 10 }}>
          BetNova is a provably fair crypto casino. Play responsibly. Must be 18+ to participate.
        </p>
        <p style={{ color: "#2d3040", fontSize: 10, lineHeight: 1.7 }}>
          © {new Date().getFullYear()} BetNova. All rights reserved.<br />
          BetNova Ltd. · Registered in Curaçao<br />
          Licensed under Gaming License #1234/JAZ
        </p>
        {/* Age / responsible */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {["18+", "🔒 SSL", "✔ Provably Fair"].map(tag => (
            <span key={tag} style={{
              fontSize: 10, fontWeight: 700,
              padding: "3px 8px", borderRadius: 4,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#444",
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Platform */}
      <div className="footer-column">
        <ColTitle>Platform</ColTitle>
        {PLATFORM_LINKS.map(l => (
          <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>
        ))}
      </div>

      {/* About Us */}
      <div className="footer-column">
        <ColTitle>About Us</ColTitle>
        {ABOUT_LINKS.map(l => (
          <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>
        ))}
      </div>

      {/* Community */}
      <div className="footer-column">
        <ColTitle>Community</ColTitle>
        {SOCIAL.map(s => (
          <SocialBtn key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
            <span className="social-icon">{s.icon}</span>
            {s.label}
          </SocialBtn>
        ))}
      </div>

    </div>

    {/* Bottom bar */}
    <div className="footer-bottom">
      <span style={{ color: "#2a2d3a", fontSize: 11 }}>
        © {new Date().getFullYear()} BetNova — All Rights Reserved
      </span>
      <div style={{ display: "flex", gap: 16 }}>
        {["Privacy Policy", "Terms & Conditions", "Responsible Gaming"].map(l => (
          <FooterLink key={l} href="#" style={{ marginBottom: 0, fontSize: 11 }}>{l}</FooterLink>
        ))}
      </div>
    </div>
  </FooterWrapper>
);

export default PageFooter;
