import React, { useContext } from "react";
import { Link } from "react-router-dom";

import { ReactComponent as MESSAGE_ICON } from "../../../../assets/images/message.svg";
import BetNovaLogo from "../../../Common/BetNovaLogo/BetNovaLogo";
import ChatBox from "../../ChatBox/ChatBox";

import { AppContext } from "../../../../context/AppContext";
import Button from "../../../Common/Buttons/Button";
import RegisterModal from "../../../Common/Modals/RegisterModal";
import AccountButton from "../AccountButton/AccountButton";
// import CashierModal from "./CashierModal/CashierModal";
import CashierModal from "../../../Modals/CashierModals/CashierModal";
import SearchModal from "../../../Modals/SearchModal/SearchModal";
import RewardsButton from "../RewardsButton/RewardsButton";
import TotalMoneyContainer from "../TotalMoneyContainer";
import { StyledNavBar } from "./styles";
import { useAuth } from "@/context/AuthContext";

const NavBar = () => {
  const {
    isChatBoxOpen,
    isMobileScreen,
    isTabletScreen,
    updateChatBox,
    updateLoggedIn,
  } = useContext(AppContext);

  const { user } = useAuth();
  const balance = `$${parseFloat(user?.balance || 0).toFixed(2)}`;

  return (
    <StyledNavBar>
      <div
        className="h-16 flex justify-between items-center p-3"
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          background: "rgba(7,8,14,0.97)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(139,92,246,0.12)",
          boxShadow: "0 2px 24px rgba(0,0,0,0.6)",
          zIndex: 11,
        }}
      >
        <div
          className={`logo-container ${
            isTabletScreen ? "logo-container-mobile" : ""
          }`}
        >
          <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <BetNovaLogo size={isMobileScreen ? "sm" : "md"} />
          </Link>
          {/* Rewards Button */}
          {user?.profile && (
            <div className="money-container">
              {isTabletScreen && !isMobileScreen ? (
                <TotalMoneyContainer money={balance} />
              ) : null}
              <RewardsButton />
            </div>
          )}
        </div>

        {user?.profile && (
          <>
            {/* Coins / Cashier / Buy Crypto Section */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              {!isTabletScreen && (
                <>
                  <TotalMoneyContainer money={balance} />

                  <CashierModal button={"Cashier"} />

                  <CashierModal button={"Buy Crypto"} />
                </>
              )}
            </div>
          </>
        )}

        <div style={{ display: "flex", alignItems: "center" }}>
          {!user?.profile && (
            <>
              <RegisterModal modalOption="login" />
              <RegisterModal modalOption="register" />
            </>
          )}

          {!isTabletScreen && (
            <div style={{ display: "flex" }}>
              {/* Account Section */}
              {user?.profile && <AccountButton />}

              <SearchModal />
              {isChatBoxOpen === false ? (
                <Button className="mr-5" onClick={() => updateChatBox(true)}>
                  <MESSAGE_ICON />
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <ChatBox isChatBox={isChatBoxOpen} setIsChatBox={updateChatBox} />
    </StyledNavBar>
  );
};

export default NavBar;
