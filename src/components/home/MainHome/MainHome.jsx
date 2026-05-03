import React from "react";
import Banner from "../../Common/Banner/Banner";
import StepsSection from "../../Common/StepSection/StepsSection";
import LiveWinsSection from "../../Common/WinnerCard/LiveWinsSection";
import GameTiles from "../../Common/GameTiles/GameTiles";
import DailyBonus from "../../Common/DailyBonus/DailyBonus";

const steps = [
  { number: "01", text: "Create Account" },
  { number: "02", text: "Deposit Crypto & Play" },
  { number: "03", text: "Win & Withdraw Instantly" },
];

const MainHome = () => (
  <div className="@container" style={{ padding: "0 16px" }}>
    <Banner />
    <StepsSection hasMarginBottom={true} steps={steps} className="@xl:block hidden" />
    <div style={{ marginBottom: 24 }}>
      <DailyBonus />
    </div>
    <LiveWinsSection title="Live wins" hasFilters={true} />
    <GameTiles title="Play Now" />
  </div>
);

export default MainHome;
