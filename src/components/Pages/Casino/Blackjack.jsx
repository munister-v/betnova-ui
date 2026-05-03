import React from "react";
import LiveWinsSection from "../../Common/WinnerCard/LiveWinsSection";
import NavigationHeader from "../../Common/NavigationHeader/NavigationHeader";
import { StyledPageContainer } from "./styles";
import BlackjackGame from "./BlackjackGame";

const Blackjack = () => (
  <StyledPageContainer>
    <LiveWinsSection title="Live wins" hasFilters={false} />
    <NavigationHeader isNftPage={false} />
    <div className="content-container">
      <BlackjackGame />
    </div>
  </StyledPageContainer>
);

export default Blackjack;
